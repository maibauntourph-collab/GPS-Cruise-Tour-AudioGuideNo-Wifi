import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function diag() {
    console.log("[Diag] Testing connection and querying sample data...");
    try {
        const result = await db.execute(sql`SELECT id, name FROM landmarks LIMIT 5`);
        console.log("SAMPLE_DATA:", JSON.stringify(result.rows || result, null, 2));

        const seoul = await db.execute(sql`SELECT id, name FROM landmarks WHERE name LIKE '%롯데%' OR id LIKE '%seoul%' LIMIT 10`);
        console.log("SEOUL_DATA:", JSON.stringify(seoul.rows || seoul, null, 2));
    } catch (e) {
        console.error("DIAG_FAILED:", e);
    }
}

diag();
