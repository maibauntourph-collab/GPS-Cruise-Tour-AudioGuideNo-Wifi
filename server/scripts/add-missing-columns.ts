import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../shared/schema";
import { env } from "../env";

if (!env.NOWIFIGPSTOURS) {
    console.error("Missing NOWIFIGPSTOURS. Aborting.");
    process.exit(1);
}

const sql = neon(env.NOWIFIGPSTOURS);

async function run() {
    console.log("Adding missing columns to DB...");
    try {
        await sql`
            ALTER TABLE landmarks 
            ADD COLUMN IF NOT EXISTS search_keywords JSONB,
            ADD COLUMN IF NOT EXISTS target_nations JSONB;
        `;
        console.log("Missing columns added successfully.");
    } catch (e: any) {
        console.error("Error adding columns:", e?.message);
    }
    process.exit(0);
}

run();
