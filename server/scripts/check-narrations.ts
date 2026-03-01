import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { isNotNull, ne } from "drizzle-orm";

async function checkNarrations() {
    const allLandmarks = await db.select().from(landmarks);
    let withNarration = 0;
    let withoutNarration = 0;

    for (const lm of allLandmarks) {
        if (lm.narration && lm.narration.length > 50) {
            withNarration++;
        } else {
            withoutNarration++;
        }
    }

    console.log(`총 랜드마크: ${allLandmarks.length}`);
    console.log(`내레이션 작성 완료 랜드마크 갯수: ${withNarration}`);
    console.log(`내레이션 미비 랜드마크 갯수: ${withoutNarration}`);
    process.exit(0);
}

checkNarrations();
