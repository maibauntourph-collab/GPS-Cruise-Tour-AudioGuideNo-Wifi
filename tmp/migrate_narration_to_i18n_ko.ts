import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  console.log('=== Phase 1B: narration → narrationI18n.ko Migration ===\n');

  const rows = await sql`
    SELECT id, narration, narration_i18n
    FROM landmarks ORDER BY id
  `;
  console.log(`Total landmarks: ${rows.length}`);

  let updated = 0;
  let skipped = 0;

  // Process in chunks of 25
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    await Promise.all(chunk.map(async (row) => {
      const narration = row.narration as string;
      const existing = row.narration_i18n as Record<string, string> | null;

      if (existing?.ko && existing.ko.length >= narration.length) {
        skipped++;
        return;
      }

      const newI18n = { ...(existing || {}), ko: narration };

      await sql`
        UPDATE landmarks
        SET narration_i18n = ${JSON.stringify(newI18n)}::jsonb,
            updated_at = NOW()
        WHERE id = ${row.id}
      `;
      updated++;
    }));
    console.log(`  Chunk ${Math.floor(i/25)+1}/${Math.ceil(rows.length/25)} done`);
  }

  console.log(`\nResults: Updated=${updated}, Skipped=${skipped}`);

  // Verify
  const verify = await sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN narration_i18n->>'ko' IS NOT NULL THEN 1 ELSE 0 END) AS has_ko,
      SUM(CASE WHEN narration_i18n->>'ko' IS NULL THEN 1 ELSE 0 END) AS missing_ko,
      ROUND(AVG(LENGTH(narration_i18n->>'ko'))) AS avg_ko_len,
      MIN(LENGTH(narration_i18n->>'ko')) AS min_ko_len,
      MAX(LENGTH(narration_i18n->>'ko')) AS max_ko_len
    FROM landmarks
  `;
  console.log('\n=== Verification ===');
  console.table(verify);
}

main().catch(console.error);
