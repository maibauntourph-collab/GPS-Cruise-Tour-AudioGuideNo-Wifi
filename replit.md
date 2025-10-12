# GPS Audio Guide - Multi-City Travel Companion

A React-based GPS audio guide application for exploring world cities with automatic audio narration, turn-by-turn navigation, multi-language support, and progress tracking.

## Overview

This application provides an interactive map experience for tourists visiting major cities worldwide. It automatically plays audio narrations when users get within range of famous landmarks, offers route navigation, displays photo galleries, and tracks visited landmarks with persistent progress visualization.

## Features

### Core Features
- **Interactive Map**: Full-screen map using React-Leaflet with OpenStreetMap tiles
- **GPS Tracking**: Real-time location tracking with visual user position indicator
- **Auto Audio Narration**: Speaks landmark information automatically when within radius (uses Web Speech API)
- **TTS Speed Control**: Adjustable speech rate (0.5x-2x) with localStorage persistence
- **Turn-by-Turn Navigation**: Route planning from current location to any landmark using Leaflet Routing Machine
- **Audio Controls**: Toggle audio narration on/off, test audio playback, adjust speech speed
- **Route Management**: Clear active routes with a single click

### Multi-City Support
- City selector with Rome, Paris, and London
- City-specific landmarks and information
- Automatic map centering on selected city
- Dynamic landmark filtering by city

### Multi-Language Support
- Language selector for English, Italian, and Korean
- Translated landmark names, descriptions, and audio narration
- Language-specific audio playback using Web Speech API
- Seamless language switching

### Photo Galleries & Details
- Rich landmark information with extended historical details
- Photo gallery with 2-3 photos per landmark
- Full-screen photo viewer with navigation
- Architect, year built, and category information
- Click landmark card or Info button to view detailed information
- Detailed modal shows full description, historical info, and photos

### Visited Landmarks Tracking
- PostgreSQL database persistence
- Session-based progress tracking
- Progress statistics with percentage and visual bar
- Automatic landmark marking when within radius
- Duplicate prevention with unique constraints
- Progress persists across page refreshes

### Progressive Web App (PWA) Features
- **Offline Mode**: Full app functionality without internet connection
- **Service Worker**: Pre-caches all city landmarks and static assets on install
- **Install to Home Screen**: Add app to mobile home screen like a native app
- **Network Status Indicators**: Visual feedback for online/offline status
- **Cached Map Tiles**: OpenStreetMap tiles cached for offline viewing
- **Offline-First API**: API responses cached with fallback to embedded data

## Technology Stack

### Frontend
- React 18 with TypeScript
- React-Leaflet 4.2.1 for map integration
- Leaflet Routing Machine for navigation
- TanStack React Query v5 for data fetching
- Tailwind CSS with Shadcn UI components
- Web Speech API for audio narration
- Wouter for routing
- LocalStorage for session management

### Backend
- Express.js server
- PostgreSQL with Neon serverless
- Drizzle ORM for database operations
- In-memory storage for landmarks/cities (hybrid approach)
- RESTful API endpoints
- Zod for request validation

### Database
- PostgreSQL (Neon-backed)
- Drizzle ORM with TypeScript
- Tables: `visited_landmarks`
- Unique constraint on (session_id, landmark_id) for duplicate prevention

## Project Structure

```
client/
├── public/
│   ├── service-worker.js         # PWA service worker for offline mode
│   └── manifest.json             # PWA manifest for install-to-home
├── src/
│   ├── components/
│   │   ├── MapView.tsx           # Main map with markers and routing
│   │   ├── InfoPanel.tsx          # Control panel with GPS status
│   │   ├── LandmarkList.tsx       # Landmark browsing with details
│   │   ├── LandmarkDetails.tsx    # Detailed landmark modal
│   │   ├── PhotoGallery.tsx       # Photo grid and viewer
│   │   ├── CitySelector.tsx       # City selection dropdown
│   │   ├── LanguageSelector.tsx   # Language selection dropdown
│   │   ├── ProgressStats.tsx      # Visit progress visualization
│   │   ├── OfflineIndicator.tsx   # Network status indicator
│   │   └── InstallPrompt.tsx      # PWA install prompt
│   ├── hooks/
│   │   ├── useGeoLocation.ts      # GPS tracking hook
│   │   ├── useVisitedLandmarks.ts # Visited landmarks management
│   │   ├── useServiceWorker.ts    # Service worker registration
│   │   └── useOnlineStatus.ts     # Online/offline detection
│   ├── lib/
│   │   ├── audioService.ts        # Web Speech API wrapper
│   │   ├── geoUtils.ts           # Distance calculations
│   │   ├── translations.ts        # Translation utilities
│   │   └── sessionUtils.ts        # Session ID management
│   └── pages/
│       └── Home.tsx              # Main application page
server/
├── db.ts                         # Database connection (Drizzle + Neon)
├── routes.ts                     # API route definitions
└── storage.ts                    # Hybrid storage (DB + in-memory)
shared/
└── schema.ts                     # TypeScript types, Zod schemas, Drizzle tables
```

## API Endpoints

### Cities
- `GET /api/cities` - Returns all cities
- `GET /api/cities/:id` - Returns a specific city by ID

### Landmarks
- `GET /api/landmarks?cityId={cityId}` - Returns landmarks (filtered by city)
- `GET /api/landmarks/:id` - Returns a specific landmark by ID

