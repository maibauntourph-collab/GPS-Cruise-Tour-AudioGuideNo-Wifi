import { neon } from '@neondatabase/serverless';
const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
async function run() {
  const rows = await sql`SELECT id, city_id, name FROM landmarks LIMIT 3`;
  for (const r of rows) process.stdout.write(JSON.stringify(r) + '\n');
}
run().catch(e => { console.error(e); process.exit(1); });
