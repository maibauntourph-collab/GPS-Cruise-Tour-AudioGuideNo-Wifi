import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.NOWIFIGPSTOURS;

const updates = [
    { id: 'par_eiffel', path: '/images/landmarks/eiffel_nanobanana.png' },
    { id: 'lon_big_ben', path: '/images/landmarks/big_ben_nanobanana.png' },
    { id: 'rom_colosseum', path: '/images/landmarks/colosseum_nanobanana.png' }
];

async function updateImages() {
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("🚀 Updating database with Nanobanana images...");

    for (const update of updates) {
        try {
            const res = await client.query(`
        UPDATE landmarks 
        SET photos = $1
        WHERE id = $2
      `, [JSON.stringify([update.path]), update.id]);

            if (res.rowCount > 0) {
                console.log(`✅ Updated ${update.id} with ${update.path}`);
            } else {
                console.warn(`⚠️ Item ${update.id} not found.`);
            }
        } catch (err) {
            console.error(`❌ Error updating ${update.id}:`, err);
        }
    }

    await client.end();
}

updateImages();