### Visited Landmarks (Database)
- `POST /api/visited` - Mark landmark as visited (with deduplication)
- `GET /api/visited?sessionId={id}` - Get all visited landmarks for session
- `GET /api/visited/count?sessionId={id}` - Get visited count for session
- `GET /api/visited/:landmarkId?sessionId={id}` - Check if landmark is visited

## Cities & Landmarks

### Rome (5 landmarks)
1. **Colosseum** - 70m radius, 3 photos
2. **Roman Forum** - 60m radius, 2 photos
3. **Trevi Fountain** - 50m radius, 2 photos
4. **Pantheon** - 50m radius, 2 photos
5. **Spanish Steps** - 50m radius, 2 photos

### Paris (3 landmarks)
1. **Eiffel Tower** - 70m radius
2. **Louvre Museum** - 60m radius
3. **Notre-Dame Cathedral** - 50m radius
4. **Arc de Triomphe** - 50m radius

### London (4 landmarks)
1. **Big Ben** - 50m radius
2. **Tower Bridge** - 60m radius
3. **Buckingham Palace** - 70m radius
4. **London Eye** - 50m radius

## Key Features Implementation

### GPS Location Tracking
- Browser Geolocation API with `watchPosition`
- High accuracy mode for precise tracking
- Auto map centering on user position
- Fallback to city center when GPS unavailable

### Audio Narration System
- Auto-triggers when within landmark radius
- Tracks spoken landmarks (no repetition)
- Language-aware audio playback
- Visual speaking indicator
- Reset on audio toggle/language change

### Route Navigation
- Leaflet Routing Machine integration
- Custom terracotta route styling (hsl(14, 85%, 55%))
- Fallback start point when GPS unavailable
- Clear route functionality

### Visited Landmarks Tracking
- Session ID generated and stored in localStorage
- Automatic marking when within landmark radius
- PostgreSQL persistence with unique constraint
- ON CONFLICT DO NOTHING for duplicate prevention
- Real-time progress statistics
- Visual progress bar (0-100%)

### Design System
- Primary: Terracotta/Roman red-orange (hsl(14, 85%, 55%))
- Success/GPS: Green (hsl(142, 71%, 45%))
- Glass-morphic floating panels with backdrop blur
- Custom landmark markers with terracotta background
- User location marker with pulse animation
- Responsive mobile-first design
- Playfair Display (serif) + Inter (sans-serif) fonts

## Development

### Running the Application
```bash
npm run dev
```

Starts Express server (backend) and Vite dev server (frontend) on port 5000.

### Database Management
```bash
npm run db:push        # Push schema changes to database
npm run db:push --force # Force push (when conflicts occur)
```

## Recent Changes (2025-10-12)

### Latest Update: Historical Info Translation & Language-Specific TTS Voices (Today)
- **historicalInfo Translation**: Extended getTranslatedContent() to support 'historicalInfo' field
- **Complete Localization**: Historical information now translates in LandmarkPanel and LandmarkDetails
- **Language-Specific TTS Voices**: 
  - audioService now explicitly selects voices by language
  - Prefers local voices over remote for better quality
  - Supports exact language match (ko-KR) with base language fallback (ko)
  - Voices loaded dynamically with onvoiceschanged event handler
- **Multi-language Support**: Verified translation and TTS for EN, KO, JA languages
- **E2E Tested**: Confirmed historical info displays in correct language, screenshots verified

### Previous Update: TTS Speed Control
- **Adjustable Speech Rate**: Slider control in AppSidebar (0.5x-2x, 0.1 step)
- **Real-time Updates**: Speech rate display updates as slider moves
- **Persistent Settings**: Rate saved to localStorage ('tts-speed' key)
- **Applied Universally**: Rate applies to auto-narration and test audio
- **Multi-language Labels**: 'speechSpeed' translation added (EN, KO)
- **E2E Tested**: Verified slider interaction, localStorage persistence, audio playback

### Previous Completed Features
1. **Multi-City Support**
   - Added Rome, Paris, London with city selector
   - City-based landmark filtering
   - Dynamic map centering

2. **Multi-Language Support**
   - English, Italian, Korean translations
   - Language-specific audio narration
   - Translated landmark content

3. **Photo Galleries**
   - Extended landmark schema with photos, history, architect
   - Photo grid and full-screen viewer
   - Detailed landmark modal with rich information

4. **Visited Landmarks Tracking**
   - PostgreSQL database with visited_landmarks table
   - Session-based progress tracking
   - Duplicate prevention with unique constraints
   - Progress visualization with stats and bar
   - Persistent across page refreshes

5. **Progressive Web App (PWA)**
   - PWA manifest configuration with app metadata and icons
   - Service worker with offline-first caching strategy (v2)
   - Pre-caching of all city landmarks during SW installation
   - Network status indicators for online/offline state
   - Install-to-home-screen prompt with dismissible UI
   - Cached map tiles and API responses for offline use
   - Full offline functionality for all cities

## Testing

End-to-end test coverage includes:
- Map loading and landmark display
- Audio toggle and language switching
- Route navigation and clearing
- Landmark interaction and details
- GPS status indicators
- Photo gallery and viewer
- Visited landmarks tracking
- Duplicate prevention
- Progress statistics
- Offline mode functionality
- Service worker caching
- Network status indicators
- PWA installation flow

## Future Enhancements

Potential features:
- User accounts and authentication
- Custom route creation and sharing
- Push notifications for nearby landmarks
- Social sharing of visited landmarks
- Augmented reality landmark views
- More cities and landmarks
- Audio tour packages
- Enhanced offline map tile pre-caching
- Background sync for visited landmarks
