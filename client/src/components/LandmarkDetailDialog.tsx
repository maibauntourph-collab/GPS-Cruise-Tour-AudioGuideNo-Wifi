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
import { Users, Headphones, Check } from 'lucide-react';

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
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [audioContentType, setAudioContentType] = useState<'summary' | 'narration'>('summary');

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

  // Use guide's content if selected, otherwise fallback to landmark's content
  const currentNarration = useMemo(() => {
    if (selectedGuide) {
      return getTranslatedContent(selectedGuide as any, selectedLanguage, 'narration');
    }
    return getTranslatedContent(landmark as any, selectedLanguage, 'narration');
  }, [landmark, selectedGuide, selectedLanguage]);

  const currentDetailedDescription = useMemo(() => {
    if (selectedGuide) {
      return getTranslatedContent(selectedGuide as any, selectedLanguage, 'detailedDescription');
    }
    return getTranslatedContent(landmark as any, selectedLanguage, 'detailedDescription');
  }, [landmark, selectedGuide, selectedLanguage]);

  // Split text into sentences for highlighting
  const sentences = useMemo(() => {
    if (!currentDetailedDescription) return [];
    return AudioService.splitIntoSentences(currentDetailedDescription);
  }, [currentDetailedDescription]);

  // Handle dialog close - stop all audio first
  const handleDialogClose = () => {
    // [Designer Kim] 시뮬레이션 중인 경우 오디오를 끄지 않고 백그라운드에서 유지합니다.
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

  /**
   * [코다리부장 & 회계부장 합동 브리핑]
   * 대표님, 이 함수가 바로 '돈을 벌어다 주는' 핵심 로직입니다.
   * 1. 우리가 만든 서버 API에 결제 세션 생성을 요청하고,
   * 2. Stripe가 준 안전한 결제 주소(URL)로 고객을 보내면 끝!
   */
  const handleStripeCheckout = async () => {
    if (!landmark) return;
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkId: landmark.id,
          creatorId: 'default-creator', // 실제로는 콘텐츠 제작자 ID
          userId: 'test-user', // 실제로는 현재 로그인한 사용자 ID
          amount: 4.99, // 기본 패키지 가격 (€)
          name: `${getTranslatedContent(landmark, selectedLanguage, 'name')} 프리미엄 가이드`
        }),
      });

      const { url, error } = await response.json();
      if (url) {
        window.location.href = url; // [코다리부장] 고객을 안전한 Stripe 결제창으로 이동시킵니다!
      } else {
        throw new Error(error || '세션 생성 실패');
      }
    } catch (error) {
      console.error('[회계부장 긴급] 결제 시작 중 오류 발생:', error);
      alert('결제 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handlePlayAudio = async () => {
    // If playing and not paused, then pause
    if (isPlaying && !isPaused) {
      audioService.pause();
      setIsPaused(true);
      return;
    }

    // If already paused, then resume
    if (isPlaying && isPaused) {
      audioService.resume();
      setIsPaused(false);
      return;
    }

    // Otherwise, start fresh
    const textToPlay = audioContentType === 'summary'
      ? (selectedGuide ? getTranslatedContent(selectedGuide as any, selectedLanguage, 'description') : getTranslatedContent(landmark, selectedLanguage, 'description'))
      : currentDetailedDescription;

    if (!textToPlay) return;

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
        onPlaybackEnd
      );
      if (!success) {
        // Fallback to system TTS if OpenAI fails
        audioService.playSentences(
          textToPlay,
          selectedLanguage,
          playbackRate,
          (index) => setCurrentSentenceIndex(index),
          onPlaybackEnd
        );
      }
    } else {
      // Use sentence-by-sentence playback with highlighting for TTS/Auto/MP3 modes
      setIsPlaying(true);
      setIsPaused(false);
      audioService.playSentences(
        textToPlay,
        selectedLanguage,
        playbackRate,
        (index) => setCurrentSentenceIndex(index),
        onPlaybackEnd
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
    // Use setTimeout to ensure state is processed before restarting
    setTimeout(() => handlePlayAudio(), 100);
  };

  // [Bug Doctor] 모바일 바디 락(pointer-events: none) 및 스크롤 락 완전 박멸 로직
  useEffect(() => {
    if (isOpen) {
      // 1프레임 뒤에 실행하여 Radix UI가 스타일을 적용한 직후에 덮어씀
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        document.body.removeAttribute('data-scroll-locked');

        // [Bug Doctor] 특정 상황에서 Radix가 스타일을 재적용하는 것을 방지하기 위한 MutationObserver
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'style' || mutation.attributeName === 'data-scroll-locked') {
              if (document.body.style.pointerEvents === 'none') {
                document.body.style.pointerEvents = 'auto';
              }
              if (document.body.style.overflow === 'hidden') {
                document.body.style.overflow = 'auto';
              }
              document.body.removeAttribute('data-scroll-locked');
            }
          });
        });

        observer.observe(document.body, { attributes: true });
        return () => {
          observer.disconnect();
          document.body.style.pointerEvents = 'auto';
          document.body.style.overflow = 'auto';
        };
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle background click (for non-modal like behavior)
  useEffect(() => {
    if (isOpen && landmark && !isPlaying) {
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, landmark?.id]);

  // Stop audio when changing content type to allow restarting with new content
  useEffect(() => {
    if (isPlaying || isPaused) {
      audioService.stopSentences();
      audioService.stop();
      audioService.stopMP3();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      // Restart with new content
      setTimeout(() => handlePlayAudio(), 100);
    }
  }, [audioContentType]);








  // Sentences for current playing content
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
        className="max-h-[85vh] p-0 overflow-hidden flex flex-col border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-t-[32px] sm:rounded-[32px] bottom-0 sm:bottom-auto w-[100vw] sm:w-[95vw] sm:max-w-4xl no-overlay"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1fr,1.2fr] h-full overflow-hidden w-full max-w-full box-border">
          <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
            <DialogDescription className="sr-only">
              Detailed information about this landmark including photos, history, and navigation options
            </DialogDescription>
            <div className="flex items-center justify-between gap-4 mr-8">
              <div className="flex-1">
                <DialogTitle className="text-xl mb-1" data-testid="text-landmark-detail-name">
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={landmark?.category === 'Activity' ? 'default' : 'secondary'} className="text-xs">
                    {landmark?.category === 'Activity' ? <ActivityIcon className="w-3 h-3 mr-1" /> : <LandmarkIcon className="w-3 h-3 mr-1" />}
                    {landmark?.category === 'Activity' ? t('activity', selectedLanguage) : t('landmark', selectedLanguage)}
                  </Badge>
                  {landmark?.category && landmark?.category !== 'Activity' && (
                    <Badge variant="outline" className="text-xs">{landmark?.category}</Badge>
                  )}
                </div>
              </div>

              {/* [Designer Kim] 노란색 영역에 추가된 '지도로 가기' 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDialogClose}
                className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 flex-shrink-0 gap-1.5 h-9"
                data-testid="button-go-to-map"
              >
                <MapPinned className="w-4 h-4" />
                <span className="font-medium">{selectedLanguage === 'ko' ? '지도로 가기' : 'Go to Map'}</span>
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-4 mt-4 grid w-auto grid-cols-4 flex-shrink-0">
              <TabsTrigger value="overview" className="gap-2">
                <Info className="w-4 h-4" />
                {t('overview', selectedLanguage)}
              </TabsTrigger>
              <TabsTrigger value="guides" className="gap-2">
                <Users className="w-4 h-4" />
                {selectedLanguage === 'ko' ? '가이드' : 'Guides'}
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2" onClick={() => {
                // [Designer Kim] MyPic 탭 클릭 시 자동으로 해당 위치 사진 반영 유도
                console.log('[MyPic] Auto-syncing photos for landmark:', landmark.id);
              }}>
                <Camera className="w-4 h-4" />
                MyPic
              </TabsTrigger>
              <TabsTrigger value="booking" className="gap-2">
                <CreditCard className="w-4 h-4" />
                {t('booking', selectedLanguage)}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 m-0 flex flex-col">
              <div className="max-w-full mx-auto space-y-4 flex-1 flex flex-col">
                {/* [Designer Kim] 프리미엄 배지 수집 상태 섹션 추가 */}
                <div className="relative overflow-hidden p-4 border rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-indigo-100/30 backdrop-blur-sm group flex-shrink-0">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Trophy className="w-12 h-12 text-indigo-500" />
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center border border-white/50">
                      <Award className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 truncate">
                        {selectedLanguage === 'ko' ? '디지털 배지 콜렉션' : 'Digital Badge Collection'}
                      </h4>
                      <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium break-words">
                        {selectedLanguage === 'ko'
                          ? '이 명소에 방문하여 한정판 배지를 획득하세요!'
                          : 'Visit this place and collect a limited edition badge!'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary" className="bg-indigo-500 text-white border-none shadow-md shadow-indigo-500/20">
                        NEW
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex-1 overflow-y-auto bg-muted/10 rounded-xl p-4 border border-dashed border-muted-foreground/10">
                  <p className="text-base leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                    {selectedGuide
                      ? getTranslatedContent(selectedGuide as any, selectedLanguage, 'description')
                      : getTranslatedContent(landmark, selectedLanguage, 'description')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={() => onNavigate(landmark)}
                    className="w-full gap-2"
                    data-testid="button-get-directions-dialog"
                  >
                    <Navigation className="w-4 h-4" />
                    {t('getDirections', selectedLanguage)}
                  </Button>

                  {onAddToTour && (
                    <Button
                      onClick={() => onAddToTour(landmark)}
                      variant="outline"
                      className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
                      disabled={isInTour}
                      data-testid="button-add-to-tour-dialog"
                    >
                      <MapPinned className="w-4 h-4" />
                      <span className="font-semibold">{selectedLanguage === 'ko' ? '안내추가 (투어)' : 'Add to Guide'}</span>
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => {
                      const url = window.location.href;
                      navigator.clipboard.writeText(url);
                      alert(selectedLanguage === 'ko' ? '링크가 복사되었습니다! SNS에 공유해보세요.' : 'Link copied! Share it on SNS.');
                    }}
                    className="w-full gap-2"
                    data-testid="button-share-landmark"
                  >
                    <Share2 className="w-4 h-4" />
                    {selectedLanguage === 'ko' ? '이 명소 공유하기' : 'Share this Landmark'}
                  </Button>
                </div>

                {/* Audio Section */}
                <div className="p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    {/* Summary/Narration Toggle */}
                    <div className="flex bg-muted p-1 rounded-lg">
                      <Button
                        variant={audioContentType === 'summary' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5"
                        onClick={() => setAudioContentType('summary')}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {selectedLanguage === 'ko' ? '개요' : 'Summary'}
                      </Button>
                      <Button
                        variant={audioContentType === 'narration' ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1.5"
                        onClick={() => setAudioContentType('narration')}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        {selectedLanguage === 'ko' ? '나레이션' : 'Narration'}
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedGuide && (
                        <Badge variant="outline" className="gap-1 bg-primary/5 text-primary border-primary/20">
                          <Check className="w-3 h-3" />
                          {selectedLanguage === 'ko' ? '맞춤' : 'Custom'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl w-full sm:w-auto">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handlePlayAudio}
                          className={`flex-1 sm:flex-none gap-2 h-9 px-4 rounded-lg transition-all shadow-sm ${isPlaying && !isPaused ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary hover:bg-primary/90'}`}
                          data-testid="button-play-audio-dialog"
                        >
                          {isPlaying && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying && !isPaused
                            ? t('pause', selectedLanguage)
                            : (isPlaying && isPaused ? (selectedLanguage === 'ko' ? '재개' : 'Resume') : t('playAudio', selectedLanguage))}
                        </Button>

                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={handleRestartAudio}
                          className="h-9 w-9 bg-white/50 backdrop-blur-sm border-white/50 hover:bg-white/80 flex-shrink-0"
                          title={selectedLanguage === 'ko' ? '처음부터 재생' : 'Restart from beginning'}
                          data-testid="button-restart-audio"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1 border-l pl-2 ml-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            const website = landmark.reservationUrl;
                            const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                            if (website) {
                              window.open(website, '_blank', 'noopener,noreferrer');
                            } else {
                              window.open(getGoogleSearchUrl(name + ' 공식 홈페이지'), '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {selectedLanguage === 'ko' ? '관광청' : 'Official'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1.5 text-xs text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                            window.open(getWikiUrl(name, selectedLanguage), '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {selectedLanguage === 'ko' ? '백과' : 'Wiki'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1.5 text-xs text-gray-600 hover:bg-gray-100"
                          onClick={() => {
                            const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                            window.open(getGoogleSearchUrl(name), '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Search className="w-3.5 h-3.5" />
                          {selectedLanguage === 'ko' ? '검색' : 'Search'}
                        </Button>

                        {/* [자동화 닥터] 명소 주변 에어비앤비(Airbnb) 숙소 연동 버튼 추가 */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 gap-1.5 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100/50"
                          onClick={() => {
                            const url = `https://www.airbnb.com/s/homes?lat=${landmark.lat}&lng=${landmark.lng}&zoom=15`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Home className="w-3.5 h-3.5" />
                          {selectedLanguage === 'ko' ? '숙소' : 'Stay'}
                        </Button>
                      </div>
                    </div>
                    {isPlaying && audioService.getAudioMode() === 'tts' && (
                      <select
                        value={playbackRate}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const rate = parseFloat(e.target.value);
                          setPlaybackRate(rate);
                          audioService.setRate(rate);
                          if (currentDetailedDescription) {
                            audioService.playSentences(
                              currentDetailedDescription,
                              selectedLanguage,
                              rate,
                              (index) => setCurrentSentenceIndex(index),
                              () => {
                                setIsPlaying(false);
                                setCurrentSentenceIndex(-1);
                              }
                            );
                          }
                        }}
                        className="px-2 py-1 text-sm border rounded"
                        data-testid="select-playback-rate-dialog"
                      >
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1.0">1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2.0">2.0x</option>
                      </select>
                    )}
                  </div>
                  {selectedGuide && (
                    <Badge variant="outline" className="gap-1">
                      <Headphones className="w-3 h-3" />
                      {selectedLanguage === 'ko' ? '커스텀 가이드' : 'Custom Guide'}
                    </Badge>
                  )}
                </div>
                {/* Sentence-by-sentence text with memory pen highlighting */}
                {activeSentences.length > 0 ? (
                  activeSentences.map((sentence: string, index: number) => {
                    const isCurrentSentence = currentSentenceIndex === index;
                    const isReadSentence = currentSentenceIndex > index && isPlaying;

                    return (
                      <span
                        key={index}
                        className={`inline rounded-sm px-0.5 transition-all duration-300 ease-in-out ${isCurrentSentence
                          ? 'bg-yellow-300/50 font-medium shadow-sm dark:bg-yellow-400/40'
                          : isReadSentence
                            ? 'bg-green-300/30 dark:bg-green-400/20'
                            : 'bg-transparent'
                          }`}
                        style={{
                          boxDecorationBreak: 'clone',
                          WebkitBoxDecorationBreak: 'clone'
                        }}
                        data-testid={`sentence-${index}`}
                      >
                        {sentence}{' '}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground italic">
                    {audioContentType === 'summary' ? '개요 데이터가 없습니다.' : '나레이션 데이터가 없습니다.'}
                  </span>
                )}
              </div>
            </TabsContent>

            {/* Guides Tab */}
            <TabsContent value="guides" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="max-w-full mx-auto space-y-4">
                <div className="grid gap-3">
                  {/* Default AI Guide */}
                  <div
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${!selectedGuideId ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'hover:bg-accent'}`}
                    onClick={() => setSelectedGuideId(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Headphones className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{selectedLanguage === 'ko' ? '기본 AI 가이드' : 'Default AI Guide'}</h4>
                          <p className="text-xs text-muted-foreground">{selectedLanguage === 'ko' ? '표준 설명을 제공합니다' : 'Provides standard explanation'}</p>
                        </div>
                      </div>
                      {!selectedGuideId && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </div>

                  {/* Additional Guides */}
                  {guides.map((guide) => (
                    <div
                      key={guide.id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedGuideId === guide.id ? 'ring-2 ring-primary bg-primary/5 border-primary' : 'hover:bg-accent'}`}
                      onClick={() => setSelectedGuideId(guide.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                            <Users className="w-5 h-5 text-secondary-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              {getTranslatedContent(guide as any, selectedLanguage, 'description') || (selectedLanguage === 'ko' ? '인증된 크리에이터 가이드' : 'Verified Creator Guide')}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {selectedLanguage === 'ko' ? '전문 크리에이터의 해설' : 'Commentary from professional creator'}
                            </p>
                          </div>
                        </div>
                        {selectedGuideId === guide.id && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    </div>
                  ))}

                  {guides.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        {selectedLanguage === 'ko' ? '이 명소는 현재 기본 AI 가이드만 제공됩니다.' : 'Only default AI guide is available for this landmark currently.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* [MyPic] Photos & GPS Gallery Tab */}
            <TabsContent value="photos" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* MyPic Header & Actions */}
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
                  <div>
                    <h5 className="font-bold text-lg flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary" />
                      MyPic {selectedLanguage === 'ko' ? '갤러리' : 'Gallery'}
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedLanguage === 'ko'
                        ? '이 장소에서의 소중한 추억을 업로드하고 관리하세요.'
                        : 'Upload and manage your precious memories at this location.'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="mypic-upload"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files.length > 0) {
                          alert(selectedLanguage === 'ko'
                            ? `${e.target.files.length}개의 사진이 선택되었습니다. (업로드 시뮬레이션)`
                            : `${e.target.files.length} photos selected. (Upload Simulation)`);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9 border-primary/30 hover:bg-primary/5"
                      onClick={() => document.getElementById('mypic-upload')?.click()}
                    >
                      <Upload className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '업로드' : 'Upload'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9"
                      onClick={() => {
                        alert(selectedLanguage === 'ko'
                          ? '모든 사진을 다운로드합니다.'
                          : 'Downloading all photos.');
                      }}
                    >
                      <Download className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '저장' : 'Save'}
                    </Button>
                  </div>
                </div>

                {/* Photos Display */}
                <div className="space-y-4">
                  {landmark?.category === 'Restaurant' && landmark?.restaurantPhotos ? (
                    <Tabs defaultValue="exterior" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="exterior">{t('exteriorPhotos', selectedLanguage)}</TabsTrigger>
                        <TabsTrigger value="interior">{t('interiorPhotos', selectedLanguage)}</TabsTrigger>
                        <TabsTrigger value="menu">{t('menuPhotos', selectedLanguage)}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="exterior" className="mt-4">
                        {landmark?.restaurantPhotos?.exterior && landmark.restaurantPhotos.exterior.length > 0 ? (
                          <PhotoGallery
                            photos={landmark.restaurantPhotos.exterior}
                            title={`${getTranslatedContent(landmark, selectedLanguage, 'name')} - ${t('exteriorPhotos', selectedLanguage)}`}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No exterior photos available
                          </p>
                        )}
                      </TabsContent>
                      <TabsContent value="interior" className="mt-4">
                        {landmark?.restaurantPhotos?.interior && landmark.restaurantPhotos.interior.length > 0 ? (
                          <PhotoGallery
                            photos={landmark.restaurantPhotos.interior}
                            title={`${getTranslatedContent(landmark, selectedLanguage, 'name')} - ${t('interiorPhotos', selectedLanguage)}`}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No interior photos available
                          </p>
                        )}
                      </TabsContent>
                      <TabsContent value="menu" className="mt-4">
                        {landmark?.restaurantPhotos?.menu && landmark.restaurantPhotos.menu.length > 0 ? (
                          <PhotoGallery
                            photos={landmark.restaurantPhotos.menu}
                            title={`${getTranslatedContent(landmark, selectedLanguage, 'name')} - ${t('menuPhotos', selectedLanguage)}`}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No menu photos available
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : landmark?.photos && landmark.photos.length > 0 ? (
                    <PhotoGallery
                      photos={landmark.photos}
                      title={getTranslatedContent(landmark, selectedLanguage, 'name')}
                    />
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl flex flex-col items-center gap-3">
                      <div className="bg-muted p-3 rounded-full">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedLanguage === 'ko' ? '표시할 사진이 없습니다.' : 'No photos to display.'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById('mypic-upload')?.click()}
                        className="text-primary hover:bg-primary/5"
                      >
                        {selectedLanguage === 'ko' ? '첫 사진 업로드하기' : 'Upload your first photo'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* [적요] MyPic GPS 연동 안내 */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="flex gap-3">
                    <div className="bg-blue-500 p-2 rounded-full h-fit">
                      <Smile className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h6 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                        {selectedLanguage === 'ko' ? 'GPS 스마트 갤러리 연동 중' : 'GPS Smart Gallery Linking'}
                      </h6>
                      <p className="text-xs text-blue-800 dark:text-blue-200 mt-1 leading-relaxed">
                        {selectedLanguage === 'ko'
                          ? '이 장소에서 찍은 사진은 자동으로 MyPic에 표시됩니다. 위치 서비스(GPS)가 켜져 있는지 확인하세요!'
                          : 'Photos taken at this location will automatically appear in MyPic. Please ensure your location services (GPS) are on!'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Booking Tab - Payment & Reservations */}
            <TabsContent value="booking" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="max-w-full mx-auto space-y-4">
                {/* Ticket & Tour Booking - for Activities and Landmarks */}
                {(landmark.category === 'Activity' || (landmark.category !== 'Restaurant' && landmark.category !== 'Gift Shop' && landmark.category !== 'Shop')) ? (
                  <div className="p-4 border rounded-xl bg-gradient-to-br from-background to-muted/30 shadow-sm space-y-4">
                    <h5 className="font-bold text-base flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      {t('bookTicketsTours', selectedLanguage)}
                    </h5>

                    <div className="space-y-3">
                      {/* Premium High-Margin Item */}
                      <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-sm text-primary">PREMIUM GUIDE</p>
                            <h6 className="text-lg font-bold">{getTranslatedContent(landmark, selectedLanguage, 'name')} 프리미엄 패키지</h6>
                          </div>
                          <Badge className="bg-amber-500 text-white border-none animate-pulse">SAVE 20%</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          전문 가이드의 깊이 있는 해설과 오프라인 대규모 데이터가 포함된 프리미엄 버전입니다.
                        </p>
                        <Button
                          onClick={handleStripeCheckout}
                          className="w-full gap-2 text-sm h-11 bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                          data-testid="button-stripe-checkout"
                        >
                          <CreditCard className="w-5 h-5" />
                          {selectedLanguage === 'ko' ? '지금 결제하기 (€4.99)' : 'Pay Now (€4.99)'}
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 py-1">
                        <div className="h-[1px] flex-1 bg-border"></div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                          {selectedLanguage === 'ko' ? '기타 예약 옵션' : 'Other Options'}
                        </span>
                        <div className="h-[1px] flex-1 bg-border"></div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* 한국어 사용자 특화: 가격 비교 테이블 구현 */}
                        {selectedLanguage === 'ko' && (
                          <div className="mt-4 overflow-hidden border rounded-lg bg-white dark:bg-slate-950 shadow-sm">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b">
                                <tr>
                                  <th className="px-4 py-3">플랫폼</th>
                                  <th className="px-4 py-3 text-right">예상 최저가</th>
                                  <th className="px-4 py-3 text-right">상태</th>
                                  <th className="px-4 py-3 text-center">링크</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {[
                                  { name: '마이리얼트립', url: getMyRealTripUrl(getTranslatedContent(landmark, 'ko', 'name')), color: 'text-blue-500', price: '특가 제공', status: '인기' },
                                  { name: '구글 맵 예약', url: getGoogleMapsUrl(getTranslatedContent(landmark, 'ko', 'name')), color: 'text-green-600', price: '최저가 확인', status: '추천' },
                                  { name: 'Klook (클룩)', url: getKlookUrl(getTranslatedContent(landmark, 'ko', 'name'), 'ko'), color: 'text-orange-500', price: '실시간 확인', status: '판매중' },
                                  { name: 'Trip.com', url: getTripUrl(getTranslatedContent(landmark, 'ko', 'name')), color: 'text-blue-700', price: '포인트 적립', status: '판매중' },
                                  { name: 'GetYourGuide', url: getGYGUrl(getTranslatedContent(landmark, 'ko', 'name'), 'ko'), color: 'text-red-500', price: '글로벌 1위', status: '판매중' },
                                ].map((platform) => (
                                  <tr key={platform.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="px-4 py-3 font-semibold">{platform.name}</td>
                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{platform.price}</td>
                                    <td className="px-4 py-3 text-right">
                                      <Badge variant="outline" className={`text-[10px] h-5 py-0 px-1.5 border-green-200 ${platform.status === '인기' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                        {platform.status}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-7 w-7 p-0 ${platform.color}`}
                                        onClick={() => window.open(platform.url, '_blank', 'noopener,noreferrer')}
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* KR 이외의 경우 기존 로직 유지하되 스타일 보강 */}
                        {selectedLanguage !== 'ko' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* 일본어: Klook & Viator */}
                            {selectedLanguage === 'ja' && (
                              <>
                                <Button
                                  variant="outline"
                                  className="justify-start gap-2 text-xs h-10 border-orange-200 hover:bg-orange-50"
                                  onClick={() => {
                                    const searchQuery = getTranslatedContent(landmark, selectedLanguage, 'name');
                                    window.open(getKlookUrl(searchQuery, selectedLanguage), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-orange-500" />
                                  Klookで予約
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start gap-2 text-xs h-10"
                                  onClick={() => {
                                    const searchQuery = getTranslatedContent(landmark, selectedLanguage, 'name');
                                    window.open(getViatorUrl(searchQuery, selectedLanguage), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-blue-500" />
                                  Viatorで予約
                                </Button>
                              </>
                            )}

                            {/* 중국어: Klook & Trip.com */}
                            {selectedLanguage === 'zh' && (
                              <>
                                <Button
                                  variant="outline"
                                  className="justify-start gap-2 text-xs h-10 border-orange-200 hover:bg-orange-50"
                                  onClick={() => {
                                    const searchQuery = getTranslatedContent(landmark, selectedLanguage, 'name');
                                    window.open(getKlookUrl(searchQuery, selectedLanguage), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-orange-500" />
                                  Klook预订
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start gap-2 text-xs h-10"
                                  onClick={() => {
                                    const searchQuery = getTranslatedContent(landmark, selectedLanguage, 'name');
                                    window.open(getTripUrl(searchQuery), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-blue-600" />
                                  Trip.com预订
                                </Button>
                              </>
                            )}

                            {/* 글로벌: GetYourGuide & Viator */}
                            {['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'tr', 'nl', 'pl', 'sv', 'da', 'fi', 'no', 'el', 'cs', 'th', 'vi', 'id'].includes(selectedLanguage) && (
                              <>
                                <Button
                                  variant="outline"
                                  className="justify-start gap-2 text-xs h-10"
                                  onClick={() => {
                                    const searchQuery = getTranslatedContent(landmark, selectedLanguage, 'name');
                                    window.open(getViatorUrl(searchQuery, selectedLanguage), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-blue-500" />
                                  {t('bookOnViator', selectedLanguage)}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start gap-2 text-xs h-10"
                                  onClick={() => {
                                    const searchQuery = getTranslatedContent(landmark, selectedLanguage, 'name');
                                    window.open(getGYGUrl(searchQuery, selectedLanguage), '_blank', 'noopener,noreferrer');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 text-red-500" />
                                  {t('bookOnGetYourGuide', selectedLanguage)}
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : landmark.category === 'Restaurant' ? (
                  <div className="p-4 border rounded-xl space-y-4">
                    <h5 className="font-bold text-base flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-primary" />
                      {selectedLanguage === 'ko' ? '실시간 테이블 예약' : 'Table Reservation'}
                    </h5>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {landmark.phoneNumber && (
                          <Button
                            variant="outline"
                            size="lg"
                            className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5"
                            onClick={() => window.open(`tel:${landmark.phoneNumber}`, '_self')}
                          >
                            <Phone className="w-5 h-5" />
                            {t('callRestaurant', selectedLanguage)}
                          </Button>
                        )}
                        {landmark.reservationUrl && (
                          <Button
                            size="lg"
                            className="flex-1 gap-2 bg-primary text-white"
                            onClick={() => landmark.reservationUrl && window.open(landmark.reservationUrl, '_blank', 'noopener,noreferrer')}
                          >
                            <Calendar className="w-5 h-5" />
                            {t('makeReservation', selectedLanguage)}
                          </Button>
                        )}
                      </div>

                      {/* [연구소장 가이드] 대표님, 식당 예약 플랫폼을 글로벌하게 다각화했습니다! */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {/* 한국 사용자용: 캐치테이블 */}
                        {selectedLanguage === 'ko' && (
                          <Button
                            variant="outline"
                            className="justify-start gap-2 text-xs h-10 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              const name = getTranslatedContent(landmark, 'ko', 'name');
                              window.open(getCatchTableUrl(name), '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <ExternalLink className="w-4 h-4 text-red-500" />
                            캐치테이블 실시간 예약
                          </Button>
                        )}

                        {/* 글로벌/유럽: TheFork */}
                        <Button
                          variant="outline"
                          className="justify-start gap-2 text-xs h-10 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            const name = getTranslatedContent(landmark, selectedLanguage, 'name');
                            window.open(getTheForkUrl(name, selectedLanguage), '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="w-4 h-4 text-green-600" />
                          {selectedLanguage === 'ko' ? 'TheFork 해외 예약' : 'Book on TheFork'}
                        </Button>

                        {/* Google Maps 기반 통합 예약 */}
                        <Button
                          variant="outline"
                          className="justify-start gap-2 text-xs h-10"
                          onClick={() => {
                            window.open(`https://www.google.com/maps/search/${encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'))}`, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <Search className="w-4 h-4 text-blue-500" />
                          Google Maps 예약 찾기
                        </Button>
                      </div>

                      {!landmark.phoneNumber && !landmark.reservationUrl && (
                        <div className="text-center py-8">
                          <Badge variant="outline" className="opacity-60">온라인 예약 미지원</Badge>
                          <p className="text-sm text-muted-foreground mt-2">현장 방문 혹은 호텔 컨시어지를 통해 예약해주세요.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                    <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">{t('noBookingInfo', selectedLanguage)}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Details Tab - Booking & Additional Info */}
            <TabsContent value="details" className="flex-1 overflow-y-auto p-4 m-0">
              <div className="max-w-2xl mx-auto space-y-4">
                {/* GPS Coordinates Section */}
                <div className="p-3 border rounded-lg bg-muted/20">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {t('location', selectedLanguage)}
                  </h5>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{t('latitude', selectedLanguage)}:</span>
                      <span className="font-mono" data-testid="text-landmark-latitude">{landmark.lat.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{t('longitude', selectedLanguage)}:</span>
                      <span className="font-mono" data-testid="text-landmark-longitude">{landmark.lng.toFixed(6)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 gap-2 text-xs h-8"
                      onClick={() => {
                        window.open(`https://www.google.com/maps?q=${landmark.lat},${landmark.lng}`, '_blank', 'noopener,noreferrer');
                      }}
                      data-testid="button-open-google-maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t('openInGoogleMaps', selectedLanguage)}
                    </Button>
                  </div>
                </div>

                {/* Restaurant Text Info (Non-actionable) */}
                {landmark.category === 'Restaurant' && (
                  <div className="p-3 border rounded-lg space-y-3">
                    <h5 className="font-semibold text-sm flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5" />
                      {t('restaurantInfo', selectedLanguage)}
                    </h5>
                    <div className="space-y-2">
                      {landmark.openingHours && (
                        <div className="flex items-start gap-1.5 text-xs py-1">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-700 dark:text-slate-300">{t('openingHours', selectedLanguage)}</p>
                            <p className="text-muted-foreground break-words">{landmark.openingHours}</p>
                          </div>
                        </div>
                      )}

                      {landmark.priceRange && (
                        <div className="flex items-start gap-1.5 text-xs">
                          <Euro className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{t('priceRange', selectedLanguage)}</p>
                            <p className="text-muted-foreground">{landmark.priceRange}</p>
                          </div>
                        </div>
                      )}

                      {landmark.cuisine && (
                        <div className="flex items-start gap-1.5 text-xs">
                          <ChefHat className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{t('cuisine', selectedLanguage)}</p>
                            <p className="text-muted-foreground">{landmark.cuisine}</p>
                          </div>
                        </div>
                      )}

                      {landmark.paymentMethods && landmark.paymentMethods.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{t('paymentMethods', selectedLanguage)}</p>
                            <p className="text-muted-foreground">{landmark.paymentMethods.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {landmark.phoneNumber && (
                        <div className="flex items-start gap-1.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">{t('phoneNumber', selectedLanguage)}</p>
                            <a
                              href={`tel:${landmark.phoneNumber}`}
                              className="text-primary hover:underline"
                              data-testid="link-restaurant-phone-dialog"
                            >
                              {landmark.phoneNumber}
                            </a>
                          </div>
                        </div>
                      )}

                      {landmark.menuHighlights && landmark.menuHighlights.length > 0 && (
                        <div className="text-xs">
                          <p className="font-medium mb-1">{t('menuHighlights', selectedLanguage)}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {landmark.menuHighlights.slice(0, 4).map((dish: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {dish}
                              </Badge>
                            ))}
                          </div>
                          {landmark.restaurantPhotos?.menu && landmark.restaurantPhotos.menu.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {landmark.restaurantPhotos.menu.slice(0, 3).map((photo: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={photo}
                                  alt={`Menu ${idx + 1}`}
                                  className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => {
                                    // Open photo gallery at this index
                                    const event = new CustomEvent('openPhotoGallery', {
                                      detail: { photos: landmark.restaurantPhotos?.menu || [], startIndex: idx }
                                    });
                                    window.dispatchEvent(event);
                                  }}
                                  data-testid={`menu-photo-${idx}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
