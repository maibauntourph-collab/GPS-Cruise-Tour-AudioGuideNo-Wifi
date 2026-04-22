# 🔧 기술 사양서 (Technical Specification)

> **NoWiFi GPS Tours** — 시스템 아키텍처 및 기술 사양
> 
> 작성일: 2026년 2월 11일 | 버전: 1.0

---

## 1. 시스템 개요

NoWiFi GPS Tours는 **React 기반 PWA** 애플리케이션으로, 오프라인 환경에서도 완전히 작동하는 GPS 오디오 가이드 플랫폼입니다.

---

## 2. 프론트엔드 사양

### 2.1 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.x | UI 프레임워크 |
| TypeScript | 5.x | 타입 안전성 |
| Vite | 5.x | 빌드 도구 |
| TanStack React Query | v5 | 서버 상태 관리 |
| Wouter | 3.x | 클라이언트 라우팅 |
| Tailwind CSS | 3.x | 유틸리티 CSS |
| Shadcn UI | latest | UI 컴포넌트 라이브러리 |
| React-Leaflet | 4.x | 지도 렌더링 |
| Leaflet Routing Machine | 3.x | 경로 계산 |

### 2.2 페이지 구조

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | RoleSelection | 역할 선택 (고객/가이드/투어리더/관리자) |
| `/home` | Home | 메인 대시보드 (지도 + 랜드마크) |
| `/guide` | GuideView | 가이드 전용 인터페이스 |
| `/tour-leader` | TourLeaderView | 투어 리더 인터페이스 |
| `/admin` | Admin | 관리자 대시보드 |
| `/my-routes` | MyRoutes | 저장된 경로 관리 |

### 2.3 오프라인 기능

#### Service Worker 캐싱 전략

| 캐시 이름 | 전략 | 대상 |
|-----------|------|------|
| `STATIC_CACHE` | Cache First | manifest.json, 아이콘 |
| `DYNAMIC_CACHE` | Network First | CSS, 이미지, JS |
| `MAP_TILES_CACHE` | Cache First | OpenStreetMap 타일 |
| `API_CACHE` | Network First, Cache Fallback | API 응답 (/api/*) |

#### IndexedDB 스토어

| 스토어 | 키 | 데이터 |
|--------|-----|--------|
| `cities` | cityId | 도시 정보 JSON |
| `landmarks` | landmarkId | 랜드마크 데이터 JSON |
| `metadata` | key | 다운로드/버전 메타데이터 |
| `visitedQueue` | auto | 오프라인 방문 기록 큐 |
| `audioFiles` | audioId | 캐시된 오디오 파일 |

---

## 3. 백엔드 사양

### 3.1 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| Express.js | 4.x | HTTP 서버 |
| TypeScript | 5.x | 타입 안전성 |
| tsx | latest | TypeScript 실행 |
| Drizzle ORM | latest | DB 쿼리 빌더 |
| Zod | 3.x | 스키마 검증 |
| Stripe | latest | 결제 처리 |

### 3.2 API 엔드포인트

- **도시 API**: `/api/cities`, `/api/cities/:id`
- **랜드마크 API**: `/api/landmarks`, `/api/landmarks/:id`
- **방문 기록 API**: `/api/visited`, `/api/visited/count`
- **경로 API**: `/api/saved-routes`, `/api/saved-routes/:id`
- **결제 API**: `/api/create-payment-intent`, `/api/webhook/stripe`

---

## 4. 데이터베이스 및 보안

### 4.1 주요 테이블

| 테이블 | 설명 | 레코드 규모 |
|--------|------|:-----------:|
| `users` | 사용자 계정 | ~100K |
| `visited_landmarks` | 방문 기록 | ~1M |
| `saved_routes` | 저장된 경로 | ~50K |
| `route_photos` | 경로 사진 | ~200K |
| `settlements` | 정산 기록 | ~10K |

### 4.2 보안 사양

- 세션 관리: express-session + localStorage
- HTTPS: TLS 1.3 (프로덕션)
- 외부 링크: `noopener, noreferrer` 적용
- 입력 검증: Zod 스키마 검증
- 결제 보안: Stripe PCI DSS 준수
- API 키: 환경 변수로 관리 (`.env`)

---

## 5. 성능 및 인프라

### 5.1 성능 목표

- 첫 로딩 (FCP): < 1.5초
- 인터랙티브 (TTI): < 3.0초
- 오프라인 로딩: < 0.5초
- API 응답 시간: < 200ms
- Lighthouse 점수: > 90 (PWA)

### 5.2 인프라 구성

- 데이터베이스: Neon PostgreSQL (Serverless)
- 호스팅: Vercel / Replit
- CDN: Cloudflare
- 모니터링: Sentry
- AI API: OpenAI API

---

*⚙️ "대표님, 이 시스템은 확장성과 효율성의 최적해(Optimum)를 찾았습니다." — 산업공학박사 📈*
