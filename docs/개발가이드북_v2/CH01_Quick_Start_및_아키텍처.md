# Chapter 1-2: Quick Start & 아키텍처 Deep Dive
> NoWiFi GPS Tours 실전 개발 가이드북

---

## Chapter 1: Quick Start (5분 만에 로컬 실행)

### 1.1 Prerequisites
```
Node.js 20+
npm 9+
Git
```

### 1.2 Clone & Install
```bash
git clone https://github.com/your-repo/GPS-Cruise-Tour-AudioGuideNo-Wifi-1.git
cd GPS-Cruise-Tour-AudioGuideNo-Wifi-1
npm install
```

### 1.3 환경변수 설정
```bash
cp .env.example .env
```
필수 환경변수:
| 변수 | 용도 | 예시 |
|---|---|---|
| `DATABASE_URL` | NeonDB PostgreSQL 연결 | `postgresql://user:pass@ep-xxx.neon.tech/db` |
| `SESSION_SECRET` | 세션 암호화 키 (32자 이상) | `your_secret_key_at_least_32_chars` |
| `OPENAI_API_KEY` | OpenAI TTS 음성 생성 | `sk-...` |

### 1.4 개발 서버 실행
```bash
npm run dev
# → Server started on port 4000
```
브라우저에서 `http://localhost:4000` 접속

### 1.5 프로덕션 빌드 & 배포
```bash
npm run build     # Vite 프로덕션 빌드
npm run deploy    # Cloudflare Workers 배포 (wrangler)
```

### 1.6 기술 스택 요약
| 계층 | 기술 | 선택 이유 |
|:---:|:---|:---|
| **Frontend** | React 18 + Vite | PWA 구현 최적체, HMR 지원 |
| **Backend** | Hono (Cloudflare Workers) | 초경량 엣지 컴퓨팅, Express 호환 API |
| **Database** | Neon DB (PostgreSQL) | 서버리스 최적화, 브랜칭 지원 |
| **Styling** | Tailwind CSS + Shadcn UI | 일관된 디자인 시스템 |
| **Data** | TanStack Query v5 | 캐싱, 오프라인 데이터 관리 |
| **Maps** | Leaflet + OpenStreetMap | 경량, 무료, 오프라인 타일 캐싱 |
| **Audio** | Web Speech API + OpenAI TTS | 24개 언어 무료 TTS + 고품질 폴백 |

---

## Chapter 2: 아키텍처 Deep Dive

### 2.1 프로젝트 구조
```
client/src/
  ├── components/           # 40+ React 컴포넌트
  │   ├── MapView.tsx              # Leaflet 지도 렌더링
  │   ├── LandmarkDetailDialog.tsx # 랜드마크 상세 + 오디오 재생
  │   ├── OfflineManager.tsx       # 오프라인 데이터 관리 UI
  │   ├── CitySelector.tsx         # 도시 선택 화면
  │   ├── LanguageSelector.tsx     # 24개 언어 선택
  │   └── InstallPrompt.tsx        # PWA 설치 유도
  ├── hooks/                # 커스텀 훅
  │   ├── useGeoLocation.ts        # GPS 실시간 추적
  │   ├── useOfflineMode.ts        # 온/오프라인 자동 전환
  │   ├── useLiveTranslation.ts    # 실시간 번역 + 캐싱
  │   ├── useServiceWorker.ts      # Service Worker 관리
  │   ├── useOfflineImage.ts       # 오프라인 이미지 로드
  │   └── useVisitedLandmarks.ts   # 방문 기록 추적
  ├── lib/                  # 핵심 라이브러리
  │   ├── offlineStorage.ts        # IndexedDB 오프라인 엔진 (642줄)
  │   ├── audioService.ts          # TTS/MP3 오디오 엔진 (1432줄)
  │   ├── locationService.ts       # GPS 도시 매칭 + 근접 탐지
  │   ├── geoUtils.ts              # Haversine 거리 계산
  │   ├── affiliateConfig.ts       # 8개 플랫폼 어필리에이트 링크
  │   ├── i18n.ts                  # 국제화 설정
  │   └── syncService.ts           # 온라인 복귀 시 데이터 동기화
  └── pages/
      └── Home.tsx                 # 메인 페이지 (지도 + 패널)

server/
  ├── index.ts              # 서버 진입점 (port 4000, Vite 통합)
  ├── app.ts                # Hono 앱 + 미들웨어 체인
  ├── routes.ts             # API 라우트 정의
  ├── auth.ts               # 인증 (OAuth, Session)
  ├── db.ts                 # NeonDB 연결
  ├── env.ts                # 환경변수 로더
  └── data/                 # 정적 랜드마크 데이터
      ├── landmarks.ts             # 기본 랜드마크
      ├── landmarks_aegean.ts      # 에게해 (산토리니, 미코노스...)
      ├── landmarks_alaska.ts      # 알래스카 (주노, 케치칸...)
      ├── landmarks_asia_plus.ts   # 아시아 (도쿄, 싱가포르...)
      ├── landmarks_caribbean.ts   # 카리브해 (코수멜, 나소...)
      └── landmarks_eu_boost.ts    # 유럽 (파리, 바르셀로나...)
```

