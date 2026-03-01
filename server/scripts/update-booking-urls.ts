import { db } from '../db';
import { inArray, eq } from 'drizzle-orm';
import { landmarks } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

// 예약 플랫폼 기준:
// 서울/부산/제주 -> 캐치테이블 영문 글로벌 (catchtable.net/shop)
// 도쿄 -> TableCheck (tablecheck.com/shops)
// 런던/뉴욕 -> OpenTable (opentable.com)
// 파리/로마/바르셀로나 -> TheFork (thefork.com)
// 싱가포르 -> Chope (chope.co)

function generateBookingUrl(cityId: string, name: string): string {
    const query = encodeURIComponent(name);

    switch (cityId) {
        case 'seoul':
        case 'busan':
        case 'jeju':
            return `https://app.catchtable.net/search/result?keyword=${query}`;

        case 'tokyo':
            return `https://www.tablecheck.com/en/shops/search?utf8=%E2%9C%93&q=${query}`;

        case 'new-york':
            return `https://www.opentable.com/s?dateTime=2024-06-01T19%3A00%3A00&covers=2&metroId=8&term=${query}`;

        case 'london':
            return `https://www.opentable.co.uk/s?dateTime=2024-06-01T19%3A00%3A00&covers=2&metroId=72&term=${query}`;

        case 'paris':
            return `https://www.thefork.com/search?cityId=415144&restaurantName=${query}`;

        case 'rome':
            return `https://www.thefork.com/search?cityId=328021&restaurantName=${query}`;

        case 'barcelona':
            return `https://www.thefork.com/search?cityId=328011&restaurantName=${query}`;

        case 'singapore':
            return `https://www.chope.co/singapore-restaurants/search?q=${query}`;

        default:
            // Fallback
            return `https://www.google.com/search?q=${query}+reservations`;
    }
}

async function run() {
    console.log('Starting reservationUrl update to global booking platforms...\n');

    const targetLandmarks = await db.query.landmarks.findMany({
        where: inArray(landmarks.category, ['Restaurant'])
    });

    console.log(`Found ${targetLandmarks.length} Restaurant landmarks.`);
    let successCount = 0;

    const report: string[] = [];
    report.push('# 레스토랑 예약 URL 플랫폼 전환 결과\n');
    report.push('| 랜드마크 | 도시 | 전환 전 (기존 URL) | 전환 후 (플랫폼 URL) |');
    report.push('|---|---|---|---|');

    for (let i = 0; i < targetLandmarks.length; i++) {
        const lm = targetLandmarks[i];
        const oldUrl = lm.reservationUrl || 'N/A';

        // We want to apply the platform search URL to all to unify the UX, 
        // replacing the directly scraped ones from yesterday.
        const newUrl = generateBookingUrl(lm.cityId, lm.name);

        await db.update(landmarks)
            .set({
                reservationUrl: newUrl,
                updatedAt: new Date()
            })
            .where(eq(landmarks.id, lm.id));

        successCount++;
        report.push(`| ${lm.name} | ${lm.cityId} | ${oldUrl} | ${newUrl} |`);
    }

    const reportPath = path.join(process.cwd(), 'docs', 'reservation_url_update_report.md');
    fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');
    console.log(`\nFinished! Successfully updated ${successCount}/${targetLandmarks.length} restaurants to booking platforms.`);
    console.log(`Report saved to ${reportPath}`);

    // Important: Now run the sync-neon-to-hardcode script to update offline data!
    console.log('Syncing neon db to hardcode db...');
    await import('./sync-neon-to-hardcode.js').catch(() => null);

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
