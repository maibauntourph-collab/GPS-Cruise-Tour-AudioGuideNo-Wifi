export const TTS_VOICES = {
  nara: { 
    name: 'Nara', 
    nameKo: '나라',
    description: 'Korean female voice',
    descriptionKo: '한국어 여성 목소리',
    language: 'ko',
    gender: 'female'
  },
  nminsang: { 
    name: 'Minsang', 
    nameKo: '민상',
    description: 'Korean male voice',
    descriptionKo: '한국어 남성 목소리',
    language: 'ko',
    gender: 'male'
  },
  njiyun: { 
    name: 'Jiyun', 
    nameKo: '지윤',
    description: 'Korean female voice',
    descriptionKo: '한국어 여성 목소리',
    language: 'ko',
    gender: 'female'
  },
  nsujin: { 
    name: 'Sujin', 
    nameKo: '수진',
    description: 'Korean female voice',
    descriptionKo: '한국어 여성 목소리',
    language: 'ko',
    gender: 'female'
  },
  njinho: { 
    name: 'Jinho', 
    nameKo: '진호',
    description: 'Korean male voice',
    descriptionKo: '한국어 남성 목소리',
    language: 'ko',
    gender: 'male'
  },
  clara: { 
    name: 'Clara', 
    nameKo: '클라라',
    description: 'English female voice',
    descriptionKo: '영어 여성 목소리',
    language: 'en',
    gender: 'female'
  },
  matt: { 
    name: 'Matt', 
    nameKo: '매트',
    description: 'English male voice',
    descriptionKo: '영어 남성 목소리',
    language: 'en',
    gender: 'male'
  },
  ntomoko: { 
    name: 'Tomoko', 
    nameKo: '토모코',
    description: 'Japanese female voice',
    descriptionKo: '일본어 여성 목소리',
    language: 'ja',
    gender: 'female'
  },
  shinji: { 
    name: 'Shinji', 
    nameKo: '신지',
    description: 'Japanese male voice',
    descriptionKo: '일본어 남성 목소리',
    language: 'ja',
    gender: 'male'
  },
  meimei: { 
    name: 'Meimei', 
    nameKo: '메이메이',
    description: 'Chinese female voice',
    descriptionKo: '중국어 여성 목소리',
    language: 'zh',
    gender: 'female'
  },
  liangliang: { 
    name: 'Liangliang', 
    nameKo: '량량',
    description: 'Chinese male voice',
    descriptionKo: '중국어 남성 목소리',
    language: 'zh',
    gender: 'male'
  },
  carmen: { 
    name: 'Carmen', 
    nameKo: '카르멘',
    description: 'Spanish female voice',
    descriptionKo: '스페인어 여성 목소리',
    language: 'es',
    gender: 'female'
  },
  jose: { 
    name: 'Jose', 
    nameKo: '호세',
    description: 'Spanish male voice',
    descriptionKo: '스페인어 남성 목소리',
    language: 'es',
    gender: 'male'
  },
} as const;

export type VoiceId = keyof typeof TTS_VOICES;

export const VOICE_PRESETS = {
  guide: 'nara' as VoiceId,
  storyteller: 'njiyun' as VoiceId,
  friendly: 'clara' as VoiceId,
  professional: 'nminsang' as VoiceId,
};

export const DEFAULT_VOICE_BY_LANGUAGE: { [key: string]: VoiceId } = {
  'ko': 'nara',
  'en': 'clara',
  'ja': 'ntomoko',
  'zh': 'meimei',
  'es': 'carmen',
  'fr': 'clara',
  'de': 'clara',
  'it': 'clara',
  'pt': 'clara',
  'ru': 'clara',
};

export function getVoiceForLanguage(language: string): VoiceId {
  return DEFAULT_VOICE_BY_LANGUAGE[language] || 'clara';
}

export function getVoicesForLanguage(language: string): VoiceId[] {
  const langMapping: { [key: string]: string } = {
    ko: 'ko',
    en: 'en',
    ja: 'ja',
    zh: 'zh',
    es: 'es',
  };
  const targetLang = langMapping[language] || 'en';
  return (Object.keys(TTS_VOICES) as VoiceId[]).filter(
    (key) => TTS_VOICES[key].language === targetLang
  );
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
