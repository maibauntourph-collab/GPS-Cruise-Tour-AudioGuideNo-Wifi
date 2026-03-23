
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
  onMinimizeToMenu?: () => void;

  // [Marketer Song] 국가별 맞춤 추천을 위한 사용자 국적 코드 (e.g. "US", "JP", "CN", "TW", "KR")
  userRegion?: string;
  onToggleCruisePort?: () => void;

  // Layout Toggle
  activeLayout?: string;
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
  userRegion = 'US',
  activeLayout = 'modern',
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
  forceShowList = false,
  isCardMinimized = false,
  onToggleMinimized,
  onMinimizeToMenu,
  onOpenAIRecommend,
  isSimulationPaused = false,
  simulationSpeed = 1,
  onSimulationPauseToggle,
  onSimulationSpeedChange,
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

  // [적요 - 2026-03-23] 도보 시간 포맷 - 언어별 다국어 지원
  // ko=한국어, ja=일본어, zh=중국어, th=태국어, 나머지는 영어 형식
  const formatWalkTime = (meters: number, lang: string) => {
    const minutes = Math.ceil(meters / 84);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (lang === 'ko') {
      return minutes < 60 ? `도보 ${minutes}분` : `도보 ${hours}시간 ${mins}분`;
    } else if (lang === 'ja') {
      return minutes < 60 ? `徒歩 ${minutes}分` : `徒歩 ${hours}時間${mins}分`;
    } else if (lang === 'th') {
      return minutes < 60 ? `เดิน ${minutes} นาที` : `เดิน ${hours} ชม. ${mins} นาที`;
    } else if (lang.startsWith('zh')) {
      return minutes < 60 ? `步行 ${minutes}分钟` : `步行 ${hours}小时${mins}分钟`;
    } else {
      return minutes < 60 ? `${minutes} min walk` : `${hours}h ${mins}m walk`;
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

    // [Marketer Song | 2026-03-20] 🌏 글로벌 맞춤 추천 정렬 로직
    // 학생들에게: 단순히 거리순이 아니라, 사용자의 국적 취향(targetNations)을 최우선으로 고려합니다.
    return result.sort((a, b) => {
      const aMatch = a.landmark.targetNations?.includes(userRegion) ? 1 : 0;
      const bMatch = b.landmark.targetNations?.includes(userRegion) ? 1 : 0;

      if (aMatch !== bMatch) return bMatch - aMatch; // 추천 대상이면 상단으로!
      return (a.distance || 0) - (b.distance || 0); // 그 다음 거리순
    });
  }, [landmarks, userPosition, landmarkSearchQuery, showLandmarks, showActivities, showRestaurants, showGiftShops, selectedLanguage, userRegion]);

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
      {/* [Avengers Team] GLOBAL CONTROL TOWER (Merged from Top Bar) */}
      {activeLayout !== 'classic' && (
        <div className="p-2.5 bg-white/40 backdrop-blur-xl border-b border-white/20 flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* [적요] Start/Stop Simulation 통합 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-4 rounded-full flex-shrink-0 transition-all active:scale-95 group font-black ${isSimulationMode ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
              onClick={onToggleSimulation}
            >
              {isSimulationMode ? (
                <>
                  <Square className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  <span className="text-[11px] uppercase tracking-tighter">Exit</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  <span className="text-[11px] uppercase tracking-tighter">Start</span>
                </>
              )}
            </Button>

            <div className="w-[1px] h-5 bg-slate-400/20" />

            {/* [적요] Route/Starting Point 통합 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 px-4 rounded-full flex-shrink-0 transition-all active:scale-95 group font-bold border border-emerald-100/50 ${startingPoint ? 'bg-emerald-50 text-emerald-600' : 'bg-white/60 text-slate-700 hover:bg-white'} shadow-sm`}
              onClick={onOpenStartEndPointDialog}
            >
              <MapPin className={`w-3.5 h-3.5 mr-1.5 ${startingPoint ? 'text-emerald-600' : 'text-emerald-500'}`} />
              <span className="text-[11px] uppercase tracking-tighter">
                {startingPoint ? (startingPoint.name || 'Set') : 'Route'}
              </span>
            </Button>

            {isSimulationMode && (
              <div className="flex items-center gap-1 animate-in slide-in-from-left duration-500">
                <div className="w-[1px] h-5 bg-slate-400/20" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white/60 text-indigo-600 border border-indigo-50"
                  onClick={onSimulationPauseToggle}
                >
                  {isSimulationPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {selectedLandmark && (
              <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 animate-in fade-in zoom-in duration-300">
                <LandmarkIcon className="w-3 h-3 text-[#E9633F]" />
                <span className="text-[9px] font-black text-[#E9633F] truncate max-w-[50px] uppercase">
                  {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/80"
              onClick={onLandmarkClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* [Avengers Team] Classic 모드일 때도 랜드마크 선택 중이라면 최소한의 닫기 버튼 헤더 노출 */}
      {activeLayout === 'classic' && selectedLandmark && (
        <div className="p-2 bg-white/60 backdrop-blur-md border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 ml-1">
            <LandmarkIcon className="w-3.5 h-3.5 text-[#E9633F]" />
            <span className="text-[10px] font-black text-[#E9633F] uppercase tracking-tight">
              {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600"
            onClick={onLandmarkClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* TABS HEADER */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth border-b bg-white/20">
        {/* [교수님 지시] 목록(리스트) 탭 버튼 — 클릭 시 랜드마크 상세 닫고 목록 표시 */}
        <Button
          variant={activeTab === 'list' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full h-7 px-3 flex-shrink-0 transition-all ${activeTab === 'list' ? 'bg-[#E9633F] text-white font-black shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => {
            setActiveTab('list');
            if (selectedLandmark) {
              setShowDetailDialog(false);
              onLandmarkClose();
            }
          }}
        >
          <List className="w-3.5 h-3.5 mr-1" />
          <span className="text-[10px] uppercase tracking-wider">{t('list', selectedLanguage)}</span>
        </Button>
        {showCruisePort && (
          <Button
            variant={activeTab === 'cruise' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-full h-7 px-3 flex-shrink-0 transition-all ${activeTab === 'cruise' ? 'bg-[#E9633F] text-white font-black shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('cruise')}
          >
            <Ship className="w-3.5 h-3.5 mr-1" />
            <span className="text-[10px] uppercase tracking-wider">{t('cruisePort', selectedLanguage)}</span>
          </Button>
        )}
        <Button
          variant={activeTab === 'tour' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full h-7 px-3 flex-shrink-0 transition-all ${activeTab === 'tour' ? 'bg-[#E9633F] text-white font-black shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setActiveTab('tour')}
        >
          <MapPinned className="w-3.5 h-3.5 mr-1" />
          <span className="text-[10px] uppercase tracking-wider">{t('myTour', selectedLanguage)}</span>
        </Button>
        <Button
          variant={activeTab === 'ai' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full h-7 px-3 flex-shrink-0 transition-all ${activeTab === 'ai' ? 'bg-purple-600 text-white font-black shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          onClick={() => setActiveTab('ai')}
        >
          <Wand2 className="w-3.5 h-3.5 mr-1" />
          <span className="text-[10px] uppercase tracking-wider">AI Pick</span>
        </Button>
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
                        <span className="font-bold text-purple-900">{t('aiTourRecommendation', selectedLanguage)}</span>
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
                      {isPlaying && !isPaused ? t('pause', selectedLanguage) : t('playAudio', selectedLanguage)}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDetailDialog(true)} className="flex-1 gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {t('photos', selectedLanguage)}
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
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-sm font-semibold truncate">{getTranslatedContent(landmark, selectedLanguage, 'name')}</h5>
                            {landmark.targetNations?.includes(userRegion) && (
                              <Badge variant="outline" className="h-4 px-1 text-[8px] bg-orange-50 text-orange-600 border-orange-200 font-black animate-pulse">
                                {userRegion} PICK ✨
                              </Badge>
                            )}
                          </div>
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
                  <h5 className="font-bold text-sm">{t('myTour', selectedLanguage) || 'My Tour'} ({tourStops.length})</h5>
                  <Button
                    size="sm"
                    className={`rounded-full h-8 px-4 text-[10px] font-black tracking-widest transition-all duration-500 hover:scale-105 active:scale-95 ${isSimulationMode ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-100 ring-2 ring-red-100' : 'bg-gradient-to-r from-[#E9633F] to-[#FF8A65] text-white shadow-xl shadow-orange-100 ring-2 ring-orange-100'}`}
                    onClick={() => onToggleSimulation?.()}
                  >
                    {isSimulationMode ? (
                      <div className="flex items-center gap-1.5 uppercase">
                        <Square className="w-3 h-3 fill-current" />
                        <span>{t('stop', selectedLanguage) || 'Stop'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 uppercase">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t('startRoute', selectedLanguage) || 'Start'}</span>
                      </div>
                    )}
                  </Button>
                </div>

                {/* [DESIGNER KIM] 시뮬레이션 모드 시 상세 컨트롤 바 노출 (통합 UI) */}
                {isSimulationMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="overflow-hidden bg-slate-900/5 rounded-2xl border border-slate-200/50 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white shadow-sm border"
                          onClick={() => onSimulationPauseToggle?.()}
                        >
                          {isSimulationPaused ? <Play className="w-3.5 h-3.5 text-indigo-600 fill-current" /> : <Pause className="w-3.5 h-3.5 text-indigo-600 fill-current" />}
                        </Button>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          {isSimulationPaused ? (t('pause', selectedLanguage) || 'Paused') : 'Simulating'}
                        </span>
                      </div>

                      <div className="flex bg-white p-0.5 rounded-lg border shadow-sm">
                        {[1, 5, 10].map(speed => (
                          <Button
                            key={speed}
                            variant="ghost"
                            size="sm"
                            className={`h-6 px-2 text-[9px] font-black rounded-md transition-all ${simulationSpeed === speed ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-800'}`}
                            onClick={() => onSimulationSpeedChange?.(speed)}
                          >
                            {speed}x
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                {tourStops.length === 0 ? (
                  <div className="py-10 flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* [DESIGNER KIM] 웰컴 카드 - 프리미엄 아이콘 배치 */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                      <div className="relative w-20 h-20 rounded-3xl glass-premium aurora-border-premium flex items-center justify-center shadow-xl">
                        <MapPinned className="w-10 h-10 text-primary animate-bounce-slow" />
                      </div>
                    </div>

                    <div className="space-y-2 px-4">
                      <h6 className="font-black text-lg text-slate-800 tracking-tight">
                        {t('tourEmptyState', selectedLanguage) || 'Start Your Personal Tour'}
                      </h6>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {t('createRoutePrompt', selectedLanguage) || 'Tap + on the map to build your custom tour route!'}
                      </p>
                    </div>

                    {/* [적요] 학생들을 위한 코드 설명: Empty State는 서비스의 'First Action'을 명확히 유도해야 합니다. */}
                    <div className="w-full pt-4 border-t border-slate-100/50">
                      <div className="grid grid-cols-2 gap-3 px-2">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                          <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
                            <Plus className="w-3.5 h-3.5 text-orange-600" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-700">{selectedLanguage === 'ko' ? '명소 추가' : 'Add Spot'}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                          <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                            <Play className="w-3.5 h-3.5 text-indigo-600" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-700">{selectedLanguage === 'ko' ? '투어 시작' : 'Start Tour'}</p>
                        </div>
                      </div>
                    </div>
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
                      {t('aiTourRecommendation', selectedLanguage)}
                    </h5>
                    <p className="text-[10px] text-muted-foreground">
                      {t('aiRecommendationDesc', selectedLanguage)}
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
                      ⏱ {t('minutes', selectedLanguage)}: {aiRecommendation.totalEstimatedTime} {t('timeMinutes', selectedLanguage) || 'min'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center">
                      <Wand2 className="w-7 h-7 text-purple-400" />
                    </div>
                    <p className="text-xs text-center text-muted-foreground px-4">
                      {t('aiRecommendationHint', selectedLanguage)}
                    </p>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 h-10 gap-2 shadow-md shadow-purple-200"
                      onClick={() => { onOpenAIRecommend?.(); }}
                    >
                      <Wand2 className="w-4 h-4" />
                      {t('getAIRecommendation', selectedLanguage)}
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
        onMinimizeToMenu={onMinimizeToMenu}
        isInTour={isInTour}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}

