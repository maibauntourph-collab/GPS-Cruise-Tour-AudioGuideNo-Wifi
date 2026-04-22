/**
 * Batch Translation Pipeline for Landmark Narrations
 *
 * Translates narrationI18n entries to multiple target languages using the app's /api/translate endpoint.
 *
 * Usage:
 *   npx tsx scripts/translate-narrations-batch.ts --languages ja,zh,es,fr,it --dry-run
 *   npx tsx scripts/translate-narrations-batch.ts --languages ja,zh --batch-size 5
 *   npx tsx scripts/translate-narrations-batch.ts --languages es --batch-size 20
 *
 * Options:
 *   --languages   Comma-separated target language codes (required)
 *   --batch-size  Number of landmarks to process before pausing (default: 10)
 *   --dry-run     Only report counts, do not translate or write
 *   --api-url     Base URL for the translate API (default: http://localhost:5000)
 */

import { neon } from '@neondatabase/serverless';

// ── Config ──────────────────────────────────────────────────────────────────

const DATABASE_URL =
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const RATE_LIMIT_MS = 500; // delay between API calls

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  de: 'German',
  pt: 'Portuguese',
  ru: 'Russian',
};

// ── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let languages: string[] = [];
  let batchSize = 10;
  let dryRun = false;
  let apiUrl = 'http://localhost:5000';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--languages':
        languages = (args[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
        break;
      case '--batch-size':
        batchSize = parseInt(args[++i], 10) || 10;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--api-url':
        apiUrl = args[++i] || apiUrl;
        break;
    }
  }

  if (languages.length === 0) {
    console.error('Error: --languages is required (e.g. --languages ja,zh,es,fr,it)');
    process.exit(1);
  }

  const invalid = languages.filter((l) => !LANGUAGE_NAMES[l]);
  if (invalid.length > 0) {
    console.error(`Error: unsupported language codes: ${invalid.join(', ')}`);
    console.error(`Supported: ${Object.keys(LANGUAGE_NAMES).join(', ')}`);
    process.exit(1);
  }

  return { languages, batchSize, dryRun, apiUrl };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callTranslateApi(
  apiUrl: string,
  text: string,
  targetLanguage: string,
): Promise<string> {
  const res = await fetch(`${apiUrl}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { translatedText: string };
  return data.translatedText;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { languages, batchSize, dryRun, apiUrl } = parseArgs();
  const sql = neon(DATABASE_URL);

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Batch Narration Translation Pipeline              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`Mode:       ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Languages:  ${languages.map((l) => `${l} (${LANGUAGE_NAMES[l]})`).join(', ')}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`API URL:    ${apiUrl}`);
  console.log('');

  // Fetch all landmarks that have any narrationI18n data
  const allRows = await sql`
    SELECT id, name, narration_i18n
    FROM landmarks
    WHERE narration_i18n IS NOT NULL
      AND narration_i18n != '{}'::jsonb
    ORDER BY id
  `;

  console.log(`Total landmarks with narrationI18n: ${allRows.length}\n`);

  // ── Per-language processing ───────────────────────────────────────────

  const summary: { lang: string; needed: number; translated: number; failed: number }[] = [];

  for (const lang of languages) {
    console.log(`── Language: ${lang} (${LANGUAGE_NAMES[lang]}) ──`);

    // Find landmarks missing this language
    const missing: { id: number; name: string; sourceText: string; narrationI18n: Record<string, string> }[] = [];

    for (const row of allRows) {
      const i18n = (row.narration_i18n || {}) as Record<string, string>;

      // Resume support: skip if target language already exists
      if (i18n[lang] && i18n[lang].length > 0) continue;

      // Source text priority: ko > en
      const sourceText = i18n['ko'] || i18n['en'] || '';
      if (!sourceText || sourceText.length < 10) continue;

      missing.push({
        id: row.id as number,
        name: row.name as string,
        sourceText,
        narrationI18n: i18n,
      });
    }

    console.log(`  Landmarks needing ${lang} translation: ${missing.length}`);

    if (dryRun) {
      summary.push({ lang, needed: missing.length, translated: 0, failed: 0 });
      console.log('  (dry-run, skipping translation)\n');
      continue;
    }

    if (missing.length === 0) {
      summary.push({ lang, needed: 0, translated: 0, failed: 0 });
      console.log('  Nothing to do.\n');
      continue;
    }

    let translated = 0;
    let failed = 0;

    for (let i = 0; i < missing.length; i++) {
      const item = missing[i];
      const progress = `[${i + 1}/${missing.length}]`;

      try {
        process.stdout.write(`  ${progress} Translating ID=${item.id} "${item.name}" → ${lang}...`);

        const result = await callTranslateApi(apiUrl, item.sourceText, lang);

        // Save back to DB
        const updatedI18n = { ...item.narrationI18n, [lang]: result };

        await sql`
          UPDATE landmarks
          SET narration_i18n = ${JSON.stringify(updatedI18n)}::jsonb,
              updated_at = NOW()
          WHERE id = ${item.id}
        `;

        translated++;
        console.log(` OK (${result.length} chars)`);
      } catch (err: any) {
        failed++;
        console.log(` FAILED: ${err.message}`);
      }

      // Rate limit
      await sleep(RATE_LIMIT_MS);

      // Batch pause
      if ((i + 1) % batchSize === 0 && i + 1 < missing.length) {
        console.log(`  -- batch of ${batchSize} complete, continuing... --`);
      }
    }

    summary.push({ lang, needed: missing.length, translated, failed });
    console.log(`  Done: ${translated} translated, ${failed} failed\n`);
  }

  // ── Summary ───────────────────────────────────────────────────────────

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Summary                                          ║');
  console.log('╠══════════════════════════════════════════════════════╣');

  let totalNeeded = 0;
  let totalTranslated = 0;
  let totalFailed = 0;

  for (const s of summary) {
    const status = dryRun
      ? `${s.needed} needed`
      : `${s.translated}/${s.needed} done, ${s.failed} failed`;
    console.log(`║  ${s.lang.padEnd(5)} ${LANGUAGE_NAMES[s.lang].padEnd(20)} ${status.padEnd(25)}║`);
    totalNeeded += s.needed;
    totalTranslated += s.translated;
    totalFailed += s.failed;
  }

  console.log('╠══════════════════════════════════════════════════════╣');
  if (dryRun) {
    console.log(`║  Total translations needed: ${String(totalNeeded).padEnd(23)}║`);
    console.log(`║  Estimated API calls: ${String(totalNeeded).padEnd(29)}║`);
  } else {
    console.log(`║  Total: ${totalTranslated}/${totalNeeded} translated, ${String(totalFailed + ' failed').padEnd(18)}║`);
  }
  console.log('╚══════════════════════════════════════════════════════╝');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
