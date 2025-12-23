# GPS Audio Guide - 프로젝트 전체 문서

## 프로젝트 개요

### 목적
관광객을 위한 도시 탐험을 향상시키는 React 기반 GPS 오디오 가이드 PWA 애플리케이션

### 주요 기능
- 인터랙티브 지도와 클릭 가능한 랜드마크 마커
- 자동 오디오 내레이션 (랜드마크 반경 내 진입 시)
- 턴바이턴 내비게이션 (Google Maps 통합)
- 다국어 지원 (10개 언어, 자동 폴백)
- 포토 갤러리
- PostgreSQL 기반 방문 랜드마크 추적
- 조절 가능한 속도의 오프라인 TTS
- 모바일 최적화 UI (카드 기반 메뉴)
- PWA 설치 기능
- 18개 글로벌 도시의 랜드마크 및 액티비티
- 순차적 투어 루트 계획 (실제 도로 경로)
- 티켓 및 투어 예약 플랫폼 링크
- 크루즈 승객을 위한 기항지 관광 추천

---

## 시스템 아키텍처

### 프론트엔드
- **프레임워크**: React 18 + TypeScript
- **데이터 페칭**: TanStack React Query v5
- **스타일링**: Tailwind CSS + Shadcn UI
- **라우팅**: Wouter
- **지도**: React-Leaflet, Leaflet Routing Machine
- **브라우저 API**: Web Speech API, Geolocation API, Service Worker API

### 백엔드
- **프레임워크**: Express.js
- **데이터베이스**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM (타입 안전)
- **검증**: Zod
- **세션**: LocalStorage (세션 ID 및 사용자 설정)

### 데이터 저장
- **하이브리드 접근**: PostgreSQL (영구 데이터) + 인메모리 (랜드마크/도시 데이터)

---

## UI/UX 설계

### 디자인 시스템
- **주 색상**: Terracotta/로마 레드-오렌지 `hsl(14, 85%, 55%)`
- **성공/GPS 색상**: 녹색 `hsl(142, 71%, 45%)`
- **액티비티 색상**: 파란색 `hsl(195, 85%, 50%)`
- **스타일**: 글래스모픽 플로팅 패널 (백드롭 블러)
- **타이포그래피**: Playfair Display (세리프) + Inter (산세리프)
- **반응형**: 모바일 우선 접근

### PWA 기능
- 설치 가능 (홈 화면에 추가)
- 서비스 워커를 통한 오프라인 기능
- 네트워크 상태 표시기
- 설치 프롬프트

---

## 주요 기능 상세

### 1. 인터랙티브 지도 및 내비게이션
- React-Leaflet으로 지도 표시
- Leaflet Routing Machine으로 턴바이턴 방향 안내
- GPS 추적 및 자동 지도 중심 조정
- 커스텀 테라코타 색상 경로 스타일

### 2. 오디오 내레이션
- Web Speech API 사용
- 랜드마크 반경 내 자동 트리거
- 언어별 TTS 음성
- 조절 가능한 재생 속도 (0.5x-2x)
- LocalStorage에 설정 저장
- 반복 재생 방지

### 3. 다국어 지원
- **지원 언어**: 영어, 이탈리아어, 한국어, 스페인어, 프랑스어, 독일어, 중국어, 일본어, 포르투갈어, 러시아어
- 도시 및 언어 선택기
- 동적으로 도시별 랜드마크/액티비티 로드
- 번역된 콘텐츠 (detailedDescription 필드 포함)
- 언어별 TTS 음성

### 4. 랜드마크 및 액티비티 상세 정보
- 각 관심 지점:
  - 풍부한 정보
  - 포토 갤러리 (전체 화면 뷰어)
  - 역사적 세부 정보
  - 정확한 위치를 위한 임베디드 지도
- 상세 모달을 통해 접근

### 5. 방문 랜드마크 추적
- 세션별 진행 상황 추적
- PostgreSQL 데이터베이스에 저장
- 진행률 바 및 통계 시각화

### 6. 오프라인 기능
- 서비스 워커가 정적 자산 사전 캐시
- 모든 도시 랜드마크 및 액티비티 캐시
- 지도 타일 캐시
- 캐시된 API 응답으로 완전한 오프라인 기능

### 7. 콘텐츠 필터링
- 독립적인 필터 버튼
- 지도 및 목록에서 랜드마크(테라코타)/액티비티(파란색) 표시 토글
- 다양한 액티비티 카테고리 지원 (크루즈, 푸드 투어 등)

### 8. 투어 루트 계획
- 마커 클릭 또는 "투어에 추가" 버튼으로 커스텀 투어 루트 생성
- Leaflet Routing Machine으로 실제 도로 경로 계산
- 총 거리(km) 및 예상 이동 시간(분) 표시
- 지도에 테라코타 점선 폴리라인으로 투어 시각화
- 투어 지우기 버튼

### 9. 티켓 및 투어 예약
- 랜드마크 상세 패널에 예약 플랫폼 링크 통합
  - GetYourGuide
  - Viator
  - Klook
