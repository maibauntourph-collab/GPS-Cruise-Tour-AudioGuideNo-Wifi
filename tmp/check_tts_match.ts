import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const ids = [
    'kr-seoul-gyeongbokgung','kr-seoul-n-tower','kr-seoul-bukchon','kr-seoul-myeongdong',
    'kr-seoul-gwangjang-market','kr-seoul-lotte-world','kr-seoul-the-hyundai','kr-seoul-seongsu',
    'kr-global-olive-young','kr-seoul-london-bagel','kr-seoul-myeongdong-gyoja',
    'kr-busan-haeundae','kr-jeju-seongsan'
  ];

  console.log('=== TTS-Narration Matching Analysis ===\n');
  console.log('Resolution priority: 1) narrationI18n[lang] → 2) translations[lang].narration → 3) narration field\n');

  for (const id of ids) {
    const rows = await sql`
      SELECT id, name,
        LENGTH(narration) as narration_len,
        LEFT(narration, 50) as narration_preview,
        narration_i18n,
        translations
      FROM landmarks WHERE id = ${id}
    `;
    if (rows.length === 0) continue;
    const r = rows[0];

    console.log(`--- [${r.id}] ${r.name} ---`);

    // Check narration field (3rd priority / fallback)
    console.log(`  [3] narration (fallback): ${r.narration_len} chars → "${r.narration_preview}..."`);

    // Check narrationI18n (1st priority)
    const i18n = r.narration_i18n as Record<string, string> | null;
    if (i18n && Object.keys(i18n).length > 0) {
      console.log(`  [1] narrationI18n: ✅ langs=[${Object.keys(i18n).join(',')}]`);
      for (const [lang, text] of Object.entries(i18n)) {
        console.log(`      ${lang}: ${(text as string).length} chars → "${(text as string).substring(0, 40)}..."`);
      }
    } else {
      console.log(`  [1] narrationI18n: ❌ EMPTY/NULL`);
    }

    // Check translations (2nd priority)
    const trans = r.translations as Record<string, any> | null;
    if (trans && Object.keys(trans).length > 0) {
      const langsWithNarration = Object.entries(trans)
        .filter(([, v]) => v && v.narration)
        .map(([lang, v]) => `${lang}(${(v.narration as string).length}ch)`);
      if (langsWithNarration.length > 0) {
        console.log(`  [2] translations.narration: ✅ [${langsWithNarration.join(', ')}]`);
      } else {
        console.log(`  [2] translations.narration: ❌ no narration in translations`);
      }
    } else {
      console.log(`  [2] translations: ❌ EMPTY/NULL`);
    }

    // TTS resolution result per language
    const languages = ['ko', 'en', 'ja', 'es'];
    for (const lang of languages) {
      let resolvedText = '';
      let source = '';

      // Priority 1: narrationI18n
      if (i18n && i18n[lang]) {
        resolvedText = i18n[lang];
        source = 'narrationI18n';
      }
      // Priority 2: translations
      else if (trans && trans[lang]?.narration) {
        resolvedText = trans[lang].narration;
        source = 'translations';
      }
      // Priority 3: fallback to en in i18n/translations, then narration field
      else if (lang !== 'en' && i18n && i18n['en']) {
        resolvedText = i18n['en'];
        source = 'narrationI18n[en] fallback';
      } else if (lang !== 'en' && trans && trans['en']?.narration) {
        resolvedText = trans['en'].narration;
        source = 'translations[en] fallback';
      } else {
        resolvedText = r.narration_preview + '...';
        source = 'narration field (base)';
      }

      const match = resolvedText.length >= 300 ? '✅' : '⚠️ SHORT';
      console.log(`  → TTS[${lang}]: ${match} ${resolvedText.length}ch via ${source}`);
    }
    console.log();
  }
}

main().catch(console.error);
