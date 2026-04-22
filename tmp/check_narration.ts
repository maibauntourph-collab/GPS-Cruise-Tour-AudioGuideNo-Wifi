import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  // 1. Total overview
  const totals = await sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN LENGTH(narration) < 300 THEN 1 ELSE 0 END) AS under_300,
      SUM(CASE WHEN LENGTH(narration) >= 300 THEN 1 ELSE 0 END) AS over_300,
      MIN(LENGTH(narration)) AS min_len,
      MAX(LENGTH(narration)) AS max_len,
      ROUND(AVG(LENGTH(narration))) AS avg_len
    FROM landmarks
  `;
  console.log('=== OVERALL TOTALS ===');
  console.table(totals);

  // 2. Summary by city
  const summary = await sql`
    SELECT
      city_id,
      COUNT(*) AS total,
      SUM(CASE WHEN LENGTH(narration) < 300 THEN 1 ELSE 0 END) AS under_300,
      SUM(CASE WHEN LENGTH(narration) >= 300 THEN 1 ELSE 0 END) AS over_300
    FROM landmarks
    GROUP BY city_id
    ORDER BY under_300 DESC
  `;
  console.log('\n=== SUMMARY BY CITY ===');
  console.table(summary);

  // 3. Under 300 list
  const under = await sql`
    SELECT id, city_id, name, LENGTH(narration) AS len
    FROM landmarks
    WHERE LENGTH(narration) < 300
    ORDER BY LENGTH(narration) ASC
  `;
  console.log('\n=== LANDMARKS UNDER 300 CHARS (' + under.length + ' total) ===');
  console.table(under);

  // 4. Over 300 - just count per city
  const over = await sql`
    SELECT city_id, COUNT(*) AS count, ROUND(AVG(LENGTH(narration))) AS avg_len
    FROM landmarks
    WHERE LENGTH(narration) >= 300
    GROUP BY city_id
    ORDER BY count DESC
  `;
  console.log('\n=== OVER 300 BY CITY ===');
  console.table(over);
}

main().catch(console.error);
