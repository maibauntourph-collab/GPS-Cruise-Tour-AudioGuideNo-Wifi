# GPS Audio Guide - 전체 개발 진행 기록

## 프로젝트 정보
- **프로젝트명**: GPS Audio Guide - Multi-City Travel Companion
- **개발 환경**: Replit
- **기술 스택**: React, TypeScript, Express.js, PostgreSQL, Drizzle ORM

---

## 개발 히스토리 (시간순)

---

### Session 1: 프로젝트 초기 설정

#### 1.1 프로젝트 생성 및 의존성 설치

**명령어**:
```bash
npm install
```

**결과**:
```
added 500+ packages
```

#### 1.2 개발 서버 실행

**명령어**:
```bash
npm run dev
```

**결과**:
```
> rest-express@1.0.0 dev
> NODE_ENV=development tsx server/index.ts
[express] serving on port 5000
```

#### 1.3 데이터베이스 스키마 생성

**파일**: `shared/schema.ts`

**명령어**:
```bash
npm run db:push
```

**결과**:
```
[✓] Changes applied to database
```

---

### Session 2: 지도 및 GPS 기능 구현

#### 2.1 React-Leaflet 설치

**명령어**:
```bash
# packager tool 사용
install nodejs ['leaflet', 'react-leaflet', 'leaflet-routing-machine']
```

**결과**:
```
Successfully installed leaflet, react-leaflet, leaflet-routing-machine
```

#### 2.2 지도 컴포넌트 구현

**파일**: `client/src/pages/Home.tsx`

- OpenStreetMap 타일 레이어 설정
- GPS 위치 추적 구현
- 카테고리별 마커 색상 코딩

---

### Session 3: 다국어 지원 시스템

#### 3.1 번역 시스템 구현

**파일**: `client/src/lib/translations.ts`

- 10개 언어 지원 (en, ko, it, es, fr, de, zh, ja, pt, ru)
- UI 텍스트 번역 함수
- 랜드마크별 다국어 콘텐츠

---

### Session 4: 오디오 시스템 - System TTS

#### 4.1 AudioService 클래스 생성

**파일**: `client/src/lib/audioService.ts`

```typescript
class AudioService {
  playText(text: string, language: string, rate: number): void;
  setVoiceForLanguage(language: string, voiceName: string): void;
  getSelectedVoiceName(language: string): string | null;
}
```

#### 4.2 음성 선택 UI 구현

**파일**: `client/src/components/MenuDialog.tsx`

- 카드 기반 음성 선택
- 품질/성별 필터링
- 미리듣기 기능

---

### Session 5: CLOVA Voice TTS 통합

#### 5.1 CLOVA TTS 라이브러리 생성

**파일**: `server/lib/clova.ts`

**구현 내용**:
```typescript
export const CLOVA_VOICES = {
  nara: { name: "Nara", nameKo: "나라", gender: "female", language: "ko" },
  nminsang: { name: "Minsang", nameKo: "민상", gender: "male", language: "ko" },
  clara: { name: "Clara", nameKo: "클라라", gender: "female", language: "en" },
  // ... 45개 이상의 음성
};

export async function generateClovaTTS(
  text: string,
  voiceId: ClovaVoiceId,
  speed: number
): Promise<ClovaAudioResult>
```

#### 5.2 API 엔드포인트 추가

**파일**: `server/routes.ts`

```typescript
// CLOVA 음성 목록
app.get("/api/tts/clova/voices", async (req, res) => {...});

// CLOVA TTS 생성
app.post("/api/tts/clova/generate", async (req, res) => {...});
```

#### 5.3 CLOVA API 첫 테스트 - 실패

**명령어**:
```bash
curl -s -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요&format=mp3" \
  -w "\nHTTP Status: %{http_code}" -o /tmp/clova_test.mp3
```

**결과**:
```
HTTP Status: 401
```

**오류 내용 확인**:
```bash
cat /tmp/clova_test.mp3
```

**결과**:
```json
{"error":{"errorCode":"200","message":"Authentication Failed","details":"Authentication information are missing."}}
```

#### 5.4 환경 변수 확인

**명령어**:
```bash
echo "NAVER_CLIENT_ID length: ${#NAVER_CLIENT_ID}"
echo "NAVER_CLIENT_SECRET length: ${#NAVER_CLIENT_SECRET}"
```

**결과**:
```
NAVER_CLIENT_ID length: 28
NAVER_CLIENT_SECRET length: 28
```

#### 5.5 문제 원인 분석

**원인**: 네이버 클라우드 플랫폼에서 CLOVA Voice 서비스 미활성화 또는 API 키 권한 부족

