import { chromium, Page } from 'playwright';
import { db } from '../db';
import { inArray, eq } from 'drizzle-orm';
import { landmarks } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

const MAX_IMAGES_PER_LANDMARK = 5;

// Helper to determine platform context for smart waiting/scraping
function getPlatform(url: string) {
    if (url.includes('catchtable')) return 'catchtable';
    if (url.includes('tablecheck')) return 'tablecheck';
    if (url.includes('opentable')) return 'opentable';
    if (url.includes('thefork')) return 'thefork';
    if (url.includes('chope')) return 'chope';
    return 'unknown';
}

async function searchAndScrapePlatform(page: Page, url: string, platform: string, name: string) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        // Global wait for dynamic content
        await page.waitForTimeout(4000);

        // We do a very generous generic image grab since we're currently on the search result page 
        // for that specific restaurant on the booking platform.
        const images = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
                .filter(img => {
                    const w = img.naturalWidth || img.width || 0;
                    const h = img.naturalHeight || img.height || 0;
                    // Look for reasonably large images (avoids tiny icons, stars, avatars)
                    return w >= 250 && h >= 150 && img.src &&
                        !img.src.includes('logo') &&
                        !img.src.includes('avatar') &&
                        !img.src.includes('icon') &&
                        !img.src.includes('svg');
                })
                .map(img => img.src);
        });

        const uniqueImages = Array.from(new Set(images.filter(Boolean)));
        const finalImages = uniqueImages.map((imgUrl: string) => {
            try {
                return new URL(imgUrl, url).href;
            } catch (e) {
                return imgUrl;
            }
        });

        return finalImages.slice(0, MAX_IMAGES_PER_LANDMARK);
    } catch (e: any) {
        console.log(`  [WARN] Failed to scrape platform ${platform} for ${name}: ${e.message}`);
        return [];
    }
}

async function run() {
    console.log('Starting Booking Platform image scraper for Restaurants...\n');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });

    const targetLandmarks = await db.query.landmarks.findMany({
        where: inArray(landmarks.category, ['Restaurant'])
    });

    console.log(`Found ${targetLandmarks.length} Restaurant target landmarks.`);
    let successCount = 0;

    const report = [];
    report.push('# 레스토랑 예약 플랫폼 이미지 스크래핑 보고서\n');
    report.push('| 랜드마크 | 플랫폼 | 찾은 이미지 개수 | 상태 |');
    report.push('|---|---|---|---|');

    for (let i = 0; i < targetLandmarks.length; i++) {
        const lm = targetLandmarks[i];

        // Skip if it already has good photos from previous steps 
        // Make sure we only overwrite if it is a placeholder or has 0 photos.
        // However, the user asked to get ALL restaurants from booking platforms, 
        // so let's try to overwrite them if we find better ones, or if they only have 1 image.
        if (lm.photos && lm.photos.length >= MAX_IMAGES_PER_LANDMARK && !lm.photos[0].includes('placeholder')) {
            console.log(`[${i + 1}/${targetLandmarks.length}] ${lm.name} already has ${lm.photos.length} photos. Skipping.`);
            continue;
        }

        console.log(`[${i + 1}/${targetLandmarks.length}] Processing ${lm.name}...`);

        const page = await context.newPage();
        const url = lm.reservationUrl;
        let images: string[] = [];

        if (url) {
            const platform = getPlatform(url);
            console.log(`  Target Platform: ${platform}`);
            images = await searchAndScrapePlatform(page, url, platform, lm.name);
            console.log(`  Extracted ${images.length} images.`);
        }

        // Only update DB if we actually found images
        if (images.length > 0) {
            await db.update(landmarks)
                .set({
                    photos: images,
                    updatedAt: new Date()
                })
                .where(eq(landmarks.id, lm.id));
            successCount++;
            report.push(`| ${lm.name} | ${getPlatform(url || '')} | ${images.length} | ✅ 성공 |`);
            console.log(`  ✅ Updated DB.`);
        } else {
            report.push(`| ${lm.name} | ${getPlatform(url || '')} | 0 | ❌ 실패 |`);
            console.log(`  ❌ No images found.`);
        }

        await page.close();
    }

    await browser.close();

    const reportPath = path.join(process.cwd(), 'docs', 'booking_platform_image_report.md');
    fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');
    console.log(`\nFinished! Successfully updated ${successCount}/${targetLandmarks.length} restaurants via booking platform scraping.`);
    console.log(`Report saved to ${reportPath}`);

    console.log('Syncing neon db to hardcode db...');
    await import('./sync-neon-to-hardcode.js').catch(() => null);

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
