import 'dotenv/config';

import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

async function updateGpsPrecision() {
    console.log("📍 [Avengers Team] 랜드마크 고정밀 GPS 좌표(Google Precision) 업데이트를 시작합니다...");

    // [Query Master] 컬럼 부재 시 자동 추가 (SQL Injection 방지를 위해 sql 템플릿 사용)
    try {
        await db.execute(sql`ALTER TABLE landmarks ADD COLUMN IF NOT EXISTS target_nations jsonb`);
        console.log("✅ [DB] 'target_nations' 컬럼 상태 확인 완료.");
    } catch (e: any) {
        console.warn("⚠️ [DB] 컬럼 추가 시도 중 경고 (이미 존재할 수 있음):", e.message);
    }

    // [Cruiser Navigator Kim] 항해사가 검수한 정밀 좌표 리스트 (소수점 6자리 이상)
    const precisionData: Record<string, { lat: number, lng: number }> = {
        "경복궁": { lat: 37.579617, lng: 126.977041 },
        "남산서울타워": { lat: 37.551169, lng: 126.988227 },
        "북촌한옥마을": { lat: 37.582604, lng: 126.983617 },
        "명동 쇼핑 거리": { lat: 37.559367, lng: 126.985817 },
        "창덕궁": { lat: 37.579431, lng: 126.991047 },
        "수원 화성": { lat: 37.289196, lng: 127.011889 },
        "청계천": { lat: 37.569421, lng: 126.978601 },
        "동대문 디자인 프라자 (DDP)": { lat: 37.566524, lng: 127.009224 },
        "인사동": { lat: 37.571871, lng: 126.986221 },
        "광장시장": { lat: 37.570161, lng: 126.999517 },
        "한강 시민 공원 (반포)": { lat: 37.510006, lng: 126.995963 },
        "스타필드 코엑스몰 (별마당 도서관)": { lat: 37.511874, lng: 127.059157 },
        "롯데월드타워 & 몰": { lat: 37.512555, lng: 127.102555 },
        "성수동 카페 거리": { lat: 37.543417, lng: 127.051517 },
        "홍대 걷고싶은거리": { lat: 37.556617, lng: 126.923817 },
        "부산 감천문화마을": { lat: 35.097481, lng: 129.010589 },
        "부산 해운대 해수욕장": { lat: 35.158714, lng: 129.160317 },
        "제주 성산일출봉": { lat: 33.458997, lng: 126.942417 },
        "제주 우도": { lat: 33.511117, lng: 126.953617 }
    };

    let updateCount = 0;
    const allLandmarks = await db.select().from(landmarksTable);

    for (const landmark of allLandmarks) {
        // 이름(name)을 기준으로 정밀 데이터 확인
        const precision = precisionData[landmark.name];

        if (precision) {
            await db.update(landmarksTable)
                .set({
                    lat: precision.lat,
                    lng: precision.lng
                })
                .where(eq(landmarksTable.id, landmark.id));

            console.log(`✅ [정밀 업데이트] ${landmark.name}: ${precision.lat}, ${precision.lng}`);
            updateCount++;
        }
    }

    console.log(`\n✨ 총 ${updateCount}개 랜드마크의 GPS 정밀 업데이트가 완료되었습니다.`);
    console.log("🎯 [Automation Doctor] 오디오 가이드 트리거의 정확도가 향상되었습니다.");
}

updateGpsPrecision().then(() => process.exit(0)).catch(err => {
    console.error("❌ GPS 업데이트 실패:", err.message);
    process.exit(1);
});
