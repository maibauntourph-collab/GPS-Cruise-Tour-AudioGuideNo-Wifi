import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Popup, useMapEvents, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Landmark, GpsPosition } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';
import { wgs84ToGcj02 } from '@/lib/coordTransform';

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
      "></div>
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
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.45.06.19.08.4.08.61a5.49 5.49 0 0 1-1.91 4.12c.43.75.69 1.61.81 2.52a15.44 15.44 0 0 1-1.25 7.45c-.56 1.31-1.69 2.35-3.08 2.8s-2.8.19-3.84-.46c-.3-.2-.6-.44-.88-.73-.28.29-.58.53-.88.73-1.04.65-2.45.91-3.84.46s-2.52-1.49-3.08-2.8a15.44 15.44 0 0 1-1.25-7.45c.12-.91.38-1.77.81-2.52a5.49 5.49 0 0 1-1.91-4.12c0-.21.02-.42.08-.61 1.39-.39 4.64.45 6.42 2.45.65-.17 1.33-.26 2-.26Z"/>
        <path d="M9 14h.01"/>
        <path d="M15 14h.01"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Flag icon for selected landmark
const selectedFlagIcon = L.divIcon({
  className: 'selected-landmark-flag',
  html: `
    <div data-testid="marker-selected-flag" style="
      position: relative;
      width: 40px;
      height: 50px;
    ">
      <div style="
        position: absolute;
        left: 2px;
        top: 0;
        width: 4px;
        height: 50px;
        background: linear-gradient(180deg, #333 0%, #666 100%);
        border-radius: 2px;
        box-shadow: 1px 1px 3px rgba(0,0,0,0.3);
      "></div>
      <div style="
        position: absolute;
        left: 6px;
        top: 0;
        width: 30px;
        height: 20px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border-radius: 0 4px 4px 0;
        box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
        animation: flagWave 1s ease-in-out infinite;
        transform-origin: left center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="margin: 2px 7px;">
          <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
        </svg>
      </div>
      <style>
        @keyframes flagWave {
          0%, 100% { transform: rotate(0deg) skewX(0deg); }
          25% { transform: rotate(2deg) skewX(-2deg); }
          75% { transform: rotate(-2deg) skewX(2deg); }
        }
      </style>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [4, 50],
});

// [강의 노트: 프리미엄 포토맵 마커]
// 단순한 핀 대신 실제 사진 썸네일을 사용하여 사용자의 시각적 경험을 극대화합니다.
const createPhotoIcon = (photoUrl: string) => {
  return L.divIcon({
    className: 'photo-marker',
    html: `
      <div style="
        width: 38px;
        height: 38px;
        border-radius: 12px;
        border: 2px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        overflow: hidden;
        background: #f0f0f0;
        position: relative;
        transform: scale(1);
        transition: transform 0.2s ease;
      " class="hover:scale-110 transition-transform">
        <img src="${photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="
          position: absolute;
          bottom: 0;
          right: 0;
          background: rgba(0,0,0,0.5);
          padding: 2px;
          border-top-left-radius: 4px;
        ">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
};

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
        fitSelectedRoutes: false,
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

// 전역 플래그: 사용자가 맵을 직접 조작했는지 추적
let userHasInteracted = false;

// [적요] 외부(Home.tsx 등)에서 지도를 사용자 GPS 위치로 다시 중심 맞추기 위한 리셋 함수입니다.
// '내 위치로 이동' 버튼 클릭 시 이 함수를 호출하면 MapUpdater가 자동으로 GPS 위치를 추적합니다.
export function resetMapInteraction() {
  userHasInteracted = false;
}

// 사용자 인터랙션 추적 컴포넌트
function UserInteractionTracker() {
  useMapEvents({
    zoomstart: () => {
      userHasInteracted = true;
    },
    dragstart: () => {
      userHasInteracted = true;
    },
  });
  return null;
}

// [적요] 시뮬레이션 모드에서는 네비게이션처럼 줌인(16)하고 자동 추적
function UserLocationUpdater({ position, isCarNavZoomMode }: { position: GpsPosition | null; isCarNavZoomMode?: boolean }) {
  const map = useMap();
  const previousPositionRef = useRef<GpsPosition | null>(null);

  useEffect(() => {
    if (!previousPositionRef.current && position) {
      userHasInteracted = false;
    }
    previousPositionRef.current = position;

    if (position && userHasInteracted === false) {
      // 🛰️ [Server Park] 카 내비 줌 모드일 경우 초근접(18), 아니면 내비 기본(16)
      const targetZoom = isCarNavZoomMode ? 18 : 16;
      const navZoom = Math.max(map.getZoom(), targetZoom);

      map.setView([position.latitude, position.longitude], navZoom, {
        animate: true,
        duration: 0.3,
      });
    }
  }, [position, map, isCarNavZoomMode]);

  return null;
}

function SelectedLandmarkUpdater({ landmark, isMobile }: { landmark: Landmark | null; isMobile: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (landmark) {
      const latlng = L.latLng(landmark.lat, landmark.lng);

      if (!isMobile) {
        // Desktop: Card is on the left (20px margin + 448px width = 468px total)
        // We want the landmark to be centered in the remaining width (window.innerWidth - 468)
        // The offset to shift the marker to the right is: (468 / 2) = 234px
        const offset = 234;

        // Project latlng to point at current zoom
        const point = map.project(latlng, map.getZoom());
        // Apply offset (moving the center left moves the point right)
        const offsetPoint = L.point(point.x - offset, point.y);
        // Unproject back to latlng
        const offsetLatLng = map.unproject(offsetPoint, map.getZoom());

        map.setView(offsetLatLng, map.getZoom(), { animate: true });
      } else {
        // Mobile: Bottom sheet, keep it centered horizontally
        map.setView(latlng, map.getZoom(), { animate: true });
      }
    }
  }, [landmark, isMobile, map]);

  return null;
}

