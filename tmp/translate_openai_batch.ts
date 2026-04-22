import { neon } from '@neondatabase/serverless';
import OpenAI from 'openai';
import { config } from 'dotenv';
config();

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANG_NAMES: Record<string, string> = {
  ja: 'Japanese', zh: 'Chinese (Simplified)', es: 'Spanish', fr: 'French', it: 'Italian'
};

async function translateText(text: string, targetLang: string): Promise<string> {
  const langName = LANG_NAMES[targetLang] || targetLang;
  // Truncate very long texts to save tokens (keep first 1500 chars for translation)
  const sourceText = text.length > 1500 ? text.substring(0, 1500) : text;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `You are a professional translator. Translate the following Korean/English text to ${langName}. Return ONLY the translated text, no explanations.` },
      { role: 'user', content: sourceText }
    ],
    max_tokens: 2000,
    temperature: 0.3
  });
  return res.choices[0]?.message?.content?.trim() || text;
}

async function processLanguage(targetLang: string) {
  console.log(`\n=== ${targetLang.toUpperCase()} (${LANG_NAMES[targetLang]}) ===`);

  const missing = await sql`
    SELECT id, narration_i18n
    FROM landmarks
    WHERE narration_i18n->>${targetLang} IS NULL
    ORDER BY id
  `;
  console.log(`Missing: ${missing.length}`);
  if (missing.length === 0) return;

  let done = 0, errors = 0;

  for (let i = 0; i < missing.length; i += 1) {
    const chunk = missing.slice(i, i + 1);
    for (const row of chunk) {
      try {
        const i18n = row.narration_i18n as Record<string, string>;
        const source = i18n?.ko || i18n?.en || '';
        if (!source || source.length < 20) { errors++; return; }

        const translated = await translateText(source, targetLang);
        if (!translated || translated === source) { errors++; return; }

        const updated = { ...i18n, [targetLang]: translated };
        await sql`
          UPDATE landmarks SET narration_i18n = ${JSON.stringify(updated)}::jsonb, updated_at = NOW()
          WHERE id = ${row.id}
        `;
        done++;
      } catch (e: any) {
        errors++;
        if (e?.status === 429) {
          console.log(`  Rate limited at ${done}/${missing.length}, waiting 60s...`);
          await new Promise(r => setTimeout(r, 60000));
          i--; // retry
          continue;
        }
      }
    }

    if ((done + errors) % 25 === 0 || i + 1 >= missing.length) {
      console.log(`  [${targetLang}] ${done + errors}/${missing.length} (ok=${done}, err=${errors})`);
    }
    // Rate limit: 1.5s between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`  DONE: ${done} translated, ${errors} errors, ${missing.length - done - errors} skipped`);
}

async function main() {
  const langs = process.argv[2]?.split(',') || ['ja', 'zh', 'es', 'fr', 'it'];
  console.log(`Translating to: ${langs.join(', ')}`);
  console.log(`Using OpenAI gpt-4o-mini\n`);

  for (const lang of langs) {
    await processLanguage(lang);
  }

  // Final coverage
  const r = await sql`SELECT COUNT(*) as total,
    SUM(CASE WHEN narration_i18n->>'ja' IS NOT NULL THEN 1 ELSE 0 END) as ja,
    SUM(CASE WHEN narration_i18n->>'zh' IS NOT NULL THEN 1 ELSE 0 END) as zh,
    SUM(CASE WHEN narration_i18n->>'es' IS NOT NULL THEN 1 ELSE 0 END) as es,
    SUM(CASE WHEN narration_i18n->>'fr' IS NOT NULL THEN 1 ELSE 0 END) as fr,
    SUM(CASE WHEN narration_i18n->>'it' IS NOT NULL THEN 1 ELSE 0 END) as it
  FROM landmarks`;
  console.log('\n=== FINAL COVERAGE ===');
  console.table(r);
}

main().catch(console.error);
