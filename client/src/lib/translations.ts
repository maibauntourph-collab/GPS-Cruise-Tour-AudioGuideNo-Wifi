import { Landmark } from '@shared/schema';

export function getTranslatedContent(
  landmark: Landmark,
  language: string,
  field: 'name' | 'narration' | 'description' | 'detailedDescription'
): string {
  // Check if translations exist
  if (landmark.translations && landmark.translations[language]) {
    const translation = landmark.translations[language];
    if (translation && translation[field]) {
      return translation[field] as string;
    }
  }

  // Fallback to English if available
  if (language !== 'en' && landmark.translations && landmark.translations['en']) {
    const englishTranslation = landmark.translations['en'];
    if (englishTranslation && englishTranslation[field]) {
      return englishTranslation[field] as string;
    }
  }

  // Fallback to default values
  return landmark[field] || '';
}
