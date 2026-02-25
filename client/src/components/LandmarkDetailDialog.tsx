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

  const handleStripeCheckout = async () => {
    if (!landmark) return;
    try {
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkId: landmark.id,
          creatorId: 'default-creator',
          userId: 'test-user',
          amount: 4.99,
          name: `${getTranslatedContent(landmark, selectedLanguage, 'name')} 프리미엄 가이드`
        }),
      });

      const { url, error } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(error || '세션 생성 실패');
      }
    } catch (error) {
      console.error('[회계부장 긴급] 결제 시작 중 오류 발생:', error);
      alert('결제 창을 열지 못했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handlePlayAudio = async () => {
    if (isPlaying && !isPaused) {
      audioService.pause();
      setIsPaused(true);
      return;
    }

    if (isPlaying && isPaused) {
      audioService.resume();
      setIsPaused(false);
      return;
    }

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
        audioService.playSentences(
          textToPlay,
          selectedLanguage,
          playbackRate,
          (index) => setCurrentSentenceIndex(index),
          onPlaybackEnd
        );
      }
    } else {
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
    setTimeout(() => handlePlayAudio(), 100);
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        document.body.removeAttribute('data-scroll-locked');

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

  useEffect(() => {
    if (isOpen && landmark && !isPlaying) {
      const timer = setTimeout(() => {
        handlePlayAudio();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, landmark?.id]);

  useEffect(() => {
    if (isPlaying || isPaused) {
      audioService.stopSentences();
      audioService.stop();
      audioService.stopMP3();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIndex(-1);
      setTimeout(() => handlePlayAudio(), 100);
    }
  }, [audioContentType]);

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
        className="p-0 overflow-hidden flex flex-col border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-t-[32px] sm:rounded-[32px] bottom-0 sm:bottom-auto w-[100vw] sm:w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[92vh] no-overlay"
      >
        <div className="flex flex-col h-full overflow-hidden w-full max-w-full box-border">
          <DialogHeader className="p-4 pb-3 border-b flex-shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-50">
            <DialogDescription className="sr-only">
              Detailed information about this landmark
            </DialogDescription>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold mb-1" data-testid="text-landmark-detail-name">
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{landmark?.category}</span>
                  <span>•</span>
                  <span className="line-clamp-1">{getTranslatedContent(landmark, selectedLanguage, 'description')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleDialogClose}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleDialogClose}>
                  <RotateCcw className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-[#FCF9F6]">
            {/* Action Badges */}
            <div className="px-4 py-3 flex gap-2">
              <Badge variant="outline" className="bg-[#FFF1EB] text-[#E67E22] border-[#FFE0D1] px-3 py-1 rounded-full text-xs font-bold">
                {landmark?.category}
              </Badge>
              <Badge variant="outline" className="bg-[#F0F4FF] text-[#3498DB] border-[#D1E0FF] px-3 py-1 rounded-full text-xs font-bold flex gap-1 items-center">
                <Globe className="w-3 h-3" />
                1506
              </Badge>
            </div>

            {/* Photos Section */}
            <div className="px-4 py-2 space-y-2">
              <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                {selectedLanguage === 'ko' ? '사진' : 'Photos'}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {(landmark?.photos || []).map((photo, idx) => (
                  <div key={idx} className="w-24 h-24 rounded-xl bg-[#EFEBE6] flex-shrink-0 overflow-hidden flex items-center justify-center border border-[#E0DBCF]">
                    <img src={photo} alt={`Photo ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
                {(!landmark?.photos || landmark.photos.length === 0) && (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-24 h-24 rounded-xl bg-[#EFEBE6] flex-shrink-0 flex items-center justify-center border border-[#E0DBCF]">
                      <ImageIcon className="w-8 h-8 text-[#A8A294]" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Location Map Section */}
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                {selectedLanguage === 'ko' ? '위치' : 'Location'}
              </div>
              <div
                className="w-full h-24 rounded-xl relative overflow-hidden bg-[#F0F4ED] border border-[#D5E0D1] cursor-pointer"
                onClick={() => window.open(`https://www.google.com/maps?q=${landmark.lat},${landmark.lng}`, '_blank')}
              >
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#34A853 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-[#EA4335] rounded-full flex items-center justify-center shadow-lg">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-4 py-2 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                  {selectedLanguage === 'ko' ? '카테고리' : 'Category'}
                </div>
                <p className="text-sm leading-relaxed text-[#5D574D]">
                  {getTranslatedContent(landmark, selectedLanguage, 'description')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                  {selectedLanguage === 'ko' ? '역사적 정보' : 'Historical Info'}
                </div>
                <div className="text-sm leading-relaxed text-[#5D574D]">
                  {activeSentences.length > 0 ? (
                    activeSentences.map((sentence: string, index: number) => {
                      const isCurrentSentence = currentSentenceIndex === index;
                      const isReadSentence = currentSentenceIndex > index && isPlaying;
                      return (
                        <span
                          key={index}
                          className={`inline rounded-sm px-0.5 transition-all duration-300 ease-in-out ${isCurrentSentence
                            ? 'bg-yellow-300/50 font-medium shadow-sm'
                            : isReadSentence
                              ? 'bg-green-300/30'
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

              {landmark.architect && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                    {selectedLanguage === 'ko' ? '건축가' : 'Architect'}
                  </div>
                  <p className="text-sm font-medium text-[#4A90E2]">
                    {landmark.architect}
                  </p>
                </div>
              )}
            </div>

            {/* Audio Box */}
            <div className="px-4 py-6">
              <div className="rounded-2xl border border-[#FDEBD0] bg-[#FFF9F2] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                    {selectedLanguage === 'ko' ? '상세 정보' : 'Detailed Info'}
                  </div>
                  <span className="text-[10px] text-[#A8A294] font-mono">{playbackRate}x</span>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handlePlayAudio}
                      className="h-12 w-32 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl gap-2 font-bold shadow-lg"
                    >
                      {isPlaying && !isPaused ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                      {selectedLanguage === 'ko' ? (isPlaying && !isPaused ? '일시정지' : '재생') : (isPlaying && !isPaused ? 'Pause' : 'Play')}
                    </Button>
                    <Button
                      onClick={handleRestartAudio}
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-[#E67E22]"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <Button
                        key={rate}
                        variant="outline"
                        size="sm"
                        className={`min-w-[40px] h-7 text-[10px] p-0 rounded-md border-[#EFEBE6] ${playbackRate === rate ? 'bg-[#E67E22] text-white border-[#E67E22]' : 'bg-white text-[#A8A294]'}`}
                        onClick={() => {
                          setPlaybackRate(rate);
                          audioService.setRate(rate);
                        }}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Booking */}
            <div className="px-4 pb-24">
              <div className="rounded-2xl border border-[#FDEBD0] bg-[#FFF9F2] p-4 space-y-4">
                <div className="flex items-center gap-1.5 text-[#E67E22] font-bold text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E67E22]" />
                  {selectedLanguage === 'ko' ? '티켓 예약' : 'Book Tickets'}
                </div>

                <div className="space-y-2">
                  {[
                    { name: 'GetYourGuide에서 예약', url: getGYGUrl(getTranslatedContent(landmark, selectedLanguage, 'name'), selectedLanguage) },
                    { name: 'Viator에서 예약', url: getViatorUrl(getTranslatedContent(landmark, selectedLanguage, 'name'), selectedLanguage) },
                    { name: 'Klook에서 예약', url: getKlookUrl(getTranslatedContent(landmark, selectedLanguage, 'name'), selectedLanguage) }
                  ].map((option, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start gap-3 h-12 bg-white border-[#EFEBE6] text-[#5D574D] rounded-xl hover:bg-[#FCF9F6] text-sm font-medium"
                      onClick={() => window.open(option.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 text-[#A8A294]" />
                      {option.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-md border-t flex gap-3 h-20 items-center shrink-0">
            <Button
              onClick={() => onNavigate(landmark)}
              className="flex-1 h-12 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl gap-2 font-bold shadow-lg shadow-orange-200"
            >
              <Navigation className="w-5 h-5" />
              {selectedLanguage === 'ko' ? '길 안내' : 'Directions'}
            </Button>
            <Button
              onClick={() => onAddToTour?.(landmark)}
              variant="outline"
              className="flex-1 h-12 border-[#EFEBE6] text-[#5D574D] rounded-xl font-bold hover:bg-[#FCF9F6]"
            >
              + {selectedLanguage === 'ko' ? '투어 추가' : 'Add to Tour'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
