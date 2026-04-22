# GPS 오디오 가이드 프로젝트 진행 보고서

## 프로젝트 개요

**프로젝트명**: GPS Audio Guide - Multi-City Travel Companion  
**목적**: 관광객을 위한 React 기반 GPS 오디오 가이드 PWA 애플리케이션 개발  
**비전**: 글로벌 여행 동반자 앱으로 성장

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 | React 18, TypeScript, TanStack React Query, Tailwind CSS, Shadcn UI, Wouter |
| 백엔드 | Express.js, Zod Validation |
| 데이터베이스 | PostgreSQL (Neon serverless), Drizzle ORM |
| 지도 | React-Leaflet, Leaflet Routing Machine, OpenStreetMap |
| AI | OpenAI GPT-4o-mini, Google Gemini |
| TTS | Web Speech API, CLOVA Voice API |

---

## 개발 히스토리

### Phase 1: 프로젝트 초기 설정

#### 1.1 기본 프로젝트 구조 생성
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```
**결과**: Express 서버 + Vite 개발 서버가 포트 5000에서 실행

#### 1.2 데이터베이스 스키마 설계
**파일**: `shared/schema.ts`

```typescript
// 주요 테이블
- cities: 도시 정보
- landmarks: 랜드마크/명소 정보
- visitedLandmarks: 방문 기록
- tourSchedules: 투어 일정
- tourMembers: 투어 멤버
```

```bash
# 데이터베이스 스키마 적용
npm run db:push
```
**결과**: PostgreSQL에 테이블 생성 완료

#### 1.3 초기 데이터 구성
- 18개 도시 데이터 구성 (로마, 파리, 런던, 뉴욕 등)
- 144개 랜드마크 하드코딩 데이터

---

### Phase 2: 다국어 지원 시스템

#### 2.1 지원 언어 (10개)
| 코드 | 언어 |
|------|------|
| en | English (영어) |
| ko | 한국어 |
| it | Italiano (이탈리아어) |
| es | Español (스페인어) |
| fr | Français (프랑스어) |
| de | Deutsch (독일어) |
| zh | 中文 (중국어) |
| ja | 日本語 (일본어) |
| pt | Português (포르투갈어) |
| ru | Русский (러시아어) |

#### 2.2 번역 시스템 구현
**파일**: `client/src/lib/translations.ts`

- UI 텍스트 번역
- 랜드마크별 동적 콘텐츠 번역
- 언어 선택 UI 구현

---

### Phase 3: 지도 및 네비게이션

#### 3.1 인터랙티브 지도 구현
**라이브러리**: React-Leaflet, OpenStreetMap

**기능**:
- GPS 실시간 위치 추적
- 사용자 위치 펄스 애니메이션
- 카테고리별 색상 코딩 마커
  - 랜드마크: 주황색
  - 액티비티: 청록색
  - 레스토랑: 녹색
  - 기프트샵: 보라색
  - 크루즈 포트: 파란색

#### 3.2 턴바이턴 네비게이션
**라이브러리**: Leaflet Routing Machine

```typescript
// 경로 안내 기능
- 도보 경로 계산
- 이동 거리 및 예상 시간 표시
- Google Maps 외부 연동
```

---

### Phase 4: 오디오 시스템 통합

#### 4.1 시스템 TTS (Web Speech API)
**파일**: `client/src/lib/audioService.ts`

```typescript
// 오디오 서비스 초기화
const audioService = new AudioService();

// 언어별 음성 선택
audioService.setVoiceForLanguage('ko', 'Microsoft Heami - Korean (Korean)');

// 텍스트 재생
audioService.playText('안녕하세요', 'ko', 1.0);
```

**구현 기능**:
- 언어별 음성 선택 및 저장 (localStorage)
- 음성 속도 조절 (0.5x ~ 2.0x)
- 음성 품질/성별 필터링
- 미리듣기 기능

#### 4.2 CLOVA Voice TTS 통합
**파일**: `server/lib/clova.ts`

##### API 설정
```bash
# 환경 변수 설정
NAVER_CLIENT_ID=<네이버 클라우드 Access Key ID>
NAVER_CLIENT_SECRET=<네이버 클라우드 Secret Key>
```

##### CLOVA API 테스트 과정

**1차 테스트 (실패)**:
```bash
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요&format=mp3"
```
**결과**: HTTP 401 - "Authentication Failed"
**원인**: API 키 미활성화 또는 권한 부족

**해결 과정**:
1. 네이버 클라우드 플랫폼 접속
2. CLOVA Voice 서비스 이용 신청
3. API 인증키 재발급
4. Replit Secrets에 키 업데이트

**2차 테스트 (성공)**:
```bash
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요 테스트입니다&format=mp3" \
  -o /tmp/clova_test.mp3
