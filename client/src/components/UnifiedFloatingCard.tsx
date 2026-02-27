
import React, { useState, useRef, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Volume2,
  Navigation,
  MapPin,
  Clock,
  List,
  Search,
  MessageCircle,
  ExternalLink,
  MapPinned,
  ChevronLeft,
  ChevronRight,
  Info,
  Activity as ActivityIcon,
  Map as LandmarkIcon,
  ShoppingBag,
  Utensils,
  Maximize2,
  Minimize2,
  Ship,
  Phone,
  Globe,
  Euro,
  ChefHat,
  Ticket,
  Image as ImageIcon,
  User as UserIcon,
  Wand2,
  Anchor,
  Bus,
  Save,
  FolderOpen,
  Square,
  Train,
  Car,
  Plus
} from 'lucide-react';
import { useLiveTranslation } from '@/hooks/useLiveTranslation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Landmark, GpsPosition, City, CruisePort, TransportOption } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import LandmarkDetailDialog from './LandmarkDetailDialog';

interface UnifiedFloatingCardProps {
  // Landmark Panel props
  selectedLandmark: Landmark | null;
  isTransitMode?: boolean;
  onLandmarkClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;

  // Cruise Port props
  city: City | null;
  showCruisePort: boolean;
  onCruisePortClose?: () => void;
  onLandmarkClick?: (landmarkId: string) => void;

  // Landmark List props
  landmarks: Landmark[];
  userPosition: GpsPosition | null;
  onLandmarkRoute: (landmark: Landmark) => void;
  spokenLandmarks: Set<string>;
  onLandmarkSelect?: (landmark: Landmark) => void;

  // Filter props (synced with Home)
  showLandmarks: boolean;
  showActivities: boolean;
  showRestaurants: boolean;
  showGiftShops: boolean;
  onToggleLandmarks: () => void;
  onToggleActivities: () => void;
  onToggleRestaurants: () => void;
  onToggleGiftShops: () => void;

  // Tour Route props
  tourStops?: Landmark[];
  tourRouteInfo?: {
    distance: number;
    duration: number;
    segments?: Array<{ from: string; to: string; distance: number; duration: number }>;
  } | null;
  onRemoveTourStop?: (landmarkId: string) => void;
  tourTimePerStop?: number;
  tourStopDurations?: Record<string, number>;
  onUpdateStopDuration?: (landmarkId: string, duration: number) => void;
  onSaveRoute?: () => void;
  onOpenMyRoutes?: () => void;

  // AI Recommendation props
  aiRecommendation?: {
    itinerary: Array<{ landmarkId: string; order: number }>;
    explanation: string;
    totalEstimatedTime: number;
  } | null;

  // Common props
  selectedLanguage?: string;

  // Departure time for traffic estimation
  departureTime?: Date | null;

  // Starting point for distance calculation
  startingPoint?: { lat: number; lng: number; type: string; name?: string } | null;

  // End point for tour
  endPoint?: { lat: number; lng: number; type: string; name?: string } | null;

  // Callback to open start/end point setup dialog
  onOpenStartEndPointDialog?: () => void;

  // Captured route image
  capturedRouteImage?: string | null;
  onClearCapturedImage?: () => void;

  // Regional Guide props
  selectedRegionalGuideId?: string | null;
  onRegionalGuideChange?: (guideId: string | null) => void;

  // 🛰️ Simulation props
  isSimulationMode?: boolean;
  onToggleSimulation?: () => void;
  playInBackground?: boolean;
  simulationSpeed?: number;
  onSimulationSpeedChange?: (speed: number) => void;
  onSimulationPauseToggle?: () => void;
  isSimulationPaused?: boolean;
  onOpenAIRecommend?: () => void;

  // 🛰️ [Server Park] Minimal Transit UI props
  showMinimalTransitUI?: boolean;
  onToggleMinimalTransitUI?: () => void;
  forceShowList?: boolean;
  isCardMinimized?: boolean;
  onToggleMinimized?: () => void;

  // Cruise Port extensions
  onToggleCruisePort?: () => void;
}


function getCruisePortTranslation(cruisePort: CruisePort | null | undefined, language: string, field: 'portName' | 'distanceFromCity' | 'recommendedDuration' | 'tips'): string {
  if (!cruisePort) return '';
  if (language === 'ko' && cruisePort.translations?.ko) return cruisePort.translations.ko[field] || '';
  return cruisePort[field] || '';
}

function getTransportTranslation(transport: TransportOption, language: string, field: 'name' | 'from' | 'to' | 'duration' | 'price' | 'tips'): string {
  if (language === 'ko' && transport.translations?.ko) return transport.translations.ko[field] || '';
  return transport[field] || '';
}

function getGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function getAirbnbUrl(query: string): string {
  return `https://www.airbnb.com/s/${encodeURIComponent(query)}/homes`;
}

export function UnifiedFloatingCard({
  selectedLandmark,
  isTransitMode = false,
  onLandmarkClose,
  onNavigate,
  onAddToTour,
  isInTour = false,
  city,
  showCruisePort,
  onCruisePortClose,
  landmarks,
  userPosition,
  onLandmarkRoute,
  spokenLandmarks,
  onLandmarkSelect,
  showLandmarks,
  showActivities,
  showRestaurants,
  showGiftShops,
  onToggleLandmarks,
  onToggleActivities,
  onToggleRestaurants,
  onToggleGiftShops,
  tourStops = [],
  tourRouteInfo,
  onRemoveTourStop,
  tourTimePerStop = 30,
  tourStopDurations = {},
  onUpdateStopDuration,
  onSaveRoute,
  onOpenMyRoutes,
  aiRecommendation,
  selectedLanguage = 'en',
  departureTime,
  startingPoint,
  endPoint,
  onOpenStartEndPointDialog,
  capturedRouteImage,
  onClearCapturedImage,
  selectedRegionalGuideId,
  onRegionalGuideChange,
  isSimulationMode = false,
  onToggleSimulation,
  playInBackground = false,
  showMinimalTransitUI = false,
  onToggleMinimalTransitUI,
  // ✅ [Bug Doctor] 외부 카드 상태 props - 이것이 없으면 버튼 클릭이 카드에 반영 안 됨!
  forceShowList = false,
  isCardMinimized = false,
  onToggleMinimized,
  // [교수님 지시] AI 추천 다이얼로그를 열기 위한 콜백 — AI Pick 탭에서 사용
  onOpenAIRecommend,
}: UnifiedFloatingCardProps) {
  // [교수님 지시] 탭 타입에 'ai' 추가 — AI 추천 탭 지원
  const [activeTab, setActiveTab] = useState<'list' | 'cruise' | 'tour' | 'ai'>('list');
  // [Bug Doctor] 내부 최소화 상태: 외부 isCardMinimized와 동기화 (로컬 상태 제거)
  const [showTransitDetails, setShowTransitDetails] = useState(false);
  const [landmarkSearchQuery, setLandmarkSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transportPage, setTransportPage] = useState(1);
  const [tourPage, setTourPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const nameFallback = getTranslatedContent(selectedLandmark, selectedLanguage, 'name');
  const descFallback = getTranslatedContent(selectedLandmark, selectedLanguage, 'description');
  const detailFallback = getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription');

  const translatedName = useLiveTranslation(nameFallback, selectedLanguage);
  const translatedDesc = useLiveTranslation(descFallback, selectedLanguage);
  const translatedDetail = useLiveTranslation(detailFallback, selectedLanguage);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [tourAddedInDialog, setTourAddedInDialog] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 5;
  const transportItemsPerPage = 3;
  const tourItemsPerPage = 10;

  // [Bug Doctor 2026-02-26] '목록' 버튼 클릭 시 list 탭으로 강제 전환
  useEffect(() => {
    const handleForceShowList = () => {
      setActiveTab('list');
    };
    window.addEventListener('force-show-list-tab', handleForceShowList);
    return () => window.removeEventListener('force-show-list-tab', handleForceShowList);
  }, []);

  // [Bug Doctor] forceShowList prop이 true가 되면 강제로 list 탭으로 이동
  useEffect(() => {
    if (forceShowList) {
      setActiveTab('list');
    }
  }, [forceShowList]);

  // Update playback state
  useEffect(() => {
    audioService.setOnStateChange((speaking: boolean) => {
      setIsPlaying(speaking);
      setIsPaused(audioService.isPaused());
    });
    return () => audioService.setOnStateChange(null);
  }, []);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedLandmark) return;

    if (isPlaying) {
      if (isPaused) {
        audioService.resume();
      } else {
        audioService.pause();
      }
    } else {
      const text = getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription') ||
        getTranslatedContent(selectedLandmark, selectedLanguage, 'description');
      if (text) {
        audioService.playText(text, selectedLanguage, playbackRate);
      }
    }
  };

  const calculateDistance = (pos1: GpsPosition, pos2: { lat: number; lng: number }) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (pos1.latitude * Math.PI) / 180;
    const phi2 = (pos2.lat * Math.PI) / 180;
    const deltaPhi = ((pos2.lat - pos1.latitude) * Math.PI) / 180;
    const deltaLambda = ((pos2.lng - pos1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatWalkTime = (meters: number, lang: string) => {
    const minutes = Math.ceil(meters / 84); // Roughly 5km/h walking speed
    if (lang === 'ko') {
      if (minutes < 60) return `도보 ${minutes}분`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `도보 ${hours}시간 ${mins}분`;
    } else {
      if (minutes < 60) return `${minutes} min walk`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m walk`;
    }
  };

  const filteredListLandmarks = useMemo(() => {
    let result = landmarks.map(landmark => ({
      landmark,
      distance: userPosition ? calculateDistance(userPosition, { lat: landmark.lat, lng: landmark.lng }) : null
    }));

    // Filter by search query
    if (landmarkSearchQuery) {
      const query = landmarkSearchQuery.toLowerCase();
      result = result.filter(({ landmark }) =>
        getTranslatedContent(landmark, selectedLanguage, 'name').toLowerCase().includes(query) ||
        getTranslatedContent(landmark, selectedLanguage, 'description').toLowerCase().includes(query)
      );
    }

    // Filter by categories
    result = result.filter(({ landmark }) => {
      if (landmark.category === 'Activity') return showActivities;
      if (landmark.category === 'Restaurant') return showRestaurants;
      if (landmark.category === 'Gift Shop') return showGiftShops;
      return showLandmarks; // Default for 'Landmark' category
    });

    // Sort by distance
    return result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [landmarks, userPosition, landmarkSearchQuery, showLandmarks, showActivities, showRestaurants, showGiftShops, selectedLanguage]);

  // [Bug Doctor 수정] 리스트에서 랜드마크 클릭 시:
  // 1) 부모(Home.tsx)에 선택 알림 → selectedLandmark prop 업데이트
  // 2) 즉시 LandmarkDetailDialog를 열어 사용자 피드백 보장
  const handleLandmarkClick = (landmark: Landmark) => {
    onLandmarkSelect?.(landmark);
    setShowDetailDialog(true);
  };

  const getTrafficInfo = (lang: string, time?: Date | null) => {
    const now = time || new Date();
    const hours = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (hours >= 7 && hours <= 9) return { label: lang === 'ko' ? '출근 시간 (정체)' : 'Rush Hour (Heavy)', multiplier: 1.8, color: '#ef4444' };
    if (hours >= 17 && hours <= 19) return { label: lang === 'ko' ? '퇴근 시간 (정체)' : 'Rush Hour (Heavy)', multiplier: 2.0, color: '#ef4444' };
    if (hours >= 11 && hours <= 14) return { label: lang === 'ko' ? '낮 시간 (보통)' : 'Mid-day (Moderate)', multiplier: 1.3, color: '#f59e0b' };
    if (hours >= 22 || hours <= 5) return { label: lang === 'ko' ? '심야 시간 (원활)' : 'Night (Smooth)', multiplier: 0.8, color: '#10b981' };
    return { label: lang === 'ko' ? '원활' : 'Smooth', multiplier: 1.0, color: '#10b981' };
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'bus': return Bus;
      case 'train': return Train;
      case 'taxi': return Car;
      case 'shuttle': return Ship;
      default: return Bus;
    }
  };

  // State management for detail view
  useEffect(() => {
    if (selectedLandmark) {
      setShowDetailDialog(true);
    }
  }, [selectedLandmark]);

  // ✅ [Bug Doctor] MapView(z:400)보다 훨씬 높은 z-index(5000)를 부여하여 가려짐 방지
  const zIndex = 5000;

  return (
    <div
      style={{ zIndex }}
      className={`fixed bottom-24 right-4 ${selectedLandmark ? 'w-[calc(100vw-48px)] sm:w-[360px]' : 'w-[calc(100vw-32px)] sm:w-[380px]'} max-h-[calc(100vh-180px)] flex flex-col glass-premium aurora-border-premium shadow-2xl rounded-sm overflow-hidden transition-all duration-500 ${isCardMinimized && !forceShowList ? 'opacity-0 pointer-events-none translate-y-20' : 'opacity-100 translate-y-0'}`}
    >
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {/* [교수님 지시] 목록(리스트) 탭 버튼 — 클릭 시 랜드마크 상세 닫고 목록 표시 */}
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-full h-8 px-4 flex-shrink-0 transition-all ${activeTab === 'list' ? 'bg-[#E9633F] text-white font-black shadow-lg shadow-orange-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => {
              setActiveTab('list');
              // [핵심] 헤더 목록 아이콘 클릭 시 현재 열려있는 랜드마크 상세를 닫아
              // 리스트가 바로 보이도록 처리합니다.
              if (selectedLandmark) {
                setShowDetailDialog(false);
                onLandmarkClose();
              }
            }}
          >
            {/* [교수님 지시] 리스트 아이콘 활성화 강조 */}
            <div className={`mr-1.5 p-1 rounded-sm transition-all ${activeTab === 'list' ? 'bg-white/20' : ''}`}>
              <List className={`w-4 h-4 ${activeTab === 'list' ? 'animate-pulse scale-110' : ''}`} />
            </div>
            <span className="text-xs tracking-tight">{t('list', selectedLanguage)}</span>
          </Button>
          {showCruisePort && (
            <Button
              variant={activeTab === 'cruise' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full h-8 px-4 flex-shrink-0 transition-all ${activeTab === 'cruise' ? 'bg-[#E9633F] text-white font-black shadow-lg shadow-orange-100' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('cruise')}
            >
              <Ship className="w-4 h-4 mr-1.5" />
              <span className="text-xs tracking-tight">{t('cruisePort', selectedLanguage)}</span>
            </Button>
          )}
          <Button
            variant={activeTab === 'tour' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-full h-8 px-4 flex-shrink-0 transition-all ${activeTab === 'tour' ? 'bg-[#E9633F] text-white font-black shadow-lg shadow-orange-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('tour')}
          >
            {/* [교수님 지시] 경로(My Tour) 아이콘 활성화 강조 */}
            <div className={`mr-1.5 p-1 rounded-sm transition-all ${activeTab === 'tour' ? 'bg-white/20' : ''}`}>
              <MapPinned className={`w-4 h-4 ${activeTab === 'tour' ? 'animate-pulse scale-110' : ''}`} />
            </div>
            <span className="text-xs tracking-tight">{t('myTour', selectedLanguage)}</span>
          </Button>
          {/* [교수님 지시] AI 추천 탭 — My Tour 다음에 배치 */}
          <Button
            variant={activeTab === 'ai' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-full h-8 px-4 flex-shrink-0 transition-all ${activeTab === 'ai' ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-100' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('ai')}
          >
            <Wand2 className="w-4 h-4 mr-1.5" />
            <span className="text-xs tracking-tight">{selectedLanguage === 'ko' ? 'AI 추천' : 'AI Pick'}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {selectedLandmark && (
            <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 animate-in fade-in zoom-in duration-300">
              <LandmarkIcon className="w-3.5 h-3.5 text-[#E9633F]" />
              <span className="text-[10px] font-bold text-[#E9633F] truncate max-w-[60px]">
                {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
              </span>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100" onClick={() => onLandmarkClose()}>
            <X className="w-5 h-5" />
          </Button>
        </div>

      </div>

      <AnimatePresence>
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {/* LANDMARK DETAIL LAYER */}
          <AnimatePresence mode="wait">
            {selectedLandmark && (
              <motion.div
                key="detail"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 bg-white dark:bg-slate-900 p-4 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg leading-tight">
                        {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
                      </h4>
                      <Badge variant="secondary" className="mt-1">{selectedLandmark.category}</Badge>
                    </div>
                  </div>

                  {aiRecommendation && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-bold text-purple-900">AI 추천</span>
                      </div>
                      <p className="text-purple-800">{aiRecommendation.explanation}</p>
                    </div>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {translatedDesc}
                  </p>


                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePlayAudio} className="flex-1 gap-2">
                      {isPlaying && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {selectedLanguage === 'ko' ? (isPlaying && !isPaused ? '정지' : '듣기') : 'Listen'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDetailDialog(true)} className="flex-1 gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '사진' : 'Photos'}
                    </Button>
                  </div>

                  {translatedDetail && (
                    <div className="pt-3 border-t">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {translatedDetail}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN CONTENT LAYER */}
          <div className={`flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${selectedLandmark ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            {activeTab === 'list' && (
              <div className="space-y-4 flex flex-col h-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchLandmarks', selectedLanguage)}
                    className="pl-9 h-9 bg-muted/50 border-none"
                    value={landmarkSearchQuery}
                    onChange={(e) => setLandmarkSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {filteredListLandmarks.map(({ landmark, distance }) => (
                    <div
                      key={landmark.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => handleLandmarkClick(landmark)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {landmark.photos?.[0] && <img src={landmark.photos[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-semibold truncate">{getTranslatedContent(landmark, selectedLanguage, 'name')}</h5>
                          {distance !== null && <p className="text-[10px] text-muted-foreground">{formatDistance(distance)} • {formatWalkTime(distance, selectedLanguage)} • {landmark.category}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${tourStops?.some(stop => stop.id === landmark.id) ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (tourStops?.some(stop => stop.id === landmark.id)) {
                              onRemoveTourStop?.(landmark.id);
                            } else {
                              onAddToTour?.(landmark);
                            }
                          }}
                        >
                          {tourStops?.some(stop => stop.id === landmark.id) ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#E9633F]" onClick={(e) => { e.stopPropagation(); onLandmarkRoute(landmark); }}>
                          <Navigation className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cruise' && city?.cruisePort && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{getCruisePortTranslation(city.cruisePort, selectedLanguage, 'portName')}</h4>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm italic">
                  {getCruisePortTranslation(city.cruisePort, selectedLanguage, 'tips')}
                </div>
              </div>
            )}

            {activeTab === 'tour' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm">{selectedLanguage === 'ko' ? `내 투어 (${tourStops.length})` : `My Tour (${tourStops.length})`}</h5>
                  <Button
                    size="sm"
                    className={`rounded-full h-8 text-xs font-black transition-all duration-300 ${isSimulationMode ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-100 ring-2 ring-red-100' : 'bg-[#E9633F] hover:bg-[#D55232] shadow-lg shadow-orange-100 ring-2 ring-orange-100'}`}
                    onClick={() => onToggleSimulation?.()}
                  >
                    {isSimulationMode ? (
                      <div className="flex items-center gap-1.5">
                        <Square className="w-3 h-3 fill-current" />
                        <span>{selectedLanguage === 'ko' ? '중단' : 'Stop'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{selectedLanguage === 'ko' ? '시작' : 'Start'}</span>
                      </div>
                    )}
                  </Button>
                </div>
                {tourStops.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <MapPinned className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{selectedLanguage === 'ko' ? '지도에서 명소를 추가하세요' : 'Add landmarks from the map'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tourStops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                        <span className="text-xs font-medium truncate flex-1">{getTranslatedContent(stop, selectedLanguage, 'name')}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveTourStop?.(stop.id)}>
                          <X className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* [교수님 지시] AI Suggest 탭 컨텐츠 패널
                AI 추천 결과가 있으면 itinerary 목록을 표시하고,
                없으면 사용자에게 AI 추천 시작 버튼을 제공합니다. */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">
                      {selectedLanguage === 'ko' ? 'AI 투어 추천' : 'AI Tour Recommendation'}
                    </h5>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedLanguage === 'ko' ? 'GPT가 최적 경로를 제안합니다' : 'GPT suggests the optimal route'}
                    </p>
                  </div>
                </div>

                {aiRecommendation ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-800 leading-relaxed">
                      {aiRecommendation.explanation}
                    </div>
                    <div className="space-y-2">
                      {aiRecommendation.itinerary.map((item, idx) => {
                        const lm = landmarks.find(l => l.id === item.landmarkId);
                        if (!lm) return null;
                        return (
                          <div
                            key={item.landmarkId}
                            className="flex items-center gap-2 p-2 bg-white rounded-lg border cursor-pointer hover:shadow-sm transition-all"
                            onClick={() => handleLandmarkClick(lm)}
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] flex items-center justify-center font-bold shrink-0">{item.order}</span>
                            <span className="text-xs font-medium truncate">{getTranslatedContent(lm, selectedLanguage, 'name')}</span>
                            <Navigation className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">
                      ⏱ {selectedLanguage === 'ko' ? `총 예상 시간: ${aiRecommendation.totalEstimatedTime}분` : `Est. time: ${aiRecommendation.totalEstimatedTime} min`}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center">
                      <Wand2 className="w-7 h-7 text-purple-400" />
                    </div>
                    <p className="text-xs text-center text-muted-foreground px-4">
                      {selectedLanguage === 'ko'
                        ? 'AI가 현재 명소 목록을 분석하여 최적의 투어 순서를 추천해 드립니다.'
                        : 'AI will analyze current landmarks and suggest the optimal tour order.'}
                    </p>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 h-10 gap-2 shadow-md shadow-purple-200"
                      onClick={() => { onOpenAIRecommend?.(); }}
                    >
                      <Wand2 className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? 'AI 투어 추천 받기' : 'Get AI Suggestion'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AnimatePresence>

      <LandmarkDetailDialog
        landmark={selectedLandmark}
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          onLandmarkClose();
        }}
        onNavigate={onNavigate}
        onAddToTour={onAddToTour}
        isInTour={isInTour}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}

