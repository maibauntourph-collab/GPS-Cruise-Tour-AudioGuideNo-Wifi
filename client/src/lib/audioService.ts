import { offlineStorage } from './offlineStorage';

export type AudioMode = 'auto' | 'mp3' | 'tts' | 'clova' | 'openai';

interface AudioDownloadProgress {
  landmarkId: string;
  language: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'complete' | 'error';
  error?: string;
}

export class AudioService {
  private synthesis: SpeechSynthesis;
  private spokenLandmarks: Set<string>;
  private isEnabled: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentRate: number = 1.0;
  private voices: SpeechSynthesisVoice[] = [];
  private playbackTimer: any | null = null;
  private sentenceIndex: number = 0;
  private sentences: string[] = [];
  private onSentenceChange: ((index: number) => void) | null = null;
  private onSentenceEnd: (() => void) | null = null;
  private isSentenceMode: boolean = false;
  private selectedVoicesByLanguage: Map<string, string> = new Map();
  private selectedClovaVoicesByLanguage: Map<string, string> = new Map();
  private isUnlocked: boolean = false;
  private isPausedInternal: boolean = false;
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();

  private audioElement: HTMLAudioElement | null = null;
  private audioMode: AudioMode = 'auto';
  private downloadProgress: Map<string, AudioDownloadProgress> = new Map();
  private onDownloadProgressChange: ((progress: Map<string, AudioDownloadProgress>) => void) | null = null;
  private onStateChange: ((isSpeaking: boolean) => void) | null = null;

  private audioContext: AudioContext | null = null;
  private silentOscillator: OscillatorNode | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.spokenLandmarks = new Set();
    this.isEnabled = true;

    const savedRate = localStorage.getItem('tts-speed');
    if (savedRate) {
      this.currentRate = parseFloat(savedRate);
    } else {
      this.currentRate = 1.2;
      localStorage.setItem('tts-speed', '1.2');
    }

    const savedMode = localStorage.getItem('audio-mode') as AudioMode;
    if (savedMode && ['auto', 'mp3', 'tts', 'clova', 'openai'].includes(savedMode)) {
      this.audioMode = savedMode;
    }

