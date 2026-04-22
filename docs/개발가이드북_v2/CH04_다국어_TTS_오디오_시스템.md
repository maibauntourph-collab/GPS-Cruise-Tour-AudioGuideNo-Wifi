# Chapter 4: 다국어 TTS 오디오 시스템
> `client/src/lib/audioService.ts` — 1,432줄의 오디오 엔진 완전 해부

---

## 4.1 오디오 아키텍처 개요

AudioService는 **3가지 오디오 소스**를 관리합니다:

```
┌─────────────────────────────────────────────────┐
│                 AudioService                     │
│                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│   │ Native   │  │ OpenAI   │  │ MP3      │      │
│   │ TTS      │  │ TTS      │  │ Cache    │      │
│   │ (무료)   │  │ (고품질) │  │ (오프라인)│      │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│        │              │              │            │
│        └──────┬───────┴──────┬───────┘            │
│               │              │                    │
│         Auto Mode 폴백 체인:                      │
│         MP3 캐시 → OpenAI → Native TTS            │
└─────────────────────────────────────────────────┘
```

| 소스 | 품질 | 비용 | 오프라인 | 언어 수 |
|---|---|---|---|---|
| **Native TTS** | 중 | 무료 | O (브라우저 내장) | 24개 |
| **OpenAI TTS** | 최고 | API 과금 | 캐시 시 O | 다수 |
| **MP3 캐시** | 최고 | 사전 생성 | O | 캐시된 것만 |

---

## 4.2 AudioService 클래스 핵심 구조

```typescript
export class AudioService {
  private synthesis: SpeechSynthesis;           // Web Speech API
  private spokenLandmarks: Set<string>;         // 이미 안내한 랜드마크 (중복 방지)
  private voices: SpeechSynthesisVoice[] = [];  // 사용 가능한 음성 목록
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();  // 언어별 최적 음성 캐시

  private audioElement: HTMLAudioElement | null = null;  // MP3/OpenAI 재생용
  private audioMode: AudioMode = 'auto';        // 'auto' | 'mp3' | 'tts' | 'openai'
  private audioContext: AudioContext | null = null;      // 모바일 잠금 해제용

  private currentRate: number = 1.2;  // 기본 속도 1.2배 (localStorage 저장)

  // 문장별 재생 상태
  private sentences: string[] = [];
  private sentenceIndex: number = 0;
  private isSentenceMode: boolean = false;

  // OpenAI 문장별 재생 상태
  private openaiSentenceMode: boolean = false;
  private openaiSessionId: number = 0;          // 세션 ID로 stale 요청 방지
  private openaiAbortController: AbortController | null = null;
}
```

---

## 4.3 24개 언어 매핑 테이블

```typescript
private getLangCode(language: string): string {
  const langMap: { [key: string]: string } = {
    'en': 'en-US',    'es': 'es-ES',    'fr': 'fr-FR',
    'de': 'de-DE',    'it': 'it-IT',    'pt': 'pt-PT',
    'ru': 'ru-RU',    'zh': 'zh-CN',    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW', 'ja': 'ja-JP',    'ko': 'ko-KR',
    'ar': 'ar-SA',    'hi': 'hi-IN',    'tr': 'tr-TR',
    'nl': 'nl-NL',    'pl': 'pl-PL',    'sv': 'sv-SE',
    'da': 'da-DK',    'fi': 'fi-FI',    'no': 'nb-NO',
    'el': 'el-GR',    'cs': 'cs-CZ',    'th': 'th-TH',
    'vi': 'vi-VN',    'id': 'id-ID'
  };

  if (langMap[language]) return langMap[language];
  if (language.includes('-')) return language;  // 이미 BCP-47 형식이면 그대로
  return 'en-US';  // 기본값
}
```

---

## 4.4 트러블슈팅 #1: 음성 목록 로딩 실패

**문제:** Mobile Chrome에서 `speechSynthesis.getVoices()`가 초기 로딩 시 **빈 배열** 반환
→ "No voices found for ko-KR" 경고 발생

