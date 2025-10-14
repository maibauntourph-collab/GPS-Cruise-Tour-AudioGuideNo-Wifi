import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, Polyline } from 'react-leaflet';
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

interface TourRoutingMachineProps {
  tourStops: Landmark[];
  onTourRouteFound?: (route: any) => void;
  activeRoute: { start: [number, number]; end: [number, number] } | null;
  onTourRouteClick?: () => void;
}

function TourRoutingMachine({ tourStops, onTourRouteFound, activeRoute, onTourRouteClick }: TourRoutingMachineProps) {
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
      console.debug('Tour routing control removal handled:', e);
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;
    
    // Don't show tour routing when there's an active navigation route
    if (tourStops.length < 2 || activeRoute) {
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

    const waypoints = tourStops.map(stop => L.latLng(stop.lat, stop.lng));

    const control = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: 'hsl(14, 85%, 55%)', opacity: 0.7, weight: 4, dashArray: '10, 10' }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false,
    } as any);

    control.on('routesfound', function (e) {
      const routes = e.routes;
      if (routes && routes[0]) {
        if (onTourRouteFound) {
          onTourRouteFound(routes[0]);
        }
        
        // Add click event to the route line
        if (onTourRouteClick && (control as any)._line) {
          (control as any)._line.on('click', () => {
            onTourRouteClick();
          });
        }
      }
    });

    try {
      control.addTo(map);
      routingControlRef.current = control;
    } catch (e) {
      console.warn('Failed to add tour routing control:', e);
    }

    return () => {
      if (routingControlRef.current) {
        safeRemoveControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, tourStops, onTourRouteFound, activeRoute, safeRemoveControl]);

  return null;
}

export function MapView({
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
}: MapViewProps) {
  const landmarkIcon = createCustomIcon('hsl(14, 85%, 55%)'); // Terracotta for landmarks
  const activityIcon = createCustomIcon('hsl(210, 85%, 55%)'); // Blue for activities
  const restaurantIcon = createCustomIcon('hsl(25, 95%, 55%)'); // Orange for restaurants
  const giftShopIcon = createCustomIcon('hsl(45, 90%, 55%)'); // Gold for gift shops

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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {landmarks.map((landmark) => {
        const isActivity = landmark.category === 'Activity';
        const isRestaurant = landmark.category === 'Restaurant';
        const isGiftShop = landmark.category === 'Gift Shop' || landmark.category === 'Shop';
        const icon = isActivity ? activityIcon : isRestaurant ? restaurantIcon : isGiftShop ? giftShopIcon : landmarkIcon;
        const isInTour = tourStops.some(stop => stop.id === landmark.id);
        
        return (
          <Marker
            key={landmark.id}
            position={[landmark.lat, landmark.lng]}
            icon={icon}
            draggable={false}
            eventHandlers={{
              click: () => {
                if (onAddToTour) {
                  onAddToTour(landmark);
                }
              }
            }}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -35]} 
              opacity={0.95}
              permanent={false}
              sticky={true}
            >
              <div className="text-sm font-medium whitespace-nowrap">
                {getTranslatedContent(landmark, selectedLanguage || 'en', 'name')}
              </div>
              {landmark.category && (
                <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                  {landmark.category}
                </div>
              )}
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

      {/* Tour route with actual road routing */}
      <TourRoutingMachine
        tourStops={tourStops}
        onTourRouteFound={onTourRouteFound}
        activeRoute={activeRoute}
        onTourRouteClick={onTourRouteClick}
      />
    </MapContainer>
  );
}
