import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
/**
 * [교수님 노트: StartupDialog - 여행의 첫 관문 (클래식 랜딩 버전)]
 * @에이? "학생 여러분, 이 컴포넌트는 이제 '클래식 랜딩 페이지' 역할을 수행합니다.
 * 사용자가 접속하자마자 국가와 도시, 그리고 언어를 한 곳에서 선택할 수 있도록 개편되었습니다."
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, History, Navigation, Clock, Route, Globe, ChevronRight } from 'lucide-react';
import { Landmark, City } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import { LanguageSelector } from './LanguageSelector';
import { CitySelector } from './CitySelector';

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
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
}

export function StartupDialog({
  isOpen,
  onClose,
  onRestoreTour,
  savedTourData,
  selectedLanguage,
  onLanguageChange,
  isGpsAvailable,
  isGpsLoading,
  cities,
  selectedCityId,
  onCityChange
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-startup">
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
              ? '가장 먼저 여행하실 국가와 명소를 선택해 주세요.'
              : 'Please select your destination and language to start.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* [NEW] Classic Landing: Country & City Selection First */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-2">
              <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-primary">
                {selectedLanguage === 'ko' ? '여행지 선택' : 'Select Destination'}
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <CitySelector
                cities={cities}
                selectedCityId={selectedCityId}
                onCityChange={onCityChange}
                selectedLanguage={selectedLanguage}
              />

              <div className="pt-2 border-t border-primary/5">
                <p className="text-[11px] text-muted-foreground font-medium mb-3 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {selectedLanguage === 'ko' ? '시스템 언어' : 'System Language'}
                </p>
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={onLanguageChange}
                />
              </div>
            </div>

            <Button
              className="w-full mt-5 h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-md group"
              onClick={() => {
                onClose();
                audioService.unlockAudio();
              }}
            >
              <span>{selectedLanguage === 'ko' ? '이 도시로 투어 시작하기' : 'Start Tour for this City'}</span>
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or</span>
            </div>
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
                    <h3 className="font-semibold text-sm">
                      {selectedLanguage === 'ko' ? '이전 투어 이어하기' : 'Continue Previous Tour'}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">
                      {formatDate(savedTourData.savedAt)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {savedTourData.cityName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                      <Route className="w-2.5 h-2.5" />
                      {savedTourData.tourStops.length} {selectedLanguage === 'ko' ? '개 장소' : 'stops'}
                    </Badge>
                    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                      <Clock className="w-2.5 h-2.5" />
                      {savedTourData.tourTimePerStop}{selectedLanguage === 'ko' ? '분/장소' : 'min/stop'}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          )}

          <div className="text-center py-2">
            <p className="text-[10px] text-muted-foreground font-medium italic">
              {selectedLanguage === 'ko'
                ? '💡 실시간 GPS 기반 오디오 가이드가 자동으로 제공됩니다'
                : '💡 Real-time GPS audio guide will be provided automatically'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StartupDialog;
