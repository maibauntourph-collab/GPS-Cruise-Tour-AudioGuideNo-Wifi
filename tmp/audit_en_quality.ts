import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
);

interface Row {
  id: number;
  city_id: number;
  name: string;
  en_len: number;
  en_preview: string;
}

async function main() {
  // 1. Query all landmarks
  const rows: Row[] = await sql`
    SELECT
      id,
      city_id,
      name,
      COALESCE(LENGTH(narration_i18n->>'en'), 0) AS en_len,
      COALESCE(LEFT(narration_i18n->>'en', 80), '[NULL]') AS en_preview
    FROM landmarks
    ORDER BY en_len ASC
  ` as any;

  console.log(`\n=== ENGLISH NARRATION QUALITY AUDIT ===`);
  console.log(`Total landmarks: ${rows.length}\n`);

  // 2. Classify
  const critical: Row[] = [];
  const short: Row[] = [];
  const ok: Row[] = [];
  const good: Row[] = [];

  for (const r of rows) {
    const len = Number(r.en_len);
    if (len < 50) critical.push(r);
    else if (len < 200) short.push(r);
    else if (len < 500) ok.push(r);
    else good.push(r);
  }

  // 3a. Count per category
  console.log(`--- COUNT PER CATEGORY ---`);
  console.log(`CRITICAL (< 50 chars):   ${critical.length}`);
  console.log(`SHORT    (50-199 chars): ${short.length}`);
  console.log(`OK       (200-499 chars):${ok.length}`);
  console.log(`GOOD     (500+ chars):   ${good.length}`);
  console.log();

  // 3b. List all CRITICAL entries
  if (critical.length > 0) {
    console.log(`--- CRITICAL ENTRIES (en_len < 50) ---`);
    console.log(`${'ID'.padStart(5)} | ${'CITY'.padStart(4)} | ${'LEN'.padStart(4)} | NAME / PREVIEW`);
    console.log('-'.repeat(90));
    for (const r of critical) {
      console.log(
        `${String(r.id).padStart(5)} | ${String(r.city_id).padStart(4)} | ${String(r.en_len).padStart(4)} | ${r.name}`
      );
      console.log(`      |      |      | > ${r.en_preview}`);
    }
    console.log();
  }

  // 3c. Count per city_id for SHORT + CRITICAL
  const problemsByCity = new Map<number, { critical: number; short: number }>();
  for (const r of [...critical, ...short]) {
    const entry = problemsByCity.get(r.city_id) || { critical: 0, short: 0 };
    if (Number(r.en_len) < 50) entry.critical++;
    else entry.short++;
    problemsByCity.set(r.city_id, entry);
  }

  if (problemsByCity.size > 0) {
    console.log(`--- PROBLEM COUNT PER CITY (SHORT + CRITICAL) ---`);
    console.log(`${'CITY_ID'.padStart(7)} | ${'CRIT'.padStart(5)} | ${'SHORT'.padStart(5)} | ${'TOTAL'.padStart(5)}`);
    console.log('-'.repeat(35));
    const sorted = [...problemsByCity.entries()].sort((a, b) => {
      const totalA = a[1].critical + a[1].short;
      const totalB = b[1].critical + b[1].short;
      return totalB - totalA;
    });
    for (const [cityId, counts] of sorted) {
      console.log(
        `${String(cityId).padStart(7)} | ${String(counts.critical).padStart(5)} | ${String(counts.short).padStart(5)} | ${String(counts.critical + counts.short).padStart(5)}`
      );
    }
    console.log();
  }

  // 3d. Average en_len per city
  const cityStats = new Map<number, { total: number; count: number }>();
  for (const r of rows) {
    const entry = cityStats.get(r.city_id) || { total: 0, count: 0 };
    entry.total += Number(r.en_len);
    entry.count++;
    cityStats.set(r.city_id, entry);
  }

  console.log(`--- AVERAGE en_len PER CITY ---`);
  console.log(`${'CITY_ID'.padStart(7)} | ${'COUNT'.padStart(5)} | ${'AVG_LEN'.padStart(7)}`);
  console.log('-'.repeat(28));
  const citySorted = [...cityStats.entries()].sort((a, b) => {
    const avgA = a[1].total / a[1].count;
    const avgB = b[1].total / b[1].count;
    return avgA - avgB;
  });
  for (const [cityId, stats] of citySorted) {
    const avg = Math.round(stats.total / stats.count);
    console.log(
      `${String(cityId).padStart(7)} | ${String(stats.count).padStart(5)} | ${String(avg).padStart(7)}`
    );
  }

  console.log(`\n=== AUDIT COMPLETE ===\n`);
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
