import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Landmark, GpsPosition } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';

const ROME_CENTER: [number, number] = [41.8902, 12.4922];

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const createBlinkingIcon = (color: string) => {
  return L.divIcon({
    className: 'blinking-marker',
    html: `
      <div class="blinking-pin" style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pinBlink 1s ease-in-out infinite;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div class="pulse-ring" style="
        position: absolute;
        width: 48px;
        height: 48px;
        border: 2px solid ${color};
        border-radius: 50%;
        top: -8px;
        left: -8px;
        animation: pulse-ring 1s ease-out infinite;
      "></div>
      <style>
        @keyframes pinBlink {
          0%, 100% {
            opacity: 1;
            transform: rotate(-45deg) scale(1);
          }
          50% {
            opacity: 0.6;
            transform: rotate(-45deg) scale(1.1);
          }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      </style>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      background-color: hsl(142, 71%, 45%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 2px solid hsl(142, 71%, 45%);
        border-radius: 50%;
        opacity: 0.3;
        animation: pulse 2s ease-in-out infinite;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface RoutingMachineProps {
  start: [number, number] | null;
  end: [number, number] | null;
  onRouteFound?: (route: any) => void;
}

function RoutingMachine({ start, end, onRouteFound }: RoutingMachineProps) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  const safeRemoveControl = useCallback((control: L.Routing.Control) => {
    if (!control || !map) return;
    
    try {
      // Clear waypoints first to prevent routing errors
      try {
        control.setWaypoints([]);
      } catch (e) {
        console.debug('Waypoint clearing handled:', e);
      }
      
      // Remove the control from the map
      try {
        if ((map as any)._loaded && (control as any)._map) {
          map.removeControl(control);
        }
      } catch (e) {
        console.debug('Control removal handled:', e);
      }
    } catch (e) {
      console.debug('Routing control removal handled:', e);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    
    if (!start || !end) {
      if (routingControlRef.current) {
        safeRemoveControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      return;
    }

    if (routingControlRef.current) {
      safeRemoveControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    try {
      const control = L.Routing.control({
        waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [
            {
              color: 'hsl(14, 85%, 55%)',
              opacity: 0.8,
              weight: 6,
            },
          ],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        show: false,
        createMarker: () => null as any,
      } as any).addTo(map);

      if (onRouteFound) {
        control.on('routesfound', (e) => {
          onRouteFound(e.routes[0]);
        });
      }

      routingControlRef.current = control;
    } catch (e) {
      console.warn('Failed to create routing control:', e);
    }

    return () => {
      if (routingControlRef.current) {
        safeRemoveControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, start, end, onRouteFound, safeRemoveControl]);

  return null;
}

function MapUpdater({ position }: { position: GpsPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom(), {
        animate: true,
      });
    }
  }, [position, map]);

  return null;
}

interface MapViewProps {
  landmarks: Landmark[];
  userPosition: GpsPosition | null;
  onLandmarkRoute: (landmark: Landmark) => void;
  activeRoute: { start: [number, number]; end: [number, number] } | null;
  onRouteFound?: (route: any) => void;
  cityCenter?: [number, number];
  cityZoom?: number;
  selectedLanguage?: string;
  isCompact?: boolean;
  sidebarOpen?: boolean;
  focusLocation?: { lat: number; lng: number; zoom: number } | null;
  tourStops?: Landmark[];
  onAddToTour?: (landmark: Landmark) => void;
  onTourRouteFound?: (route: any) => void;
  onTourRouteClick?: () => void;
  isSelectingHotelOnMap?: boolean;
  isSelectingEndPointOnMap?: boolean;
  onHotelLocationSelected?: (lat: number, lng: number) => void;
  onEndPointLocationSelected?: (lat: number, lng: number) => void;
  startingPoint?: { lat: number; lng: number; type: string } | null;
  endPoint?: { lat: number; lng: number; type: string } | null;
  selectedLandmark?: Landmark | null;
  onLandmarkSelect?: (landmark: Landmark) => void;
  onShowList?: () => void;
  showTourOnly?: boolean;
  tourStopIds?: string[];
}

function CityUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
}

function MapResizer({ isCompact, sidebarOpen }: { isCompact?: boolean; sidebarOpen?: boolean }) {
  const map = useMap();

  useEffect(() => {
    // Delay to allow CSS transition to complete
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [isCompact, sidebarOpen, map]);

  return null;
}

function FocusUpdater({ focusLocation }: { focusLocation?: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (focusLocation) {
      map.setView([focusLocation.lat, focusLocation.lng], focusLocation.zoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [focusLocation, map]);

  return null;
}

function MapClickHandler({ 
  isSelectingHotelOnMap,
  isSelectingEndPointOnMap,
  onHotelLocationSelected,
  onEndPointLocationSelected,
}: { 
  isSelectingHotelOnMap: boolean;
  isSelectingEndPointOnMap: boolean;
  onHotelLocationSelected?: (lat: number, lng: number) => void;
  onEndPointLocationSelected?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (isSelectingHotelOnMap && onHotelLocationSelected) {
        onHotelLocationSelected(e.latlng.lat, e.latlng.lng);
      } else if (isSelectingEndPointOnMap && onEndPointLocationSelected) {
        onEndPointLocationSelected(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

interface TourRoutingMachineProps {
  tourStops: Landmark[];
  onTourRouteFound?: (route: any) => void;
  activeRoute: { start: [number, number]; end: [number, number] } | null;
  onTourRouteClick?: () => void;
  startingPoint?: { lat: number; lng: number; type: string } | null;
  endPoint?: { lat: number; lng: number; type: string } | null;
  selectedLanguage?: string;
  onSegmentInfoUpdate?: (segments: SegmentInfo[]) => void;
}

export interface SegmentInfo {
  fromIndex: number;
  toIndex: number;
  distance: number;
  duration: number;
  midpoint: [number, number];
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

// Estimate walking time (average walking speed ~5 km/h = 83.33 m/min)
// Add 20% for realistic urban walking (stops, crossings, etc.)
function estimateWalkingTime(distanceMeters: number): number {
  const walkingSpeedMperMin = 83.33;
  return (distanceMeters / walkingSpeedMperMin) * 1.2; // in minutes
}

function TourRoutingMachine({ tourStops, onTourRouteFound, activeRoute, onTourRouteClick, startingPoint, endPoint, selectedLanguage = 'en', onSegmentInfoUpdate }: TourRoutingMachineProps) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const segmentMarkersRef = useRef<L.Marker[]>([]);
  const fallbackPolylineRef = useRef<L.Polyline | null>(null);
  const osrmFailedRef = useRef<boolean>(false);
  const osrmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const safeRemoveControl = useCallback((control: L.Routing.Control) => {
    if (!control || !map) return;
    
    try {
      try {
        control.setWaypoints([]);
      } catch (e) {
        console.debug('Waypoint clearing handled:', e);
      }
      
      try {
        if ((map as any)._loaded && (control as any)._map) {
          map.removeControl(control);
        }
      } catch (e) {
        console.debug('Control removal handled:', e);
      }
    } catch (e) {
      console.debug('Tour routing control removal handled:', e);
    }
  }, [map]);

  const clearSegmentMarkers = useCallback(() => {
    segmentMarkersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (e) {
        console.debug('Segment marker removal handled:', e);
      }
    });
    segmentMarkersRef.current = [];
  }, []);

  const clearFallbackPolyline = useCallback(() => {
    if (fallbackPolylineRef.current) {
      try {
        fallbackPolylineRef.current.remove();
      } catch (e) {
        console.debug('Fallback polyline removal handled:', e);
      }
      fallbackPolylineRef.current = null;
    }
  }, []);

  // Create fallback route with straight lines when OSRM fails
  const createFallbackRoute = useCallback((waypoints: L.LatLng[]) => {
    if (!map || waypoints.length < 2) return;
    
    clearFallbackPolyline();
    clearSegmentMarkers();

    // Create polyline connecting all waypoints
    const polyline = L.polyline(waypoints, {
      color: 'hsl(14, 85%, 55%)',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10', // Dashed line to indicate it's an estimate
    });
    polyline.addTo(map);
    fallbackPolylineRef.current = polyline;

    // Calculate segments and create markers
    const segments: SegmentInfo[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
      const duration = estimateWalkingTime(distance) * 60; // Convert to seconds
      
      totalDistance += distance;
      totalDuration += duration;

      // Calculate midpoint for marker
      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;

      segments.push({
        fromIndex: i,
        toIndex: i + 1,
        distance: distance,
        duration: duration,
        midpoint: [midLat, midLng]
      });

      // Create segment info marker
      const distKm = (distance / 1000).toFixed(1);
      const durMin = Math.round(duration / 60);
      const durHours = Math.floor(durMin / 60);
      const durMinsRemainder = durMin % 60;
      const timeDisplay = durMin >= 60
        ? (selectedLanguage === 'ko' 
            ? `${durHours}시간 ${durMinsRemainder}분`
            : `${durHours}h ${durMinsRemainder}m`)
        : (selectedLanguage === 'ko' ? `${durMin}분` : `${durMin}min`);

      const marker = L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: 'segment-info-marker',
          html: `<div style="
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid hsl(14, 85%, 55%);
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: 600;
            color: hsl(14, 85%, 45%);
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span>${distKm}km</span>
            <span style="color: #666;">•</span>
            <span>${timeDisplay}</span>
          </div>`,
          iconSize: [100, 28],
          iconAnchor: [50, 14],
        }),
        interactive: false,
      });

      marker.addTo(map);
      segmentMarkersRef.current.push(marker);
    }

    // Notify parent components
    if (onSegmentInfoUpdate) {
      onSegmentInfoUpdate(segments);
    }

    if (onTourRouteFound) {
      onTourRouteFound({
        summary: { totalDistance, totalTime: totalDuration },
        coordinates: waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
        legs: segments.map(seg => ({
          distance: seg.distance,
          time: seg.duration
        })),
        isFallback: true
      });
    }

    // Add click event to polyline
    if (onTourRouteClick) {
      polyline.on('click', () => {
        onTourRouteClick();
      });
    }
  }, [map, selectedLanguage, onSegmentInfoUpdate, onTourRouteFound, onTourRouteClick, clearFallbackPolyline, clearSegmentMarkers]);

  useEffect(() => {
    if (!map) return;
    
    const hasStartingPoint = startingPoint && startingPoint.lat && startingPoint.lng;
    const minStopsNeeded = hasStartingPoint ? 1 : 2;
    
    // Clear timeout on cleanup
    if (osrmTimeoutRef.current) {
      clearTimeout(osrmTimeoutRef.current);
      osrmTimeoutRef.current = null;
    }
    
    // Don't show tour routing when there's an active navigation route
    if (tourStops.length < minStopsNeeded || activeRoute) {
      if (routingControlRef.current) {
        safeRemoveControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      clearSegmentMarkers();
      clearFallbackPolyline();
      if (onSegmentInfoUpdate) {
        onSegmentInfoUpdate([]);
      }
      return;
    }

    if (routingControlRef.current) {
      safeRemoveControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    clearSegmentMarkers();
    clearFallbackPolyline();

    // Build waypoints
    const waypoints: L.LatLng[] = [];
    if (hasStartingPoint) {
      waypoints.push(L.latLng(startingPoint.lat, startingPoint.lng));
    }
    tourStops.forEach(stop => waypoints.push(L.latLng(stop.lat, stop.lng)));
    
    const hasEndPoint = endPoint && endPoint.lat && endPoint.lng;
    if (hasEndPoint) {
      waypoints.push(L.latLng(endPoint.lat, endPoint.lng));
    }

    // Set a timeout for OSRM - if it doesn't respond in 5 seconds, use fallback
    osrmTimeoutRef.current = setTimeout(() => {
      if (!osrmFailedRef.current) {
        console.log('OSRM timeout - using fallback route');
        osrmFailedRef.current = true;
        createFallbackRoute(waypoints);
      }
    }, 5000);

    const control = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: 'hsl(14, 85%, 55%)', opacity: 0.9, weight: 5 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false,
    } as any);

    control.on('routesfound', function (e) {
      // Clear timeout since we got a response
      if (osrmTimeoutRef.current) {
        clearTimeout(osrmTimeoutRef.current);
        osrmTimeoutRef.current = null;
      }
      osrmFailedRef.current = false;
      clearFallbackPolyline();

      const routes = e.routes;
      if (routes && routes[0]) {
        const route = routes[0];
        
        if (onTourRouteFound) {
          onTourRouteFound(route);
        }
        
        if (route.instructions && route.coordinates) {
          const segments: SegmentInfo[] = [];
          const waypointIndices = route.waypointIndices || [];
          
          for (let i = 0; i < waypointIndices.length - 1; i++) {
            const startIdx = waypointIndices[i];
            const endIdx = waypointIndices[i + 1];
            
            const midIdx = Math.floor((startIdx + endIdx) / 2);
            const midCoord = route.coordinates[midIdx];
            
            let segDistance = 0;
            let segDuration = 0;
            
            route.instructions.forEach((inst: any) => {
              if (inst.index >= startIdx && inst.index < endIdx) {
                segDistance += inst.distance || 0;
                segDuration += inst.time || 0;
              }
            });
            
            if (midCoord) {
              segments.push({
                fromIndex: i,
                toIndex: i + 1,
                distance: segDistance,
                duration: segDuration,
                midpoint: [midCoord.lat, midCoord.lng]
              });
            }
          }
          
          clearSegmentMarkers();
          segments.forEach((seg) => {
            const distKm = (seg.distance / 1000).toFixed(1);
            const durMin = Math.round(seg.duration / 60);
            const durHours = Math.floor(durMin / 60);
            const durMinsRemainder = durMin % 60;
            const timeDisplay = durMin >= 60
              ? (selectedLanguage === 'ko' 
                  ? `${durHours}시간 ${durMinsRemainder}분`
                  : `${durHours}h ${durMinsRemainder}m`)
              : (selectedLanguage === 'ko' ? `${durMin}분` : `${durMin}min`);
            
            const marker = L.marker(seg.midpoint, {
              icon: L.divIcon({
                className: 'segment-info-marker',
                html: `<div style="
                  background: rgba(255, 255, 255, 0.95);
                  border: 2px solid hsl(14, 85%, 55%);
                  border-radius: 8px;
                  padding: 4px 8px;
                  font-size: 11px;
                  font-weight: 600;
                  color: hsl(14, 85%, 45%);
                  white-space: nowrap;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span>${distKm}km</span>
                  <span style="color: #666;">•</span>
                  <span>${timeDisplay}</span>
                </div>`,
                iconSize: [100, 28],
                iconAnchor: [50, 14],
              }),
              interactive: false,
            });
            
            marker.addTo(map);
            segmentMarkersRef.current.push(marker);
          });
          
          if (onSegmentInfoUpdate) {
            onSegmentInfoUpdate(segments);
          }
        }
        
        if (onTourRouteClick && (control as any)._line) {
          (control as any)._line.on('click', () => {
            onTourRouteClick();
          });
        }
      }
    });

    // Handle routing errors - use fallback
    control.on('routingerror', function (e: any) {
      console.log('OSRM routing error, using fallback:', e.error?.message || 'Unknown error');
      if (osrmTimeoutRef.current) {
        clearTimeout(osrmTimeoutRef.current);
        osrmTimeoutRef.current = null;
      }
      osrmFailedRef.current = true;
      createFallbackRoute(waypoints);
    });

    try {
      control.addTo(map);
      routingControlRef.current = control;
    } catch (e) {
      console.warn('Failed to add tour routing control, using fallback:', e);
      createFallbackRoute(waypoints);
    }

    return () => {
      if (osrmTimeoutRef.current) {
        clearTimeout(osrmTimeoutRef.current);
        osrmTimeoutRef.current = null;
      }
      if (routingControlRef.current) {
        safeRemoveControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      clearSegmentMarkers();
      clearFallbackPolyline();
    };
  }, [map, tourStops, onTourRouteFound, activeRoute, safeRemoveControl, startingPoint, endPoint, selectedLanguage, clearSegmentMarkers, onSegmentInfoUpdate, createFallbackRoute, clearFallbackPolyline]);

  return null;
}

export default function MapView({
  landmarks,
  userPosition,
  onLandmarkRoute,
  activeRoute,
  onRouteFound,
  cityCenter,
  cityZoom,
  selectedLanguage = 'en',
  isCompact = false,
  sidebarOpen = false,
  focusLocation,
  tourStops = [],
  onAddToTour,
  onTourRouteFound,
  onTourRouteClick,
  isSelectingHotelOnMap = false,
  isSelectingEndPointOnMap = false,
  onHotelLocationSelected,
  onEndPointLocationSelected,
  startingPoint,
  endPoint,
  selectedLandmark,
  onLandmarkSelect,
  onShowList,
  showTourOnly = false,
  tourStopIds = [] as string[],
}: MapViewProps) {
  const landmarkIcon = createCustomIcon('hsl(14, 85%, 55%)'); // Terracotta for landmarks
  const activityIcon = createCustomIcon('hsl(210, 85%, 55%)'); // Blue for activities
  const restaurantIcon = createCustomIcon('hsl(25, 95%, 55%)'); // Orange for restaurants
  const giftShopIcon = createCustomIcon('hsl(45, 90%, 55%)'); // Gold for gift shops
  
  // Blinking icons for selected landmark
  const blinkingLandmarkIcon = createBlinkingIcon('hsl(14, 85%, 55%)');
  const blinkingActivityIcon = createBlinkingIcon('hsl(210, 85%, 55%)');
  const blinkingRestaurantIcon = createBlinkingIcon('hsl(25, 95%, 55%)');
  const blinkingGiftShopIcon = createBlinkingIcon('hsl(45, 90%, 55%)');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const previousSelectedRef = useRef<string | null>(null);
  
  // Update marker icons when selectedLandmark changes
  useEffect(() => {
    const previousId = previousSelectedRef.current;
    const currentId = selectedLandmark?.id || null;
    
    // If selection changed
    if (previousId !== currentId) {
      // Reset previous marker to normal icon
      if (previousId) {
        const prevMarker = markerRefs.current.get(previousId);
        if (prevMarker) {
          const prevLandmark = landmarks.find(l => l.id === previousId);
          if (prevLandmark) {
            const isActivity = prevLandmark.category === 'Activity';
            const isRestaurant = prevLandmark.category === 'Restaurant';
            const isGiftShop = prevLandmark.category === 'Gift Shop' || prevLandmark.category === 'Shop';
            const normalIcon = isActivity ? activityIcon : isRestaurant ? restaurantIcon : isGiftShop ? giftShopIcon : landmarkIcon;
            prevMarker.setIcon(normalIcon);
          }
        }
      }
      
      // Set current marker to blinking icon
      if (currentId) {
        const currMarker = markerRefs.current.get(currentId);
        if (currMarker) {
          const currLandmark = landmarks.find(l => l.id === currentId);
          if (currLandmark) {
            const isActivity = currLandmark.category === 'Activity';
            const isRestaurant = currLandmark.category === 'Restaurant';
            const isGiftShop = currLandmark.category === 'Gift Shop' || currLandmark.category === 'Shop';
            const blinkIcon = isActivity ? blinkingActivityIcon : isRestaurant ? blinkingRestaurantIcon : isGiftShop ? blinkingGiftShopIcon : blinkingLandmarkIcon;
            currMarker.setIcon(blinkIcon);
          }
        }
      }
      
      previousSelectedRef.current = currentId;
    }
  }, [selectedLandmark, landmarks, landmarkIcon, activityIcon, restaurantIcon, giftShopIcon, blinkingLandmarkIcon, blinkingActivityIcon, blinkingRestaurantIcon, blinkingGiftShopIcon]);

  // Add touch event listeners to markers
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    markerRefs.current.forEach((marker, landmarkId) => {
      const element = marker.getElement();
      if (!element) return;

      const landmark = landmarks.find(l => l.id === landmarkId);
      if (!landmark) return;

      let touchTimer: NodeJS.Timeout | null = null;

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        touchTimer = setTimeout(() => {
          if (onAddToTour) {
            onAddToTour(landmark);
            // Close popup
            marker.closePopup();
          }
        }, 1000);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
      };

      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
      element.addEventListener('touchmove', handleTouchMove);

      cleanupFunctions.push(() => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchmove', handleTouchMove);
      });
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [landmarks, onAddToTour]);

  return (
    <MapContainer
      center={cityCenter || ROME_CENTER}
      zoom={cityZoom || 14}
      className="h-full w-full"
      zoomControl={true}
    >
      <MapUpdater position={userPosition} />
      <CityUpdater center={cityCenter} zoom={cityZoom} />
      <MapResizer isCompact={isCompact} sidebarOpen={sidebarOpen} />
      <FocusUpdater focusLocation={focusLocation} />
      <MapClickHandler 
        isSelectingHotelOnMap={isSelectingHotelOnMap}
        isSelectingEndPointOnMap={isSelectingEndPointOnMap}
        onHotelLocationSelected={onHotelLocationSelected}
        onEndPointLocationSelected={onEndPointLocationSelected}
      />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {landmarks
        .filter(landmark => !showTourOnly || tourStopIds.includes(landmark.id))
        .map((landmark, index) => {
        const isActivity = landmark.category === 'Activity';
        const isRestaurant = landmark.category === 'Restaurant';
        const isGiftShop = landmark.category === 'Gift Shop' || landmark.category === 'Shop';
        const isSelected = selectedLandmark?.id === landmark.id;
        const isInTour = tourStops.some(stop => stop.id === landmark.id);
        
        // Alternate tooltip direction based on index to reduce overlap
        const tooltipDirection = index % 2 === 0 ? 'top' : 'bottom';
        const isHighlighted = isSelected || isInTour; // Highlight if selected OR in tour
        const baseOffset = isHighlighted ? 30 : 35; // Slightly closer for smaller tour tooltips
        const tooltipOffset: [number, number] = tooltipDirection === 'top' 
          ? [0, -baseOffset] 
          : [0, baseOffset];
        
        // Use blinking icon for selected landmark
        const icon = isSelected 
          ? (isActivity ? blinkingActivityIcon : isRestaurant ? blinkingRestaurantIcon : isGiftShop ? blinkingGiftShopIcon : blinkingLandmarkIcon)
          : (isActivity ? activityIcon : isRestaurant ? restaurantIcon : isGiftShop ? giftShopIcon : landmarkIcon);
        
        return (
          <Marker
            key={`${landmark.id}-${isSelected ? 'selected' : isInTour ? 'intour' : 'normal'}`}
            position={[landmark.lat, landmark.lng]}
            icon={icon}
            ref={(marker) => {
              if (marker) {
                markerRefs.current.set(landmark.id, marker);
              }
            }}
            eventHandlers={{
              click: () => {
                // Select landmark when clicked
                if (onLandmarkSelect) {
                  onLandmarkSelect(landmark);
                }
              },
              mousedown: () => {
                // Start long press timer
                longPressTimerRef.current = setTimeout(() => {
                  if (onAddToTour) {
                    onAddToTour(landmark);
                  }
                }, 1000); // 1 second
              },
              mouseup: () => {
                // Cancel long press timer
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              },
              mouseout: () => {
                // Cancel long press timer when mouse leaves
                if (longPressTimerRef.current) {
                  clearTimeout(longPressTimerRef.current);
                  longPressTimerRef.current = null;
                }
              }
            }}
          >
            {/* Tooltip - always visible, clickable for details */}
            <Tooltip 
              permanent={true}
              direction={tooltipDirection as "top" | "bottom"}
              offset={tooltipOffset}
              className={`clickable-tooltip ${isHighlighted ? 'selected-landmark-tooltip' : 'landmark-tooltip'}`}
              interactive={true}
            >
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  // Show the list panel first
                  if (onShowList) {
                    onShowList();
                  }
                  // Then select the landmark to show details
                  if (onLandmarkSelect) {
                    onLandmarkSelect(landmark);
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                className={isHighlighted ? 'selected-tooltip-content' : ''}
                style={{ 
                  cursor: 'pointer',
                  fontWeight: isHighlighted ? 600 : 500,
                  fontSize: isHighlighted ? '9px' : '11px', // Smaller for tour items
                  color: isHighlighted ? '#FFD700' : undefined,
                  backgroundColor: isHighlighted ? '#000000' : undefined,
                  padding: isHighlighted ? '2px 6px' : '4px 8px', // Smaller padding for tour items
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                }}
                data-testid={`tooltip-landmark-${landmark.id}`}
              >
                {isInTour && (
                  <span style={{ marginRight: '4px' }}>#{tourStops.findIndex(s => s.id === landmark.id) + 1}</span>
                )}
                {getTranslatedContent(landmark, selectedLanguage, 'name')}
              </div>
            </Tooltip>
          </Marker>
        );
      })}

      {userPosition && (
        <Marker
          position={[userPosition.latitude, userPosition.longitude]}
          icon={userLocationIcon}
        />
      )}

      {activeRoute && (
        <RoutingMachine
          start={activeRoute.start}
          end={activeRoute.end}
          onRouteFound={onRouteFound}
        />
      )}

      {/* Starting Point Marker */}
      {startingPoint && startingPoint.lat && startingPoint.lng && (
        <Marker
          position={[startingPoint.lat, startingPoint.lng]}
          icon={L.divIcon({
            html: `<div style="
              background: ${startingPoint.type === 'airport' ? '#0ea5e9' : startingPoint.type === 'cruise_terminal' ? '#14b8a6' : startingPoint.type === 'hotel' ? '#a855f7' : '#22c55e'};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
              font-weight: bold;
            ">S</div>`,
            className: 'starting-point-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
        >
          <Popup>
            <div className="text-sm font-medium">
              {selectedLanguage === 'ko' ? '출발지' : 'Starting Point'}
              <div className="text-xs text-muted-foreground mt-1">
                {startingPoint.type === 'airport' ? (selectedLanguage === 'ko' ? '공항' : 'Airport') :
                 startingPoint.type === 'cruise_terminal' ? (selectedLanguage === 'ko' ? '크루즈 터미널' : 'Cruise Terminal') :
                 startingPoint.type === 'hotel' ? (selectedLanguage === 'ko' ? '호텔' : 'Hotel') :
                 startingPoint.type === 'my_location' ? (selectedLanguage === 'ko' ? '내 위치' : 'My Location') :
                 startingPoint.type === 'train_station' ? (selectedLanguage === 'ko' ? '기차역' : 'Train Station') :
                 (selectedLanguage === 'ko' ? '출발지' : 'Start')}
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* End Point Marker */}
      {endPoint && endPoint.lat && endPoint.lng && (
        <Marker
          position={[endPoint.lat, endPoint.lng]}
          icon={L.divIcon({
            html: `<div style="
              background: ${endPoint.type === 'airport' ? '#0ea5e9' : endPoint.type === 'cruise_terminal' ? '#14b8a6' : endPoint.type === 'hotel' ? '#a855f7' : '#ef4444'};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 14px;
              font-weight: bold;
            ">E</div>`,
            className: 'end-point-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
        >
          <Popup>
            <div className="text-sm font-medium">
              {selectedLanguage === 'ko' ? '도착지' : 'End Point'}
              <div className="text-xs text-muted-foreground mt-1">
                {endPoint.type === 'airport' ? (selectedLanguage === 'ko' ? '공항' : 'Airport') :
                 endPoint.type === 'cruise_terminal' ? (selectedLanguage === 'ko' ? '크루즈 터미널' : 'Cruise Terminal') :
                 endPoint.type === 'hotel' ? (selectedLanguage === 'ko' ? '호텔' : 'Hotel') :
                 endPoint.type === 'my_location' ? (selectedLanguage === 'ko' ? '내 위치' : 'My Location') :
                 endPoint.type === 'train_station' ? (selectedLanguage === 'ko' ? '기차역' : 'Train Station') :
                 (selectedLanguage === 'ko' ? '도착지' : 'End')}
              </div>
            </div>
          </Popup>
        </Marker>
      )}

    </MapContainer>
  );
}
