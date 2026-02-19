import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const dbUrl = process.env.NOWIFIGPSTOURS;

async function preview() {
    if (!dbUrl) {
        console.error("NOWIFIGPSTOURS missing");
        process.exit(1);
    }

    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const res = await client.query(`
        SELECT city_id, name, description, detailed_description, narration, photos
        FROM landmarks 
        WHERE updated_at > NOW() - INTERVAL '30 minutes'
        ORDER BY updated_at DESC
    `);

    console.log("🌌 Gravity V3 Premium - Real-time Preview Report");
    console.log("===============================================");

    const grouped = res.rows.reduce((acc: any, row: any) => {
        if (!acc[row.city_id]) acc[row.city_id] = [];
        acc[row.city_id].push(row);
        return acc;
    }, {});

    for (const [city, items] of Object.entries(grouped)) {
        console.log(`\n🏙️  City: ${city.toUpperCase()}`);
        (items as any[]).forEach(item => {
            console.log(`   📍 [${item.name}]`);
            console.log(`      - Summary: ${item.description}`);
            console.log(`      - Story: ${item.detailed_description.slice(0, 100)}... (${item.detailed_description.length} chars)`);
            const photos = typeof item.photos === 'string' ? JSON.parse(item.photos) : item.photos;
            console.log(`      - Photos: ${Array.isArray(photos) ? photos.length : 1} images (Nanobanana style)`);
        });
    }

    await client.end();
}

preview();
