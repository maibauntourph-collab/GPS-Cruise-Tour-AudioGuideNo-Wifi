import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config();

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const LANG_NAMES: Record<string, string> = {
  ja: 'Japanese', zh: 'Chinese Simplified', es: 'Spanish', fr: 'French', it: 'Italian'
};

async function translateText(text: string, targetLang: string): Promise<string> {
  const langName = LANG_NAMES[targetLang] || targetLang;
  const sourceText = text.length > 1500 ? text.substring(0, 1500) : text;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Translate the following text to ${langName}. Return ONLY the translated text, nothing else.\n\n${sourceText}` }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    if (res.status === 429) throw { status: 429, message: 'Rate limited' };
    throw new Error(`Gemini API ${res.status}: ${err.substring(0, 100)}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
}

async function processLanguage(targetLang: string) {
  console.log(`\n=== ${targetLang.toUpperCase()} (${LANG_NAMES[targetLang]}) ===`);

  const missing = await sql`
    SELECT id, narration_i18n FROM landmarks
    WHERE narration_i18n->>${targetLang} IS NULL
    ORDER BY id
  `;
  console.log(`Missing: ${missing.length}`);
  if (missing.length === 0) return;

  let done = 0, errors = 0;

  for (let i = 0; i < missing.length; i++) {
    const row = missing[i];
    try {
      const i18n = row.narration_i18n as Record<string, string>;
      const source = i18n?.ko || i18n?.en || '';
      if (!source || source.length < 20) { errors++; continue; }

      const translated = await translateText(source, targetLang);
      if (!translated || translated === source) { errors++; continue; }

      const updated = { ...i18n, [targetLang]: translated };
      await sql`
        UPDATE landmarks SET narration_i18n = ${JSON.stringify(updated)}::jsonb, updated_at = NOW()
        WHERE id = ${row.id}
      `;
      done++;
    } catch (e: any) {
      if (e?.status === 429) {
        console.log(`  Rate limited at ${done}/${missing.length}, waiting 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        i--; // retry
        continue;
      }
      errors++;
    }

    if ((done + errors) % 25 === 0) {
      console.log(`  [${targetLang}] ${done + errors}/${missing.length} (ok=${done}, err=${errors})`);
    }
    // Gemini free tier: 15 RPM → 4s between requests
    await new Promise(r => setTimeout(r, 4200));
  }

  console.log(`  DONE [${targetLang}]: ${done} translated, ${errors} errors`);
}

async function main() {
  const langs = process.argv[2]?.split(',') || ['ja', 'zh', 'es', 'fr', 'it'];
  console.log(`Translating to: ${langs.join(', ')}`);
  console.log(`Using Gemini 2.0 Flash (free tier ~15 RPM)\n`);
  console.log(`Estimated time: ${Math.ceil(langs.reduce((sum, l) => sum + 563, 0) * 4.2 / 60)} minutes\n`);

  for (const lang of langs) {
    await processLanguage(lang);
  }

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
