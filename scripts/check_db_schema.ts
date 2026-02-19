import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.NOWIFIGPSTOURS;

async function checkSchema() {
    if (!dbUrl) {
        console.error("NOWIFIGPSTOURS is missing in .env");
        process.exit(1);
    }

    const client = new pg.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("💾 [Query Master] Connection to Neon established.");

        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log("📊 [Query Master] Current Tables in Database:");
        res.rows.forEach(row => console.log(` - ${row.table_name}`));

        if (res.rows.length === 0) {
            console.warn("⚠️ [Server Park] Warning: No tables found in public schema.");
        } else {
            console.log(`✅ [Server Park] Verification Complete: ${res.rows.length} tables are active.`);
        }

    } catch (err) {
        console.error("❌ [Server Park] Connection or Query Failed:", err);
    } finally {
        await client.end();
    }
}

checkSchema();
