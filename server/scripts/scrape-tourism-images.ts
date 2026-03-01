import { chromium, Page } from 'playwright';
import { db } from '../db';
import { inArray, eq } from 'drizzle-orm';
import { landmarks } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

const MAX_IMAGES_PER_LANDMARK = 5;

// Mapping of city to official tourism websites to prioritize
const TOURISM_SITES = {
    'seoul': 'visitseoul.net',
    'busan': 'visitbusan.net',
    'jeju': 'visitjeju.net',
    'tokyo': 'gotokyo.org',
    'london': 'visitlondon.com',
    'paris': 'parisinfo.com',
    'rome': 'turismoroma.it',
    'singapore': 'visitsingapore.com',
    'new-york': 'nyctourism.com',
    'barcelona': 'barcelonaturisme.com'
};

async function scrapeImages(page: Page, url: string) {
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);

        // Extract og:image
        const ogImage = await page.evaluate(() => {
            const meta = document.querySelector('meta[property="og:image"]');
            return meta ? meta.getAttribute('content') : null;
        });

        // Extract large images
        const images = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
                .filter(img => {
                    const w = img.naturalWidth || img.width || 0;
                    const h = img.naturalHeight || img.height || 0;
                    return w >= 300 && h >= 200 && img.src && !img.src.includes('logo') && !img.src.includes('icon') && !img.src.includes('avatar');
                })
                .map(img => img.src);
        });

        const uniqueImages = Array.from(new Set([ogImage, ...images].filter(Boolean)));
        const finalImages = uniqueImages.map((imgUrl: string) => {
            try {
                return new URL(imgUrl, url).href;
            } catch (e) {
                return imgUrl;
            }
        });

        return finalImages.slice(0, MAX_IMAGES_PER_LANDMARK);
    } catch (e: any) {
        console.log(`  [WARN] Failed to scrape images from ${url}: ${e.message}`);
        return [];
    }
}

async function findTourismWebsite(page: Page, cityId: string, query: string) {
    const tourismDomain = TOURISM_SITES[cityId as keyof typeof TOURISM_SITES] || '';
    const searchStr = tourismDomain ? `site:${tourismDomain} ${query}` : `${query} official tourism board`;

    try {
        await page.goto(`https://duckduckgo.com/html/?q=${encodeURIComponent(searchStr)}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const firstLink = await page.evaluate(() => {
            const a = document.querySelector('.result__url');
            return a ? a.getAttribute('href') : null;
        });

        if (firstLink) {
            if (firstLink.startsWith('//')) return 'https:' + firstLink;
            if (firstLink.startsWith('/l/?uddg=')) {
                const urlParams = new URLSearchParams(firstLink.split('?')[1]);
                return urlParams.get('uddg');
            }
            return firstLink.trim();
        }
    } catch (e: any) {
        console.log(`  [WARN] Search failed for ${query}: ${e.message}`);
    }
    return null;
}

async function run() {
    console.log('Starting Tourism Board image scraper for Restaurants and Shops (Max 5 images)...\n');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
    });

    const targetLandmarks = await db.query.landmarks.findMany({
        where: inArray(landmarks.category, ['Restaurant', 'Shopping', 'Gift Shop'])
    });

    console.log(`Found ${targetLandmarks.length} target landmarks.`);
    let successCount = 0;

    const report = [];
    report.push('# 레스토랑 & 쇼핑 공식 관광청 이미지 스크래핑 보고서\n');
    report.push('| 랜드마크 | 카테고리 | 관광청 검색 URL | 찾은 이미지 개수 | 상태 |');
    report.push('|---|---|---|---|---|');

    for (let i = 0; i < targetLandmarks.length; i++) {
        const lm = targetLandmarks[i];
        // Skip if already has images that aren't placeholders
        if (lm.photos && lm.photos.length > 0 && !lm.photos[0].includes('placeholder')) {
            console.log(`[${i + 1}/${targetLandmarks.length}] ${lm.name} already has real photos. Skipping.`);
            continue;
        }

        console.log(`[${i + 1}/${targetLandmarks.length}] Processing ${lm.name}...`);

        const page = await context.newPage();
        console.log(`  Searching Tourism Boards for: "${lm.name}" in ${lm.cityId}`);
        const url = await findTourismWebsite(page, lm.cityId, lm.name);

        let images: string[] = [];
        if (url) {
            console.log(`  Found URL via search: ${url}`);
            images = await scrapeImages(page, url);
            console.log(`  Extracted ${images.length} images.`);
        }

        if (images.length > 0) {
            await db.update(landmarks)
                .set({
                    photos: images,
                    updatedAt: new Date()
                })
                .where(eq(landmarks.id, lm.id));
            successCount++;
            report.push(`| ${lm.name} | ${lm.category} | ${url} | ${images.length} | ✅ 성공 |`);
            console.log(`  ✅ Updated DB.`);
        } else {
            report.push(`| ${lm.name} | ${lm.category} | ${url || 'N/A'} | 0 | ❌ 실패 |`);
            console.log(`  ❌ No images found.`);
        }

        await page.close();
    }

    await browser.close();

    const reportPath = path.join(process.cwd(), 'tourism_image_report.md');
    fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');
    console.log(`\nFinished! Successfully updated ${successCount}/${targetLandmarks.length} landmarks.`);
    console.log(`Report saved to ${reportPath}`);

    const syncModule = await import('./sync-neon-to-hardcode.js').catch(() => null);

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
