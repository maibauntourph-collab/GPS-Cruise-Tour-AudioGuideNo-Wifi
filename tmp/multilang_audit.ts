import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
);

const TARGET_LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'it', 'pt', 'ru', 'de'] as const;
const MAJOR_5 = ['en', 'ja', 'zh', 'es', 'fr'] as const;

interface Landmark {
  id: number;
  city_id: number;
  name: string;
  narration: string | null;
  narration_i18n: Record<string, string> | null;
  translations: Record<string, any> | null;
}

interface City {
  id: number;
  name: string;
  country: string;
}

async function main() {
  // Fetch all landmarks
  const landmarks = (await sql`
    SELECT id, city_id, name, narration, narration_i18n, translations
    FROM landmarks
    ORDER BY id
  `) as Landmark[];

  // Fetch cities for context
  const cities = (await sql`SELECT id, name, country FROM cities`) as City[];
  const cityMap = new Map(cities.map(c => [c.id, c]));

  console.log('='.repeat(80));
  console.log('  MULTILINGUAL NARRATION AUDIT REPORT');
  console.log('  Total landmarks in DB:', landmarks.length);
  console.log('='.repeat(80));

  // ── SECTION 1: narration_i18n coverage ──
  console.log('\n\n── SECTION 1: narration_i18n COVERAGE ──\n');

  const i18nCoverage: Record<string, number> = {};
  const i18nLengths: Record<string, number[]> = {};

  for (const lang of TARGET_LANGS) {
    i18nCoverage[lang] = 0;
    i18nLengths[lang] = [];
  }

  // Also track any OTHER keys we find
  const allI18nKeys = new Set<string>();

  for (const lm of landmarks) {
    if (!lm.narration_i18n) continue;
    for (const [key, val] of Object.entries(lm.narration_i18n)) {
      allI18nKeys.add(key);
      if (val && typeof val === 'string' && val.trim().length > 0) {
        if (i18nCoverage[key] !== undefined) {
          i18nCoverage[key]++;
          i18nLengths[key].push(val.length);
        }
      }
    }
  }

  console.log('Language | Landmarks with narration_i18n | Avg Length (chars) | Min | Max');
  console.log('-'.repeat(80));
  for (const lang of TARGET_LANGS) {
    const count = i18nCoverage[lang];
    const lengths = i18nLengths[lang];
    const avg = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
    const min = lengths.length > 0 ? Math.min(...lengths) : 0;
    const max = lengths.length > 0 ? Math.max(...lengths) : 0;
    console.log(
      `  ${lang.padEnd(6)} | ${String(count).padStart(4)} / ${landmarks.length} (${((count / landmarks.length) * 100).toFixed(1)}%)`.padEnd(45) +
      `| ${String(avg).padStart(6)} | ${String(min).padStart(5)} | ${String(max).padStart(5)}`
    );
  }

  // Show any extra keys found
  const extraKeys = [...allI18nKeys].filter(k => !(TARGET_LANGS as readonly string[]).includes(k));
  if (extraKeys.length > 0) {
    console.log('\n  Extra narration_i18n keys found:', extraKeys.join(', '));
  }

  const zeroI18n = TARGET_LANGS.filter(l => i18nCoverage[l] === 0);
  console.log('\n  Languages with ZERO coverage in narration_i18n:', zeroI18n.length > 0 ? zeroI18n.join(', ') : 'NONE');

  // ── SECTION 2: translations coverage ──
  console.log('\n\n── SECTION 2: translations COVERAGE (narration subfield) ──\n');

  const transCoverage: Record<string, number> = {};
  const transLengths: Record<string, number[]> = {};
  const allTransKeys = new Set<string>();

  for (const lang of TARGET_LANGS) {
    transCoverage[lang] = 0;
    transLengths[lang] = [];
  }

  for (const lm of landmarks) {
    if (!lm.translations) continue;
    for (const [key, val] of Object.entries(lm.translations)) {
      allTransKeys.add(key);
      const narration = val?.narration || val?.description || '';
      if (narration && typeof narration === 'string' && narration.trim().length > 0) {
        // Map zh-CN, zh-TW etc to zh for counting
        const normalizedKey = key.startsWith('zh') ? 'zh' : key;
        if (transCoverage[normalizedKey] !== undefined) {
          transCoverage[normalizedKey]++;
          transLengths[normalizedKey].push(narration.length);
        }
      }
    }
  }

  console.log('Language | Landmarks with translations.narration | Avg Length | Min | Max');
  console.log('-'.repeat(80));
  for (const lang of TARGET_LANGS) {
    const count = transCoverage[lang];
    const lengths = transLengths[lang];
    const avg = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
    const min = lengths.length > 0 ? Math.min(...lengths) : 0;
    const max = lengths.length > 0 ? Math.max(...lengths) : 0;
    console.log(
      `  ${lang.padEnd(6)} | ${String(count).padStart(4)} / ${landmarks.length} (${((count / landmarks.length) * 100).toFixed(1)}%)`.padEnd(45) +
      `| ${String(avg).padStart(6)} | ${String(min).padStart(5)} | ${String(max).padStart(5)}`
    );
  }

  const extraTransKeys = [...allTransKeys].filter(k => !(TARGET_LANGS as readonly string[]).includes(k));
  if (extraTransKeys.length > 0) {
    console.log('\n  Extra translations keys found:', extraTransKeys.join(', '));
  }

  const zeroTrans = TARGET_LANGS.filter(l => transCoverage[l] === 0);
  console.log('\n  Languages with ZERO coverage in translations:', zeroTrans.length > 0 ? zeroTrans.join(', ') : 'NONE');

  // ── SECTION 3: Combined coverage (either source) ──
  console.log('\n\n── SECTION 3: COMBINED COVERAGE (narration_i18n OR translations) ──\n');

  for (const lang of TARGET_LANGS) {
    let combined = 0;
    for (const lm of landmarks) {
      const hasI18n = lm.narration_i18n && lm.narration_i18n[lang] && lm.narration_i18n[lang].trim().length > 0;
      let hasTrans = false;
      if (lm.translations) {
        // Check exact key and zh variants
        const keysToCheck = lang === 'zh' ? ['zh', 'zh-CN', 'zh-TW'] : [lang];
        for (const k of keysToCheck) {
          const v = lm.translations[k];
          if (v && (v.narration || v.description) && (v.narration || v.description).trim().length > 0) {
            hasTrans = true;
            break;
          }
        }
      }
      if (hasI18n || hasTrans) combined++;
    }
    console.log(`  ${lang.padEnd(6)} : ${combined} / ${landmarks.length} (${((combined / landmarks.length) * 100).toFixed(1)}%)`);
  }

  // ── SECTION 4: Sample landmarks ──
  console.log('\n\n── SECTION 4: SAMPLE LANDMARKS ──\n');

  // Find one from rome, tokyo, seoul - match by city ID since names may be Korean
  const sampleCityIds = ['rome', 'tokyo', 'seoul'];
  for (const cityName of sampleCityIds) {
    // city IDs are slug-based like 'rome', 'tokyo', 'seoul'
    const city = cities.find(c => (c.id as any) === cityName || c.name.toLowerCase().includes(cityName));
    if (!city) {
      console.log(`  [${cityName}] - No city found`);
      continue;
    }
    const lm = landmarks.find(l => l.city_id === (city.id as any));
    if (!lm) {
      console.log(`  [${cityName}] - No landmark found for city ${city.name}`);
      continue;
    }
    console.log(`  [${city.name}] Landmark #${lm.id}: "${lm.name}"`);
    console.log(`    narration (base): ${lm.narration ? `${lm.narration.length} chars` : 'NULL'}`);

    if (lm.narration_i18n) {
      const keys = Object.keys(lm.narration_i18n);
      console.log(`    narration_i18n keys: [${keys.join(', ')}]`);
      for (const k of keys) {
        const v = lm.narration_i18n[k];
        console.log(`      ${k}: ${v ? `${v.length} chars` : 'empty'} — preview: "${v ? v.substring(0, 80) : ''}..."`);
      }
    } else {
      console.log('    narration_i18n: NULL');
    }

    if (lm.translations) {
      const keys = Object.keys(lm.translations);
      console.log(`    translations keys: [${keys.join(', ')}]`);
      for (const k of keys) {
        const v = lm.translations[k];
        const narr = v?.narration || v?.description || '';
        const nameT = v?.name || '';
        console.log(`      ${k}: narration=${narr ? `${narr.length} chars` : 'none'}, name=${nameT ? `"${nameT}"` : 'none'}`);
      }
    } else {
      console.log('    translations: NULL');
    }
    console.log('');
  }

  // ── SECTION 5: Translation effort estimate ──
  console.log('\n── SECTION 5: TRANSLATION EFFORT ESTIMATE ──');
  console.log('  Target: pre-translate to 5 major languages (en, ja, zh, es, fr)\n');

  let totalMissing = 0;
  const missingPerLang: Record<string, number> = {};
  for (const lang of MAJOR_5) {
    missingPerLang[lang] = 0;
  }

  // Count how many landmarks have a source narration (ko or en or any) but are missing the target lang
  let landmarksWithSource = 0;
  for (const lm of landmarks) {
    // Check if landmark has ANY source narration
    const hasSource =
      (lm.narration && lm.narration.trim().length > 0) ||
      (lm.narration_i18n && Object.values(lm.narration_i18n).some(v => v && v.trim().length > 0));

    if (!hasSource) continue;
    landmarksWithSource++;

    for (const lang of MAJOR_5) {
      const zhKeys = lang === 'zh' ? ['zh', 'zh-CN', 'zh-TW'] : [lang];

      const hasI18n = lm.narration_i18n && lm.narration_i18n[lang] && lm.narration_i18n[lang].trim().length > 0;

      let hasTrans = false;
      if (lm.translations) {
        for (const k of zhKeys) {
          const v = lm.translations[k];
          if (v && (v.narration || v.description) && (v.narration || v.description).trim().length > 0) {
            hasTrans = true;
            break;
          }
        }
      }

      if (!hasI18n && !hasTrans) {
        missingPerLang[lang]++;
        totalMissing++;
      }
    }
  }

  console.log(`  Landmarks with at least one source narration: ${landmarksWithSource} / ${landmarks.length}`);
  console.log('');
  console.log('  Missing translations per language:');
  for (const lang of MAJOR_5) {
    console.log(`    ${lang}: ${missingPerLang[lang]} landmarks need translation`);
  }
  console.log('');
  console.log(`  TOTAL API calls needed: ${totalMissing}`);
  console.log(`  Formula: sum of missing across 5 languages for ${landmarksWithSource} source-ready landmarks`);

  // ── SECTION 6: Landmarks with NO narration at all ──
  console.log('\n\n── SECTION 6: LANDMARKS WITH NO NARRATION AT ALL ──\n');

  const noNarration = landmarks.filter(lm => {
    const hasBase = lm.narration && lm.narration.trim().length > 0;
    const hasI18n = lm.narration_i18n && Object.values(lm.narration_i18n).some(v => v && v.trim().length > 0);
    const hasTrans = lm.translations && Object.values(lm.translations).some((v: any) => {
      const narr = v?.narration || v?.description;
      return narr && narr.trim().length > 0;
    });
    return !hasBase && !hasI18n && !hasTrans;
  });

  console.log(`  Landmarks with absolutely no narration: ${noNarration.length}`);
  if (noNarration.length > 0 && noNarration.length <= 20) {
    for (const lm of noNarration) {
      const city = cityMap.get(lm.city_id);
      console.log(`    #${lm.id} "${lm.name}" (${city?.name || 'unknown city'})`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('  END OF AUDIT REPORT');
  console.log('='.repeat(80));
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
