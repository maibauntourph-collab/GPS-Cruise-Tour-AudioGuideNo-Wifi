import "dotenv/config";
import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkCities() {
    console.log("🔍 Checking Cities Table Structure via Raw SQL...");

    // Check columns in information_schema to find 'hidden' columns not in code
    const columns = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'cities';
    `);

    console.log("📊 Actual DB Columns:", columns.rows);

    const allCities = await db.execute(sql`SELECT * FROM cities LIMIT 3`);
    console.log("📝 Sample Row Data:", allCities.rows);


    // Check for specific cities mentioned in LANDING_DATA
    const targets = ['rome', 'civitavecchia', 'cebu', 'manila']; // Added manila just in case
    console.log("\n🎯 Checking specific targets:");
    for (const id of targets) {
        const city = allCities.rows.find((c: any) => c.id === id);
        if (city) {
            console.log(`✅ Found ${id}:`, city.name);
            console.log(`   - Raw Cruise Port:`, JSON.stringify(city.cruise_port, null, 2));
        } else {
            console.log(`❌ Missing ${id} in DB.`);
        }
    }
}

checkCities().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
