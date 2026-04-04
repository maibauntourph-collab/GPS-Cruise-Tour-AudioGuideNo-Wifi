# GPS Audio Guide 개발 히스토리

## 프로젝트 정보

**프로젝트명**: GPS Audio Guide - Multi-City Travel Companion  
**개발 기간**: 2024년  
**목적**: 관광객을 위한 React 기반 GPS 오디오 가이드 PWA 애플리케이션

---

## 개발 타임라인

### 1단계: 프로젝트 초기화

#### 1.1 개발 환경 설정
```bash
npm install
npm run dev
```
- Express.js 백엔드 + Vite 프론트엔드 설정
- 포트 5000에서 통합 서버 실행

#### 1.2 데이터베이스 설계
**파일**: `shared/schema.ts`

```typescript
// Drizzle ORM 스키마 정의
export const cities = pgTable("cities", {...});
export const landmarks = pgTable("landmarks", {...});
export const visitedLandmarks = pgTable("visited_landmarks", {...});
export const tourSchedules = pgTable("tour_schedules", {...});
export const tourMembers = pgTable("tour_members", {...});
```

```bash
npm run db:push
```
**결과**: PostgreSQL (Neon serverless) 데이터베이스 테이블 생성 완료

#### 1.3 초기 데이터
- 18개 글로벌 도시 (로마, 파리, 런던, 뉴욕, 도쿄 등)
- 144개 랜드마크 정보

---

### 2단계: 다국어 시스템 구축

#### 2.1 지원 언어
| 코드 | 언어 | 코드 | 언어 |
|------|------|------|------|
| en | English | ko | 한국어 |
| it | Italiano | es | Español |
| fr | Français | de | Deutsch |
| zh | 中文 | ja | 日本語 |
| pt | Português | ru | Русский |

#### 2.2 번역 시스템
**파일**: `client/src/lib/translations.ts`
- UI 텍스트 번역 함수
- 랜드마크별 다국어 콘텐츠 지원

---

### 3단계: 지도 및 GPS 기능

#### 3.1 인터랙티브 지도
**라이브러리**: React-Leaflet, OpenStreetMap

**구현 기능**:
- GPS 실시간 위치 추적
- 사용자 위치 펄스 애니메이션
- 카테고리별 마커 색상 코딩
  - 랜드마크: `hsl(14, 85%, 55%)` (주황)
  - 액티비티: `hsl(195, 85%, 50%)` (청록)
  - 레스토랑: `hsl(142, 76%, 36%)` (녹색)
  - 기프트샵: `hsl(270, 50%, 60%)` (보라)

#### 3.2 턴바이턴 네비게이션
**라이브러리**: Leaflet Routing Machine
- 도보 경로 계산
- 거리 및 예상 시간 표시
- Google Maps 외부 연동

---

### 4단계: 오디오 시스템

#### 4.1 시스템 TTS (Web Speech API)
**파일**: `client/src/lib/audioService.ts`

```typescript
class AudioService {
  // 언어별 음성 선택 저장
  private selectedVoicesByLanguage: Record<string, string>;
  
  // 텍스트 재생
  playText(text: string, language: string, rate: number): void;
  
  // 음성 설정
  setVoiceForLanguage(language: string, voiceName: string): void;
}
```

**기능**:
- 브라우저 내장 TTS 활용
- 언어별 음성 선택 (localStorage 저장)
- 음성 속도 조절 (0.5x ~ 2.0x)
- 품질/성별 필터링

#### 4.2 CLOVA Voice TTS 통합

##### 서버 라이브러리 생성
**파일**: `server/lib/clova.ts`

```typescript
// CLOVA TTS API 호출
export async function generateClovaTTS(
  text: string,
  voiceId: ClovaVoiceId = "nara",
  speed: number = 0
): Promise<ClovaAudioResult>
```

##### API 엔드포인트 추가
**파일**: `server/routes.ts`

```
GET  /api/tts/clova/voices?language=ko
POST /api/tts/clova/generate
```

##### CLOVA 음성 목록 (45개+)
| ID | 이름 | 언어 | 성별 |
|----|------|------|------|
| nara | 나라 | 한국어 | 여성 |
| nminsang | 민상 | 한국어 | 남성 |
| njiyun | 지윤 | 한국어 | 여성 |
| clara | 클라라 | 영어 | 여성 |
| matt | 매트 | 영어 | 남성 |
| ntomoko | 토모코 | 일본어 | 여성 |
| meimei | 메이메이 | 중국어 | 여성 |
| carmen | 카르멘 | 스페인어 | 여성 |

##### API 테스트 과정

**1차 시도 - 실패**:
```bash
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요&format=mp3"
```
```
HTTP Status: 401
{"error":{"errorCode":"200","message":"Authentication Failed"}}
```

**문제 해결**:
1. 네이버 클라우드 플랫폼 (console.ncloud.com) 접속
2. AI Services > CLOVA Voice 서비스 활성화
3. API 인증키 재발급
4. Replit Secrets 업데이트

**2차 시도 - 성공**:
```bash
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요 테스트입니다&format=mp3"
```
```
HTTP Status: 200
파일 크기: 15,780 bytes
```

