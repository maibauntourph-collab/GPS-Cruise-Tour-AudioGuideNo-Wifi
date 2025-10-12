# GPS Audio Guide - Multi-City Travel Companion

## Overview

This project is a React-based GPS audio guide application designed to enhance urban exploration for tourists. It provides an interactive map experience with automatic audio narration for landmarks, turn-by-turn navigation, multi-language support, and persistent progress tracking. The application aims to offer a seamless, immersive, and informative travel companion experience across various global cities, with a strong focus on offline capabilities through PWA features.

## User Preferences

I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
I prefer simple language.

## System Architecture

The application is built with a React frontend and an Express.js backend, communicating via RESTful API endpoints.

**UI/UX Decisions:**
- **Design System:** Uses a primary terracotta/Roman red-orange (hsl(14, 85%, 55%)) color scheme, with green for success/GPS indicators (hsl(142, 71%, 45%)).
- **Visuals:** Features glass-morphic floating panels with backdrop blur, custom landmark markers, and a pulse animation for the user's location.
- **Typography:** Employs Playfair Display (serif) and Inter (sans-serif) fonts.
- **Responsiveness:** Designed with a mobile-first approach.
- **PWA Integration:** Includes a PWA manifest for install-to-home-screen functionality and a service worker for offline capabilities, network status indicators, and an install prompt.

**Technical Implementations & Feature Specifications:**
- **Interactive Map & Navigation:** Implemented using React-Leaflet and Leaflet Routing Machine for map display, GPS tracking, automatic map centering, and turn-by-turn directions. Custom terracotta route styling is applied.
- **Audio Narration:** Utilizes the Web Speech API for auto-triggered, language-aware audio narration within landmark radii. It supports adjustable speech rates (0.5x-2x) with persistence via LocalStorage and handles audio playback without repetition.
- **Multi-City & Multi-Language Support:** Offers city and language selectors (English, Italian, Korean) to dynamically load city-specific landmarks, provide translated content, and use language-specific TTS voices.
- **Landmark Details:** Each landmark includes rich information, a photo gallery with a full-screen viewer, and historical details, accessible via a detailed modal.
- **Visited Landmarks Tracking:** Progress is tracked per session, stored in a PostgreSQL database (via Drizzle ORM), and visualized with a progress bar and statistics. Automatic marking within radius prevents duplicates.
- **Offline Functionality:** A service worker pre-caches static assets, all city landmarks, and map tiles, allowing full application functionality offline with cached API responses.
- **API Endpoints:**
    - `GET /api/cities`, `GET /api/cities/:id`
    - `GET /api/landmarks?cityId={cityId}`, `GET /api/landmarks/:id`
    - `POST /api/visited`, `GET /api/visited?sessionId={id}`, `GET /api/visited/count?sessionId={id}`, `GET /api/visited/:landmarkId?sessionId={id}`

**System Design Choices:**
- **Frontend Framework:** React 18 with TypeScript.
- **Data Fetching:** TanStack React Query v5.
- **Styling:** Tailwind CSS with Shadcn UI components.
- **Routing:** Wouter for client-side routing.
- **Backend Framework:** Express.js.
- **Database:** PostgreSQL (Neon serverless) with Drizzle ORM for type-safe database interactions.
- **Data Storage:** A hybrid approach using both PostgreSQL for persistent data (e.g., visited landmarks) and in-memory storage for landmark and city data.
- **Validation:** Zod for request validation on the backend.
- **Session Management:** LocalStorage is used for storing session IDs and user preferences like TTS speed.

## External Dependencies

- **Mapping:**
    - React-Leaflet (for React integration with Leaflet)
    - Leaflet (interactive maps)
    - OpenStreetMap (map tiles)
    - Leaflet Routing Machine (turn-by-turn navigation)
    - Google Maps (external navigation option)
- **Database:**
    - PostgreSQL (via Neon serverless)
    - Drizzle ORM (TypeScript ORM for PostgreSQL)
- **Frontend Libraries:**
    - React (UI library)
    - TypeScript (language)
    - TanStack React Query (data fetching)
    - Tailwind CSS (utility-first CSS framework)
    - Shadcn UI (UI component library)
    - Wouter (small routing library)
- **Backend Libraries:**
    - Express.js (web framework)
    - Zod (schema validation)
- **Browser APIs:**
    - Web Speech API (text-to-speech)
    - Geolocation API (GPS tracking)
    - Service Worker API (PWA offline capabilities)
    - LocalStorage API (client-side data persistence)

## Cities & Landmarks

### Europe

**Rome, Italy (5 landmarks)**
1. **Colosseum** - 70m radius, 7 photos
2. **Roman Forum** - 60m radius
3. **Trevi Fountain** - 50m radius
4. **Pantheon** - 50m radius
5. **Spanish Steps** - 50m radius

**Paris, France (4 landmarks)**
1. **Eiffel Tower** - 70m radius
2. **Louvre Museum** - 60m radius
3. **Notre-Dame Cathedral** - 50m radius
4. **Arc de Triomphe** - 50m radius

**London, United Kingdom (4 landmarks)**
1. **Big Ben** - 50m radius
2. **Tower Bridge** - 60m radius
3. **Buckingham Palace** - 70m radius
4. **London Eye** - 50m radius

### Southeast Asia

