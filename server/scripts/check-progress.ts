
import "dotenv/config";
import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { sql, isNotNull } from "drizzle-orm";

async function checkProgress() {
    // Count landmarks that have been enhanced (long narration and recent update)
    // Note: detailedDescription check is a good proxy for enhancement
    const optimized = await db.select({ count: sql<number>`count(*)` })
        .from(landmarks)
        .where(isNotNull(landmarks.detailedDescription));

    const total = await db.select({ count: sql<number>`count(*)` })
        .from(landmarks);

    console.log(`📊 Progress: ${optimized[0].count} / ${total[0].count} landmarks have detailed descriptions.`);
}

checkProgress().then(() => process.exit(0)).catch(console.error);
