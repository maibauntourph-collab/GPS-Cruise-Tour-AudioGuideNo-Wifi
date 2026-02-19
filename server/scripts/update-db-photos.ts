
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { LANDMARKS } from "../data/landmarks";
import { NEW_LANDMARKS } from "../data/landmarks_expansion";
import { RESTAURANTS } from "../data/restaurants";
import { eq } from "drizzle-orm";

/**
 * [학습 포인트: DB-Centric 전수 동기화]
 * 1. Neon DB에서 현재 저장된 모든(345개 등) 데이터를 가져옵니다.
 * 2. 로컬 소스(landmarks, expansion, restaurants)와 ID로 매칭합니다.
 * 3. 매칭되는 데이터는 최신 사진 정보로 업데이트합니다.
 * 4. 매칭되지 않는(DB에만 있는) 데이터는 리스트업하여 추가 관리를 유도합니다.
 */

const ALL_LOCAL_DATA = [...LANDMARKS, ...NEW_LANDMARKS, ...RESTAURANTS];
const LOCAL_MAP = new Map(ALL_LOCAL_DATA.map(l => [l.id, l]));

export async function updateDbPhotos() {
    console.log("🔍 Fetching all landmarks from Neon DB...");
    const allDbLandmarks = await db.select().from(landmarksTable);
    console.log(`📊 Found ${allDbLandmarks.length} landmarks in DB.`);

    let updatedCount = 0;
    let localMissingInDb = 0;
    let dbMissingInLocal = [];

    console.log("🚀 Starting intelligent synchronization...");

    for (const dbLandmark of allDbLandmarks) {
        const localSource = LOCAL_MAP.get(dbLandmark.id);

        if (localSource && localSource.photos && localSource.photos.length > 0) {
            try {
                await db
                    .update(landmarksTable)
                    .set({
                        photos: localSource.photos,
                        updatedAt: new Date()
                    })
                    .where(eq(landmarksTable.id, dbLandmark.id));
                updatedCount++;
            } catch (error) {
                console.error(`❌ Failed to update ${dbLandmark.id}:`, error);
            }
        } else if (!localSource) {
            dbMissingInLocal.push({ id: dbLandmark.id, name: dbLandmark.name });
        }
    }

    console.log("-----------------------------------------");
    console.log(`✨ DB Sync Complete!`);
    console.log(`✅ Successfully updated: ${updatedCount} landmarks`);
    console.log(`⚠️ DB-only landmarks (missing in code): ${dbMissingInLocal.length}`);

    if (dbMissingInLocal.length > 0) {
        console.log("📝 Sample of DB-only landmarks:");
        console.table(dbMissingInLocal.slice(0, 5));
        console.log("... and more.");
    }

    return { updatedCount, dbOnlyCount: dbMissingInLocal.length };
}

// 직접 실행 시 (CLI)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('update-db-photos.ts')) {
    updateDbPhotos().then(() => process.exit(0)).catch((err) => {
        console.error("🔥 Fatal error during update:", err);
        process.exit(1);
    });
}