function GestureHandling({ selectedLanguage }: { selectedLanguage: string }) {
  const map = useMap();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();

    const onTouchStart = (e: TouchEvent) => {
      // If 2+ fingers, enable dragging. If 1 finger, disable it.
      if (e.touches.length >= 2) {
        map.dragging.enable();
        setShowOverlay(false);
      } else {
        map.dragging.disable();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Show overlay only if they are actually trying to move (one finger)
        setShowOverlay(true);
      } else {
        setShowOverlay(false);
      }
    };

    const onTouchEnd = () => {
      // Re-enable dragging so mouse dragging still works 
      // And next touch sequence starts fresh
      map.dragging.enable();
      setShowOverlay(false);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [map]);

  if (!showOverlay) return null;

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[2000] pointer-events-none animate-in fade-in duration-300">
      <div className="bg-background/95 px-6 py-4 rounded-2xl shadow-2xl border border-border flex flex-col items-center gap-3 max-w-[80%] text-center">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-duration:1s]" />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
        </div>
        <p className="text-base font-semibold text-foreground">
          {selectedLanguage === 'ko'
            ? '지도를 이동하려면 두 손가락을 사용하세요'
            : 'Use two fingers to move the map'}
        </p>
      </div>
    </div>
  );
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
  tourStops?: Landmark[];
  onAddToTour?: (landmark: Landmark) => void;
  onTourRouteFound?: (route: any) => void;
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
  isMobile?: boolean;
  isSimulationMode?: boolean;
  isCarNavZoomMode?: boolean;
}

// 이전 도시 중심 좌표를 저장하여 실제 도시 변경 시에만 뷰 업데이트
let previousCityCenter: string | null = null;

function CityUpdater({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      const centerKey = `${center[0]},${center[1]} `;
      // 도시가 실제로 변경되었을 때만 뷰 업데이트
      if (centerKey !== previousCityCenter) {
        previousCityCenter = centerKey;
        userHasInteracted = false; // 도시 변경 시 인터랙션 플래그 리셋

        try {
          // Ensure map is properly loaded before updating view
          if (map && (map as any)._loaded) {
            map.setView(center, zoom, { animate: true });
          }
        } catch (error) {
          console.warn('Failed to update map view:', error);
          // Retry with non-animated view as fallback
          try {
            map.setView(center, zoom, { animate: false });
          } catch (retryError) {
            console.debug('Map view update failed, will retry on next update');
          }
        }
      }
    }
  }, [center, zoom, map]);

  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    // [Bug Doctor | 2026-03-24] ResizeObserver를 사용하여 컨테이너 크기 변경을 감지합니다.
    // 기존의 props 기반 invalidateSize()보다 훨씬 견고하게 지도가 깨짐 없이 꽉 차도록 보장합니다.
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        if (map && (map as any)._loaded) {
          map.invalidateSize();
        }
      });
    });

    resizeObserver.observe(container);

    // 초기 마운트 시 즉시 한 번 갱신합니다.
    map.invalidateSize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

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

