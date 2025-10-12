import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Anchor, MapPin, Clock, Info, Ship } from 'lucide-react';
import { City, Landmark, CruisePort } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';

interface CruisePortInfoProps {
  city: City;
  landmarks: Landmark[];
  selectedLanguage: string;
  onLandmarkClick: (landmarkId: string) => void;
}

function getCruisePortTranslation(cruisePort: CruisePort, language: string, field: 'portName' | 'distanceFromCity' | 'recommendedDuration' | 'tips'): string {
  if (cruisePort.translations?.[language]?.[field]) {
    return cruisePort.translations[language][field] as string;
  }
  // Fallback to default
  return cruisePort[field] || '';
}

export function CruisePortInfo({ city, landmarks, selectedLanguage, onLandmarkClick }: CruisePortInfoProps) {
  if (!city.cruisePort) {
    return null;
  }

  const cruisePort = city.cruisePort;
  const recommendedLandmarkIds = cruisePort.recommendedLandmarks || [];
  const recommendedLandmarks = landmarks.filter(l => recommendedLandmarkIds.includes(l.id));

  const portName = getCruisePortTranslation(cruisePort, selectedLanguage, 'portName');
  const distanceFromCity = getCruisePortTranslation(cruisePort, selectedLanguage, 'distanceFromCity');
  const recommendedDuration = getCruisePortTranslation(cruisePort, selectedLanguage, 'recommendedDuration');
  const tips = getCruisePortTranslation(cruisePort, selectedLanguage, 'tips');

  return (
    <Card className="p-4 mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800" data-testid="card-cruise-port-info">
      <div className="flex items-center gap-2 mb-3">
        <Ship className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100" data-testid="text-cruise-port-title">
          {t('cruisePortInfo', selectedLanguage)}
        </h3>
      </div>

      <div className="space-y-3">
        {/* Port Name */}
        <div className="flex items-start gap-2">
          <Anchor className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('portName', selectedLanguage)}</p>
            <p className="text-sm font-semibold" data-testid="text-port-name">{portName}</p>
          </div>
        </div>

        {/* Distance */}
        {distanceFromCity && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('distanceFromCity', selectedLanguage)}</p>
              <p className="text-sm" data-testid="text-port-distance">{distanceFromCity}</p>
            </div>
          </div>
        )}

        {/* Recommended Duration */}
        {recommendedDuration && (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('recommendedDuration', selectedLanguage)}</p>
              <p className="text-sm" data-testid="text-port-duration">{recommendedDuration}</p>
            </div>
          </div>
        )}

        {/* Recommended Sites */}
        {recommendedLandmarks.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" />
              {t('recommendedSites', selectedLanguage)}
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendedLandmarks.map(landmark => (
                <Button
                  key={landmark.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onLandmarkClick(landmark.id)}
                  className="text-xs hover-elevate"
                  data-testid={`button-recommended-${landmark.id}`}
                >
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {tips && (
          <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              {t('tips', selectedLanguage)}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="text-port-tips">
              {tips}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
