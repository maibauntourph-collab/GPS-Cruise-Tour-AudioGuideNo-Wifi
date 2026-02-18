import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, MapPin, TrendingUp, CheckCircle2, Clock, ChevronRight, Search } from 'lucide-react';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { t } from '@/lib/translations';
import type { Landmark } from '@shared/schema';

interface SearchedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface ProgressStatsProps {
  totalLandmarks: number;
  cityName?: string;
  selectedLanguage?: string;
  landmarks?: Landmark[];
  tourStops?: Landmark[];
  searchedLocations?: SearchedLocation[];
  onLandmarkClick?: (landmark: Landmark) => void;
  onSearchedLocationClick?: (location: SearchedLocation) => void;
}

export function ProgressStats({ 
  totalLandmarks, 
  cityName, 
  selectedLanguage = 'en',
  landmarks = [],
  tourStops = [],
  searchedLocations = [],
  onLandmarkClick,
  onSearchedLocationClick
}: ProgressStatsProps) {
  const { visitedCount, visitedLandmarks } = useVisitedLandmarks();
  const [showListDialog, setShowListDialog] = useState(false);
  const progress = totalLandmarks > 0 ? Math.round((visitedCount / totalLandmarks) * 100) : 0;

  const visitedLandmarkIds = new Set(visitedLandmarks.map(v => v.landmarkId));
  const visitedLandmarksList = landmarks.filter(l => visitedLandmarkIds.has(l.id));
  const plannedLandmarks = tourStops.filter(l => !visitedLandmarkIds.has(l.id));

  const handleLandmarkClick = (landmark: Landmark) => {
    setShowListDialog(false);
    onLandmarkClick?.(landmark);
  };

  const getLandmarkName = (landmark: Landmark) => {
    const translations = landmark.translations as Record<string, { name?: string }> | null;
    if (translations && translations[selectedLanguage]?.name) {
      return translations[selectedLanguage].name;
    }
    return landmark.name;
  };

  const visitedLabel = selectedLanguage === 'ko' ? '방문한 곳' : 'Visited';
  const plannedLabel = selectedLanguage === 'ko' ? '방문 예정' : 'Planned';
  const searchedLabel = selectedLanguage === 'ko' ? '검색한 장소' : 'Searched';
  const dialogTitle = selectedLanguage === 'ko' ? '장소 목록' : 'Places List';
  const noVisitedText = selectedLanguage === 'ko' ? '아직 방문한 곳이 없습니다' : 'No places visited yet';
  const noPlannedText = selectedLanguage === 'ko' ? '방문 예정 장소가 없습니다' : 'No planned visits';
  const noSearchedText = selectedLanguage === 'ko' ? '검색한 장소가 없습니다' : 'No searched places';

  const handleSearchedLocationClick = (location: SearchedLocation) => {
    setShowListDialog(false);
    onSearchedLocationClick?.(location);
  };

  return (
    <>
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
              <div 
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setShowListDialog(true)}
                data-testid="button-city-places"
              >
                <MapPin className="w-4 h-4" />
                <span data-testid="text-city-name" className="underline underline-offset-2">{cityName}</span>
                <ChevronRight className="w-4 h-4" />
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
                <span data-testid="text-complete-message">{t('allExplored', selectedLanguage)}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {dialogTitle} - {cityName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              View visited places, planned visits, and searched locations
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {visitedLabel} ({visitedLandmarksList.length})
                </div>
                {visitedLandmarksList.length > 0 ? (
                  <div className="space-y-2">
                    {visitedLandmarksList.map((landmark) => (
                      <div
                        key={landmark.id}
                        className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                        onClick={() => handleLandmarkClick(landmark)}
                        data-testid={`visited-landmark-${landmark.id}`}
                      >
                        <div className="font-medium text-sm">{getLandmarkName(landmark)}</div>
                        <div className="text-xs text-muted-foreground mt-1 capitalize">{landmark.category}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{noVisitedText}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4" />
                  {plannedLabel} ({plannedLandmarks.length})
                </div>
                {plannedLandmarks.length > 0 ? (
                  <div className="space-y-2">
                    {plannedLandmarks.map((landmark) => (
                      <div
                        key={landmark.id}
                        className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        onClick={() => handleLandmarkClick(landmark)}
                        data-testid={`planned-landmark-${landmark.id}`}
                      >
                        <div className="font-medium text-sm">{getLandmarkName(landmark)}</div>
                        <div className="text-xs text-muted-foreground mt-1 capitalize">{landmark.category}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{noPlannedText}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  <Search className="w-4 h-4" />
                  {searchedLabel} ({searchedLocations.length})
                </div>
                {searchedLocations.length > 0 ? (
                  <div className="space-y-2">
                    {searchedLocations.map((location) => (
                      <div
                        key={location.id}
                        className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        onClick={() => handleSearchedLocationClick(location)}
                        data-testid={`searched-location-${location.id}`}
                      >
                        <div className="font-medium text-sm">{location.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">{noSearchedText}</p>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
