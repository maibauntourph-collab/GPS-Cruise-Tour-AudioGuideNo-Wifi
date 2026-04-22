import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const ids = [
    'kr-seoul-gyeongbokgung','kr-seoul-n-tower','kr-seoul-bukchon','kr-seoul-myeongdong',
    'kr-seoul-gwangjang-market','kr-seoul-lotte-world','kr-seoul-the-hyundai','kr-seoul-seongsu',
    'kr-global-olive-young','kr-seoul-london-bagel','kr-seoul-myeongdong-gyoja',
    'kr-busan-haeundae','kr-jeju-seongsan'
  ];

  for (const id of ids) {
    const rows = await sql`
      SELECT id, city_id, name, narration, LENGTH(narration) as len
      FROM landmarks WHERE id = ${id}
    `;
    if (rows.length > 0) {
      const r = rows[0];
      console.log('======================================================================');
      console.log(`[${r.id}] ${r.name} (${r.city_id}) - ${r.len} chars`);
      console.log('======================================================================');
      console.log(r.narration);
      console.log();
    }
  }
}

main().catch(console.error);
