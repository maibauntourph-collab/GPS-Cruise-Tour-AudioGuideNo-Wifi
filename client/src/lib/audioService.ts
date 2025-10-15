class AudioService {
  private synthesis: SpeechSynthesis;
  private spokenLandmarks: Set<string>;
  private isEnabled: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentRate: number = 1.0;
  private voices: SpeechSynthesisVoice[] = [];
  private playbackTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.spokenLandmarks = new Set();
    this.isEnabled = true;
    
    // Load saved rate from localStorage, default to 1.0
    const savedRate = localStorage.getItem('tts-speed');
    if (savedRate) {
      this.currentRate = parseFloat(savedRate);
    } else {
      this.currentRate = 1.0;
      localStorage.setItem('tts-speed', '1.0');
    }

    // Load voices when available
    this.loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
  }

  // Language mapping for all supported languages
  private getLangCode(language: string): string {
    const langMap: { [key: string]: string } = {
      'en': 'en-US',
      'es': 'es-ES',  // Spanish - Spain (prioritize European Spanish for quality)
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
      'hi': 'hi-IN',
      'tr': 'tr-TR',
      'nl': 'nl-NL',
      'pl': 'pl-PL',
      'sv': 'sv-SE',
      'da': 'da-DK',
      'fi': 'fi-FI',
      'no': 'nb-NO',
      'el': 'el-GR',
      'cs': 'cs-CZ',
      'th': 'th-TH',
      'vi': 'vi-VN',
      'id': 'id-ID'
    };
    
    return langMap[language] || 'en-US';
  }

  // Get all possible language codes for broader voice selection (especially for Spanish)
  private getLanguageVariants(langCode: string): string[] {
    const baseLang = langCode.split('-')[0];
    
    // Spanish has many regional variants with high-quality voices
    if (baseLang === 'es') {
      return [
        'es-ES',  // Spain (Castilian) - often highest quality
        'es-MX',  // Mexico - very natural neural voices
        'es-US',  // US Spanish - good quality
        'es-AR',  // Argentina
        'es-CO',  // Colombia
        langCode  // Original requested code
      ];
    }
    
    return [langCode];
  }

  // Find the best voice for the given language (prioritize natural/premium voices)
  private getVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    // Refresh voices if empty
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    // Get all language variants to search (especially important for Spanish)
    const langVariants = this.getLanguageVariants(langCode);
    const baseLang = langCode.split('-')[0];

    // Filter voices for the target language (including all variants)
    const matchingVoices = this.voices.filter(v => {
      const voiceBaseLang = v.lang.split('-')[0];
      return langVariants.some(variant => v.lang === variant) || voiceBaseLang === baseLang;
    });

    if (matchingVoices.length === 0) return null;

    // Quality indicators (order matters - higher priority first)
    // Added more Spanish-specific quality indicators
    const qualityKeywords = [
      'neural',      // Microsoft Neural voices (highest quality)
      'wavenet',     // Google WaveNet (highest quality)
      'premium',     // Premium voices
      'enhanced',    // Enhanced quality
      'natural',     // Natural sounding
      'high-quality',
      'google',      // Google voices (generally good)
      'microsoft',   // Microsoft voices (generally good)
      'lucía',       // Spanish female voice (often high quality)
      'jorge',       // Spanish male voice (often high quality)
      'mónica',      // Spanish female name
      'paulina',     // Latin American female
      'female',
      'male',
      'standard'
    ];

    // Score each voice based on quality indicators
    const scoredVoices = matchingVoices.map(voice => {
      let score = 0;
      const nameLower = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();
      
      // Check for quality keywords in voice name
      qualityKeywords.forEach((keyword, index) => {
        if (nameLower.includes(keyword)) {
          score += (qualityKeywords.length - index) * 10;
        }
      });

      // Prefer exact language match over base language match
      if (voice.lang === langCode) score += 100;
      
      // For Spanish, prefer es-ES and es-MX (often have best quality)
      if (baseLang === 'es') {
        if (voiceLang === 'es-es') score += 80;
        if (voiceLang === 'es-mx') score += 75;
        if (voiceLang === 'es-us') score += 60;
      }
      
      // Remote/online voices often have better quality (Google, Microsoft neural)
      if (!voice.localService) score += 50;
      
      // Local voices as fallback (lower priority but still considered)
      if (voice.localService) score += 10;

      return { voice, score };
    });

    // Sort by score (highest first) and return the best voice
    scoredVoices.sort((a, b) => b.score - a.score);
    
    // Log the selected voice for debugging
    console.log(`[AudioService] Selected voice for ${langCode}:`, scoredVoices[0].voice.name, `(score: ${scoredVoices[0].score})`);
    
    return scoredVoices[0].voice;
  }

  speak(text: string, landmarkId: string, language: string = 'en') {
    if (!this.isEnabled || this.spokenLandmarks.has(landmarkId)) {
      return;
    }

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = this.getLangCode(language);
    utterance.lang = langCode;
    utterance.rate = this.currentRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Set language-specific voice
    const voice = this.getVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    this.synthesis.speak(utterance);
    this.spokenLandmarks.add(landmarkId);
  }

  // Play text with speed control (for panel TTS)
  playText(text: string, language: string = 'en', rate: number = 1.0, onEnd?: () => void) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    
    this.synthesis.cancel();
    this.currentUtterance = null;
    
    this.playbackTimer = setTimeout(() => {
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      const langCode = this.getLangCode(language);
      this.currentUtterance.lang = langCode;
      this.currentUtterance.rate = rate;
      this.currentUtterance.pitch = 1.0;
      this.currentUtterance.volume = 1.0;
      this.currentRate = rate;

      // Set language-specific voice
      const voice = this.getVoiceForLanguage(langCode);
      if (voice) {
        this.currentUtterance.voice = voice;
      }

      if (onEnd) {
        this.currentUtterance.onend = onEnd;
      }

      this.synthesis.speak(this.currentUtterance);
      this.playbackTimer = null;
    }, 50);
  }

  pauseSpeech() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resumeSpeech() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  setRate(rate: number) {
    this.currentRate = rate;
    localStorage.setItem('tts-speed', rate.toString());
  }

  getCurrentRate(): number {
    return this.currentRate;
  }

  stop() {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  reset() {
    this.spokenLandmarks.clear();
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.synthesis.cancel();
    }
  }

  isLandmarkSpoken(landmarkId: string): boolean {
    return this.spokenLandmarks.has(landmarkId);
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  isPaused(): boolean {
    return this.synthesis.paused;
  }

  removeLandmark(landmarkId: string): void {
    this.spokenLandmarks.delete(landmarkId);
  }
}

export const audioService = new AudioService();
