import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

async function migrate() {
    if (!dbUrl) {
        console.error("DATABASE_URL is missing");
        process.exit(1);
    }

    const dataPath = path.join(process.cwd(), 'scripts', 'cleaned_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("extracted_data.json is missing. Please run the extraction steps first.");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const cities = data.CITIES || [];
    const landmarks = [...(data.LANDMARKS || []), ...(data.RESTAURANTS || [])];

    const client = new pg.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("🚀 [AI DB Manager] Connected to Neon for full migration.");

        // 1. Migrate Cities
        console.log(`📡 Migrating ${cities.length} cities...`);
        for (const city of cities) {
            const check = await client.query('SELECT id FROM cities WHERE id = $1', [city.id]);
            if (check.rows.length === 0) {
                await client.query(
                    'INSERT INTO cities (id, name, country, lat, lng, zoom, cruise_port) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [city.id, city.name, city.country, city.lat, city.lng, city.zoom, JSON.stringify(city.cruisePort)]
                );
                console.log(` ✅ City Migrated: ${city.name}`);
            } else {
                // Update even if it exists to ensure freshness
                await client.query(
                    'UPDATE cities SET name=$2, country=$3, lat=$4, lng=$5, zoom=$6, cruise_port=$7 WHERE id=$1',
                    [city.id, city.name, city.country, city.lat, city.lng, city.zoom, JSON.stringify(city.cruisePort)]
                );
                console.log(` 🔄 City Updated: ${city.name}`);
            }
        }

        // 2. Migrate Landmarks (including Restaurants)
        console.log(`📡 Migrating ${landmarks.length} landmarks...`);
        for (const l of landmarks) {
            const check = await client.query('SELECT id FROM landmarks WHERE id = $1', [l.id]);

            const values = [
                l.id, l.cityId, l.name, l.lat, l.lng, l.radius, l.narration, l.description, l.category,
                l.detailedDescription || null,
                JSON.stringify(l.photos || []),
                l.historicalInfo || null,
                l.yearBuilt || null,
                l.architect || null,
                JSON.stringify(l.translations || {}),
                l.openingHours || null,
                l.priceRange || null,
                l.cuisine || null,
                l.reservationUrl || null,
                l.phoneNumber || null,
                JSON.stringify(l.menuHighlights || []),
                JSON.stringify(l.restaurantPhotos || {}),
                JSON.stringify(l.paymentMethods || [])
            ];

            if (check.rows.length === 0) {
                await client.query(`
                    INSERT INTO landmarks (
                        id, city_id, name, lat, lng, radius, narration, description, category,
                        detailed_description, photos, historical_info, year_built, architect, 
                        translations, opening_hours, price_range, cuisine, reservation_url, 
                        phone_number, menu_highlights, restaurant_photos, payment_methods
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
                    )`,
                    values
                );
                console.log(` ✅ Landmark Migrated: ${l.name}`);
            } else {
                await client.query(`
                    UPDATE landmarks SET 
                        city_id=$2, name=$3, lat=$4, lng=$5, radius=$6, narration=$7, description=$8, category=$9,
                        detailed_description=$10, photos=$11, historical_info=$12, year_built=$13, architect=$14, 
                        translations=$15, opening_hours=$16, price_range=$17, cuisine=$18, reservation_url=$19, 
                        phone_number=$20, menu_highlights=$21, restaurant_photos=$22, payment_methods=$23
                    WHERE id=$1`,
                    values
                );
                console.log(` 🔄 Landmark Updated: ${l.name}`);
            }
        }

        console.log("✨ [AI DB Manager] Full Migration Complete!");
    } catch (err) {
        console.error("❌ Migration Error:", err);
    } finally {
        await client.end();
    }
}

migrate();
