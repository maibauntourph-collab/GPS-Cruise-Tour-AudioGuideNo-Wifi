import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkRomanForum() {
    console.log("[Check] Fetching roman_forum from Neon DB via raw SQL...");
    try {
        const result = await db.execute(sql`SELECT id, photos FROM landmarks WHERE id = 'roman_forum'`);
        console.log("RESULT_START");
        console.log(JSON.stringify(result.rows || result, null, 2));
        console.log("RESULT_END");
    } catch (error) {
        console.error("Query failed:", error);
    }
}

checkRomanForum().catch(console.error);