    this.loadSelectedVoices();
    this.loadSelectedClovaVoices();
    this.loadVoicesWithRetry();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
        this.voiceCache.clear();
      };
    }
  }

  private loadVoicesWithRetry(attempt: number = 0, maxAttempts: number = 10) {
    this.voices = this.synthesis.getVoices();

    if (this.voices.length === 0 && attempt < maxAttempts) {
      const delay = Math.min(200 * (attempt + 1), 1000);
      setTimeout(() => this.loadVoicesWithRetry(attempt + 1, maxAttempts), delay);
    } else if (this.voices.length > 0) {
      console.log(`[AudioService] ✅ ${this.voices.length}개 음성 로딩 완료 (시도 ${attempt + 1}회)`);
      const hasKo = this.voices.some(v => v.lang.startsWith('ko'));
      if (!hasKo && attempt === maxAttempts - 1) {
        console.warn('[AudioService] ⚠️ 한국어 음성(ko-KR)을 찾을 수 없습니다. 폴백 음성을 사용합니다.');
      }
    }
  }

  private loadSelectedVoices() {
    try {
      const saved = localStorage.getItem('tts-voices-by-language');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([lang, voiceName]) => {
          this.selectedVoicesByLanguage.set(lang, voiceName as string);
        });
      }
    } catch (e) {
      console.error('[AudioService] Failed to load saved voices:', e);
    }
  }

  private saveSelectedVoices() {
    try {
      const obj: Record<string, string> = {};
      this.selectedVoicesByLanguage.forEach((voiceName, lang) => {
        obj[lang] = voiceName;
      });
      localStorage.setItem('tts-voices-by-language', JSON.stringify(obj));
    } catch (e) {
      console.error('[AudioService] Failed to save voices:', e);
    }
  }

  private loadSelectedClovaVoices() {
    try {
      const saved = localStorage.getItem('clova-voices-by-language');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([lang, voiceId]) => {
          this.selectedClovaVoicesByLanguage.set(lang, voiceId as string);
        });
      }
    } catch (e) {
      console.error('[AudioService] Failed to load saved CLOVA voices:', e);
    }
  }

  private saveSelectedClovaVoices() {
    try {
      const obj: Record<string, string> = {};
      this.selectedClovaVoicesByLanguage.forEach((voiceId, lang) => {
        obj[lang] = voiceId;
      });
      localStorage.setItem('clova-voices-by-language', JSON.stringify(obj));
    } catch (e) {
      console.error('[AudioService] Failed to save CLOVA voices:', e);
    }
  }

  getSelectedClovaVoice(language: string): string | undefined {
    return this.selectedClovaVoicesByLanguage.get(language);
  }

  setClovaVoiceForLanguage(language: string, voiceId: string) {
    this.selectedClovaVoicesByLanguage.set(language, voiceId);
    this.saveSelectedClovaVoices();
    this.debugLogOnce(`clova-set-${language}`, `[AudioService] Saved CLOVA voice for ${language}: ${voiceId}`);
  }

  getAllVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }
    return this.voices;
  }

  getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const langCode = this.getLangCode(language);
    const baseLang = langCode.split('-')[0];

    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    return this.voices.filter(v => {
      const voiceBaseLang = v.lang.split('-')[0];
      return v.lang === langCode || voiceBaseLang === baseLang;
    });
  }

  setVoiceForLanguage(language: string, voiceName: string) {
    this.selectedVoicesByLanguage.set(language, voiceName);
    this.saveSelectedVoices();
    this.debugLogOnce(`voice-set-${language}`, `[AudioService] Set voice for ${language}: ${voiceName}`);
  }

  getSelectedVoiceName(language: string): string | null {
    return this.selectedVoicesByLanguage.get(language) || null;
  }

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

  private getLanguageVariants(langCode: string): string[] {
    const baseLang = langCode.split('-')[0];

    const variants: { [key: string]: string[] } = {
      'es': ['es-ES', 'es-MX', 'es-US', 'es-AR', 'es-CO'],
      'en': ['en-US', 'en-GB', 'en-AU', 'en-IN'],
      'zh': ['zh-CN', 'zh-HK', 'zh-TW'],
      'pt': ['pt-PT', 'pt-BR'],
    };

    return variants[baseLang] || [langCode];
  }

  private getVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    if (this.voiceCache.has(langCode)) {
      return this.voiceCache.get(langCode) || null;
    }

    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    const baseLang = langCode.split('-')[0];

    const selectedVoiceName = this.selectedVoicesByLanguage.get(baseLang);
    if (selectedVoiceName) {
      const selectedVoice = this.voices.find(v => v.name === selectedVoiceName);
      if (selectedVoice) {
        this.debugLogOnce(`user-voice-${langCode}`, `[AudioService] Using user-selected voice for ${langCode}: ${selectedVoice.name}`);
        return selectedVoice;
      }
    }

    const normalize = (code: string) => code.toLowerCase().replace('_', '-');
    const normTarget = normalize(langCode);
    const normBase = normTarget.split('-')[0];
    const langVariants = this.getLanguageVariants(langCode);
    const normVariants = langVariants.map(normalize);

    const matchingVoices = this.voices.filter(v => {
      const vNorm = normalize(v.lang);
      const vBase = vNorm.split('-')[0];
      return normVariants.includes(vNorm) || vBase === normBase;
    });

    if (matchingVoices.length === 0) {
      if (normTarget === 'en-us') {
        this.debugWarnOnce('en-uss-missing', `[AudioService] Critical: No voices available for ${langCode}. Total voices: ${this.voices.length}`);
        return this.voices[0] || null;
      }

      this.debugWarnOnce(`missing-${langCode}`, `[AudioService] No matching voices for ${langCode} (${normTarget}), falling back to English`);
      return this.getVoiceForLanguage('en-US');
    }

    const qualityKeywords = [
      'neural', 'wavenet', 'premium', 'enhanced', 'natural', 'high-quality',
      'google', 'microsoft', 'lucía', 'jorge', 'mónica', 'paulina',
      'female', 'male', 'standard'
    ];

    const scoredVoices = matchingVoices.map(voice => {
      let score = 0;
      const nameLower = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();

      qualityKeywords.forEach((keyword, index) => {
        if (nameLower.includes(keyword)) {
          score += (qualityKeywords.length - index) * 10;
        }
      });

      if (voice.lang === langCode) score += 100;

      if (baseLang === 'es') {
        if (voiceLang === 'es-es') score += 80;
        if (voiceLang === 'es-mx') score += 75;
        if (voiceLang === 'es-us') score += 60;
      }

      if (!voice.localService) score += 50;
      if (voice.localService) score += 10;

      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);

    this.debugLogOnce(`selected-${langCode}`, `[AudioService] Selected voice for ${langCode}: ${scoredVoices[0].voice.name} (Lang: ${scoredVoices[0].voice.lang}, Score: ${scoredVoices[0].score})`);

    this.voiceCache.set(langCode, scoredVoices[0].voice);

    return scoredVoices[0].voice;
  }

  hasNativeVoice(language: string): boolean {
    const langCode = this.getLangCode(language);
    const baseLang = langCode.split('-')[0];

    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    return this.voices.some(v => v.lang.startsWith(baseLang));
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

    const voice = this.getVoiceForLanguage(langCode);
    if (voice) {
      utterance.voice = voice;
    }

    this.synthesis.speak(utterance);
    this.spokenLandmarks.add(landmarkId);
  }

  playText(text: string, language: string = 'en', rate: number = 1.0, onEnd?: () => void) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.synthesis.cancel();
    this.currentUtterance = null;

    if (!this.hasNativeVoice(language)) {
      this.debugWarnOnce(`native-missing-${language}`, `[AudioService] Native voice missing for ${language}. Guidance may be suboptimal.`);
    }

    this.playbackTimer = setTimeout(() => {
      this.currentUtterance = new SpeechSynthesisUtterance(text);
      const langCode = this.getLangCode(language);
      this.currentUtterance.lang = langCode;
      this.currentUtterance.rate = rate;
      this.currentUtterance.pitch = 1.0;
      this.currentUtterance.volume = 1.0;
      this.currentRate = rate;

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
      this.isPausedInternal = true;
      this.notifyStateChange();
    }
  }

  resumeSpeech() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
      this.isPausedInternal = false;
      this.notifyStateChange();
    }
  }

  pause() {
    this.isPausedInternal = true;
    this.pauseSpeech();
    this.pauseMP3();
  }

  // =====================================================================
  // [Fix] resume() - CLOVA/OpenAI 일시정지 후 재개 완전 수정
  // =====================================================================
  async resume() {
    console.log('[AudioService] 🔄 Resume sequence initiated (currentTime:', this.audioElement?.currentTime, ')');
    this.isPausedInternal = false;

    // 1. AudioContext 활성화
    if (this.audioContext) {
      console.log(`[AudioService] 🔍 Context state before resume: ${this.audioContext.state}`);
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('[AudioService] ✅ AudioContext resumed');
        }).catch(err => {
          console.error('[AudioService] ❌ AudioContext resume failed:', err);
        });
      }
    }

    // 2. Web Speech API (TTS) 재개
    if (this.synthesis.paused) {
      console.log('[AudioService] 🔄 Resuming Web Speech Synthesis...');
      this.synthesis.resume();
    }

    // 3. HTML5 Audio (MP3/Clova/OpenAI) 재개
    if (this.audioElement?.paused) {
      console.log(`[AudioService] 🔍 Audio Element - readyState: ${this.audioElement.readyState}, currentTime: ${this.audioElement.currentTime}`);
      this.audioElement.play().then(() => {
        console.log('[AudioService] ✅ Audio Element resumed successfully');
      }).catch(error => {
        console.error('[AudioService] ❌ Audio Element play failed:', error);
      });
    }

    // 4. Watchdog: 300ms 후 상태 체크 및 강제 재기동
    setTimeout(() => {
      if (this.isPausedInternal) return; // 그 사이 다시 정지됐으면 무시

      console.log(`[AudioService] 🧪 Stabilizer - Context: ${this.audioContext?.state}, AudioPaused: ${this.audioElement?.paused}, TTS: ${this.synthesis.speaking}`);

      // Native TTS 좀비 체크
      if (this.isSentenceMode && !this.clovaSentenceMode && !this.openaiSentenceMode) {
        if (this.synthesis.paused || !this.synthesis.speaking) {
          console.log('[AudioService] 🚑 TTS stalled → Hard Reset from sentence:', this.sentenceIndex);
          this.synthesis.cancel();
          setTimeout(() => {
            if (!this.isPausedInternal && this.isSentenceMode) {
              this.speakCurrentSentence();
              console.log('[AudioService] 🚀 Hard Reset success: sentence', this.sentenceIndex);
            }
          }, 50);
        }
      }

      // [Fix] CLOVA 재개 실패 시 현재 문장부터 재시작
      if (this.clovaSentenceMode && (!this.audioElement || this.audioElement.paused)) {
        console.log('[AudioService] 🚑 CLOVA stalled → restarting from sentence:', this.clovaSentenceIndex);
        this.playNextClovaSentence(this.clovaSessionId);
      }

      // [Fix] OpenAI 재개 실패 시 현재 문장부터 재시작
      if (this.openaiSentenceMode && (!this.audioElement || this.audioElement.paused)) {
        console.log('[AudioService] 🚑 OpenAI stalled → restarting from sentence:', this.openaiSentenceIndex);
        this.playNextOpenAISentence(this.openaiSessionId);
      }

      // HTML5 Audio 최종 킥스타트
      if (this.audioElement?.paused && (this.clovaSentenceMode || this.openaiSentenceMode || this.isMP3Playing())) {
        console.log('[AudioService] 🔄 Final kickstart at time:', this.audioElement.currentTime);
        this.audioElement.play().catch(e => {
          console.error('[AudioService] ❌ Final kickstart failed:', e);
        });
      }

      this.notifyStateChange();
    }, 300);

    this.resumeMP3();
  }

  private speakCurrentSentence() {
    if (!this.sentences || this.sentences.length === 0) return;
    console.log(`[AudioService] 🎤 Speaking sentence at index: ${this.sentenceIndex}`);
    this.isSentenceMode = true;
    this.playNextSentence(this.openaiSentenceLanguage || 'ko', this.currentRate, true);
  }

  isPaused(): boolean {
    return this.isPausedInternal;
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
    const speaking = this.synthesis.speaking || this.isMP3Playing() || this.clovaSentenceMode || (this.isPausedInternal && (this.synthesis.paused || this.isMP3Paused()));
    return !!speaking;
  }

  setOnStateChange(callback: ((isSpeaking: boolean) => void) | null) {
    this.onStateChange = callback;
  }

  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.isSpeaking());
    }
  }

  clearSpokenLandmarks() {
    this.spokenLandmarks.clear();
  }

  removeLandmark(landmarkId: string): void {
    this.spokenLandmarks.delete(landmarkId);
  }

  async unlockAudio() {
    if (this.isUnlocked && this.audioContext?.state === 'running') return;

    console.log('[AudioService] 🔓 오디오 엔진 잠금 해제 시작...');

    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        if (!this.audioContext) {
          this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.state === 'suspended') {
          console.log('[AudioService] 🔄 Resuming AudioContext from suspended state...');
          await this.audioContext.resume();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.0001;
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start(0);
        oscillator.stop(0.1);

        console.log(`[AudioService] ✅ Web Audio Context (${this.audioContext.state}) activated`);
      }

      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      this.synthesis.speak(utterance);

      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      silentAudio.volume = 0;
      await silentAudio.play().catch(() => { /* ignore */ });

      this.isUnlocked = true;
      this.loadVoicesWithRetry();

    } catch (e) {
      console.error('[AudioService] ❌ 오디오 엔진 잠금 해제 실패:', e);
    }
  }

  private keepAlive() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
      this.synthesis.resume();
      this.playbackTimer = setTimeout(() => this.keepAlive(), 10000);
    }
  }

  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public static splitIntoSentences(text: string): string[] {
    const sentenceRegex = /[^.!?。！？]+[.!?。！？]+/g;
    const matches = text.match(sentenceRegex);

    if (!matches || matches.length === 0) {
      return [text.trim()];
    }

    return matches.map(s => s.trim()).filter(s => s.length > 0);
  }

  playSentences(
    text: string,
    language: string = 'en',
    rate: number = 1.0,
    onSentenceChange?: (index: number) => void,
    onEnd?: () => void
  ) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.synthesis.cancel();
    this.currentUtterance = null;

    this.sentences = AudioService.splitIntoSentences(text);
    this.sentenceIndex = 0;
    this.onSentenceChange = onSentenceChange || null;
    this.onSentenceEnd = onEnd || null;
    this.isSentenceMode = true;
    this.currentRate = rate;

    if (this.onSentenceChange) {
      this.onSentenceChange(0);
    }

    this.playNextSentence(language, rate);
  }

  private playNextSentence(language: string, rate: number, skipIncrement: boolean = false) {
    if (!this.isSentenceMode || this.sentenceIndex >= this.sentences.length) {
      this.isSentenceMode = false;
      if (this.onSentenceEnd) {
        this.onSentenceEnd();
      }
      this.onSentenceChange = null;
      this.onSentenceEnd = null;
      return;
    }

    const sentence = this.sentences[this.sentenceIndex];
    const langCode = this.getLangCode(language);

    this.currentUtterance = new SpeechSynthesisUtterance(sentence);
    this.currentUtterance.lang = langCode;
    this.currentUtterance.rate = rate;
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = 1.0;

    const voice = this.getVoiceForLanguage(langCode);
    if (voice) {
      this.currentUtterance.voice = voice;
    }

    this.currentUtterance.onend = () => {
      if (!skipIncrement) {
        this.sentenceIndex++;
      }

      if (this.onSentenceChange && this.sentenceIndex < this.sentences.length) {
        this.onSentenceChange(this.sentenceIndex);
      }

      this.playbackTimer = setTimeout(() => {
        this.playNextSentence(language, rate);
      }, 150);
    };

    this.synthesis.speak(this.currentUtterance);
  }

  getCurrentSentenceIndex(): number {
    return this.sentenceIndex;
  }

  getSentences(): string[] {
    return this.sentences;
  }

  isInSentenceMode(): boolean {
    return this.isSentenceMode;
  }

  stopSentences() {
    this.isSentenceMode = false;
    this.sentences = [];
    this.sentenceIndex = 0;
    this.onSentenceChange = null;
    this.onSentenceEnd = null;
    this.stopClovaSentences();
    this.stopOpenAISentences();
    this.stop();
  }

  // ==================== OpenAI Sentence-by-Sentence Methods ====================

  private openaiSentenceMode: boolean = false;
  private openaiSentences: string[] = [];
  private openaiSentenceIndex: number = 0;
  private openaiSentenceLanguage: string = 'en';
  private onOpenAISentenceChange: ((index: number) => void) | null = null;
  private onOpenAISentenceEnd: (() => void) | null = null;
  private openaiAbortController: AbortController | null = null;
  private openaiSessionId: number = 0;

  async playOpenAISentences(
    text: string,
    language: string = 'en',
    onSentenceChange?: (index: number) => void,
    onEnd?: () => void
  ): Promise<boolean> {
    this.stopOpenAISentences();
    this.stopClovaSentences();
    this.stopMP3();
    this.stop();

    this.openaiSentences = AudioService.splitIntoSentences(text);
    if (this.openaiSentences.length === 0) return false;

    this.openaiSentenceIndex = 0;
    this.openaiSentenceLanguage = language;
    this.openaiSentenceMode = true;
    this.onOpenAISentenceChange = onSentenceChange || null;
    this.onOpenAISentenceEnd = onEnd || null;
    this.openaiSessionId++;

    if (this.onOpenAISentenceChange) {
      this.onOpenAISentenceChange(0);
    }

    this.playNextOpenAISentence(this.openaiSessionId);
    return true;
  }

  private async playNextOpenAISentence(sessionId: number): Promise<void> {
    if (sessionId !== this.openaiSessionId || !this.openaiSentenceMode) return;

    if (this.openaiSentenceIndex >= this.openaiSentences.length) {
      this.openaiSentenceMode = false;
      if (this.onOpenAISentenceEnd) this.onOpenAISentenceEnd();
      this.onOpenAISentenceChange = null;
      this.onOpenAISentenceEnd = null;
      return;
    }

    const sentence = this.openaiSentences[this.openaiSentenceIndex];
    const currentSessionId = this.openaiSessionId;
    const cacheKey = `openai-${this.openaiSentenceLanguage}-${sentence.slice(0, 50)}`;

    try {
      const cached = await offlineStorage.getAudio(cacheKey, this.openaiSentenceLanguage);
      if (sessionId !== this.openaiSessionId || !this.openaiSentenceMode) return;

      if (cached) {
        console.log('[AudioService] Using cached OpenAI sentence audio');
        this.playAudioBlob(
          cached.audioBlob,
          'openai',
          currentSessionId,
          () => this.openaiSessionId,
          () => this.openaiSentenceMode,
          () => {
            this.openaiSentenceIndex++;
            if (this.onOpenAISentenceChange && this.openaiSentenceIndex < this.openaiSentences.length) {
              this.onOpenAISentenceChange(this.openaiSentenceIndex);
            }
            this.playNextOpenAISentence(currentSessionId);
          }
        );
        return;
      }

      this.openaiAbortController = new AbortController();
      const response = await fetch('/api/tts/openai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentence,
          language: this.openaiSentenceLanguage
        }),
        signal: this.openaiAbortController.signal
      });

      if (currentSessionId !== this.openaiSessionId || !this.openaiSentenceMode) return;

      if (!response.ok) {
        console.error('[AudioService] OpenAI sentence TTS error:', response.status);
        this.openaiSentenceIndex++;
        if (this.onOpenAISentenceChange && this.openaiSentenceIndex < this.openaiSentences.length) {
          this.onOpenAISentenceChange(this.openaiSentenceIndex);
        }
        this.playNextOpenAISentence(currentSessionId);
        return;
      }

      const audioBlob = await response.blob();
      if (currentSessionId !== this.openaiSessionId || !this.openaiSentenceMode) return;

      try {
        await offlineStorage.saveAudio({
          landmarkId: cacheKey,
          language: this.openaiSentenceLanguage,
          audioBlob: audioBlob,
          duration: Math.ceil(sentence.length / 15),
          sizeBytes: audioBlob.size,
          voiceId: 'openai'
        });
      } catch (e) {
        console.warn('[AudioService] Failed to cache OpenAI audio:', e);
      }

      this.playAudioBlob(
        audioBlob,
        'openai',
        currentSessionId,
        () => this.openaiSessionId,
        () => this.openaiSentenceMode,
        () => {
          this.openaiSentenceIndex++;
          if (this.onOpenAISentenceChange && this.openaiSentenceIndex < this.openaiSentences.length) {
            this.onOpenAISentenceChange(this.openaiSentenceIndex);
          }
          this.playNextOpenAISentence(currentSessionId);
        }
      );
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('[AudioService] OpenAI sentence error:', error);
      if (currentSessionId !== this.openaiSessionId || !this.openaiSentenceMode) return;
      this.openaiSentenceIndex++;
      this.playNextOpenAISentence(currentSessionId);
    }
  }

  // =====================================================================
  // [Fix] playAudioBlob - 각 모드(CLOVA/OpenAI)에 맞는 세션 검증으로 수정
  // 기존: openaiSessionId/openaiSentenceMode만 체크해서 CLOVA에선 항상 onEnded 미호출
  // 수정: caller가 세션 getter를 주입 → 각 모드에서 올바른 값 체크
  // =====================================================================
  private playAudioBlob(
    blob: Blob,
    mode: 'openai' | 'clova',
    sessionId: number,
    getSessionId: () => number,
    getSentenceMode: () => boolean,
    onEnded: () => void
  ) {
    const objectUrl = URL.createObjectURL(blob);
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }

    this.audioElement = new Audio(objectUrl);
    this.audioElement.onended = () => {
      URL.revokeObjectURL(objectUrl);
      // [Fix] 각 모드의 세션ID와 sentenceMode를 올바르게 체크
      if (sessionId !== getSessionId() || !getSentenceMode()) return;
      onEnded();
    };

    this.audioElement.play().catch(e => {
      this.debugWarnOnce(`${mode}-play-error`, `[AudioService] ${mode} playback error: ${e}`);
      URL.revokeObjectURL(objectUrl);
      onEnded();
    });
  }

  stopOpenAISentences() {
    this.openaiSessionId++;
    this.openaiSentenceMode = false;
    this.openaiSentences = [];
    this.openaiSentenceIndex = 0;
    if (this.openaiAbortController) {
      this.openaiAbortController.abort();
      this.openaiAbortController = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  // ==================== CLOVA Sentence-by-Sentence Methods ====================

  private clovaSentenceMode: boolean = false;
  private clovaSentences: string[] = [];
  private clovaSentenceIndex: number = 0;
  private clovaSentenceLanguage: string = 'ko';
  private onClovaSentenceChange: ((index: number) => void) | null = null;
  private onClovaSentenceEnd: (() => void) | null = null;
  private clovaAbortController: AbortController | null = null;
  private clovaSessionId: number = 0;

  async playClovaSentences(
    text: string,
    language: string = 'ko',
    onSentenceChange?: (index: number) => void,
    onEnd?: () => void
  ): Promise<boolean> {
    this.stopClovaSentences();
    this.stopMP3();
    this.stop();

    this.clovaSentences = AudioService.splitIntoSentences(text);
    if (this.clovaSentences.length === 0) {
      return false;
    }

    this.clovaSentenceIndex = 0;
    this.clovaSentenceLanguage = language;
    this.clovaSentenceMode = true;
    this.onClovaSentenceChange = onSentenceChange || null;
    this.onClovaSentenceEnd = onEnd || null;
    this.clovaSessionId++;

    if (this.onClovaSentenceChange) {
      this.onClovaSentenceChange(0);
    }

    this.playNextClovaSentence(this.clovaSessionId);
    return true;
  }

  private async playNextClovaSentence(sessionId: number): Promise<void> {
    if (sessionId !== this.clovaSessionId || !this.clovaSentenceMode) {
      return;
    }

    if (this.clovaSentenceIndex >= this.clovaSentences.length) {
      this.clovaSentenceMode = false;
      if (this.onClovaSentenceEnd) {
        this.onClovaSentenceEnd();
      }
      this.onClovaSentenceChange = null;
      this.onClovaSentenceEnd = null;
      return;
    }

    const sentence = this.clovaSentences[this.clovaSentenceIndex];
    const voiceId = this.getSelectedClovaVoice(this.clovaSentenceLanguage) || 'nara';
    const currentSessionId = this.clovaSessionId;
    const cacheKey = `clova-${voiceId}-${sentence.slice(0, 40)}`;

    try {
      const cached = await offlineStorage.getAudio(cacheKey, this.clovaSentenceLanguage);
      if (currentSessionId !== this.clovaSessionId || !this.clovaSentenceMode) return;

      if (cached) {
        console.log(`[AudioService] Using cached CLOVA sentence audio (${voiceId})`);
        this.playAudioBlob(
          cached.audioBlob,
          'clova',
          currentSessionId,
          () => this.clovaSessionId,
          () => this.clovaSentenceMode,
          () => {
            this.clovaSentenceIndex++;
            if (this.onClovaSentenceChange && this.clovaSentenceIndex < this.clovaSentences.length) {
              this.onClovaSentenceChange(this.clovaSentenceIndex);
            }
            this.playNextClovaSentence(currentSessionId);
          }
        );
        return;
      }

      this.clovaAbortController = new AbortController();

      const response = await fetch('/api/tts/clova/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentence,
          language: this.clovaSentenceLanguage,
          voice: voiceId,
          speed: 0,
          pitch: 0,
          volume: 0
        }),
        signal: this.clovaAbortController.signal
      });

      if (currentSessionId !== this.clovaSessionId || !this.clovaSentenceMode) {
        return;
      }

      if (!response.ok) {
        console.error('[AudioService] CLOVA sentence TTS error:', response.status);
        this.clovaSentenceIndex++;
        if (this.onClovaSentenceChange && this.clovaSentenceIndex < this.clovaSentences.length) {
          this.onClovaSentenceChange(this.clovaSentenceIndex);
        }
        this.playNextClovaSentence(currentSessionId);
        return;
      }

      const audioBlob = await response.blob();

      if (currentSessionId !== this.clovaSessionId || !this.clovaSentenceMode) {
        return;
      }

      try {
        await offlineStorage.saveAudio({
          landmarkId: cacheKey,
          language: this.clovaSentenceLanguage,
          audioBlob: audioBlob,
          duration: Math.ceil(sentence.length / 10),
          sizeBytes: audioBlob.size,
          voiceId: voiceId
        });
      } catch (e) {
        console.warn('[AudioService] Failed to cache CLOVA audio:', e);
      }

      this.playAudioBlob(
        audioBlob,
        'clova',
        currentSessionId,
        () => this.clovaSessionId,
        () => this.clovaSentenceMode,
        () => {
          this.clovaSentenceIndex++;
          if (this.onClovaSentenceChange && this.clovaSentenceIndex < this.clovaSentences.length) {
            this.onClovaSentenceChange(this.clovaSentenceIndex);
          }
          this.playNextClovaSentence(currentSessionId);
        }
      );

    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return;
      }
      this.debugWarnOnce('clova-error', `[AudioService] CLOVA sentence error: ${error}`);

      if (currentSessionId !== this.clovaSessionId || !this.clovaSentenceMode) return;

      this.clovaSentenceIndex++;
      if (this.onClovaSentenceChange && this.clovaSentenceIndex < this.clovaSentences.length) {
        this.onClovaSentenceChange(this.clovaSentenceIndex);
      }
      this.playNextClovaSentence(currentSessionId);
    }
  }

  stopClovaSentences() {
    this.clovaSessionId++;
    this.clovaSentenceMode = false;
    this.clovaSentences = [];
    this.clovaSentenceIndex = 0;
    this.onClovaSentenceChange = null;
    this.onClovaSentenceEnd = null;

    if (this.clovaAbortController) {
      this.clovaAbortController.abort();
      this.clovaAbortController = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.onended = null;
      this.audioElement.onerror = null;
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  // ==================== MP3 Audio Methods ====================

  setAudioMode(mode: AudioMode) {
    this.audioMode = mode;
    localStorage.setItem('audio-mode', mode);
  }

  getAudioMode(): AudioMode {
    return this.audioMode;
  }

  async hasCachedAudio(landmarkId: string, language: string): Promise<boolean> {
    try {
      return await offlineStorage.hasAudio(landmarkId, language);
    } catch {
      return false;
    }
  }

  async playMP3(
    landmarkId: string,
    language: string,
    audioUrl?: string,
    onEnd?: () => void
  ): Promise<boolean> {
    try {
      this.stopMP3();
      this.stop();

      const cachedAudio = await offlineStorage.getAudio(landmarkId, language);

      if (cachedAudio) {
        const objectUrl = URL.createObjectURL(cachedAudio.audioBlob);
        this.audioElement = new Audio(objectUrl);

        this.audioElement.onended = () => {
          URL.revokeObjectURL(objectUrl);
          onEnd?.();
        };

        this.audioElement.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          this.debugWarnOnce('cached-mp3-error', '[AudioService] Error playing cached audio');
        };

        this.audioElement.playbackRate = this.currentRate;
        await this.audioElement.play();
        console.log(`[AudioService] Playing cached MP3 for ${landmarkId} (${language})`);
        return true;
      }

      if (audioUrl) {
        this.audioElement = new Audio(audioUrl);

        this.audioElement.onended = () => {
          onEnd?.();
        };

        this.audioElement.playbackRate = this.currentRate;
        await this.audioElement.play();
        console.log(`[AudioService] Playing MP3 from URL for ${landmarkId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AudioService] Error playing MP3:', error);
      return false;
    }
  }

  async playAuto(
    landmarkId: string,
    text: string,
    language: string = 'en',
    audioUrl?: string,
    onEnd?: () => void
  ): Promise<void> {
    if (this.audioMode === 'tts') {
      this.playText(text, language, this.currentRate, onEnd);
      return;
    }

    if (this.audioMode === 'clova') {
      const success = await this.playClovaTTS(text, language, onEnd);
      if (success) {
        this.spokenLandmarks.add(landmarkId);
      }
      return;
    }

    if (this.audioMode === 'mp3' || this.audioMode === 'auto') {
      const success = await this.playMP3(landmarkId, language, audioUrl, onEnd);

      if (success) {
        this.spokenLandmarks.add(landmarkId);
        return;
      }

      if (this.audioMode === 'auto') {
        console.log(`[AudioService] MP3 not available, falling back to TTS for ${landmarkId}`);
        this.playText(text, language, this.currentRate, onEnd);
        this.spokenLandmarks.add(landmarkId);
      }
    }
  }

  async playClovaTTS(
    text: string,
    language: string = 'ko',
    onEnd?: () => void,
    voiceId?: string
  ): Promise<boolean> {
    try {
      this.stopMP3();
      this.stop();

      const effectiveVoiceId = voiceId || this.getSelectedClovaVoice(language);

      const response = await fetch('/api/tts/clova/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voice: effectiveVoiceId,
          speed: 0,
          pitch: 0,
          volume: 0
        })
      });

      if (!response.ok) {
        throw new Error(`CLOVA TTS error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const objectUrl = URL.createObjectURL(audioBlob);

      this.audioElement = new Audio(objectUrl);

      this.audioElement.onended = () => {
        URL.revokeObjectURL(objectUrl);
        onEnd?.();
      };

      this.audioElement.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        console.error('[AudioService] Error playing CLOVA TTS');
      };

      this.audioElement.playbackRate = this.currentRate;
      await this.audioElement.play();
      console.log(`[AudioService] Playing CLOVA TTS (${language})`);
      return true;
    } catch (error) {
      console.error('[AudioService] CLOVA TTS error:', error);
      return false;
    }
  }

  async downloadAndCacheAudio(
    landmarkId: string,
    language: string,
    text: string,
    voiceId?: string
  ): Promise<boolean> {
    const progressKey = `${landmarkId}-${language}`;

    try {
      this.updateDownloadProgress(progressKey, {
        landmarkId,
        language,
        progress: 0,
        status: 'downloading'
      });

      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkId,
          language,
          text,
          voiceId
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();

      this.updateDownloadProgress(progressKey, {
        landmarkId,
        language,
        progress: 50,
        status: 'downloading'
      });

      const audioResponse = await fetch(result.audioUrl);
      if (!audioResponse.ok) {
        throw new Error('Failed to download audio file');
      }

      const audioBlob = await audioResponse.blob();

      this.updateDownloadProgress(progressKey, {
        landmarkId,
        language,
        progress: 80,
        status: 'downloading'
      });

      await offlineStorage.saveAudio({
        landmarkId,
        language,
        audioBlob,
        duration: result.duration,
        sizeBytes: result.sizeBytes,
        checksum: result.checksum,
        voiceId: result.voiceId
      });

      this.updateDownloadProgress(progressKey, {
        landmarkId,
        language,
        progress: 100,
        status: 'complete'
      });

      console.log(`[AudioService] Downloaded and cached audio for ${landmarkId} (${language})`);
      return true;
    } catch (error: any) {
      console.error(`[AudioService] Failed to download audio for ${landmarkId}:`, error);

      this.updateDownloadProgress(progressKey, {
        landmarkId,
        language,
        progress: 0,
        status: 'error',
        error: error.message
      });

      return false;
    }
  }

  async downloadBatchAudio(
    items: Array<{ landmarkId: string; language: string; text: string; voiceId?: string }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of items) {
      const result = await this.downloadAndCacheAudio(
        item.landmarkId,
        item.language,
        item.text,
        item.voiceId
      );

      if (result) {
        success++;
      } else {
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { success, failed };
  }

  private updateDownloadProgress(key: string, progress: AudioDownloadProgress) {
    this.downloadProgress.set(key, progress);
    this.onDownloadProgressChange?.(new Map(this.downloadProgress));
  }

  setOnDownloadProgressChange(callback: ((progress: Map<string, AudioDownloadProgress>) => void) | null) {
    this.onDownloadProgressChange = callback;
  }

  getDownloadProgress(): Map<string, AudioDownloadProgress> {
    return new Map(this.downloadProgress);
  }

  clearCompletedDownloads() {
    const keysToDelete: string[] = [];
    this.downloadProgress.forEach((progress, key) => {
      if (progress.status === 'complete' || progress.status === 'error') {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.downloadProgress.delete(key));
    this.onDownloadProgressChange?.(new Map(this.downloadProgress));
  }

  stopMP3() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  pauseMP3() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  resumeMP3() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
    }
  }

  isMP3Playing(): boolean {
    return this.audioElement !== null && !this.audioElement.paused;
  }

  isMP3Paused(): boolean {
    return this.audioElement !== null && this.audioElement.paused;
  }

  setMP3Rate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    this.currentRate = rate;
    localStorage.setItem('tts-speed', rate.toString());
  }

  async getAudioCacheStats(): Promise<{ count: number; totalSizeBytes: number; sizeMB: string }> {
    const stats = await offlineStorage.getAudioStorageStats();
    return {
      ...stats,
      sizeMB: (stats.totalSizeBytes / (1024 * 1024)).toFixed(2)
    };
  }

  async clearAudioCache(): Promise<void> {
    await offlineStorage.clearAllAudio();
    console.log('[AudioService] Audio cache cleared');
  }

  async deleteCachedAudio(landmarkId: string, language: string): Promise<void> {
    await offlineStorage.deleteAudio(landmarkId, language);
  }

  stopAll() {
    this.stopMP3();
    this.stop();
    this.clovaSentenceMode = false;
    this.notifyStateChange();
  }

  private debugWarnOnce(key: string, message: string) {
    if (typeof window !== 'undefined') {
      const g = window as any;
      if (!g.__audioWarned) g.__audioWarned = new Set();
      if (!g.__audioWarned.has(key)) {
        console.warn(message);
        g.__audioWarned.add(key);
      }
    }
  }

  private debugLogOnce(key: string, message: string) {
    if (typeof window !== 'undefined') {
      const g = window as any;
      if (!g.__audioWarned) g.__audioWarned = new Set();
      if (!g.__audioWarned.has(key)) {
        console.log(message);
        g.__audioWarned.add(key);
      }
    }
  }
}

export const audioService = new AudioService();
