import { offlineStorage } from './offlineStorage';

export type AudioMode = 'auto' | 'mp3' | 'tts' | 'openai';

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
  private selectedVoicesByLanguage: Map<string, string> = new Map(); // language -> voice name
  private isUnlocked: boolean = false;
  private isPausedInternal: boolean = false;
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();
  // Suppression set moved to window level in helper methods

  private audioElement: HTMLAudioElement | null = null;
  private audioMode: AudioMode = 'auto';
  private downloadProgress: Map<string, AudioDownloadProgress> = new Map();
  private onDownloadProgressChange: ((progress: Map<string, AudioDownloadProgress>) => void) | null = null;
  private onStateChange: ((isSpeaking: boolean) => void) | null = null;

  // [Bug Doctor] AudioContext 싱글톤 관리
  private audioContext: AudioContext | null = null;
  private silentOscillator: OscillatorNode | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.spokenLandmarks = new Set();
    this.isEnabled = true;

    // Load saved rate from localStorage, default to 1.2
    const savedRate = localStorage.getItem('tts-speed');
    if (savedRate) {
      this.currentRate = parseFloat(savedRate);
    } else {
      this.currentRate = 1.2;
      localStorage.setItem('tts-speed', '1.2');
    }

    // Load saved audio mode
    const savedMode = localStorage.getItem('audio-mode') as AudioMode;
    if (savedMode && ['auto', 'mp3', 'tts', 'openai'].includes(savedMode)) {
      this.audioMode = savedMode;
    }

    // Load saved voice selections per language
    this.loadSelectedVoices();

    // [Bug Doctor] 음성 목록 로딩 — 브라우저마다 getVoices() 반환 시점이 다름
    // Chrome은 비동기, Firefox/Safari는 동기적으로 반환하는 경우가 많습니다.
    this.loadVoicesWithRetry();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        this.voices = this.synthesis.getVoices();
        this.voiceCache.clear(); // 음성 목록이 변경되면 캐시도 초기화
      };
    }
  }

  /**
   * [학습 포인트] 음성 목록 재시도 로딩
   * 
   * 문제: 모바일 Chrome 등의 브라우저에서 speechSynthesis.getVoices()가
   *       초기 로딩 시 빈 배열을 반환하여 "No voices found for ko-KR" 경고 발생.
   * 
   * 해결: 최대 5회까지 200ms 간격으로 재시도하여 음성 목록을 안정적으로 가져옵니다.
   * onvoiceschanged 이벤트가 발생하면 즉시 반영되지만, 해당 이벤트가
   * 지원되지 않는 환경을 위한 폴백 전략입니다.
   */
  private loadVoicesWithRetry(attempt: number = 0, maxAttempts: number = 10) {
    this.voices = this.synthesis.getVoices();

    if (this.voices.length === 0 && attempt < maxAttempts) {
      // 음성 목록이 아직 준비되지 않았으면 시도 횟수에 따라 간격을 늘려가며 재시도
      const delay = Math.min(200 * (attempt + 1), 1000);
      setTimeout(() => this.loadVoicesWithRetry(attempt + 1, maxAttempts), delay);
    } else if (this.voices.length > 0) {
      console.log(`[AudioService] ✅ ${this.voices.length}개 음성 로딩 완료 (시도 ${attempt + 1}회)`);
      // 한국어 음성이 있는지 최종 확인
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
      // ignore
    }
  }

  // Get all available voices
  getAllVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }
    return this.voices;
  }

  // Get available voices for a specific language
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

  // Set selected voice for a language
  setVoiceForLanguage(language: string, voiceName: string) {
    this.selectedVoicesByLanguage.set(language, voiceName);
    this.saveSelectedVoices();
    this.debugLogOnce(`voice-set-${language}`, `[AudioService] Set voice for ${language}: ${voiceName}`);
  }

  // Get selected voice name for a language
  getSelectedVoiceName(language: string): string | null {
    return this.selectedVoicesByLanguage.get(language) || null;
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

  // Get all possible language codes for broader voice selection
  private getLanguageVariants(langCode: string): string[] {
    const baseLang = langCode.split('-')[0];

    // Priority regional variants for quality
    const variants: { [key: string]: string[] } = {
      'es': ['es-ES', 'es-MX', 'es-US', 'es-AR', 'es-CO'],
      'en': ['en-US', 'en-GB', 'en-AU', 'en-IN'],
      'zh': ['zh-CN', 'zh-HK', 'zh-TW'],
      'pt': ['pt-PT', 'pt-BR'],
    };

    return variants[baseLang] || [langCode];
  }

  // Find the best voice for the given language (prioritize natural/premium voices)
  private getVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    // Check cache first for performance
    if (this.voiceCache.has(langCode)) {
      return this.voiceCache.get(langCode) || null;
    }

    // Refresh voices if empty
    if (this.voices.length === 0) {
      this.voices = this.synthesis.getVoices();
    }

    const baseLang = langCode.split('-')[0];

    // Check if user has selected a specific voice for this language
    const selectedVoiceName = this.selectedVoicesByLanguage.get(baseLang);
    if (selectedVoiceName) {
      const selectedVoice = this.voices.find(v => v.name === selectedVoiceName);
      if (selectedVoice) {
        this.debugLogOnce(`user-voice-${langCode}`, `[AudioService] Using user-selected voice for ${langCode}: ${selectedVoice.name}`);
        return selectedVoice;
      }
    }

    // [Bug Doctor] 언어 코드 정규화 (ko-KR, ko_KR, KO_KR 등 모두 대응)
    const normalize = (code: string) => code.toLowerCase().replace('_', '-');
    const normTarget = normalize(langCode);
    const normBase = normTarget.split('-')[0];
    const langVariants = this.getLanguageVariants(langCode);
    const normVariants = langVariants.map(normalize);

    // Filter voices for the target language (including all variants)
    const matchingVoices = this.voices.filter(v => {
      const vNorm = normalize(v.lang);
      const vBase = vNorm.split('-')[0];
      return normVariants.includes(vNorm) || vBase === normBase;
    });

    if (matchingVoices.length === 0) {
      if (normTarget === 'en-us') {
        this.debugWarnOnce('en-uss-missing', `[AudioService] Critical: No voices available for ${langCode}. Total voices: ${this.voices.length}`);
        // 최후의 수단: 첫 번째 음성이라도 반환
        return this.voices[0] || null;
      }

      // LAST RESORT FALLBACK
      this.debugWarnOnce(`missing-${langCode}`, `[AudioService] No matching voices for ${langCode} (${normTarget}), falling back to English`);
      return this.getVoiceForLanguage('en-US');
    }

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

    // Log the selected voice for debugging (only once per language)
    this.debugLogOnce(`selected-${langCode}`, `[AudioService] Selected voice for ${langCode}: ${scoredVoices[0].voice.name} (Lang: ${scoredVoices[0].voice.lang}, Score: ${scoredVoices[0].score})`);

    // Update cache
    this.voiceCache.set(langCode, scoredVoices[0].voice);

    return scoredVoices[0].voice;
  }

  // Check if a native voice exists for the language on this device
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

    // Check if native voice exists, if not, warn or suggest fallback
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

  // Unified pause for all active modes
  pause() {
    this.isPausedInternal = true;
    this.pauseSpeech();
    this.pauseMP3();
  }

  // =====================================================================
  // [Fix] resume() - OpenAI/TTS 일시정지 후 재개 완전 최적화 (CLOVA 제거 버전)
  // =====================================================================
  async resume() {
    console.log('[AudioService] 🔄 Resume sequence initiated (currentTime:', this.audioElement ? this.audioElement.currentTime : 'N/A', ')');
    this.isPausedInternal = false;

    // 1. AudioContext 활성화 (모바일 브라우저 정책 대응)
    if (this.audioContext) {
      console.log(`[AudioService] 🔍 Context state before resume: ${this.audioContext.state}`);
      if (this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
          console.log('[AudioService] ✅ AudioContext resumed');
        } catch (err) {
          console.error('[AudioService] ❌ AudioContext resume failed:', err);
        }
      }
    }

    // 2. Web Speech API (TTS) 재개
    // [Bug Doctor] 일부 브라우저에서는 resume()만으로 부족할 수 있어 cancel 후 다시 시작하는 로직이 Watchdog에 포함됨
    if (this.synthesis.paused) {
      console.log('[AudioService] 🔄 Resuming Web Speech Synthesis...');
      this.synthesis.resume();
    }

    // 3. HTML5 Audio (MP3/OpenAI) 재개
    if (this.audioElement && this.audioElement.paused) {
      console.log(`[AudioService] 🔍 Audio Element - readyState: ${this.audioElement.readyState}, currentTime: ${this.audioElement.currentTime}`);
      try {
        await this.audioElement.play();
        console.log('[AudioService] ✅ Audio Element resumed successfully');
      } catch (error) {
        console.error('[AudioService] ❌ Audio Element play failed:', error);
        // [Bug Doctor] 만약 DOMException: The play() request was interrupted by a call to pause() 에러 발생 시 재시도 고려
      }
    }

    // 4. Watchdog: 200ms 후 상태 체크 및 강제 재기동 (좀비 TTS 방지)
    // 기존 300ms에서 200ms로 단축하여 더 빠른 응답 제공
    setTimeout(() => {
      if (this.isPausedInternal) return;

      console.log(`[AudioService] 🧪 Stabilizer Phase 1 - Context: ${this.audioContext?.state}, AudioPaused: ${this.audioElement ? this.audioElement.paused : 'N/A'}, TTS: ${this.synthesis.speaking}`);

      // Native TTS 좀비 체크
      if (this.isSentenceMode && !this.openaiSentenceMode) {
        if (this.synthesis.paused || !this.synthesis.speaking) {
          console.log('[AudioService] 🚑 TTS stalled → Hard Reset from sentence:', this.sentenceIndex);
          this.synthesis.cancel();
          setTimeout(() => {
            if (!this.isPausedInternal && this.isSentenceMode) {
              this.speakCurrentSentence();
            }
          }, 100);
        }
      }

      // OpenAI/MP3 재입력 (Kickstart)
      if ((this.openaiSentenceMode || this.isMP3Playing()) && this.audioElement?.paused) {
        console.log('[AudioService] 🚑 Audio stalled → Final kickstart');
        this.audioElement?.play().catch(e => console.error('[AudioService] ❌ Kickstart failed:', e));
      }

      this.notifyStateChange();
    }, 200);

    this.resumeMP3();
  }

  // [Bug Doctor] 현재 문장 인덱스부터 다시 읽어주는 도우미 함수
  private speakCurrentSentence() {
    if (!this.sentences || this.sentences.length === 0) return;
    console.log(`[AudioService] 🎤 Speaking sentence at index: ${this.sentenceIndex}`);
    this.isSentenceMode = true;
    // playNextSentence(lang, rate, skipNextIndexIncrement) - skip increment to stay on current sentence
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
    const speaking = this.synthesis.speaking || this.isMP3Playing() || this.openaiSentenceMode || (this.isPausedInternal && (this.synthesis.paused || this.isMP3Paused()));
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

  // Unlock audio engine (call from user gesture)
  async unlockAudio() {
    if (this.isUnlocked && this.audioContext?.state === 'running') return;

    console.log('[AudioService] 🔓 [Bug Doctor] 모바일 안정성을 위한 오디오 엔진 정밀 잠금 해제 시작...');

    try {
      // 1. Web Audio API Context 싱글톤 활성화
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioContextClass) {
        if (!this.audioContext) {
          this.audioContext = new AudioContextClass();
        }

        if (this.audioContext.state === 'suspended') {
          console.log('[AudioService] 🔄 Resuming AudioContext from suspended state...');
          await this.audioContext.resume();
        }

        // 아주 짧은 무음 비프음을 생성하여 하드웨어 채널을 점유합니다.
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.0001;
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.start(0);
        oscillator.stop(0.1);

        console.log(`[AudioService] ✅ Web Audio Context (${this.audioContext.state}) activated`);
      }

      // 2. Web Speech API (TTS) 잠금 해제 - 빈 문장 동기 재생
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.volume = 0;
      this.synthesis.speak(utterance);

      // 3. HTML5 Audio (MP3) 잠금 해제
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      silentAudio.volume = 0;
      await silentAudio.play().catch(() => { /* ignore */ });

      this.isUnlocked = true;

      // 4. [Bug Doctor] 음성 목록 최종 재로딩
      this.loadVoicesWithRetry();

    } catch (e) {
      console.error('[AudioService] ❌ [Bug Doctor] 오디오 엔진 통합 잠금 해제 실패:', e);
    }
  }

  // Helper to prevent SpeechSynthesis from timing out on long texts
  private keepAlive() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      // [Bug Doctor] iOS/Mac Safari 호환성을 위한 일시정지 후 즉시 재개 전략
      this.synthesis.pause();
      this.synthesis.resume();
      this.playbackTimer = setTimeout(() => this.keepAlive(), 10000);
    }
  }

  getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  // Split text into sentences for sentence-by-sentence highlighting
  public static splitIntoSentences(text: string): string[] {
    // Split by common sentence-ending punctuation, keeping the punctuation
    const sentenceRegex = /[^.!?。！？]+[.!?。！？]+/g;
    const matches = text.match(sentenceRegex);

    if (!matches || matches.length === 0) {
      // If no sentence endings found, return the whole text as one sentence
      return [text.trim()];
    }

    return matches.map(s => s.trim()).filter(s => s.length > 0);
  }

  // Play text sentence by sentence with highlighting callback
  playSentences(
    text: string,
    language: string = 'en',
    rate: number = 1.0,
    onSentenceChange?: (index: number) => void,
    onEnd?: () => void,
    startIndex: number = 0
  ) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }

    this.synthesis.cancel();
    this.currentUtterance = null;

    this.sentences = AudioService.splitIntoSentences(text);
    this.sentenceIndex = startIndex;
    this.onSentenceChange = onSentenceChange || null;
    this.onSentenceEnd = onEnd || null;
    this.isSentenceMode = true;
    this.currentRate = rate;

    // Notify starting sentence
    if (this.onSentenceChange) {
      this.onSentenceChange(this.sentenceIndex);
    }

    this.playNextSentence(language, rate);
  }

  private playNextSentence(language: string, rate: number, skipIncrement: boolean = false) {
    if (!this.isSentenceMode || this.sentenceIndex >= this.sentences.length) {
      // All sentences done
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

    // Set language-specific voice
    const voice = this.getVoiceForLanguage(langCode);
    if (voice) {
      this.currentUtterance.voice = voice;
    }

    this.currentUtterance.onend = () => {
      if (!skipIncrement) {
        this.sentenceIndex++;
      }

      // Notify next sentence if available
      if (this.onSentenceChange && this.sentenceIndex < this.sentences.length) {
        this.onSentenceChange(this.sentenceIndex);
      }

      // Small delay between sentences for natural pacing
      this.playbackTimer = setTimeout(() => {
        this.playNextSentence(language, rate);
      }, 150);
    };

    this.synthesis.speak(this.currentUtterance);
  }

  // Get current sentence index for highlighting
  getCurrentSentenceIndex(): number {
    return this.sentenceIndex;
  }

  // Get all sentences
  getSentences(): string[] {
    return this.sentences;
  }

  // Check if in sentence mode
  isInSentenceMode(): boolean {
    return this.isSentenceMode;
  }

  stopSentences() {
    this.isSentenceMode = false;
    this.sentences = [];
    this.sentenceIndex = 0;
    this.onSentenceChange = null;
    this.onSentenceEnd = null;
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
    onEnd?: () => void,
    startIndex: number = 0
  ): Promise<boolean> {
    this.stopOpenAISentences();
    this.stopMP3();
    this.stop();

    this.openaiSentences = AudioService.splitIntoSentences(text);
    if (this.openaiSentences.length === 0) return false;

    this.openaiSentenceIndex = startIndex;
    this.openaiSentenceLanguage = language;
    this.openaiSentenceMode = true;
    this.onOpenAISentenceChange = onSentenceChange || null;
    this.onOpenAISentenceEnd = onEnd || null;
    this.openaiSessionId++;

    if (this.onOpenAISentenceChange) {
      this.onOpenAISentenceChange(this.openaiSentenceIndex);
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
    const cacheKey = `openai-${this.openaiSentenceLanguage}-${sentence.slice(0, 50)}`; // Unique key for sentence cache

    try {
      // 1. Check Offline Cache First
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

      // 2. Fetch from API if not cached
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

      // 3. Save to Offline Cache
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
  // [Fix] playAudioBlob - 모드별 세션 검증 주입식 로직 (CLOVA 제거 대응)
  // caller가 세션 검증 로직을 주입하여 각 모드에서 올바른 라이프사이클을 체크함
  // =====================================================================
  private playAudioBlob(
    blob: Blob,
    mode: 'openai',
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
      // 세션ID와 sentenceMode를 주입받은 함수로 체크
      if (sessionId !== getSessionId() || !getSentenceMode()) return;
      onEnded();
    };

    this.audioElement.play().catch(e => {
      this.debugWarnOnce(`${mode}-play-error`, `[AudioService] ${mode} playback error: ${e}`);
      URL.revokeObjectURL(objectUrl);
      // 에러 발생 시에도 다음으로 넘어가도록 유도 (혹은 세션 체크 후 진행)
      if (sessionId !== getSessionId() || !getSentenceMode()) return;
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

  // ==================== MP3 Audio Methods ====================

  // Set audio mode preference
  setAudioMode(mode: AudioMode) {
    this.audioMode = mode;
    localStorage.setItem('audio-mode', mode);
  }

  getAudioMode(): AudioMode {
    return this.audioMode;
  }

  // Check if cached MP3 audio exists for a landmark
  async hasCachedAudio(landmarkId: string, language: string): Promise<boolean> {
    try {
      return await offlineStorage.hasAudio(landmarkId, language);
    } catch {
      return false;
    }
  }

  // Play MP3 audio from cache or URL
  async playMP3(
    landmarkId: string,
    language: string,
    audioUrl?: string,
    onEnd?: () => void
  ): Promise<boolean> {
    try {
      // Stop any current playback
      this.stopMP3();
      this.stop();

      // Check for cached audio first
      const cachedAudio = await offlineStorage.getAudio(landmarkId, language);

      if (cachedAudio) {
        // Play from IndexedDB cache
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

      // If no cached audio, try to play from URL
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

  // Play audio with automatic fallback (MP3 -> TTS)
  async playAuto(
    landmarkId: string,
    text: string,
    language: string = 'en',
    audioUrl?: string,
    onEnd?: () => void
  ): Promise<void> {
    if (this.audioMode === 'tts') {
      // Force TTS mode
      this.playText(text, language, this.currentRate, onEnd);
      return;
    }

    if (this.audioMode === 'mp3' || this.audioMode === 'auto') {
      // Try MP3 first
      const success = await this.playMP3(landmarkId, language, audioUrl, onEnd);

      if (success) {
        this.spokenLandmarks.add(landmarkId);
        return;
      }

      // Fallback to TTS if MP3 mode is 'auto'
      if (this.audioMode === 'auto') {
        console.log(`[AudioService] MP3 not available, falling back to TTS for ${landmarkId}`);
        this.playText(text, language, this.currentRate, onEnd);
        this.spokenLandmarks.add(landmarkId);
      }
    }
  }

  // Download and cache audio from server
  async downloadAndCacheAudio(
    landmarkId: string,
    language: string,
    text: string,
    voiceId?: string
  ): Promise<boolean> {
    const progressKey = `${landmarkId}-${language}`;

    try {
      // Update progress
      this.updateDownloadProgress(progressKey, {
        landmarkId,
        language,
        progress: 0,
        status: 'downloading'
      });

      // Request audio generation from server
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

      // Fetch the MP3 file
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

      // Save to IndexedDB
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

  // Download audio for multiple landmarks (batch)
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

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { success, failed };
  }

  // Update download progress
  private updateDownloadProgress(key: string, progress: AudioDownloadProgress) {
    this.downloadProgress.set(key, progress);
    this.onDownloadProgressChange?.(new Map(this.downloadProgress));
  }

  // Set download progress callback
  setOnDownloadProgressChange(callback: ((progress: Map<string, AudioDownloadProgress>) => void) | null) {
    this.onDownloadProgressChange = callback;
  }

  // Get download progress
  getDownloadProgress(): Map<string, AudioDownloadProgress> {
    return new Map(this.downloadProgress);
  }

  // Clear completed downloads from progress
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

  // Stop MP3 playback
  stopMP3() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  // Pause MP3
  pauseMP3() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  // Resume MP3
  resumeMP3() {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play();
    }
  }

  // Check if MP3 is playing
  isMP3Playing(): boolean {
    return this.audioElement !== null && !this.audioElement.paused;
  }

  // Check if MP3 is paused
  isMP3Paused(): boolean {
    return this.audioElement !== null && this.audioElement.paused;
  }

  // Set MP3 playback rate
  setMP3Rate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    this.currentRate = rate;
    localStorage.setItem('tts-speed', rate.toString());
  }

  // Get cached audio stats
  async getAudioCacheStats(): Promise<{ count: number; totalSizeBytes: number; sizeMB: string }> {
    const stats = await offlineStorage.getAudioStorageStats();
    return {
      ...stats,
      sizeMB: (stats.totalSizeBytes / (1024 * 1024)).toFixed(2)
    };
  }

  // Clear all cached audio
  async clearAudioCache(): Promise<void> {
    await offlineStorage.clearAllAudio();
    console.log('[AudioService] Audio cache cleared');
  }

  // Delete cached audio for a specific landmark/language
  async deleteCachedAudio(landmarkId: string, language: string): Promise<void> {
    await offlineStorage.deleteAudio(landmarkId, language);
  }

  // Stop all audio (both MP3 and TTS)
  stopAll() {
    this.stopMP3();
    this.stop();
    this.notifyStateChange();
  }

  // Helper for single-emission warnings (using window global to survive re-renders/HMR)
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

  // Helper for single-emission logs
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