**원인:** 브라우저마다 getVoices() 반환 시점이 다름
- Chrome: **비동기** (onvoiceschanged 이벤트 필요)
- Firefox/Safari: **동기**

**해결:** Exponential backoff 재시도 (최대 10회)

```typescript
private loadVoicesWithRetry(attempt: number = 0, maxAttempts: number = 10) {
  this.voices = this.synthesis.getVoices();

  if (this.voices.length === 0 && attempt < maxAttempts) {
    // 시도 횟수에 따라 간격을 늘려가며 재시도 (200ms → 400ms → ... → 1000ms)
    const delay = Math.min(200 * (attempt + 1), 1000);
    setTimeout(() => this.loadVoicesWithRetry(attempt + 1, maxAttempts), delay);
  } else if (this.voices.length > 0) {
    console.log(`✅ ${this.voices.length}개 음성 로딩 완료 (시도 ${attempt + 1}회)`);
  }
}
```

---

## 4.5 트러블슈팅 #2: TTS 언어-텍스트 불일치 (03-22 핵심 버그)

**문제:** 번역 API 실패 시 **영어 텍스트를 러시아어 음성으로 읽는** 버그
- UI 언어: 러시아어 → TTS 음성: ru-RU → 하지만 텍스트는 영어 → 어색한 발음

**해결:** Unicode 문자 범위 기반 **텍스트 언어 자동 감지**

```typescript
public detectTextLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'en';

  // 유니코드 범위로 언어 감지
  const koreanChars = (text.match(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g) || []).length;
  const japaneseChars = (text.match(/[\u3040-\u30FF\u31F0-\u31FF]/g) || []).length;
  const chineseChars = (text.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const cyrillicChars = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
  const total = text.replace(/\s/g, '').length || 1;

  // 5% 이상이면 해당 언어로 판정
  if (koreanChars / total > 0.05) return 'ko';
  if (japaneseChars / total > 0.05) return 'ja';
  if (cyrillicChars / total > 0.05) return 'ru';
  if (thaiChars / total > 0.05) return 'th';
  // 한자: 일본어 히라가나/가타카나가 없으면 중국어
  if (chineseChars / total > 0.05) return japaneseChars > 0 ? 'ja' : 'zh';

  return 'en'; // 기본값
}
```

### 재생 언어 결정 로직

```typescript
public resolvePlaybackLanguage(text: string, requestedLanguage: string): string {
  const detectedLang = this.detectTextLanguage(text);
  const requestedBase = requestedLanguage.split('-')[0];

  // ✅ 감지 언어 == 요청 언어 → 그대로 사용
  if (detectedLang === requestedBase) return requestedLanguage;

  // 라틴 계열 언어는 영어 텍스트를 읽어도 비교적 자연스러움
  const latinLanguages = ['fr', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'sv', 'da', 'fi', 'no'];
  if (detectedLang === 'en' && latinLanguages.includes(requestedBase))
    return requestedLanguage;

  // ❌ 영어 텍스트 + 비라틴 언어(ru, ko, ja 등) → 영어 음성으로 오버라이드
  // 번역 실패를 의미하므로 영어 TTS가 자연스러움
  if (detectedLang === 'en') {
    console.log(`🔧 Language Override: text is English but UI is '${requestedLanguage}'`);
    return 'en';
  }

  return detectedLang;
}
```

---

## 4.6 음성 품질 스코어링 시스템

브라우저에서 제공하는 여러 음성 중 **최고 품질**을 자동 선택:

