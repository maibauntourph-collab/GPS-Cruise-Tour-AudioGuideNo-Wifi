import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Settings,
  List,
  Navigation,
  Milestone,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
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
  AudioLines,
  Globe
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
import { CountryScrollSelector } from '@/components/CountryScrollSelector';
import { CitySelectTab } from '@/components/CitySelectTab';

// Landing Data is imported from @/lib/landingData at line 4
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
import { useGeoLocation } from '@/hooks/useGeoLocation';
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
  const [selectedCityId, setSelectedCityId] = useState<string>('seoul');
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
  const [gpsMode, setGpsMode] = useState<'real' | 'simulation'>('real');
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [simulationStepIndex, setSimulationStepIndex] = useState(0);
  const [simulatedPosition, setSimulatedPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  // [Kodari | 2026-03-20] 📍 오프라인 투어 상태 영구 저장 (No-WiFi 핵심)
  // 학생들에게: 사용자가 앱을 껐다 켜도 어디를 다녀왔는지 기억해야 합니다.
  // localStorage를 활용해 '이미 안내받은 명소' 목록을 영구적으로 관리합니다.
  const [spokenLandmarks, setSpokenLandmarks] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('nowifigps_spoken_landmarks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // [Server Park] 안내 상태가 바뀔 때마다 로컬 저장소에 동기화합니다.
  useEffect(() => {
    localStorage.setItem('nowifigps_spoken_landmarks', JSON.stringify(Array.from(spokenLandmarks)));
  }, [spokenLandmarks]);

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
  // [적요] 바텀 내비게이션 활성 탭 상태 - city/map/plan
  const [mainTab, setMainTab] = useState<'city' | 'map' | 'plan'>('city');
  // [적요] city 탭 활성화 추적 (showCountrySelector와 연동)
  const [activeCityScreen, setActiveCityScreen] = useState(false);

  // [Marketer Song | 2026-03-20] 🌏 글로벌 맞춤 추천을 위한 사용자 국적 판별
  // 학생들에게: 사용자의 브라우저 설정이나 시간대를 분석해 '관심사'를 미리 예측하는 지능형 대시보드입니다.
  const [userRegion, setUserRegion] = useState<string>(() => {
    const lang = navigator.language.toLowerCase();
    if (lang.includes('ja')) return 'JP';
    if (lang.includes('zh-tw') || lang.includes('zh-hk')) return 'TW';
    if (lang.includes('zh')) return 'CN';
    if (lang.includes('ko')) return 'KR';
    // 시간대 분석을 통한 보강 (e.g. 미국, 유럽 등)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz.includes('America')) return 'US';
      if (tz.includes('Europe')) return 'EU';
      if (tz.includes('Tokyo')) return 'JP';
      if (tz.includes('Seoul')) return 'KR';
    } catch (e) { }
    return 'US'; // 기본값은 글로벌 표준(영어권)
  });
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

  // [NEW] Visual Branding Watermark Settings
  const { data: watermarkUrlData } = useQuery<any>({
    queryKey: ['/api/settings/landing_watermark_url'],
  });
  const { data: watermarkOpacityData } = useQuery<any>({
    queryKey: ['/api/settings/landing_watermark_opacity'],
  });

  const watermarkUrl = watermarkUrlData?.value;
  const watermarkOpacity = parseFloat(watermarkOpacityData?.value || '0.1');

  // [NEW] Layout Version Setting
  const { data: layoutSettingData } = useQuery<any>({
    queryKey: ['/api/settings/active_layout_version'],
  });
  const activeLayout = layoutSettingData?.value || 'modern';
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
  const [isWelcomeHandled, setIsWelcomeHandled] = useState(true); // [2026-03-23] 온보딩 건너뛰기: 즉시 랜딩 카드 노출
  const [showStartupDialog, setShowStartupDialog] = useState(false); // [어벤져스 팀] 온보딩 후에 시작 다이얼로그 노출
  const [isStartupTransitioning, setIsStartupTransitioning] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  // [Dodari Logic | 2026-03-23] PWA 온보딩이 닫히면(isWelcomeHandled=true) 
  // 기존의 StartupDialog(온보딩)를 생략하고, 바로 국가/도시 선택 다이얼로그를 띄웁니다.
  useEffect(() => {
    if (isWelcomeHandled) {
      setShowCountrySelector(true);
    }
  }, [isWelcomeHandled]);
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

  const effectivePosition = (gpsMode === 'simulation' && simulatedPosition)
    ? simulatedPosition
    : (position?.coords ? { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy } : null);

  // [교수님의 한마디: useGeoLocation - ③ 실시간 GPS 항해사]
  // gpsMode가 'real'일 때만 실제 GPS를 사용하고, 'simulation'일 때는 simulatedPosition을 전달합니다.
  const { position: geoPosition, isLoading: geoLoading } = useGeoLocation(
    gpsEnabled && gpsMode === 'real',
    gpsMode === 'simulation' ? simulatedPosition : null
  );

  // Sync geoPosition to position state for backward compatibility
  useEffect(() => {
    if (geoPosition) {
      setPosition({ coords: geoPosition } as GeolocationPosition);
      setIsLoading(false);
    }
  }, [geoPosition]);

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

  // [어벤져스 팀 | 2026-03-20] 🇰🇷 서울 랜딩 최적화: 첫 방문 시 서울 명소를 강제 노출하던 로직 비활성화
  // 사용자 요구사항: "DONT show seoul place detail tour card. have to show city selection card..."
  useEffect(() => {
    if (isWelcomeHandled && !showStartupDialog && !landingCityId && !isSimulationMode) {
      if (selectedCityId === 'seoul' && landmarks && landmarks.length > 0 && !selectedLandmark) {
        // [수정] 강제로 첫 번째 명소를 setSelectedLandmark() 하지 않도록 막음! 
        // 그냥 맵/리스트 모드로 자연스럽게 시작되도록 합니다.
        transitionTo('list');
      } else if (!selectedLandmark) {
        transitionTo('list');
      }
    }
  }, [isWelcomeHandled, showStartupDialog, landingCityId, selectedLandmark, isSimulationMode, selectedCityId, landmarks, transitionTo]);

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

  const openAmap = () => {
    if (pendingLandmark) {
      // [어벤져스 팀 | 2026-03-20] 🇨🇳 Amap(高德地图) 내비게이션(길찾기) 딥링크
      const landmarkName = getTranslatedContent(pendingLandmark as any, selectedLanguage, 'name');
      const amapRouteUrl = `amapuri://route/plan/?did=BGVIS1&dlat=${pendingLandmark.lat}&dlon=${pendingLandmark.lng}&dname=${encodeURIComponent(landmarkName)}&dev=0&t=2`;
      const amapWebRouteUrl = `https://uri.amap.com/navigation?to=${pendingLandmark.lng},${pendingLandmark.lat},${encodeURIComponent(landmarkName)}&mode=walk&policy=1&src=mypage&coordinate=wgs84&callnative=1`;

      window.location.href = amapRouteUrl;
      setTimeout(() => {
        window.open(amapWebRouteUrl, '_blank');
      }, 500);
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

  // [Dodari | 2026-03-20] 📍 "No-WiFi" 원클릭 오프라인 준비 (한·중·영 지원)
  // 학생들에게: 실제 여행지에 도착하기 전, 이 버튼을 누르면 데이터가 브라우저에 저장됩니다.
  // 중국어의 경우 간체(zh-CN)와 번체(zh-TW)를 모두 고려하여 메시지를 출력합니다.
  const handlePreFetchOfflineData = async () => {
    if (!selectedCityId) return;

    toast({
      title: selectedLanguage === 'ko' ? "📥 오프라인 데이터 다운로드 중..." :
        selectedLanguage === 'zh-CN' ? "📥 正在下载离线数据..." :
          selectedLanguage === 'zh-TW' ? "📥 正在下載離線數據..." : "📥 Downloading Offline Data...",
      description: selectedLanguage === 'ko' ? `${selectedCity?.name}의 모든 명소 정보를 기기에 저장하고 있습니다.` :
        selectedLanguage === 'zh-CN' ? `正在将 ${selectedCity?.name} 的所有景点信息保存到设备。` :
          selectedLanguage === 'zh-TW' ? `正在將 ${selectedCity?.name} 的所有景點資訊保存到設備。` :
            `Saving all landmark information for ${selectedCity?.name} to your device.`,
    });

    try {
      // PWA 캐시 발동을 위한 페치
      await fetch(`/api/cities/${selectedCityId}/landmarks`);
      await fetch(`/api/cities`);

      toast({
        title: selectedLanguage === 'ko' ? "🌟 오프라인 준비 완료!" :
          selectedLanguage === 'zh-CN' ? "🌟 离线准备就绪！" :
            selectedLanguage === 'zh-TW' ? "🌟 離線準備就緒！" : "🌟 Ready for Offline Tour!",
        description: selectedLanguage === 'ko' ? "이제 인터넷이 끊겨도 이 도시의 가이드를 즐기실 수 있습니다." :
          selectedLanguage === 'zh-CN' ? "现在即使没有网络，您也可以享受该城市的导览。" :
            selectedLanguage === 'zh-TW' ? "現在即使沒有網絡，您也可以享受該城市的導覽。" : "You can now enjoy the guide even without an internet connection.",
        className: "bg-emerald-500 text-white border-none",
      });
    } catch (error) {
      console.error('Offline Pre-fetch error:', error);
      toast({
        title: (selectedLanguage === 'zh-CN' || selectedLanguage === 'zh-TW') ? "下载失败 / 下載失敗" : "다운로드 실패",
        description: (selectedLanguage === 'zh-CN' || selectedLanguage === 'zh-TW') ? "请检查网络状态 / 請檢查網絡狀態" : "네트워크 상태를 확인해 주세요.",
        variant: "destructive"
      });
    }
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

      // [Cruise Navigator | 2026-03-20] 📍 새로운 랜드마크 발견 및 오디오 트리거
      // 학생들에게: 사용자가 설정된 반경(landmark.radius) 내로 진입하면 이 로직이 작동합니다.
      // No-WiFi 환경에서도 로컬에 저장된 음성 데이터를 즉시 재생하여 끊김 없는 가이드를 제공합니다.

      const name = getTranslatedContent(landmark, selectedLanguage, 'name');
      const narrationText = getTranslatedContent(landmark, selectedLanguage, 'narration') || getTranslatedContent(landmark, selectedLanguage, 'description');

      // 오디오 서비스 실행 (중복 재생 방지 로직은 서비스 내부와 spokenLandmarks에서 관리)
      audioService.playAuto(
        landmark.id,
        `${name}. ${narrationText}`,
        selectedLanguage
      );

      // 들은 명소 목록에 추가
      setSpokenLandmarks(prev => new Set(Array.from(prev).concat(landmark.id)));

      // 처음 방문하는 곳이라면 축하 팝업과 함께 기록
      if (!isVisited(landmark.id)) {
        markVisited(landmark.id);

        // [Kodari] 사용자에게 발견 소식을 더 명확하게 알립니다.
        toast({
          title: selectedLanguage === 'ko' ? "🌟 새로운 명소 도착!" : "🌟 New Landmark Reached!",
          description: `"${name}" 근처에 도착했습니다. 안내 방송을 시작합니다.`,
          className: "bg-primary text-primary-foreground border-none shadow-2xl",
        });
      }

      // 지도를 해당 위치로 포커싱하고 상세 카드 열기
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

  // [Cruise Navigator | 2026-03-20] 로컬 데이터 우선 위치 검색 핸들러
  // 학생들에게: 사용자 요청에 따라, 이제 우리 Neon DB에 저장된 데이터를 먼저 검색합니다. 
  // 외부 API 호출을 줄여 비용을 아끼고 속도를 높이는 '로컬 퍼스트(Local-first)' 전략입니다!
  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim() || !selectedCity) return;

    setIsSearchingLocation(true);
    try {
      // 1. [Kodari] 먼저 우리 Neon DB에서 해당 도시의 랜드마크를 가져와 검색합니다.
      const localResponse = await fetch(`/api/landmarks?cityId=${selectedCity.id}`);
      if (localResponse.ok) {
        const localLandmarks = await localResponse.json();
        // 검색어와 일치하는 명소 필터링
        const filtered = localLandmarks.filter((l: any) =>
          l.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
        );

        if (filtered.length > 0) {
          console.log('로컬 DB에서 검색 결과 발견!');
          setLocationSearchResults(filtered);
          setIsSearchingLocation(false);
          return; // 로컬에 있으면 구글을 부르지 않고 여기서 끝냅니다.
        }
      }

      // 2. [Server Park] 로컬에 없을 때만 예외적으로 Google Places를 호출합니다.
      // (단, 위경도 일괄 업데이트 작업이 완료된 후에는 이 로직도 최소화될 예정입니다.)
      const response = await fetch(
        `/api/places/search?q=${encodeURIComponent(locationSearchQuery)}&lang=${selectedLanguage}`
      );

      if (response.ok) {
        const results = await response.json();
        setLocationSearchResults(results);
      } else {
        const errorData = await response.json();
        console.error('검색 실패:', errorData.error);
        toast({
          title: "검색 오류",
          description: "장소 검색 중 서버 오류가 발생했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // [Kodari | 2026-03-20] 검색된 장소를 우리 Neon DB와 동기화하는 함수
  // 학생들에게: 구글 데이터를 우리 DB로 '영구 저장'하여 나중에 오프라인에서도 사용할 수 있게 만듭니다.
  const syncPlaceToLandmark = async (place: any) => {
    if (!selectedCity) return;

    try {
      const response = await fetch('/api/landmarks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.placeId,
          cityId: selectedCity.id,
          category: 'Search Result'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "동기화 완료",
          description: `${place.name}이(가) 우리 데이터베이스에 저장되었습니다.`
        });
        // 저장된 후 랜드마크 목록을 새로고침하거나 선택된 위치로 이동 로직...
      }
    } catch (error) {
      console.error('Sync Error:', error);
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

    // [Designer Kim] StartupDialog(온보딩) 화면이 닫히면 바로 도시 선택 카드 스크롤러를 띄웁니다!
    setShowCountrySelector(true);

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
        {/* [2026-03-23 | 통합 레이아웃] 언어 선택 + 나라/도시 카드를 병합하여 팝업 없는 매끄러운 UX 제공 */}
        {/* Startup Dialog 제거됨: 이제 바로 나라/도시 카드가 보입니다. */}

        {/* ════════════════════════════════════════════════════════════
             [적요 - 2026-03-23 23:02] ② City Select 전체 화면 모드
             이미지의 city select 화면과 1:1 매칭:
             - PWA 배너 / 기항지 가이드 헤더 / 한:EN:中 언어 토글
             - 카테고리 탭 / 도시 카드 목록 / 바텀 내비게이션
             showCountrySelector = true 일 때 지도 위에 full-screen으로 덮어씁니다.
        ════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showCountrySelector && (
            <motion.div
              key="city-select-screen"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-[5000] bg-white/40 backdrop-blur-2xl"
            >
              <CitySelectTab
                cities={cities}
                selectedCityId={selectedCityId}
                onCityChange={handleCityChange}
                selectedLanguage={selectedLanguage}
                onLanguageChange={(lang) => setSelectedLanguage(lang as any)}
                onTransitionToList={() => {
                  // [적요] 도시 선택 후 → city 화면 닫고 landmark 리스트로 이동
                  setShowCountrySelector(false);
                  setTimeout(() => transitionTo('list'), 200);
                }}
                activeBottomTab={mainTab}
                onTabChange={(tab) => {
                  setMainTab(tab);
                  if (tab === 'map') {
                    // [적요] 지도 탭 → city select 화면 닫고 지도로 이동
                    setShowCountrySelector(false);
                    transitionTo('map');
                  } else if (tab === 'plan') {
                    // [적요] 내 플랜 탭 → city select 닫고 리스트로 이동
                    setShowCountrySelector(false);
                    transitionTo('list');
                  }
                  // city 탭이면 그대로 유지
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* [적요] 구 바텀시트 코드 제거 완료 - CitySelectTab full-screen으로 대체됨 */}

        {/* [Avengers Team] 상단 바를 제거하고 UnifiedFloatingCard로 기능을 통합하였습니다. (Merge One Card) */}

        {/* Simulation Control Bar */}
        {false && isSimulationMode && (() => {
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
        </header >

        {/* ✅ [Avengers Team | Bug Doctor] Classic Layout용 상단 컨트롤 바 복원 (조건부) */}
        {
          activeLayout === 'classic' && (
            <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-[1000] flex gap-2 pointer-events-auto">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex gap-2 p-1 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl"
              >
                <Button
                  variant="ghost"
                  className="h-12 px-6 rounded-xl hover:bg-orange-50 text-slate-800 flex items-center gap-2 group transition-all"
                  onClick={handleShowLandmarkList}
                >
                  <List className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">List</span>
                </Button>

                <div className="w-[1px] h-6 self-center bg-slate-200" />

                <Button
                  variant="ghost"
                  className={`h-12 px-6 rounded-xl flex items-center gap-2 group transition-all ${isSimulationMode ? 'bg-orange-500 text-white hover:bg-orange-600' : 'hover:bg-orange-50 text-slate-800'}`}
                  onClick={() => setIsSimulationMode(!isSimulationMode)}
                >
                  <Navigation className={`w-5 h-5 group-hover:scale-110 transition-transform ${isSimulationMode ? 'text-white' : 'text-orange-500'}`} />
                  <span className="font-bold">Start</span>
                </Button>

                <div className="w-[1px] h-6 self-center bg-slate-200" />

                <Button
                  variant="ghost"
                  className={`h-12 px-6 rounded-xl flex items-center gap-2 group transition-all ${showCruisePort ? 'bg-rose-500 text-white hover:bg-rose-600' : 'hover:bg-rose-50 text-slate-800'}`}
                  onClick={() => setShowCruisePort(!showCruisePort)}
                >
                  <Milestone className={`w-5 h-5 group-hover:scale-110 transition-transform ${showCruisePort ? 'text-white' : 'text-rose-500'}`} />
                  <span className="font-bold">Route</span>
                </Button>
              </motion.div>
            </div>
          )
        }

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

            {/* [적요] 카드가 최소화된 상태(IsCardMinimized)일 때만 하단에 리스트 보기 버튼을 노출합니다. */}
            {isCardMinimized && (
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

        {/* ✅ [마스터 모드 | Designer Kim] UnifiedFloatingCard 통합UI
             학생들: 이제 모든 모드(map, list, detail, tour)를 이 하나의 카드에서 처리합니다.
             웰컴 카드를 위해 항상 렌더링하도록 설정했습니다. */}
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
            // [적요] 랜드마크 닫기: 사용자의 요청에 따라 랜딩 페이지(/)가 아닌 이전 모드(map/list)로 복귀.
            // "go before progress except landing page"
            setSelectedLandmark(null);
            setIsCardMinimized(false);
            transitionTo(prevAppModeRef.current || 'map');
          }}
          onMinimizeToMenu={() => {
            // [적요] 메뉴로 최소화: 명소 선택 해제 후 국가/도시 선택 메뉴 노출
            setSelectedLandmark(null);
            setIsCardMinimized(false);
            transitionTo('map');
            setShowCountrySelector(true);
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
          onNavigate={(landmark) => {
            setActiveRoute(landmark);
            transitionTo('nav');
          }}
          onLandmarkRoute={handleLandmarkRoute}
          city={selectedCity || null}
          showCruisePort={showCruisePort}
          onToggleCruisePort={() => setShowCruisePort(!showCruisePort)}
          onCruisePortClose={() => setShowCruisePort(false)}
          isSimulationMode={isSimulationMode}
          simulationSpeed={simulationSpeed}
          onSimulationSpeedChange={setSimulationSpeed}
          onToggleSimulation={() => setIsSimulationMode(!isSimulationMode)}
          onSimulationPauseToggle={() => setIsSimulationPaused(!isSimulationPaused)}
          isSimulationPaused={isSimulationPaused}
          onOpenAIRecommend={() => setShowAIRecommend(true)}
          spokenLandmarks={spokenLandmarks}
          showLandmarks={showLandmarks}
          showActivities={showActivities}
          showRestaurants={showRestaurants}
          showGiftShops={showGiftShops}
          onToggleLandmarks={() => setShowLandmarks(!showLandmarks)}
          onToggleActivities={() => setShowActivities(!showActivities)}
          onToggleRestaurants={() => setShowRestaurants(!showRestaurants)}
          onToggleGiftShops={() => setShowGiftShops(!showGiftShops)}
          userRegion={userRegion}
          activeLayout={activeLayout}
          gpsMode={gpsMode}
          onGpsModeChange={setGpsMode}
          activeRoute={activeRoute}
          handleClearRoute={handleClearRoute}
          tourRouteInfo={tourRouteInfo}
          tourTimePerStop={tourTimePerStop}
          tourStopDurations={tourStopDurations}
          onUpdateStopDuration={handleUpdateStopDuration}
          onSaveRoute={() => setShowSaveRouteDialog(true)}
          startingPoint={startingPoint}
          endPoint={endPoint}
          onOpenStartEndPointDialog={() => setIsStartingPointPopoverOpen(true)}
          capturedRouteImage={capturedRouteImage}
        />

        {/* Other Overlays */}
        {
          showMenu && (
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
              onPreFetchOfflineData={handlePreFetchOfflineData}
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
          )
        }
        <AIRecommendDialog
          isOpen={showAIRecommend}
          onClose={() => setShowAIRecommend(false)}
          landmarks={landmarks}
          cityId={selectedCityId}
          cityName={selectedCity?.name || ''}
          selectedLanguage={selectedLanguage}
          userPosition={effectivePosition ? { latitude: effectivePosition.latitude, longitude: effectivePosition.longitude } : null}
          userRegion={userRegion}
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
        {/* [Dodari | 🎖️] PWA 온보딩 처리 전까지만 InstallPrompt를 보여줍니다. */}
        {
          !isWelcomeHandled && (
            <InstallPrompt selectedLanguage={selectedLanguage} onClose={() => setIsWelcomeHandled(true)} />
          )
        }

        {/* [어벤져스 팀 | 🎖️] PWA 온보딩이 완료된 후에만 StartupDialog를 마운트하여 ARIA 충돌 및 레이어 간섭을 방지합니다. */}
        {
          isWelcomeHandled && showStartupDialog && (
            <StartupDialog
              isOpen={showStartupDialog}
              onClose={() => {
                setShowStartupDialog(false);
                setShowCountrySelector(true); // 랜딩 후 국가 선택으로 이동
              }}
              onSelectGPS={() => setGpsEnabled(true)}
              onRestoreTour={(data) => {
                handleCityChange(data.cityId);
                setShowStartupDialog(false);
              }}
              savedTourData={null}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              isGpsAvailable={gpsEnabled}
              isGpsLoading={isLoading}
              cities={cities}
              selectedCityId={selectedCityId}
              onCityChange={handleCityChange}
            />
          )
        }

        {/* [2026-03-23 | 통합 완료] 이제 모든 선택(TTS/Port/City)은 상단의 AnimatePresence 섹션에서 하나로 처리됩니다. */}
      </div >

      {/* [Designer Kim] 프리미엄 백그라운드 워터마크 레이어 */}
      {
        watermarkUrl && (
          <div
            className="fixed inset-0 pointer-events-none z-[1] overflow-hidden flex items-center justify-center"
            style={{ mixBlendMode: 'multiply' }}
          >
            <img
              src={watermarkUrl}
              alt="Site Watermark"
              className="w-3/4 md:w-1/2 object-contain select-none transition-opacity duration-1000"
              style={{ opacity: watermarkOpacity }}
            />
          </div>
        )
      }

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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={openAmap} variant="outline" className="h-14 rounded-2xl border-orange-200 bg-orange-50/30 hover:bg-orange-50 flex items-center gap-2 group transition-all">
                <MapPin className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                <span className="font-bold">{selectedLanguage?.startsWith('zh') ? '高德地图 (Amap)' : 'Amap'}</span>
              </Button>
              <Button onClick={openGoogleMaps} variant="outline" className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Google Maps</span>
              </Button>
              <Button onClick={openWaze} variant="outline" className="h-14 rounded-2xl border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-sky-500" />
                <span>Waze</span>
              </Button>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setShowDirectionsDialog(false)} className="w-full h-12 rounded-xl text-slate-400 font-bold">Cancel</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider >
  );
}
