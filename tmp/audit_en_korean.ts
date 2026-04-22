import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
);

async function main() {
  console.log('=== Audit: Korean text in narration_i18n.en ===\n');

  // 1. Count landmarks where narration_i18n->>'en' contains Korean characters
  const countResult = await sql`
    SELECT COUNT(*) as cnt
    FROM landmarks
    WHERE narration_i18n->>'en' ~ '[가-힣]'
  `;
  const totalKorean = Number(countResult[0].cnt);
  console.log(`Total landmarks with Korean chars in narration_i18n.en: ${totalKorean}\n`);

  if (totalKorean === 0) {
    console.log('No data quality issues found. All narration_i18n.en fields are Korean-free.');
    process.exit(0);
  }

  // 2. List those landmark IDs with en text preview (first 60 chars)
  // 3. Check if translations->'en'->>'narration' exists as alternative English source
  const rows = await sql`
    SELECT
      id,
      name,
      LEFT(narration_i18n->>'en', 60) AS en_preview,
      translations->'en'->>'narration' AS translations_en_narration
    FROM landmarks
    WHERE narration_i18n->>'en' ~ '[가-힣]'
    ORDER BY id
  `;

  console.log('--- Affected landmarks ---\n');

  const autoFixable: typeof rows = [];
  const needManual: typeof rows = [];

  for (const row of rows) {
    const hasAltEnglish = row.translations_en_narration
      && row.translations_en_narration.trim().length > 0
      && !/[가-힣]/.test(row.translations_en_narration);

    console.log(`ID: ${row.id}`);
    console.log(`  Name: ${row.name}`);
    console.log(`  en preview: ${row.en_preview}`);
    console.log(`  translations.en.narration: ${hasAltEnglish ? 'YES (English)' : row.translations_en_narration ? 'EXISTS but contains Korean' : 'MISSING'}`);
    console.log('');

    if (hasAltEnglish) {
      autoFixable.push(row);
    } else {
      needManual.push(row);
    }
  }

  // 4. Summary report
  console.log('=== SUMMARY ===');
  console.log(`Total affected: ${totalKorean}`);
  console.log(`Auto-fixable (have English in translations.en.narration): ${autoFixable.length}`);
  if (autoFixable.length > 0) {
    console.log(`  IDs: ${autoFixable.map(r => r.id).join(', ')}`);
  }
  console.log(`Need manual translation: ${needManual.length}`);
  if (needManual.length > 0) {
    console.log(`  IDs: ${needManual.map(r => r.id).join(', ')}`);
  }
}

main().catch(console.error);
