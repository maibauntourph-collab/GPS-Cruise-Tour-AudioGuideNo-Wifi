# GPS Audio Guide - Multi-City Travel Companion

## Overview

This project is a React-based GPS audio guide application designed to enhance urban exploration for tourists. It provides an interactive map experience with automatic audio narration for landmarks and activities, turn-by-turn navigation, multi-language support, and persistent progress tracking. The application aims to offer a seamless, immersive, and informative travel companion experience across various global cities, with a strong focus on offline capabilities through PWA features and a business vision to become a leading global travel companion.

## User Preferences

I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
I prefer simple language.

## System Architecture

The application is built with a React frontend and an Express.js backend, communicating via RESTful API endpoints.

**UI/UX Decisions:**
- **Design System:** Uses category-specific color coding: Landmarks (terracotta hsl(14, 85%, 55%)), Activities (blue hsl(210, 85%, 55%)), Restaurants (orange hsl(25, 95%, 55%)), Gift Shops (gold hsl(45, 90%, 55%)), and Cruise Port (dolphin gray hsl(200, 15%, 55%)). All colors are consistently applied across markers, buttons, and UI elements.
- **Visuals:** Features glass-morphic floating panels with backdrop blur, custom color-coded landmark and activity markers, and a pulse animation for the user's location.
- **Typography:** Employs Playfair Display (serif) and Inter (sans-serif) fonts.
- **Responsiveness:** Designed with a mobile-first approach.
- **PWA Integration:** Includes a PWA manifest for install-to-home-screen functionality and a service worker for offline capabilities, network status indicators, and an install prompt.

**Technical Implementations & Feature Specifications:**
- **Interactive Map & Navigation:** Implemented using React-Leaflet and Leaflet Routing Machine for map display, GPS tracking, automatic map centering, and turn-by-turn directions with custom terracotta route styling.
- **Audio Narration:** Utilizes the Web Speech API for auto-triggered, language-aware audio narration within landmark radii. It supports adjustable speech rates (0.5x-2x) with persistence via LocalStorage and handles audio playback without repetition.
- **Multi-City & Multi-Language Support:** Offers city and language selectors with 10 supported languages (English, Korean, Spanish, French, German, Italian, Chinese, Japanese, Portuguese, Russian) to dynamically load city-specific landmarks and activities, provide translated content including detailedDescription fields, and use language-specific TTS voices. All activities and UI elements include complete translations.
- **Landmark & Activity Details:** Each point of interest includes rich information, a photo gallery with a full-screen viewer, historical details, and an embedded map for precise location, accessible via a detailed modal.
- **Visited Landmarks Tracking:** Progress is tracked per session, stored in a PostgreSQL database (via Drizzle ORM), and visualized with a progress bar and statistics.
- **Offline Functionality:** Comprehensive offline support with multiple layers:
  - Service Worker: Pre-caches static assets, city landmarks, activities, and map tiles
  - IndexedDB Storage: Client-side database for offline city data with visited landmarks queue
  - Offline Package API: `/api/offline-package` and `/api/offline-package/:cityId` endpoints with ETag-based versioning for efficient delta sync
  - Automatic Data Source Switching: `useOfflineMode` hook detects network status and automatically falls back to IndexedDB when offline
  - Queue-based Sync: Visited landmarks are queued locally when offline and synced when connection is restored