**Cebu, Philippines (4 landmarks)**
1. **Magellan's Cross** - Historic wooden cross from 1521, 50m radius
2. **Basilica del Santo Niño** - Oldest Roman Catholic church in Philippines (1565), 60m radius
3. **Fort San Pedro** - Oldest triangular Spanish colonial fortress, 60m radius
4. **TOPS Lookout** - Mountain viewpoint with 360° views, 70m radius

**Singapore (4 landmarks)**
1. **Marina Bay Sands** - Iconic resort with rooftop infinity pool, 70m radius
2. **Merlion Park** - Singapore's national icon statue, 50m radius
3. **Gardens by the Bay** - Futuristic garden with Supertree Grove, 100m radius
4. **Singapore Flyer** - Giant observation wheel (165m tall), 60m radius

**Penang, Malaysia (4 landmarks)**
1. **Kek Lok Si Temple** - Largest Buddhist temple in Southeast Asia, 70m radius
2. **Fort Cornwallis** - Largest standing British fort in Malaysia (1786), 60m radius
3. **Khoo Kongsi** - Ornate Chinese clan house and UNESCO heritage site, 50m radius
4. **Penang Hill** - Hill station with funicular railway (821m elevation), 80m radius

**Kuala Lumpur, Malaysia (2 landmarks)**
1. **Petronas Twin Towers** - World's tallest twin skyscrapers (452m), 80m radius
2. **Batu Caves** - Sacred Hindu temple complex in limestone caves, 70m radius

**Phuket, Thailand (4 landmarks)**
1. **Big Buddha Phuket** - 45m white marble Buddha statue on hilltop, 70m radius
2. **Patong Beach** - Most famous beach and entertainment hub (3km stretch), 100m radius
3. **Wat Chalong** - Phuket's largest and most important Buddhist temple, 60m radius
4. **Karon Viewpoint** - Panoramic viewpoint overlooking 3 bays, 50m radius

## Recent Changes (2025-10-12)

### Latest Update: Click Marker to Update Main Map (Today)
- **Interactive Map Synchronization**: Click the marker in landmark panel map to center main map on that location
- **User Flow**:
  - Open landmark panel → see small map with location
  - Click the marker → main map smoothly centers and zooms to landmark
  - Popup hint: "Click to view on main map" (translated in all languages)
- **Technical Implementation**:
  - Zoom level 17 for detailed landmark view
  - 0.5 second smooth animation transition
  - Focus state clears after 1 second
  - FocusUpdater component in MapView handles map centering
- **E2E Tested**: Verified marker click updates main map, smooth animation, no errors

### Previous Update: Added Map View to Landmark Details Panel
- **Map Location Display**: Added interactive map below Photos section in landmark panel
- **Implementation**: 200px height map showing exact landmark location with custom marker
- **Features**:
  - OpenStreetMap tiles for detailed street view
  - Custom terracotta marker matching app color scheme
  - Popup showing landmark name on marker click
  - Zoom level 16 for detailed view
  - Auto-updates when switching between landmarks
- **Technical Fix**: Used `key={landmark.id}` and explicit height to resolve Leaflet sizing conflicts
- **E2E Tested**: Verified map displays correctly, updates on landmark change, proper marker positioning

### Previous Update: Added 5 New Cities with 18 Landmarks
- **New Southeast Asian Destinations**: Added Cebu (Philippines), Singapore, Penang (Malaysia), Kuala Lumpur (Malaysia), and Phuket (Thailand)
- **18 New Landmarks**: Each city features 2-4 major tourist attractions with complete information
- **Complete Information**: All landmarks include detailed descriptions, GPS coordinates, photos, historical context
- **Multi-language Support**: English and Korean translations for all new content
- **Diverse Categories**: Historical sites, modern architecture, beaches, viewpoints, temples, cultural heritage
- **Notable Additions**:
  - Petronas Twin Towers (world's tallest twin skyscrapers, 452m)
  - Marina Bay Sands (iconic Singapore resort with infinity pool)
  - Big Buddha Phuket (45m white marble statue)
  - Magellan's Cross (historic 1521 landmark)
  - Kek Lok Si Temple (largest Buddhist temple in SE Asia)
- **E2E Tested**: Verified all cities appear in selector, landmarks load correctly, details display properly

### Previous Update: Critical Runtime Error Fix
- **Fixed "Cannot read properties of null (reading 'useRef')" Error**: Removed Next.js-specific directives
- **Root Cause**: UI components had "use client" directives incompatible with Vite/React
- **Solution**: Removed "use client" from 15 UI component files (dialog, tooltip, sidebar, form, etc.)
- **Impact**: Restored full app functionality - all components now work correctly
- **E2E Tested**: Verified clean console, photo gallery works, no runtime errors

### Previous Update: Photo Gallery Accessibility Fix
- **Fixed Radix UI Accessibility Errors**: Resolved DialogTitle and DialogDescription warnings
- **Implementation**: Added required accessibility components with screen-reader-only visibility
- **Always-Present Text**: DialogTitle and DialogDescription now always render text (never false/null)
- **Fallback Labels**: Shows specific photo info when selected, generic labels otherwise
- **Full Compliance**: Meets Radix UI accessibility requirements for screen readers
- **E2E Tested**: Verified no console errors/warnings, photo navigation works correctly