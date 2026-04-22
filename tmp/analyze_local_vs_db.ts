import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  // 1. Get all IDs from DB
  const sql = neon(DATABASE_URL);
  const dbRows = await sql`SELECT id FROM landmarks ORDER BY id`;
  const dbIds = new Set(dbRows.map((r: any) => r.id));
  console.log(`\n=== DB landmark count: ${dbIds.size} ===\n`);

  // 2. Get all IDs from local files
  const files: Record<string, string[]> = {};

  // Import each file
  const { LANDMARKS } = await import("../server/data/landmarks.ts");
  files["landmarks.ts"] = LANDMARKS.map((l: any) => l.id);

  const { LANDMARKS_ALASKA } = await import("../server/data/landmarks_alaska.ts");
  files["landmarks_alaska.ts"] = LANDMARKS_ALASKA.map((l: any) => l.id);

  const { LANDMARKS_ASIA_PLUS } = await import("../server/data/landmarks_asia_plus.ts");
  files["landmarks_asia_plus.ts"] = LANDMARKS_ASIA_PLUS.map((l: any) => l.id);

  const { LANDMARKS_AEGEAN } = await import("../server/data/landmarks_aegean.ts");
  files["landmarks_aegean.ts"] = LANDMARKS_AEGEAN.map((l: any) => l.id);

  const { LANDMARKS_EU_BOOST } = await import("../server/data/landmarks_eu_boost.ts");
  files["landmarks_eu_boost.ts"] = LANDMARKS_EU_BOOST.map((l: any) => l.id);

  const { LANDMARKS_CARIBBEAN } = await import("../server/data/landmarks_caribbean.ts");
  files["landmarks_caribbean.ts"] = LANDMARKS_CARIBBEAN.map((l: any) => l.id);

  const { NEW_LANDMARKS } = await import("../server/data/landmarks_expansion.ts");
  files["landmarks_expansion.ts"] = NEW_LANDMARKS.map((l: any) => l.id);

  // Combine all local IDs
  const allLocalIds = new Set<string>();
  for (const [file, ids] of Object.entries(files)) {
    console.log(`  ${file}: ${ids.length} landmarks`);
    for (const id of ids) allLocalIds.add(id);
  }
  console.log(`\n  Total unique local IDs: ${allLocalIds.size}`);

  // 3. Compare
  const inDbOnly: string[] = [];
  for (const id of dbIds) {
    if (!allLocalIds.has(id as string)) inDbOnly.push(id as string);
  }

  const inLocalOnly: string[] = [];
  for (const id of allLocalIds) {
    if (!dbIds.has(id)) inLocalOnly.push(id);
  }

  console.log(`\n=== COMPARISON ===`);
  console.log(`In DB only (not in local files): ${inDbOnly.length}`);
  console.log(`In local files only (not in DB): ${inLocalOnly.length}`);

  if (inDbOnly.length > 0) {
    console.log(`\n--- IDs in DB only (first 20) ---`);
    inDbOnly.slice(0, 20).forEach(id => console.log(`  ${id}`));
    if (inDbOnly.length > 20) console.log(`  ... and ${inDbOnly.length - 20} more`);
  }

  if (inLocalOnly.length > 0) {
    console.log(`\n--- IDs in local files only (NOT in DB), grouped by source ---`);
    for (const [file, ids] of Object.entries(files)) {
      const missing = ids.filter(id => !dbIds.has(id));
      if (missing.length > 0) {
        console.log(`\n  [${file}] (${missing.length} missing from DB):`);
        missing.forEach(id => console.log(`    - ${id}`));
      }
    }
  }

  const totalAfterSync = new Set([...dbIds, ...allLocalIds]).size;
  console.log(`\n=== TOTALS ===`);
  console.log(`Current DB count:         ${dbIds.size}`);
  console.log(`Unique local file count:  ${allLocalIds.size}`);
  console.log(`In both:                  ${dbIds.size - inDbOnly.length}`);
  console.log(`Total after full sync:    ${totalAfterSync}`);
}

main().catch(console.error);
