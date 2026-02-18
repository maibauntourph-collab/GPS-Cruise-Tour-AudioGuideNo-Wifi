import "dotenv/config";
import { db } from "../server/db";
import { landmarks } from "../shared/schema";
import { sql } from "drizzle-orm";

async function analyzeLandmarks() {
       console.log("🔍 Detailed Landmark Analysis in Neon DB...");

       // 1. Total Count
       const totalResult = await db.select({ count: sql<number>`count(*)` }).from(landmarks);
       console.log(`📊 Total Landmarks in DB: ${totalResult[0].count}`);

       // 2. Count by City
       const cityResult = await db.select({
              cityId: landmarks.cityId,
              count: sql<number>`count(*)`
       })
              .from(landmarks)
              .groupBy(landmarks.cityId)
              .orderBy(sql`count desc`);

       console.log("\n📍 Landmark Count per City:");
       cityResult.forEach(row => {
              console.log(`- ${row.cityId}: ${row.count}`);
       });

       // 3. Count demo data
       const demoResult = await db.select({ count: sql<number>`count(*)` })
              .from(landmarks)
              .where(sql`id LIKE '%-demo-%'`);
       console.log(`\n🧪 Demo Landmarks: ${demoResult[0].count}`);

       process.exit(0);
}

analyzeLandmarks().catch(console.error);