```typescript
private getVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
  // 캐시 확인
  if (this.voiceCache.has(langCode)) return this.voiceCache.get(langCode)!;

  // 사용자가 직접 선택한 음성이 있으면 우선 사용
  const selectedVoiceName = this.selectedVoicesByLanguage.get(baseLang);
  if (selectedVoiceName) {
    const voice = this.voices.find(v => v.name === selectedVoiceName);
    if (voice) return voice;
  }

  // 품질 키워드 기반 스코어링 (높을수록 좋음)
  const qualityKeywords = [
    'neural',    // Microsoft Neural — 최고 품질 (+130점)
    'wavenet',   // Google WaveNet (+120점)
    'premium',   // (+110점)
    'enhanced',  // (+100점)
    'natural',   // (+90점)
    'google',    // (+70점)
    'microsoft', // (+60점)
  ];

  const scoredVoices = matchingVoices.map(voice => {
    let score = 0;

    // 품질 키워드 점수
    qualityKeywords.forEach((keyword, index) => {
      if (voice.name.toLowerCase().includes(keyword)) {
        score += (qualityKeywords.length - index) * 10;
      }
    });

    // 정확한 언어 매칭 보너스
    if (voice.lang === langCode) score += 100;

    // 원격 음성 (Google, Microsoft 서버) — 품질이 더 좋음
    if (!voice.localService) score += 50;

    return { voice, score };
  });

  // 최고 점수 음성 선택 + 캐시
  scoredVoices.sort((a, b) => b.score - a.score);
  this.voiceCache.set(langCode, scoredVoices[0].voice);
  return scoredVoices[0].voice;
}
```

---

## 4.7 모바일 오디오 잠금 해제 (unlockAudio)

**문제:** iOS/Android 브라우저 정책 — **사용자 제스처 없이 오디오 재생 불가**

**해결:** 3단계 잠금 해제 (사용자 터치 이벤트에서 호출)

```typescript
async unlockAudio() {
  if (this.isUnlocked) return;

  // ① Web Audio API — 무음 oscillator로 하드웨어 채널 점유
  if (!this.audioContext) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (this.audioContext.state === 'suspended') {
    await this.audioContext.resume();
  }
  const oscillator = this.audioContext.createOscillator();
  const gain = this.audioContext.createGain();
  gain.gain.value = 0.0001;  // 거의 무음
  oscillator.connect(gain);
  gain.connect(this.audioContext.destination);
  oscillator.start(0);
  oscillator.stop(0.1);

  // ② Web Speech API — 빈 문장 재생
  const utterance = new SpeechSynthesisUtterance(' ');
  utterance.volume = 0;
  this.synthesis.speak(utterance);

  // ③ HTML5 Audio — 무음 WAV base64 재생
  const silentAudio = new Audio(
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
  );
  silentAudio.volume = 0;
  await silentAudio.play().catch(() => {});

  this.isUnlocked = true;
}
```

---

## 4.8 문장별 하이라이팅 재생

텍스트를 문장 단위로 분할 → 하나씩 재생 → 콜백으로 UI에서 하이라이팅:

```typescript
// 문장 분할 정규식 — 영어, 한국어, 중국어, 일본어 문장부호 지원
public static splitIntoSentences(text: string): string[] {
  const sentenceRegex = /[^.!?。！？]+[.!?。！？]+/g;
  const matches = text.match(sentenceRegex);
  if (!matches) return [text.trim()];
  return matches.map(s => s.trim()).filter(s => s.length > 0);
}

// 문장별 재생 — 콜백으로 현재 문장 인덱스 전달
playSentences(text, language, rate, onSentenceChange, onEnd) {
  this.sentences = AudioService.splitIntoSentences(text);
  this.sentenceIndex = 0;

  // 현재 문장 하이라이팅
  if (onSentenceChange) onSentenceChange(0);

  this.playNextSentence(language, rate);
}

private playNextSentence(language, rate) {
  if (this.sentenceIndex >= this.sentences.length) {
    // 모든 문장 완료
    if (this.onSentenceEnd) this.onSentenceEnd();
    return;
  }

  const sentence = this.sentences[this.sentenceIndex];
  const utterance = new SpeechSynthesisUtterance(sentence);
  // ... 언어, 속도, 음성 설정 ...

  utterance.onend = () => {
    this.sentenceIndex++;
    if (this.onSentenceChange) this.onSentenceChange(this.sentenceIndex);
    // 문장 사이 150ms 자연스러운 간격
    setTimeout(() => this.playNextSentence(language, rate), 150);
  };

  this.synthesis.speak(utterance);
}
```

