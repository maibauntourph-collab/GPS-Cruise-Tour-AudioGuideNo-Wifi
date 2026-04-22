import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

const BATCH_SIZE = 25;

// Check if text contains Korean characters
function hasKorean(text: string): boolean {
  return /[가-힣]/.test(text);
}

// Check if text is primarily English (no Korean)
function isEnglish(text: string): boolean {
  return text.length > 20 && !hasKorean(text);
}

// Strip Korean characters from a string, clean up whitespace
function stripKorean(text: string): string {
  return text.replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]+/g, '').replace(/\s+/g, ' ').trim();
}

// Build a placeholder narration from available English fields
function buildPlaceholder(row: any): string {
  let name = row.name || 'this landmark';
  // If name has Korean, try to extract English parts or use ID-based name
  if (hasKorean(name)) {
    const stripped = stripKorean(name);
    if (stripped.length > 3) {
      name = stripped;
    } else {
      // Fall back to ID-based name, strip Korean from ID too
      const idName = stripKorean((row.id as string).replace(/[-_]/g, ' ')).replace(/\b\w/g, (c: string) => c.toUpperCase());
      name = idName.length > 3 ? idName : 'this landmark';
    }
  }
  let cityId = (row.city_id || '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  if (hasKorean(cityId)) {
    cityId = stripKorean(cityId) || 'this city';
  }

  // Try to extract English description from translations
  const translations = row.translations as any;
  const enDesc = translations?.en?.description;
  const enHistorical = translations?.en?.historicalInfo || translations?.en?.historical_info;

  // Try plain description/historical_info if they're in English
  const desc = row.description;
  const historical = row.historical_info;
  const detailed = row.detailed_description;

  let body = '';

  // Pick the best available English text
  if (enDesc && isEnglish(enDesc)) {
    body = enDesc;
  } else if (desc && isEnglish(desc)) {
    body = desc;
  } else if (enHistorical && isEnglish(enHistorical)) {
    body = enHistorical;
  } else if (historical && isEnglish(historical)) {
    body = historical;
  } else if (detailed && isEnglish(detailed)) {
    body = detailed;
  }

  if (body) {
    // Strip any Korean from body text, trim to reasonable length
    if (hasKorean(body)) {
      body = stripKorean(body);
    }
    if (body.length > 20) {
      const trimmed = body.length > 500 ? body.slice(0, 497) + '...' : body;
      return `Welcome to ${name} in ${cityId}. ${trimmed} Explore this remarkable destination and discover its unique charm.`;
    }
  }

  return `Welcome to ${name} in ${cityId}. Explore this remarkable destination and discover its unique charm.`;
}

type SourceType = 'translations_narration' | 'constructed' | 'placeholder';

interface UpdateRecord {
  id: string;
  name: string;
  cityId: string;
  source: SourceType;
  narrationLength: number;
}