**해결 방법 안내**:
1. console.ncloud.com 접속
2. AI Services > CLOVA Voice 서비스 이용 신청
3. API 인증키 재발급
4. Replit Secrets 업데이트

---

### Session 6: CLOVA API 키 업데이트

#### 6.1 새 API 키 요청

**도구 사용**: `request_env_var`

```
Asked user for secret keys: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
Message: CLOVA Voice API를 사용하려면 네이버 클라우드 플랫폼에서 발급받은 API 키를 입력해 주세요.
```

#### 6.2 사용자 API 키 입력

**결과**:
```
The following secrets have been added to Replit Secrets: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
```

#### 6.3 워크플로우 재시작

**명령어**:
```bash
restart_workflow "Start application"
```

**결과**:
```
Restarted workflow: Start application
```

#### 6.4 CLOVA API 재테스트 - 성공

**명령어**:
```bash
curl -s -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요 테스트입니다&volume=0&speed=0&pitch=0&format=mp3" \
  -w "\nHTTP Status: %{http_code}" -o /tmp/clova_test2.mp3
```

**결과**:
```
HTTP Status: 200
```

#### 6.5 생성된 오디오 파일 확인

**명령어**:
```bash
ls -la /tmp/clova_test2.mp3
```

**결과**:
```
-rw-r--r-- 1 runner runner 15780 Dec  6 09:30 /tmp/clova_test2.mp3
```

**성공**: MP3 파일 15,780 바이트 생성됨

---

### Session 7: CLOVA 음성 선택 저장 기능

#### 7.1 문제 발견

**증상**: CLOVA 음성을 선택해도 페이지 새로고침 시 기본값으로 초기화됨

#### 7.2 audioService.ts 수정

**추가된 코드**:
```typescript
private selectedClovaVoices: Record<string, string> = {};

constructor() {
  this.selectedClovaVoices = this.loadSelectedClovaVoices();
}

private loadSelectedClovaVoices(): Record<string, string> {
  try {
    const saved = localStorage.getItem('clova-voices-by-language');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

private saveSelectedClovaVoices(): void {
  try {
    localStorage.setItem('clova-voices-by-language', 
      JSON.stringify(this.selectedClovaVoices));
  } catch (e) {
    console.error('Failed to save CLOVA voices:', e);
  }
}

setClovaVoiceForLanguage(language: string, voiceId: string): void {
  this.selectedClovaVoices[language] = voiceId;
  this.saveSelectedClovaVoices();
}

getSelectedClovaVoice(language: string): string | null {
  return this.selectedClovaVoices[language] || null;
}
```

#### 7.3 MenuDialog.tsx 수정

**loadClovaVoices 함수 수정**:
```typescript
const loadClovaVoices = async () => {
  setLoadingClovaVoices(true);
  try {
    const response = await fetch(`/api/tts/clova/voices?language=${selectedLanguage}`);
    if (response.ok) {
      const data = await response.json();
      setClovaVoices(data.voices || []);
      // 저장된 음성 불러오기
      const savedClovaVoice = audioService.getSelectedClovaVoice(selectedLanguage);
      if (savedClovaVoice) {
        setSelectedClovaVoice(savedClovaVoice);
      } else if (data.default) {
        setSelectedClovaVoice(data.default);
      }
    }
  } catch (error) {
    console.error('Failed to load CLOVA voices:', error);
  } finally {
    setLoadingClovaVoices(false);
  }
};
```

**handleClovaVoiceChange 함수 추가**:
```typescript
const handleClovaVoiceChange = (voiceId: string) => {
  setSelectedClovaVoice(voiceId);
  audioService.setClovaVoiceForLanguage(selectedLanguage, voiceId);
};
```

**음성 카드 클릭 핸들러 수정**:
```typescript
// Before
onClick={() => setSelectedClovaVoice(voice.id)}

// After
onClick={() => handleClovaVoiceChange(voice.id)}
```

#### 7.4 SettingsDialog.tsx 동일 패턴 적용

**동일한 수정 사항 적용**

#### 7.5 워크플로우 재시작

**명령어**:
```bash
restart_workflow "Start application"
```

**결과**:
```
Restarted workflow: Start application
```

#### 7.6 로그 확인

**명령어**:
```bash
refresh_all_logs
```

**결과**:
```
workflow: Start application - RUNNING
[express] serving on port 5000
```

#### 7.7 Architect 리뷰

**요청**:
```
Review the CLOVA TTS voice persistence fix in MenuDialog.tsx and SettingsDialog.tsx
```

**결과**:
```
Pass – The CLOVA voice persistence changes correctly store and reload per-language 
selections through audioService and surface them in both MenuDialog and SettingsDialog.
```

---

### Session 8: 문서화

#### 8.1 PROGRESS.MD 생성