---

## 4.9 OpenAI TTS + 오프라인 캐시 연동

```typescript
async playOpenAISentences(text, language, onSentenceChange, onEnd) {
  // 세션 ID로 stale 요청 방지
  this.openaiSessionId++;
  const currentSessionId = this.openaiSessionId;
  // ...
}

private async playNextOpenAISentence(sessionId: number) {
  // 세션 체크 — 다른 재생이 시작되었으면 중단
  if (sessionId !== this.openaiSessionId) return;

  const sentence = this.openaiSentences[this.openaiSentenceIndex];

  // ① 오프라인 캐시 확인
  const cached = await offlineStorage.getAudio(cacheKey, language);
  if (cached) {
    this.playAudioBlob(cached.audioBlob, ...);  // 캐시 히트!
    return;
  }

  // ② API 호출 (AbortController로 취소 가능)
  this.openaiAbortController = new AbortController();
  const response = await fetch('/api/tts/openai/generate', {
    method: 'POST',
    body: JSON.stringify({ text: sentence, language }),
    signal: this.openaiAbortController.signal
  });

  const audioBlob = await response.blob();

  // ③ 캐시에 저장 (다음에는 오프라인에서도 재생 가능)
  await offlineStorage.saveAudio({
    landmarkId: cacheKey, language, audioBlob,
    duration: Math.ceil(sentence.length / 15),
    sizeBytes: audioBlob.size, voiceId: 'openai'
  });

  // ④ 재생
  this.playAudioBlob(audioBlob, ...);
}

// ⑤ 네트워크 에러 → Native TTS 폴백
private fallbackToNativeTTS(sentence, sessionId) {
  console.log('🚑 OpenAI TTS failed → Native TTS fallback');
  this.playText(sentence, this.openaiSentenceLanguage, this.currentRate, () => {
    // 다음 문장으로 진행
    this.openaiSentenceIndex++;
    this.playNextOpenAISentence(sessionId);
  });
}
```

---

## 4.10 resume() 좀비 방지 Watchdog

**문제:** 일시정지 후 재개 시 TTS가 멈춰버리는 현상 (특히 iOS Safari)

```typescript
async resume() {
  this.isPausedInternal = false;

  // ① AudioContext 재개 (모바일 정책 대응)
  if (this.audioContext?.state === 'suspended') {
    await this.audioContext.resume();
  }

  // ② Web Speech API 재개
  if (this.synthesis.paused) this.synthesis.resume();

  // ③ HTML5 Audio 재개
  if (this.audioElement?.paused) await this.audioElement.play();

  // ④ 200ms 후 Watchdog — 좀비 상태 감지 및 강제 복구
  setTimeout(() => {
    if (this.isPausedInternal) return;

    // Native TTS가 멈춰있으면 → 강제 리셋 후 현재 문장부터 다시 시작
    if (this.isSentenceMode && !this.openaiSentenceMode) {
      if (this.synthesis.paused || !this.synthesis.speaking) {
        console.log('🚑 TTS stalled → Hard Reset');
        this.synthesis.cancel();
        setTimeout(() => this.speakCurrentSentence(), 100);
      }
    }

    // OpenAI/MP3가 멈춰있으면 → Kickstart
    if (this.audioElement?.paused) {
      this.audioElement.play().catch(e => console.error('Kickstart failed:', e));
    }
  }, 200);
}
```

### Safari TTS 15초 타임아웃 대응

```typescript
// Safari에서 SpeechSynthesis가 15초 후 자동 중단되는 문제
// → 10초마다 pause/resume 트릭으로 타이머 리셋
private keepAlive() {
  if (this.synthesis.speaking && !this.synthesis.paused) {
    this.synthesis.pause();
    this.synthesis.resume();
    this.playbackTimer = setTimeout(() => this.keepAlive(), 10000);
  }
}
```

---

> **다음 챕터:** [CH05 GPS 근접탐지 시스템](./CH05_GPS_근접탐지_시스템.md) — Haversine 공식부터 랜드마크 트리거까지
