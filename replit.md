# Rome GPS Audio Guide

A React-based GPS audio guide application for exploring Rome's iconic landmarks with automatic audio narration and turn-by-turn navigation.

## Overview

This application provides an interactive map experience for tourists visiting Rome. It automatically plays audio narrations when users get within 50 meters of famous landmarks and offers route navigation from the current location to any landmark.

## Features

- **Interactive Map**: Full-screen map using React-Leaflet with OpenStreetMap tiles
- **GPS Tracking**: Real-time location tracking with visual user position indicator
- **Auto Audio Narration**: Speaks landmark information automatically when within 50m (uses Web Speech API)
- **Turn-by-Turn Navigation**: Route planning from current location to any landmark using Leaflet Routing Machine
- **Landmark Information**: Detailed cards for each landmark with descriptions and categories
- **Audio Controls**: Toggle audio narration on/off
- **Route Management**: Clear active routes with a single click

## Technology Stack

### Frontend
- React 18 with TypeScript
- React-Leaflet 4.2.1 for map integration
- Leaflet Routing Machine for navigation
- TanStack React Query for data fetching
- Tailwind CSS for styling
- Web Speech API for audio narration
- Wouter for routing

### Backend
- Express.js server
- In-memory storage for landmark data
- RESTful API endpoints

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── MapView.tsx          # Main map component with markers and routing
│   │   ├── InfoPanel.tsx         # Control panel with GPS status and controls
│   │   └── LandmarkList.tsx      # Landmark browsing panel
│   ├── hooks/
│   │   └── useGeoLocation.ts     # Custom hook for GPS tracking
│   ├── lib/
│   │   ├── audioService.ts       # Web Speech API wrapper
│   │   └── geoUtils.ts          # Distance calculation utilities
│   ├── pages/
│   │   └── Home.tsx             # Main application page
│   └── styles/
│       └── leaflet-custom.css   # Custom Leaflet styling
server/
├── routes.ts                     # API route definitions
└── storage.ts                    # Data storage layer
shared/
└── schema.ts                     # TypeScript types and Zod schemas
```

## API Endpoints

- `GET /api/landmarks` - Returns all Rome landmarks
- `GET /api/landmarks/:id` - Returns a specific landmark by ID

## Rome Landmarks

The application includes 5 iconic Rome landmarks:

1. **Colosseum** (41.8902, 12.4922) - 70m radius
2. **Roman Forum** (41.8925, 12.4853) - 60m radius
3. **Trevi Fountain** (41.9009, 12.4833) - 50m radius
4. **Pantheon** (41.8986, 12.4768) - 50m radius
5. **Spanish Steps** (41.9059, 12.4823) - 50m radius

## Key Features Implementation

### GPS Location Tracking
- Uses browser's Geolocation API with `watchPosition` for real-time updates
- High accuracy mode enabled for precise location tracking
- Map automatically centers on user location
- Falls back to Rome center (41.8902, 12.4922) if GPS unavailable

### Audio Narration System
- Automatically triggers when within landmark radius
- Tracks spoken landmarks to avoid repetition
- Toggle audio on/off functionality
- Visual indicator when audio is playing
- Reset capability when toggling audio

### Route Navigation
- Creates routes using Leaflet Routing Machine
- Custom orange/terracotta route styling (hsl(14, 85%, 55%))
- Uses Rome center as fallback start point when GPS unavailable
- Clear route functionality
- Visual route polylines on map

### Design System
- Primary color: Terracotta/Roman red-orange (hsl(14, 85%, 55%))
- Success/GPS color: Green (hsl(142, 71%, 45%))
- Custom marker icons with terracotta background
- User location marker with pulse animation
- Glass-morphic floating panels with backdrop blur
- Responsive design with mobile-first approach

## Development

The application runs on port 5000 with Vite for the frontend and Express for the backend.

### Running the Application
```bash
npm run dev
```

This starts both the Express server and Vite dev server.

## Recent Changes (2025-10-10)

- Converted original HTML/JavaScript GPS audio guide to React
- Implemented backend API with Express and in-memory storage
- Added React Query for data fetching
- Fixed map GPS tracking with MapUpdater component
- Added fallback position for routing when GPS unavailable
- Implemented comprehensive test coverage

## Testing

The application includes end-to-end tests covering:
- Map loading and landmark display
- Audio toggle functionality
- Route navigation and clearing
- Landmark interaction
- GPS status indicators

## Future Enhancements

Potential features for future development:
- Multiple city support with city selection
- Multi-language audio narration
- Landmark photo galleries
- Visited landmarks tracking
- Offline map caching
- User accounts and custom routes
- Database persistence (currently in-memory)
