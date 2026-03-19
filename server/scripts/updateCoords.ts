import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { env } from "../env";

/**
 * 📍 Google Places 기반 위경도 업데이트 스크립트
 * 
 * [교수님의 강의 노트]
 * 학생 여러분, 이 스크립트는 우리 서비스의 '데이터 정합성'을 높이는 핵심 도구입니다.
 * 구글의 방대한 데이터를 활용해 우리 DB의 좌표를 최신화하고, 
 * 이후에는 우리만의 DB만을 사용하여 독립적인 서비스를 운영할 수 있게 합니다.
 */

async function updateLandmarkCoordinates() {
    console.log("🚀 [시작] 랜드마크 위경도 최신화 작업을 시작합니다...");

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("❌ 오류: GOOGLE_MAPS_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.");
        return;
    }

    try {
        // 1. 모든 랜드마크 가져오기
        console.log("📡 Neon DB에서 랜드마크 목록을 불러오는 중...");
        const allLandmarks = await db.select().from(landmarks);
        console.log(`📊 총 ${allLandmarks.length}개의 랜드마크를 검색했습니다.`);

        for (const landmark of allLandmarks) {
            console.log(`\n🔍 [처리 중] ${landmark.name} (ID: ${landmark.id})`);

            try {
                // 2. Google Places API(New)를 통해 장소 검색
                // 검색 쿼리에 이름과 도시 정보를 조합하여 정확도를 높입니다.
                const searchQuery = `${landmark.name}`;
                const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": apiKey,
                        "X-Goog-FieldMask": "places.id,places.location,places.displayName"
                    },
                    body: JSON.stringify({ textQuery: searchQuery, languageCode: "ko" })
                });

                const data: any = await searchRes.json();
                const bestMatch = data.places?.[0];

                if (bestMatch && bestMatch.location) {
                    const newLat = bestMatch.location.latitude;
                    const newLng = bestMatch.location.longitude;

                    console.log(`✅ 매칭 성공: ${bestMatch.displayName.text}`);
                    console.log(`   - 기존: ${landmark.lat}, ${landmark.lng}`);
                    console.log(`   - 신규: ${newLat}, ${newLng}`);

                    // 3. Neon DB 업데이트
                    await db.update(landmarks)
                        .set({
                            lat: newLat,
                            lng: newLng,
                            updatedAt: new Date()
                        })
                        .where(eq(landmarks.id, landmark.id));

                    console.log(`💾 DB 업데이트 완료!`);
                } else {
                    console.warn(`⚠️ 경고: '${landmark.name}'에 매칭되는 장소를 찾지 못했습니다.`);
                }
            } catch (err) {
                console.error(`❌ '${landmark.name}' 처리 중 오류 발생:`, err);
            }

            // API 할당량 및 안정성을 위해 아주 짧은 대기 시간을 둡니다.
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log("\n✨ [완료] 모든 랜드마크의 위경도 업데이트 작업이 종료되었습니다.");
    } catch (error) {
        console.error("☠️ 치명적 오류 발생:", error);
    }
}

// 스크립트 실행
updateLandmarkCoordinates().then(() => {
    console.log("👋 작업을 마치고 종료합니다.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
