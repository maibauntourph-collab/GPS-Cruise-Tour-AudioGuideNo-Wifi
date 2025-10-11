import { Landmark } from '@shared/schema';

export function getTranslatedContent(
  landmark: Landmark,
  language: string,
  field: 'name' | 'narration' | 'description'
): string {
  // Check if translations exist
  if (landmark.translations) {
    const translation = landmark.translations[language as keyof typeof landmark.translations];
    if (translation && translation[field]) {
      return translation[field] as string;
    }
  }

  // Fallback to default (English) values
  return landmark[field] || '';
}
