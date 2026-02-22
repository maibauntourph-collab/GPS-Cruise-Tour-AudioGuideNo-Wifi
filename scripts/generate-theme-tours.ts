import "dotenv/config";
import { db } from "../server/db";
import { landmarks, cities, savedRoutes } from "../shared/schema";
import { sql, eq, gt } from "drizzle-orm";
import { randomUUID } from 'crypto';

/**
 * 🤖 [Automation Doctor] 테마별 AI 가이드 투어 코스 생성 엔진
 * 교수님! 오늘 새벽에 추가된 따끈따끈한 명소들을 엮어 
 * 여행자들에게 '역사', '미식', '휴양' 세 가지 맛의 테마 코스를 추천합니다.
 */

async function generateThemeTours() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 0시 기준

    console.log(`🚀 [Automation Doctor] ${today.toISOString().split('T')[0]} 신규 데이터 기반 테마 코스 생성 시작...`);

    try {
        // 1. 오늘 추가된 모든 명소 가져오기
        const newLandmarks = await db.select()
            .from(landmarks)
            .where(gt(landmarks.createdAt, today));

        if (newLandmarks.length === 0) {
            console.log("ℹ️ 오늘 추가된 새로운 명소가 없어 작업을 종료합니다.");
            return;
        }

        console.log(`✅ 오늘 총 ${newLandmarks.length}개의 명소가 새로 추가되었습니다.`);

        // 2. 도시별로 그룹화
        const cityGroups = newLandmarks.reduce((acc, landmark) => {
            if (!acc[landmark.cityId]) acc[landmark.cityId] = [];
            acc[landmark.cityId].push(landmark);
            return acc;
        }, {} as Record<string, typeof newLandmarks>);

        for (const [cityId, cityLandmarks] of Object.entries(cityGroups)) {
            const city = await db.select().from(cities).where(eq(cities.id, cityId)).limit(1);
            if (city.length === 0) continue;

            const cityName = city[0].name;
            const countryCode = city[0].country; // 스키마상 country는 string임 (e.g. 'Italy')

            // 3. 테마별 분류 로직
            const themes = [
                {
                    id: 'history',
                    title: `[역사] ${cityName}의 과거 여행`,
                    desc: '세월의 흔적을 따라 걷는 역사 깊은 길입니다.',
                    categories: ['Ancient', 'History', 'Museum', 'Cathedral', '관광', 'Landmark']
                },
                {
                    id: 'gourmet',
                    title: `[미식] ${cityName}의 숨은 맛집`,
                    desc: '현지인들만 아는 진짜 맛의 향연을 느껴보세요.',
                    categories: ['Restaurant', 'Cafe', 'Food', '맛집', 'Eats']
                },
                {
                    id: 'healing',
                    title: `[휴양] ${cityName}의 여유 한 조각`,
                    desc: '잠시 발걸음을 멈추고 풍경과 바람을 즐기는 코스입니다.',
                    categories: ['Park', 'Beach', 'View', 'Activity', '이색']
                }
            ];

            for (const theme of themes) {
                // 해당 테마 카테고리에 맞는 명소 필터링
                const filtered = cityLandmarks.filter(l =>
                    theme.categories.some(cat => l.category?.toLowerCase().includes(cat.toLowerCase()))
                );

                if (filtered.length < 2) continue; // 최소 2개 이상일 때만 코스 생성

                // 4. saved_routes 에 저장 (사용자용 추천 코스로 등록)
                const routeId = randomUUID();
                const stops = filtered.map((l, index) => ({
                    landmarkId: l.id,
                    name: l.name,
                    lat: l.lat,
                    lng: l.lng,
                    duration: 30 + (index * 10), // 가상의 머무는 시간
                    order: index + 1
                }));

                await db.insert(savedRoutes).values({
                    id: routeId,
                    userId: null, // 시스템 생성 추천 코스
                    countryCode: countryCode.substring(0, 2).toUpperCase(), // 'Italy' -> 'IT' 식의 임시 처리
                    cityId: cityId,
                    title: theme.title,
                    description: theme.desc,
                    totalDistance: 1500, // 가상의 거리
                    totalDuration: stops.length * 40,
                    stops: stops,
                    coverPhotoUrl: filtered[0].photos?.[0] || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                console.log(`✨ [${theme.id}] 테마 코스 생성 완료: ${theme.title} (${stops.length}개 명소 포함)`);
            }
        }

        console.log("\n🎉 모든 테마 코스 생성이 완료되었습니다. 사용자 푸시 알림 준비 중...");

    } catch (error) {
        console.error("❌ 테마 코스 생성 중 오류 발생:", error);
    }
}

generateThemeTours().then(() => process.exit(0)).catch(console.error);
