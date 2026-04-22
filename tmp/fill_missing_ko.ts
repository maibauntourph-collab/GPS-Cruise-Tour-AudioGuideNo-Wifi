import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
);

function containsHangul(text: string): boolean {
  return /[가-힣]/.test(text);
}

async function main() {
  console.log('=== Fill missing narrationI18n.ko ===\n');

  // Step 1: Find all landmarks where narrationI18n->>'ko' IS NULL
  const rows = await sql`
    SELECT id, name, narration, narration_i18n, translations
    FROM landmarks
    WHERE narration_i18n->>'ko' IS NULL
       OR narration_i18n IS NULL
    ORDER BY id
  `;

  console.log(`Found ${rows.length} landmarks missing narrationI18n.ko\n`);

  let filled = 0;
  let skipped = 0;
  const skippedIds: number[] = [];

  // Step 2: Process in batches of 25
  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25);
    const batchNum = Math.floor(i / 25) + 1;
    const totalBatches = Math.ceil(rows.length / 25);

    await Promise.all(
      batch.map(async (row) => {
        const id = row.id as number;
        const name = row.name as string;
        const narration = row.narration as string | null;
        const existing = (row.narration_i18n as Record<string, string>) || {};
        const translations = row.translations as Record<string, any> | null;

        let koText: string | null = null;

        // Strategy A: narration field contains Korean
        if (narration && containsHangul(narration)) {
          koText = narration;
          console.log(`  [${id}] ${name} — Korean found in narration field`);
        }
        // Strategy B: narration is English, check translations.ko.narration
        else if (narration && translations?.ko?.narration && translations.ko.narration.length > 50) {
          koText = translations.ko.narration;
          console.log(`  [${id}] ${name} — Using translations.ko.narration (${translations.ko.narration.length} chars)`);
        }

        if (koText) {
          // Merge: preserve existing keys, add ko
          const merged = { ...existing, ko: koText };
          await sql`
            UPDATE landmarks
            SET narration_i18n = ${JSON.stringify(merged)}::jsonb,
                updated_at = NOW()
            WHERE id = ${id}
          `;
          filled++;
        } else {
          skipped++;
          skippedIds.push(id);
          console.log(`  [${id}] ${name} — SKIPPED (no Korean source available)`);
        }
      })
    );

    console.log(`  Batch ${batchNum}/${totalBatches} complete\n`);
  }

  // Step 3: Report
  console.log('=== Results ===');
  console.log(`Filled:  ${filled}`);
  console.log(`Skipped: ${skipped}`);

  if (skippedIds.length > 0) {
    console.log(`Skipped IDs: ${skippedIds.join(', ')}`);
  }

  // Verify remaining missing
  const remaining = await sql`
    SELECT COUNT(*) AS cnt
    FROM landmarks
    WHERE narration_i18n->>'ko' IS NULL
       OR narration_i18n IS NULL
  `;
  console.log(`Remaining missing ko: ${remaining[0].cnt}`);

  const total = await sql`SELECT COUNT(*) AS cnt FROM landmarks`;
  console.log(`Total landmarks: ${total[0].cnt}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