```
**결과**: HTTP 200, MP3 파일 생성 (15,780 bytes)

##### 사용 가능한 CLOVA 음성 (45개 이상)

| 음성 ID | 이름 | 언어 | 성별 |
|---------|------|------|------|
| nara | 나라 | 한국어 | 여성 |
| nara_call | 나라 (전화) | 한국어 | 여성 |
| nminsang | 민상 | 한국어 | 남성 |
| nhajun | 하준 | 한국어 | 남성 (어린이) |
| ndain | 다인 | 한국어 | 여성 (어린이) |
| njiyun | 지윤 | 한국어 | 여성 |
| nsujin | 수진 | 한국어 | 여성 |
| njinho | 진호 | 한국어 | 남성 |
| njihun | 지훈 | 한국어 | 남성 |
| clara | 클라라 | 영어 | 여성 |
| matt | 매트 | 영어 | 남성 |
| ntomoko | 토모코 | 일본어 | 여성 |
| nnaomi | 나오미 | 일본어 | 여성 |
| meimei | 메이메이 | 중국어 | 여성 |
| liangliang | 량량 | 중국어 | 남성 |
| carmen | 카르멘 | 스페인어 | 여성 |
| jose | 호세 | 스페인어 | 남성 |

##### API 엔드포인트

```
GET  /api/tts/clova/voices?language=ko
응답: { voices: [...], default: "nara" }

POST /api/tts/clova/generate
요청: { text: "안녕하세요", voiceId: "nara", speed: 0 }
응답: audio/mpeg (MP3 파일)
```

#### 4.3 오디오 모드 선택 UI
**파일**: `MenuDialog.tsx`, `SettingsDialog.tsx`

```typescript
type AudioMode = 'auto' | 'tts' | 'clova' | 'mp3';
```

**UI 기능**:
- 라디오 버튼 모드 선택
- 카드 기반 음성 선택 (미리듣기 포함)
- 언어별 음성 저장 (localStorage)

#### 4.4 음성 선택 저장 기능 구현

**문제점**: CLOVA 음성 선택 후 페이지 새로고침 시 초기화됨

**해결**:
```typescript
// audioService.ts에 추가
private loadSelectedClovaVoices(): Record<string, string> {
  const saved = localStorage.getItem('clova-voices-by-language');
  return saved ? JSON.parse(saved) : {};
}

setClovaVoiceForLanguage(language: string, voiceId: string): void {
  this.selectedClovaVoices[language] = voiceId;
  this.saveSelectedClovaVoices();
}

getSelectedClovaVoice(language: string): string | null {
  return this.selectedClovaVoices[language] || null;
}
```

**결과**: 언어별 CLOVA 음성 선택이 영구 저장됨

---

### Phase 5: 투어 관리 시스템

#### 5.1 투어 리더 모드
**라우트**: `/tour-leader`

**기능**:
- 일정 CRUD (생성, 조회, 수정, 삭제)
- 멤버 관리
- Excel 가져오기/내보내기
- Web Share API를 통한 진행 보고서 공유

#### 5.2 가이드 모드
**라우트**: `/guide`

**기능**:
- 랜드마크 생성 다이얼로그
- 실시간 지도 상호작용
- 오디오 나레이션 제어

#### 5.3 랜드마크 생성 기능
**파일**: `client/src/components/LandmarkFormDialog.tsx`

```typescript
// POST /api/admin/landmarks
요청 데이터:
{
  name: "콜로세움",
  category: "Landmark",
  latitude: 41.8902,
  longitude: 12.4922,
  description: "로마의 상징적인 원형 경기장",
  translations: {
    ko: { name: "콜로세움", description: "..." },
    en: { name: "Colosseum", description: "..." }
  }
}
```

---

### Phase 6: 오프라인 기능 (PWA)

#### 6.1 서비스 워커
**파일**: `client/public/sw.js`

**캐싱 대상**:
- 정적 자산 (HTML, CSS, JS)
- 도시 데이터
- 지도 타일

#### 6.2 IndexedDB 통합
- 클라이언트 측 데이터 저장
- 오프라인 랜드마크 접근

#### 6.3 오프라인 패키지 API
```
GET /api/offline-package?city=rome&language=ko
```

---

### Phase 7: AI 투어 추천

#### 7.1 Google Gemini 통합
```
POST /api/ai/recommend-tour