- 번역된 랜드마크 이름으로 동적 검색 URL 생성
- 보안 기능: `noopener,noreferrer` 포함
- 모든 지원 언어로 UI 번역

### 10. 크루즈 기항지 관광 추천 (신규)
- **지원 크루즈 도시** (5개):
  - **로마**: Civitavecchia 항구 (80km)
  - **바르셀로나**: Port of Barcelona (시내 중심)
  - **싱가포르**: Marina Bay Cruise Centre (시내)
  - **스톡홀름**: Stockholm Cruise Terminal (시내 중심)
  - **코펜하겐**: Copenhagen Cruise Terminal (도보 거리)

- **크루즈 포트 정보 카드**:
  - 항구 이름 및 거리
  - 추천 관광 시간
  - 크루즈 승객을 위한 팁
  - 추천 명소 버튼 (클릭 시 상세 정보 표시)
  - 10개 언어 모두 지원

---

## API 엔드포인트

### 도시
- `GET /api/cities` - 모든 도시 가져오기
- `GET /api/cities/:id` - 특정 도시 가져오기

### 랜드마크
- `GET /api/landmarks?cityId={cityId}` - 도시별 랜드마크 가져오기
- `GET /api/landmarks/:id` - 특정 랜드마크 가져오기

### 방문 기록
- `POST /api/visited` - 방문 랜드마크 기록
- `GET /api/visited?sessionId={id}` - 세션별 방문 랜드마크 가져오기
- `GET /api/visited/count?sessionId={id}` - 방문 랜드마크 수 가져오기
- `GET /api/visited/:landmarkId?sessionId={id}` - 특정 랜드마크 방문 여부 확인

---

## 외부 의존성

### 매핑
- React-Leaflet
- Leaflet
- OpenStreetMap (지도 타일)
- Leaflet Routing Machine
- Google Maps (외부 내비게이션 옵션)

### 데이터베이스
- PostgreSQL (Neon serverless)
- Drizzle ORM

### 프론트엔드 라이브러리
- React
- TypeScript
- TanStack React Query
- Tailwind CSS
- Shadcn UI
- Wouter

### 백엔드 라이브러리
- Express.js
- Zod

### 브라우저 API
- Web Speech API (TTS)
- Geolocation API (GPS)
- Service Worker API (PWA 오프라인)
- LocalStorage API (클라이언트 측 지속성)

---

## 파일 구조

### 주요 파일
- `client/src/pages/Home.tsx` - 메인 애플리케이션 페이지
- `client/src/components/LandmarkPanel.tsx` - 랜드마크 상세 패널
- `client/src/components/CruisePortInfo.tsx` - 크루즈 포트 정보 카드
- `client/src/lib/translations.ts` - 다국어 번역 시스템
- `server/storage.ts` - 데이터 저장소 (랜드마크/도시 데이터)
- `shared/schema.ts` - 데이터베이스 스키마 (Drizzle)
- `replit.md` - 프로젝트 문서

---

## 사용자 선호 설정

- 상세한 설명 선호
- 반복적인 개발 원함
- 주요 변경 전 확인 요청
- 간단한 언어 선호

---

## 비즈니스 비전

글로벌 여행 동반자 앱으로 성장하여 세계적인 선도 여행 가이드 애플리케이션이 되는 것을 목표로 합니다.

---

## 기술적 의사결정

### 왜 PWA인가?
- 네이티브 앱 설치 없이 오프라인 기능
- 플랫폼 간 호환성
- 낮은 진입 장벽

### 왜 PostgreSQL인가?
- 관계형 데이터에 적합
- Drizzle ORM으로 타입 안전성
- Neon serverless로 확장 가능

### 왜 Web Speech API인가?
- 브라우저 네이티브
- 외부 TTS 서비스 불필요
- 다국어 음성 지원

---

## 로컬 개발 환경 실행

### 서버 실행

1. **의존성 설치**
```bash
npm install
```

2. **앱 실행** (Windows 환경)
```bash
cmd /c "set SESSION_SECRET=devsecret123 && npx tsx server/index.ts"
```

3. **서버 상태**
- **URL**: http://localhost:5000
- **포트**: 5000

> **참고**: `DATABASE_URL` 환경 변수가 설정되지 않으면 데이터베이스 없이 실행됩니다.

---

## 고객 대시보드 (Home 페이지)

**URL**: http://localhost:5000/home

### 주요 기능

| 기능 | 설명 |
|------|------|
| **GPS Guide** | 앱 로고/타이틀 (좌측 상단) |
| **인터랙티브 지도** | Leaflet 기반 세부시티 중심 지도 |
| **목록** | 리스트 형식 보기 |
| **출발/도착** | 경로 계획 기능 |
| **AI 추천** | AI 기반 추천 (보라색-핑크 그라데이션) |
| **명소** | 관광 명소 필터 |
| **액티비티** | 활동 필터 |
| **추천 맛집** | 레스토랑 필터 |
| **기념품가게** | 기념품 상점 필터 |
| **크루즈 항구 정보** | 크루즈 항구 정보 (깜빡이는 애니메이션) |

