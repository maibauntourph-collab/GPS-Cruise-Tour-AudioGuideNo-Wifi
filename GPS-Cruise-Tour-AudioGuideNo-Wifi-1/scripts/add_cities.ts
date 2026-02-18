import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

const newCities = [
    { id: 'tokyo', name: '도쿄', country: '일본', lat: 35.6762, lng: 139.6503, zoom: 11, cruisePort: { name: 'Yokohama Port', lat: 35.4542, lng: 139.6472 } },
    { id: 'busan', name: '부산광역시', country: '대한민국', lat: 35.1796, lng: 129.0756, zoom: 11, cruisePort: { name: 'Busan International Cruise Terminal', lat: 35.0987, lng: 129.0403 } },
    { id: 'jeju', name: '제주특별자치도', country: '대한민국', lat: 33.4996, lng: 126.5312, zoom: 10, cruisePort: { name: 'Jeju Cruise Terminal', lat: 33.5283, lng: 126.5412 } },
    { id: 'new-york', name: '뉴욕', country: '미국', lat: 40.7128, lng: -74.0060, zoom: 11, cruisePort: { name: 'Manhattan Cruise Terminal', lat: 40.7695, lng: -73.9972 } },
    { id: 'bangkok', name: '방콕', country: '태국', lat: 13.7563, lng: 100.5018, zoom: 11, cruisePort: { name: 'Laem Chabang Port', lat: 13.0801, lng: 100.9103 } }
];

async function addCities() {
    if (!dbUrl) {
        console.error("DATABASE_URL missing");
        process.exit(1);
    }
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        for (const city of newCities) {
            await client.query(
                'INSERT INTO cities (id, name, country, lat, lng, zoom, cruise_port) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET name=$2, country=$3, lat=$4, lng=$5, zoom=$6, cruise_port=$7',
                [city.id, city.name, city.country, city.lat, city.lng, city.zoom, JSON.stringify(city.cruisePort)]
            );
            console.log(`✅ City Added/Updated: ${city.name}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

addCities();
