import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, History, Navigation, Clock, Route } from 'lucide-react';
import { Landmark, City } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';

export interface SavedTourData {
  cityId: string;
  cityName: string;
  tourStops: string[];
  tourStopNames: string[];
  savedAt: string;
  tourTimePerStop: number;
}

interface StartupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGPS: () => void;
  onRestoreTour: (data: SavedTourData) => void;
  savedTourData: SavedTourData | null;
  selectedLanguage: string;
  isGpsAvailable: boolean;
  isGpsLoading: boolean;
}

export function getSavedTourData(): SavedTourData | null {
  try {
    const saved = localStorage.getItem('saved-tour-data');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse saved tour data:', e);
  }
  return null;
}

export function saveTourData(
  cityId: string,
  cityName: string,
  tourStops: Landmark[],
  tourTimePerStop: number,
  selectedLanguage: string
): void {
  const data: SavedTourData = {
    cityId,
    cityName,
    tourStops: tourStops.map(stop => stop.id),
    tourStopNames: tourStops.map(stop => getTranslatedContent(stop, selectedLanguage, 'name')),
    savedAt: new Date().toISOString(),
    tourTimePerStop
  };
  localStorage.setItem('saved-tour-data', JSON.stringify(data));
}

export function clearSavedTourData(): void {
  localStorage.removeItem('saved-tour-data');
}

export default function StartupDialog({
  isOpen,
  onClose,
  onSelectGPS,
  onRestoreTour,
  savedTourData,
  selectedLanguage,
  isGpsAvailable,
  isGpsLoading
}: StartupDialogProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffHours < 1) {
        return selectedLanguage === 'ko' ? '방금 전' : 'Just now';
      } else if (diffHours < 24) {
        return selectedLanguage === 'ko' ? `${diffHours}시간 전` : `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return selectedLanguage === 'ko' ? `${diffDays}일 전` : `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="dialog-startup">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Navigation className="w-5 h-5 text-primary" />
            {selectedLanguage === 'ko' ? 'GPS Audio Guide' : 'GPS Audio Guide'}
          </DialogTitle>
          <DialogDescription>
            {selectedLanguage === 'ko' 
              ? '어떻게 시작하시겠습니까?' 
              : 'How would you like to start?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* GPS Option */}
          <button
            onClick={onSelectGPS}
            disabled={isGpsLoading}
            className="w-full p-4 rounded-lg border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
            data-testid="button-start-gps"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  {selectedLanguage === 'ko' ? '현재 위치에서 시작' : 'Start from Current Location'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isGpsLoading 
                    ? (selectedLanguage === 'ko' ? 'GPS 위치 확인 중...' : 'Getting GPS location...')
                    : isGpsAvailable
                      ? (selectedLanguage === 'ko' ? 'GPS로 현재 위치를 탐색하고 근처 관광지를 찾습니다' : 'Use GPS to find nearby attractions')
                      : (selectedLanguage === 'ko' ? 'GPS를 사용할 수 없습니다. 도시를 수동으로 선택합니다' : 'GPS unavailable. Select city manually')
                  }
                </p>
                {isGpsAvailable && !isGpsLoading && (
                  <Badge variant="secondary" className="mt-2 gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {selectedLanguage === 'ko' ? 'GPS 사용 가능' : 'GPS Available'}
                  </Badge>
                )}
              </div>
            </div>
          </button>

          {/* Restore Tour Option */}
          {savedTourData && savedTourData.tourStops.length > 0 && (
            <button
              onClick={() => onRestoreTour(savedTourData)}
              className="w-full p-4 rounded-lg border-2 border-orange-200 dark:border-orange-800/50 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left group"
              data-testid="button-restore-tour"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                  <History className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">
                      {selectedLanguage === 'ko' ? '이전 투어 이어하기' : 'Continue Previous Tour'}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {formatDate(savedTourData.savedAt)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {savedTourData.cityName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Route className="w-3 h-3" />
                      {savedTourData.tourStops.length} {selectedLanguage === 'ko' ? '개 장소' : 'stops'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {savedTourData.tourTimePerStop}{selectedLanguage === 'ko' ? '분/장소' : 'min/stop'}
                    </Badge>
                  </div>
                  {savedTourData.tourStopNames.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {savedTourData.tourStopNames.slice(0, 3).join(' → ')}
                      {savedTourData.tourStopNames.length > 3 && ` +${savedTourData.tourStopNames.length - 3}`}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )}

          {/* Skip button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
            data-testid="button-skip-startup"
          >
            {selectedLanguage === 'ko' ? '건너뛰기' : 'Skip'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