### 사용 가능한 페이지들

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 역할 선택 | 사용자 역할 선택 페이지 |
| `/home` | **고객 대시보드** | 메인 앱 인터페이스 |
| `/guide` | 가이드 뷰 | 가이드 전용 인터페이스 |
| `/tour-leader` | 투어 리더 뷰 | 투어 리더 전용 인터페이스 |
| `/admin` | 관리자 대시보드 | 관리자 페이지 |
| `/my-routes` | 내 경로 | 저장된 경로 관리 |

---

## 오프라인(와이파이 없이) 실행 분석

### 결론: **예, 와이파이 없이 실행 가능합니다** ✅

이 애플리케이션은 **PWA(Progressive Web App)**로 구현되어 있어 오프라인에서도 작동하도록 설계되어 있습니다.

---

### Service Worker 캐싱 전략

**파일 위치**: `client/public/service-worker.js`

| 캐시 종류 | 목적 | 저장 대상 |
|-----------|------|-----------|
| `STATIC_CACHE` | 정적 자산 | manifest.json, 아이콘 파일들 |
| `DYNAMIC_CACHE` | 동적 콘텐츠 | CSS, 이미지 등 |
| `MAP_TILES_CACHE` | 지도 타일 | OpenStreetMap 지도 이미지 |
| `API_CACHE` | API 응답 | 도시/랜드마크 데이터 |

**주요 기능:**
- 네트워크 실패 시 캐시에서 자동 제공
- Rome, Paris, London 데이터 미리 캐싱
- 지도 타일 캐싱 지원 (이전에 본 지역)
- 오프라인 시 폴백 데이터 제공

---

### IndexedDB 오프라인 스토리지

**파일 위치**: `client/src/lib/offlineStorage.ts`

| 저장소 | 내용 |
|--------|------|
| `cities` | 도시 정보 |
| `landmarks` | 랜드마크 데이터 |
| `metadata` | 다운로드 메타데이터 |
| `visitedQueue` | 방문 기록 (오프라인 큐) |
| `audioFiles` | 오디오 파일 캐시 |

**기능:**
- 도시별 오프라인 패키지 다운로드
- 방문 기록 오프라인 큐 → 온라인 복귀 시 동기화
- 오디오 파일 사전 캐싱

---

### 네트워크 상태 감지

**파일 위치**: `client/src/components/OfflineIndicator.tsx`

- 오프라인 상태 자동 감지
- 사용자에게 시각적 표시:
  - 🔴 오프라인: "Offline mode - Using cached data"
  - 🟢 온라인 복귀: "Back online"

---

### 오프라인 사용 조건 및 제한사항

#### 사전 조건 (온라인 상태에서 필요)
1. **앱 첫 방문**: Service Worker 설치 및 기본 자산 캐싱
2. **지도 탐색**: 방문한 지역의 지도 타일 자동 캐싱
3. **도시 데이터**: 한 번 이상 접근한 도시의 랜드마크 데이터

#### 오프라인 시 작동하는 기능

| 기능 | 상태 | 설명 |
|------|------|------|
| 앱 실행 | ✅ | 캐시된 HTML/CSS/JS 사용 |
| 지도 보기 | ⚠️ | 이전에 본 지역만 가능 |
| 랜드마크 정보 | ✅ | 캐시된 데이터 사용 |
| 오디오 가이드 | ✅ | Web Speech API(TTS) 사용 |
| GPS 위치 추적 | ✅ | 기기 GPS 사용 (와이파이 불필요) |
| 방문 기록 저장 | ✅ | IndexedDB에 큐잉 |

#### 오프라인 시 제한되는 기능

| 기능 | 상태 | 이유 |
|------|------|------|
| 새 도시 데이터 | ❌ | 서버 API 필요 |
| 방문하지 않은 지역 지도 | ❌ | 지도 타일 다운로드 필요 |
| 실시간 데이터 동기화 | ❌ | 서버 연결 필요 |

---

### 오프라인 → 온라인 복귀 시

1. **자동 데이터 동기화**: 큐에 저장된 방문 기록이 서버에 동기화
2. **캐시 업데이트**: 최신 데이터로 캐시 갱신
3. **상태 표시**: "Back online" 알림 표시

---

### 최적의 오프라인 사용을 위한 권장사항

1. **사전 준비**: 여행 전 원하는 도시의 지도를 충분히 탐색하여 캐싱
2. **PWA 설치**: 홈 화면에 앱 추가 → 더 안정적인 오프라인 경험
3. **오디오**: 오프라인에서도 TTS 기반 오디오 가이드 사용 가능

---

*이 문서는 프로젝트의 전체 개요를 제공합니다. 최신 변경사항은 Git 커밋 히스토리와 replit.md를 참조하세요.*
