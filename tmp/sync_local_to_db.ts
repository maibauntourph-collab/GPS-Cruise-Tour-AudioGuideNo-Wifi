/**
 * Sync local landmark data files to NeonDB.
 * Inserts landmarks that exist in local .ts files but NOT in the database.
 */
import { neon } from "@neondatabase/serverless";

// --- Import all local landmark arrays ---
import { LANDMARKS } from "../server/data/landmarks";
import { LANDMARKS_ALASKA } from "../server/data/landmarks_alaska";
import { LANDMARKS_ASIA_PLUS } from "../server/data/landmarks_asia_plus";
import { LANDMARKS_AEGEAN } from "../server/data/landmarks_aegean";
import { LANDMARKS_EU_BOOST } from "../server/data/landmarks_eu_boost";
import { LANDMARKS_CARIBBEAN } from "../server/data/landmarks_caribbean";
import { NEW_LANDMARKS } from "../server/data/landmarks_expansion";

const DB_URL =
  "postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DB_URL);

// Korean character regex
const HANGUL_RE = /[가-힣]/;

interface SourceFile {
  name: string;
  landmarks: any[];
}

const SOURCES: SourceFile[] = [
  { name: "landmarks.ts", landmarks: LANDMARKS },
  { name: "landmarks_alaska.ts", landmarks: LANDMARKS_ALASKA },
  { name: "landmarks_asia_plus.ts", landmarks: LANDMARKS_ASIA_PLUS },
  { name: "landmarks_aegean.ts", landmarks: LANDMARKS_AEGEAN },
  { name: "landmarks_eu_boost.ts", landmarks: LANDMARKS_EU_BOOST },
  { name: "landmarks_caribbean.ts", landmarks: LANDMARKS_CARIBBEAN },
  { name: "landmarks_expansion.ts", landmarks: NEW_LANDMARKS },
];

function toISOOrNull(val: any): string | null {
  if (val == null) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "string") return val;
  return null;
}

function jsonOrNull(val: any): string | null {
  if (val == null) return null;
  return JSON.stringify(val);
}

/** Build narration_i18n from narration field if Korean */
function buildNarrationI18n(landmark: any): string | null {
  const narration = landmark.narration;
  if (!narration || typeof narration !== "string") return null;
  if (HANGUL_RE.test(narration)) {
    return JSON.stringify({ ko: narration });
  }
  return null;
}

async function insertLandmark(landmark: any) {
  const narrationI18n = buildNarrationI18n(landmark);

  await sql`
    INSERT INTO landmarks (
      id, city_id, name, lat, lng, radius, narration, description, category,
      detailed_description, photos, historical_info, year_built, architect,
      translations, narration_i18n, opening_hours, price_range, cuisine,
      reservation_url, phone_number, menu_highlights, restaurant_photos,
      payment_methods, is_premium, price, search_keywords, created_at, updated_at
    ) VALUES (
      ${landmark.id},
      ${landmark.cityId},
      ${landmark.name},
      ${landmark.lat},
      ${landmark.lng},
      ${landmark.radius},
      ${landmark.narration},
      ${landmark.description ?? null},
      ${landmark.category ?? null},
      ${landmark.detailedDescription ?? null},
      ${jsonOrNull(landmark.photos)},
      ${landmark.historicalInfo ?? null},
      ${landmark.yearBuilt ?? null},
      ${landmark.architect ?? null},
      ${jsonOrNull(landmark.translations)},
      ${narrationI18n},
      ${landmark.openingHours ?? null},
      ${landmark.priceRange ?? null},
      ${landmark.cuisine ?? null},
      ${landmark.reservationUrl ?? null},
      ${landmark.phoneNumber ?? null},
      ${jsonOrNull(landmark.menuHighlights)},
      ${jsonOrNull(landmark.restaurantPhotos)},
      ${jsonOrNull(landmark.paymentMethods)},
      ${landmark.isPremium ?? false},
      ${landmark.price ?? null},
      ${jsonOrNull(landmark.searchKeywords)},
      ${toISOOrNull(landmark.createdAt) ?? new Date().toISOString()},
      ${toISOOrNull(landmark.updatedAt) ?? new Date().toISOString()}
    )
  `;
}

async function main() {
  console.log("=== Sync Local Landmarks to NeonDB ===\n");

  // Step 1: Get all existing IDs from DB
  console.log("[Step 1] Fetching existing landmark IDs from DB...");
  const rows = await sql`SELECT id FROM landmarks`;
  const existingIds = new Set(rows.map((r: any) => r.id));
  console.log(`  DB has ${existingIds.size} landmarks.\n`);

  // Step 2: Process each source file
  let totalInserted = 0;
  let totalErrors = 0;

  for (const source of SOURCES) {
    const missing = source.landmarks.filter((lm: any) => !existingIds.has(lm.id));
    console.log(`[${source.name}] Total: ${source.landmarks.length}, Missing: ${missing.length}`);

    if (missing.length === 0) {
      console.log(`  -> Nothing to insert.\n`);
      continue;
    }

    let insertedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process in batches of 10
    for (let i = 0; i < missing.length; i += 10) {
      const batch = missing.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map((lm: any) => insertLandmark(lm))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          insertedCount++;
        } else {
          errorCount++;
          const lm = batch[j];
          errors.push(`  ERROR [${lm.id}]: ${result.reason?.message || result.reason}`);
        }
      }
    }

    console.log(`  -> Inserted: ${insertedCount}, Errors: ${errorCount}`);
    if (errors.length > 0) {
      errors.forEach((e) => console.log(e));
    }
    console.log("");

    totalInserted += insertedCount;
    totalErrors += errorCount;
  }

  // Final summary
  console.log("=== SUMMARY ===");
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total errors:   ${totalErrors}`);

  // Verify final count
  const finalRows = await sql`SELECT COUNT(*) as cnt FROM landmarks`;
  console.log(`DB landmark count now: ${finalRows[0].cnt}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