### 2.2 데이터 흐름 다이어그램

```mermaid
graph TD
    A[사용자 위치 변경] --> B[useGeoLocation]
    B --> C{accuracy > 100m?}
    C -->|Yes| D[무시 - 부정확한 GPS]
    C -->|No| E[locationService.getMatchedCityId]
    E --> F{도시 매칭?}
    F -->|Yes| G[useOfflineMode.getLandmarks]
    F -->|No| H[도시 선택 화면 표시]
    G --> I{온라인?}
    I -->|Yes| J[API에서 랜드마크 로드]
    I -->|No| K[IndexedDB에서 로드]
    J --> L[findNearestLandmark]
    K --> L
    L --> M{근접 랜드마크 발견?}
    M -->|Yes| N[audioService.speak]
    M -->|No| O[계속 추적]
    N --> P[useLiveTranslation으로 번역]
    P --> Q[TTS 재생 + UI 표시]
```

### 2.3 서버 진입점 (server/index.ts)

```typescript
// server/index.ts — Hono + Vite 통합 서버
import { serve, getRequestListener } from "@hono/node-server";
import { setupVite, log } from "./vite";
import { createServer } from "node:http";
import app from "./app";

const PORT = Number(process.env.PORT) || 4000;

// [설계 결정] createServer()로 수동 생성하여 Vite 설정이 완료된 후 listen
// → Race Condition 방지: 라우트가 등록되기 전에 요청이 들어오는 것을 차단
const server = createServer();

setupVite(app, server).then((vite) => {
  const requestListener = getRequestListener(app.fetch);

  // Vite 미들웨어가 먼저 처리 → 매칭 안 되면 Hono로 전달
  server.on("request", (req, res) => {
    vite.middlewares(req, res, () => {
      requestListener(req, res);
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    log(`Server started on port ${PORT}`, "server");
  });
});

// Vercel Serverless 배포 지원
export default app.fetch;
```

**왜 이렇게 설계했나:**
- `serve()` 대신 `createServer()`를 사용하는 이유: Vite dev server의 미들웨어를 먼저 거쳐야 HMR, 정적 파일 서빙이 작동
- `setupVite().then()`으로 비동기 초기화: 라우트 등록이 완료된 후에만 요청 수신

### 2.4 Hono 미들웨어 체인 (server/app.ts)

```typescript
const app = new Hono<{ Variables: Variables }>();

// ① CORS — localhost, workers.dev 허용, credentials: true
app.use("*", cors({
  origin: (origin) => {
    // credentials: true 시 origin은 '*' 불가
    // 개발 환경에서는 모든 origin 허용
    if (!origin) return origin;
    if (origin.includes("localhost") || origin.includes("workers.dev")) {
      return origin;
    }
    return origin;
  },
  credentials: true,
}));

// ② CSP Headers — 지도 타일, 이미지, 제휴사 도메인 허용
app.use("*", async (c, next) => {
  await next();
  const csp = [
    // OSM 타일, Unsplash 이미지, 중국 Amap, 제휴사 이미지 허용
    "img-src 'self' data: https: *.tile.openstreetmap.org images.unsplash.com *.amap.com",
    // Service Worker blob: 허용
    "worker-src 'self' blob:",
    // 제휴사 API 연결 허용
    "connect-src 'self' https: *.tile.openstreetmap.org *.viator.com *.klook.com",
  ].join("; ");
  c.header("Content-Security-Policy", csp);
});

// ③ Logger — 요청 로깅
app.use("*", logger());

// ④ Session — CookieStore, 24시간 만료
app.use("*", async (c, next) => {
  const secret = env.SESSION_SECRET || "default_secret_key_must_be_at_least_32_chars_long";
  const middleware = sessionMiddleware({
    store: new CookieStore(),
    encryptionKey: secret,
    expireAfterSeconds: 3600 * 24,
    cookieOptions: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
    },
  });
  return middleware(c, next);
});

// ⑤ Request Timer — 응답 시간 측정
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  // 로깅...
});
```

**미들웨어 실행 순서가 중요한 이유:**
1. CORS가 가장 먼저 — preflight OPTIONS 요청을 즉시 처리
2. CSP가 두 번째 — 모든 응답에 보안 헤더 추가
3. Session이 라우트 전에 — 인증 정보가 라우트 핸들러에서 사용 가능

---

> **다음 챕터:** [CH03 오프라인 엔진 해부](./CH03_오프라인_엔진_해부.md) — IndexedDB 6개 스토어의 설계와 코드
