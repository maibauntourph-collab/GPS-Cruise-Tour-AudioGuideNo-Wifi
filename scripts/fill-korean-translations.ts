import { db } from '../server/db';
import { landmarks } from '../shared/schema';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';

const openai = new OpenAI();

async function translateToKorean(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator specializing in travel and tourism content. Translate the following text to Korean. Keep the same tone and style. Make it natural for Korean readers. Only output the translation, nothing else.`
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

async function fillKoreanTranslations() {
  console.log('Fetching landmarks missing Korean detailedDescription...');
  const allLandmarks = await db.select().from(landmarks);
  
  // Filter landmarks that need Korean detailedDescription
  const needsTranslation = allLandmarks.filter(l => {
    const translations = (l.translations || {}) as Record<string, any>;
    const enTranslation = translations['en'] || {};
    const koTranslation = translations['ko'] || {};
    const englishDetail = enTranslation.detailedDescription || l.detailedDescription;
    return englishDetail && !koTranslation.detailedDescription;
  });

  console.log(`Found ${needsTranslation.length} landmarks needing Korean translation`);

  let updatedCount = 0;

  for (const landmark of needsTranslation) {
    const translations = (landmark.translations || {}) as Record<string, any>;
    const enTranslation = translations['en'] || {};
    const englishDetail = enTranslation.detailedDescription || landmark.detailedDescription || '';

    try {
      console.log(`Translating: ${landmark.name}`);
      const koreanDetail = await translateToKorean(englishDetail);
      
      if (!translations['ko']) {
        translations['ko'] = {};
      }
      translations['ko'].detailedDescription = koreanDetail;
      
      await db.update(landmarks)
        .set({ translations, updatedAt: new Date() })
        .where(eq(landmarks.id, landmark.id));
      
      updatedCount++;
      console.log(`  Updated: ${landmark.name}`);
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`  Error: ${landmark.name}`, error);
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Updated: ${updatedCount} landmarks with Korean translations`);
}

fillKoreanTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
