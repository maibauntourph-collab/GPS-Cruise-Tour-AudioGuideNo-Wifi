import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Settings,
  List,
  Navigation2,
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  Clock,
  EyeOff,
  ZoomIn,
  TrendingUp,
  QrCode,
  Share2,
  User,
  Activity as ActivityIcon,
  Utensils,
  ShoppingBag,
  Landmark as LandmarkIcon,
  Cat,
  Route,
  ChevronDown,
  Plane,
  Ship,
  Hotel,
  MapPin,
  Circle,
  Flag,
  Search,
  Loader2,
  Star,
  Download,
  SlidersHorizontal,
  Navigation as AudioIcon,
  AudioLines
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import html2canvas from 'html2canvas';
import { flushSync } from 'react-dom';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { Landmark, City } from '@shared/schema';
import MapView from '@/components/MapView';
import { UnifiedFloatingCard } from '@/components/UnifiedFloatingCard';
import MenuDialog from '@/components/MenuDialog';
import StartupDialog from '@/components/StartupDialog';
import AIRecommendDialog from '@/components/AIRecommendDialog';
import AudioDownloadDialog from '@/components/AudioDownloadDialog';
import { CitySelector } from '@/components/CitySelector';

// Landing Data fallback if schema doesn't export it
const LANDING_DATA: Record<string, any> = {
  'venice': {
    'ko': { title: '물 위의 도시, 베네치아', subTitle: '곤돌라와 함께하는 낭만 여행', heroImage: 'https://images.unsplash.com/photo-1514890547357-a9ee2887a35f?w=400&q=70' },
    'en': { title: 'Venice, City of Water', subTitle: 'Romantic journey with gondolas', heroImage: 'https://images.unsplash.com/photo-1514890547357-a9ee2887a35f?w=400&q=70' }
  },
  'rome': {
    'ko': { title: '영원한 도시, 로마', subTitle: '고대 로마의 숨결을 느끼다', heroImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=70' },
    'en': { title: 'Rome, The Eternal City', subTitle: 'Feel the breath of Ancient Rome', heroImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=70' }
  },
  'paris': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=70' }
  },
  'london': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=70' }
  },
  'barcelona': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=70' }
  },
  'penang': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1596701540321-7299723bd739?w=400&q=70' }
  },
  'singapore': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=70' }
  },
  'cebu': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=400&q=70' }
  },
  'naples': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=400&q=70' }
  },
  'kuala-lumpur': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1596422846543-74c6fc1e4b6e?w=400&q=70' }
  },
  'phuket': {
    'en': { heroImage: 'https://images.unsplash.com/photo-1589394815804-964ce0ff96c7?w=400&q=70' }
  }
};
import LoginDialog from '@/components/LoginDialog';
import SaveRouteDialog from '@/components/SaveRouteDialog';
import OfflineIndicator from '@/components/OfflineIndicator';
import InstallPrompt from '@/components/InstallPrompt';
import UpdatePrompt from '@/components/UpdatePrompt';
import AchievementToast from '@/components/AchievementToast';
import CreatorDashboard from '@/components/CreatorDashboard';
import BottomSheet from '@/components/BottomSheet';

import { useLanguage } from '@/context/LanguageContext';
import { t, getTranslatedContent } from '@/lib/translations';
import { calculateDistance, checkProximity } from '@/lib/geoUtils';
import { audioService } from '@/lib/audioService';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { useDeviceCapabilities } from '@/hooks/useDeviceDetection';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useToast } from '@/hooks/use-toast';
import { encryptData, decryptData, downloadEncryptedData, readEncryptedFile } from '@/lib/offlineDataEncryption';
import { getStartingPointName, getCityStartingPoints } from '@/lib/startingPoints';

// Global variable for deployment date tracking
declare const __DEPLOY_DATE__: string;

