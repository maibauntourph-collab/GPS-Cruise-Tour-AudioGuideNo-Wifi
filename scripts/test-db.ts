
import 'dotenv/config'; // Load .env file

// Check if NOWIFIGPSTOURS is present
if (!process.env.NOWIFIGPSTOURS) {
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  WARNING: NOWIFIGPSTOURS not found in environment variables.');
    console.log('   skipping actual DB connection test.');
    console.log('   (This is expected in local dev without a real DB connection, falling back to memory storage)\n');
    process.exit(0);
}

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkConnection() {
    console.log("Checking database connection...");
    try {
        const result = await db.execute(sql`SELECT NOW()`);
        console.log("Database connection successful:", result);
        process.exit(0);
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

checkConnection();
