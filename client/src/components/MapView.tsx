import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

function MapResizer({ isCompact }: { isCompact?: boolean }) {
  const map = useMap();

  useEffect(() => {
    // Delay to allow CSS transition to complete
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [isCompact, map]);

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
}: MapViewProps) {
  const landmarkIcon = createCustomIcon('hsl(14, 85%, 55%)');

  return (
    <MapContainer
      center={cityCenter || ROME_CENTER}
      zoom={cityZoom || 14}
      className="h-full w-full"
      zoomControl={true}
    >
      <MapUpdater position={userPosition} />
      <CityUpdater center={cityCenter} zoom={cityZoom} />
      <MapResizer isCompact={isCompact} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {landmarks.map((landmark) => (
        <Marker
          key={landmark.id}
          position={[landmark.lat, landmark.lng]}
          icon={landmarkIcon}
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
              <Button
                size="sm"
                onClick={() => onLandmarkRoute(landmark)}
                className="w-full"
                data-testid={`button-route-${landmark.id}`}
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}

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
    </MapContainer>
  );
}
