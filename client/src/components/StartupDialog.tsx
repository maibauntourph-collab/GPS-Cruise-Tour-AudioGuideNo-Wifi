/**
 * [교수님 노트: StartupDialog - 여행의 첫 관문 (클래식 랜딩 버전)]
 * @에이? "학생 여러분, 이 컴포넌트는 이제 '클래식 랜딩 페이지' 역할을 수행합니다.
 * 사용자가 접속하자마자 앱의 핵심 가치를 온보딩 화면으로 전달합니다."
 *
 * [수정 적요 - 2026-03-23]
 * - 태국어(th/ไทย) 지원 추가: 제목·설명·버튼 모두 태국어로 표시
 * - getLangText() 헬퍼 함수 도입 → 언어별 텍스트를 한곳에서 관리 (확장 용이)
 * - 기존 ko/en 외 th(태국어) 분기 추가
 */
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import React from 'react';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { Landmark, City } from '@shared/schema';
import { getTranslatedContent } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import { LanguageSelector } from './LanguageSelector';
import { CitySelector } from './CitySelector';

/**
 * [교수님 노트: 다국어 텍스트 헬퍼]
 * getLangText(lang, ko, en, th) 형태로 호출하면 언어에 맞는 문자열을 반환합니다.
 * 새 언어를 추가할 때 이 함수만 수정하면 되므로 유지보수가 매우 쉽습니다.
 *
 * @param lang - 현재 선택된 언어 코드 ('ko' | 'en' | 'th' | ...)
 * @param ko   - 한국어 텍스트
 * @param en   - 영어 텍스트 (기본 fallback)
 * @param th   - 태국어 텍스트 (ไทย)
 */
function getLangText(lang: string, ko: string, en: string, th: string): string {
  if (lang === 'ko') return ko;
  if (lang === 'th') return th;
  return en; // 기본값: 영어 (그 외 모든 언어)
}

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
        <DialogTitle className="sr-only">Onboarding Welcome</DialogTitle>
        <DialogDescription className="sr-only">Select language and start your tour.</DialogDescription>
        <div className="flex-1 flex flex-col items-center justify-center p-8 mt-10">
          <div className="w-24 h-24 bg-[#E85D36] rounded-[2rem] flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30">
            <MapPin className="w-12 h-12 text-white stroke-[2.5]" />
          </div>
          {/* [적요] getLangText()로 ko/en/th 3개 언어 동시 지원 */}
          <h1 className="text-[26px] font-black text-slate-800 tracking-tight mb-4 text-center">
            {getLangText(
              selectedLanguage,
              'WiFi 없어도 OK',         // 🇰🇷 한국어
              'WiFi Free Guide',         // 🇬🇧 영어
              'ไม่ต้องใช้ WiFi ก็ได้'    // 🇹🇭 태국어: "WiFi 없어도 돼요"
            )}
          </h1>
          <p className="text-center text-[15px] font-medium text-slate-500 leading-relaxed px-2">
            {selectedLanguage === 'ko' ? (
              // 🇰🇷 한국어 설명
              <>
                GPS 기반 오디오 가이드.<br />
                인터넷 없이도 전 세계 기항지에서<br />
                자동으로 설명이 재생됩니다.
              </>
            ) : selectedLanguage === 'th' ? (
              // 🇹🇭 태국어 설명: "GPS 오디오 가이드. 인터넷 없이도 전 세계 항구에서 자동 재생"
              <>
                คู่มือเสียง GPS อัตโนมัติ<br />
                เล่นอัตโนมัติที่ท่าเรือทั่วโลก<br />
                โดยไม่ต้องใช้อินเทอร์เน็ต
              </>
            ) : (
              // 🇬🇧 영어 설명 (기본 fallback)
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
          {/* [적요] 다음 버튼 - getLangText()로 3개 언어 지원 */}
          <Button
            className="w-full h-14 rounded-2xl bg-[#E85D36] hover:bg-[#d6522c] text-white font-bold text-lg mb-4 shadow-lg shadow-orange-500/20 transition-transform active:scale-95"
            onClick={() => {
              audioService.unlockAudio();
              onClose(); // 다음 화면(City Select)으로 이동
            }}
          >
            {getLangText(
              selectedLanguage,
              '다음 ➔',   // 🇰🇷 한국어
              'Next ➔',   // 🇬🇧 영어
              'ถัดไป ➔'   // 🇹🇭 태국어: "다음"
            )}
          </Button>
          {/* [적요] 건너뛰기 버튼 */}
          <button
            className="text-[14px] font-bold text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
            onClick={() => {
              audioService.unlockAudio();
              onClose();
            }}
          >
            {getLangText(
              selectedLanguage,
              '건너뛰기',  // 🇰🇷 한국어
              'Skip',      // 🇬🇧 영어
              'ข้ามไป'     // 🇹🇭 태국어: "건너뛰기"
            )}
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
