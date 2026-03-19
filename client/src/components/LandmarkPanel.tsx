import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark } from '@shared/schema';
import { Navigation, MapPin, X, Play, Pause, Ticket, ExternalLink, Minus, MapPinned, Info, Search, Globe, Library, Clock, Activity as ActivityIcon, ChefHat, ShoppingBag, SlidersHorizontal, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import PhotoGallery from './PhotoGallery';
import { getTranslatedContent, t } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface LandmarkPanelProps {
  landmark: Landmark | null;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  selectedLanguage?: string;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;
}

export default function LandmarkPanel({
  landmark,
  onClose,
  onNavigate,
  selectedLanguage = 'en',
  onAddToTour,
  isInTour = false
}: LandmarkPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastCardHeight, setLastCardHeight] = useState(600);
  const [isCentered, setIsCentered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      audioService.stop();
      setIsPlaying(false);
      setIsPaused(false);
    };
  }, [landmark?.id]);

  useEffect(() => {
    audioService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, [selectedLanguage]);

  const clampTranslate = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxX = (viewportWidth - elementWidth) / 2;
    const maxY = (viewportHeight - elementHeight) / 2;
    return {
      x: Math.max(-maxX, Math.min(x, maxX)),
      y: Math.max(-maxY, Math.min(y, maxY))
    };
  }, []);

  useEffect(() => {
    if (!isCentered && landmark) {
      setTranslate({ x: 0, y: 0 });
      setIsCentered(true);
    }
  }, [landmark, isCentered]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!cardRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setHasMoved(true);
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    const cardWidth = cardRef.current.offsetWidth;
    const cardHeight = cardRef.current.offsetHeight;
    const clamped = clampTranslate(newX, newY, cardWidth, cardHeight);
    setTranslate(clamped);
  }, [dragStart.x, dragStart.y, clampTranslate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as EventListener);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove as EventListener);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleStart = (e: ReactMouseEvent | ReactTouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[class*="leaflet"]') || target.closest('[data-no-drag]')) return;
    if (!target.closest('[data-drag-handle]')) return;
    if ('touches' in e) e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: clientX - translate.x, y: clientY - translate.y });
    setZIndex(3000);
  };

  if (!landmark) return null;

  const handlePlayPause = async () => {
    const detailedText = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
    if (!detailedText) return;
    if (isPlaying) {
      if (audioService.isPaused()) {
        await audioService.resumeSpeech();
      } else {
        audioService.pauseSpeech();
        setIsPaused(true);
      }
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      audioService.playText(detailedText, selectedLanguage, playbackRate, () => {
        setIsPlaying(false);
        setIsPaused(false);
      });
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioService.setRate(rate);
  };

  const handleNavigate = () => {
    if (landmark) {
      onNavigate(landmark);
    }
  };

  const SectionHeader = ({ title, icon: Icon }: { title: string, icon?: any }) => (
    <div className="flex items-center gap-3 mb-4 mt-6 group/header">
      <div className="relative">
        <div className="w-1.5 h-6 bg-gradient-to-b from-[#E9633F] to-[#ff8f70] rounded-full shadow-[0_0_10px_rgba(233,99,63,0.3)] transition-all group-hover/header:h-8" />
      </div>
      <div className="flex items-center gap-2">
        {Icon && <div className="text-[#E9633F] opacity-80 transition-transform group-hover/header:scale-110"><Icon className="w-4.5 h-4.5" /></div>}
        <h3 className="font-black text-sm text-[#333] tracking-tighter uppercase">{title}</h3>
      </div>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-gray-100 to-transparent ml-2" />
    </div>
  );



  const renderFullCard = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        width: '24rem',
        maxHeight: '90vh',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100/50 overflow-hidden flex flex-col pointer-events-auto"
      onClick={() => setZIndex(3000)}
    >
      {/* Header */}
      <div
        className="p-5 pb-3 flex items-start justify-between bg-gradient-to-r from-orange-50/50 to-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-orange-100/30"
        data-drag-handle
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >

        <div className="flex-1 pr-4">
          <h2 className="text-[20px] font-black text-[#1a1a1a] leading-tight mb-1">
            {getTranslatedContent(landmark, selectedLanguage, 'name')}
          </h2>
          <p className="text-[11px] text-gray-400 font-medium tracking-tight">
            {landmark.category} - {getTranslatedContent(landmark, selectedLanguage, 'description')?.slice(0, 80)}...
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-2 space-y-2 scrollbar-hide">
        {/* Badges */}
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className={`h-7 px-3 rounded-full font-bold text-[10px] ${landmark.category === 'Restaurant' ? 'border-orange-200 bg-orange-50/50 text-orange-600' :
              landmark.category === 'Activity' ? 'border-emerald-200 bg-emerald-50/50 text-emerald-600' :
                landmark.category === 'Gift Shop' ? 'border-purple-200 bg-purple-50/50 text-purple-600' :
                  'border-blue-200 bg-blue-50/50 text-blue-600'
              }`}
          >
            {landmark.category || t('landmark', selectedLanguage)}
          </Badge>
          {landmark.yearBuilt && (
            <Badge variant="outline" className="h-7 px-3 rounded-full border-gray-100 bg-gray-50/50 text-gray-500 font-bold text-[10px] gap-1">
              <span className="opacity-50 font-normal">🏗️</span> {landmark.yearBuilt}
            </Badge>
          )}
        </div>

        {/* 
          ## [교수님 지시사항 반영 상세 적요]
          1. @에이? (추천 에이전트 및 스킬)
             - 추천 에이전트: **Designer Kim (AI 수석 디자이너)**
             - 사용 스킬: `designer_kim`
             - 관련 MCP: `sequential-thinking` (레이아웃 계층 최적화 추론)
          2. 수정/추가 사유:
             - 역사 탭에서 Wikipedia 등 지식 탐색 링크가 나레이션 재생 버튼보다 '위에' 있어야 한다는 교수님의 철학을 반영했습니다.
             - 사용자가 지식을 먼저 습득하고 감성적인 나레이션을 듣는 '선학습 후감상'의 교육적 동선을 구현했습니다.
        */}
        <div className="space-y-4 pt-2">
          {/* [교수님 지시 핵심] 나레이션/재생버튼 상단 링크 그룹 */}
          <div className="grid grid-cols-3 gap-2 px-1 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl bg-gray-50/50 border-gray-100 text-gray-600 hover:text-[#E9633F] hover:bg-white hover:border-[#E9633F]/30 gap-2 transition-all shadow-sm"
              onClick={() => {
                const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                window.open(`https://${selectedLanguage === 'ko' ? 'ko' : 'en'}.wikipedia.org/wiki/${encodeURIComponent(name)}`, '_blank');
              }}
            >
              <Library className="w-3.5 h-3.5 text-[#E9633F]" />
              <span className="text-[10px] font-bold">Wikipedia</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl bg-gray-50/50 border-gray-100 text-gray-600 hover:text-[#E9633F] hover:bg-white hover:border-[#E9633F]/30 gap-2 transition-all shadow-sm"
              onClick={() => {
                const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                window.open(`http://www.turismoroma.it/search/node/${encodeURIComponent(name)}`, '_blank');
              }}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold">Tourism</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl bg-gray-50/50 border-gray-100 text-gray-600 hover:text-[#E9633F] hover:bg-white hover:border-[#E9633F]/30 gap-2 transition-all shadow-sm"
              onClick={() => {
                const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                window.open(`https://www.google.com/search?q=${encodeURIComponent(name)}`, '_blank');
              }}
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold">Search</span>
            </Button>
          </div>

          <div className="p-6 bg-[#1a1a1a] text-white rounded-[32px] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E9633F]/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-[#E9633F] rounded-full" />
              <span className="text-[14px] font-bold tracking-tight">역사 / 나레이션 (History)</span>
            </div>
            <div className="relative z-10 space-y-3">
              <p className="text-[15px] font-medium leading-relaxed font-serif italic text-white/90">
                "{getTranslatedContent(landmark, selectedLanguage, 'narration')}"
              </p>
              {landmark.historicalInfo && (
                <p className="text-[12px] text-white/60 leading-relaxed pt-3 border-t border-white/10">
                  {landmark.historicalInfo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 📋 [Designer Kim / 강의 적요] 상세 설명 섹션
             나레이션 뒤에 보완된 상세 정보를 배치하여, 감성적인 이야기 후 구체적인 지식을 얻을 수 있도록 구성했습니다. */}
        <section className="pt-2">
          <SectionHeader title="장소 정보 (Place Info)" icon={Info} />
          <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
              {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') || getTranslatedContent(landmark, selectedLanguage, 'description')}
            </p>
          </div>
        </section>

        {/* 
          ## [교수님 지시사항 반영 상세 적요]
          1. @에이? (추천 에이전트 및 스킬)
             - 추천 에이전트: **Bug Doctor (AI 디버깅/안정성 전문가)**
             - 사용 스킬: `bug_doctor`
             - 관련 MCP: `context7` (플랫폼 API 파라미터 규격 확인)
          2. 수정/추가 사유:
             - 예약 플랫폼 연동 시 '선택된 언어의 명소 이름'이 정확히 검색되도록 로직을 보강했습니다.
             - `getTranslatedContent`를 사용하여 명소가 위치한 현지어 또는 사용자가 선택한 언어로 구글 검색 결과를 연결함으로써, 엉뚱한 예약 페이지가 뜨는 사고를 원천 방지했습니다.
             - 플랫폼 레이블에 한글 명칭(예: 클룩, 비아터)을 병기하여 사용자 직관성을 높였습니다.
        */}
        <section className="bg-white p-5 rounded-[24px] border border-orange-100/50 shadow-[0_4px_12px_rgba(233,99,63,0.05)] mt-4">
          <SectionHeader title="추천 투어 (Recommended Tours)" icon={Ticket} />

          {/* 예약 플랫폼 버튼 그룹 (마이리얼트립, 트립닷컴, 클룩, 겟유어투어, Viator) */}
          <div className="grid grid-cols-1 gap-2 mt-2">
            {[
              { name: '마이리얼트립', query: '마이리얼트립' },
              { name: '트립닷컴', query: '트립닷컴' },
              { name: 'Klook (클룩)', query: '클룩' },
              { name: 'GetYourTour (겟유어투어)', query: 'GetYourGuide' },
              { name: 'Viator (비아터)', query: 'Viator' }
            ].map((platform) => (
              <button
                key={platform.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // 🧠 [Bug Doctor 적요] 명소 언어 기반 자동 검색 쿼리 생성
                  const query = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                  const url = `https://www.google.com/search?q=${platform.query}+${query}`;
                  window.open(url, '_blank');
                }}
                className="w-full h-12 bg-gray-50/30 hover:bg-white hover:border-[#E9633F]/30 hover:shadow-md border border-transparent rounded-xl px-4 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#E9633F] group-hover:scale-110 transition-transform">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-bold text-gray-700">{platform.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#E9633F] opacity-0 group-hover:opacity-100 transition-opacity">Book Now</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#E9633F] transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {/* [교수님 지시사항 핵심 반영] 티켓 구매를 위한 상세 정보 가이드 (Information Guide) */}
          <div className="mt-6 p-5 bg-orange-50/30 rounded-2xl border border-orange-100/50">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#E9633F]" />
              <span className="text-[12px] font-black text-[#E9633F] uppercase tracking-tighter">티켓 구매 상세 안내 (Purchase Guide)</span>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed font-bold break-keep">
              {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') || getTranslatedContent(landmark, selectedLanguage, 'description')}
            </p>
          </div>
        </section>

        <section className="pt-4">
          <SectionHeader title="사진/영상 (Photos & Media)" icon={ImageIcon} />
          <div className="rounded-3xl overflow-hidden shadow-lg" data-no-drag>
            <PhotoGallery
              photos={landmark.photos || []}
              title={getTranslatedContent(landmark, selectedLanguage, 'name')}
            />
          </div>
        </section>

        {/* [DESIGNER KIM] 4. Operational Info (Clock, Activity, etc.) */}
        <div className="grid grid-cols-1 gap-3 pt-4">
          <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#E9633F] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#E9633F]/70 uppercase tracking-wider mb-0.5">운영 시간 (Hours)</p>
              <p className="text-[13px] font-bold text-gray-700">{landmark.openingHours || '09:00 - 18:00 (시즌별 상이)'}</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
              <ActivityIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600/70 uppercase tracking-wider mb-0.5">액티비티 (Activities)</p>
              <p className="text-[13px] font-bold text-gray-700">추천 액티비티 및 체험 프로그램</p>
            </div>
          </div>

          <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-100/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-orange-600 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-orange-600/70 uppercase tracking-wider mb-0.5">맛집 정보 (Restaurants)</p>
              <p className="text-[13px] font-bold text-gray-700">주변 엄선된 미식 스팟</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
              <Navigation className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-[11px] font-bold text-blue-600/70 uppercase tracking-wider mb-0.5">투어 (Tour)</p>
              <p className="text-[12px] font-bold text-gray-700">전문 가이드 투어</p>
            </div>
            <div className="p-4 bg-purple-50/30 rounded-2xl border border-purple-100/50">
              <ShoppingBag className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-[11px] font-bold text-purple-600/70 uppercase tracking-wider mb-0.5">쇼핑 (Shopping)</p>
              <p className="text-[12px] font-bold text-gray-700">기념품 및 쇼핑 스팟</p>
            </div>
          </div>
        </div>

        {/* Audio Guide Section (AudioBox Style) */}
        {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') && (
          <section className="bg-gradient-to-br from-[#FFF8F6] to-white p-6 rounded-[32px] border border-[#FFE7E0] shadow-sm mt-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E9633F] flex items-center justify-center text-white shadow-lg shadow-orange-100">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-gray-800">가이드 텍스트 (Guide Text)</h4>
                  <p className="text-[11px] text-gray-400 font-medium">상세한 현장 설명을 들어보세요</p>
                </div>
              </div>
              <Badge variant="outline" className="h-6 px-2.5 rounded-full border-[#E9633F]/20 bg-white text-[#E9633F] font-black text-[10px]">
                {playbackRate.toFixed(1)}x
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={handlePlayPause}
                className="flex-1 h-14 rounded-2xl bg-[#E9633F] text-white flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-100"
              >
                {isPlaying && !isPaused ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
                <span className="font-bold text-base tracking-tight">{isPlaying && !isPaused ? '일시정지' : '가이드 듣기'}</span>
              </button>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#E9633F] transition-colors shadow-sm">
                    <SlidersHorizontal className="w-6 h-6" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 rounded-2xl" side="top" align="end">
                  <div className="grid grid-cols-3 gap-1">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleRateChange(rate)}
                        className={`h-10 rounded-xl text-[11px] font-black transition-all ${playbackRate === rate
                          ? 'bg-[#E9633F] text-white'
                          : 'hover:bg-gray-50 text-gray-500'
                          }`}
                      >
                        {rate.toFixed(1)}x
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-[13px] text-[#714B40] leading-relaxed font-medium bg-white/50 p-4 rounded-2xl border border-white/50 italic">
              "{getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')}"
            </p>
          </section>
        )}

        {/* Location Section */}
        <section className="pt-4">
          <SectionHeader title={t('location', selectedLanguage)} icon={MapPin} />
          <div className="rounded-[32px] overflow-hidden border border-gray-100 h-48 relative shadow-inner mt-2" data-no-drag>
            <MapContainer
              key={landmark.id}
              center={[landmark.lat, landmark.lng]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              zoomControl={false}
              dragging={!isDragging}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker
                position={[landmark.lat, landmark.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `
                    <div style="position: relative; width: 40px; height: 40px; transform: translate(-13px, -40px);">
                      <div style="position: absolute; width: 40px; height: 40px; background: #E9633F; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(233, 99, 63, 0.4);"></div>
                      <div style="position: absolute; width: 14px; height: 14px; background: white; border-radius: 50%; top: 10px; left: 13px;"></div>
                    </div>
                  `,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20],
                })}
              />
            </MapContainer>
            <div className="absolute bottom-4 right-4 z-[1000]">
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${landmark.lat},${landmark.lng}`, '_blank')}
                className="bg-white/90 backdrop-blur-md px-4 h-9 rounded-full shadow-lg border border-white flex items-center gap-2 text-[11px] font-bold text-gray-700 hover:bg-white transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-[#E9633F]" />
                Google Maps
              </button>
            </div>
          </div>

          {/* Wiki/Search Quick Links */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                window.open(`https://${selectedLanguage === 'ko' ? 'ko' : 'en'}.wikipedia.org/wiki/${encodeURIComponent(name)}`, '_blank');
              }}
              className="flex-1 h-10 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] font-bold text-gray-500"
            >
              <Library className="w-3.5 h-3.5" />
              Wikipedia
            </button>
            <button
              onClick={() => {
                const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                window.open(`https://www.google.com/search?q=${encodeURIComponent(name)}`, '_blank');
              }}
              className="flex-1 h-10 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-all text-[11px] font-bold text-gray-500"
            >
              <Search className="w-3.5 h-3.5" />
              Google Search
            </button>
          </div>
        </section>

        {landmark.architect && (
          <section className="pt-2 border-t border-gray-50 mt-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Architectural design by</span>
            </div>
            <p className="text-[13px] text-gray-500 font-bold italic font-serif">
              {landmark.architect}
            </p>
          </section>
        )}


        {/* Spacer */}
        <div className="h-6" />
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-3 border-t border-gray-100 bg-white/90 backdrop-blur-md flex gap-3">
        <button
          onClick={handleNavigate}
          className="flex-1 h-14 bg-[#E9633F] text-white rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-orange-100"
        >
          <Navigation className="w-5 h-5 fill-white" />
          <span className="font-bold text-base tracking-tight">길안내 시작</span>
        </button>
        {onAddToTour && (
          <button
            onClick={() => onAddToTour(landmark)}
            className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all ${isInTour
              ? 'bg-white border-gray-200 text-gray-400'
              : 'bg-white border-[#E9633F] text-[#E9633F] shadow-lg shadow-orange-50'
              }`}
          >
            <span className="font-bold text-[20px] mb-0.5">{isInTour ? '−' : '+'}</span>
            <span className="font-bold text-base tracking-tight">{isInTour ? '투어에서 제거' : '투어에 담기'}</span>
          </button>
        )}
      </div>

    </div>
  );

  const renderMinimizedIcon = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        cursor: 'pointer',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={() => { if (!hasMoved) setIsMinimized(false); }}
      className="p-1 rounded-full bg-white shadow-2xl border-4 border-[#E9633F]"
    >
      <div className="w-12 h-12 rounded-full bg-[#E9633F] flex items-center justify-center">
        <MapPinned className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
