import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkLotteWorld() {
    console.log("[Check] Fetching lotte_world from Neon DB...");
    try {
        const result = await db.execute(sql`SELECT id, name, name_translations, photos FROM landmarks WHERE id LIKE '%lotte%'`);
        console.log("RESULT_START");
        console.log(JSON.stringify(result.rows || result, null, 2));
        console.log("RESULT_END");
    } catch (error) {
        console.error("Query failed:", error);
    }
}

checkLotteWorld().catch(console.error);
