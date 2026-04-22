import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
);

interface Landmark {
  id: number;
  city_id: number;
  name: string;
  narration: string | null;
  narration_i18n: Record<string, string> | null;
  translations: Record<string, { narration?: string; name?: string }> | null;
  narration_length: number | null;
}

function containsHangul(text: string): boolean {
  return /[\uAC00-\uD7A3\u3131-\u3163]/.test(text);
}

async function main() {
  console.log('Fetching all landmarks...\n');

  const rows = (await sql`
    SELECT
      id,
      city_id,
      name,
      narration,
      narration_i18n,
      translations,
      LENGTH(narration) as narration_length
    FROM landmarks
    ORDER BY id
  `) as Landmark[];

  console.log(`Total landmarks fetched: ${rows.length}\n`);

  const categoryA: {
    id: number;
    name: string;
    narration_length: number | null;
    narrationI18nKoExists: boolean;
    narrationI18nKoLength: number;
  }[] = [];
  const categoryB: {
    id: number;
    name: string;
    narrationI18nEnLength: number;
    translationsEnNarrationLength: number;
  }[] = [];
  const categoryC: {
    id: number;
    name: string;
    translationLangs: string[];
  }[] = [];
  const categoryD: {
    id: number;
    name: string;
  }[] = [];

  for (const row of rows) {
    const narration = row.narration || '';
    const ni18n = row.narration_i18n || {};
    const trans = row.translations || {};

    const hasHangulNarration = narration.length > 0 && containsHangul(narration);
    const ni18nKo = ni18n?.ko || '';
    const ni18nEn = ni18n?.en || '';
    const transEnNarration = trans?.en?.narration || '';

    // Check if narrationI18n is entirely empty/null
    const ni18nIsEmpty =
      !row.narration_i18n ||
      Object.keys(row.narration_i18n).length === 0 ||
      Object.values(row.narration_i18n).every((v) => !v || v.trim() === '');

    // Check if translations has any narration entries
    const transNarrationLangs = Object.entries(trans)
      .filter(([, v]) => v?.narration && v.narration.trim().length > 0)
      .map(([k]) => k);

    let classified = false;

    // Category A: narration has Korean but narrationI18n.ko missing/empty
    if (hasHangulNarration && ni18nKo.trim().length === 0) {
      categoryA.push({
        id: row.id,
        name: row.name,
        narration_length: row.narration_length,
        narrationI18nKoExists: !!ni18n?.ko,
        narrationI18nKoLength: ni18nKo.length,
      });
      classified = true;
    }

    // Category B: narrationI18n.en exists but < 100 chars, AND translations.en.narration is longer
    if (
      ni18nEn.trim().length > 0 &&
      ni18nEn.trim().length < 100 &&
      transEnNarration.trim().length > ni18nEn.trim().length
    ) {
      categoryB.push({
        id: row.id,
        name: row.name,
        narrationI18nEnLength: ni18nEn.trim().length,
        translationsEnNarrationLength: transEnNarration.trim().length,
      });
      classified = true;
    }

    // Category C: narrationI18n entirely null/empty, but translations has narration entries
    if (ni18nIsEmpty && transNarrationLangs.length > 0) {
      categoryC.push({
        id: row.id,
        name: row.name,
        translationLangs: transNarrationLangs,
      });
      classified = true;
    }

    // Category D: already good (not in any problem category)
    if (!classified) {
      categoryD.push({
        id: row.id,
        name: row.name,
      });
    }
  }

  const summary = {
    total: rows.length,
    counts: {
      categoryA_korean_narration_missing_i18n_ko: categoryA.length,
      categoryB_short_en_i18n_longer_translation: categoryB.length,
      categoryC_empty_i18n_has_translations: categoryC.length,
      categoryD_already_good: categoryD.length,
    },
    categoryA: {
      description:
        'narration field has Korean text, but narrationI18n.ko is missing/empty. Needs: copy narration → narrationI18n.ko',
      count: categoryA.length,
      ids: categoryA.map((r) => r.id),
      details: categoryA,
    },
    categoryB: {
      description:
        'narrationI18n.en exists but < 100 chars, AND translations.en.narration is longer. Needs: replace with translations version',
      count: categoryB.length,
      ids: categoryB.map((r) => r.id),
      details: categoryB,
    },
    categoryC: {
      description:
        'narrationI18n is entirely null/empty, but translations has narration entries. Needs: rebuild from translations',
      count: categoryC.length,
      ids: categoryC.map((r) => r.id),
      details: categoryC,
    },
    categoryD: {
      description: 'Already good - narrationI18n has adequate content',
      count: categoryD.length,
      ids: categoryD.map((r) => r.id),
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  // Print a readable summary table
  console.log('\n========================================');
  console.log('  NARRATION I18N AUDIT SUMMARY');
  console.log('========================================');
  console.log(`Total landmarks: ${rows.length}`);
  console.log(`Category A (Korean narration, missing i18n.ko): ${categoryA.length}`);
  console.log(`Category B (short i18n.en, longer translation): ${categoryB.length}`);
  console.log(`Category C (empty i18n, has translations):      ${categoryC.length}`);
  console.log(`Category D (already good):                      ${categoryD.length}`);
  console.log(
    `Sum of A+B+C+D: ${categoryA.length + categoryB.length + categoryC.length + categoryD.length}`
  );
  console.log(
    `(Note: landmarks can appear in multiple problem categories A/B/C, but only in D if in none)`
  );
  console.log('========================================\n');

  if (categoryA.length > 0) {
    console.log('--- Category A Details ---');
    for (const r of categoryA) {
      console.log(
        `  ID ${r.id}: "${r.name}" | narration_len=${r.narration_length} | i18n.ko exists=${r.narrationI18nKoExists} len=${r.narrationI18nKoLength}`
      );
    }
    console.log('');
  }

  if (categoryB.length > 0) {
    console.log('--- Category B Details ---');
    for (const r of categoryB) {
      console.log(
        `  ID ${r.id}: "${r.name}" | i18n.en len=${r.narrationI18nEnLength} vs translations.en.narration len=${r.translationsEnNarrationLength}`
      );
    }
    console.log('');
  }

  if (categoryC.length > 0) {
    console.log('--- Category C Details ---');
    for (const r of categoryC) {
      console.log(
        `  ID ${r.id}: "${r.name}" | translation langs with narration: [${r.translationLangs.join(', ')}]`
      );
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
