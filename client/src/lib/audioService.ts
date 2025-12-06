import { offlineStorage } from './offlineStorage';

export type AudioMode = 'auto' | 'mp3' | 'tts' | 'clova';

interface AudioDownloadProgress {
  landmarkId: string;
  language: string;
  progress: number; // 0-100
  status: 'pending' | 'downloading' | 'complete' | 'error';
  error?: string;
}

class AudioService {
  private synthesis: SpeechSynthesis;
  private spokenLandmarks: Set<string>;
  private isEnabled: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentRate: number = 1.0;
  private voices: SpeechSynthesisVoice[] = [];
  private playbackTimer: NodeJS.Timeout | null = null;
  private sentenceIndex: number = 0;
  private sentences: string[] = [];
  private onSentenceChange: ((index: number) => void) | null = null;
  private onSentenceEnd: (() => void) | null = null;
  private isSentenceMode: boolean = false;
  private selectedVoicesByLanguage: Map<string, string> = new Map(); // language -> voice name
  
  // MP3 Audio properties
  private audioElement: HTMLAudioElement | null = null;
  private audioMode: AudioMode = 'auto';
  private downloadProgress: Map<string, AudioDownloadProgress> = new Map();
  private onDownloadProgressChange: ((progress: Map<string, AudioDownloadProgress>) => void) | null = null;

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
    
    // Load saved audio mode
    const savedMode = localStorage.getItem('audio-mode') as AudioMode;
    if (savedMode && ['auto', 'mp3', 'tts', 'clova'].includes(savedMode)) {
      this.audioMode = savedMode;
    }

    // Load saved voice selections per language
    this.loadSelectedVoices();
    
    // Load voices when available
    this.loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synthesis.getVoices();
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
    console.log(`[AudioService] Set voice for ${language}: ${voiceName}`);
  }
  
  // Get selected voice name for a language
  getSelectedVoiceName(language: string): string | null {
    return this.selectedVoicesByLanguage.get(language) || null;
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

    const baseLang = langCode.split('-')[0];
    
    // Check if user has selected a specific voice for this language
    const selectedVoiceName = this.selectedVoicesByLanguage.get(baseLang);
    if (selectedVoiceName) {
      const selectedVoice = this.voices.find(v => v.name === selectedVoiceName);
      if (selectedVoice) {
        console.log(`[AudioService] Using user-selected voice for ${langCode}: ${selectedVoice.name}`);
        return selectedVoice;
      }
    }

    // Get all language variants to search (especially important for Spanish)
    const langVariants = this.getLanguageVariants(langCode);

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

  // Split text into sentences for sentence-by-sentence highlighting
  splitIntoSentences(text: string): string[] {
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
    onEnd?: () => void
  ) {
    if (this.playbackTimer) {
      clearTimeout(this.playbackTimer);
      this.playbackTimer = null;
    }
    
    this.synthesis.cancel();
    this.currentUtterance = null;
    
    this.sentences = this.splitIntoSentences(text);
    this.sentenceIndex = 0;
    this.onSentenceChange = onSentenceChange || null;
    this.onSentenceEnd = onEnd || null;
    this.isSentenceMode = true;
    this.currentRate = rate;
    
    // Notify first sentence
    if (this.onSentenceChange) {
      this.onSentenceChange(0);
    }
    
    this.playNextSentence(language, rate);
  }

  private playNextSentence(language: string, rate: number) {
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
      this.sentenceIndex++;
      
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
    this.stop();
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
          console.error('Error playing cached audio');
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

    if (this.audioMode === 'clova') {
      // Force CLOVA TTS mode
      const success = await this.playClovaTTS(text, language, onEnd);
      if (success) {
        this.spokenLandmarks.add(landmarkId);
      }
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

  // Play CLOVA Voice TTS
  async playClovaTTS(
    text: string,
    language: string = 'ko',
    onEnd?: () => void,
    voiceId?: string
  ): Promise<boolean> {
    try {
      this.stopMP3();
      this.stop();

      const response = await fetch('/api/tts/clova/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          voice: voiceId,
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
    this.stopSentences();
    this.stop();
  }
}

export const audioService = new AudioService();
