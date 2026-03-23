import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkDataStats() {
    console.log("[Check] Checking data statistics in Neon DB...");
    try {
        const total = await db.execute(sql`SELECT COUNT(*) as count FROM landmarks`);
        const withPhotos = await db.execute(sql`SELECT COUNT(*) as count FROM landmarks WHERE photos IS NOT NULL AND jsonb_array_length(photos) > 0`);
        const withNations = await db.execute(sql`SELECT COUNT(*) as count FROM landmarks WHERE target_nations IS NOT NULL AND jsonb_array_length(target_nations) > 0`);

        console.log("RESULT_START");
        console.log({
            total: total.rows[0].count,
            withPhotos: withPhotos.rows[0].count,
            withNations: withNations.rows[0].count
        });
        console.log("RESULT_END");
    } catch (error) {
        console.error("Query failed:", error);
    }
}

checkDataStats().catch(console.error);
