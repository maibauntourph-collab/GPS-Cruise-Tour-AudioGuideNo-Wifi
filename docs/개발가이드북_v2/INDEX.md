# NoWiFi GPS Tours — 실전 개발 가이드북 v2
> AI 에이전트와 함께한 60일간의 풀스택 개발 — 코드로 말하는 가이드북

```
"와이파이 없는 크루즈 항구에서, 코드는 어떻게 길을 찾았나?"
```

---

## 이 가이드북의 차별점

| | 기존 가이드북 (v1) | 이 가이드북 (v2) |
|---|---|---|
| **코드** | 0줄 | 실제 소스 코드 발췌 + 해설 |
| **형태** | 537개 원본 문서를 폴더 분류 | 9개 챕터로 구조화된 서사 |
| **대상** | 히스토리 아카이브 | 개발자가 바로 참고 가능 |
| **트러블슈팅** | "해결했다" (1줄) | Before/After 코드 + 교훈 |
| **아키텍처** | 개념 설명 | Mermaid 다이어그램 + 실제 구조 |

---

## 목차

### Foundation

| Ch | 제목 | 핵심 내용 | 소스 파일 |
|---|---|---|---|
| [01-02](./CH01_Quick_Start_및_아키텍처.md) | **Quick Start & 아키텍처** | 5분 로컬 실행, 프로젝트 구조, 서버 진입점, 미들웨어 체인 | `server/index.ts`, `server/app.ts` |

### Core Engine

| Ch | 제목 | 핵심 내용 | 소스 파일 |
|---|---|---|---|
| [03](./CH03_오프라인_엔진_해부.md) | **오프라인 엔진 해부** | IndexedDB 6개 스토어, 온/오프라인 전환, ETag 캐싱, 오디오 사전 다운로드 | `offlineStorage.ts`, `useOfflineMode.ts` |
| [04](./CH04_다국어_TTS_오디오_시스템.md) | **다국어 TTS 시스템** | 24개 언어, 음성 스코어링, 모바일 잠금 해제, OpenAI 폴백, 좀비 방지 | `audioService.ts` (1,432줄) |
| [05](./CH05_GPS_근접탐지_시스템.md) | **GPS 근접 탐지** | Haversine 공식, 도시 매칭, 정확도 보정, 실시간 번역 | `geoUtils.ts`, `locationService.ts`, `useGeoLocation.ts` |

### Operations

| Ch | 제목 | 핵심 내용 | 소스 파일 |
|---|---|---|---|
| [06](./CH06_트러블슈팅_케이스북.md) | **트러블슈팅 케이스북** | 6개 실전 버그 — 화이트스크린, TTS 불일치, 오디오 차단, Safari 타임아웃 등 | Before/After 코드 |
| [07](./CH07_배포_및_인프라.md) | **배포 & 인프라** | Hono 서버 구조, CSP 설정, 데이터 파일 구조, 배포 명령어 | `server/app.ts` |

### Business & Team

| Ch | 제목 | 핵심 내용 | 소스 파일 |
|---|---|---|---|
| [08](./CH08_수익화_어필리에이트_코드.md) | **수익화 코드** | 8개 플랫폼 URL 빌더, 다국어 라우팅, 자동 파라미터 삽입, 수익 시뮬레이션 | `affiliateConfig.ts` |
| [09](./CH09_AI_에이전트_운용_가이드.md) | **AI 에이전트 운용** | BMAD 8인 팀, 호출 예시, AI 모델 역할 분담, 14단계 워크플로우 | `docs/agent_prompt_*.md` |

### Growth & Marketing

| Ch | 제목 | 핵심 내용 | 소스 파일 |
|---|---|---|---|
| [10](./CH10_마케팅_및_수익화_전략.md) | **마케팅 & 수익화 전략** | B2B 콜드메일, B2C QR/커뮤니티, Stripe 결제, PWA 배포, 가이드북 마케팅 | 전략 문서 |
| [11](./CH11_Facebook_Ads_전략.md) | **Facebook Ads 전략** | 4세그먼트 타깃팅, 후킹 카피 10개, 영상 스크립트 3종, A/B 테스트, 예산 3단계 | 광고 기획서 |
| [12](./CH12_소셜미디어_전체_전략.md) | **YouTube 전략** | 채널 설정, 영상 20개, Shorts 10개, SEO, 인플루언서 협업 | 콘텐츠 기획 |
| [12B](./CH12B_TikTok_Threads_X_LinkedIn.md) | **TikTok/Threads/X/LinkedIn** | 4개 플랫폼별 콘텐츠, 광고, 해시태그, B2B, 주간 캘린더 | 소셜 전략 |
| [13](./CH13_국가별_타깃_전략.md) | **국가별 마케팅 타깃** | 8개국 우선순위 랭킹, 플랫폼/키워드/카피/예산, Phase 1-4 런칭 | 글로벌 전략 |

### Execution (실행)

| Ch | 제목 | 핵심 내용 | 소스 |
|---|---|---|---|
| [14](./CH14_제로비용_마케팅_실행계획.md) | **제로 비용 마케팅 실행계획** | Stage 0-6 단계별, $0 시작→수익 재투자, 즉시 실행 체크리스트 | 실행 계획 |
| [15](./CH15_자동_영상_생성_파이프라인.md) | **자동 영상 생성 파이프라인** | Remotion + TTS + Viator, 3종 템플릿, 업로드 API, 1,200영상 자동화 | 기술 설계 |

---

## 기술 스택 요약

```
Frontend:  React 18 + Vite + TypeScript + Tailwind + Shadcn UI
Backend:   Hono (Cloudflare Workers) + NeonDB (PostgreSQL)
Maps:      Leaflet + OpenStreetMap
Audio:     Web Speech API + OpenAI TTS
Offline:   IndexedDB + Service Worker (PWA)
Data:      TanStack Query v5
Auth:      hono-sessions + CookieStore
```

## 프로젝트 규모

```
총 소스 코드:    ~15,000줄 (TypeScript/TSX)
컴포넌트:       40+ React 컴포넌트
커스텀 훅:      13개
핵심 라이브러리:  7개 (lib/)
서버 라우트:     10+ API 엔드포인트
지원 언어:      24개
지원 도시:      40+ (6개 지역)
개발 기간:      ~60일 (2026.02 ~ 2026.04)
개발 팀:        1명 개발자 + 8명 AI 에이전트
```

---

*이 가이드북은 실제 코드베이스에서 발췌한 코드를 포함합니다.*
*최신 코드는 항상 소스 파일을 직접 확인하세요.*
