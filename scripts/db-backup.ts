import "dotenv/config";
import { db } from "../server/db";
import { cities, landmarks, citiesBackup, landmarksBackup } from "../shared/schema";
import { sql } from "drizzle-orm";

async function runBackup() {
    console.log("💾 [Query Master] Neon DB 백업 클러스터 동기화 시작...");

    try {
        // 1. 도시 데이터 백업
        console.log("📍 도시(Cities) 데이터 백업 중...");
        const allCities = await db.select().from(cities);
        if (allCities.length > 0) {
            // 기존 백업 삭제 후 재생성 (클린 백업)
            await db.execute(sql`TRUNCATE TABLE cities_backup`);
            for (const city of allCities) {
                await db.insert(citiesBackup).values({
                    ...city,
                    backupAt: new Date()
                });
            }
        }
        console.log(`✅ ${allCities.length}개의 도시 정보 백업 완료.`);

        // 2. 랜드마크 데이터 백업
        console.log("📍 랜드마크(Landmarks) 데이터 백업 중...");
        const allLandmarks = await db.select().from(landmarks);
        if (allLandmarks.length > 0) {
            await db.execute(sql`TRUNCATE TABLE landmarks_backup`);
            // 대량 효율을 위해 루프가 아닌 배치로 처리 선호하지만, 정합성을 위해 루프 유지 (혹은 chunk 처리)
            for (const l of allLandmarks) {
                await db.insert(landmarksBackup).values({
                    ...l,
                    backupAt: new Date()
                });
            }
        }
        console.log(`✅ ${allLandmarks.length}개의 랜드마크 정보 백업 완료.`);

        console.log("\n🎉 백업 클러스터가 성공적으로 구축되었습니다.");

    } catch (error) {
        console.error("❌ 백업 중 오류 발생:", error);
    }
}

runBackup().then(() => process.exit(0)).catch(console.error);
