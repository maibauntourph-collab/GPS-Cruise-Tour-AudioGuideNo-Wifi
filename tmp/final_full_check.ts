import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN narration_i18n->>'ko' IS NOT NULL THEN 1 ELSE 0 END) as has_ko,
      SUM(CASE WHEN narration_i18n->>'en' IS NOT NULL THEN 1 ELSE 0 END) as has_en,
      SUM(CASE WHEN narration_i18n->>'en' ~ '[가-힣]' THEN 1 ELSE 0 END) as en_has_korean,
      SUM(CASE WHEN LENGTH(narration_i18n->>'ko') >= 300 THEN 1 ELSE 0 END) as ko_good,
      SUM(CASE WHEN LENGTH(narration_i18n->>'en') >= 100 THEN 1 ELSE 0 END) as en_good,
      ROUND(AVG(LENGTH(narration_i18n->>'ko'))) as avg_ko,
      ROUND(AVG(LENGTH(narration_i18n->>'en'))) as avg_en
    FROM landmarks
  `;
  console.log('=== DB FINAL STATUS (563 landmarks) ===');
  console.table(stats);

  // City breakdown
  const cities = await sql`
    SELECT city_id, COUNT(*) as count,
      SUM(CASE WHEN narration_i18n->>'ko' IS NOT NULL THEN 1 ELSE 0 END) as ko,
      SUM(CASE WHEN narration_i18n->>'en' IS NOT NULL THEN 1 ELSE 0 END) as en
    FROM landmarks GROUP BY city_id ORDER BY count DESC
  `;
  console.log('\n=== PER CITY ===');
  console.table(cities);

  // Missing ko
  const missingKo = await sql`
    SELECT id, city_id FROM landmarks WHERE narration_i18n->>'ko' IS NULL ORDER BY city_id
  `;
  console.log(`\n=== MISSING KO: ${missingKo.length} ===`);
  if (missingKo.length > 0) console.table(missingKo);

  // Code changes summary
  console.log('\n=== CODE CHANGES ===');
  console.log('1. client/src/lib/translations.ts - Quality gate + Korean fallback');
  console.log('2. server/routes.ts - PUT endpoint narrationI18n auto-sync');
  console.log('3. client/src/hooks/useOfflineMode.ts - narrationI18n priority + multi-lang download');
  console.log('4. client/public/service-worker.js - fallback narrationI18n');
  console.log('5. scripts/translate-narrations-batch.ts - 5-lang pipeline (ready to run)');
  console.log('6. docs/readme.md - Project documentation');
}
main().catch(console.error);
