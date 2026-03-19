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

function generateBookingUrl(cityId: string, name: string, category: string): string {
    const query = encodeURIComponent(name);

    if (category === 'Restaurant') {
        switch (cityId) {
            case 'seoul':
            case 'busan':
            case 'jeju':
                return `https://app.catchtable.net/search/result?keyword=${query}`;
            case 'tokyo':
                return `https://www.tablecheck.com/en/shops/search?utf8=%E2%9C%93&q=${query}`;
            case 'new-york':
                return `https://www.opentable.com/s?term=${query}`;
            case 'london':
                return `https://www.opentable.co.uk/s?term=${query}`;
            case 'paris':
            case 'rome':
            case 'barcelona':
                return `https://www.thefork.com/search?restaurantName=${query}`;
            default:
                return `https://www.google.com/search?q=${query}+reservations`;
        }
    } else {
        // [어벤져스 팀] 랜드마크용 제휴 플랫폼 (GetYourGuide, Klook, Trip.com)
        // 한국 지역은 Klook/Trip.com이 강세, 유럽/미국은 GetYourGuide가 강세
        if (['seoul', 'busan', 'jeju', 'tokyo', 'singapore'].includes(cityId)) {
            return `https://www.klook.com/en-US/search?query=${query}`;
        } else {
            return `https://www.getyourguide.com/s?q=${query}`;
        }
    }
}

async function run() {
    console.log('Starting reservationUrl update to global booking platforms...\n');

    const targetLandmarks = await db.query.landmarks.findMany({
        where: inArray(landmarks.category, ['Restaurant', 'Landmark', 'Activity'])
    });

    console.log(`Found ${targetLandmarks.length} target landmarks (Restaurant, Landmark, Activity).`);
    let successCount = 0;

    const report: string[] = [];
    report.push('# 랜드마크 및 레스토랑 예약 URL 플랫폼 전환 결과\n');
    report.push('| 랜드마크 | 도시 | 카테고리 | 전환 후 (플랫폼 URL) |');
    report.push('|---|---|---|---|');

    for (let i = 0; i < targetLandmarks.length; i++) {
        const lm = targetLandmarks[i];
        const oldUrl = lm.reservationUrl || 'N/A';

        // [어벤져스 팀 | 2026-03-20] 플랫폼 검색 URL 생성 (UX 통일 및 제휴 수익화)
        const newUrl = generateBookingUrl(lm.cityId, lm.name, lm.category || 'Landmark');

        await db.update(landmarks)
            .set({
                reservationUrl: newUrl,
                updatedAt: new Date()
            })
            .where(eq(landmarks.id, lm.id));

        successCount++;
        report.push(`| ${lm.name} | ${lm.cityId} | ${lm.category} | [Link](${newUrl}) |`);
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
