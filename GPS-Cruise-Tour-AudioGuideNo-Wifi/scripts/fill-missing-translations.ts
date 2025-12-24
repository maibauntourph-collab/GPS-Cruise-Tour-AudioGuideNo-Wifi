import { db } from '../server/db';
import { landmarks } from '../shared/schema';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';

const openai = new OpenAI();

const SUPPORTED_LANGUAGES = ['ko', 'es', 'fr', 'de', 'it', 'zh', 'ja', 'pt', 'ru'];

const LANGUAGE_NAMES: Record<string, string> = {
  ko: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  pt: 'Portuguese',
  ru: 'Russian'
};

async function translateText(text: string, targetLang: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${LANGUAGE_NAMES[targetLang]}. Keep the same tone and style. Only output the translation, nothing else.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    max_tokens: 2000,
    temperature: 0.3
  });
  
  return response.choices[0]?.message?.content?.trim() || text;
}

async function fillMissingTranslations() {
  console.log('Fetching all landmarks...');
  const allLandmarks = await db.select().from(landmarks);
  console.log(`Found ${allLandmarks.length} landmarks`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const landmark of allLandmarks) {
    let translations = (landmark.translations || {}) as Record<string, any>;
    let needsUpdate = false;

    // Get English content as source
    const enTranslation = translations['en'] || {};
    const englishDetailedDescription = enTranslation.detailedDescription || landmark.detailedDescription || '';
    const englishHistoricalInfo = enTranslation.historicalInfo || landmark.historicalInfo || '';

    if (!englishDetailedDescription && !englishHistoricalInfo) {
      continue; // Skip if no source content
    }

    for (const lang of SUPPORTED_LANGUAGES) {
      if (!translations[lang]) {
        translations[lang] = {};
      }

      const langTranslation = translations[lang];

      // Fill detailedDescription if missing
      if (englishDetailedDescription && !langTranslation.detailedDescription) {
        try {
          console.log(`Translating detailedDescription to ${lang} for: ${landmark.name}`);
          const translated = await translateText(englishDetailedDescription, lang);
          translations[lang].detailedDescription = translated;
          needsUpdate = true;
          
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 200));
        } catch (error) {
          console.error(`Error translating to ${lang} for ${landmark.name}:`, error);
          errorCount++;
        }
      }

      // Fill historicalInfo if missing
      if (englishHistoricalInfo && !langTranslation.historicalInfo) {
        try {
          console.log(`Translating historicalInfo to ${lang} for: ${landmark.name}`);
          const translated = await translateText(englishHistoricalInfo, lang);
          translations[lang].historicalInfo = translated;
          needsUpdate = true;
          
          await new Promise(r => setTimeout(r, 200));
        } catch (error) {
          console.error(`Error translating historicalInfo to ${lang} for ${landmark.name}:`, error);
          errorCount++;
        }
      }
    }

    if (needsUpdate) {
      try {
        await db.update(landmarks)
          .set({ translations, updatedAt: new Date() })
          .where(eq(landmarks.id, landmark.id));
        updatedCount++;
        console.log(`Updated: ${landmark.name}`);
      } catch (error) {
        console.error(`Error updating ${landmark.name}:`, error);
        errorCount++;
      }
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Updated: ${updatedCount} landmarks`);
  console.log(`Errors: ${errorCount}`);
}

fillMissingTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