**명령어**:
```bash
write "PROGRESS.MD" <content>
```

**결과**:
```
File created successfully at: PROGRESS.MD
```

#### 8.2 PROGRESS.MD 한글 업데이트

**요청**: "프로젝트 전체 히스토리를 한글로 반영해줘"

**결과**: PROGRESS.MD 파일 한글 버전으로 업데이트

#### 8.3 development_history.md 생성

**명령어**:
```bash
write "development_history.md" <content>
```

**결과**:
```
File created successfully at: development_history.md
```

---

## API 테스트 결과 요약

### CLOVA TTS API

| 테스트 | 날짜 | 상태 | 결과 |
|--------|------|------|------|
| 1차 테스트 | 2024-12-06 | 실패 | HTTP 401 - Authentication Failed |
| 키 업데이트 후 | 2024-12-06 | 성공 | HTTP 200 - 15,780 bytes MP3 생성 |

### 서버 로그

```
6:52:46 AM [express] serving on port 5000
6:57:42 AM [express] GET /api/tts/clova/voices 200 in 8ms
6:57:47 AM [express] POST /api/tts/clova/generate 500 in 481ms (401 error)
...
(API 키 업데이트 후)
...
POST /api/tts/clova/generate 200 (성공)
```

---

## 완료된 기능 목록

| # | 기능 | 상태 | 완료일 |
|---|------|------|--------|
| 1 | 프로젝트 초기 설정 | ✅ | - |
| 2 | 데이터베이스 스키마 | ✅ | - |
| 3 | 인터랙티브 지도 | ✅ | - |
| 4 | GPS 위치 추적 | ✅ | - |
| 5 | 다국어 지원 (10개 언어) | ✅ | - |
| 6 | System TTS 음성 선택 | ✅ | - |
| 7 | CLOVA Voice TTS 통합 | ✅ | 2024-12-06 |
| 8 | CLOVA 음성 저장 기능 | ✅ | 2024-12-06 |
| 9 | 투어 리더 모드 | ✅ | - |
| 10 | 가이드 모드 | ✅ | - |
| 11 | 랜드마크 생성 기능 | ✅ | - |
| 12 | PWA 오프라인 지원 | ✅ | - |
| 13 | AI 투어 추천 | ✅ | - |

---

## 환경 변수 상태

| 변수명 | 용도 | 상태 |
|--------|------|------|
| DATABASE_URL | PostgreSQL 연결 | ✅ 활성 |
| PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE | DB 상세 정보 | ✅ 활성 |
| NAVER_CLIENT_ID | CLOVA Voice API | ✅ 활성 (업데이트됨) |
| NAVER_CLIENT_SECRET | CLOVA Voice API | ✅ 활성 (업데이트됨) |
| OPENAI_API_KEY | OpenAI API | ✅ 활성 |
| GEMINI_API_KEY | Google Gemini | ✅ 활성 |
| SESSION_SECRET | 세션 암호화 | ✅ 활성 |

---

## 파일 변경 이력

### 2024-12-06

| 파일 | 변경 내용 |
|------|----------|
| `server/lib/clova.ts` | CLOVA TTS 라이브러리 생성 |
| `server/routes.ts` | CLOVA API 엔드포인트 추가 |
| `client/src/lib/audioService.ts` | CLOVA 음성 저장 메서드 추가 |
| `client/src/components/MenuDialog.tsx` | CLOVA 모드 UI 및 음성 저장 기능 |
| `client/src/components/SettingsDialog.tsx` | CLOVA 모드 UI 및 음성 저장 기능 |
| `PROGRESS.MD` | 프로젝트 진행 문서 생성 |
| `development_history.md` | 개발 히스토리 문서 생성 |
| `total_progress.md` | 전체 진행 기록 문서 생성 |

---

## 명령어 참조

### 개발 명령어
```bash
npm run dev              # 개발 서버 실행
npm run db:push          # DB 스키마 적용
npm run db:push --force  # DB 스키마 강제 적용
npm run build            # 프로덕션 빌드
```

### CLOVA TTS 테스트
```bash
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=테스트&format=mp3" \
  -o test.mp3
```

### 워크플로우 관리
```bash
restart_workflow "Start application"
refresh_all_logs
```

---

## 다음 단계

| 우선순위 | 작업 | 상태 |
|----------|------|------|
| 1 | 랜드마크별 MP3 오디오 사전 생성 | 대기 |
| 2 | 오프라인 오디오 캐싱 | 대기 |
| 3 | 성능 최적화 | 대기 |
| 4 | 프로덕션 배포 | 대기 |

---

*문서 생성일: 2024년 12월 6일*
*마지막 업데이트: 2024년 12월 6일*
