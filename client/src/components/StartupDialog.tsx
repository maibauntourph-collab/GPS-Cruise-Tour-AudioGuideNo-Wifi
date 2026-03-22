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
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="max-w-[400px] w-[90vw] p-0 overflow-hidden border-0 bg-white rounded-[2.5rem] shadow-2xl h-[85vh] max-h-[800px] flex flex-col justify-between [&>button]:hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
          <div className="w-24 h-24 bg-[#E85D36] rounded-[2rem] flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30">
            <MapPin className="w-12 h-12 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-[26px] font-black text-slate-800 tracking-tight mb-4 text-center">
            {selectedLanguage === 'ko' ? 'WiFi 없어도 OK' : 'WiFi Free Guide'}
          </h1>
          <p className="text-center text-[15px] font-medium text-slate-500 leading-relaxed px-2">
            {selectedLanguage === 'ko' ? (
              <>
                GPS 기반 오디오 가이드.<br />
                인터넷 없이도 전 세계 기항지에서<br />
                자동으로 설명이 재생됩니다.
              </>
            ) : (
              <>
                GPS-based audio guide.<br />
                Audio plays automatically at global ports<br />
                without internet connection.
              </>
            )}
          </p>

          <div className="flex gap-2 mt-8 mb-4">
            <div className="w-5 h-2 rounded-full bg-[#E85D36]" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
            <div className="w-2 h-2 rounded-full bg-slate-200" />
          </div>
        </div>

        <div className="p-8 pb-10 w-full flex flex-col items-center">
          <Button
            className="w-full h-14 rounded-2xl bg-[#E85D36] hover:bg-[#d6522c] text-white font-bold text-lg mb-4 shadow-lg shadow-orange-500/20 transition-transform active:scale-95"
            onClick={() => {
              audioService.unlockAudio();
              onClose(); // Proceed to City Select
            }}
          >
            {selectedLanguage === 'ko' ? '다음 ➔' : 'Next ➔'}
          </Button>
          <button
            className="text-[14px] font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
            onClick={() => {
              audioService.unlockAudio();
              onClose();
            }}
          >
            {selectedLanguage === 'ko' ? '건너뛰기' : 'Skip'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * [교수님 노트: 투어 데이터 복원 유틸리티]
 * 이 함수는 로컬 스토리지에 안전하게 저장된 이전 여행 기록을 불러옵니다.
 * 사용자가 앱을 닫았다가 다시 켰을 때, 이전에 계획했던 투어를 그대로 이어갈 수 있게 돕는 고마운 친구죠.
 */
export function getSavedTourData(): SavedTourData | null {
  try {
    const saved = localStorage.getItem('saved_tour_data');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to parse saved tour data:', error);
  }
  return null;
}

export default StartupDialog;
