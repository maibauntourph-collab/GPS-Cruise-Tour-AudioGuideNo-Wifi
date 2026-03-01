import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { isNull, sql } from "drizzle-orm";

async function checkMissingImages() {
    try {
        const allLandmarks = await db.select().from(landmarks);

        let missingCount = 0;
        const missingDetails: Array<{ id: string, name: string }> = [];

        for (const lm of allLandmarks) {
            const photos = lm.photos as string[] | null;
            if (
                !photos ||
                photos.length === 0 ||
                photos.some(p => p.includes('placeholder.png'))
            ) {
                missingCount++;
                missingDetails.push({ id: lm.id, name: lm.translations?.ko?.name || lm.name });
            }
        }

        console.log(`\n================================`);
        console.log(`총 랜드마크 수: ${allLandmarks.length}개`);
        console.log(`이미지가 없거나 placeholder인 랜드마크 수: ${missingCount}개`);
        console.log(`================================\n`);

        // 너무 많으면 일부만 출력
        if (missingCount > 0) {
            console.log(`[누락된 랜드마크 샘플 (최대 10개)]`);
            missingDetails.slice(0, 10).forEach(lm => {
                console.log(`- ${lm.name} (ID: ${lm.id})`);
            });
        }
    } catch (error) {
        console.error("Error checking images:", error);
    } finally {
        process.exit(0);
    }
}

checkMissingImages();
