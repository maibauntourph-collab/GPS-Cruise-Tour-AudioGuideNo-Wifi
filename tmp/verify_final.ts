import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  // 1. 13 landmarks check
  const ids = [
    'kr-seoul-gyeongbokgung','kr-seoul-n-tower','kr-seoul-bukchon','kr-seoul-myeongdong',
    'kr-seoul-gwangjang-market','kr-seoul-lotte-world','kr-seoul-the-hyundai','kr-seoul-seongsu',
    'kr-global-olive-young','kr-seoul-london-bagel','kr-seoul-myeongdong-gyoja',
    'kr-busan-haeundae','kr-jeju-seongsan'
  ];

  console.log('=== 13 Landmarks - TTS Resolution ===');
  for (const id of ids) {
    const rows = await sql`
      SELECT id, name,
        LENGTH(narration) as base_len,
        LENGTH(narration_i18n->>'ko') as ko_len,
        LENGTH(narration_i18n->>'en') as en_len
      FROM landmarks WHERE id = ${id}
    `;
    if (rows.length === 0) continue;
    const r = rows[0];
    const koOk = r.ko_len && Number(r.ko_len) > 300 ? 'OK' : 'BAD';
    console.log(`[${koOk}] ${r.id} | base=${r.base_len} | i18n.ko=${r.ko_len} | i18n.en=${r.en_len || 'null'}`);
  }

  // 2. Global stats
  const stats = await sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN LENGTH(narration_i18n->>'ko') >= 300 THEN 1 ELSE 0 END) as ko_ok,
      SUM(CASE WHEN narration_i18n->>'ko' IS NULL OR LENGTH(narration_i18n->>'ko') < 300 THEN 1 ELSE 0 END) as ko_short,
      SUM(CASE WHEN narration_i18n->>'en' IS NOT NULL THEN 1 ELSE 0 END) as has_en,
      ROUND(AVG(LENGTH(narration_i18n->>'ko'))) as avg_ko_len
    FROM landmarks
  `;
  console.log('\n=== Global Stats ===');
  console.table(stats);

  // 3. Any remaining issues?
  const issues = await sql`
    SELECT id, name, LENGTH(narration_i18n->>'ko') as ko_len
    FROM landmarks
    WHERE narration_i18n->>'ko' IS NULL OR LENGTH(narration_i18n->>'ko') < 300
    ORDER BY ko_len ASC NULLS FIRST
    LIMIT 10
  `;
  console.log('\n=== Remaining Issues (ko < 300) ===');
  if (issues.length === 0) console.log('NONE - All clear!');
  else console.table(issues);
}

main().catch(console.error);
