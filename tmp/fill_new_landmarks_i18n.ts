import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function step1_fillKo() {
  console.log('=== Step 1: Fill narrationI18n.ko from narration (Korean text) ===\n');

  const rows = await sql`
    SELECT id, narration, narration_i18n
    FROM landmarks
    WHERE narration_i18n->>'ko' IS NULL
      AND narration ~ '[가-힣]'
  `;
  console.log(`Found ${rows.length} landmarks missing narrationI18n.ko with Korean narration`);

  if (rows.length === 0) return 0;

  let updated = 0;
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    await Promise.all(chunk.map(async (row) => {
      const narration = row.narration as string;
      const existing = (row.narration_i18n as Record<string, string>) || {};
      const newI18n = { ...existing, ko: narration };

      await sql`
        UPDATE landmarks
        SET narration_i18n = ${JSON.stringify(newI18n)}::jsonb,
            updated_at = NOW()
        WHERE id = ${row.id}
      `;
      updated++;
    }));
    console.log(`  Chunk ${Math.floor(i / 25) + 1}/${Math.ceil(rows.length / 25)} done`);
  }

  console.log(`Step 1 result: Updated ${updated} landmarks\n`);
  return updated;
}

async function step2_fillEn() {
  console.log('=== Step 2: Fill narrationI18n.en from translations.en.narration ===\n');

  const rows = await sql`
    SELECT id, narration_i18n, translations
    FROM landmarks
    WHERE narration_i18n->>'en' IS NULL
      AND translations->'en'->>'narration' IS NOT NULL
      AND LENGTH(translations->'en'->>'narration') > 50
  `;
  console.log(`Found ${rows.length} landmarks missing narrationI18n.en with valid translations.en.narration`);

  if (rows.length === 0) return 0;

  let updated = 0;
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    await Promise.all(chunk.map(async (row) => {
      const translations = row.translations as any;
      const enNarration = translations?.en?.narration as string;
      if (!enNarration) return;

      const existing = (row.narration_i18n as Record<string, string>) || {};
      const newI18n = { ...existing, en: enNarration };

      await sql`
        UPDATE landmarks
        SET narration_i18n = ${JSON.stringify(newI18n)}::jsonb,
            updated_at = NOW()
        WHERE id = ${row.id}
      `;
      updated++;
    }));
    console.log(`  Chunk ${Math.floor(i / 25) + 1}/${Math.ceil(rows.length / 25)} done`);
  }

  console.log(`Step 2 result: Updated ${updated} landmarks\n`);
  return updated;
}

async function step3_fixKoreanInEn() {
  console.log('=== Step 3: Fix narrationI18n.en containing Korean text ===\n');

  const rows = await sql`
    SELECT id, narration_i18n, translations
    FROM landmarks
    WHERE narration_i18n->>'en' ~ '[가-힣]'
  `;
  console.log(`Found ${rows.length} landmarks with Korean text in narrationI18n.en`);

  if (rows.length === 0) return 0;

  let fixed = 0;
  let skipped = 0;
  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    await Promise.all(chunk.map(async (row) => {
      const translations = row.translations as any;
      const enNarration = translations?.en?.narration as string;

      // Check that replacement exists and is actually English (no Korean chars)
      if (!enNarration || /[가-힣]/.test(enNarration)) {
        skipped++;
        return;
      }

      const existing = (row.narration_i18n as Record<string, string>) || {};
      const newI18n = { ...existing, en: enNarration };

      await sql`
        UPDATE landmarks
        SET narration_i18n = ${JSON.stringify(newI18n)}::jsonb,
            updated_at = NOW()
        WHERE id = ${row.id}
      `;
      fixed++;
    }));
    console.log(`  Chunk ${Math.floor(i / 25) + 1}/${Math.ceil(rows.length / 25)} done`);
  }

  console.log(`Step 3 result: Fixed ${fixed}, Skipped ${skipped} (no valid English replacement)\n`);
  return fixed;
}

async function verify() {
  console.log('=== Verification ===\n');

  const stats = await sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN narration_i18n->>'ko' IS NOT NULL THEN 1 ELSE 0 END) AS has_ko,
      SUM(CASE WHEN narration_i18n->>'ko' IS NULL THEN 1 ELSE 0 END) AS missing_ko,
      SUM(CASE WHEN narration_i18n->>'en' IS NOT NULL THEN 1 ELSE 0 END) AS has_en,
      SUM(CASE WHEN narration_i18n->>'en' IS NULL THEN 1 ELSE 0 END) AS missing_en,
      SUM(CASE WHEN narration_i18n->>'en' ~ '[가-힣]' THEN 1 ELSE 0 END) AS en_with_korean
    FROM landmarks
  `;
  console.log('Final state:');
  console.log(JSON.stringify(stats[0], null, 2));
}

async function main() {
  console.log('========================================');
  console.log('Fill new landmarks i18n narrations');
  console.log('========================================\n');

  const s1 = await step1_fillKo();
  const s2 = await step2_fillEn();
  const s3 = await step3_fixKoreanInEn();

  console.log('========================================');
  console.log(`Summary: Step1=${s1} ko filled, Step2=${s2} en filled, Step3=${s3} en fixed`);
  console.log('========================================\n');

  await verify();
}

main().catch(console.error);
