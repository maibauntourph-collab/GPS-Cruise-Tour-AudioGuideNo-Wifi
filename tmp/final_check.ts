import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const r = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN LENGTH(narration_i18n->>'ko') >= 300 THEN 1 ELSE 0 END) as ko_ok,
      SUM(CASE WHEN LENGTH(narration_i18n->>'en') >= 300 THEN 1 ELSE 0 END) as en_ok,
      SUM(CASE WHEN LENGTH(narration_i18n->>'en') < 50 THEN 1 ELSE 0 END) as en_critical,
      ROUND(AVG(LENGTH(narration_i18n->>'ko'))) as avg_ko,
      ROUND(AVG(LENGTH(narration_i18n->>'en'))) as avg_en
    FROM landmarks
  `;
  console.log('=== FINAL STATUS ===');
  console.table(r);

  const kr = await sql`
    SELECT id, LENGTH(narration_i18n->>'ko') as ko, LENGTH(narration_i18n->>'en') as en
    FROM landmarks WHERE id LIKE 'kr-%' ORDER BY id
  `;
  console.log('\n=== kr-* landmarks ===');
  console.table(kr);
}
main().catch(console.error);
