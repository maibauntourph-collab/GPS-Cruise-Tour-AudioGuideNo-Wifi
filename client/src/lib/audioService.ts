class AudioService {
  private synthesis: SpeechSynthesis;
  private spokenLandmarks: Set<string>;
  private isEnabled: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentRate: number = 1.0;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.spokenLandmarks = new Set();
    this.isEnabled = true;
    
    // Load saved rate from localStorage
    const savedRate = localStorage.getItem('tts-speed');
    if (savedRate) {
      this.currentRate = parseFloat(savedRate);
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
      'es': 'es-ES',
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

  // Find the best voice for the given language
  private getVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    // Refresh voices if empty
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    // Extract base language code (e.g., 'ko' from 'ko-KR')
    const baseLang = langCode.split('-')[0];

    // Try to find exact match first (e.g., 'ko-KR')
    let voice = this.voices.find(v => v.lang === langCode);
    
    // If no exact match, find any voice with the same base language
    if (!voice) {
      voice = this.voices.find(v => v.lang.startsWith(baseLang));
    }

    // Prefer local voices over remote when available
    if (voice) {
      const localVoice = this.voices.find(v => 
        (v.lang === langCode || v.lang.startsWith(baseLang)) && v.localService
      );
      return localVoice || voice;
    }

    return null;
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
    this.synthesis.cancel();
    
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
