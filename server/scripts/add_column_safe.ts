
import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function addColumn() {
    console.log("🛠️ Safely adding 'landing_content' column to 'cities' table...");
    try {
        await db.execute(sql`
            ALTER TABLE cities 
            ADD COLUMN IF NOT EXISTS landing_content JSONB;
        `);
        console.log("✅ Column added successfully (or already existed).");
    } catch (error) {
        console.error("❌ Failed to add column:", error);
        process.exit(1);
    }
}

addColumn().then(() => process.exit(0));
