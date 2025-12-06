# GPS Audio Guide - Multi-City Travel Companion

## Overview

This project is a React-based GPS audio guide application designed to enhance urban exploration for tourists. It provides an interactive map with automatic audio narration for landmarks and activities, turn-by-turn navigation, multi-language support, and persistent progress tracking. The application aims to offer a seamless, immersive, and informative travel companion experience across various global cities, with a strong focus on offline capabilities through PWA features. The business vision is to become a leading global travel companion.

## User Preferences

I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
I prefer simple language.

## System Architecture

The application is built with a React frontend and an Express.js backend, communicating via RESTful API endpoints.

**UI/UX Decisions:**
- **Design System:** Uses category-specific color coding for Landmarks, Activities, Restaurants, Gift Shops, and Cruise Port.
- **Visuals:** Features glass-morphic floating panels, custom color-coded markers, and a pulse animation for the user's location.
- **Typography:** Employs Playfair Display (serif) and Inter (sans-serif) fonts.
- **Responsiveness:** Designed with a mobile-first approach.
- **PWA Integration:** Includes a PWA manifest and a service worker for offline capabilities, network status indicators, and an install prompt.

**Technical Implementations & Feature Specifications:**
- **Interactive Map & Navigation:** Implemented using React-Leaflet and Leaflet Routing Machine for map display, GPS tracking, and turn-by-turn directions.
- **Audio Narration:** Utilizes the Web Speech API for auto-triggered, language-aware audio narration within landmark radii, with adjustable speech rates and persistence.
- **Per-Language TTS Voice Selection:** Allows users to select preferred TTS voices from a card-based UI, saving choices per language for automatic use.
- **Multi-City & Multi-Language Support:** Offers city and language selectors to dynamically load city-specific, translated content across 10 supported languages.
- **Landmark & Activity Details:** Provides rich information, photo galleries, historical details, and embedded maps for points of interest via a detailed modal.
- **Visited Landmarks Tracking:** Progress is tracked per session, stored in a PostgreSQL database (via Drizzle ORM), and visualized with a progress bar.
- **Offline Functionality:** Comprehensive offline support via a Service Worker for caching static assets, city data, and map tiles, IndexedDB for client-side data storage, and an Offline Package API for efficient data synchronization.
- **Content Filtering:** Independent filter buttons allow toggling visibility of Landmarks, Activities, Restaurants, and Gift Shops on the map and in lists.
- **Tour Route Planning:** Users can create custom tour routes by adding markers, displaying total distance and estimated travel time, visualized with a dashed polyline.
- **Ticket & Tour Booking:** Integrated booking platform links (GetYourGuide, Viator, Klook) are dynamically generated with security features.
- **Messenger-Style Floating Cards:** Major UI cards are draggable, resizable, and minimizable, supporting touch events and saving preferences.
- **Cruise Port Transportation Options:** For cities with cruise Ports, detailed transportation information with deep links for booking and rideshare apps is provided.
- **AI Tour Recommendations:** Integrates OpenAI gpt-4o-mini for intelligent, category-based tour itinerary suggestions based on geographical proximity and variety.
- **Tour Leader Mode:** Dedicated interface for managing group tours with schedule and member CRUD, status dashboard, Excel import/export, and progress report sharing via Web Share API.
- **Landmark Creation (Guide & Tour Leader):** Both Guide (/guide) and Tour Leader (/tour-leader) views have the ability to add new landmarks, activities, restaurants, and gift shops. Uses shared LandmarkFormDialog component with Korean UI. Data persists to PostgreSQL via POST /api/admin/landmarks endpoint. MemStorage.getLandmarks() merges hardcoded data with DB records for real-time visibility.

**API Endpoints:**
- `/api/cities`, `/api/landmarks`, `/api/visited`
- `/api/offline-package`, `/api/ai/recommend-tour`
- `/api/tour-leader/schedules`, `/api/tour-leader/members` (with import/export)

**System Design Choices:**
- **Frontend Framework:** React 18 with TypeScript, TanStack React Query, Tailwind CSS with Shadcn UI, and Wouter for routing.
- **Backend Framework:** Express.js with Zod for validation.
- **Database:** PostgreSQL (Neon serverless) with Drizzle ORM.
- **Data Storage:** Hybrid approach using PostgreSQL for persistent data and in-memory storage for dynamic content.
- **Session Management:** LocalStorage for session IDs and user preferences.

## External Dependencies

- **Mapping:** React-Leaflet, Leaflet, OpenStreetMap, Leaflet Routing Machine, Google Maps (external navigation).
- **Database:** PostgreSQL (Neon serverless), Drizzle ORM.
- **Frontend Libraries:** React, TypeScript, TanStack React Query, Tailwind CSS, Shadcn UI, Wouter.
- **Backend Libraries:** Express.js, Zod.
- **AI:** OpenAI (gpt-4o-mini model).
- **Browser APIs:** Web Speech API, Geolocation API, Service Worker API, LocalStorage API, IndexedDB API.
- **Booking Platforms:** GetYourGuide, Viator, Klook.
- **Rideshare Apps:** Uber, Bolt.