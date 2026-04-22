import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  // Get short narrations
  const short = await sql`
    SELECT id, city_id, name, narration, LENGTH(narration) as len
    FROM landmarks
    WHERE LENGTH(narration) < 300
    ORDER BY city_id, id
  `;

  for (const r of short) {
    console.log(`[${r.id}] ${r.name} (${r.city_id}) len=${r.len}`);
    console.log(`  narration: "${r.narration}"`);
    console.log();
  }

  // Get one good example for style reference
  const good = await sql`
    SELECT id, name, narration, LENGTH(narration) as len
    FROM landmarks WHERE city_id='seoul' AND LENGTH(narration) > 2000 LIMIT 1
  `;
  console.log('=== GOOD STYLE EXAMPLE ===');
  console.log(`[${good[0]?.id}] ${good[0]?.name} len=${good[0]?.len}`);
  console.log(good[0]?.narration);
}

main().catch(console.error);
