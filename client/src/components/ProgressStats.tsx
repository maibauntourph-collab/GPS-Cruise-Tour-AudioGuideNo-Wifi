import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, MapPin, TrendingUp } from 'lucide-react';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { t } from '@/lib/translations';

interface ProgressStatsProps {
  totalLandmarks: number;
  cityName?: string;
  selectedLanguage?: string;
}

export function ProgressStats({ totalLandmarks, cityName, selectedLanguage = 'en' }: ProgressStatsProps) {
  const { visitedCount } = useVisitedLandmarks();
  const progress = totalLandmarks > 0 ? Math.round((visitedCount / totalLandmarks) * 100) : 0;

  return (
    <Card className="backdrop-blur-md bg-background/90 border-2 shadow-xl p-4" data-testid="card-progress-stats">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {t('progress', selectedLanguage)}
          </h3>
          <Badge variant="secondary" data-testid="badge-progress-percentage">
            {progress}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('landmarksVisited', selectedLanguage)}</span>
            <span className="font-medium" data-testid="text-visited-count">
              {visitedCount} / {totalLandmarks}
            </span>
          </div>

          {cityName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span data-testid="text-city-name">{cityName}</span>
            </div>
          )}

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              data-testid="progress-bar"
            />
          </div>

          {progress === 100 && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary pt-2">
              <TrendingUp className="w-4 h-4" />
              <span data-testid="text-complete-message">All landmarks explored!</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
