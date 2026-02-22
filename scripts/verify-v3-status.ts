import "dotenv/config";
import { db } from "../server/db";
import { landmarks } from "../shared/schema";
import { sql } from "drizzle-orm";

async function verifyStatus() {
    console.log("🔍 [Query Master] 전수 조사 및 무결성 검증 시작...");

    try {
        const totalResult = await db.select({ count: sql<number>`count(*)` }).from(landmarks);
        const total = Number(totalResult[0].count);

        const v3Result = await db.select({ count: sql<number>`count(*)` }).from(landmarks).where(sql`length(narration) > 400`);
        const v3Count = Number(v3Result[0].count);

        const cebuResult = await db.select({ count: sql<number>`count(*)` }).from(landmarks).where(sql`city_id = 'cebu'`);
        const cebuCount = Number(cebuResult[0].count);

        console.log("\n--- [검증 결과] ---");
        console.log(`✅ 전체 명소 수: ${total}`);
        console.log(`✅ Gravity V3 고도화 완료: ${v3Count} / ${total}`);
        console.log(`✅ 세부(Cebu) 명소: ${cebuCount}`);

        if (v3Count === total) {
            console.log("\n🎉 모든 명소의 Gravity V3 프리미엄 나레이션 고도화가 완벽하게 완료되었습니다.");
        } else {
            console.log(`\n⚠️ 아직 ${total - v3Count}개의 명소가 고도화 대기 중입니다.`);
        }

    } catch (error) {
        console.error("❌ 검증 중 오류 발생:", error);
    }
}

verifyStatus().then(() => process.exit(0)).catch(console.error);
