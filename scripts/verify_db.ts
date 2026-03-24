
import 'dotenv/config';
import { db } from '../server/db';
import { landmarks, cities } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function verifyConnection() {
    console.log('--- 🔗 Neon DB Connection Verification ---');
    console.log(`Checking NOWIFIGPSTOURS: ${process.env.NOWIFIGPSTOURS ? 'SET' : 'MISSING'}`);

    try {
        // 1. Basic Ping
        const start = Date.now();
        const result = await db.execute(sql`SELECT 1`);
        console.log(`✅ Database Ping Successful! (${Date.now() - start}ms)`);

        // 2. Table Count Check
        const landmarkCount = await db.execute(sql`SELECT count(*) FROM landmarks`);
        const cityCount = await db.execute(sql`SELECT count(*) FROM cities`);

        console.log(`📊 Statistics:`);
        console.log(` - Landmarks: ${landmarkCount.rows[0].count}`);
        console.log(` - Cities: ${cityCount.rows[0].count}`);

        // 3. Sample Data Fetch
        const sample = await db.select().from(landmarks).limit(1);
        if (sample.length > 0) {
            console.log(`✅ Sample Landmark: ${sample[0].name} (Category: ${sample[0].category})`);
        } else {
            console.log(`⚠️ No landmarks found in the database. Need to sync?`);
        }

    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
    } finally {
        process.exit(0);
    }
}

verifyConnection();
