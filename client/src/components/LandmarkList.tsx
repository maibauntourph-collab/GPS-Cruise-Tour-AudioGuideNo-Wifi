import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, GpsPosition } from '@shared/schema';
import { Navigation, MapPin, Volume2, Info } from 'lucide-react';
import { calculateDistance, formatDistance } from '@/lib/geoUtils';
import { getTranslatedContent, t } from '@/lib/translations';

interface LandmarkListProps {
  landmarks: Landmark[];
  userPosition: GpsPosition | null;
  onLandmarkRoute: (landmark: Landmark) => void;
  spokenLandmarks: Set<string>;
  selectedLanguage?: string;
  onLandmarkSelect?: (landmark: Landmark) => void;
}

export function LandmarkList({
  landmarks,
  userPosition,
  onLandmarkRoute,
  spokenLandmarks,
  selectedLanguage = 'en',
  onLandmarkSelect,
}: LandmarkListProps) {
  const landmarksWithDistance = landmarks.map((landmark) => {
    const distance = userPosition
      ? calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          landmark.lat,
          landmark.lng
        )
      : null;
    return { landmark, distance };
  });

  const sortedLandmarks = [...landmarksWithDistance].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-96 z-[1000]">
      <Card className="backdrop-blur-md bg-background/90 border-2 shadow-xl max-h-80 overflow-y-auto">
        <div className="p-4 border-b">
          <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t('landmarks', selectedLanguage)}
          </h3>
        </div>
        <div className="divide-y">
          {sortedLandmarks.map(({ landmark, distance }) => (
            <div 
              key={landmark.id} 
              className="p-4 hover-elevate cursor-pointer" 
              data-testid={`card-landmark-${landmark.id}`}
              onClick={() => onLandmarkSelect?.(landmark)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-serif font-semibold truncate">
                      {getTranslatedContent(landmark, selectedLanguage, 'name')}
                    </h4>
                    {spokenLandmarks.has(landmark.id) && (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <Volume2 className="w-3 h-3" />
                        {t('heard', selectedLanguage)}
                      </Badge>
                    )}
                  </div>
                  {getTranslatedContent(landmark, selectedLanguage, 'description') && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {getTranslatedContent(landmark, selectedLanguage, 'description')}
                    </p>
                  )}
                  {distance !== null && (
                    <p className="text-sm font-medium text-primary">
                      {formatDistance(distance)} {t('away', selectedLanguage)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLandmarkSelect?.(landmark);
                    }}
                    data-testid={`button-info-${landmark.id}`}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLandmarkRoute(landmark);
                    }}
                    data-testid={`button-navigate-${landmark.id}`}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
