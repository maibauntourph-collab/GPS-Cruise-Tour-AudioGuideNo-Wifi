# GPS Audio Guide Project Progress Report

## Project Overview
React 기반 GPS 오디오 가이드 PWA 애플리케이션 개발 프로젝트

### Tech Stack
- **Frontend**: React 18, TypeScript, TanStack React Query, Tailwind CSS, Shadcn UI, Wouter
- **Backend**: Express.js, Zod Validation
- **Database**: PostgreSQL (Neon serverless), Drizzle ORM
- **Maps**: React-Leaflet, Leaflet Routing Machine, OpenStreetMap
- **AI**: OpenAI GPT-4o-mini, Google Gemini
- **TTS**: Web Speech API, CLOVA Voice API

---

## Phase 1: Core Infrastructure

### 1.1 Project Setup
```bash
npm install
npm run dev
```
**Result**: Express server + Vite dev server running on port 5000

### 1.2 Database Schema Setup
```bash
npm run db:push
```
**Schema**: `shared/schema.ts`
- Cities, Landmarks, VisitedLandmarks, TourSchedules, TourMembers tables
- Drizzle ORM with PostgreSQL

### 1.3 Server Routes
**File**: `server/routes.ts`
- `/api/cities` - City list
- `/api/landmarks` - Landmark CRUD
- `/api/visited` - Visit tracking
- `/api/tour-leader/*` - Tour leader management
- `/api/admin/*` - Admin endpoints

---

## Phase 2: Multi-Language Support

### 2.1 Supported Languages (10)
- English (en), Korean (ko), Italian (it), Spanish (es)
- French (fr), German (de), Chinese (zh), Japanese (ja)
- Portuguese (pt), Russian (ru)

### 2.2 Translation System
**File**: `client/src/lib/translations.ts`
- Dynamic content translation per landmark
- UI translation support

---

## Phase 3: Audio System Integration

### 3.1 System TTS (Web Speech API)
**File**: `client/src/lib/audioService.ts`

```typescript
// Voice selection per language
audioService.setVoiceForLanguage('ko', 'Microsoft Heami - Korean (Korean)');
audioService.playText('안녕하세요', 'ko', 1.0);
```

**Features**:
- Per-language voice selection with persistence (localStorage)
- Speech rate control (0.5x - 2.0x)
- Voice quality/gender filtering

### 3.2 CLOVA Voice TTS Integration
**File**: `server/lib/clova.ts`

#### API Configuration
```bash
# Environment Variables
NAVER_CLIENT_ID=<your-access-key-id>
NAVER_CLIENT_SECRET=<your-secret-key>
```

#### CLOVA API Test
```bash
curl -X POST "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-NCP-APIGW-API-KEY-ID: $NAVER_CLIENT_ID" \
  -H "X-NCP-APIGW-API-KEY: $NAVER_CLIENT_SECRET" \
  -d "speaker=nara&text=안녕하세요&format=mp3" \
  -o test.mp3
```
**Result**: HTTP 200, MP3 file generated (15,780 bytes)

#### Available CLOVA Voices (45+)
| Voice ID | Name | Language | Gender |
|----------|------|----------|--------|
| nara | Nara (나라) | Korean | Female |
| nminsang | Minsang (민상) | Korean | Male |
| clara | Clara (클라라) | English | Female |
| matt | Matt (매트) | English | Male |
| ntomoko | Tomoko (토모코) | Japanese | Female |
| meimei | Meimei (메이메이) | Chinese | Female |
| carmen | Carmen (카르멘) | Spanish | Female |
| ... | ... | ... | ... |

#### API Endpoints
```
GET  /api/tts/clova/voices?language=ko  → Voice list for language
POST /api/tts/clova/generate            → Generate TTS audio
```

### 3.3 Audio Mode Selection
**Files**: `MenuDialog.tsx`, `SettingsDialog.tsx`

```typescript
type AudioMode = 'auto' | 'tts' | 'clova' | 'mp3';
```

