# GPS Cruise Tour AudioGuide (No WiFi)


## 추후 젬마를 반영해서 깃허브에 여행정보 고도화 시켜서
# 물어보면 답해줄수 있는 형태로 진행을 하자
# 본인들의 AI계정을 등록하면 무료로 안내서비스를 받을수 있도록 한다.MD파일 축적 VECTOR RAG형성
## ELEVANLABS를 활용해서 대화하도록 구성해준다. 여행전문 AI


Offline-capable PWA that delivers GPS-triggered audio narration at cruise port destinations worldwide -- no internet required after initial download.

## Features

- GPS-based proximity detection triggers automatic audio narration at landmarks
- 34 cities and 550+ landmarks across Europe, Asia, and the Americas
- 24 languages supported via OpenAI TTS with Web Speech API fallback
- Full offline support through IndexedDB caching and Service Worker
- Multi-language narration system (narrationI18n) with Korean-first content and auto-translation
- Interactive maps powered by Leaflet with routing support
- Stripe-integrated payment for premium content
- QR code sharing for tours

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS, Radix UI, Zustand |
| Backend | Hono (runs on Cloudflare Workers and Node) |
| Database | NeonDB (serverless PostgreSQL), Drizzle ORM |
| Maps | Leaflet + React-Leaflet, Leaflet Routing Machine |
| TTS | OpenAI TTS API, Web Speech API (fallback) |
| AI | OpenAI, Anthropic, Google Generative AI, LangChain / LangGraph |
| PWA | vite-plugin-pwa, Service Worker, IndexedDB |
| Deployment | Cloudflare Workers (via Wrangler) |
| Payments | Stripe |
| Testing | Playwright |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server (backend + frontend)
npm run dev

# Start only the frontend dev server
npm run dev:client

# Type-check the project
npm run check
```

Create a `.env` file in the project root with the required environment variables (database URL, OpenAI API key, Stripe keys, etc.) before running the dev server.

## Project Structure

```
client/          # React frontend source (pages, components, hooks)
server/          # Hono backend (API routes, services, scripts)
shared/          # Shared types and schemas (Drizzle models, Zod schemas)
api/             # Cloudflare Workers entry point
public/          # Static assets and PWA manifest
migrations/      # Drizzle database migrations
scripts/         # Build and utility scripts
docs/            # Documentation and guides
```

## Key Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start full-stack dev server |
| `npm run build` | Build frontend (Vite) and backend (esbuild) |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run deploy:prod` | Deploy to production environment |
| `npm run deploy:staging` | Deploy to staging environment |
| `npm run db:push` | Push Drizzle schema changes to the database |
| `npm run translate:all` | Run batch translation for all landmarks |

## Deployment

The project deploys to **Cloudflare Workers** using Wrangler.

```bash
# Dry-run build for Workers
npm run build:worker

# Deploy (default environment)
npm run deploy

# Deploy to production
npm run deploy:prod
```

Configure `wrangler.toml` (or `wrangler.jsonc`) with your Cloudflare account ID, database bindings, and environment variables before deploying.

## License

MIT

---

## 🔒 관리자 정보 (Admin Info)

### github
# maibauntourph@gmail.com
https://github.com/maibauntourph-collab/GPS-Cruise-Tour-AudioGuideNo-Wifi

### neon db 
```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
```

## 🛠️ 작업지시 방법
동시에 작업을 나눠서 병렬로 작업을 진행하고 BMAD의 기획과 LANGGRAPH의 통제하에 작업 진행 승인

### 어려운문제
요청 @advisor


## 배포
  ✅ URL:
  https://gps-audio-guide-staging.maibauntourph.workers.dev   
  📌 버전: e940ebf2-0163-40b4-bf4b-a3bfe463d0d1
  🗓️  배포 날짜: 2026-04-23 21:20 KST

  📊 Asset 통계:
     • 새 업로드: 22개
     • 기존 재사용: 129개
     • 제거: 22개 (stale)
     • 용량: 2190.46 KiB (gzip)


## stripe 결제
     https://dashboard.stripe.com/acct_1Rr2u1Lie2z59PD6/test/dashboard

## 일레븐렙스 
보이스 tts 유튜브연결
https://elevenlabs.io/app/developers/api-keys

kennethcall.ph@gmail.com

## 작업진행 히스토리관리 (하네스)
작업이 완료되면 작업완료.md파일에 추가해주고 진행사항 및 진행해야할 사항은 진행사항.md파일에 추가해 줘라

## 유튜브 검색을 위한 사용자 인증저보  + 사용자 인증 정보 만들기 
# 서비스 계정까지 만들어야 한다
VideoTab 영상 검색에 사용하려면?
Service Account는 공개 YouTube 검색에는 사용 불가합니다. 공개 영상 검색은 API Key(AIzaSy...)가 필요합니다.

Google Cloud Console (calm-nation-246319 프로젝트) → APIs & Services → Credentials → + CREATE CREDENTIALS → API key 에서 발급하시면 됩니다.