#### 4.3 오디오 모드 UI
**파일**: `MenuDialog.tsx`, `SettingsDialog.tsx`

```typescript
type AudioMode = 'auto' | 'tts' | 'clova' | 'mp3';
```

**UI 구현**:
- 라디오 버튼 모드 선택
- 카드 기반 음성 선택
- 미리듣기 버튼
- 언어별 음성 저장

#### 4.4 음성 저장 기능
**문제**: CLOVA 음성 선택 후 새로고침 시 초기화

**해결**:
```typescript
// audioService.ts 추가
private selectedClovaVoices: Record<string, string>;

setClovaVoiceForLanguage(language: string, voiceId: string): void {
  this.selectedClovaVoices[language] = voiceId;
  localStorage.setItem('clova-voices-by-language', 
    JSON.stringify(this.selectedClovaVoices));
}

getSelectedClovaVoice(language: string): string | null {
  return this.selectedClovaVoices[language] || null;
}
```

---

### 5단계: 투어 관리

#### 5.1 투어 리더 모드
**라우트**: `/tour-leader`

**기능**:
- 일정 생성/수정/삭제
- 멤버 관리
- Excel 가져오기/내보내기 (xlsx 라이브러리)
- Web Share API 진행 보고서 공유

#### 5.2 가이드 모드
**라우트**: `/guide`

**기능**:
- 랜드마크 생성 다이얼로그
- 지도 상호작용
- 오디오 나레이션 제어

#### 5.3 랜드마크 생성
**파일**: `LandmarkFormDialog.tsx`

```typescript
// POST /api/admin/landmarks
interface LandmarkInput {
  name: string;
  category: 'Landmark' | 'Activity' | 'Restaurant' | 'GiftShop';
  latitude: number;
  longitude: number;
  description: string;
  translations: Record<string, { name: string; description: string }>;
}
```

---

### 6단계: PWA 오프라인 기능

#### 6.1 서비스 워커
**파일**: `client/public/sw.js`

**캐싱 전략**:
- 정적 자산: Cache First
- API 데이터: Network First
- 지도 타일: Stale While Revalidate

#### 6.2 IndexedDB
- 클라이언트 측 랜드마크 저장
- 오프라인 방문 기록 동기화

#### 6.3 오프라인 패키지 API
```
GET /api/offline-package?city=rome&language=ko
```

---

### 7단계: AI 투어 추천

#### 7.1 OpenAI 통합
**모델**: gpt-4o-mini

#### 7.2 Google Gemini 통합
```
POST /api/ai/recommend-tour
```

**기능**:
- 카테고리 기반 일정 제안
- 지리적 근접성 최적화
- 방문 시간 예측

---

## 환경 변수

| 변수명 | 용도 | 상태 |
|--------|------|------|
| DATABASE_URL | PostgreSQL 연결 | ✅ |
| NAVER_CLIENT_ID | CLOVA Voice API | ✅ |
| NAVER_CLIENT_SECRET | CLOVA Voice API | ✅ |
| OPENAI_API_KEY | OpenAI API | ✅ |
| GEMINI_API_KEY | Google Gemini | ✅ |
| SESSION_SECRET | 세션 암호화 | ✅ |

---

## 트러블슈팅 로그

### 이슈 #1: CLOVA TTS 401 인증 오류
**날짜**: 2024-12-06

**증상**:
```
CLOVA TTS API error: 401 - Authentication Failed
```

**원인**: 네이버 클라우드 CLOVA Voice 서비스 미활성화

**해결**:
1. console.ncloud.com 접속
2. CLOVA Voice 서비스 이용 신청
3. 새 API 키 발급
4. Secrets 업데이트 후 워크플로우 재시작

### 이슈 #2: 음성 선택 저장 안됨
**날짜**: 2024-12-06

**증상**: CLOVA 음성 선택 후 새로고침 시 초기화

**원인**: localStorage 저장 로직 누락

**해결**:
- `audioService.ts`에 CLOVA 음성 저장 메서드 추가
- `MenuDialog.tsx`, `SettingsDialog.tsx`에서 `handleClovaVoiceChange` 구현

---

## 파일 구조

```
gps-audio-guide/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MenuDialog.tsx
│   │   │   ├── SettingsDialog.tsx
│   │   │   ├── LandmarkFormDialog.tsx
│   │   │   ├── LandmarkDetailDialog.tsx
│   │   │   └── UnifiedFloatingCard.tsx
│   │   ├── lib/
│   │   │   ├── audioService.ts
│   │   │   ├── translations.ts
│   │   │   └── queryClient.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Guide.tsx
│   │   │   └── TourLeader.tsx
│   │   └── App.tsx
│   └── public/
│       └── sw.js
├── server/
│   ├── lib/
│   │   └── clova.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── index.ts
├── shared/
│   └── schema.ts
├── replit.md
├── PROGRESS.MD
└── development_history.md
```

---

## 명령어 참조

```bash
# 개발 서버 실행
npm run dev

# 데이터베이스 스키마 동기화
npm run db:push
npm run db:push --force  # 강제 적용

# 프로덕션 빌드
npm run build

# CLOVA TTS 테스트
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=테스트&format=mp3" \
  -o test.mp3
```

---

*마지막 업데이트: 2024년 12월 6일*
