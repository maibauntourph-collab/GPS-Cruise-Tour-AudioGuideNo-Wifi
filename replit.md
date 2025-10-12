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
- **Design System:** Uses a primary terracotta/Roman red-orange (hsl(14, 85%, 55%)) color scheme, with green for success/GPS indicators (hsl(142, 71%, 45%)) and blue for activities (hsl(195, 85%, 50%)).
- **Visuals:** Features glass-morphic floating panels with backdrop blur, custom color-coded landmark and activity markers, and a pulse animation for the user's location.
- **Typography:** Employs Playfair Display (serif) and Inter (sans-serif) fonts.
- **Responsiveness:** Designed with a mobile-first approach.
- **PWA Integration:** Includes a PWA manifest for install-to-home-screen functionality and a service worker for offline capabilities, network status indicators, and an install prompt.

**Technical Implementations & Feature Specifications:**
- **Interactive Map & Navigation:** Implemented using React-Leaflet and Leaflet Routing Machine for map display, GPS tracking, automatic map centering, and turn-by-turn directions with custom terracotta route styling.
- **Audio Narration:** Utilizes the Web Speech API for auto-triggered, language-aware audio narration within landmark radii. It supports adjustable speech rates (0.5x-2x) with persistence via LocalStorage and handles audio playback without repetition.
- **Multi-City & Multi-Language Support:** Offers city and language selectors (English, Italian, Korean) to dynamically load city-specific landmarks and activities, provide translated content, and use language-specific TTS voices.
- **Landmark & Activity Details:** Each point of interest includes rich information, a photo gallery with a full-screen viewer, historical details, and an embedded map for precise location, accessible via a detailed modal.
- **Visited Landmarks Tracking:** Progress is tracked per session, stored in a PostgreSQL database (via Drizzle ORM), and visualized with a progress bar and statistics.
- **Offline Functionality:** A service worker pre-caches static assets, all city landmarks, activities, and map tiles, allowing full application functionality offline with cached API responses.
- **Content Filtering:** Independent filter buttons allow toggling the visibility of Landmarks (terracotta) and Activities (blue) on both the map and in the list, with support for various activity categories (cruises, food tours, etc.).
- **Tour Route Planning:** Users can create custom tour routes by clicking markers to add/remove landmarks and activities. The map visualizes the tour with a dashed terracotta polyline connecting stops in sequence. Tour progress is displayed in the header with a stop counter, and a Clear Tour button allows resetting the route. Tour stops are managed locally in component state.
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