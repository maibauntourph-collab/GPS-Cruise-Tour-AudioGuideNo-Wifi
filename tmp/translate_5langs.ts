/**
 * Harvest existing translations from `translations` column into `narration_i18n`
 * for 5 target languages: ja, zh, es, fr, it
 *
 * Usage: npx tsx tmp/translate_5langs.ts
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL =
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

const TARGET_LANGS = ['ja', 'zh', 'es', 'fr', 'it'] as const;
const LANG_NAMES: Record<string, string> = {
  ja: 'Japanese',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
};

const BATCH_SIZE = 25;

interface Landmark {
  id: number;
  name: string;
  narration_i18n: Record<string, string> | null;
  translations: Record<string, any> | null;
}

async function main() {
  console.log('Fetching all landmarks...');
  const landmarks = (await sql`
    SELECT id, name, narration_i18n, translations
    FROM landmarks
    ORDER BY id
  `) as Landmark[];

  console.log(`Total landmarks: ${landmarks.length}\n`);

  const stats: Record<string, { filled: number; stillMissing: number }> = {};

  for (const lang of TARGET_LANGS) {
    stats[lang] = { filled: 0, stillMissing: 0 };

    // Find landmarks missing this language in narration_i18n
    const missing: Landmark[] = landmarks.filter((lm) => {
      const i18n = lm.narration_i18n;
      // Missing if narration_i18n is null, doesn't have the lang, or has empty/short value
      if (!i18n || !i18n[lang] || i18n[lang].trim().length < 10) return true;
      return false;
    });

    console.log(`\n[${ LANG_NAMES[lang] } (${lang})] Missing in narration_i18n: ${missing.length}`);

    // Check which ones have data in translations column
    const toUpdate: { id: number; narration: string }[] = [];
    for (const lm of missing) {
      const trans = lm.translations;
      if (trans && trans[lang] && typeof trans[lang] === 'object') {
        const narration = trans[lang].narration;
        if (narration && typeof narration === 'string' && narration.length > 50) {
          toUpdate.push({ id: lm.id, narration });
        }
      }
    }

    console.log(`  Can fill from translations column: ${toUpdate.length}`);
    console.log(`  Still need API translation: ${missing.length - toUpdate.length}`);

    stats[lang].filled = toUpdate.length;
    stats[lang].stillMissing = missing.length - toUpdate.length;

    // Process updates in batches of BATCH_SIZE
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toUpdate.length / BATCH_SIZE);
      console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} landmarks)...`);

      // Update each landmark in the batch
      const promises = batch.map(async (item) => {
        // Use jsonb_set to add/update the language key in narration_i18n
        // If narration_i18n is null, initialize it first
        await sql`
          UPDATE landmarks
          SET narration_i18n = jsonb_set(
            COALESCE(narration_i18n, '{}'::jsonb),
            ${`{${lang}}`}::text[],
            to_jsonb(${item.narration}::text)
          )
          WHERE id = ${item.id}
        `;
      });

      await Promise.all(promises);
    }

    if (toUpdate.length > 0) {
      console.log(`  Done writing ${toUpdate.length} ${lang} narrations.`);
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('  TRANSLATION HARVEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`${'Language'.padEnd(12)} ${'Filled'.padStart(8)} ${'Missing'.padStart(10)}`);
  console.log('-'.repeat(32));

  let totalFilled = 0;
  let totalMissing = 0;
  for (const lang of TARGET_LANGS) {
    const s = stats[lang];
    totalFilled += s.filled;
    totalMissing += s.stillMissing;
    console.log(
      `${(LANG_NAMES[lang] + ` (${lang})`).padEnd(12)} ${String(s.filled).padStart(8)} ${String(s.stillMissing).padStart(10)}`
    );
  }
  console.log('-'.repeat(32));
  console.log(`${'TOTAL'.padEnd(12)} ${String(totalFilled).padStart(8)} ${String(totalMissing).padStart(10)}`);
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
