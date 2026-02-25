import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import PhotoGallery from './PhotoGallery';
import { Navigation, MapPinned, MapPin, Play, Pause, RotateCcw, Ticket, ExternalLink, Clock, Euro, ChefHat, Phone, Utensils, Activity as ActivityIcon, Landmark as LandmarkIcon, Info, Image as ImageIcon, Calendar, CreditCard, Share2, Globe, BookOpen, Search, Home, Trophy, Award, Camera, Smile, Upload, Download } from 'lucide-react';
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { audioService, AudioService } from '@/lib/audioService';
import { getGYGUrl, getViatorUrl, getKlookUrl, getTripUrl, getGoogleSearchUrl, getWikiUrl, getMyRealTripUrl, getGoogleMapsUrl, getCatchTableUrl, getTheForkUrl } from '@/lib/affiliateConfig';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch guides for this landmark
  const { data: guides = [] } = useQuery<DbLandmarkGuide[]>({
    queryKey: [`/api/landmarks/${encodeURIComponent(landmark?.id || '')}/guides`],
    enabled: !!landmark,
  });

  // Reset selected guide when landmark changes
  useEffect(() => {
    setSelectedGuideId(null);
  }, [landmark]);

  const selectedGuide = useMemo(() => {
    return guides.find(g => g.id === selectedGuideId) || null;
  }, [guides, selectedGuideId]);

  const currentDetailedDescription = useMemo(() => {
    if (selectedGuide) {
      return getTranslatedContent(selectedGuide as any, selectedLanguage, 'detailedDescription');
    }
    return getTranslatedContent(landmark as any, selectedLanguage, 'detailedDescription');
  }, [landmark, selectedGuide, selectedLanguage]);

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
      ? (selectedGuide ? getTranslatedContent(selectedGuide as any, selectedLanguage, 'description') : getTranslatedContent(landmark, selectedLanguage, 'description'))
      : currentDetailedDescription;

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
      ? (selectedGuide ? getTranslatedContent(selectedGuide as any, selectedLanguage, 'description') : getTranslatedContent(landmark, selectedLanguage, 'description'))
      : currentDetailedDescription;
    if (!text) return [];
    return AudioService.splitIntoSentences(text);
  }, [landmark, selectedGuide, selectedLanguage, audioContentType, currentDetailedDescription]);

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
                <DialogTitle className="text-xl font-bold mb-1" data-testid="text-landmark-detail-name">
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="bg-[#FFF1EB] text-[#E67E22] border-[#FFE0D1] py-0 px-2 rounded-full text-[10px] font-bold">
                    {landmark?.category}
                  </Badge>
                  <span>•</span>
                  <span className="line-clamp-1 opacity-80">{getTranslatedContent(landmark, selectedLanguage, 'description')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 h-8">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#FCF9F6] border border-[#EFEBE6]" onClick={handleDialogClose}>
                  <RotateCcw className="w-4 h-4 text-[#A8A294]" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#FCF9F6] border border-[#EFEBE6]" onClick={handleDialogClose}>
                  <Navigation className="w-4 h-4 text-[#E67E22]" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Tabs - Middle Content area should be scrollable */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 pt-4 bg-[#FCF9F6] border-b shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-[#EFEBE6] rounded-xl p-1 h-11">
                <TabsTrigger value="history" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '역사/나레이션' : 'History/Narration'}
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '지도/정보' : 'Map/Info'}
                </TabsTrigger>
                <TabsTrigger value="booking" className="rounded-lg text-xs font-bold data-[state=active]:bg-[#E67E22] data-[state=active]:text-white transition-all duration-200">
                  {selectedLanguage === 'ko' ? '티켓/예약' : 'Book/Ticket'}
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
                      getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')
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
                  <div
                    className="w-full h-40 rounded-3xl relative overflow-hidden bg-white border-2 border-white shadow-xl cursor-pointer transition-transform active:scale-[0.98]"
                    onClick={() => window.open(`https://www.google.com/maps?q=${landmark.lat},${landmark.lng}`, '_blank')}
                  >
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#34A853 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-red-400/20 rounded-full animate-ping" />
                        <div className="w-10 h-10 bg-[#EA4335] rounded-full flex items-center justify-center shadow-lg border-2 border-white relative">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#EA4335] bg-white px-2 py-0.5 rounded-full shadow-sm">View on Google Maps</span>
                    </div>
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
                    // [적요] 영어 이름을 검색에 사용 (글로벌 플랫폼 검색 최적화)
                    const searchName = getTranslatedContent(landmark, 'en', 'name') ||
                      getTranslatedContent(landmark, selectedLanguage, 'name');
                    return [
                      {
                        name: 'MyRealTrip (마이리얼트립)',
                        icon: <ExternalLink className="w-4 h-4 text-[#2B96ED]" />,
                        // [적요] MyRealTrip은 한국어 이름으로 검색 (한국 플랫폼)
                        url: getMyRealTripUrl(getTranslatedContent(landmark, 'ko', 'name') || searchName),
                        tip: '🇰🇷 한국어 지원 · 한국 카드 결제 · 취소 정책 상품별 상이',
                        tipEn: '🇰🇷 Korean only · Korean card required · Cancellation varies per product',
                        color: 'text-[#2B96ED]',
                        badge: 'bg-blue-100 text-[#2B96ED]',
                      },
                      {
                        name: 'GetYourGuide',
                        icon: <ExternalLink className="w-4 h-4 text-red-400" />,
                        // [적요] 영어 이름으로 검색 - 글로벌 플랫폼
                        url: getGYGUrl(searchName, 'en'),
                        tip: '✅ 48시간 전 무료취소 · 글로벌 카드 가능 · 즉시 확정',
                        tipEn: '✅ Free cancel 48h before · Global cards OK · Instant confirmation',
                        color: 'text-red-400',
                        badge: 'bg-red-50 text-red-400',
                      },
                      {
                        name: 'Trip.com (트립닷컴)',
                        icon: <ExternalLink className="w-4 h-4 text-blue-600" />,
                        // [적요] 영어 이름으로 검색 - Trip.com 글로벌
                        url: getTripUrl(searchName),
                        tip: '💰 포인트 적립 가능 · 취소정책 상품별 확인 필수',
                        tipEn: '💰 Points rewards · Check cancellation policy per item',
                        color: 'text-blue-600',
                        badge: 'bg-blue-50 text-blue-600',
                      },
                      {
                        name: 'Klook (클룩)',
                        icon: <ExternalLink className="w-4 h-4 text-[#E9633F]" />,
                        // [적요] 영어 이름으로 검색 - Klook 글로벌 검색 최적화
                        url: getKlookUrl(searchName, 'en-US'),
                        tip: '📱 모바일 바우처 즉시 발급 · 아시아 여행 특화 · 즉시 확정',
                        tipEn: '📱 Instant mobile voucher · Asia-focused · Instant confirmation',
                        color: 'text-[#E9633F]',
                        badge: 'bg-orange-50 text-[#E9633F]',
                      },
                      {
                        name: 'Viator Inc',
                        icon: <ExternalLink className="w-4 h-4 text-blue-400" />,
                        // [적요] 영어 이름으로 검색 - Viator 영어 특화
                        url: getViatorUrl(searchName, 'en-US'),
                        tip: '🌍 TripAdvisor 계열 · 24시간 전 무료취소 · 영어 위주',
                        tipEn: '🌍 TripAdvisor company · Free cancel 24h before · English-focused',
                        color: 'text-blue-400',
                        badge: 'bg-blue-50 text-blue-400',
                      },
                    ].map((option, i) => (
                      <Button
                        key={i}
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
                          {/* [적요] 플랫폼명 + 주의사항 2행 구조 */}
                          <div className="flex flex-col items-start gap-0.5 min-w-0">
                            <span className="font-bold text-xs sm:text-sm">{option.name}</span>
                            <span className={`text-[9px] font-medium leading-tight ${option.color} opacity-80 truncate max-w-[200px]`}>
                              {selectedLanguage === 'ko' ? option.tip : option.tipEn}
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold shrink-0 ml-1 ${option.badge}`}>Book</div>
                      </Button>
                    ))
                    // [적요] IIFE(즉시실행함수) 닫는 괄호
                  })()
                  }

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
      </DialogContent>
    </Dialog>
  );
}
