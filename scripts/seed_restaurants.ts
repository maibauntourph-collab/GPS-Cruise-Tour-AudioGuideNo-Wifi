import 'dotenv/config';
import { db } from "../server/db";
import { landmarks } from "@shared/schema";
import { RESTAURANTS } from "../server/data/restaurants";
import { sql } from "drizzle-orm";

async function seedRestaurants() {
    console.log('🌱 Starting restaurant seeding...');

    if (!process.env.NOWIFIGPSTOURS) {
        console.error('❌ NOWIFIGPSTOURS environment variable is missing.');
        process.exit(1);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const restaurant of RESTAURANTS) {
        try {
            console.log(`Processing ${restaurant.name}...`);

            await db.insert(landmarks).values(restaurant).onConflictDoUpdate({
                target: landmarks.id,
                set: {
                    name: restaurant.name,
                    narration: restaurant.narration,
                    description: restaurant.description,
                    detailedDescription: restaurant.detailedDescription,
                    photos: restaurant.photos,
                    openingHours: restaurant.openingHours,
                    priceRange: restaurant.priceRange,
                    cuisine: restaurant.cuisine,
                    reservationUrl: restaurant.reservationUrl,
                    phoneNumber: restaurant.phoneNumber,
                    menuHighlights: restaurant.menuHighlights,
                    translations: restaurant.translations,
                    updatedAt: new Date()
                }
            });

            successCount++;
        } catch (error) {
            console.error(`❌ Failed to seed ${restaurant.name}:`, error);
            errorCount++;
        }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`Success: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    process.exit(0);
}

seedRestaurants();
