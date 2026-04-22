import { neon } from '@neondatabase/serverless';
const s = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
async function main() {
  const r = await s`SELECT COUNT(*) as total,
    SUM(CASE WHEN narration_i18n->>'ko' IS NOT NULL THEN 1 ELSE 0 END) as ko,
    SUM(CASE WHEN narration_i18n->>'en' IS NOT NULL THEN 1 ELSE 0 END) as en,
    SUM(CASE WHEN narration_i18n->>'ja' IS NOT NULL THEN 1 ELSE 0 END) as ja,
    SUM(CASE WHEN narration_i18n->>'zh' IS NOT NULL THEN 1 ELSE 0 END) as zh,
    SUM(CASE WHEN narration_i18n->>'es' IS NOT NULL THEN 1 ELSE 0 END) as es,
    SUM(CASE WHEN narration_i18n->>'fr' IS NOT NULL THEN 1 ELSE 0 END) as fr,
    SUM(CASE WHEN narration_i18n->>'it' IS NOT NULL THEN 1 ELSE 0 END) as it
  FROM landmarks`;
  console.log('=== FINAL MULTILANG COVERAGE ===');
  console.table(r);
}
main().catch(console.error);