export default function Home() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const selectedLanguage = language;
  const setSelectedLanguage = setLanguage;
  const { toast } = useToast();
  const { isVisited, markVisited } = useVisitedLandmarks();
  const deviceCapabilities = useDeviceCapabilities();
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  // State
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCityId, setSelectedCityId] = useState<string>('default');
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechRate, setSpeechRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [tourStops, setTourStops] = useState<Landmark[]>([]);
  const [tourRouteInfo, setTourRouteInfo] = useState<{
    distance: number;
    duration: number;
    segments: Array<{ from: string; to: string; distance: number; duration: number }>;
  } | null>(null);
  const [tourStopDurations, setTourStopDurations] = useState<Record<string, number>>({});
  const [tourTimePerStop, setTourTimePerStop] = useState(20);
  const [offlineMode, setOfflineMode] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showActivities, setShowActivities] = useState(false);
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [showGiftShops, setShowGiftShops] = useState(false);
  const [showCruisePort, setShowCruisePort] = useState(false);
  const [showAIRecommend, setShowAIRecommend] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<Landmark | null>(null);

  // New features state
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationStepIndex, setSimulationStepIndex] = useState(0);
  const [simulatedPosition, setSimulatedPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [spokenLandmarks, setSpokenLandmarks] = useState<Set<string>>(new Set());

  // Search and selection
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [searchedLocations, setSearchedLocations] = useState<Array<{ id: string; name: string; lat: number; lng: number }>>([]);
  const [startingPoint, setStartingPoint] = useState<any | null>(null);
  const [endPoint, setEndPoint] = useState<any | null>(null);
  const [departureTime, setDepartureTime] = useState<Date | null>(null);
  const [isSelectingHotelOnMap, setIsSelectingHotelOnMap] = useState(false);
  const [isSelectingEndPointOnMap, setIsSelectingEndPointOnMap] = useState(false);
  const [isStartingPointPopoverOpen, setIsStartingPointPopoverOpen] = useState(false);
  const [pointSelectionMode, setPointSelectionMode] = useState<'start' | 'end' | 'time'>('start');

  // UI States
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  // ✅ [마스터 모드 시스템 | 2026-02-27] AppMode 단일 상태로 UI를 통합 제어합니다.
  // 학생들에게: 기존에 4개 상태(isNavigationOnlyMode, forceShowCard, temporaryShowCard, isCardMinimized)가
  // 서로 충돌하던 것을 **하나의 명확한 모드**로 통합했습니다. 이것이 '상태 머신(State Machine)'입니다!
  // map     → 지도만 보이고 카드는 숨김 (기본 상태)
  // list    → 랜드마크 목록 카드 표시
  // detail  → 특정 랜드마크 상세 카드 표시
  // nav     → 길 안내 전용 모드 (지도 확대)
  // simulation → 시뮬레이션 모드
  type AppMode = 'map' | 'list' | 'detail' | 'nav' | 'simulation';
  const [appMode, setAppMode] = useState<AppMode>('map');
  // 뒤로가기를 위해 이전 모드를 기억합니다. (예: list → detail → 뒤로 → list)
  const prevAppModeRef = useRef<AppMode>('map');

  // 모드를 전환하는 안전한 헬퍼 함수: 이전 모드를 항상 저장합니다.
  const transitionTo = useCallback((nextMode: AppMode) => {
    prevAppModeRef.current = appMode;
    setAppMode(nextMode);
    // [적요] 모드 전환 시 카드 최소화 해제 (list/detail 진입 시 항상 카드가 펼쳐짐)
    if (nextMode !== 'map') setIsCardMinimized(false);
  }, [appMode]);

  // [파생 상태] 카드가 보여야 하는지를 appMode 하나로 결정합니다.
  // 학생들: 이제 버튼 하나 = setAppMode 한 줄이면 끝입니다!
  const isCardVisible = appMode !== 'map' || isSimulationMode;

  const [showMinimalTransitUI, setShowMinimalTransitUI] = useState(false);
  const [activeRoute, setActiveRoute] = useState<Landmark | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [hasArrivedAtDestination, setHasArrivedAtDestination] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showCreatorDashboard, setShowCreatorDashboard] = useState(false);
  const [isCapturingRoute, setIsCapturingRoute] = useState(false);
  const [capturedRouteImage, setCapturedRouteImage] = useState<string | null>(null);
  const [showSaveRouteDialog, setShowSaveRouteDialog] = useState(false);
  const [showAudioDownloadDialog, setShowAudioDownloadDialog] = useState(false);
  const [audioDownloadLanguage, setAudioDownloadLanguage] = useState(selectedLanguage);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showTourOnly, setShowTourOnly] = useState(false);
  const [pendingLandmark, setPendingLandmark] = useState<Landmark | null>(null);
  const [showDirectionsDialog, setShowDirectionsDialog] = useState(false);
  // [신기능 | 2026-02-27] 랜딩 전 국가/도시 선택 카드 표시 상태
  // 학생들: 앱 시작 시 이 flag가 true가 되면 국가 선택 카드를 보여줍니다.
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  // Stats
  const [showUpdateStats, setShowUpdateStats] = useState(false);
  const [updateStatsSummary, setUpdateStatsSummary] = useState<any>(null);

  // [Bug Doctor] Refs
  const lastProximityCheckRef = useRef<number>(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userHasInteractedRef = useRef(false);

  // Mode settings
  const [isCarNavZoomMode, setIsCarNavZoomMode] = useState(false);
  // ✅ [Bug Doctor | 2026-02-27] 시뮬레이션 컨트롤 바 최소화 토글 상태
  const [isSimulationBarMinimized, setIsSimulationBarMinimized] = useState(false);
  // [하위 호환성] 시뮬레이션 관련 기존 설정 유지
  const [simulationAudioSettings, setSimulationAudioSettings] = useState({
    resumePlayback: true,
    playInBackground: false
  });

  // Dodari Architecture states
  const [isWelcomeHandled, setIsWelcomeHandled] = useState(false);
  const [showStartupDialog, setShowStartupDialog] = useState(false);
  const [isStartupTransitioning, setIsStartupTransitioning] = useState(false);
  const [hasCheckedForStartup, setHasCheckedForStartup] = useState(false);
  const [landingCityId, setLandingCityId] = useState<string | null>(null);
  const [hasShownLandingThisSession, setHasShownLandingThisSession] = useState<Set<string>>(new Set());
  const [lastUIAction, setLastUIAction] = useState<'NONE' | 'CITY_CHANGE' | 'STARTUP_FINISH'>('NONE');
  const [isBackgroundGuideEnabled, setIsBackgroundGuideEnabled] = useState(false);
  const [showBackgroundGuideDialog, setShowBackgroundGuideDialog] = useState(false);
  // [하위 호환성] Dodari Architecture states

  // Queries
  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['/api/cities']
  });

  const { data: landmarks = [], isLoading: landmarksLoading } = useQuery<Landmark[]>({
    queryKey: [`/api/cities/${selectedCityId}/landmarks`],
    enabled: selectedCityId !== 'default'
  });

  const selectedCity = useMemo(() =>
    cities.find(c => c.id === selectedCityId),
    [cities, selectedCityId]
  );

  const isMobile = useMemo(() => deviceCapabilities.isMobile, [deviceCapabilities.isMobile]);
  const maxMarkers = useMemo(() => deviceCapabilities.maxMarkers, [deviceCapabilities.maxMarkers]);

  const effectivePosition = isSimulationMode && simulatedPosition
    ? simulatedPosition
    : (position?.coords ? { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy } : null);

  // Effects
  useEffect(() => {
    if (!gpsEnabled) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setIsLoading(false);
        if (err.code === 1) { // PERMISSION_DENIED
          setGpsEnabled(false);
        }
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [gpsEnabled]);

  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  // Audio service initialization
  useEffect(() => {
    audioService.setOnStateChange((speaking: boolean) => {
      setIsSpeaking(speaking);
    });
    return () => audioService.setOnStateChange(null);
  }, []);

  // Handlers
  const handleCityChange = useCallback((cityId: string) => {
    setSelectedCityId(cityId);
    setTourStops([]);
    setSelectedLandmark(null);
    setActiveRoute(null);
    setTourStopDurations({});
    setShowMenu(false);
    setLastUIAction('CITY_CHANGE');
  }, []);

  // ✅ [마스터 모드 시스템 | 2026-02-27] List 버튼 클릭 핸들러
  // 학생들에게: 이제 setAppMode 한 줄이면 끝입니다! 기존 4줄 코드를 1줄로 줄였습니다.
  // 예시: transitionTo('list') 하면 자동으로 isCardMinimized=false가 되고, 카드가 표시됩니다.
  const handleShowLandmarkList = useCallback(() => {
    transitionTo('list');
    // 하위 컴포넌트(UnifiedFloatingCard)에 리스트 탭 포커스 신호 발사
    window.dispatchEvent(new CustomEvent('force-show-list-tab'));
  }, [transitionTo]);

  // [Bug Doctor] Style Guard: Modal closing might leave body scroll locked
  useEffect(() => {
    const isAnyModalOpen = showMenu || showStartupDialog || !!landingCityId || showAIRecommend || showLoginDialog || showSaveRouteDialog || showUpdateStats || showQrDialog;
    if (!isAnyModalOpen) {
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
    }
  }, [showMenu, showStartupDialog, landingCityId, showAIRecommend, showLoginDialog, showSaveRouteDialog, showUpdateStats, showQrDialog]);

  // [Bug Doctor] History Manager: Prevent modal lock
  useEffect(() => {
    const handlePopState = () => {
      setShowMenu(false);
      setShowStartupDialog(false);
      setLandingCityId(null);
      setShowAIRecommend(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // [교수님 지시 | 2026-02-27] Welcome Landing Page 자동 활성화를 중단합니다. 
  // 대신 사용자가 필요할 때 직접 접근하도록 유도하는 Remark를 남깁니다.
  useEffect(() => {
    if (isWelcomeHandled && !showStartupDialog && !landingCityId && !selectedLandmark && !isSimulationMode) {
      /* 
      const timer = setTimeout(() => {
        // [적요] 국가 선택 카드를 먼저 보여주고, 선택 후 list 모드로 전환합니다.
        setShowCountrySelector(true);
      }, 500);
      return () => clearTimeout(timer);
      */
      // 바로 목록 모드로 진입하거나 대기 상태로 유지합니다.
      transitionTo('list');
    }
  }, [isWelcomeHandled, showStartupDialog, landingCityId, selectedLandmark, isSimulationMode]);

  // [Dodari] Magic Landing Trigger
  useEffect(() => {
    if (isWelcomeHandled && !showStartupDialog && !landingCityId && effectivePosition && cities.length > 0) {
      for (const city of cities) {
        if (hasShownLandingThisSession.has(city.id)) continue;
        const dist = calculateDistance(effectivePosition.latitude, effectivePosition.longitude, city.lat, city.lng);
        if (dist < 5) {
          setLandingCityId(city.id);
          setHasShownLandingThisSession(prev => new Set(prev).add(city.id));
          break;
        }
      }
    }
  }, [isWelcomeHandled, showStartupDialog, landingCityId, effectivePosition, cities, hasShownLandingThisSession]);


  const handleToggleAudio = () => {
    const nextEnabled = !audioEnabled;
    setAudioEnabled(nextEnabled);
    if (!nextEnabled) {
      audioService.stopAll();
    }
  };

  const resetMapInteraction = () => {
    userHasInteractedRef.current = false;
    window.dispatchEvent(new CustomEvent('map-reset-interaction'));
  };

  const handleLandmarkRoute = (landmark: Landmark) => {
    setPendingLandmark(landmark);
    setShowDirectionsDialog(true);
  };

  const useInAppNavigation = () => {
    if (pendingLandmark) {
      setActiveRoute(pendingLandmark);
      setIsManualSelection(false);
      setHasArrivedAtDestination(false);
      // [적요] 인앱 길 안내 시 nav 모드로 전환 (이전에 forceShowCard 플래그 필요 없음)
      transitionTo('nav');
    }
    setShowDirectionsDialog(false);
  };

  const openGoogleMaps = () => {
    if (pendingLandmark) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${pendingLandmark.lat},${pendingLandmark.lng}&travelmode=walking`;
      window.open(url, '_blank');
    }
    setShowDirectionsDialog(false);
  };

  const openWaze = () => {
    if (pendingLandmark) {
      const url = `https://waze.com/ul?ll=${pendingLandmark.lat},${pendingLandmark.lng}&navigate=yes`;
      window.open(url, '_blank');
    }
    setShowDirectionsDialog(false);
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setRouteInfo(null);
    setHasArrivedAtDestination(false);
  };

  const handleSetBackgroundGuide = (enabled: boolean) => {
    setIsBackgroundGuideEnabled(enabled);
    setShowBackgroundGuideDialog(false);
    localStorage.setItem('background-guide-enabled', String(enabled));
    toast({
      description: enabled
        ? (selectedLanguage === 'ko' ? '📍 스마트 가이드가 활성화되었습니다.' : '📍 Smart guide activated.')
        : (selectedLanguage === 'ko' ? '📍 스마트 가이드가 비활성화되었습니다.' : '📍 Smart guide deactivated.')
    });
  };

  const handleToggleOfflineMode = (checked: boolean) => {
    setOfflineMode(checked);
  };

  const handleToggleGps = (checked: boolean) => {
    setGpsEnabled(checked);
    localStorage.setItem('gps-enabled', String(checked));
  };

  const handleDownloadData = async (password: string) => {
    try {
      const dataToExport = {
        landmarks,
        cities,
        selectedCityId,
        selectedLanguage,
        tourStops: tourStops.map(stop => stop.id),
        timestamp: new Date().toISOString()
      };

      const encryptedData = await encryptData(dataToExport, password);
      const filename = `gps-tour-${selectedCityId}-${Date.now()}.gpstour`;
      downloadEncryptedData(encryptedData, filename);

      toast({
        title: t('dataDownloadedSuccessfully', selectedLanguage),
        description: `File: ${filename}`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: t('invalidPasswordOrFile', selectedLanguage),
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleUploadData = async (file: File, password: string) => {
    try {
      const encryptedContent = await readEncryptedFile(file);
      const decryptedData = await decryptData(encryptedContent, password);

      // Restore data
      if (decryptedData.selectedCityId) {
        setSelectedCityId(decryptedData.selectedCityId);
      }
      if (decryptedData.selectedLanguage) {
        setSelectedLanguage(decryptedData.selectedLanguage);
      }
      if (decryptedData.tourStops && landmarks.length > 0) {
        const restoredStops = decryptedData.tourStops
          .map((id: string) => landmarks.find(l => l.id === id))
          .filter(Boolean);
        setTourStops(restoredStops);
      }

      toast({
        title: t('dataLoadedSuccessfully', selectedLanguage),
        description: `Restored from ${file.name}`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: t('invalidPasswordOrFile', selectedLanguage),
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleTestAudio = () => {
    audioService.unlockAudio();

    const testMessages = {
      en: "Welcome to GPS Audio Guide. This is a test of the audio narration system.",
      it: "Benvenuti alla Guida Audio GPS. Questo 챔 un test del sistema di narrazione audio.",
      ko: "GPS 오디오 가이드 서비스에 오신 것을 환영합니다. 이것은 오디오 해설 시스템의 테스트입니다."
    };
    const message = testMessages[selectedLanguage as keyof typeof testMessages] || testMessages.en;

    if (audioEnabled) {
      audioService.removeLandmark('test-audio');
      audioService.playAuto('test-audio', message, selectedLanguage);
    }
  };

  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
    audioService.setRate(rate);
  };

  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Failed to play click sound:', error);
    }
  };

  // Virtual Tour Simulation
  useEffect(() => {
    if (!isSimulationMode || !tourStops.length) {
      if (!isSimulationMode) {
        setSimulatedPosition(null);
        setIsSimulationPaused(false);
        setSimulationStepIndex(0);
      }
      return;
    }

    if (simulationStepIndex === 0 && !isSimulationPaused) {
      setSpokenLandmarks(new Set());
      audioService.clearSpokenLandmarks();
    }

    if (!simulatedPosition && tourStops[simulationStepIndex]) {
      const startStop = tourStops[simulationStepIndex];
      setSimulatedPosition({ latitude: startStop.lat, longitude: startStop.lng });
      setSelectedLandmark(startStop);
    }

    let progress = 0;
    const segmentDurationMs = 8000 / simulationSpeed;
    const pauseDurationMs = 5000 / simulationSpeed;
    const updateIntervalMs = 200;
    const progressStep = updateIntervalMs / segmentDurationMs;
    let currentFromIndex = simulationStepIndex;
    let isPausedAtStop = true;
    let pauseElapsed = 0;

    const intervalId = setInterval(() => {
      if (isSimulationPaused) return;

      if (isPausedAtStop) {
        pauseElapsed += updateIntervalMs;
        const isSpeaking = audioService.isSpeaking();

        if (pauseElapsed >= pauseDurationMs && !isSpeaking) {
          isPausedAtStop = false;
          pauseElapsed = 0;
          progress = 0;
          if (currentFromIndex >= tourStops.length - 1) {
            clearInterval(intervalId);
            return;
          }
        }
        return;
      }

      progress += progressStep;

      if (progress >= 1) {
        currentFromIndex = currentFromIndex + 1;
        setSimulationStepIndex(currentFromIndex);
        const arrivedAt = tourStops[currentFromIndex];
        if (arrivedAt) {
          setSimulatedPosition({ latitude: arrivedAt.lat, longitude: arrivedAt.lng });
          setSelectedLandmark(arrivedAt);

          const name = getTranslatedContent(arrivedAt, selectedLanguage, 'name');
          const narrationText = getTranslatedContent(arrivedAt, selectedLanguage, 'narration') || getTranslatedContent(arrivedAt, selectedLanguage, 'description');

          audioService.playAuto(
            arrivedAt.id,
            `${name}. ${narrationText}`,
            selectedLanguage
          );
        }
        isPausedAtStop = true;
        pauseElapsed = 0;
        progress = 0;
        return;
      }

      const fromStop = tourStops[currentFromIndex];
      const toStop = tourStops[currentFromIndex + 1];
      if (fromStop && toStop) {
        const lat = fromStop.lat + (toStop.lat - fromStop.lat) * progress;
        const lng = fromStop.lng + (toStop.lng - fromStop.lng) * progress;
        setSimulatedPosition({ latitude: lat, longitude: lng });
      }
    }, updateIntervalMs);

    return () => clearInterval(intervalId);
  }, [isSimulationMode, isSimulationPaused, tourStops, simulationSpeed, selectedLanguage, simulationStepIndex]);

  // Proximity detection
  useEffect(() => {
    if (!effectivePosition || !audioEnabled || !landmarks.length || offlineMode) return;

    const now = Date.now();
    if (now - lastProximityCheckRef.current < 2000) return;
    lastProximityCheckRef.current = now;

    const nearest = checkProximity(
      effectivePosition.latitude,
      effectivePosition.longitude,
      landmarks,
      spokenLandmarks,
      (effectivePosition as any).accuracy || 0
    );

    if (nearest) {
      const { landmark, distance } = nearest;
      const name = getTranslatedContent(landmark, selectedLanguage, 'name');
      const narrationText = getTranslatedContent(landmark, selectedLanguage, 'narration') || getTranslatedContent(landmark, selectedLanguage, 'description');

      audioService.playAuto(
        landmark.id,
        `${name}. ${narrationText}`,
        selectedLanguage
      );

      setSpokenLandmarks(prev => new Set(Array.from(prev).concat(landmark.id)));

      if (!isVisited(landmark.id)) {
        markVisited(landmark.id);
        toast({
          title: selectedLanguage === 'ko' ? '새로운 장소 발견!' : 'New Place Discovered!',
          description: name,
        });
      }

      setSelectedLandmark(landmark);
      setIsCardMinimized(false);
    } else {
      spokenLandmarks.forEach(landmarkId => {
        const landmark = landmarks.find(l => l.id === landmarkId);
        if (landmark) {
          const distance = calculateDistance(
            effectivePosition.latitude,
            effectivePosition.longitude,
            landmark.lat,
            landmark.lng
          );

          const resetRadius = (landmark.radius / 1000) * 5;
          if (distance > Math.max(resetRadius, 0.3)) {
            setSpokenLandmarks(prev => {
              const next = new Set(prev);
              next.delete(landmarkId);
              return next;
            });
            audioService.removeLandmark(landmarkId);
          }
        }
      });
    }
  }, [effectivePosition, landmarks, audioEnabled, spokenLandmarks, selectedLanguage, offlineMode]);

  // Location search
  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim() || !selectedCity) return;

    setIsSearchingLocation(true);
    try {
      const cityLat = selectedCity.lat;
      const cityLng = selectedCity.lng;
      const viewbox = `${cityLng - 0.5},${cityLat + 0.5},${cityLng + 0.5},${cityLat - 0.5}`;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(locationSearchQuery)}&` +
        `format=json&` +
        `limit=5&` +
        `viewbox=${viewbox}&` +
        `bounded=1`,
        {
          headers: {
            'Accept-Language': selectedLanguage
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const results = data.map((item: any) => ({
          name: item.display_name.split(',').slice(0, 2).join(', '),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));
        setLocationSearchResults(results);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const captureRouteImage = useCallback(async () => {
    if (!mapContainerRef.current || tourStops.length < 2) return;

    setIsCapturingRoute(true);
    try {
      const mapElement = mapContainerRef.current.querySelector('.leaflet-container') as HTMLElement;
      if (!mapElement) return;

      await new Promise(resolve => setTimeout(resolve, 500));

      const svgElements = mapElement.querySelectorAll('svg');
      svgElements.forEach(svg => {
        if (!svg.getAttribute('width')) {
          const rect = svg.getBoundingClientRect();
          svg.setAttribute('width', String(rect.width));
          svg.setAttribute('height', String(rect.height));
        }
      });

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 2,
        backgroundColor: '#f5f5f5',
        foreignObjectRendering: true,
        imageTimeout: 15000,
      });

      const imageData = canvas.toDataURL('image/png', 0.9);
      setCapturedRouteImage(imageData);
      // [적요] 라우트 캡처 후 list 모드로 전환 (컴포넌트가 보임)
      transitionTo('list');

      toast({
        title: selectedLanguage === 'ko' ? '경로 캡쳐 완료' : 'Route Captured',
        description: selectedLanguage === 'ko' ? '투어 경로가 저장되었습니다' : 'Tour route has been saved',
      });
    } catch (error) {
      console.error('Failed to capture route:', error);
    } finally {
      setIsCapturingRoute(false);
    }
  }, [tourStops.length, selectedLanguage, toast]);

  const handleAddToTour = (landmark: Landmark) => {
    if (tourStops.some(stop => stop.id === landmark.id)) {
      setTourStops(tourStops.filter(stop => stop.id !== landmark.id));
      setTourStopDurations(prev => {
        const updated = { ...prev };
        delete updated[landmark.id];
        return updated;
      });
    } else {
      setTourStops([...tourStops, landmark]);
      setTourStopDurations(prev => ({
        ...prev,
        [landmark.id]: tourTimePerStop
      }));
      playClickSound();
      toast({
        description: getTranslatedContent(landmark, selectedLanguage, 'name') + (selectedLanguage === 'ko' ? ' 투어에 추가됨' : ' added to tour'),
        duration: 2000,
      });
    }
  };

  const handleUpdateStopDuration = (landmarkId: string, duration: number) => {
    setTourStopDurations(prev => ({
      ...prev,
      [landmarkId]: duration
    }));
  };

  const handleClearTour = () => {
    setTourStops([]);
    setTourRouteInfo(null);
    setTourStopDurations({});
  };

  const handleStartupClose = () => {
    setShowStartupDialog(false);
    setIsStartupTransitioning(true);
    sessionStorage.setItem('startup-dialog-shown', 'true');
    setLastUIAction('NONE');
    setTimeout(() => setIsStartupTransitioning(false), 600);
  };

  const handleSelectGPS = () => {
    audioService.unlockAudio();
    handleStartupClose();
    setLastUIAction('STARTUP_FINISH');
    if (position && cities.length > 0) {
      let nearestCity = cities[0];
      let minDistance = Infinity;
      cities.forEach(city => {
        const distance = calculateDistance(position.coords.latitude, position.coords.longitude, city.lat, city.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      });
      setSelectedCityId(nearestCity.id);
    }
  };

  const handleRestoreTour = (data: { cityId: string; tourStops: string[]; tourTimePerStop: number }) => {
    handleStartupClose();
    setSelectedCityId(data.cityId);
    setTourTimePerStop(data.tourTimePerStop);

    const restoreTourStopsWhenReady = () => {
      if (landmarks.length > 0) {
        const restoredStops = data.tourStops
          .map(id => landmarks.find(l => l.id === id))
          .filter((l): l is Landmark => l !== undefined);

        if (restoredStops.length > 0) {
          setTourStops(restoredStops);
          toast({
            description: selectedLanguage === 'ko' ? ` ${restoredStops.length}개의 명소가 복원되었습니다.` : ` Restored ${restoredStops.length} tour stops`,
            duration: 3000,
          });
        }
      } else {
        setTimeout(restoreTourStopsWhenReady, 500);
      }
    };

    if (data.cityId === selectedCityId && landmarks.length > 0) {
      restoreTourStopsWhenReady();
    } else {
      setTimeout(restoreTourStopsWhenReady, 1000);
    }
  };

  const handleTourRouteFound = (route: any) => {
    if (route && route.summary) {
      const segments: Array<{ from: string; to: string; distance: number; duration: number }> = [];
      if (route.legs && route.legs.length > 0 && tourStops.length >= 2) {
        for (let i = 0; i < route.legs.length && i < tourStops.length - 1; i++) {
          const leg = route.legs[i];
          segments.push({
            from: getTranslatedContent(tourStops[i], selectedLanguage, 'name'),
            to: getTranslatedContent(tourStops[i + 1], selectedLanguage, 'name'),
            distance: leg.summary?.totalDistance || leg.distance || 0,
            duration: leg.summary?.totalTime || leg.time || leg.duration || 0
          });
        }
      }
      setTourRouteInfo({
        distance: route.summary.totalDistance,
        duration: route.summary.totalTime,
        segments
      });
    }
  };

  const handleAiRecommendation = () => {
    setShowAIRecommend(true);
  };

  const handleToggleLandmarks = () => setShowLandmarks(!showLandmarks);
  const handleToggleActivities = () => setShowActivities(!showActivities);
  const handleToggleRestaurants = () => setShowRestaurants(!showRestaurants);
  const handleToggleGiftShops = () => setShowGiftShops(!showGiftShops);

  const filteredByCategory = landmarks.filter(landmark => {
    const isActivity = landmark.category === 'Activity';
    const isRestaurant = landmark.category === 'Restaurant';
    const isGiftShop = landmark.category === 'Gift Shop' || landmark.category === 'Shop';
    if (isActivity) return showActivities;
    if (isRestaurant) return showRestaurants;
    if (isGiftShop) return showGiftShops;
    return showLandmarks;
  });

  const filteredLandmarks = deviceCapabilities.isLowEnd && effectivePosition
    ? filteredByCategory
      .map(landmark => ({
        ...landmark,
        distance: calculateDistance(effectivePosition.latitude, effectivePosition.longitude, landmark.lat, landmark.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMarkers)
    : filteredByCategory;

  if (citiesLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading cities...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex w-full flex-1 flex-col h-screen overflow-hidden bg-background">
        {/* Startup Dialog */}
        {/* 
          [교수님 노트: 컴포넌트 간의 대화 - Props Drilling 해결]
          @에이? "부모인 Home에서 관리하는 setSelectedLanguage 함수를 자식인 StartupDialog에 
          onLanguageChange라는 이름의 프롭으로 주입해주는 모습입니다. 이것이 리액트의 기본적인 데이터 흐름이죠."
        */}
        <StartupDialog
          isOpen={showStartupDialog}
          onClose={handleStartupClose}
          onSelectGPS={handleSelectGPS}
          onRestoreTour={handleRestoreTour}
          savedTourData={null}
          selectedLanguage={selectedLanguage}
          onLanguageChange={(lang) => setSelectedLanguage(lang)}
          isGpsAvailable={!!position}
          isGpsLoading={isLoading}
        />

        {/* ✅ [신기능 | 2026-02-27] 국가/도시 선택 카드 (랜딩 전 표시)
            학생들: AnimatePresence + motion.div 조합으로 부드러운 슬라이드-업 애니메이션을 구현합니다.
            플로우: StartupDialog 완료 → 0.5초 후 이 카드 표시 → 도시 선택 → list 모드 */}
        <AnimatePresence>
          {showCountrySelector && (
            <motion.div
              key="country-selector"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-0 flex flex-col justify-end"
              style={{ zIndex: 3500, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            >
              <div className="bg-white rounded-t-3xl shadow-2xl p-6 pb-10 max-h-[88vh] overflow-y-auto">
                {/* 상단 핸들 바 */}
                <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-5" />
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800">
                      🌍 {selectedLanguage === 'ko' ? '여행지를 선택하세요' : 'Select Destination'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedLanguage === 'ko' ? '크루즈 기항지 오디오 가이드' : 'Cruise Port Audio Guide'}
                    </p>
                  </div>
                  <button
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors font-bold"
                    onClick={() => { setShowCountrySelector(false); transitionTo('list'); }}
                  >✕</button>
                </div>

                {/* 도시 검색창 추가 */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={selectedLanguage === 'ko' ? '목적지 검색...' : 'Search destination...'}
                    className="pl-9 h-10 bg-slate-100 border-none rounded-xl"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                  />
                </div>

                {/* 도시 카드 그리드 */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {cities.length === 0 ? (
                    // 로딩 스켈레톤
                    [1, 2, 3, 4].map(i => (
                      <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
                    ))
                  ) : cities.filter(c => {
                    // [Bug Doctor] 검색 시 다국어(한국어) 입력을 영어 이름으로 변환하여 매칭을 돕는 매핑 테이블
                    const KOREAN_CITY_MAP: Record<string, string[]> = {
                      'roma': ['로마'],
                      'rome': ['로마'],
                      'venice': ['베네치아', '베니스'],
                      'paris': ['파리'],
                      'london': ['런던'],
                      'barcelona': ['바르셀로나'],
                      'penang': ['페낭'],
                      'singapore': ['싱가포르', '싱가폴'],
                      'cebu': ['세부'],
                      'naples': ['나폴리'],
                      'kuala-lumpur': ['쿠알라룸푸르', '쿠알라 룸푸르'],
                      'phuket': ['푸껫', '푸켓']
                    };

                    const searchLower = citySearchQuery.toLowerCase();
                    const nameLower = c.name.toLowerCase();
                    const countryLower = c.country.toLowerCase();
                    const citySlug = nameLower.replace(/[\s_]+/g, '-');

                    const matchDirect = nameLower.includes(searchLower) || countryLower.includes(searchLower);
                    const matchKorean = KOREAN_CITY_MAP[citySlug] && KOREAN_CITY_MAP[citySlug].some(koreanName => koreanName.includes(searchLower));

                    return matchDirect || matchKorean;
                  }).map((city) => {
                    // [Bug Doctor] city.id가 UUID 등일 경우를 대비해 name을 slug로 변환하여 매칭합니다. (예: "Kuala Lumpur" -> "kuala-lumpur")
                    const citySlug = city.name.toLowerCase().replace(/[\s_]+/g, '-');
                    const landingContent = (city as any)?.landingContent || LANDING_DATA[citySlug] || LANDING_DATA[city.id];

                    const content = landingContent?.[selectedLanguage] || landingContent?.['en'];
                    // 기본 이미지 (로마 콜로세움) 대신 각 도시의 랜딩 이미지를 활용합니다.
                    const cityImage = content?.heroImage || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=70';

                    return (
                      <button
                        key={city.id}
                        className={`relative rounded-2xl overflow-hidden h-40 group shadow-md hover:shadow-xl transition-all active:scale-95 ${selectedCityId === city.id ? 'ring-3 ring-orange-500 ring-offset-2' : ''}`}
                        onClick={() => {
                          // [적요] 도시 선택 → 도시 변경 → 카드 닫기 → list 모드 진입
                          handleCityChange(city.id);
                          setShowCountrySelector(false);
                          setTimeout(() => transitionTo('list'), 200);
                        }}
                      >
                        {/* 배경: 도시별 Unsplash 이미지 */}
                        <img
                          src={cityImage}
                          alt={city.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 text-left">
                          <div className="text-white font-black text-base leading-tight drop-shadow">{city.name}</div>
                          <div className="text-white/80 text-xs font-medium">{city.country}</div>
                        </div>
                        {selectedCityId === city.id && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* CTA 버튼 */}
                <button
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-lg shadow-lg shadow-orange-200 active:scale-95 transition-all hover:shadow-xl"
                  onClick={() => { setShowCountrySelector(false); transitionTo('list'); }}
                >
                  {selectedLanguage === 'ko' ? '🗺️ 랜드마크 목록 보기' : '🗺️ View Landmark List'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar - Top Center */}
        {!isSimulationMode && (
          <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-[2000] w-fit">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-2 p-2 bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-full"
            >
              <Button
                variant="ghost"
                className="h-10 px-5 rounded-full hover:bg-white/40 text-slate-700 font-bold flex items-center gap-2 transition-all active:scale-95 group"
                onClick={handleShowLandmarkList}
              >
                <List className="w-5 h-5 text-orange-500 group-hover:rotate-12 transition-transform" />
                <span>List</span>
              </Button>

              <div className="w-[1px] h-6 bg-slate-300/50" />

              <Button
                variant="ghost"
                className="h-10 px-6 rounded-full bg-indigo-600/90 text-white font-black hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2 transition-all active:scale-95"
                onClick={() => {
                  // [적요] Start 버튼: simulation 모드로 전환
                  // prevMode 를 map으로 저장하고 simulation으로 진입
                  transitionTo('simulation');
                  setIsSimulationMode(true);
                  setIsSimulationPaused(false);
                  toast({
                    title: selectedLanguage === 'ko' ? '가상 투어 시작' : 'Virtual Tour Start',
                    description: selectedLanguage === 'ko' ? '자동 항해 시뮬레이션을 시작합니다.' : 'Starting auto-cruise simulation.'
                  });
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start</span>
              </Button>

              <div className="w-[1px] h-6 bg-slate-300/50" />

              <Popover open={isStartingPointPopoverOpen} onOpenChange={setIsStartingPointPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 px-5 rounded-full hover:bg-white/40 text-slate-700 font-bold flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Route className="w-5 h-5 text-emerald-500" />
                    <span>Route</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-3xl shadow-2xl p-4 border-none bg-white/95 backdrop-blur-xl" align="center" sideOffset={15}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <Route className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">
                      {selectedLanguage === 'ko' ? '출발지 설정' : 'Starting Point'}
                    </h3>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-3 h-auto py-3 rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 transition-colors"
                      onClick={() => {
                        if (effectivePosition) {
                          setStartingPoint({
                            id: 'my_location',
                            type: 'my_location',
                            name: selectedLanguage === 'ko' ? '내 위치' : 'My Location',
                            lat: effectivePosition.latitude,
                            lng: effectivePosition.longitude
                          });
                          setIsStartingPointPopoverOpen(false);
                          toast({ title: selectedLanguage === 'ko' ? '출발지 설정 완료' : 'Starting point set' });
                        } else {
                          toast({
                            title: selectedLanguage === 'ko' ? 'GPS 권한 필요' : 'GPS Required',
                            variant: 'destructive'
                          });
                        }
                      }}
                    >
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <div className="text-left">
                        <div className="font-bold text-slate-800">{selectedLanguage === 'ko' ? '현재 위치 (GPS)' : 'Current Location (GPS)'}</div>
                        <div className="text-xs text-slate-500 font-medium">{selectedLanguage === 'ko' ? '가장 정확한 경로 탐색' : 'Most accurate routing'}</div>
                      </div>
                    </Button>

                    {selectedCityId && getCityStartingPoints(selectedCityId) && (
                      <div className="pt-2">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
                          {selectedLanguage === 'ko' ? '주요 거점' : 'Major Hubs'}
                        </div>
                        <div className="space-y-1">
                          {[
                            ...getCityStartingPoints(selectedCityId)!.cruiseTerminals,
                            ...getCityStartingPoints(selectedCityId)!.airports,
                            ...getCityStartingPoints(selectedCityId)!.trainStations
                          ].map(point => (
                            <Button
                              key={point.id}
                              variant="ghost"
                              className="w-full justify-start gap-3 h-auto py-2.5 rounded-xl hover:bg-slate-100 group"
                              onClick={() => {
                                setStartingPoint(point);
                                setIsStartingPointPopoverOpen(false);
                                toast({
                                  title: selectedLanguage === 'ko' ? '출발지 설정 완료' : 'Starting point set',
                                  description: getStartingPointName(point, selectedLanguage)
                                });
                              }}
                            >
                              <div className="p-1.5 rounded-full bg-slate-100 group-hover:bg-white transition-colors">
                                {point.type === 'cruise_terminal' && <Ship className="w-4 h-4 text-blue-500" />}
                                {point.type === 'airport' && <Plane className="w-4 h-4 text-sky-500" />}
                                {point.type === 'train_station' && <Navigation2 className="w-4 h-4 text-indigo-500" />}
                              </div>
                              <span className="text-sm font-semibold text-slate-700">{getStartingPointName(point, selectedLanguage)}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {startingPoint && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <Button
                        variant="outline"
                        className="w-full h-11 text-red-500 font-bold hover:text-red-600 hover:bg-red-50 border-red-100 rounded-xl"
                        onClick={() => {
                          setStartingPoint(null);
                          setEndPoint(null);
                          setActiveRoute(null);
                          setIsStartingPointPopoverOpen(false);
                          toast({ title: selectedLanguage === 'ko' ? '경로가 초기화되었습니다' : 'Route cleared' });
                        }}
                      >
                        {selectedLanguage === 'ko' ? '경로 초기화' : 'Clear Route'}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </motion.div>
          </div>
        )}

        {/* Simulation Control Bar */}
        {isSimulationMode && (() => {
          // ✅ [Bug Doctor] 시뮬레이션 바가 로컬 최소화 상태를 갖도록 조건부 렌더링 적용
          // 학생들에게: 외부 상태를 수정하지 않고 컴포넌트 내부에서 IIFE로 상태를 관리할 수 있습니다.
          // 단, 실제로는 useState를 상위에서 선언하는 것이 더 깔끔합니다.
          const isBarMinimized = isSimulationBarMinimized;
          return (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000]">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl flex items-center gap-5 text-white"
              >
                {/* SIMULATION 라벨 - 클릭 시 최소화/최대화 토글 */}
                <div
                  className="flex items-center gap-2 pr-4 border-r border-white/10 cursor-pointer group select-none"
                  onClick={() => setIsSimulationBarMinimized(!isBarMinimized)}
                  title={isBarMinimized ? 'Expand controls' : 'Minimize controls'}
                >
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                    Simulation
                  </span>
                  {/* 최소화 상태 표시 아이콘 */}
                  <span className="text-slate-500 text-xs group-hover:text-white transition-colors">
                    {isBarMinimized ? '▲' : '▼'}
                  </span>
                </div>

                {/* 최소화 시 컨트롤 숨김 */}
                {!isBarMinimized && (
                  <>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-white hover:bg-white/10 rounded-full"
                        onClick={() => {
                          setIsSimulationPaused(!isSimulationPaused);
                          if (!isSimulationPaused) audioService.pause();
                          else audioService.resume();
                        }}
                      >
                        {isSimulationPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-white hover:bg-white/10 rounded-full"
                        onClick={() => {
                          setSimulationStepIndex(0);
                          setSimulatedPosition(null);
                          setIsSimulationPaused(false);
                          audioService.stopAll();
                        }}
                      >
                        <RotateCcw className="w-5 h-5" />
                      </Button>

                      <div className="flex bg-white/5 p-1 rounded-xl">
                        {[1, 5, 10].map(speed => (
                          <Button
                            key={speed}
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 text-xs font-black rounded-lg transition-all ${simulationSpeed === speed ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                            onClick={() => setSimulationSpeed(speed)}
                          >
                            {speed}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="w-[1px] h-6 bg-white/10" />

                    <Button
                      variant="ghost"
                      className="h-10 px-4 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 group"
                      onClick={handleShowLandmarkList}
                    >
                      <List className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                      <span className="font-bold">List</span>
                    </Button>

                    <div className="w-[1px] h-6 bg-white/10" />
                  </>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 bg-white/5 hover:bg-red-500/20 text-white rounded-full transition-colors"
                  onClick={() => {
                    // [적요] 시뮬레이션 종료 시 map 모드로 복관
                    setIsSimulationMode(false);
                    setIsSimulationPaused(false);
                    setIsSimulationBarMinimized(false);
                    setAppMode('map');
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>
          );
        })()}

        <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-md z-[1001] shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-serif font-black text-xl tracking-tight text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Cruise Guide
            </h1>
            <div className="hidden sm:block">
              <CitySelector
                cities={cities}
                selectedCityId={selectedCityId}
                onCityChange={handleCityChange}
                selectedLanguage={selectedLanguage}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block">
              <Badge variant="outline" className="px-3 py-1 bg-indigo-500/5 text-indigo-600 border-indigo-200 font-mono text-[10px] flex items-center gap-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                LIVE: {__DEPLOY_DATE__.split(' ')[0]}
              </Badge>
            </div>

            {isMobile && (
              <div className="flex items-center gap-2">
                <CitySelector
                  cities={cities}
                  selectedCityId={selectedCityId}
                  onCityChange={handleCityChange}
                  selectedLanguage={selectedLanguage}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-slate-200"
                  onClick={() => setShowMenu(true)}
                >
                  <SlidersHorizontal className="h-5 w-5 text-slate-600" />
                </Button>
              </div>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(true)}
                className="h-9 w-9 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                <Settings className="h-5 w-5 text-slate-600" />
              </Button>
            )}
          </div>
        </header>

        <main className="relative flex-1 overflow-hidden">
          <AnimatePresence>
            {isStartupTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[2500] bg-white/60 backdrop-blur-xl flex items-center justify-center pointer-events-none"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <p className="text-sm font-black text-primary tracking-widest uppercase animate-pulse">Setting Course...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={mapContainerRef} className="w-full h-full relative">
            <MapView
              landmarks={filteredLandmarks}
              userPosition={effectivePosition}
              onLandmarkRoute={handleLandmarkRoute}
              activeRoute={activeRoute && (activeRoute as any).lat !== undefined ? { start: [(activeRoute as any).lat, (activeRoute as any).lng], end: [(activeRoute as any).lat, (activeRoute as any).lng] } : null}
              onRouteFound={setRouteInfo}
              cityCenter={selectedCity ? [selectedCity.lat, selectedCity.lng] : undefined}
              cityZoom={selectedCity?.zoom}
              selectedLanguage={selectedLanguage}
              isSimulationMode={isSimulationMode}
              tourStops={tourStops}
              onAddToTour={handleAddToTour}
              onTourRouteFound={handleTourRouteFound}
              startingPoint={startingPoint}
              endPoint={endPoint}
              isSelectingHotelOnMap={isSelectingHotelOnMap}
              isSelectingEndPointOnMap={isSelectingEndPointOnMap}
              onHotelLocationSelected={(lat, lng) => {
                setStartingPoint({ id: 'hotel', type: 'hotel', name: t('hotel', selectedLanguage), lat, lng });
                setIsSelectingHotelOnMap(false);
              }}
              onEndPointLocationSelected={(lat, lng) => {
                setEndPoint({ id: 'end', type: 'hotel', name: 'Destination', lat, lng });
                setIsSelectingEndPointOnMap(false);
              }}
              selectedLandmark={selectedLandmark}
              onLandmarkSelect={(l) => {
                // [적요] 지도에서 마커 탭 시 detail 모드로 진입
                // prevAppModeRef를 현재 모드로 기록 (map 또는 list)
                setIsManualSelection(true);
                prevAppModeRef.current = appMode;
                setSelectedLandmark(l);
                setAppMode('detail');
                setIsCardMinimized(false);
              }}
              isMobile={isMobile}
              isCarNavZoomMode={isCarNavZoomMode}
            />

            {/* 캫드가 단힐 상태에서 'VIEW LIST' 버튼 표시 */}
            {isCardMinimized && appMode !== 'map' && (
              <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 z-[1500]">
                <Button
                  className="h-14 px-8 rounded-full shadow-2xl bg-white text-slate-800 border-2 border-primary/20 hover:border-primary/50 transition-all flex items-center gap-3 active:scale-95 font-black text-lg"
                  onClick={handleShowLandmarkList}
                >
                  <List className="w-6 h-6 text-primary" />
                  <span>VIEW LIST</span>
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* ✅ [마스터 모드 | 2026-02-27]
             isCardVisible = appMode !== 'map' 이면 카드 표시
             학생들: isCardVisible 하나로 카드 on/off를 결정합니다 */}
        {isCardVisible && (
          <UnifiedFloatingCard
            forceShowList={appMode === 'list'}
            isCardMinimized={isCardMinimized}
            onToggleMinimized={() => setIsCardMinimized(!isCardMinimized)}
            selectedLandmark={selectedLandmark}
            onLandmarkSelect={(l: Landmark) => {
              // [적요] 리스트에서 랜드마크 선택 → detail 모드 진입
              prevAppModeRef.current = appMode;
              setSelectedLandmark(l);
              setAppMode('detail');
              setIsCardMinimized(false);
            }}
            onLandmarkClose={() => {
              // [적요] 랜드마크 닫기: list에서 왔으면 list로, 지도에서 왔으면 map으로 복귀
              setSelectedLandmark(null);
              setAppMode(prevAppModeRef.current === 'list' ? 'list' : 'map');
            }}
            landmarks={landmarks}
            tourStops={tourStops}
            onAddToTour={handleAddToTour}
            onRemoveTourStop={(id) => {
              setTourStops(tourStops.filter(s => s.id !== id));
              setTourStopDurations(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
              });
            }}
            userPosition={effectivePosition ? { latitude: effectivePosition.latitude, longitude: effectivePosition.longitude } : null}
            selectedLanguage={selectedLanguage}
            onNavigate={handleLandmarkRoute}
            onLandmarkRoute={handleLandmarkRoute}
            city={selectedCity || null}
            showCruisePort={showCruisePort}
            onToggleCruisePort={() => setShowCruisePort(!showCruisePort)}
            isSimulationMode={isSimulationMode}
            simulationSpeed={simulationSpeed}
            onSimulationSpeedChange={setSimulationSpeed}
            onToggleSimulation={() => setIsSimulationMode(!isSimulationMode)}
            onSimulationPauseToggle={() => setIsSimulationPaused(!isSimulationPaused)}
            isSimulationPaused={isSimulationPaused}
            onOpenAIRecommend={() => setShowAIRecommend(true)}
            // ✅ [버그수정 | 2026-02-27] spokenLandmarks.has() 크래시 방지
            // interface에 required로 선언된 prop은 반드시 전달해야 합니다!
            spokenLandmarks={spokenLandmarks}
            showLandmarks={showLandmarks}
            showActivities={showActivities}
            showRestaurants={showRestaurants}
            showGiftShops={showGiftShops}
            onToggleLandmarks={() => setShowLandmarks(!showLandmarks)}
            onToggleActivities={() => setShowActivities(!showActivities)}
            onToggleRestaurants={() => setShowRestaurants(!showRestaurants)}
            onToggleGiftShops={() => setShowGiftShops(!showGiftShops)}
          />
        )}

        {/* Other Overlays */}
        {showMenu && (
          <MenuDialog
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
            selectedCityId={selectedCityId}
            onCityChange={handleCityChange}
            selectedLanguage={selectedLanguage}
            onLanguageChange={(lang: any) => setSelectedLanguage(lang)}
            cities={cities}
            audioEnabled={audioEnabled}
            onToggleAudio={handleToggleAudio}
            isSpeaking={isSpeaking}
            speechRate={speechRate}
            onSpeechRateChange={handleSpeechRateChange}
            gpsEnabled={gpsEnabled}
            onToggleGps={handleToggleGps}
            offlineMode={offlineMode}
            onToggleOfflineMode={handleToggleOfflineMode}
            onDownloadData={handleDownloadData}
            onUploadData={handleUploadData}
            onTestAudio={handleTestAudio}
            activeRoute={activeRoute}
            onClearRoute={handleClearRoute}
            totalLandmarks={landmarks.length}
            tourStops={tourStops}
            tourRouteInfo={tourRouteInfo}
            onRemoveTourStop={(id) => setTourStops(tourStops.filter(s => s.id !== id))}
            onClearTour={handleClearTour}
            tourTimePerStop={tourTimePerStop}
            onTourTimePerStopChange={setTourTimePerStop}
            isBackgroundGuideEnabled={isBackgroundGuideEnabled}
            onToggleBackgroundGuide={handleSetBackgroundGuide}
            showUpdateStats={() => setShowUpdateStats(true)}
            showQrDialog={() => setShowQrDialog(true)}
            showCreatorDashboard={() => setShowCreatorDashboard(true)}
          />
        )}
        <AIRecommendDialog
          isOpen={showAIRecommend}
          onClose={() => setShowAIRecommend(false)}
          landmarks={landmarks}
          cityId={selectedCityId}
          cityName={selectedCity?.name || ''}
          selectedLanguage={selectedLanguage}
          userPosition={effectivePosition ? { latitude: effectivePosition.latitude, longitude: effectivePosition.longitude } : null}
          onAddToTour={(recommendedLandmarks) => {
            const newStops = recommendedLandmarks.filter(
              l => !tourStops.some(s => s.id === l.id)
            );
            if (newStops.length > 0) {
              setTourStops(prev => [...prev, ...newStops]);
            }
          }}
          onSelectLandmark={(landmark) => {
            setSelectedLandmark(landmark);
            setShowAIRecommend(false);
          }}
        />

        {/* [교수님 지시 | 2026-02-27] 자동 랜딩 다이얼로그(Welcome Landing Page)를 비활성화합니다. 
             사용자가 직접 탐색하는 경험을 우선시하며, 필요 시 수동으로 활성화할 수 있도록 리마크 처리했습니다. */}
        {/* 
        <Dialog open={!!landingCityId && isWelcomeHandled && !showStartupDialog} onOpenChange={(open) => !open && setLandingCityId(null)}>
          <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
            ... (생략) ...
          </DialogContent>
        </Dialog>
        */}

        {/* [중요] QR/공유 다이얼로그 */}
        <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
          <DialogContent className="max-w-sm">
            <div className="flex flex-col items-center gap-4 py-4">
              <QrCode className="h-10 w-10 text-primary" />
              <h2 className="text-xl font-bold">{selectedLanguage === 'ko' ? '앱 설치 및 공유' : 'Install & Share'}</h2>
              <div className="bg-white p-4 rounded-xl border">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}`} alt="QR" className="w-40 h-40" />
              </div>
              <div className="flex gap-2 w-full mt-4">
                <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(window.location.origin); toast({ title: 'Copied!' }); }}>Copy Link</Button>
                <Button className="flex-1" onClick={() => { if (navigator.share) navigator.share({ title: 'GPS Tour', url: window.location.origin }); }}>Share</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <LoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} language={selectedLanguage} />
        <OfflineIndicator />
        <InstallPrompt selectedLanguage={selectedLanguage} onClose={() => setIsWelcomeHandled(true)} />
      </div>

      {/* Navigation App Choice */}
      <AlertDialog open={showDirectionsDialog} onOpenChange={setShowDirectionsDialog}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-800">Navigate Course</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium">
              Choose your preferred navigation guide for <b>{pendingLandmark ? getTranslatedContent(pendingLandmark, selectedLanguage, 'name') : ''}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button onClick={useInAppNavigation} className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg flex items-center justify-between px-6 shadow-lg shadow-indigo-200">
              <div className="flex items-center gap-3">
                <AudioLines className="w-6 h-6" />
                <span>Audio Guide Map</span>
              </div>
              <Badge className="bg-white/20 text-white border-none">Best</Badge>
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={openGoogleMaps} variant="outline" className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Google Maps</span>
              </Button>
              <Button onClick={openWaze} variant="outline" className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 flex items-center gap-3">
                <Navigation2 className="w-5 h-5 text-sky-500" />
                <span>Waze</span>
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setShowDirectionsDialog(false)} className="w-full h-12 rounded-xl text-slate-400 font-bold">Cancel</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
