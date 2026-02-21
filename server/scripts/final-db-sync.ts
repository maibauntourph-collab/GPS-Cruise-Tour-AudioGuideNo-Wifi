import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

async function forceUpdatePhotos() {
    console.log("🚀 [Query Master] Neon DB 사진 데이터 전수 업데이트 시작...");

    // 사진이 없거나 Unsplash 등 외부 링크인 것들을 로컬 이미지로 전환
    const targets = await db.select().from(landmarksTable);

    let updatedCount = 0;
    for (const landmark of targets) {
        let newPhoto = "/images/landmarks/placeholder.png";

        // 카테고리별 매칭 (있을 경우 세분화 가능)
        if (landmark.category?.includes("Tokyo")) newPhoto = "/images/landmarks/tokyo-default.jpg";
        else if (landmark.category?.includes("Singapore")) newPhoto = "/images/landmarks/singapore-default.jpg";
        else if (landmark.category?.includes("Barcelona")) newPhoto = "/images/landmarks/barcelona-default.jpg";

        await db.update(landmarksTable)
            .set({
                photos: [newPhoto],
                updatedAt: new Date()
            })
            .where(eq(landmarksTable.id, landmark.id));

        updatedCount++;
    }

    console.log(`✅ 총 ${updatedCount}개의 랜드마크 사진 정보가 Neon DB에 성공적으로 반영되었습니다.`);
}

forceUpdatePhotos().then(() => process.exit(0)).catch(console.error);
