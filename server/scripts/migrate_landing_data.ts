
import "dotenv/config";
import { db } from "../db";
import { cities } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { LANDING_DATA } from "../../client/src/data/landingData";

// Hardcoded city data for missing cities (Cebu, Civitavecchia) to ensure they have lat/lng/country
const CITY_META: Record<string, { name: string, country: string, lat: number, lng: number, zoom: number }> = {
    rome: { name: "Rome", country: "Italy", lat: 41.8902, lng: 12.4922, zoom: 14 },
    civitavecchia: { name: "Civitavecchia", country: "Italy", lat: 42.0924, lng: 11.7954, zoom: 13 },
    cebu: { name: "Cebu City", country: "Philippines", lat: 10.3157, lng: 123.8854, zoom: 13 },
    manila: { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842, zoom: 13 }
};

async function migrateLandingData() {
    console.log("🚀 Starting Landing Data Migration...");

    const cityIds = Object.keys(LANDING_DATA);
    let updatedCount = 0;
    let createdCount = 0;

    for (const cityId of cityIds) {
        const landingContent = LANDING_DATA[cityId];
        const meta = CITY_META[cityId.toLowerCase()] || {
            name: cityId.charAt(0).toUpperCase() + cityId.slice(1),
            country: "Unknown",
            lat: 0,
            lng: 0,
            zoom: 12
        };

        console.log(`Processing ${cityId}...`);

        // Check if city exists
        const existingCity = await db.select().from(cities).where(eq(cities.id, cityId));

        if (existingCity.length > 0) {
            // Update existing
            console.log(`   - Updating ${cityId} with landing content.`);
            await db.update(cities).set({
                landingContent: landingContent,
                updatedAt: new Date()
            }).where(eq(cities.id, cityId));
            updatedCount++;
        } else {
            // Insert new
            console.log(`   - Creating new city ${cityId}.`);
            await db.insert(cities).values({
                id: cityId,
                name: meta.name,
                country: meta.country,
                lat: meta.lat,
                lng: meta.lng,
                zoom: meta.zoom,
                landingContent: landingContent,
                cruisePort: null
            });
            createdCount++;
        }
    }

    console.log("-----------------------------------------");
    console.log(`✨ Migration Complete!`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`✅ Created: ${createdCount}`);
}

migrateLandingData().then(() => process.exit(0)).catch(err => {
    console.error("🔥 Fatal error:", err);
    process.exit(1);
});
