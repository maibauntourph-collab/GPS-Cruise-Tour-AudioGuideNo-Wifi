import { db } from '../db';
import { inArray, eq } from 'drizzle-orm';
import { landmarks } from '../../shared/schema';
import fs from 'fs';
import path from 'path';

// 글로벌 관광지/액티비티 (투어 상품 등) 티켓 예약 플랫폼 연결
// 아시아 (한국, 일본, 싱가포르) -> Klook (클룩)
// 유럽 (파리, 로마, 런던, 바르셀로나) -> GetYourGuide (겟유어가이드)
// 미주 (뉴욕) -> TripAdvisor / Viator (바이아터)

function generateTicketUrl(cityId: string, name: string): string {
    const query = encodeURIComponent(name);

    switch (cityId) {
        case 'seoul':
        case 'busan':
        case 'jeju':
        case 'tokyo':
        case 'singapore':
            // Klook search
            return `https://www.klook.com/en-US/search/result/?query=${query}`;

        case 'london':
        case 'paris':
        case 'rome':
        case 'barcelona':
            // GetYourGuide search
            return `https://www.getyourguide.com/s?q=${query}`;

        case 'new-york':
            // Viator (Tripadvisor subsidiary)
            return `https://www.viator.com/searchResults/all?text=${query}`;

        default:
            // Fallback
            return `https://www.tripadvisor.com/Search?q=${query}`;
    }
}

async function run() {
    console.log('Starting reservationUrl update for Landmarks & Activities to global booking platforms...\n');

    const targetLandmarks = await db.query.landmarks.findMany({
        where: inArray(landmarks.category, ['Landmark', 'Activity'])
    });

    console.log(`Found ${targetLandmarks.length} Landmark/Activity items.`);
    let successCount = 0;

    const report: string[] = [];
    report.push('# 랜드마크 & 액티비티 예약 플랫폼 전환 결과\n');
    report.push('| 이름 | 도시 | 카테고리 | 전환 플랫폼 URL |');
    report.push('|---|---|---|---|');

    for (let i = 0; i < targetLandmarks.length; i++) {
        const lm = targetLandmarks[i];
        const newUrl = generateTicketUrl(lm.cityId, lm.name);

        await db.update(landmarks)
            .set({
                reservationUrl: newUrl,
                updatedAt: new Date()
            })
            .where(eq(landmarks.id, lm.id));

        successCount++;
        report.push(`| ${lm.name} | ${lm.cityId} | ${lm.category} | ${newUrl} |`);
    }

    const reportPath = path.join(process.cwd(), 'docs', 'ticket_url_update_report.md');
    fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');
    console.log(`\nFinished! Successfully updated ${successCount}/${targetLandmarks.length} places to ticket platforms.`);
    console.log(`Report saved to ${reportPath}`);

    console.log('Syncing neon db to hardcode db...');
    await import('./sync-neon-to-hardcode.js').catch(() => null);

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