요청:
{
  city: "rome",
  preferences: ["history", "art"],
  duration: "half-day"
}

응답:
{
  itinerary: [...],
  estimatedDuration: "4시간",
  totalDistance: "3.2km"
}
```

**기능**:
- 카테고리 기반 일정 제안
- 지리적 근접성 최적화
- 다양성 고려

---

## 현재 상태 요약

### 완료된 기능 ✅

| 기능 | 상태 |
|------|------|
| 인터랙티브 지도 + GPS 추적 | ✅ 완료 |
| 다국어 지원 (10개 언어) | ✅ 완료 |
| 시스템 TTS 음성 선택 | ✅ 완료 |
| CLOVA Voice TTS 통합 | ✅ 완료 |
| 언어별 음성 저장 | ✅ 완료 |
| 랜드마크 CRUD | ✅ 완료 |
| 투어 경로 계획 | ✅ 완료 |
| 방문 랜드마크 추적 | ✅ 완료 |
| 투어 리더 관리 인터페이스 | ✅ 완료 |
| 가이드 인터페이스 + 랜드마크 생성 | ✅ 완료 |
| PWA 오프라인 지원 | ✅ 완료 |
| AI 투어 추천 | ✅ 완료 |

### 필요한 API 키

| 서비스 | 환경 변수 | 상태 |
|--------|----------|------|
| CLOVA Voice | NAVER_CLIENT_ID, NAVER_CLIENT_SECRET | ✅ 활성화 |
| OpenAI | OPENAI_API_KEY | ✅ 활성화 |
| Google Gemini | GEMINI_API_KEY | ✅ 활성화 |

---

## 주요 파일 구조

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MenuDialog.tsx        # 설정 및 음성 선택
│   │   │   ├── SettingsDialog.tsx    # 전체 설정 패널
│   │   │   ├── LandmarkFormDialog.tsx # 랜드마크 생성
│   │   │   ├── LandmarkDetailDialog.tsx
│   │   │   └── UnifiedFloatingCard.tsx
│   │   ├── lib/
│   │   │   ├── audioService.ts       # TTS 서비스
│   │   │   ├── translations.ts       # 다국어 번역
│   │   │   └── queryClient.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx              # 메인 지도 페이지
│   │   │   ├── Guide.tsx             # 가이드 모드
│   │   │   └── TourLeader.tsx        # 투어 리더 모드
│   │   └── App.tsx
│   └── public/
│       └── sw.js                     # 서비스 워커
├── server/
│   ├── lib/
│   │   └── clova.ts                  # CLOVA TTS 라이브러리
│   ├── routes.ts                     # API 라우트
│   ├── storage.ts                    # 데이터 저장소
│   └── index.ts
├── shared/
│   └── schema.ts                     # 데이터베이스 스키마
├── replit.md                         # 프로젝트 문서
└── PROGRESS.MD                       # 이 파일
```

---

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 데이터베이스 스키마 적용
npm run db:push

# 강제 스키마 적용 (데이터 손실 경고 시)
npm run db:push --force

# 프로덕션 빌드
npm run build
```

---

## 트러블슈팅 기록

### 이슈 1: CLOVA TTS 401 인증 오류

**증상**:
```
CLOVA TTS API error: 401 - {"error":{"errorCode":"200","message":"Authentication Failed"}}
```

**원인**: 네이버 클라우드 플랫폼에서 CLOVA Voice 서비스 미활성화

**해결**:
1. console.ncloud.com 접속
2. AI Services > CLOVA Voice 서비스 이용 신청
3. 새 API 키 발급
4. Replit Secrets에 업데이트

### 이슈 2: 음성 선택 저장 안됨

**증상**: CLOVA 음성 선택 후 새로고침 시 기본값으로 리셋

**원인**: localStorage 저장 로직 누락

**해결**: 
- `audioService.ts`에 `setClovaVoiceForLanguage`, `getSelectedClovaVoice` 메서드 추가
- `MenuDialog.tsx`, `SettingsDialog.tsx`에서 `handleClovaVoiceChange` 핸들러 구현

---

## 다음 단계 (향후 계획)

| 우선순위 | 작업 | 상태 |
|----------|------|------|
| 1 | 랜드마크별 MP3 오디오 사전 생성 | 대기 |
| 2 | 오프라인 오디오 캐싱 | 대기 |
| 3 | 성능 최적화 | 대기 |
| 4 | 프로덕션 배포 | 대기 |

---

*마지막 업데이트: 2024년 12월 6일*
