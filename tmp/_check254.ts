import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const counts = await sql`
    SELECT 
      SUM(CASE WHEN translations->'en'->>'narration' IS NULL THEN 1 ELSE 0 END) as no_translation,
      SUM(CASE WHEN translations->'en'->>'narration' IS NOT NULL AND translations->'en'->>'narration' ~ '[가-힣]' THEN 1 ELSE 0 END) as translation_also_korean,
      SUM(CASE WHEN translations->'en'->>'narration' IS NOT NULL AND NOT translations->'en'->>'narration' ~ '[가-힣]' THEN 1 ELSE 0 END) as translation_is_english
    FROM landmarks
    WHERE narration_i18n->>'en' ~ '[가-힣]'
  `;
  console.log('Breakdown of Korean-in-en landmarks:');
  console.log(JSON.stringify(counts[0], null, 2));
}
main().catch(console.error);
