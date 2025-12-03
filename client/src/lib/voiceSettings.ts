export const TTS_VOICES = {
  alloy: { 
    name: 'Alloy', 
    nameKo: '알로이',
    description: 'Neutral and balanced voice',
    descriptionKo: '중성적이고 균형잡힌 목소리',
    style: 'neutral',
    gender: 'neutral'
  },
  echo: { 
    name: 'Echo', 
    nameKo: '에코',
    description: 'Deep masculine voice',
    descriptionKo: '남성적이고 깊은 목소리',
    style: 'deep',
    gender: 'male'
  },
  fable: { 
    name: 'Fable', 
    nameKo: '페이블',
    description: 'Expressive storyteller',
    descriptionKo: '재밌고 표현력 풍부한 스토리텔러',
    style: 'storyteller',
    gender: 'neutral'
  },
  onyx: { 
    name: 'Onyx', 
    nameKo: '오닉스',
    description: 'Authoritative and deep',
    descriptionKo: '권위있고 깊은 목소리',
    style: 'authoritative',
    gender: 'male'
  },
  nova: { 
    name: 'Nova', 
    nameKo: '노바',
    description: 'Soft and warm female voice',
    descriptionKo: '부드럽고 따뜻한 여성 목소리',
    style: 'warm',
    gender: 'female'
  },
  shimmer: { 
    name: 'Shimmer', 
    nameKo: '시머',
    description: 'Bright and friendly female voice',
    descriptionKo: '밝고 친근한 여성 목소리',
    style: 'friendly',
    gender: 'female'
  },
} as const;

export type VoiceId = keyof typeof TTS_VOICES;

export const VOICE_PRESETS = {
  guide: 'alloy' as VoiceId,
  storyteller: 'fable' as VoiceId,
  friendly: 'shimmer' as VoiceId,
  professional: 'onyx' as VoiceId,
};

export const DEFAULT_VOICE_BY_LANGUAGE: { [key: string]: VoiceId } = {
  'en': 'fable',
  'ko': 'nova',
  'es': 'shimmer',
  'fr': 'fable',
  'de': 'onyx',
  'it': 'shimmer',
  'zh': 'nova',
  'ja': 'alloy',
  'pt': 'shimmer',
  'ru': 'onyx',
};

export function getVoiceForLanguage(language: string): VoiceId {
  return DEFAULT_VOICE_BY_LANGUAGE[language] || 'fable';
}

export function getSavedVoice(): VoiceId | null {
  const saved = localStorage.getItem('tts-voice');
  if (saved && saved in TTS_VOICES) {
    return saved as VoiceId;
  }
  return null;
}

export function saveVoice(voiceId: VoiceId): void {
  localStorage.setItem('tts-voice', voiceId);
}

export function getVoiceName(voiceId: VoiceId, language: string): string {
  const voice = TTS_VOICES[voiceId];
  return language === 'ko' ? voice.nameKo : voice.name;
}

export function getVoiceDescription(voiceId: VoiceId, language: string): string {
  const voice = TTS_VOICES[voiceId];
  return language === 'ko' ? voice.descriptionKo : voice.description;
}