- **Content Filtering:** Independent filter buttons allow toggling the visibility of Landmarks (terracotta), Activities (blue), Restaurants (orange), and Gift Shops (gold) on both the map and in the list. Filter state is synchronized between the header and unified floating card for consistent user experience. Each category uses distinct colors for easy identification.
- **Tour Route Planning:** Users can create custom tour routes by clicking markers or using the "Add to Tour" button in the landmark detail panel. The system uses Leaflet Routing Machine to calculate actual road routes between tour stops, displaying total distance (km) and estimated travel time (minutes) in the header badge (e.g., "4.0km • 11min"). The map visualizes the tour with a terracotta dashed polyline following real roads. When adding tour stops, the map maintains the user's current zoom level and position (does not auto-fit the route), allowing users to stay focused on their area of interest while the route is calculated and displayed. Tour route info automatically clears when stops are removed or turn-by-turn navigation is activated. A Clear Tour button allows resetting the entire route. The routing system uses defensive cleanup to prevent errors when reconfiguring routes by clearing waypoints before removing controls.
- **Ticket & Tour Booking:** Integrated booking platform links (GetYourGuide, Viator, Klook) in the landmark detail panel for both landmarks and activities. Search URLs are dynamically generated using translated landmark names. All window.open calls include 'noopener,noreferrer' security features to prevent reverse tabnabbing attacks. UI translations for booking labels are available in all supported languages (en, ko, it, es, de, zh, ja).
- **Messenger-Style Floating Cards:** All major UI cards feature draggable floating functionality with three main tabs: Tour (renamed from Landmark), Cruise Port, and List. The Tour tab is always active and displays landmark details when selected, or shows filter buttons (Landmarks/Activities/Restaurants) with a helpful message when no landmark is selected. The Cruise Port tab uses nested sub-tabs (Info, Transport, Tips) for organized navigation of port information. Users can drag cards by their headers to reposition them anywhere on screen, minimize them to floating icons, and restore by clicking the icons. Cards use position: fixed for viewport-based positioning, automatically clamp to viewport bounds during drag operations (preventing overflow), and save card dimensions before minimizing to ensure proper restoration positioning. Event handlers prevent drag conflicts with map interactions and embedded galleries. Each minimized card shows a distinctive floating icon with pulse animation (Ship for cruise ports, MapPin for landmarks, List for landmark list). Touch events are fully supported with preventDefault() to avoid ghost clicks on mobile devices.
- **Cruise Port Transportation Options:** For cities with cruise ports, detailed transportation information is displayed including trains, shuttles, taxis, and rideshare services. Each transport option shows departure/arrival locations, duration, frequency, pricing, and helpful tips. Integrated deep links for Uber and Bolt rideshare apps enable one-tap booking from port to city center. Direct booking links for train tickets (e.g., Trenitalia) and shore excursion shuttles (e.g., GetYourGuide) are provided. All transport information includes translations in supported languages (en, ko, it) with complete details about station locations, operating schedules, and passenger tips.
- **AI Tour Recommendations:** Integrated OpenAI gpt-4o-mini model for intelligent tour itinerary suggestions. Features category-based filtering (All/Landmarks/Restaurants/Activities tabs), multilingual prompts and responses matching the selected language. The AI analyzes geographical proximity, category variety, and historical significance to suggest optimal tour orders. Results display as a checklist with individual or bulk add-to-tour functionality. Error handling includes user-friendly messages for quota limits and authentication issues.
- **API Endpoints:**
    - `GET /api/cities`, `GET /api/cities/:id`
    - `GET /api/landmarks?cityId={cityId}`, `GET /api/landmarks/:id`
    - `POST /api/visited`, `GET /api/visited?sessionId={id}`, `GET /api/visited/count?sessionId={id}`, `GET /api/visited/:landmarkId?sessionId={id}`
    - `GET /api/offline-package` (list all cities for offline download), `GET /api/offline-package/:cityId` (download city package with ETag support)
    - `POST /api/ai/recommend-tour` (AI tour recommendations with filterType: all/landmarks/restaurants/activities)

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
    - IndexedDB API (offline data storage)

## Offline Functionality Notes

**Important: Service Worker Environment Configuration**
- Service Worker is **ONLY enabled** in production (published apps on `.replit.app` domain)
- Service Worker is **DISABLED** in development (`localhost`, `.replit.dev` preview) to avoid HMR conflicts
- To test offline functionality, you must **publish the app** first

**How Offline Mode Works:**
1. **Service Worker Registration** (`useServiceWorker.ts`): Automatically registers in production, caches static assets and API data
2. **IndexedDB Storage** (`offlineStorage.ts`): Stores city/landmark data locally for offline access
3. **Offline Mode Hook** (`useOfflineMode.ts`): Detects network status and falls back to IndexedDB when offline
4. **Offline Package Download**: Users must download city data while online to use offline

**Testing Offline Mode:**
1. Publish the app to `.replit.app` domain
2. Open the published app and download offline packages for desired cities
3. Enable airplane mode or disable network
4. The app should continue working with cached data