function TourRoutingMachine({ tourStops, onTourRouteFound, activeRoute, startingPoint, endPoint, selectedLanguage = 'en', onSegmentInfoUpdate }: TourRoutingMachineProps) {
  // ✅ [Bug Doctor 2026-02-27] 무한 루프(Maximum update depth) 방지용 최신 callback ref
  const latestCallbacks = useRef({ onTourRouteFound, onSegmentInfoUpdate });
  useEffect(() => {
    latestCallbacks.current = { onTourRouteFound, onSegmentInfoUpdate };
  }, [onTourRouteFound, onSegmentInfoUpdate]);

  // Simple local calculation - no map controls added, no event interference
  useEffect(() => {
    const hasStartingPoint = startingPoint && startingPoint.lat && startingPoint.lng;
    const minStopsNeeded = hasStartingPoint ? 1 : 2;

    // Don't calculate when there's an active navigation route or not enough stops
    if (tourStops.length < minStopsNeeded || activeRoute) {
      if (latestCallbacks.current.onSegmentInfoUpdate) {
        latestCallbacks.current.onSegmentInfoUpdate([]);
      }
      if (latestCallbacks.current.onTourRouteFound) {
        latestCallbacks.current.onTourRouteFound(null);
      }
      return;
    }

    // Build waypoint coordinates
    const waypoints: { lat: number; lng: number }[] = [];
    if (hasStartingPoint) {
      waypoints.push({ lat: startingPoint.lat, lng: startingPoint.lng });
    }
    tourStops.forEach(stop => waypoints.push({ lat: stop.lat, lng: stop.lng }));

    const hasEndPoint = endPoint && endPoint.lat && endPoint.lng;
    if (hasEndPoint) {
      waypoints.push({ lat: endPoint.lat, lng: endPoint.lng });
    }

    // Calculate segments locally (no map controls)
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

      const midLat = (start.lat + end.lat) / 2;
      const midLng = (start.lng + end.lng) / 2;

      segments.push({
        fromIndex: i,
        toIndex: i + 1,
        distance: distance,
        duration: duration,
        midpoint: [midLat, midLng]
      });
    }

    // Notify parent components
    if (latestCallbacks.current.onSegmentInfoUpdate) {
      latestCallbacks.current.onSegmentInfoUpdate(segments);
    }

    if (latestCallbacks.current.onTourRouteFound) {
      latestCallbacks.current.onTourRouteFound({
        summary: { totalDistance, totalTime: totalDuration },
        coordinates: waypoints,
        legs: segments.map(seg => ({
          distance: seg.distance,
          time: seg.duration
        })),
        isFallback: true
      });
    }
  }, [tourStops, activeRoute, startingPoint, endPoint, selectedLanguage]); // [핵심] 콜백 함수는 의존성(dependency) 배열에서 제거

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
  tourStops = [],
  onAddToTour,
  onTourRouteFound,
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
  isMobile = false,
  isSimulationMode = false,
  isCarNavZoomMode = false,
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
        // Only handle single-finger touch (long press), allow multi-touch for zoom
        if (e.touches.length > 1) return;

        touchTimer = setTimeout(() => {
          if (!landmark || !landmark.id || typeof landmark.lat !== 'number' || typeof landmark.lng !== 'number') {
            console.warn('MapView: invalid landmark in touchstart add-to-tour', landmark);
            return;
          }
          if (onAddToTour) {
            try {
              onAddToTour(landmark);
            } catch (error) {
              console.error('MapView onAddToTour error', error);
            }
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
      zoomControl={false}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      touchZoom={true}
      dragging={true}
    >
      <ZoomControl position="bottomright" />
      <UserInteractionTracker />
      <UserLocationUpdater position={userPosition} isCarNavZoomMode={isCarNavZoomMode} />
      <CityUpdater center={cityCenter} zoom={cityZoom} />
      <MapResizer />
      <SelectedLandmarkUpdater landmark={selectedLandmark || null} isMobile={!!isMobile} />
      <GestureHandling selectedLanguage={selectedLanguage} />
      <MapClickHandler
        isSelectingHotelOnMap={isSelectingHotelOnMap}
        isSelectingEndPointOnMap={isSelectingEndPointOnMap}
        onHotelLocationSelected={onHotelLocationSelected}
        onEndPointLocationSelected={onEndPointLocationSelected}
      />
      {/* [어벤져스 팀 | 2026-03-20] 🇨🇳 중국어 환경 시 Amap(高德地图) 타일 사용 */}
      {selectedLanguage?.startsWith('zh') ? (
        <TileLayer
          attribution='&copy; <a href="https://www.amap.com/">Amap</a>'
          url="https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
        />
      ) : (
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}

      {landmarks
        .filter(landmark => !showTourOnly || tourStopIds.includes(landmark.id))
        .map((landmark, index) => {
          const isActivity = landmark.category === 'Activity';
          const isRestaurant = landmark.category === 'Restaurant';
          const isGiftShop = landmark.category === 'Gift Shop' || landmark.category === 'Shop';
          const isSelected = selectedLandmark?.id === landmark.id;
          const isInTour = tourStops.some(stop => stop.id === landmark.id);

          // Alternate tooltip direction based on index to reduce overlap
          const isHighlighted = isSelected || isInTour; // Highlight if selected OR in tour
          // Tour items: always show tooltip above the pin
          const tooltipDirection = isHighlighted ? 'top' : (index % 2 === 0 ? 'top' : 'bottom');
          // Tour items: position just above the pin (offset -38 to be above 32px pin)
          const baseOffset = isHighlighted ? 38 : 35;
          const tooltipOffset: [number, number] = tooltipDirection === 'top'
            ? [0, -baseOffset]
            : [0, baseOffset];

          // Use normal icon for all (tooltip will blink for tour items instead of pin)
          const icon = isActivity ? activityIcon : isRestaurant ? restaurantIcon : isGiftShop ? giftShopIcon : landmarkIcon;

          const isAmap = selectedLanguage?.startsWith('zh');
          const [displayLat, displayLng] = isAmap ? wgs84ToGcj02(landmark.lat, landmark.lng) : [landmark.lat, landmark.lng];

          return (
            <Marker
              key={landmark.id}
              position={[displayLat, displayLng]}
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
                    if (!landmark || !landmark.id || typeof landmark.lat !== 'number' || typeof landmark.lng !== 'number') {
                      console.warn('MapView: invalid landmark in mousedown add-to-tour', landmark);
                      return;
                    }
                    if (onAddToTour) {
                      try {
                        onAddToTour(landmark);
                      } catch (error) {
                        console.error('MapView onAddToTour error', error);
                      }
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
                    // [적요] 툴팁 클릭 시 랜드마크를 선택하여 상세 카드를 노출합니다. (리스트 자동 호출 제거)
                    if (onLandmarkSelect) {
                      onLandmarkSelect(landmark);
                    }
                  }}
                  onMouseDown={(e) => {
                    // Don't stop propagation - allow map zoom
                  }}
                  onTouchStart={(e) => {
                    // Don't stop propagation - allow map zoom
                  }}
                  className={isHighlighted ? 'selected-tooltip-content' : ''}
                  style={{
                    cursor: 'pointer',
                    fontWeight: isHighlighted ? 700 : 500,
                    fontSize: isHighlighted ? '12px' : '11px',
                    color: isHighlighted ? '#ffffff' : undefined,
                    backgroundColor: isHighlighted ? '#f85108' : undefined, // 주황색 강조
                    padding: isHighlighted ? '4px 10px' : '4px 8px',
                    borderRadius: '6px',
                    boxShadow: isHighlighted ? '0 2px 8px rgba(248, 81, 8, 0.4)' : 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  data-testid={`tooltip - landmark - ${landmark.id} `}
                >
                  {isInTour && (
                    <span style={{ marginRight: '4px' }}>#{tourStops.findIndex(s => s.id === landmark.id) + 1}</span>
                  )}
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                  {/* [적요] 사용자 GPS 위치가 있으면 랜드마크까지의 거리를 표시합니다 */}
                  {userPosition && (
                    <span style={{ marginLeft: '4px', opacity: 0.7, fontSize: '10px' }}>
                      {(() => {
                        const dist = calculateDistance(userPosition.latitude, userPosition.longitude, landmark.lat, landmark.lng);
                        return dist < 1000 ? `${Math.round(dist)} m` : `${(dist / 1000).toFixed(1)} km`;
                      })()}
                    </span>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

      {userPosition && (
        <Marker
          position={selectedLanguage?.startsWith('zh') ? wgs84ToGcj02(userPosition.latitude, userPosition.longitude) : [userPosition.latitude, userPosition.longitude]}
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

      {/* Tour Routing Machine - for calculating tour route */}
      <TourRoutingMachine
        tourStops={tourStops}
        onTourRouteFound={onTourRouteFound}
        activeRoute={activeRoute}
        startingPoint={startingPoint}
        endPoint={endPoint}
        selectedLanguage={selectedLanguage}
      />

      {/* Starting Point Marker */}
      {startingPoint && startingPoint.lat && startingPoint.lng && (
        <Marker
          position={selectedLanguage?.startsWith('zh') ? wgs84ToGcj02(startingPoint.lat, startingPoint.lng) : [startingPoint.lat, startingPoint.lng]}
          icon={L.divIcon({
            html: `<div data-testid="marker-starting-point" style="
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
          position={selectedLanguage?.startsWith('zh') ? wgs84ToGcj02(endPoint.lat, endPoint.lng) : [endPoint.lat, endPoint.lng]}
          icon={L.divIcon({
            html: `<div data-testid="marker-end-point" style="
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

      {/* Selected Landmark Flag Marker */}
      {
        selectedLandmark && (
          <Marker
            position={[selectedLandmark.lat, selectedLandmark.lng]}
            icon={selectedFlagIcon}
            interactive={false}
          />
        )
      }

      {/* [강의 노트: Path Tracing 이동 라인]
          학생 여러분, Polyline을 사용하여 투어의 흐름을 지도에 그립니다.
          좌표 데이터가 유효하지 않으면 화면이 하얗게(White Screen) 변할 수 있으므로, 
          반드시 filter를 통해 유효한 위경도 값만 추출해야 합니다. */}
      {(() => {
        const validPositions = (tourStops || [])
          .filter(stop => stop && typeof stop.lat === 'number' && typeof stop.lng === 'number')
          .map(stop => {
            return (selectedLanguage?.startsWith('zh') ? wgs84ToGcj02(stop.lat, stop.lng) : [stop.lat, stop.lng]) as [number, number];
          });

        if (validPositions.length < 2) return null;

        return (
          <Polyline
            positions={validPositions}
            pathOptions={{
              color: 'hsl(14, 85%, 55%)',
              weight: 4,
              opacity: 0.6,
              dashArray: '10, 10',
              lineJoin: 'round',
            }}
          />
        );
      })()}

      {/* [적요: PhotoMap 사진 마커]
          랜드마크 중 사진 데이터가 있는 경우  thumbnails를 지도에 직접 뿌려줍니다. */}
      {landmarks
        .filter(l => l.photos && l.photos.length > 0)
        .map(l => {
          const isAmap = selectedLanguage?.startsWith('zh');
          const [displayLat, displayLng] = isAmap ? wgs84ToGcj02(l.lat, l.lng) : [l.lat, l.lng];

          return (
            <Marker
              key={`photo-${l.id}`}
              position={[displayLat, displayLng]}
              icon={createPhotoIcon(l.photos![0])}
              eventHandlers={{
                click: () => onLandmarkSelect?.(l)
              }}
              zIndexOffset={100}
            >
              <Tooltip direction="bottom" offset={[0, 20]}>
                <span className="text-[10px] font-bold">{getTranslatedContent(l, selectedLanguage, 'name')}</span>
              </Tooltip>
            </Marker>
          );
        })}

    </MapContainer >
  );
}