async function main() {
  console.log('==============================================');
  console.log('Batch Translate English Narrations');
  console.log('==============================================\n');

  // Step 1: Query all landmarks needing English narrations
  console.log('Querying landmarks needing English narrations...\n');

  const rows = await sql`
    SELECT id, name, city_id, narration, narration_i18n,
           description, detailed_description, historical_info, translations
    FROM landmarks
    WHERE narration_i18n->>'en' IS NULL
       OR narration_i18n->>'en' ~ '[가-힣]'
    ORDER BY city_id, id
  `;

  console.log(`Found ${rows.length} landmarks needing English narrations`);

  const missingEn = rows.filter(r => !(r.narration_i18n as any)?.en);
  const koreanEn = rows.filter(r => {
    const en = (r.narration_i18n as any)?.en;
    return en && hasKorean(en);
  });
  console.log(`  - Missing narrationI18n.en entirely: ${missingEn.length}`);
  console.log(`  - Korean text in narrationI18n.en: ${koreanEn.length}\n`);

  if (rows.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  // Step 2: Determine best English narration for each
  const updates: UpdateRecord[] = [];
  const updateData: { id: string; newI18n: Record<string, string> }[] = [];

  for (const row of rows) {
    const existing = (row.narration_i18n as Record<string, string>) || {};
    const translations = row.translations as any;
    let enNarration: string;
    let source: SourceType;

    // Priority 1: translations.en.narration (if it's real English)
    const transEnNarr = translations?.en?.narration;
    if (transEnNarr && isEnglish(transEnNarr)) {
      enNarration = transEnNarr;
      source = 'translations_narration';
    }
    // Priority 2: Construct from available English fields
    else {
      const placeholder = buildPlaceholder(row);
      // If we managed to include a description/historical body, it's "constructed"
      const hasBody = placeholder.length > 120; // longer than just the welcome template
      source = hasBody ? 'constructed' : 'placeholder';
      enNarration = placeholder;
    }

    const newI18n = { ...existing, en: enNarration };
    updateData.push({ id: row.id as string, newI18n });
    updates.push({
      id: row.id as string,
      name: row.name as string,
      cityId: row.city_id as string,
      source,
      narrationLength: enNarration.length,
    });
  }

  // Step 3: Update in batches of 25
  console.log(`Processing ${updateData.length} updates in batches of ${BATCH_SIZE}...\n`);

  let processed = 0;
  let errors = 0;
  const totalBatches = Math.ceil(updateData.length / BATCH_SIZE);

  for (let i = 0; i < updateData.length; i += BATCH_SIZE) {
    const chunk = updateData.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      await Promise.all(chunk.map(async (item) => {
        try {
          await sql`
            UPDATE landmarks
            SET narration_i18n = ${JSON.stringify(item.newI18n)}::jsonb,
                updated_at = NOW()
            WHERE id = ${item.id}
          `;
          processed++;
        } catch (err: any) {
          console.error(`  [ERROR] ${item.id}: ${err.message}`);
          errors++;
        }
      }));
      console.log(`  Batch ${batchNum}/${totalBatches} done (${Math.min(i + BATCH_SIZE, updateData.length)}/${updateData.length})`);
    } catch (err: any) {
      console.error(`  [BATCH ERROR] Batch ${batchNum}: ${err.message}`);
      errors++;
    }
  }

  // Step 4: Report
  const realTranslations = updates.filter(u => u.source === 'translations_narration');
  const constructed = updates.filter(u => u.source === 'constructed');
  const placeholders = updates.filter(u => u.source === 'placeholder');

  console.log('\n==============================================');
  console.log('RESULTS');
  console.log('==============================================');
  console.log(`Total processed: ${processed}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nBreakdown by source:`);
  console.log(`  Real translations (translations.en.narration): ${realTranslations.length}`);
  console.log(`  Constructed (from description/historical):     ${constructed.length}`);
  console.log(`  Placeholders (minimal template):               ${placeholders.length}`);

  if (realTranslations.length > 0) {
    console.log(`\n--- Real Translations (${realTranslations.length}) ---`);
    for (const u of realTranslations.slice(0, 10)) {
      console.log(`  ${u.id} | ${u.name} | ${u.narrationLength} chars`);
    }
    if (realTranslations.length > 10) console.log(`  ... and ${realTranslations.length - 10} more`);
  }

  if (constructed.length > 0) {
    console.log(`\n--- Constructed (${constructed.length}) ---`);
    for (const u of constructed.slice(0, 10)) {
      console.log(`  ${u.id} | ${u.name} | ${u.narrationLength} chars`);
    }
    if (constructed.length > 10) console.log(`  ... and ${constructed.length - 10} more`);
  }

  if (placeholders.length > 0) {
    console.log(`\n--- Placeholders (${placeholders.length}) ---`);
    for (const u of placeholders.slice(0, 10)) {
      console.log(`  ${u.id} | ${u.name} | ${u.narrationLength} chars`);
    }
    if (placeholders.length > 10) console.log(`  ... and ${placeholders.length - 10} more`);
  }

  // Verification
  console.log('\n==============================================');
  console.log('VERIFICATION');
  console.log('==============================================');

  const stats = await sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN narration_i18n->>'en' IS NOT NULL THEN 1 ELSE 0 END) AS has_en,
      SUM(CASE WHEN narration_i18n->>'en' IS NULL THEN 1 ELSE 0 END) AS missing_en,
      SUM(CASE WHEN narration_i18n->>'en' ~ '[가-힣]' THEN 1 ELSE 0 END) AS en_with_korean
    FROM landmarks
  `;
  console.log(JSON.stringify(stats[0], null, 2));
}

main().catch(console.error);
