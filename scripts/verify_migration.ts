import "dotenv/config";
import { db } from "../server/db";
import { landmarks, cities } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function verifyMigration() {
       console.log("🔍 Verifying data migration integrity...");

       const cityCount = await db.select({ count: sql<number>`count(*)` }).from(cities);
       const landmarkCount = await db.select({ count: sql<number>`count(*)` }).from(landmarks);

       console.log(`📊 Statistics:`);
       console.log(`- Cities in DB: ${cityCount[0].count}`);
       console.log(`- Landmarks in DB: ${landmarkCount[0].count}`);

       if (landmarkCount[0].count >= 135) {
              console.log("✅ All 135 landmarks are successfully present in Neon DB.");
       } else {
              console.warn(`⚠️ Warning: Expected 135 landmarks, but found ${landmarkCount[0].count}.`);
       }

       // Check a sample landmark (Colosseum)
       const colosseum = await db.select().from(landmarks).where(eq(landmarks.id, 'colosseum')).limit(1);
       if (colosseum.length > 0) {
              console.log(`✅ Sample Landmark (Colosseum) verified: ${colosseum[0].name}`);
       } else {
              console.error("❌ Sample Landmark (Colosseum) not found!");
       }

       process.exit(0);
}

verifyMigration().catch(console.error);
