import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, History, Navigation, Clock, Route, Globe } from 'lucide-react';
import { Landmark, City } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import { LanguageSelector } from './LanguageSelector';

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
  onLanguageChange: (lang: string) => void;
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

export function StartupDialog({
  isOpen,
  onClose,
  onSelectGPS,
  onRestoreTour,
  savedTourData,
  selectedLanguage,
  onLanguageChange,
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
          <DialogTitle className="flex flex-col text-xl">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              <span>GPS Audio Guide</span>
            </div>
            <span className="text-[10px] text-primary/60 font-medium tracking-[0.2em] ml-7">
              {selectedLanguage === 'ko' ? '여행의 네비게이터' : 'Travel Navigator'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {selectedLanguage === 'ko'
              ? '어떻게 시작하시겠습니까?'
              : 'How would you like to start?'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* [교수님 지시] "dont use that card" - GPS 직접 시작 카드 제거 */}
          {/* 이전 GPS 커다란 카드를 제거하고, 도시 직접 선택으로 유도하기 위해 하단 버튼만 남깁니다. */}

          {/* [NEW] Language Selection Card - Activated & Premium Styling */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">
                {selectedLanguage === 'ko' ? '언어 설정' : 'Language Settings'}
              </h3>
            </div>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
            />
            <p className="mt-2 text-[10px] text-muted-foreground italic text-center">
              {selectedLanguage === 'ko' ? '* 선택하신 언어로 모든 가이드가 실시간 번역됩니다' : '* All guides will be translated in real-time'}
            </p>
          </div>

          {/* Restore Tour Option */}
          {savedTourData && savedTourData.tourStops.length > 0 && (
            <button
              onClick={() => {
                onRestoreTour(savedTourData);
                audioService.unlockAudio();
              }}
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
            onClick={() => {
              onClose();
              audioService.unlockAudio();
            }}
            data-testid="button-skip-startup"
          >
            {selectedLanguage === 'ko' ? '도시 직접 선택하기' : 'Select City Directly'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StartupDialog;
