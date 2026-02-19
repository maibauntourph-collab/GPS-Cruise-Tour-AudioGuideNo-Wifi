import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const dbUrl = process.env.NOWIFIGPSTOURS;

async function checkData() {
    if (!dbUrl) {
        console.error("NOWIFIGPSTOURS missing");
        process.exit(1);
    }
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT city_id, COUNT(*) as total, 
                   COUNT(CASE WHEN length(detailed_description) > 300 THEN 1 END) as premium_count
            FROM landmarks 
            GROUP BY city_id
            ORDER BY premium_count DESC;
        `);
        console.log("Full Global Data Status:");
        res.rows.forEach(row => {
            console.log(`City: ${row.city_id} | Total: ${row.total} | Premium: ${row.premium_count}`);
        });
    } catch (err: any) {
        console.error("Error checking data:", err.message);
    } finally {
        await client.end();
    }
}

checkData();