**UI Features**:
- Radio button mode selection
- Voice card-based selection with preview
- Per-language voice persistence

---

## Phase 4: Tour Management

### 4.1 Tour Leader Mode
**Route**: `/tour-leader`

**Features**:
- Schedule CRUD (Create, Read, Update, Delete)
- Member management with Excel import/export
- Progress report sharing via Web Share API

### 4.2 Guide Mode
**Route**: `/guide`

**Features**:
- Landmark creation dialog
- Real-time map interaction
- Audio narration controls

### 4.3 Landmark Creation
**File**: `client/src/components/LandmarkFormDialog.tsx`

```typescript
// POST /api/admin/landmarks
{
  name: string,
  category: 'Landmark' | 'Activity' | 'Restaurant' | 'GiftShop',
  latitude: number,
  longitude: number,
  description: string,
  // ... translations
}
```

---

## Phase 5: Offline Functionality (PWA)

### 5.1 Service Worker
**File**: `client/public/sw.js`
- Static asset caching
- City data caching
- Map tile caching

### 5.2 IndexedDB
- Client-side data storage
- Offline landmark access

### 5.3 Offline Package API
```
GET /api/offline-package?city=rome&language=ko
```

---

## Phase 6: AI Tour Recommendations

### 6.1 Google Gemini Integration
```
POST /api/ai/recommend-tour
```
- Category-based itinerary suggestions
- Geographic proximity optimization

---

## Current Status Summary

### Working Features ✅
- [x] Interactive map with GPS tracking
- [x] Multi-language support (10 languages)
- [x] System TTS with voice selection
- [x] CLOVA Voice TTS integration
- [x] Per-language voice persistence
- [x] Landmark CRUD operations
- [x] Tour route planning
- [x] Visited landmarks tracking
- [x] Tour Leader management interface
- [x] Guide interface with landmark creation
- [x] PWA offline support
- [x] AI tour recommendations

### API Keys Required
| Service | Environment Variable | Status |
|---------|---------------------|--------|
| CLOVA Voice | NAVER_CLIENT_ID, NAVER_CLIENT_SECRET | ✅ Active |
| OpenAI | OPENAI_API_KEY | ✅ Active |
| Google Gemini | GEMINI_API_KEY | ✅ Active |

---

## Development Commands

### Start Development Server
```bash
npm run dev
```

### Database Operations
```bash
npm run db:push        # Push schema changes
npm run db:push --force # Force push (with data loss warning)
```

### Build for Production
```bash
npm run build
```

---

## File Structure

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MenuDialog.tsx       # Settings & voice selection
│   │   │   ├── SettingsDialog.tsx   # Full settings panel
│   │   │   ├── LandmarkFormDialog.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── audioService.ts      # TTS service
│   │   │   ├── translations.ts      # i18n
│   │   │   └── queryClient.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Guide.tsx
│   │   │   └── TourLeader.tsx
│   │   └── App.tsx
│   └── public/
│       └── sw.js                    # Service Worker
├── server/
│   ├── lib/
│   │   └── clova.ts                 # CLOVA TTS library
│   ├── routes.ts                    # API routes
│   ├── storage.ts                   # Data storage
│   └── index.ts
├── shared/
│   └── schema.ts                    # Database schema
├── replit.md                        # Project documentation
└── PROGRESS.MD                      # This file
```

---

## Recent Updates

### 2024-12-06: CLOVA Voice Integration Complete
1. Created CLOVA TTS library (`server/lib/clova.ts`)
2. Added TTS API endpoints
3. Implemented voice selection UI with card-based interface
4. Added per-language voice persistence
5. Fixed API authentication (401 → 200)

### Test Results
```
CLOVA API Test: HTTP 200
Audio File: 15,780 bytes generated
Voices Available: 45+ across 5 languages
```

---

## Next Steps

1. [ ] MP3 audio file pre-generation for landmarks
2. [ ] Offline audio caching
3. [ ] Performance optimization
4. [ ] Production deployment

---

*Last Updated: December 6, 2024*
