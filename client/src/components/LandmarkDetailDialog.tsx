import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import PhotoGallery from './PhotoGallery';
import { Navigation, MapPinned, MapPin, Play, Pause, RotateCcw, Ticket, ExternalLink, Clock, Euro, ChefHat, Phone, Utensils, Activity as ActivityIcon, Landmark as LandmarkIcon, Info, Image as ImageIcon, Calendar, CreditCard, Share2, Globe, BookOpen, Search, Home, Trophy, Award, Camera, Smile, Upload, Download, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { audioService, AudioService } from '@/lib/audioService';
import { getGYGUrl, getViatorUrl, getKlookUrl, getTripUrl, getGoogleSearchUrl, getWikiUrl, getMyRealTripUrl, getGoogleMapsUrl, getCatchTableUrl, getTheForkUrl } from '@/lib/affiliateConfig';
import { getShopifyProducts, ShopifyProduct } from '@/lib/shopifyConfig';
import { useQuery } from '@tanstack/react-query';
import { useLiveTranslation } from '@/hooks/useLiveTranslation';
import { User, DbLandmarkGuide } from '@shared/schema';
import { Users, Headphones, Check, User as UserIcon } from 'lucide-react';

interface LandmarkDetailDialogProps {
  landmark: Landmark | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;
  selectedLanguage?: string;
}

export default function LandmarkDetailDialog({
  landmark,
  isOpen,
  onClose,
  onNavigate,
  onAddToTour,
  isInTour = false,
  selectedLanguage = 'en'
}: LandmarkDetailDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isNavigationOnlyMode, setIsNavigationOnlyMode] = useState(false);
  const [forceShowCard, setForceShowCard] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [audioContentType, setAudioContentType] = useState<'summary' | 'narration'>('narration');
  const [activeTab, setActiveTab] = useState<string>('history');

  const nameFallback = landmark ? getTranslatedContent(landmark as any, selectedLanguage, 'name') : '';
  const descFallback = landmark ? getTranslatedContent(landmark as any, selectedLanguage, 'description') : '';
  const narrationFallback = landmark ? getTranslatedContent(landmark as any, selectedLanguage, 'narration') : '';
  const detailFallback = landmark ? getTranslatedContent(landmark as any, selectedLanguage, 'detailedDescription') : '';

  const translatedName = useLiveTranslation(nameFallback, selectedLanguage);
  const translatedDesc = useLiveTranslation(descFallback, selectedLanguage);
  const translatedNarration = useLiveTranslation(narrationFallback, selectedLanguage);
  const translatedDetail = useLiveTranslation(detailFallback, selectedLanguage);

  // Fetch guides for this landmark
  const { data: guides = [] } = useQuery<DbLandmarkGuide[]>({
    queryKey: [`/api/landmarks/${encodeURIComponent(landmark?.id || '')}/guides`],
    enabled: !!landmark,
  });

  // [Bug Doctor] Shopify 제품 정보를 위한 쿼리를 최상위로 이동 (Error #310 해결)
  const landmarkNameForShopify = landmark ? getTranslatedContent(landmark as any, 'en', 'name') : '';
  const { data: shopifyProducts = [] } = useQuery<ShopifyProduct[]>({
    queryKey: [`/api/shopify/products/${landmarkNameForShopify}`],
    queryFn: () => getShopifyProducts(landmarkNameForShopify),
    enabled: !!landmarkNameForShopify && isOpen, // 다이얼로그가 열려 있을 때만 활성화
  });

  // Reset selected guide when landmark changes
  useEffect(() => {
    setSelectedGuideId(null);
  }, [landmark]);

  const selectedGuide = useMemo(() => {
    return guides.find(g => g.id === selectedGuideId) || null;
  }, [guides, selectedGuideId]);

  const currentDetailedDescriptionFallback = useMemo(() => {
    if (selectedGuide) {
      return getTranslatedContent(selectedGuide as any, selectedLanguage, 'detailedDescription');
    }
    return getTranslatedContent(landmark as any, selectedLanguage, 'detailedDescription');
  }, [landmark, selectedGuide, selectedLanguage]);

  const currentDetailedDescription = useLiveTranslation(currentDetailedDescriptionFallback, selectedLanguage);

  // Handle dialog close - stop all audio first
  const handleDialogClose = () => {
    const isSimulating = localStorage.getItem('simulation-active') === 'true';

    if (!isSimulating) {
      setCurrentSentenceIndex(-1);
      setIsPlaying(false);
      setIsPaused(false);
      audioService.stopSentences();
      audioService.stop();
      audioService.stopMP3();
    }
    onClose();
  };

  // [Bug Doctor] rateOverride: 속도 버튼 클릭 시 state 갱신 전에 직접 rate 전달용
  // 이렇게 하면 setPlaybackRate 비동기 문제 없이 즉시 해당 속도로 재생됨.
  const handlePlayAudio = async (startIndex: number = -1, rateOverride?: number) => {
    // [적요] rateOverride가 있으면 그걸 사용, 없으면 현재 state 값 사용
    const effectiveRate = rateOverride ?? playbackRate;

    if (isPlaying && !isPaused && startIndex === -1) {
      audioService.pause();
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused && startIndex === -1) {
      handlePlayAudio(currentSentenceIndex);
      setIsPaused(false);
      return;
    }

    const textToPlay = audioContentType === 'summary'
      ? (selectedGuide ? getTranslatedContent(selectedGuide as any, selectedLanguage, 'description') : translatedDesc)
      : translatedNarration;

    if (!textToPlay) return;

    const useIndex = startIndex !== -1 ? startIndex : 0;
    const audioMode = audioService.getAudioMode();

    const onPlaybackEnd = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
    };

    if (audioMode === 'openai') {
      setIsPlaying(true);
      setIsPaused(false);
      const success = await audioService.playOpenAISentences(
        textToPlay,
        selectedLanguage,
        (index) => setCurrentSentenceIndex(index),
        onPlaybackEnd,
        useIndex
      );
      if (!success) {
        // [적요] openai 실패 시 TTS fallback - effectiveRate 사용
        audioService.playSentences(
          textToPlay,
          selectedLanguage,
          effectiveRate,
          (index) => setCurrentSentenceIndex(index),
          onPlaybackEnd,
          useIndex
        );
      }
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      // [Bug Doctor] playbackRate → effectiveRate 로 교체: 즉시 반영
      audioService.playSentences(
        textToPlay,
        selectedLanguage,
        effectiveRate,
        (index) => setCurrentSentenceIndex(index),
        onPlaybackEnd,
        useIndex
      );
    }
  };

  const handleRestartAudio = () => {
    audioService.stopSentences();
    audioService.stop();
    audioService.stopMP3();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIndex(-1);
    setTimeout(() => handlePlayAudio(), 100);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        document.body.removeAttribute('data-scroll-locked');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && landmark && !isPlaying && activeTab === 'history') {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, landmark?.id, activeTab]);

  const activeSentences = useMemo(() => {
    const text = audioContentType === 'summary'
      ? (selectedGuide ? getTranslatedContent(selectedGuide as any, selectedLanguage, 'description') : translatedDesc)
      : translatedNarration;
    if (!text) return [];
    return AudioService.splitIntoSentences(text);
  }, [landmark, selectedGuide, selectedLanguage, audioContentType, translatedDesc, translatedNarration]);

  if (!landmark) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose} modal={false}>
      <DialogContent
        className="p-0 overflow-hidden flex flex-col border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-t-[32px] sm:rounded-[32px] bottom-0 sm:bottom-auto w-[98vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] sm:max-w-4xl h-[98vh] sm:h-auto sm:max-h-[92vh] no-overlay transition-all duration-300 ease-in-out left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col h-full overflow-hidden w-full max-w-full box-border">
          {/* Header Section - Fixed at top */}
          <DialogHeader className="p-4 pb-3 border-b shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
            <DialogDescription className="sr-only">
              Detailed information about this landmark
            </DialogDescription>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-bold p-0 mb-1 leading-tight line-clamp-2">
                  {translatedName}
                </DialogTitle>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="bg-[#FFF1EB] text-[#E67E22] border-[#FFE0D1] py-0 px-2 rounded-full text-[10px] font-bold">
                      {landmark?.category}
                    </Badge>
                  </div>
                  {translatedDesc && (
                    <div className="flex items-center gap-2 hidden sm:flex">
                      <span className="line-clamp-1 opacity-80">{translatedDesc}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 h-8">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#FCF9F6] border border-[#EFEBE6]" onClick={handleDialogClose}>
                  <RotateCcw className="w-4 h-4 text-[#A8A294]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#FCF9F6] border border-[#EFEBE6]" onClick={() => onNavigate(landmark!)}>
                  <Navigation className="w-4 h-4 text-[#E67E22]" />
                </Button>
                {/* [Designer Kim] 프리미엄 닫기 아이콘 추가 - 사용자의 'RIGHT HEAD' 요청 반영 */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  onClick={handleDialogClose}
                  title={selectedLanguage === 'ko' ? '닫기' : 'Close'}
                >
                  <div className="font-bold text-lg">✕</div>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Tabs - Middle Content area should be scrollable */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 pt-4 bg-[#FCF9F6] border-b shrink-0">
              <TabsList className="grid w-full grid-cols-4 bg-[#EFEBE6] rounded-xl p-1 h-11">
                <TabsTrigger value="history" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '역사/나레이션' : 'History/Narration'}
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '지도/정보' : 'Map/Info'}
                </TabsTrigger>
                <TabsTrigger value="booking" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '티켓/예약' : 'Book/Ticket'}
                </TabsTrigger>
                <TabsTrigger value="shopping" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '기념품' : 'Shopping'}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#FCF9F6] scroll-smooth custom-scrollbar">
              {/* History & Audio Tab */}
              <TabsContent value="history" className="p-0 m-0 space-y-6 pb-32">
                {/* 
                  [교수님 지시사항 반영 상세 적요]
                  1. @에이? (추천 에이전트 및 스킬)
                     - 추천 에이전트: Designer Kim (AI 수석 디자이너)
                     - 사용 스킬: `designer_kim` (UI 계층 구조 및 시각적 리듬 최적화)
                  2. 디자인 의도:
                     - '대표 사진' 섹션을 상단에 배치하여 시각적 몰입감을 먼저 제공합니다.
                     - 스크롤 시 부드럽게 넘어가도록 `scrollbar-hide`와 `snap-x` 속성을 고려하였습니다.
                */}
                <div className="px-4 pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#E67E22] font-extrabold text-sm tracking-tight">
                      <ImageIcon className="w-4.5 h-4.5" />
                      {selectedLanguage === 'ko' ? '명소 갤러리' : 'Landmark Gallery'}
                    </div>
                    <span className="text-[10px] text-[#A8A294] font-bold bg-[#EFEBE6] px-2 py-0.5 rounded-full uppercase">Premium View</span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide snap-marker">
                    {(landmark.photos && landmark.photos.length > 0) ? (
                      landmark.photos.map((photo, idx) => (
                        <div key={idx} className="w-32 h-32 rounded-[24px] bg-[#EFEBE6] flex-shrink-0 overflow-hidden border-2 border-white shadow-md transition-all hover:scale-105 active:scale-95 duration-300 group">
                          <img src={photo} alt={`Photo ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                        </div>
                      ))
                    ) : (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="w-32 h-32 rounded-[24px] bg-[#EFEBE6] flex-shrink-0 flex items-center justify-center border-2 border-dashed border-[#A8A294]/30">
                          <ImageIcon className="w-10 h-10 text-[#A8A294]/40" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audio Box - Moved above history text per user request */}
                <div className="px-4 pt-6">
                  <div className="rounded-2xl border border-[#FDEBD0] bg-orange-50/50 p-5 space-y-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-[#E67E22] flex items-center justify-center text-white shadow-md">
                          <Headphones className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-[#E67E22] text-sm">{selectedLanguage === 'ko' ? '나레이션 가이드' : 'Narration Guide'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-[#E67E22] text-[#E67E22] bg-white px-2 h-5">{playbackRate}x Speed</Badge>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => handlePlayAudio()}
                          className="flex-1 h-14 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-2xl gap-3 font-bold shadow-lg shadow-orange-100 transition-all active:scale-95"
                        >
                          {isPlaying && !isPaused ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
                          <span className="text-base">{selectedLanguage === 'ko' ? (isPlaying && !isPaused ? '일시정지' : '재생 시작') : (isPlaying && !isPaused ? 'Pause' : 'Start Play')}</span>
                        </Button>
                        <Button
                          onClick={handleRestartAudio}
                          variant="ghost"
                          size="icon"
                          className="h-14 w-14 rounded-2xl bg-white border border-[#FDEBD0] text-[#E67E22] shadow-sm"
                        >
                          <RotateCcw className="w-6 h-6" />
                        </Button>
                      </div>

                      <div className="flex gap-2 justify-between">
                        {[0.8, 1.0, 1.2, 1.5, 2.0].map((rate) => (
                          <Button
                            key={rate}
                            variant="outline"
                            className={`flex-1 h-9 text-[11px] font-bold rounded-xl border-[#EFEBE6] transition-all ${playbackRate === rate ? 'bg-[#E67E22] text-white border-[#E67E22] shadow-md' : 'bg-white text-[#A8A294]'}`}
                            onClick={() => {
                              // [Bug Doctor] rate를 직접 전달 → state 비동기 문제 없이 즉시 적용
                              // [적요] setPlaybackRate는 비동기이므로 handlePlayAudio에
                              // rate를 직접 넘겨서 effectiveRate로 바로 사용하게 함
                              setPlaybackRate(rate);
                              audioService.setRate(rate);
                              if (isPlaying && !isPaused) {
                                // 중요: rate를 2번째 인자로 직접 전달!
                                handlePlayAudio(currentSentenceIndex, rate);
                              }
                            }}
                          >
                            {rate}x
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Content */}
                <div className="px-5 space-y-3">
                  <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    {selectedLanguage === 'ko' ? '역사적 정보' : 'Historical Insights'}
                  </div>
                  <div className="text-[15px] leading-relaxed text-[#5D574D] font-medium bg-white/40 p-4 rounded-2xl border border-white/60">
                    {activeSentences.length > 0 ? (
                      activeSentences.map((sentence: string, index: number) => {
                        const isCurrentSentence = currentSentenceIndex === index;
                        const showHighlight = isCurrentSentence && (!isPaused || !isPlaying);
                        const isReadSentence = currentSentenceIndex > index && isPlaying;
                        return (
                          <span
                            key={index}
                            className={`inline rounded-sm px-0.5 transition-all duration-300 ease-in-out ${showHighlight
                              ? 'bg-[#ccff00] font-bold shadow-sm text-black'
                              : isReadSentence
                                ? 'opacity-60'
                                : 'bg-transparent'
                              }`}
                          >
                            {sentence}{' '}
                          </span>
                        );
                      })
                    ) : (
                      audioContentType === 'narration' ? translatedNarration : translatedDetail
                    )}
                  </div>
                </div>

                {/* ✅ [Bug Doctor + Designer Kim] 역사 탭 하단 더 알아보기 링크
                    @에이? Bug Doctor (로직), Designer Kim (UI)
                    [적요] 나레이션 완료 후 사용자가 외부에서 추가 정보를 탐색할 수 있도록
                    Wikipedia / 관광정보 / Google 검색 3개 버튼을 3열 그리드로 제공.
                    getWikiUrl · getGoogleSearchUrl 은 affiliateConfig.ts에 정의됨.
                */}
                <div className="px-4 pb-8 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-xs">
                    <Globe className="w-3.5 h-3.5" />
                    {selectedLanguage === 'ko' ? '더 알아보기' : 'Explore More'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">

                    {/* Wikipedia 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-16 gap-1 rounded-xl border-[#EFEBE6] text-[#5D574D] hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-95"
                      onClick={() => {
                        const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                        const win = window.open(getWikiUrl(name, selectedLanguage), '_blank', 'noopener,noreferrer');
                        if (!win) alert(selectedLanguage === 'ko' ? '팝업 차단됨. 브라우저 허용 후 재시도' : 'Popup blocked. Please allow popups.');
                      }}
                    >
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] font-bold">Wikipedia</span>
                    </Button>

                    {/* 관광정보 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-16 gap-1 rounded-xl border-[#EFEBE6] text-[#5D574D] hover:border-green-400 hover:bg-green-50 transition-all active:scale-95"
                      onClick={() => {
                        const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                        const win = window.open(getGoogleSearchUrl(`${name} tourism info`), '_blank', 'noopener,noreferrer');
                        if (!win) alert(selectedLanguage === 'ko' ? '팝업 차단됨. 브라우저 허용 후 재시도' : 'Popup blocked. Please allow popups.');
                      }}
                    >
                      <Info className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-bold">{selectedLanguage === 'ko' ? '관광정보' : 'Tourism'}</span>
                    </Button>

                    {/* Google 검색 버튼 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-16 gap-1 rounded-xl border-[#EFEBE6] text-[#5D574D] hover:border-orange-400 hover:bg-orange-50 transition-all active:scale-95"
                      onClick={() => {
                        const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                        const win = window.open(getGoogleSearchUrl(name), '_blank', 'noopener,noreferrer');
                        if (!win) alert(selectedLanguage === 'ko' ? '팝업 차단됨. 브라우저 허용 후 재시도' : 'Popup blocked. Please allow popups.');
                      }}
                    >
                      <Search className="w-4 h-4 text-orange-500" />
                      <span className="text-[10px] font-bold">{selectedLanguage === 'ko' ? 'Google' : 'Search'}</span>
                    </Button>

                  </div>
                </div>
              </TabsContent>

              {/* Map & Detail Tab */}
              <TabsContent value="details" className="p-0 m-0 space-y-6 pb-32">
                {/* Location Map */}
                <div className="px-4 pt-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                    <MapPinned className="w-4 h-4" />
                    {selectedLanguage === 'ko' ? '실시간 위치' : 'Live Location'}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => {
                        const isChinese = selectedLanguage.startsWith('zh');
                        const landmarkName = getTranslatedContent(landmark, selectedLanguage, 'name');
                        if (isChinese) {
                          // [어벤져스 팀 | 2026-03-20] 🇨🇳 Amap(高德지도) 내비게이션(길찾기) 딥링크
                          const amapRouteUrl = `amapuri://route/plan/?did=BGVIS1&dlat=${landmark.lat}&dlon=${landmark.lng}&dname=${encodeURIComponent(landmarkName)}&dev=0&t=2`;
                          const amapWebRouteUrl = `https://uri.amap.com/navigation?to=${landmark.lng},${landmark.lat},${encodeURIComponent(landmarkName)}&mode=walk&policy=1&src=mypage&coordinate=wgs84&callnative=1`;

                          window.location.href = amapRouteUrl;
                          setTimeout(() => {
                            window.open(amapWebRouteUrl, '_blank');
                          }, 500);
                        } else {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${landmark.lat},${landmark.lng}&travelmode=walking`, '_blank');
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl bg-[#f85108] hover:bg-[#e04807] text-white text-base font-bold transition-all shadow-lg active:scale-[0.98]"
                    >
                      <Navigation className="w-5 h-5" />
                      {selectedLanguage.startsWith('zh') ? '高德地图 导航 (Amap Navi)' : 'Get Directions'}
                    </button>

                    <button
                      onClick={() => {
                        const isChinese = selectedLanguage.startsWith('zh');
                        const landmarkName = getTranslatedContent(landmark, selectedLanguage, 'name');
                        if (isChinese) {
                          const amapWebUrl = `https://uri.amap.com/marker?position=${landmark.lng},${landmark.lat}&name=${encodeURIComponent(landmarkName)}&coordinate=wgs84&callnative=1`;
                          window.open(amapWebUrl, '_blank');
                        } else {
                          window.open(`https://www.google.com/maps?q=${landmark.lat},${landmark.lng}`, '_blank');
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full px-6 py-2 rounded-2xl bg-white/80 hover:bg-white text-[#4A443A] text-sm font-medium transition-colors border border-[#A8A294]/20"
                    >
                      <MapPin className="w-4 h-4 text-[#34A853]" />
                      {selectedLanguage.startsWith('zh') ? '在地图中查看 (Map View)' : 'View on Maps'}
                    </button>
                  </div>
                </div>

                {/* Technical/Architect Info */}
                <div className="px-4 space-y-4">
                  <div className="bg-white/60 rounded-3xl p-5 border border-white/80 space-y-4">
                    <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm border-b border-orange-100 pb-2">
                      <LandmarkIcon className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '건축 정보' : 'Architecture'}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="w-full h-24 rounded-2xl overflow-hidden border border-[#E0DBCF] shadow-sm">
                        {landmark.photos?.[0] ? (
                          <img src={landmark.photos[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        {landmark.architect && (
                          <>
                            <p className="text-[10px] text-[#A8A294] font-bold uppercase">{selectedLanguage === 'ko' ? '건축가' : 'Architect'}</p>
                            <p className="text-sm font-bold text-[#5D574D]">{landmark.architect}</p>
                          </>
                        )}
                        <p className="text-[10px] text-[#A8A294] font-bold uppercase">{selectedLanguage === 'ko' ? '좌표' : 'GPS'}</p>
                        <p className="text-[10px] font-mono font-bold text-[#3498DB]">{landmark.lat.toFixed(4)}, {landmark.lng.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Info */}
                  <div className="bg-white/60 rounded-3xl p-5 border border-white/80 space-y-3">
                    <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                      <Clock className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '운용 정보' : 'Operation'}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#A8A294]">{selectedLanguage === 'ko' ? '운영 시간' : 'Hours'}</span>
                        <span className="font-bold text-[#5D574D]">{landmark.openingHours || 'Sunrise - Sunset'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#A8A294]">{selectedLanguage === 'ko' ? '입장료' : 'Entry Fee'}</span>
                        <span className="font-bold text-[#E67E22]">{landmark.priceRange || 'Contact local operator'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 🌐 [Bug Doctor] Information Buttons Added Exactly as Requested */}
                  <div className="bg-white/60 rounded-3xl p-5 border border-white/80 space-y-4">
                    <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                      <Globe className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '추가 탐색' : 'Explore More'}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-16 gap-1 rounded-xl border-[#EFEBE6] text-[#5D574D] hover:border-[#E67E22] hover:bg-orange-50/20 active:scale-95 transition-all"
                        onClick={() => window.open(getWikiUrl(getTranslatedContent(landmark, selectedLanguage, 'name'), selectedLanguage), '_blank')}
                      >
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-bold">Wikipedia</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-16 gap-1 rounded-xl border-[#EFEBE6] text-[#5D574D] hover:border-[#E67E22] hover:bg-orange-50/20 active:scale-95 transition-all"
                        onClick={() => window.open(getGoogleSearchUrl(`${getTranslatedContent(landmark, selectedLanguage, 'name')} tourism info`), '_blank')}
                      >
                        <Info className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-bold">{selectedLanguage === 'ko' ? '관광정보' : 'Tourism'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-16 gap-1 rounded-xl border-[#EFEBE6] text-[#5D574D] hover:border-[#E67E22] hover:bg-orange-50/20 active:scale-95 transition-all"
                        onClick={() => window.open(getGoogleSearchUrl(getTranslatedContent(landmark, selectedLanguage, 'name')), '_blank')}
                      >
                        <Search className="w-4 h-4 text-orange-500" />
                        <span className="text-[10px] font-bold">{selectedLanguage === 'ko' ? '구글검색' : 'Search'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Booking & Ticket Tab */}
              <TabsContent value="booking" className="p-0 m-0 space-y-6 pb-32">
                <div className="px-4 pt-6 text-center space-y-2">
                  <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#E67E22] shadow-sm">
                    <Ticket className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg text-[#5D574D]">{selectedLanguage === 'ko' ? '티켓 및 액티비티' : 'Tickets & Activities'}</h4>
                  <p className="text-xs text-[#A8A294] px-4 whitespace-nowrap">{selectedLanguage === 'ko' ? '플랫폼 파트너를 통한 최저가 예약' : 'Best deals via our platform partners'}</p>
                </div>

                {/* [어벤져스 팀 | 2026-03-20] 실시간 동기화된 최저가 예약 버튼 활성화 */}
                {landmark.reservationUrl && (
                  <div className="mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-indigo-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white border-none">Best Price</Badge>
                        <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Recommended</span>
                      </div>
                      <TrendingUp className="w-4 h-4 opacity-50" />
                    </div>
                    <h3 className="text-lg font-black mb-1">
                      {selectedLanguage === 'ko' ? '최저가 보장 예약' : 'Lowest Price Guaranteed'}
                    </h3>
                    <p className="text-xs opacity-70 mb-4 leading-relaxed">
                      {selectedLanguage === 'ko'
                        ? '글로벌 플랫폼을 통한 공식 예약 링크입니다. 수수료 없이 안전하게 예약하세요.'
                        : 'Official link through global platforms. Book safely with no hidden fees.'}
                    </p>
                    <Button
                      className="w-full bg-white text-indigo-700 hover:bg-slate-50 font-black h-12 rounded-xl shadow-lg border-none"
                      onClick={() => window.open(landmark.reservationUrl!, '_blank')}
                    >
                      {selectedLanguage === 'ko' ? '지금 바로 예약하기' : 'Book Now'}
                    </Button>
                  </div>
                )}

                <div className="px-4 space-y-3">
                  {/* [Bug Doctor] Detailed Description placed below reservation title as requested */}
                  <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-100 text-sm text-[#5D574D] leading-relaxed">
                    <p className="font-medium">
                      {selectedLanguage === 'ko'
                        ? '기항지에서의 특별한 경험을 놓치지 마세요. 아래 제휴 플랫폼을 통해 현지 티켓 및 액티비티를 손쉽게 예약하실 수 있습니다.'
                        : 'Don\'t miss out on special experiences. Best deals via our platform partners.'}
                    </p>
                  </div>

                  {/* [Bug Doctor 2026-02-26]
                   * searchName: 영어 이름 우선, 없으면 현재 언어 이름으로 fallback
                   * 이유: Klook/Viator/Trip.com 등 글로벌 플랫폼은 영어로 검색해야 결과 풍부
                   */}
                  {(() => {
                    // [적요] 영문명을 기본 검색어로 사용하되 글로벌 플랫폼 검색에 최적화
                    const searchName = getTranslatedContent(landmark, 'en', 'name') ||
                      getTranslatedContent(landmark, selectedLanguage, 'name');

                    // [Bug Doctor] 모든 제휴 플랫폼 정의
                    const allPlatforms = [
                      {
                        id: 'myrealtrip',
                        name: 'MyRealTrip (마이리얼트립)',
                        icon: <ExternalLink className="w-4 h-4 text-[#2B96ED]" />,
                        url: getMyRealTripUrl(getTranslatedContent(landmark, 'ko', 'name') || searchName),
                        tip: '🇰🇷 한국 결제 특화 · 취소 정책 상품별 상이',
                        tipEn: '🇰🇷 Korean card required · Cancellation varies',
                        color: 'text-[#2B96ED]',
                        badge: 'bg-blue-100 text-[#2B96ED]',
                      },
                      {
                        id: 'klook',
                        name: 'Klook (클룩)',
                        icon: <ExternalLink className="w-4 h-4 text-[#E9633F]" />,
                        url: getKlookUrl(searchName, selectedLanguage),
                        tip: '📱 아시아 특화 · 모바일 바우처 즉시 발급',
                        tipEn: '📱 Asia-focused · Instant mobile voucher',
                        color: 'text-[#E9633F]',
                        badge: 'bg-orange-50 text-[#E9633F]',
                      },
                      {
                        id: 'getyourguide',
                        name: 'GetYourGuide',
                        icon: <ExternalLink className="w-4 h-4 text-red-400" />,
                        url: getGYGUrl(searchName, selectedLanguage),
                        tip: '✅ 유럽 특화 · 48시간 전 무료취소',
                        tipEn: '✅ Europe-focused · Free cancel 48h before',
                        color: 'text-red-400',
                        badge: 'bg-red-50 text-red-400',
                      },
                      {
                        id: 'trip',
                        name: 'Trip.com (트립닷컴)',
                        icon: <ExternalLink className="w-4 h-4 text-blue-600" />,
                        url: getTripUrl(searchName),
                        tip: '💰 중화권 특화 · 포인트 적립',
                        tipEn: '💰 Asia-focused · Points rewards',
                        color: 'text-blue-600',
                        badge: 'bg-blue-50 text-blue-600',
                      },
                      {
                        id: 'viator',
                        name: 'Viator Inc',
                        icon: <ExternalLink className="w-4 h-4 text-blue-400" />,
                        url: getViatorUrl(searchName, selectedLanguage),
                        tip: '🌍 미주 특화 · TripAdvisor 파트너',
                        tipEn: '🌍 Americas-focused · TripAdvisor company',
                        color: 'text-blue-400',
                        badge: 'bg-blue-50 text-blue-400',
                      },
                    ];

                    // [적요] 언어별 노출 우선순위 결정
                    let recommendedIds: string[] = [];

                    switch (selectedLanguage) {
                      case 'ko':
                        // 한국어: 마이리얼트립, 클룩, 트립닷컴, 겟유어가이드
                        recommendedIds = ['myrealtrip', 'klook', 'trip', 'getyourguide'];
                        break;
                      case 'ja':
                      case 'zh':
                      case 'th':
                      case 'vi':
                      case 'id':
                        // 아시아권: 클룩, 트립닷컴, 겟유어가이드
                        recommendedIds = ['klook', 'trip', 'getyourguide'];
                        break;
                      case 'en':
                      case 'es':
                      case 'fr':
                      case 'de':
                      case 'it':
                      default:
                        // 영미권/유럽 등: 겟유어가이드, 비아터, 클룩
                        recommendedIds = ['getyourguide', 'viator', 'klook'];
                        break;
                    }

                    // 우선순위에 따라 플랫폼을 선별하고 정렬
                    const recommendedPlatforms = recommendedIds.map(
                      id => allPlatforms.find(p => p.id === id)!
                    );

                    return recommendedPlatforms.map((option, i) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        className={`w-full justify-between items-center h-auto py-3 bg-white border-[#EFEBE6] text-[#5D574D] rounded-2xl hover:bg-white hover:border-[#E67E22] hover:shadow-md transition-all group ${i === 0 ? 'border-[#2B96ED] bg-blue-50/10' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log(`🔗 [Link Diagnostic] Opening: ${option.name}, URL: ${option.url}`);
                          const win = window.open(option.url, '_blank', 'noopener,noreferrer');
                          if (!win) {
                            console.error("🚑 [Bug Doctor] Popup blocked for " + option.name);
                            alert(selectedLanguage === 'ko' ? '팝업 차단이 감지되었습니다. 허용 후 다시 시도해주세요.' : 'Popup blocked. Please allow popups and try again.');
                          }
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#FCF9F6] flex items-center justify-center shrink-0 group-hover:bg-orange-50">
                            {option.icon}
                          </div>
                          {/* [적요] 1순위 항목은 추천 뱃지 표시 */}
                          <div className="flex flex-col items-start gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs sm:text-sm">{option.name}</span>
                              {i === 0 && (
                                <span className="text-[8px] bg-[#E67E22] text-white px-1.5 py-0.5 rounded-sm font-black tracking-wide uppercase">
                                  {selectedLanguage === 'ko' ? '추천' : 'Best'}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] font-medium leading-tight ${option.color} opacity-80 truncate max-w-[200px]`}>
                              {selectedLanguage === 'ko' ? option.tip : option.tipEn}
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold shrink-0 ml-1 ${option.badge}`}>Book</div>
                      </Button>
                    ));
                  })()}

                </div>

                <div className="px-6 py-4">
                  <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50 flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-600/80 leading-normal">
                      {selectedLanguage === 'ko'
                        ? '예약 시 파트너사로부터 소정의 수수료를 지급받을 수 있으며, 이는 투어 콘텐츠 개발에 사용됩니다.'
                        : 'Booking via these links helps support our content development through small affiliate commissions at no extra cost to you.'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Shopping & Souvenirs Tab */}
              <TabsContent value="shopping" className="p-0 m-0 space-y-6 pb-32">
                <div className="px-4 pt-6 text-center space-y-2">
                  <div className="w-16 h-16 bg-[#FDF2F2] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#E67E22] shadow-sm">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg text-[#5D574D]">{selectedLanguage === 'ko' ? '로컬 프리미엄 기프트' : 'Local Premium Gifts'}</h4>
                  <p className="text-xs text-[#A8A294] px-4">{selectedLanguage === 'ko' ? '장인의 정신이 깃든 엄선된 기념품을 만나보세요' : 'Discover curated souvenirs from local artisans'}</p>
                </div>

                <div className="px-4 grid grid-cols-1 gap-4">
                  {(() => {
                    if (shopifyProducts.length === 0) {
                      // ✅ [Bug Doctor | 2026-02-27] Shopify API가 없을 때 여행 관련 샘플 상품 표시
                      // 학생들에게: 실제 Shopify 연동 전 여행 상품 카테고리로 UI/UX를 시연합니다.
                      const sampleProducts = [
                        {
                          id: 'travel-1',
                          title: selectedLanguage === 'ko' ? '🎧 크루즈 오디오 가이드 이어폰 세트' : '🎧 Cruise Audio Guide Earphone Set',
                          description: selectedLanguage === 'ko' ? '노이즈 캔슬링 내장 고품질 여행용 이어폰 - 오디오 투어 전용' : 'Premium noise-cancelling earphones for audio tour experiences',
                          price: '34.99',
                          currencyCode: 'USD',
                          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
                          checkoutUrl: 'https://shopify.com',
                        },
                        {
                          id: 'travel-2',
                          title: selectedLanguage === 'ko' ? '🗺️ 유럽 기항지 여행 가이드북 (한·영)' : '🗺️ European Port City Travel Guidebook (EN/KO)',
                          description: selectedLanguage === 'ko' ? '크루즈 기항지 30개 도시 수록 · 오프라인 지도 포함' : '30 cruise port cities covered · Offline maps included',
                          price: '19.90',
                          currencyCode: 'USD',
                          image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=200&h=200&fit=crop',
                          checkoutUrl: 'https://shopify.com',
                        },
                        {
                          id: 'travel-3',
                          title: selectedLanguage === 'ko' ? '🧳 프리미엄 여행용 짐표 세트 (10개)' : '🧳 Premium Luggage Tag Set (Pack of 10)',
                          description: selectedLanguage === 'ko' ? '크루즈 여행 필수품 · 방수 · RFID 차단 기능' : 'Cruise travel essential · Waterproof · RFID blocking',
                          price: '14.50',
                          currencyCode: 'USD',
                          image: 'https://images.unsplash.com/photo-1553531889-e6cf4d692b1b?w=200&h=200&fit=crop',
                          checkoutUrl: 'https://shopify.com',
                        },
                        {
                          id: 'travel-4',
                          title: selectedLanguage === 'ko' ? '📡 글로벌 여행용 eSIM (15일, 유럽 30국)' : '📡 Global Travel eSIM (15 Days, 30 EU Countries)',
                          description: selectedLanguage === 'ko' ? '크루즈 기항지 전 지역 데이터 지원 · 즉시 개통' : 'Works at all cruise ports in Europe · Instant activation',
                          price: '29.00',
                          currencyCode: 'USD',
                          image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=200&h=200&fit=crop',
                          checkoutUrl: 'https://shopify.com',
                        },
                        {
                          id: 'travel-5',
                          title: selectedLanguage === 'ko' ? '☂️ 크루즈 여행자 보험 (7일)' : '☂️ Cruise Traveler Insurance (7 Days)',
                          description: selectedLanguage === 'ko' ? '기항지 액티비티 및 응급처치 포함 · 실시간 지원' : 'Covers port excursions & emergencies · 24/7 support',
                          price: '18.00',
                          currencyCode: 'USD',
                          image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&h=200&fit=crop',
                          checkoutUrl: 'https://shopify.com',
                        },
                      ];
                      return sampleProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-3xl p-4 border border-[#EFEBE6] shadow-sm flex gap-4 group transition-all hover:shadow-md active:scale-[0.98]">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#FCF9F6] shrink-0 border border-white shadow-inner">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-[9px] bg-blue-100 text-blue-600 font-black px-2 py-0.5 rounded-full">✈️ TRAVEL</span>
                              </div>
                              <h5 className="font-bold text-sm text-[#5D574D] line-clamp-2">{product.title}</h5>
                              <p className="text-[10px] text-[#A8A294] line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-extrabold text-[#E67E22] text-sm">{product.currencyCode} {product.price}</span>
                              <span className="text-[9px] text-gray-400 italic">{selectedLanguage === 'ko' ? '샘플 여행상품' : 'Sample'}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    }

                    return shopifyProducts.map((product) => (
                      <div key={product.id} className="bg-white rounded-3xl p-4 border border-[#EFEBE6] shadow-sm flex gap-4 group transition-all hover:shadow-md active:scale-[0.98]">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#FCF9F6] shrink-0 border border-white shadow-inner">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h5 className="font-bold text-sm text-[#5D574D] line-clamp-1">{product.title}</h5>
                            <p className="text-[10px] text-[#A8A294] line-clamp-2 mt-1 leading-relaxed">{product.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-extrabold text-[#E67E22] text-sm">{product.currencyCode} {product.price}</span>
                            <Button
                              size="sm"
                              className="h-8 px-4 bg-[#5D574D] hover:bg-[#433E37] text-white rounded-xl text-[10px] font-bold gap-1.5 transition-all"
                              onClick={() => window.open(product.checkoutUrl, '_blank')}
                            >
                              <CreditCard className="w-3 h-3" />
                              {selectedLanguage === 'ko' ? '지금 구매' : 'Buy Now'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="px-6 py-4">
                  <div className="p-4 rounded-2xl border border-gray-100 bg-[#FCF9F6] flex gap-3">
                    <Globe className="w-5 h-5 text-[#A8A294] shrink-0 mt-0.5" />
                    <p className="text-[9px] text-[#A8A294] leading-normal uppercase font-black">
                      Powered by Shopify Storefront
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Sticky Footer - Always visible at bottom */}
          <div className="p-4 bg-white/90 backdrop-blur-xl border-t shrink-0 flex gap-3 h-24 items-center shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-50">
            <Button
              onClick={() => onNavigate(landmark)}
              className="flex-1 h-14 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-2xl gap-2 font-bold shadow-xl shadow-orange-100 transition-all active:scale-[0.97]"
            >
              <Navigation className="w-5 h-5" />
              <span className="text-base">{selectedLanguage === 'ko' ? '길 안내 시작' : 'Get Directions'}</span>
            </Button>
            <Button
              onClick={() => onAddToTour?.(landmark)}
              variant="outline"
              className="flex-[0.6] h-14 border-2 border-[#EFEBE6] text-[#5D574D] rounded-2xl font-bold bg-white hover:bg-[#FCF9F6] transition-all active:scale-[0.97]"
            >
              <div className="flex flex-col items-center">
                <span className="text-lg leading-tight">+</span>
                <span className="text-[10px] uppercase font-black">{selectedLanguage === 'ko' ? '투어 담기' : 'Add to Tour'}</span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent >
    </Dialog >
  );
}
