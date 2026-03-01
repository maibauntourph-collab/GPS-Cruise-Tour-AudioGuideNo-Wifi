import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";

async function checkImages() {
    const allLandmarks = await db.select().from(landmarks);
    let withImages = 0;
    let withoutImages = 0;

    for (const lm of allLandmarks) {
        if (lm.photos && lm.photos.length > 0 && lm.photos.some((p: string) => p.trim() !== "")) {
            withImages++;
        } else {
            withoutImages++;
        }
    }

    console.log(`총 랜드마크 데이터: ${allLandmarks.length}개`);
    console.log(`사진 정보가 있는 랜드마크: ${withImages}개`);
    console.log(`사진 정보가 없는 랜드마크: ${withoutImages}개`);
    process.exit(0);
}

checkImages();
