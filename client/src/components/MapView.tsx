import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Landmark, GpsPosition } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';
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

  useEffect(() => {
    if (!map || !start || !end) {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      return;
    }

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

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

    return () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [map, start, end, onRouteFound]);

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
}

function TourRoutingMachine({ tourStops, onTourRouteFound, activeRoute }: TourRoutingMachineProps) {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number; midpoint: L.LatLng } | null>(null);

  useEffect(() => {
    // Show tour routing even when there's an active navigation route
    if (!map || tourStops.length < 2) {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      setRouteInfo(null);
      return;
    }

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const waypoints = tourStops.map(stop => L.latLng(stop.lat, stop.lng));

    const control = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: 'hsl(14, 85%, 55%)', opacity: 0.8, weight: 5, dashArray: '12, 8' }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false,
    } as any);

    control.on('routesfound', function (e) {
      const routes = e.routes;
      if (routes && routes[0]) {
        const route = routes[0];
        if (onTourRouteFound) {
          onTourRouteFound(route);
        }
        
        // Calculate midpoint for label placement
        const coords = route.coordinates;
        const midIndex = Math.floor(coords.length / 2);
        const midpoint = coords[midIndex];
        
        setRouteInfo({
          distance: route.summary.totalDistance,
          duration: route.summary.totalTime,
          midpoint: midpoint
        });
      }
    });

    control.addTo(map);
    routingControlRef.current = control;

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
      // Clear route info when cleaning up to prevent marker leak
      setRouteInfo(null);
    };
  }, [map, tourStops, onTourRouteFound, activeRoute]);

  // Render route info label on the map
  return routeInfo ? (
    <Marker
      position={[routeInfo.midpoint.lat, routeInfo.midpoint.lng]}
      zIndexOffset={10000}
      icon={L.divIcon({
        className: 'tour-route-label',
        html: `
          <div style="
            background: hsl(14, 85%, 55%);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            ${(routeInfo.distance / 1000).toFixed(1)}km • ${Math.ceil(routeInfo.duration / 60)}min
          </div>
        `,
        iconSize: [120, 40],
        iconAnchor: [60, 20]
      })}
    />
  ) : null;
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
}: MapViewProps) {
  const landmarkIcon = createCustomIcon('hsl(14, 85%, 55%)'); // Terracotta for landmarks
  const activityIcon = createCustomIcon('hsl(195, 85%, 50%)'); // Blue for activities

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
        const icon = isActivity ? activityIcon : landmarkIcon;
        const isInTour = tourStops.some(stop => stop.id === landmark.id);
        
        return (
          <Marker
            key={landmark.id}
            position={[landmark.lat, landmark.lng]}
            icon={icon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-serif font-semibold text-lg mb-1">
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                </h3>
                {getTranslatedContent(landmark, selectedLanguage, 'description') && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {getTranslatedContent(landmark, selectedLanguage, 'description')}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onLandmarkRoute(landmark)}
                    className="flex-1"
                    data-testid={`button-route-${landmark.id}`}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                  {onAddToTour && (
                    <Button
                      size="sm"
                      variant={isInTour ? "secondary" : "outline"}
                      onClick={() => onAddToTour(landmark)}
                      className="flex-1"
                      data-testid={`button-tour-${landmark.id}`}
                    >
                      {isInTour ? 'Remove' : 'Add to Tour'}
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {userPosition && (
        <Marker
          position={[userPosition.latitude, userPosition.longitude]}
          icon={userLocationIcon}
        >
          <Popup>
            <div className="p-2">
              <p className="font-medium">Your Location</p>
              <p className="text-xs text-muted-foreground mt-1">
                Accuracy: ±{Math.round(userPosition.accuracy || 0)}m
              </p>
            </div>
          </Popup>
        </Marker>
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
      />
    </MapContainer>
  );
}
