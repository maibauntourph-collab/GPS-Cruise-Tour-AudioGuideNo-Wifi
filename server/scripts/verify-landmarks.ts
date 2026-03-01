import { db } from "../db";
import { landmarks, cities } from "@shared/schema";
import { count } from "drizzle-orm";

async function verifyLandmarks() {
    console.log("==================================================");
    console.log("🔍 [Query Master] 랜드마크 데이터베이스 검증 스크립트 실행");
    try {
        const [{ value: totalLandmarks }] = await db.select({ value: count() }).from(landmarks);
        const [{ value: totalCities }] = await db.select({ value: count() }).from(cities);

        console.log(`📊 현재 DB 랜드마크 수: ${totalLandmarks} 개`);
        console.log(`🏙️ 현재 DB 도시 수: ${totalCities} 개`);

        if (totalLandmarks === 245) {
            console.log("✅ 목표치인 245개의 랜드마크가 정확히 등록되어 있습니다.");
        } else {
            console.log(`⚠️ 목표 리스트(245개)와 불일치합니다. 추가 업데이트가 필요합니다.`);
        }
    } catch (e) {
        console.error("❌ DB 조회 중 오류 발생:", e);
    } finally {
        process.exit(0);
    }
}

verifyLandmarks();
