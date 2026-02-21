import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { flushSync } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import MapView, { resetMapInteraction } from '@/components/MapView';
import UnifiedFloatingCard from '@/components/UnifiedFloatingCard';
import MenuDialog from '@/components/MenuDialog';
import OfflineIndicator from '@/components/OfflineIndicator';
import InstallPrompt from '@/components/InstallPrompt';
import UpdatePrompt from '@/components/UpdatePrompt';
import BottomSheet from '@/components/BottomSheet';
import StartupDialog, { getSavedTourData, saveTourData, clearSavedTourData } from '@/components/StartupDialog';
import AIRecommendDialog from '@/components/AIRecommendDialog';
import AudioDownloadDialog from '@/components/AudioDownloadDialog';
import LoginDialog from '@/components/LoginDialog';
import SaveRouteDialog from '@/components/SaveRouteDialog';
import CreatorDashboard from '@/components/CreatorDashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

/**
 * [강의 노트: Phase 2 확장의 핵심]
 * 학생 여러분, 새로운 기능을 추가할 때는 관련된 컴포넌트를 먼저 정확히 불러오는 것이 기본입니다.
 * 우리가 만든 CreatorDashboard와 이를 감쌀 레이어인 Dialog를 여기서 임포트했습니다.
 */
import { encryptData, decryptData, downloadEncryptedData, readEncryptedFile } from '@/lib/offlineDataEncryption';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { audioService } from '@/lib/audioService';
import { calculateDistance } from '@/lib/geoUtils';
import { getTranslatedContent, t } from '@/lib/translations';
import { StartingPoint, getCityStartingPoints, getStartingPointName } from '@/lib/startingPoints';
import { detectDeviceCapabilities, getMaxMarkersToRender, shouldReduceAnimations } from '@/lib/deviceDetection';
import { Landmark, City } from '@shared/schema';
import { getMatchedCityId, checkProximity } from '@/lib/locationService';
import { LANDING_DATA } from '@/data/landingData';
import { useLanguage } from '@/context/LanguageContext';
import { Landmark as LandmarkIcon, Activity, Ship, Utensils, ShoppingBag, MapPin, Plane, Hotel, Navigation2, List, Search, Loader2, Flag, Circle, Clock, Route, Camera, User, TrendingUp, X, QrCode, Share2, Download, Cat, EyeOff, ZoomIn, Volume2 as AudioIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

export default function Home() {
  // GPS enabled state (persisted to localStorage)
  const [gpsEnabled, setGpsEnabled] = useState(() => {
    const saved = localStorage.getItem('gps-enabled');
    return saved !== 'false'; // Default to true
  });

  const { position, error, isLoading } = useGeoLocation(gpsEnabled);
  const [selectedCityId, setSelectedCityId] = useState<string>('rome');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    // Check localStorage first, then default to Korean
    const savedLanguage = localStorage.getItem('selected-language');
    const finalLanguage = savedLanguage || 'ko'; // 기본값: 한국어

    console.log('📝 Language initialization:', {
      savedLanguage,
      finalLanguage,
      source: savedLanguage ? 'localStorage' : 'default (Korean)'
    });

    return finalLanguage;
  });
  const [offlineMode, setOfflineMode] = useState(false);

  // 🛰️ [Server Park] 가상 투어 시뮬레이션 상태
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [simulatedPosition, setSimulatedPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 5x, 10x
  const [simulationStepIndex, setSimulationStepIndex] = useState(0);
  // [적요] QR코드 설치 공유 다이얼로그 표시 상태
  const [showQrDialog, setShowQrDialog] = useState(false);

  // 🛰️ [Server Park] 통합 위치 정보 (가상 또는 실제)
  const effectivePosition = isSimulationMode ? simulatedPosition : position;

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  const { markVisited, isVisited } = useVisitedLandmarks();
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showAudioDownloadDialog, setShowAudioDownloadDialog] = useState(false);
  const [audioDownloadLanguage, setAudioDownloadLanguage] = useState<string>('ko');

  // Show update prompt when update is available
  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  // Detect device capabilities for performance optimization
  const [deviceCapabilities] = useState(() => detectDeviceCapabilities());
  const maxMarkers = getMaxMarkersToRender(deviceCapabilities.isLowEnd);
  const reduceAnimations = shouldReduceAnimations(deviceCapabilities.isLowEnd);

  const { data: cities = [], isLoading: citiesLoading } = useQuery<City[]>({
    queryKey: ['/api/cities'],
  });

  const { data: landmarks = [], isLoading: landmarksLoading } = useQuery<Landmark[]>({
    queryKey: ['/api/landmarks', selectedCityId],
    queryFn: async () => {
      const response = await fetch(`/api/landmarks?cityId=${selectedCityId}`);
      if (!response.ok) throw new Error('Failed to fetch landmarks');
      return response.json();
    },
  });

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeRoute, setActiveRoute] = useState<{
    start: [number, number];
    end: [number, number];
  } | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [spokenLandmarks, setSpokenLandmarks] = useState<Set<string>>(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.2);
  const [showDirectionsDialog, setShowDirectionsDialog] = useState(false);
  const [pendingLandmark, setPendingLandmark] = useState<Landmark | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showGiftShops, setShowGiftShops] = useState(true);
  const [showCruisePort, setShowCruisePort] = useState(() => {
    // Only show cruise port info on first load (once per session)
    const hasShownCruisePort = localStorage.getItem('cruise-port-info-shown');
    if (!hasShownCruisePort) {
      localStorage.setItem('cruise-port-info-shown', 'true');
      return true;
    }
    return false;
  });
  const [keepCruisePortVisible, setKeepCruisePortVisible] = useState(false);
  const [tourStops, setTourStops] = useState<Landmark[]>([]);
  const [tourRouteInfo, setTourRouteInfo] = useState<{
    distance: number;
    duration: number;
    segments?: Array<{ from: string; to: string; distance: number; duration: number }>;
  } | null>(null);
  const [tourTimePerStop, setTourTimePerStop] = useState<number>(() => {
    const saved = localStorage.getItem('tour-time-per-stop');
    return saved ? parseInt(saved, 10) : 45;
  });
  const [tourStopDurations, setTourStopDurations] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('tour-stop-durations');
    return saved ? JSON.parse(saved) : {};
  });
  const [startingPoint, setStartingPoint] = useState<StartingPoint | null>(null);
  const [endPoint, setEndPoint] = useState<StartingPoint | null>(null);
  const [departureTime, setDepartureTime] = useState<Date | null>(null);
  const [isSelectingHotelOnMap, setIsSelectingHotelOnMap] = useState(false);
  const [isSelectingEndPointOnMap, setIsSelectingEndPointOnMap] = useState(false);
  const [isStartingPointPopoverOpen, setIsStartingPointPopoverOpen] = useState(false);
  const [pointSelectionMode, setPointSelectionMode] = useState<'start' | 'end' | 'time'>('start');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSearchResults, setLocationSearchResults] = useState<Array<{ name: string; lat: number; lng: number }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchedLocations, setSearchedLocations] = useState<Array<{ id: string; name: string; lat: number; lng: number }>>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [forceShowCard, setForceShowCard] = useState(false);
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const [showAIRecommend, setShowAIRecommend] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSaveRouteDialog, setShowSaveRouteDialog] = useState(false);
  // 🛰️ [Server Park] 목적지 도착 기반 UI 제어를 위한 상태
  const [isManualSelection, setIsManualSelection] = useState(false);
  const [hasTriggeredArrivalNarration, setHasTriggeredArrivalNarration] = useState<string | null>(null);

  // [강의 노트: 새로운 도메인의 등장]
  // 여러분, 크리에이터 모드를 켜고 끌 수 있는 '스위치'가 하나 더 필요하겠죠?
  // showCreatorDashboard 상태를 통해 대시보드 다이얼로그의 가시성을 제어합니다.
  const [showCreatorDashboard, setShowCreatorDashboard] = useState(false);
  const [selectedRegionalGuideId, setSelectedRegionalGuideId] = useState<string | null>(null);
  const [capturedRouteImage, setCapturedRouteImage] = useState<string | null>(null);
  const [isCapturingRoute, setIsCapturingRoute] = useState(false);
  const [showTourOnly, setShowTourOnly] = useState(false);

  // [연구소장 가이드: 신규 기능 상태 정의]
  // 학생 여러분, 사용자의 요구사항을 반영하기 위해 몇 가지 중요한 상태를 추가합니다.
  // 1. isNavigationOnlyMode: 불필요한 설명을 끄고 지도에 집중하는 모드
  // 2. isCarNavZoomMode: 자동차 내비게이션처럼 초근접 줌을 활성화하는 모드
  // 3. simulationAudioSettings: 시뮬레이션 중 오디오 재생 관련 옵션
  const [isNavigationOnlyMode, setIsNavigationOnlyMode] = useState(false);
  const [isCarNavZoomMode, setIsCarNavZoomMode] = useState(false);
  const [simulationAudioSettings, setSimulationAudioSettings] = useState({
    resumePlayback: true,    // 이전 위치에서 이어 듣기
    playInBackground: true   // 창을 닫아도 계속 듣기
  });

  // [연구소장 가이드: 백그라운드 자동 가이드 상태]
  // 학생 여러분, 경로가 없어도 주변 명소를 안내해주는 '친절한 가이드' 기능을 위해 
  // 사용자의 동의 여부를 저장하는 상태를 추가합니다.
  const [isBackgroundGuideEnabled, setIsBackgroundGuideEnabled] = useState<boolean | null>(() => {
    const saved = localStorage.getItem('background_guide_enabled');
    return saved ? JSON.parse(saved) : null; // null이면 아직 결정 안 함 (팝업 띄우기)
  });
  const [showBackgroundGuideDialog, setShowBackgroundGuideDialog] = useState(false);
  // [적요: InstallPrompt(웰컴 화면) 완료 여부를 추적하는 상태]
  // 이 변수가 true가 되어야 StartupDialog와 BackgroundGuide 팝업이 순차적으로 띄워집니다.
  const [isWelcomeHandled, setIsWelcomeHandled] = useState(false);

  // 🛰️ [Server Park] 이동 중 UI 최소화 상태
  const [showMinimalTransitUI, setShowMinimalTransitUI] = useState(true);

  // 🛰️ [Server Park] 백그라운드 자동 가이드 팝업 트리거
  useEffect(() => {
    if (isBackgroundGuideEnabled === null && isWelcomeHandled) {
      const timer = setTimeout(() => setShowBackgroundGuideDialog(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isBackgroundGuideEnabled, isWelcomeHandled]);

  const handleSetBackgroundGuide = (enabled: boolean) => {
    setIsBackgroundGuideEnabled(enabled);
    localStorage.setItem('background_guide_enabled', JSON.stringify(enabled));
    setShowBackgroundGuideDialog(false);
    toast({
      title: enabled
        ? (selectedLanguage === 'ko' ? '자동 가이드 활성화' : 'Auto Guide Enabled')
        : (selectedLanguage === 'ko' ? '자동 가이드 비활성화' : 'Auto Guide Disabled'),
      description: enabled
        ? (selectedLanguage === 'ko' ? '경로가 없어도 주변 명소 정보를 알려드립니다.' : 'I will tell you about nearby spots even without a route.')
        : (selectedLanguage === 'ko' ? '설정에서 언제든 다시 켤 수 있습니다.' : 'You can enable it anytime in settings.')
    });
  };

  // 🛰️ [Server Park] 백그라운드 자동 가이드 핵심 로직
  // [적요] 경로가 없더라도( !activeRoute ) 백그라운드 가이드가 켜져 있으면
  // 주변 100m 이내의 명소를 찾아 자동으로 설명을 들려줍니다.
  useEffect(() => {
    if (!effectivePosition || !isBackgroundGuideEnabled || activeRoute) return;

    // 이미 말한 랜드마크는 중복 재생 방지
    const nearby = landmarks.find(landmark => {
      if (spokenLandmarks.has(landmark.id)) return false;
      const distance = calculateDistance(
        effectivePosition.latitude,
        effectivePosition.longitude,
        landmark.lat,
        landmark.lng
      );
      return distance <= 0.1; // 100m 이내
    });

    if (nearby) {
      const name = getTranslatedContent(nearby, selectedLanguage, 'name');
      const desc = getTranslatedContent(nearby, selectedLanguage, 'description');

      console.log(`[Auto Guide] Found nearby landmark: ${name}`);

      // 말하기 시작
      setSpokenLandmarks(prev => new Set(prev).add(nearby.id));
      setSelectedLandmark(nearby);

      if (audioEnabled) {
        audioService.playAuto(nearby.id, desc, selectedLanguage);
      }
    }
  }, [effectivePosition, isBackgroundGuideEnabled, activeRoute, landmarks, spokenLandmarks, selectedLanguage, audioEnabled]);

  // 🛰️ [Server Park] 목적지 도착 기반 UI 및 오디오 제어 로직
  // [적요] 길찾기 중(transit)일 때는 카드를 숨기고, 도착(arrival) 시 자동으로 보여줍니다.
  const arrivalRadius = selectedLandmark?.radius || 50; // 기본 50m
  const distanceToSelected = useMemo(() => {
    if (!effectivePosition || !selectedLandmark) return null;
    return calculateDistance(
      effectivePosition.latitude,
      effectivePosition.longitude,
      selectedLandmark.lat,
      selectedLandmark.lng
    );
  }, [effectivePosition, selectedLandmark]);

  const hasArrivedAtDestination = distanceToSelected !== null && distanceToSelected <= arrivalRadius;

  // 도착 시 자동 나레이션 트리거
  useEffect(() => {
    if (hasArrivedAtDestination && selectedLandmark && !isManualSelection) {
      if (hasTriggeredArrivalNarration !== selectedLandmark.id) {
        console.log(`🎯 [Arrival Logic] Arrived at destination: ${selectedLandmark.id}. Triggering auto-guide.`);
        setHasTriggeredArrivalNarration(selectedLandmark.id);

        if (audioEnabled) {
          const desc = getTranslatedContent(selectedLandmark, selectedLanguage, 'description');
          audioService.playAuto(selectedLandmark.id, desc, selectedLanguage);
          setIsSpeaking(true);
        }
      }
    }
  }, [hasArrivedAtDestination, selectedLandmark, isManualSelection, audioEnabled, selectedLanguage, hasTriggeredArrivalNarration]);

  // 목적지가 변경되면 트리거 상태 초기화
  useEffect(() => {
    if (selectedLandmark?.id !== hasTriggeredArrivalNarration) {
      setHasTriggeredArrivalNarration(null);
    }
  }, [selectedLandmark?.id]);

  // [디자이너 킴의 매직 UI 상태]
  const { language } = useLanguage();
  const [landingCityId, setLandingCityId] = useState<string | null>(null);
  const [hasShownLandingThisSession, setHasShownLandingThisSession] = useState<Set<string>>(new Set());

  // 🎖️ [Dodari Architecture] 의도 지향적 UI 시퀀스 제어를 위한 상태
  type UIAction = 'STARTUP_FINISH' | 'CITY_CHANGE' | 'SETTINGS_CLOSE' | 'NONE';
  const [lastUIAction, setLastUIAction] = useState<UIAction>('NONE');

  // 🎖️ [Dodari Architecture] 도시 변경 감지 및 Magic Landing 리셋 로직
  // 사용자가 설정창(after_country_change.png)에서 도시를 변경하면 즉시 랜딩을 다시 보여줍니다.
  useEffect(() => {
    if (selectedCityId) {
      console.log(`🎖️ [Dodari Architecture] City changed to: ${selectedCityId}. Marking for potential landing.`);
      setHasShownLandingThisSession(prev => {
        const next = new Set(prev);
        next.delete(selectedCityId); // 현재 변경된 도시에 대한 랜딩 기록을 삭제하여 재트리거 유도
        return next;
      });
      setLastUIAction('CITY_CHANGE'); // 도시 변경 액션 기록
      setLandingCityId(null); // 현재 열려있을지 모르는 랜딩 아이디 초기화
    }
  }, [selectedCityId]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [aiRecommendation, setAiRecommendation] = useState<{
    itinerary: Array<{ landmarkId: string; order: number }>;
    explanation: string;
    totalEstimatedTime: number;
  } | null>(null);
  const cruisePortTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Startup dialog state - 🩺 [Bug Doctor] Sequence Restored to original intent
  // 🎖️ [Dodari] 최우선 화면(InstallPrompt) 노출을 위해 초기값은 false로 설정하고, 
  // InstallPrompt가 닫히거나 렌더링된 이후에 필요시 로직으로 제어합니다.
  const [showStartupDialog, setShowStartupDialog] = useState<boolean>(false);
  const [hasCheckedForStartup, setHasCheckedForStartup] = useState(false);
  const [savedTourData, setSavedTourData] = useState(() => getSavedTourData());
  // [적요: isWelcomeHandled는 220행 부근에서 정의됨 — TDZ 방지를 위해 사용 전에 선언]

  // 🎖️ [Dodari] 앱 진입 후 InstallPrompt(웰컴)를 위한 짧은 대기 후 StartupDialog 노출 여부 결정
  // 🎖️ [Dodari] 앱 진입 후 InstallPrompt(웰컴) 완료 후 시퀀스 시작
  useEffect(() => {
    // 웰컴 화면이 처리되기 전(@see InstallPrompt onClose)에는 StartupDialog 대기
    if (!isWelcomeHandled) return;

    const shownThisSession = sessionStorage.getItem('startup-dialog-shown');
    if (!shownThisSession && !hasCheckedForStartup) {
      // 웰컴 화면이 닫히면 부드럽게(800ms) StartupDialog를 띄웁니다.
      const timer = setTimeout(() => {
        setShowStartupDialog(true);
        setHasCheckedForStartup(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isWelcomeHandled, hasCheckedForStartup]);

  // 🩺 [Bug Doctor] 시스템 생명주기 및 시퀀스 정합성 정밀 진단 훅
  useEffect(() => {
    if (lastUIAction !== 'NONE') {
      console.log(`🩺 [Bug Doctor / Surgery Log] Action Detected: ${lastUIAction}`);
      console.log(`🩺 [Bug Doctor / Vital Check] showStartupDialog: ${showStartupDialog}, landingCityId: ${landingCityId}`);
    }
  }, [lastUIAction, showStartupDialog, landingCityId]);

  // [디버그 닥터 & 디자이너 킴의 UI Sequence 제어 훅: Startup Priority]
  useEffect(() => {
    // 🎖️ [Dodari Architecture] 지능형 시퀀스 체인
    // 웰컴 화면이 처리되지 않았거나(Startup 전) StartupDialog가 켜져있다면 랜딩 금지
    if (!isWelcomeHandled || showStartupDialog) {
      // 🩺 [Bug Doctor] 대기 상태 로깅
      console.log("🩺 [Bug Doctor / Vital Check] Waiting for Sequence (Welcome/Startup) to be addressed...");
      return;
    }

    // [Bug Doctor] 위치 정보 및 액션 결합 검증
    if (position && !landingCityId && (lastUIAction === 'STARTUP_FINISH' || lastUIAction === 'CITY_CHANGE')) {
      const matchedId = getMatchedCityId(position.latitude, position.longitude, cities);

      if (matchedId && !hasShownLandingThisSession.has(matchedId)) {
        console.log(`🎊 [Magic Landing] 🩺 [Bug Doctor] Sequence Chain Stable. Intent-Matched: ${lastUIAction}. Welcome to ${matchedId}!`);

        const timer = setTimeout(() => {
          setLandingCityId(matchedId);
          setHasShownLandingThisSession(prev => new Set(prev).add(matchedId));
          setLastUIAction('NONE'); // 트리거 완료 후 안전하게 초기화
          console.log(`🩺 [Bug Doctor / Surgery Log] Landing Logic Grafted: Success for ${matchedId}`);
        }, 600);

        return () => clearTimeout(timer);
      }
    }
  }, [position, landingCityId, hasShownLandingThisSession, showStartupDialog, lastUIAction, isWelcomeHandled]);

  const selectedCity = cities.find(c => c.id === selectedCityId);

  const handleLandmarkRoute = (landmark: Landmark) => {
    setPendingLandmark(landmark);
    setShowDirectionsDialog(true);
  };

  const openGoogleMaps = () => {
    if (!pendingLandmark) return;

    const destination = `${pendingLandmark.lat},${pendingLandmark.lng}`;

    let googleMapsUrl = '';

    if (position) {
      // If we have user's position, set it as origin
      const origin = `${position.latitude},${position.longitude}`;
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    } else {
      // If no position, just show the destination
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }

    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    setShowDirectionsDialog(false);
    setPendingLandmark(null);
  };

  const openWaze = () => {
    if (!pendingLandmark) return;

    // Waze deep link format: https://waze.com/ul?ll=LAT,LNG&navigate=yes
    const wazeUrl = `https://waze.com/ul?ll=${pendingLandmark.lat},${pendingLandmark.lng}&navigate=yes`;

    window.open(wazeUrl, '_blank', 'noopener,noreferrer');
    setShowDirectionsDialog(false);
    setPendingLandmark(null);
  };

  const useInAppNavigation = () => {
    if (!pendingLandmark) return;

    const startPosition = position
      ? [position.latitude, position.longitude] as [number, number]
      : selectedCity
        ? [selectedCity.lat, selectedCity.lng] as [number, number]
        : [41.8902, 12.4922] as [number, number];

    setActiveRoute({
      start: startPosition,
      end: [pendingLandmark.lat, pendingLandmark.lng],
    });
    setTourRouteInfo(null);
    setIsManualSelection(false); // 길찾기 시작 시 수동 모드 해제 (이동 모드 진입)

    setShowDirectionsDialog(false);
    setPendingLandmark(null);
  };

  const handleCityChange = (cityId: string) => {
    // Save current tour history before switching cities
    if (tourStops.length > 0 && selectedCityId) {
      const tourHistory = {
        cityId: selectedCityId,
        tourStops: tourStops.map(stop => stop.id),
        tourRouteInfo,
        startingPoint,
        endPoint,
        departureTime: departureTime?.toISOString(),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`tour-history-${selectedCityId}`, JSON.stringify(tourHistory));
    }

    // Reset all state for new city
    setSelectedCityId(cityId);
    setSelectedLandmark(null);
    setActiveRoute(null);
    setRouteInfo(null);
    audioService.reset();
    setSpokenLandmarks(new Set());

    // Reset tour state
    setTourStops([]);
    setTourRouteInfo(null);
    setStartingPoint(null);
    setEndPoint(null);
    setDepartureTime(null);
    setAiRecommendation(null);

    // Reset UI state
    setShowCruisePort(false);
    setIsCardMinimized(true);
    setShowMenu(false);
    setSelectedRegionalGuideId(null);
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
    setRouteInfo(null);
  };

  const handleToggleAudio = () => {
    setAudioEnabled((prev) => !prev);
    if (!audioEnabled) {
      audioService.reset();
      setSpokenLandmarks(new Set());
    }
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
    // 🩺 [Bug Doctor] 모바일 오디오 잠금 해제 시도
    audioService.unlockAudio();

    const testMessages = {
      en: "Welcome to GPS Audio Guide. This is a test of the audio narration system.",
      it: "Benvenuti alla Guida Audio GPS. Questo è un test del sistema di narrazione audio.",
      ko: "GPS 오디오 가이드에 오신 것을 환영합니다. 이것은 오디오 해설 시스템의 테스트입니다."
    };
    const message = testMessages[selectedLanguage as keyof typeof testMessages] || testMessages.en;

    if (audioEnabled) {
      // Remove test-audio id so it can be played again
      audioService.removeLandmark('test-audio');
      // Use playAuto to respect audio mode (CLOVA, MP3, TTS, Auto)
      audioService.playAuto('test-audio', message, selectedLanguage);
    }
  };

  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
    audioService.setRate(rate);
  };

  // Play click sound effect
  const playClickSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a short click sound
      oscillator.frequency.value = 800; // Higher frequency for click
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Failed to play click sound:', error);
    }
  };

  // 🛰️ [Server Park] 가상 투어 시뮬레이션 엔진 로직
  // [적요] 두 랜드마크 사이를 부드럽게 보간(lerp)하여 실제 이동하는 것처럼
  // 지도에 표시합니다. 200ms 간격으로 좌표를 업데이트하여 자연스러운 이동 구현.
  useEffect(() => {
    if (!isSimulationMode || !tourStops.length) {
      if (!isSimulationMode) setSimulatedPosition(null);
      return;
    }

    console.log("[Simulation] Starting Virtual Tour. Speed:", simulationSpeed, "x");

    // 🩺 [Bug Doctor] 시뮬레이션 시작 시 안내 완료 기록 초기화하여 모든 명소에서 오디오가 나오게 함
    setSpokenLandmarks(new Set());
    audioService.clearSpokenLandmarks();

    // [적요] 시뮬레이션 시작 시 첫 번째 정류장 선택 및 설명 표시
    const startStop = tourStops[simulationStepIndex];
    if (startStop) {
      setSimulatedPosition({ latitude: startStop.lat, longitude: startStop.lng });
      setSelectedLandmark(startStop);
    }

    let progress = 0;
    const segmentDurationMs = 8000 / simulationSpeed;
    const pauseDurationMs = 5000 / simulationSpeed;
    const updateIntervalMs = 200;
    const progressStep = updateIntervalMs / segmentDurationMs;
    let currentFromIndex = simulationStepIndex;
    // [적요] isPaused: 정류장 도착 후 정차 중 (설명 읽는 시간)
    let isPaused = true;
    let pauseElapsed = 0;

    const intervalId = setInterval(() => {
      if (isPaused) {
        // [적요] 정류장에 정차 중 - 설명 카드를 읽을 시간 확보
        pauseElapsed += updateIntervalMs;

        // 🩺 [Bug Doctor] 현재 나레이션이 나오고 있는지 체크
        const isSpeaking = audioService.isSpeaking();

        // [적요] 설정된 정차 시간이 지났고, 오디오 재생도 끝났을 때만 다음으로 이동
        if (pauseElapsed >= pauseDurationMs && !isSpeaking) {
          isPaused = false;
          pauseElapsed = 0;
          progress = 0;
          // [적요] 마지막 정류장이면 시뮬레이션 종료 (루핑 방지)
          if (currentFromIndex >= tourStops.length - 1) {
            console.log("[Simulation] Tour complete!");
            clearInterval(intervalId);
            return;
          }
        }
        return;
      }

      progress += progressStep;

      if (progress >= 1) {
        // [적요] 다음 정류장 도착 -> 자동 선택하여 설명 카드 표시
        currentFromIndex = currentFromIndex + 1;
        setSimulationStepIndex(currentFromIndex);
        const arrivedAt = tourStops[currentFromIndex];
        if (arrivedAt) {
          console.log("[Simulation] Arrived at:", getTranslatedContent(arrivedAt, selectedLanguage, "name"));
          setSimulatedPosition({ latitude: arrivedAt.lat, longitude: arrivedAt.lng });
          // [적요] 도착한 랜드마크를 자동 선택 -> 설명 카드가 화면에 표시됨
          setSelectedLandmark(arrivedAt);

          // 🛰️ [Server Park] 시뮬레이션 도착 시 오디오 강제 재생 트리거
          // 학생 여러분, 자동 안내 로직이 simulation 위치 변화를 감지하기 전에
          // 즉시 재생을 시작하여 끊김 없는 경험을 제공합니다.
          const name = getTranslatedContent(arrivedAt, selectedLanguage, 'name');
          const description = getTranslatedContent(arrivedAt, selectedLanguage, 'description');
          audioService.playAuto(
            arrivedAt.id,
            `${name}. ${description}`,
            selectedLanguage
          );
        }
        // [적요] 도착 후 정차 모드로 전환
        isPaused = true;
        pauseElapsed = 0;
        progress = 0;
        return;
      }

      // [적요] 현재 출발점과 다음 도착점 사이의 좌표를 선형 보간(lerp)
      const fromStop = tourStops[currentFromIndex];
      const toStop = tourStops[currentFromIndex + 1];
      if (fromStop && toStop) {
        const lat = fromStop.lat + (toStop.lat - fromStop.lat) * progress;
        const lng = fromStop.lng + (toStop.lng - fromStop.lng) * progress;
        setSimulatedPosition({ latitude: lat, longitude: lng });
      }
    }, updateIntervalMs);

    return () => clearInterval(intervalId);
  }, [isSimulationMode, tourStops, simulationSpeed, selectedLanguage]);

  // 🛰️ [Server Park] 실시간 랜드마크 근접 감지 및 자동 안내 효과
  // [적요] lastProximityCheckRef: 마지막 proximity 검사 시각을 기록하여 2초 throttle 구현
  const lastProximityCheckRef = useRef<number>(0);

  useEffect(() => {
    if (!effectivePosition || !audioEnabled || !landmarks.length || offlineMode) return;

    // [적요] 2초 throttle — 매 GPS 업데이트마다 345개 랜드마크를 순회하면
    // 저사양 기기에서 랙이 발생할 수 있으므로, 2초에 1번만 검사합니다.
    const now = Date.now();
    if (now - lastProximityCheckRef.current < 2000) return;
    lastProximityCheckRef.current = now;

    const nearest = checkProximity(
      effectivePosition.latitude,
      effectivePosition.longitude,
      landmarks,
      spokenLandmarks, // 이미 안내된 곳은 제외
      (effectivePosition as any).accuracy || 0 // GPS 정확도를 전달하여 동적 반경 계산
    );

    if (nearest) {
      const { landmark, distance } = nearest;
      const name = getTranslatedContent(landmark, selectedLanguage, 'name');
      const description = getTranslatedContent(landmark, selectedLanguage, 'description');

      console.log(`🎯 [Proximity] Landmark Detected: ${name} (${Math.round(distance)}m, accuracy: ${Math.round((effectivePosition as any).accuracy || 0)}m)`);

      // 자동 재생 트리거
      audioService.playAuto(
        landmark.id,
        `${name}. ${description}`,
        selectedLanguage
      );

      // 안내 완료 목록에 추가
      setSpokenLandmarks(prev => new Set(Array.from(prev).concat(landmark.id)));

      // 방문 처리 (서버 연동)
      if (!isVisited(landmark.id)) {
        markVisited(landmark.id);
        toast({
          title: selectedLanguage === 'ko' ? '새로운 장소 발견!' : 'New Place Discovered!',
          description: name,
        });
      }

      // 해당 랜드마크로 지도 및 카드 포커싱
      setSelectedLandmark(landmark);
      setIsCardMinimized(false);
    } else {
      // 🛰️ [Server Park] 재청취 로직: 랜드마크에서 충분히 멀어지면 안내 기록 리셋
      // 랜드마크의 안내 반경(radius)의 3배 이상 멀어지면 '말한 목록'에서 제거합니다.
      const farEnoughDistance = 0.5; // 500m 이상 멀어지면 전체 리셋 후보 (또는 개별 체크)

      spokenLandmarks.forEach(landmarkId => {
        const landmark = landmarks.find(l => l.id === landmarkId);
        if (landmark) {
          const distance = calculateDistance(
            effectivePosition.latitude,
            effectivePosition.longitude,
            landmark.lat,
            landmark.lng
          );

          // 안내 반경의 5배 이상 멀어지면 다시 안내할 수 있도록 리셋
          const resetRadius = (landmark.radius / 1000) * 5;
          if (distance > Math.max(resetRadius, 0.3)) { // 최소 300m 이상 멀어졌을 때
            setSpokenLandmarks(prev => {
              const next = new Set(prev);
              next.delete(landmarkId);
              return next;
            });
            audioService.removeLandmark(landmarkId);
            console.log(`♻️ [Re-visit] Resetting landmark for re-hearing: ${landmark.id}`);
          }
        }
      });
    }
  }, [effectivePosition, landmarks, audioEnabled, spokenLandmarks, selectedLanguage, offlineMode]);

  // Location search using OpenStreetMap Nominatim API
  const handleLocationSearch = async () => {
    if (!locationSearchQuery.trim() || !selectedCity) return;

    setIsSearchingLocation(true);
    try {
      // Search within city bounds using viewbox parameter
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
      toast({
        title: selectedLanguage === 'ko' ? '검색 오류' : 'Search Error',
        description: selectedLanguage === 'ko' ? '위치를 검색할 수 없습니다' : 'Could not search location',
        variant: 'destructive'
      });
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Capture map route as image
  const captureRouteImage = useCallback(async () => {
    if (!mapContainerRef.current || tourStops.length < 2) return;

    setIsCapturingRoute(true);
    try {
      // Find the map container (leaflet-container class)
      const mapElement = mapContainerRef.current.querySelector('.leaflet-container') as HTMLElement;
      if (!mapElement) {
        console.error('Map container not found');
        return;
      }

      // Wait for all tiles and route to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert SVG elements to inline data URLs for better capture
      // This helps html2canvas capture SVG route lines properly
      const svgElements = mapElement.querySelectorAll('svg');
      svgElements.forEach(svg => {
        // Ensure SVG has proper dimensions
        if (!svg.getAttribute('width')) {
          const rect = svg.getBoundingClientRect();
          svg.setAttribute('width', String(rect.width));
          svg.setAttribute('height', String(rect.height));
        }
      });

      // Add crossorigin to tile images for CORS
      const tileImages = mapElement.querySelectorAll('.leaflet-tile') as NodeListOf<HTMLImageElement>;
      tileImages.forEach(img => {
        if (!img.crossOrigin) {
          img.crossOrigin = 'anonymous';
        }
      });

      // Use html2canvas with enhanced options for SVG support
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 2, // Higher resolution for better quality
        backgroundColor: '#f5f5f5',
        foreignObjectRendering: true, // Enable SVG foreignObject rendering
        imageTimeout: 15000, // Wait longer for images
        onclone: (clonedDoc) => {
          // Ensure SVG path elements have proper stroke attributes
          const clonedSvgs = clonedDoc.querySelectorAll('svg path');
          clonedSvgs.forEach((path) => {
            const pathElement = path as SVGPathElement;
            const computedStyle = window.getComputedStyle(pathElement);
            // Apply computed styles inline for better capture
            if (computedStyle.stroke && computedStyle.stroke !== 'none') {
              pathElement.setAttribute('stroke', computedStyle.stroke);
              pathElement.setAttribute('stroke-width', computedStyle.strokeWidth || '4');
              pathElement.setAttribute('stroke-opacity', computedStyle.strokeOpacity || '1');
            }
          });
        }
      });

      // Convert to base64 image
      const imageData = canvas.toDataURL('image/png', 0.9);
      setCapturedRouteImage(imageData);

      // Show the card with the captured image
      setForceShowCard(true);
      setIsCardMinimized(false);

      toast({
        title: selectedLanguage === 'ko' ? '경로 캡쳐 완료' : 'Route Captured',
        description: selectedLanguage === 'ko' ? '투어 경로가 저장되었습니다' : 'Tour route has been saved',
      });
    } catch (error) {
      console.error('Failed to capture route:', error);
      toast({
        title: selectedLanguage === 'ko' ? '캡쳐 실패' : 'Capture Failed',
        description: selectedLanguage === 'ko' ? '경로를 캡쳐할 수 없습니다' : 'Could not capture the route',
        variant: 'destructive'
      });
    } finally {
      setIsCapturingRoute(false);
    }
  }, [tourStops.length, selectedLanguage, toast]);

  const handleAddToTour = (landmark: Landmark) => {
    // Check if landmark is already in tour
    if (tourStops.some(stop => stop.id === landmark.id)) {
      // Remove from tour if already added
      setTourStops(tourStops.filter(stop => stop.id !== landmark.id));
      // Remove individual duration
      setTourStopDurations(prev => {
        const updated = { ...prev };
        delete updated[landmark.id];
        return updated;
      });
    } else {
      // Add to tour
      setTourStops([...tourStops, landmark]);
      // Set default individual duration
      setTourStopDurations(prev => ({
        ...prev,
        [landmark.id]: tourTimePerStop
      }));

      // Play click sound
      playClickSound();

      // Show toast message
      const landmarkName = getTranslatedContent(landmark, selectedLanguage, 'name');
      const message = selectedLanguage === 'ko' ? `${landmarkName} 투어에 추가됨` :
        selectedLanguage === 'es' ? `${landmarkName} añadido al tour` :
          selectedLanguage === 'fr' ? `${landmarkName} ajouté au tour` :
            selectedLanguage === 'de' ? `${landmarkName} zur Tour hinzugefügt` :
              selectedLanguage === 'it' ? `${landmarkName} aggiunto al tour` :
                selectedLanguage === 'zh' ? `${landmarkName} 已添加到旅程` :
                  selectedLanguage === 'ja' ? `${landmarkName} ツアーに追加` :
                    selectedLanguage === 'pt' ? `${landmarkName} adicionado ao tour` :
                      selectedLanguage === 'ru' ? `${landmarkName} добавлено в тур` :
                        `${landmarkName} added to tour`;

      toast({
        description: message,
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
    clearSavedTourData();
  };

  // Startup dialog handlers
  const handleStartupClose = () => {
    setShowStartupDialog(false);
    sessionStorage.setItem('startup-dialog-shown', 'true');
    // 🎖️ [Dodari Architecture] Manual Skip/Close should NOT trigger 'STARTUP_FINISH' 
    // AND should clear any pending actions like 'CITY_CHANGE' at startup.
    setLastUIAction('NONE');
  };

  const handleSelectGPS = () => {
    // 🩺 [Bug Doctor] 모바일 오디오 정책: 사용자 제스처 시점에 잠금 해제 필수
    audioService.unlockAudio();

    handleStartupClose();
    setLastUIAction('STARTUP_FINISH'); // 🎖️ [Dodari Architecture] GPS Start should trigger Magic Landing
    // If GPS position is available and we have cities data, try to find nearest city
    if (position && cities.length > 0) {
      let nearestCity = cities[0];
      let minDistance = Infinity;

      cities.forEach(city => {
        const distance = calculateDistance(position.latitude, position.longitude, city.lat, city.lng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCity = city;
        }
      });

      setSelectedCityId(nearestCity.id);

      toast({
        description: selectedLanguage === 'ko'
          ? `📍 ${nearestCity.name} 근처에서 시작합니다`
          : `📍 Starting near ${nearestCity.name}`,
        duration: 3000,
      });
    }
  };

  const handleRestoreTour = (data: { cityId: string; tourStops: string[]; tourTimePerStop: number }) => {
    handleStartupClose();

    // Set city first
    setSelectedCityId(data.cityId);
    setTourTimePerStop(data.tourTimePerStop);

    // We need to wait for landmarks to load, so we'll use a flag
    const restoreTourStopsWhenReady = () => {
      if (landmarks.length > 0) {
        const restoredStops = data.tourStops
          .map(id => landmarks.find(l => l.id === id))
          .filter((l): l is Landmark => l !== undefined);

        if (restoredStops.length > 0) {
          setTourStops(restoredStops);

          toast({
            description: selectedLanguage === 'ko'
              ? `✨ ${restoredStops.length}개 장소가 복원되었습니다`
              : `✨ Restored ${restoredStops.length} tour stops`,
            duration: 3000,
          });
        }
      } else {
        // Landmarks not loaded yet, try again
        setTimeout(restoreTourStopsWhenReady, 500);
      }
    };

    // If landmarks for the restored city need to be fetched, wait for them
    if (data.cityId === selectedCityId && landmarks.length > 0) {
      restoreTourStopsWhenReady();
    } else {
      // City change will trigger landmarks fetch, wait a bit
      setTimeout(restoreTourStopsWhenReady, 1000);
    }
  };

  const handleTourRouteFound = (route: any) => {
    if (route && route.summary) {
      const segments: Array<{ from: string; to: string; distance: number; duration: number }> = [];

      // Use route.legs for accurate per-segment distance and duration
      // Note: leg.time is in seconds (from MapView's estimateWalkingTime * 60)
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
    // Open AI recommendation dialog using GPT-5.1 Thinking with database landmarks
    setShowAIRecommend(true);
  };

  // Handler for toggle
  const handleToggleLandmarks = () => {
    setShowLandmarks(!showLandmarks);
  };

  const handleToggleActivities = () => {
    setShowActivities(!showActivities);
  };

  const handleToggleRestaurants = () => {
    setShowRestaurants(!showRestaurants);
  };

  const handleToggleGiftShops = () => {
    setShowGiftShops(!showGiftShops);
  };

  // Filter landmarks based on category
  const filteredByCategory = landmarks.filter(landmark => {
    const isActivity = landmark.category === 'Activity';
    const isRestaurant = landmark.category === 'Restaurant';
    const isGiftShop = landmark.category === 'Gift Shop' || landmark.category === 'Shop';
    if (isActivity) return showActivities;
    if (isRestaurant) return showRestaurants;
    if (isGiftShop) return showGiftShops;
    return showLandmarks;
  });

  // Optimize for low-end devices: limit markers and prioritize by distance
  const filteredLandmarks = deviceCapabilities.isLowEnd && position
    ? filteredByCategory
      .map(landmark => ({
        ...landmark,
        distance: calculateDistance(position.latitude, position.longitude, landmark.lat, landmark.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxMarkers)
    : filteredByCategory;

  // Only show loading screen if cities haven't loaded yet
  // When changing cities, landmarks will reload but we'll show the previous city's landmarks
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
    <>
      {/* Startup Dialog */}
      <StartupDialog
        isOpen={showStartupDialog}
        onClose={handleStartupClose}
        onSelectGPS={handleSelectGPS}
        onRestoreTour={handleRestoreTour}
        savedTourData={savedTourData}
        selectedLanguage={selectedLanguage}
        isGpsAvailable={!!position}
        isGpsLoading={isLoading}
      />

      {/* [연구소장 가이드: 백그라운드 가이드 안내 팝업]
          학생 여러분, 사용자의 편의를 위해 먼저 물어보고 기능을 켜는 것이 'UX의 정석'입니다. */}
      <Dialog open={showBackgroundGuideDialog} onOpenChange={setShowBackgroundGuideDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-indigo-700 dark:text-indigo-400">
              <Navigation2 className="w-6 h-6 animate-pulse" />
              {selectedLanguage === 'ko' ? '스마트 가이드 모드' : 'Smart Guide Mode'}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {selectedLanguage === 'ko'
                ? '목적지를 설정하지 않아도, 주변 랜드마크를 지나갈 때 자동으로 오디오 가이드를 들으시겠습니까?'
                : 'Would you like to hear audio guides automatically when passing nearby landmarks, even without a set destination?'}
              <br />
              <span className="text-sm text-muted-foreground mt-2 inline-block">
                {selectedLanguage === 'ko'
                  ? '※ 백그라운드에서도 GPS 기능을 사용하여 가이드를 지속합니다.'
                  : '※ Uses GPS in the background to continue providing guidance.'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => handleSetBackgroundGuide(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
            >
              <Activity className="mr-2 w-5 h-5" />
              {selectedLanguage === 'ko' ? '네, 자동으로 들을래요!' : 'Yes, I want auto guides!'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSetBackgroundGuide(false)}
              className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-800"
            >
              {selectedLanguage === 'ko' ? '필요할 때만 직접 켤게요' : 'I will turn it on manually'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MenuDialog
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        isSpeaking={isSpeaking}
        speechRate={speechRate}
        onSpeechRateChange={handleSpeechRateChange}
        onTestAudio={handleTestAudio}
        cities={cities}
        selectedCityId={selectedCityId}
        onCityChange={handleCityChange}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        activeRoute={activeRoute}
        onClearRoute={handleClearRoute}
        offlineMode={offlineMode}
        onToggleOfflineMode={handleToggleOfflineMode}
        gpsEnabled={gpsEnabled}
        onToggleGps={handleToggleGps}
        totalLandmarks={landmarks.length}
        cityName={selectedCity?.name}
        landmarks={landmarks}
        onLandmarkClick={(landmark) => setSelectedLandmark(landmark)}
        searchedLocations={searchedLocations}
        onSearchedLocationClick={(location) => {
          setStartingPoint({
            id: location.id,
            type: 'hotel',
            name: location.name,
            lat: location.lat,
            lng: location.lng
          });
          toast({
            title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
            description: location.name
          });
        }}
        tourStops={tourStops}
        tourRouteInfo={tourRouteInfo}
        onRemoveTourStop={(landmarkId) => setTourStops(tourStops.filter(stop => stop.id !== landmarkId))}
        onClearTour={handleClearTour}
        tourTimePerStop={tourTimePerStop}
        onTourTimePerStopChange={setTourTimePerStop}
        onDownloadData={handleDownloadData}
        onUploadData={handleUploadData}
      />

      <div className="flex w-full flex-1 flex-col h-screen">
        <header className="flex items-center gap-1 sm:gap-2 px-2 py-1 border-b bg-background z-[1001]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(true)}
                data-testid="button-menu-toggle"
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{selectedLanguage === 'ko' ? '설정 메뉴 열기' : 'Open Settings Menu'}</p>
            </TooltipContent>
          </Tooltip>
          <h1
            className="font-serif font-semibold text-base sm:text-lg cursor-pointer hover-elevate active-elevate-2 px-2 py-0.5 rounded-md transition-colors truncate"
            onClick={() => setShowMenu(true)}
            data-testid="h1-title-toggle-menu"
          >
            <span className="hidden xs:inline">GPS Audio Guide</span>
            <span className="xs:hidden">GPS Guide</span>
          </h1>

          {/* List Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCardMinimized ? "outline" : "default"}
                size="sm"
                className="h-7 gap-1 px-2"
                onClick={() => {
                  // 카드가 최소화되어 있을 때
                  if (isCardMinimized) {
                    // 목록만 표시 (크루즈 항구 정보는 별도 버튼으로)
                    setShowCruisePort(false);
                    setIsCardMinimized(false);
                  } else {
                    // 카드가 펼쳐져 있을 때
                    if (showCruisePort) {
                      // 크루즈 항구 정보가 표시 중이면 끄고 목록만 표시
                      setShowCruisePort(false);
                    } else {
                      // 목록만 표시 중이면 카드 최소화
                      setIsCardMinimized(true);
                    }
                  }
                }}
                data-testid="button-toggle-list"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">
                  {t('list', selectedLanguage)}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{selectedLanguage === 'ko' ? '명소 목록 표시/숨기기' : 'Show/Hide Landmark List'}</p>
            </TooltipContent>
          </Tooltip>

          {/* [적요] 내 위치로 이동 버튼 — GPS 위치가 있을 때만 표시 */}
          {position && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-2"
                  onClick={() => {
                    // [적요] resetMapInteraction()을 호출하여 userHasInteracted 플래그를 리셋하면
                    // MapUpdater가 자동으로 사용자의 GPS 위치로 지도 중심을 이동합니다.
                    resetMapInteraction();
                    toast({
                      description: selectedLanguage === 'ko'
                        ? '📍 내 위치로 이동합니다'
                        : '📍 Moving to your location',
                      duration: 2000,
                    });
                  }}
                  data-testid="button-recenter-gps"
                >
                  <Navigation2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">
                    {selectedLanguage === 'ko' ? '내 위치' : 'My Location'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '내 위치로 지도 이동' : 'Move map to my location'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Starting/End Point Selector */}
          <Popover open={isStartingPointPopoverOpen} onOpenChange={(open) => {
            setIsStartingPointPopoverOpen(open);
            if (!open) {
              setLocationSearchQuery('');
              setLocationSearchResults([]);
            }
          }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant={(startingPoint || endPoint) ? "default" : "outline"}
                    size="sm"
                    className={`h-7 gap-1 px-2 ${(startingPoint || endPoint) ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : ''}`}
                    data-testid="button-starting-point"
                  >
                    <div className="flex items-center gap-0.5">
                      <Circle className={`w-2.5 h-2.5 ${startingPoint ? 'fill-white' : ''}`} />
                      <span className="text-[10px]">→</span>
                      <Flag className={`w-2.5 h-2.5 ${endPoint ? 'fill-white' : ''}`} />
                    </div>
                    <span className="hidden sm:inline text-xs">
                      {selectedLanguage === 'ko' ? '출발/도착' : 'Start/End'}
                    </span>
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '출발지/도착지 및 출발 시간 설정' : 'Set Start/End Points & Departure Time'}</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-2 z-[9999] max-h-[70vh] overflow-y-auto" align="start">
              {/* All Settings Complete Banner */}
              {startingPoint && endPoint && departureTime && (
                <div className="mb-3 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {t('setupComplete', selectedLanguage)}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3 fill-green-500 text-green-500" />
                      <span className="text-muted-foreground truncate">{getStartingPointName(startingPoint, selectedLanguage)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="w-3 h-3 fill-red-500 text-red-500" />
                      <span className="text-muted-foreground truncate">{getStartingPointName(endPoint, selectedLanguage)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-muted-foreground">
                        {departureTime.toLocaleTimeString(selectedLanguage === 'ko' ? 'ko-KR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          weekday: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => setIsStartingPointPopoverOpen(false)}
                      data-testid="button-setup-done"
                    >
                      {t('done', selectedLanguage)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-500 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        setStartingPoint(null);
                        setEndPoint(null);
                        setDepartureTime(null);
                        setIsSelectingHotelOnMap(false);
                        setIsSelectingEndPointOnMap(false);
                      }}
                      data-testid="button-setup-reset"
                    >
                      {t('reset', selectedLanguage)}
                    </Button>
                  </div>
                </div>
              )}

              <Tabs defaultValue="start" value={pointSelectionMode} onValueChange={(v) => setPointSelectionMode(v as 'start' | 'end' | 'time')}>
                <TabsList className="grid w-full grid-cols-3 mb-2 sticky top-0 z-10 bg-popover">
                  <TabsTrigger value="start" className="gap-1 px-2" data-testid="tab-start-point">
                    <Circle className={`w-3 h-3 ${startingPoint ? 'fill-green-500 text-green-500' : ''}`} />
                    <span className="text-xs">{t('startLabel', selectedLanguage)}</span>
                    {startingPoint && <span className="text-[10px] text-green-500">✓</span>}
                  </TabsTrigger>
                  <TabsTrigger value="end" className="gap-1 px-2" data-testid="tab-end-point">
                    <Flag className={`w-3 h-3 ${endPoint ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-xs">{t('endLabel', selectedLanguage)}</span>
                    {endPoint && <span className="text-[10px] text-red-500">✓</span>}
                  </TabsTrigger>
                  <TabsTrigger value="time" className="gap-1 px-2" data-testid="tab-departure-time">
                    <Clock className={`w-3 h-3 ${departureTime ? 'text-amber-500' : ''}`} />
                    <span className="text-xs">{t('timeLabel', selectedLanguage)}</span>
                    {departureTime && <span className="text-[10px] text-amber-500">✓</span>}
                  </TabsTrigger>
                </TabsList>

                {/* Start Point Content */}
                <TabsContent value="start" className="space-y-2 mt-0">
                  {/* Current Selection */}
                  {startingPoint && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                      <Circle className="w-4 h-4 fill-green-500 text-green-500" />
                      <span className="text-sm flex-1 truncate">{getStartingPointName(startingPoint, selectedLanguage)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-100"
                        onClick={() => {
                          setStartingPoint(null);
                          setIsSelectingHotelOnMap(false);
                        }}
                      >
                        <span className="text-lg">×</span>
                      </Button>
                    </div>
                  )}

                  {/* Location Search */}
                  <div className="flex gap-1">
                    <Input
                      placeholder={t('searchPlaceholder', selectedLanguage)}
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLocationSearch();
                        }
                      }}
                      className="h-8 text-sm"
                      data-testid="input-location-search"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLocationSearch}
                      disabled={isSearchingLocation || !locationSearchQuery.trim()}
                      className="h-8 px-2"
                      data-testid="button-location-search"
                    >
                      {isSearchingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {locationSearchResults.length > 0 && (
                    <div className="space-y-1 border-b pb-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {selectedLanguage === 'ko' ? '검색 결과' : 'Search Results'}
                      </p>
                      {locationSearchResults.map((result, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-auto py-1.5"
                          onClick={() => {
                            const searchedLocation = {
                              id: `search_${Date.now()}_${index}`,
                              name: result.name,
                              lat: result.lat,
                              lng: result.lng
                            };
                            setStartingPoint({
                              id: searchedLocation.id,
                              type: 'hotel',
                              name: result.name,
                              lat: result.lat,
                              lng: result.lng
                            });
                            setSearchedLocations(prev => {
                              if (prev.some(loc => loc.name === result.name)) return prev;
                              return [...prev, searchedLocation];
                            });
                            setLocationSearchQuery('');
                            setLocationSearchResults([]);
                            toast({
                              title: t('startingPointSet', selectedLanguage),
                              description: result.name
                            });
                          }}
                          data-testid={`button-search-result-${index}`}
                        >
                          <MapPin className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-left line-clamp-2">{result.name}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* My Location Option */}
                  <Button
                    variant={startingPoint?.type === 'my_location' ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (position) {
                        setStartingPoint({
                          id: 'my_location',
                          type: 'my_location',
                          name: t('myLocation', selectedLanguage),
                          lat: position.latitude,
                          lng: position.longitude
                        });
                        toast({
                          title: t('startingPointSet', selectedLanguage),
                          description: t('myLocation', selectedLanguage)
                        });
                      } else {
                        toast({
                          title: t('locationRequired', selectedLanguage),
                          description: t('gpsRequired', selectedLanguage),
                          variant: 'destructive'
                        });
                      }
                    }}
                    data-testid="button-starting-my-location"
                  >
                    <Navigation2 className="w-4 h-4 text-blue-500" />
                    {t('myLocation', selectedLanguage)}
                    {!position && <span className="text-xs text-muted-foreground ml-auto">(GPS)</span>}
                  </Button>

                  {/* Hotel Option - Collapsible Dropdown */}
                  {(() => {
                    const cityPoints = getCityStartingPoints(selectedCityId);
                    const hotels = cityPoints?.hotels || [];

                    return (
                      <Collapsible className="w-full">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={startingPoint?.type === 'hotel' ? "default" : "outline"}
                            size="sm"
                            className="w-full justify-between gap-2"
                            data-testid="button-starting-hotel-dropdown"
                          >
                            <div className="flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-purple-500" />
                              <span>{t('hotel', selectedLanguage)}</span>
                              {startingPoint?.type === 'hotel' && (
                                <span className="text-xs opacity-80 truncate max-w-[120px]">
                                  ({startingPoint.name?.split(' ').slice(0, 2).join(' ')}...)
                                </span>
                              )}
                            </div>
                            <ChevronDown className="w-4 h-4 transition-transform duration-200 [&[data-state=open]>svg]:rotate-180" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1 space-y-1 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
                          {/* Select on Map Option */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 h-8"
                            onClick={() => {
                              setIsSelectingHotelOnMap(true);
                              setIsSelectingEndPointOnMap(false);
                              setIsStartingPointPopoverOpen(false);
                              toast({
                                title: t('selectStartPointTitle', selectedLanguage),
                                description: t('tapMapDesc', selectedLanguage)
                              });
                            }}
                            data-testid="button-starting-hotel-map"
                          >
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs">{t('selectOnMap', selectedLanguage)}</span>
                          </Button>

                          {/* Hotel List */}
                          {hotels.length > 0 && (
                            <>
                              <div className="text-[10px] text-muted-foreground px-2 pt-1">
                                {t('recommendedHotels', selectedLanguage)}
                              </div>
                              {hotels.map((hotel) => (
                                <Button
                                  key={hotel.id}
                                  variant={startingPoint?.id === hotel.id ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start gap-2 h-8"
                                  onClick={() => {
                                    setStartingPoint(hotel);
                                    toast({
                                      title: t('startingPointSet', selectedLanguage),
                                      description: getStartingPointName(hotel, selectedLanguage)
                                    });
                                  }}
                                  data-testid={`button-starting-hotel-${hotel.id}`}
                                >
                                  <Hotel className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                  <span className="text-xs truncate">{getStartingPointName(hotel, selectedLanguage)}</span>
                                </Button>
                              ))}
                            </>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })()}

                  {/* City-specific starting points */}
                  {(() => {
                    const cityPoints = getCityStartingPoints(selectedCityId);
                    if (!cityPoints) return null;

                    return (
                      <>
                        {/* Airports */}
                        {cityPoints.airports.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t('airport', selectedLanguage)}</p>
                            {cityPoints.airports.map((airport) => (
                              <Button
                                key={airport.id}
                                variant={startingPoint?.id === airport.id ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setStartingPoint(airport);
                                  toast({
                                    title: t('startingPointSet', selectedLanguage),
                                    description: getStartingPointName(airport, selectedLanguage)
                                  });
                                }}
                                data-testid={`button-starting-airport-${airport.id}`}
                              >
                                <Plane className="w-4 h-4 text-sky-500" />
                                <span className="truncate">{getStartingPointName(airport, selectedLanguage)}</span>
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Cruise Terminals */}
                        {cityPoints.cruiseTerminals.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t('cruiseTerminal', selectedLanguage)}</p>
                            {cityPoints.cruiseTerminals.map((terminal) => (
                              <Button
                                key={terminal.id}
                                variant={startingPoint?.id === terminal.id ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setStartingPoint(terminal);
                                  toast({
                                    title: t('startingPointSet', selectedLanguage),
                                    description: getStartingPointName(terminal, selectedLanguage)
                                  });
                                }}
                                data-testid={`button-starting-terminal-${terminal.id}`}
                              >
                                <Ship className="w-4 h-4 text-teal-500" />
                                <span className="truncate">{getStartingPointName(terminal, selectedLanguage)}</span>
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Train Stations */}
                        {cityPoints.trainStations.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">
                              {t('trainStation', selectedLanguage)}
                            </p>
                            {cityPoints.trainStations.map((station) => (
                              <Button
                                key={station.id}
                                variant={startingPoint?.id === station.id ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setStartingPoint(station);
                                  toast({
                                    title: t('startingPointSet', selectedLanguage),
                                    description: getStartingPointName(station, selectedLanguage)
                                  });
                                }}
                                data-testid={`button-starting-station-${station.id}`}
                              >
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="truncate">{getStartingPointName(station, selectedLanguage)}</span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>

                {/* End Point Content */}
                <TabsContent value="end" className="space-y-2 mt-0">
                  {/* Current Selection */}
                  {endPoint && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                      <Flag className="w-4 h-4 fill-red-500 text-red-500" />
                      <span className="text-sm flex-1 truncate">{getStartingPointName(endPoint, selectedLanguage)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-100"
                        onClick={() => {
                          setEndPoint(null);
                          setIsSelectingEndPointOnMap(false);
                        }}
                      >
                        <span className="text-lg">×</span>
                      </Button>
                    </div>
                  )}

                  {/* Same as start option */}
                  {startingPoint && (
                    <Button
                      variant={endPoint?.id === startingPoint.id ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start gap-2 border-dashed"
                      onClick={() => {
                        setEndPoint(startingPoint);
                        toast({
                          title: t('endPointSet', selectedLanguage),
                          description: t('sameAsStartDesc', selectedLanguage)
                        });
                      }}
                      data-testid="button-end-same-as-start"
                    >
                      <Circle className="w-4 h-4 text-green-500" />
                      {t('sameAsStart', selectedLanguage)}
                    </Button>
                  )}

                  {/* Location Search */}
                  <div className="flex gap-1">
                    <Input
                      placeholder={t('searchPlaceholder', selectedLanguage)}
                      value={locationSearchQuery}
                      onChange={(e) => setLocationSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLocationSearch();
                        }
                      }}
                      className="h-8 text-sm"
                      data-testid="input-end-location-search"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLocationSearch}
                      disabled={isSearchingLocation || !locationSearchQuery.trim()}
                      className="h-8 px-2"
                      data-testid="button-end-location-search"
                    >
                      {isSearchingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {locationSearchResults.length > 0 && (
                    <div className="space-y-1 border-b pb-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {t('searchResults', selectedLanguage)}
                      </p>
                      {locationSearchResults.map((result, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-auto py-1.5"
                          onClick={() => {
                            const searchedLocation = {
                              id: `search_${Date.now()}_${index}`,
                              name: result.name,
                              lat: result.lat,
                              lng: result.lng
                            };
                            setEndPoint({
                              id: searchedLocation.id,
                              type: 'hotel',
                              name: result.name,
                              lat: result.lat,
                              lng: result.lng
                            });
                            setSearchedLocations(prev => {
                              if (prev.some(loc => loc.name === result.name)) return prev;
                              return [...prev, searchedLocation];
                            });
                            setLocationSearchQuery('');
                            setLocationSearchResults([]);
                            toast({
                              title: t('endPointSet', selectedLanguage),
                              description: result.name
                            });
                          }}
                          data-testid={`button-end-search-result-${index}`}
                        >
                          <Flag className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-left line-clamp-2">{result.name}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* My Location Option */}
                  <Button
                    variant={endPoint?.type === 'my_location' ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (position) {
                        setEndPoint({
                          id: 'end_my_location',
                          type: 'my_location',
                          name: t('myLocation', selectedLanguage),
                          lat: position.latitude,
                          lng: position.longitude
                        });
                        toast({
                          title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
                          description: t('myLocation', selectedLanguage)
                        });
                      } else {
                        toast({
                          title: selectedLanguage === 'ko' ? '위치 정보 필요' : 'Location Required',
                          description: selectedLanguage === 'ko' ? 'GPS 위치를 확인할 수 없습니다' : 'GPS location not available',
                          variant: 'destructive'
                        });
                      }
                    }}
                    data-testid="button-end-my-location"
                  >
                    <Navigation2 className="w-4 h-4 text-blue-500" />
                    {t('myLocation', selectedLanguage)}
                    {!position && <span className="text-xs text-muted-foreground ml-auto">(GPS)</span>}
                  </Button>

                  {/* Select on Map Option */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setIsSelectingEndPointOnMap(true);
                      setIsSelectingHotelOnMap(false);
                      setIsStartingPointPopoverOpen(false);
                      toast({
                        title: selectedLanguage === 'ko' ? '도착지 선택' : 'Select End Point',
                        description: selectedLanguage === 'ko' ? '지도에서 위치를 탭하세요' : 'Tap on map to set location'
                      });
                    }}
                    data-testid="button-end-select-map"
                  >
                    <MapPin className="w-4 h-4 text-red-500" />
                    {selectedLanguage === 'ko' ? '지도에서 선택' : 'Select on map'}
                  </Button>

                  {/* City-specific end points */}
                  {(() => {
                    const cityPoints = getCityStartingPoints(selectedCityId);
                    if (!cityPoints) return null;

                    return (
                      <>
                        {/* Airports */}
                        {cityPoints.airports.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t('airport', selectedLanguage)}</p>
                            {cityPoints.airports.map((airport) => (
                              <Button
                                key={airport.id}
                                variant={endPoint?.id === `end_${airport.id}` ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setEndPoint({ ...airport, id: `end_${airport.id}` });
                                  toast({
                                    title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
                                    description: getStartingPointName(airport, selectedLanguage)
                                  });
                                }}
                                data-testid={`button-end-airport-${airport.id}`}
                              >
                                <Plane className="w-4 h-4 text-sky-500" />
                                <span className="truncate">{getStartingPointName(airport, selectedLanguage)}</span>
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Cruise Terminals */}
                        {cityPoints.cruiseTerminals.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">{t('cruiseTerminal', selectedLanguage)}</p>
                            {cityPoints.cruiseTerminals.map((terminal) => (
                              <Button
                                key={terminal.id}
                                variant={endPoint?.id === `end_${terminal.id}` ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setEndPoint({ ...terminal, id: `end_${terminal.id}` });
                                  toast({
                                    title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
                                    description: getStartingPointName(terminal, selectedLanguage)
                                  });
                                }}
                                data-testid={`button-end-terminal-${terminal.id}`}
                              >
                                <Ship className="w-4 h-4 text-teal-500" />
                                <span className="truncate">{getStartingPointName(terminal, selectedLanguage)}</span>
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Train Stations */}
                        {cityPoints.trainStations.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">
                              {selectedLanguage === 'ko' ? '기차역' : 'Train Station'}
                            </p>
                            {cityPoints.trainStations.map((station) => (
                              <Button
                                key={station.id}
                                variant={endPoint?.id === `end_${station.id}` ? "default" : "outline"}
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                  setEndPoint({ ...station, id: `end_${station.id}` });
                                  toast({
                                    title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
                                    description: getStartingPointName(station, selectedLanguage)
                                  });
                                }}
                                data-testid={`button-end-station-${station.id}`}
                              >
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="truncate">{getStartingPointName(station, selectedLanguage)}</span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </TabsContent>

                {/* Departure Time Content */}
                <TabsContent value="time" className="space-y-3 mt-0">
                  {/* Current Selection */}
                  {departureTime && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-sm flex-1">
                        {departureTime.toLocaleTimeString(selectedLanguage === 'ko' ? 'ko-KR' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          weekday: 'short'
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-100"
                        onClick={() => setDepartureTime(null)}
                      >
                        <span className="text-lg">×</span>
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {selectedLanguage === 'ko' ? '출발 예정 시간을 선택하면 해당 시간대의 교통상황이 예측됩니다.' : 'Select departure time to estimate traffic conditions.'}
                    </p>

                    {/* Use Current Time */}
                    <Button
                      variant={!departureTime ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => setDepartureTime(null)}
                      data-testid="button-time-now"
                    >
                      <Clock className="w-4 h-4 text-blue-500" />
                      {selectedLanguage === 'ko' ? '현재 시간 사용' : 'Use current time'}
                    </Button>

                    {/* Quick Time Presets */}
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { hour: 7, label: { ko: '오전 7시', en: '7 AM' } },
                        { hour: 9, label: { ko: '오전 9시', en: '9 AM' } },
                        { hour: 12, label: { ko: '정오', en: 'Noon' } },
                        { hour: 14, label: { ko: '오후 2시', en: '2 PM' } },
                        { hour: 17, label: { ko: '오후 5시', en: '5 PM' } },
                        { hour: 20, label: { ko: '오후 8시', en: '8 PM' } },
                      ].map(({ hour, label }) => {
                        const presetTime = new Date();
                        presetTime.setHours(hour, 0, 0, 0);
                        const isSelected = departureTime?.getHours() === hour && departureTime?.getMinutes() === 0;

                        return (
                          <Button
                            key={hour}
                            variant={isSelected ? "secondary" : "outline"}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setDepartureTime(presetTime)}
                            data-testid={`button-time-${hour}`}
                          >
                            {selectedLanguage === 'ko' ? label.ko : label.en}
                          </Button>
                        );
                      })}
                    </div>

                    {/* Custom Time Input */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">
                        {selectedLanguage === 'ko' ? '직접 입력' : 'Custom'}
                      </span>
                      <input
                        type="time"
                        className="flex-1 h-8 px-2 text-sm border rounded-md bg-background"
                        value={departureTime ?
                          `${String(departureTime.getHours()).padStart(2, '0')}:${String(departureTime.getMinutes()).padStart(2, '0')}` :
                          ''
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newTime = new Date();
                            newTime.setHours(hours, minutes, 0, 0);
                            setDepartureTime(newTime);
                          }
                        }}
                        data-testid="input-custom-time"
                      />
                    </div>

                    {/* Day of Week Selection */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        {selectedLanguage === 'ko' ? '요일 선택 (주말은 교통량이 다릅니다)' : 'Select day (weekends have different traffic)'}
                      </p>
                      <div className="flex gap-1">
                        {[
                          { day: 0, label: { ko: '일', en: 'Sun' } },
                          { day: 1, label: { ko: '월', en: 'Mon' } },
                          { day: 2, label: { ko: '화', en: 'Tue' } },
                          { day: 3, label: { ko: '수', en: 'Wed' } },
                          { day: 4, label: { ko: '목', en: 'Thu' } },
                          { day: 5, label: { ko: '금', en: 'Fri' } },
                          { day: 6, label: { ko: '토', en: 'Sat' } },
                        ].map(({ day, label }) => {
                          const isWeekend = day === 0 || day === 6;
                          const currentDay = departureTime?.getDay() ?? new Date().getDay();
                          const isSelected = departureTime && currentDay === day;

                          return (
                            <Button
                              key={day}
                              variant={isSelected ? "default" : "ghost"}
                              size="sm"
                              className={`h-7 w-8 p-0 text-xs ${isWeekend ? 'text-red-500' : ''} ${isSelected ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                              onClick={() => {
                                const newTime = departureTime ? new Date(departureTime) : new Date();
                                const diff = day - newTime.getDay();
                                newTime.setDate(newTime.getDate() + diff);
                                setDepartureTime(newTime);
                              }}
                              data-testid={`button-day-${day}`}
                            >
                              {selectedLanguage === 'ko' ? label.ko : label.en}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Clear All Button */}
              {(startingPoint || endPoint) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50 mt-2"
                  onClick={() => {
                    setStartingPoint(null);
                    setEndPoint(null);
                    setIsSelectingHotelOnMap(false);
                    setIsSelectingEndPointOnMap(false);
                  }}
                  data-testid="button-clear-all-points"
                >
                  {selectedLanguage === 'ko' ? '모두 초기화' : 'Clear All'}
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            {/* [강의 노트: 상단 툴바 확장]
                학생 여러분, 이곳이 바로 플랫폼의 주요 기능을 모아놓은 '유틸리티 섹션'입니다.
                크리에이터들이 자주 확인해야 하는 통계 페이지로의 입구를 여기에 배치했습니다.
                TrendingUp 아이콘을 사용하여 '수익과 성장'의 의미를 담았죠. */}
            {/* [적요] QR코드 설치 공유 버튼 - 클릭 시 앱 설치 QR코드 다이얼로그 표시 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 border-purple-300/50 bg-purple-50 hover:bg-purple-100 dark:border-purple-600/30 dark:bg-purple-900/20 dark:hover:bg-purple-900/40"
                  onClick={() => setShowQrDialog(true)}
                  data-testid="button-qr-install"
                >
                  <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? 'QR코드로 앱 설치/공유' : 'Install/Share via QR Code'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 border-primary/20 bg-primary/5 hover:bg-primary/10"
                  onClick={() => setShowCreatorDashboard(true)}
                  data-testid="button-creator-center"
                >
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '크리에이터 센터 (수익 확인)' : 'Creator Center (Earnings)'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isNavigationOnlyMode ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 sm:h-9 sm:w-9 border-amber-300/50 ${isNavigationOnlyMode ? 'bg-amber-500 hover:bg-amber-600 text-white border-none' : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40'}`}
                  onClick={() => setIsNavigationOnlyMode(!isNavigationOnlyMode)}
                  data-testid="button-nav-only-mode"
                >
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '설명 없이 지도만 보기' : 'Map Only (Hide Descriptions)'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isCarNavZoomMode ? "default" : "outline"}
                  size="icon"
                  className={`h-8 w-8 sm:h-9 sm:w-9 border-blue-300/50 ${isCarNavZoomMode ? 'bg-blue-600 hover:bg-blue-700 text-white border-none' : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40'}`}
                  onClick={() => setIsCarNavZoomMode(!isCarNavZoomMode)}
                  data-testid="button-car-nav-zoom"
                >
                  <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '카 내비게이션 줌 (초근접)' : 'Car Nav Zoom (Close-up)'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAiRecommendation}
                  data-testid="button-ai-recommend"
                  className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="hidden sm:inline text-xs">
                    {selectedLanguage === 'ko' ? 'AI 추천' : 'AI'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? 'AI가 최적의 관광 일정을 추천합니다' : 'AI recommends optimal tour itinerary'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showLandmarks ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleLandmarks}
                  data-testid="button-toggle-landmarks"
                  className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${showLandmarks ? '!bg-[hsl(14,85%,55%)] hover:!bg-[hsl(14,85%,50%)] !border-[hsl(14,85%,55%)] text-white' : 'animate-blink'}`}
                >
                  <LandmarkIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">{t('landmarks', selectedLanguage)}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '유명 관광 명소 표시/숨기기' : 'Show/Hide Famous Landmarks'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showActivities ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleActivities}
                  data-testid="button-toggle-activities"
                  className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${showActivities ? '!bg-[hsl(210,85%,55%)] hover:!bg-[hsl(210,85%,50%)] !border-[hsl(210,85%,55%)] text-white' : 'animate-blink'}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">{t('activities', selectedLanguage)}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '체험/액티비티 표시/숨기기' : 'Show/Hide Activities & Experiences'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showRestaurants ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleRestaurants}
                  data-testid="button-toggle-restaurants"
                  className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${showRestaurants ? '!bg-[hsl(25,95%,55%)] hover:!bg-[hsl(25,95%,50%)] !border-[hsl(25,95%,55%)] text-white' : 'animate-blink'}`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">{t('restaurants', selectedLanguage)}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '추천 맛집 표시/숨기기' : 'Show/Hide Recommended Restaurants'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showGiftShops ? "default" : "outline"}
                  size="icon"
                  onClick={handleToggleGiftShops}
                  data-testid="button-toggle-giftshops"
                  className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${showGiftShops ? '!bg-[hsl(45,90%,55%)] hover:!bg-[hsl(45,90%,50%)] !border-[hsl(45,90%,55%)] text-white' : 'animate-blink'}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">{t('giftShops', selectedLanguage)}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '기념품 가게 표시/숨기기' : 'Show/Hide Gift Shops'}</p>
              </TooltipContent>
            </Tooltip>
            {selectedCity?.cruisePort && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showCruisePort ? "default" : "outline"}
                    size="icon"
                    onClick={() => setShowCruisePort(!showCruisePort)}
                    data-testid="button-toggle-cruise-port"
                    className={`h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 ${showCruisePort ? '!bg-[hsl(200,15%,55%)] hover:!bg-[hsl(200,15%,50%)] !border-[hsl(200,15%,55%)] text-white' : 'animate-blink'}`}
                  >
                    <Ship className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-xs">{t('cruisePortInfo', selectedLanguage)}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selectedLanguage === 'ko' ? '크루즈 항구 정보 및 교통편 보기' : 'View Cruise Port Info & Transport'}</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowLoginDialog(true)}
                  data-testid="button-user-account"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <User className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedLanguage === 'ko' ? '로그인 / 계정' : 'Login / Account'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Map Section - always show, full screen on mobile */}
          <div
            ref={mapContainerRef}
            className={`relative ${!isMobile && selectedLandmark ? 'h-1/2' : 'flex-1'} transition-all duration-300`}
          >
            <MapView
              landmarks={filteredLandmarks}
              userPosition={effectivePosition}
              onLandmarkRoute={handleLandmarkRoute}
              activeRoute={activeRoute}
              onRouteFound={setRouteInfo}
              cityCenter={selectedCity ? [selectedCity.lat, selectedCity.lng] : undefined}
              cityZoom={selectedCity?.zoom}
              selectedLanguage={selectedLanguage}
              isCompact={false}
              isSimulationMode={isSimulationMode}
              sidebarOpen={false}
              tourStops={tourStops}
              onAddToTour={handleAddToTour}
              onTourRouteFound={handleTourRouteFound}
              startingPoint={startingPoint}
              endPoint={endPoint}
              isSelectingHotelOnMap={isSelectingHotelOnMap}
              isSelectingEndPointOnMap={isSelectingEndPointOnMap}
              onHotelLocationSelected={(lat, lng) => {
                setStartingPoint({
                  id: 'hotel',
                  type: 'hotel',
                  name: t('hotel', selectedLanguage),
                  lat,
                  lng
                });
                setIsSelectingHotelOnMap(false);
                toast({
                  title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
                  description: t('hotel', selectedLanguage)
                });
              }}
              onEndPointLocationSelected={(lat, lng) => {
                setEndPoint({
                  id: 'end_location',
                  type: 'hotel',
                  name: selectedLanguage === 'ko' ? '도착지' : 'End Point',
                  lat,
                  lng
                });
                setIsSelectingEndPointOnMap(false);
                toast({
                  title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
                  description: selectedLanguage === 'ko' ? '지도에서 선택됨' : 'Selected on map'
                });
              }}
              selectedLandmark={selectedLandmark}
              onLandmarkSelect={setSelectedLandmark}
              onShowList={() => {
                // Show the list panel when tooltip is clicked
                setIsCardMinimized(false);
                setShowCruisePort(false);
              }}
              showTourOnly={showTourOnly}
              tourStopIds={tourStops.map(s => s.id)}
              isMobile={isMobile}
              isCarNavZoomMode={isCarNavZoomMode} // [추가] 카 내비 줌 버튼 상태 전달
            />

            {/* Tour Filter Button - next to zoom controls */}
            {tourStops.length >= 2 && (
              <div
                className="absolute left-[10px] top-[90px] z-[1000]"
                style={{ pointerEvents: 'auto' }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowTourOnly(!showTourOnly)}
                      className={`h-[30px] w-[30px] border-2 rounded-sm shadow-md ${showTourOnly
                        ? 'bg-[hsl(14,85%,55%)] hover:bg-[hsl(14,85%,45%)] border-[hsl(14,85%,55%)]'
                        : 'bg-white hover:bg-gray-100 border-gray-400'
                        }`}
                      data-testid="button-show-tour-only"
                    >
                      <Route className={`w-4 h-4 ${showTourOnly ? 'text-white' : 'text-[hsl(14,85%,55%)]'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{selectedLanguage === 'ko'
                      ? (showTourOnly ? '모든 장소 보기' : '투어 장소만 보기')
                      : (showTourOnly ? 'Show All Places' : 'Show Tour Only')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <OfflineIndicator />
            <InstallPrompt
              selectedLanguage={selectedLanguage}
              onClose={() => setIsWelcomeHandled(true)}
            />
            <UpdatePrompt
              isVisible={showUpdatePrompt}
              onUpdate={() => {
                updateServiceWorker();
                setShowUpdatePrompt(false);
              }}
              onDismiss={() => setShowUpdatePrompt(false)}
              selectedLanguage={selectedLanguage}
            />

            {/* 🛰️ [Server Park] 가상 투어 시뮬레이션 제어 바 */}
            {isSimulationMode && (
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] animate-in fade-in slide-in-from-top-4 duration-500"
                style={{ pointerEvents: 'auto' }}
              >
                <Card className="p-2 sm:p-3 bg-red-600/95 text-white border-none shadow-xl flex items-center gap-2 sm:gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-white/20">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Simulating</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-white/10 rounded-md p-0.5">
                      {[1, 5, 10].map(speed => (
                        <Button
                          key={speed}
                          variant="ghost"
                          size="sm"
                          className={`h-6 px-1.5 sm:px-2 text-[10px] font-bold ${simulationSpeed === speed ? 'bg-white text-red-600' : 'text-white hover:bg-white/20'}`}
                          onClick={() => setSimulationSpeed(speed)}
                        >
                          {speed}x
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* 🛰️ [Server Park] 신규 오디오 제어 옵션 */}
                  <div className="flex items-center gap-1 sm:gap-2 border-l border-white/20 pl-2 sm:pl-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 sm:h-8 sm:w-8 ${simulationAudioSettings.resumePlayback ? 'bg-white/20' : 'opacity-40'}`}
                          onClick={() => setSimulationAudioSettings(prev => ({ ...prev, resumePlayback: !prev.resumePlayback }))}
                        >
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? '이전 위치에서 오디오 이어 듣기' : 'Resume audio from last position'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 sm:h-8 sm:w-8 ${simulationAudioSettings.playInBackground ? 'bg-white/20' : 'opacity-40'}`}
                          onClick={() => setSimulationAudioSettings(prev => ({ ...prev, playInBackground: !prev.playInBackground }))}
                        >
                          <AudioIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{selectedLanguage === 'ko' ? '설명창 닫아도 백그라운드 재생' : 'Play audio in background'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-2 border-l border-white/20 pl-2 sm:pl-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setIsSimulationMode(false)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* [연구소장 가이드: 내비게이션 전용 모드 적용]
          학생 여러분, isNavigationOnlyMode가 켜져 있다면
          사용자에게 지도만 보여주기 위해 설명 패널(UnifiedFloatingCard)을 렌더링하지 않습니다.
          단, 오디오는 뒤에서 계속 나오고 있어야 하겠죠! */}
      {!isNavigationOnlyMode && (
        <UnifiedFloatingCard
          forceShowList={forceShowCard}
          isCardMinimized={isCardMinimized}
          onToggleMinimized={() => setIsCardMinimized(!isCardMinimized)}
          showMinimalTransitUI={showMinimalTransitUI}
          onToggleMinimalTransitUI={() => setShowMinimalTransitUI(!showMinimalTransitUI)}
          selectedLandmark={selectedLandmark}
          isTransitMode={!!activeRoute && !isManualSelection && !hasArrivedAtDestination}
          onLandmarkClose={() => {
            setSelectedLandmark(null);
            setIsManualSelection(false);
            // 🩺 [Bug Doctor] 카드 닫기 시 오디오 즉시 중지 정책 반영
            audioService.stopAll();
          }}
          onNavigate={handleLandmarkRoute}
          onAddToTour={handleAddToTour}
          isInTour={selectedLandmark ? tourStops.some(stop => stop.id === selectedLandmark.id) : false}
          city={selectedCity || null}
          showCruisePort={showCruisePort}
          onCruisePortClose={() => setShowCruisePort(false)}
          tourStops={tourStops}
          tourRouteInfo={tourRouteInfo}
          onRemoveTourStop={(landmarkId) => {
            setTourStops(tourStops.filter(stop => stop.id !== landmarkId));
            setTourStopDurations(prev => {
              const updated = { ...prev };
              delete updated[landmarkId];
              return updated;
            });
          }}
          tourTimePerStop={tourTimePerStop}
          tourStopDurations={tourStopDurations}
          onUpdateStopDuration={handleUpdateStopDuration}
          onSaveRoute={() => setShowSaveRouteDialog(true)}
          onOpenMyRoutes={() => window.location.href = '/my-routes'}
          aiRecommendation={aiRecommendation}
          onLandmarkClick={(landmarkId) => {
            const landmark = filteredLandmarks.find(l => l.id === landmarkId);
            if (landmark) {
              // Now set selected landmark
              setIsManualSelection(true); // 직접 클릭했으므로 수동 선택 모드
              setSelectedLandmark(landmark);
            }
          }}
          landmarks={landmarks}
          userPosition={effectivePosition}
          onLandmarkRoute={handleLandmarkRoute}
          onLandmarkSelect={setSelectedLandmark}
          spokenLandmarks={spokenLandmarks}
          showLandmarks={showLandmarks}
          showActivities={showActivities}
          showRestaurants={showRestaurants}
          showGiftShops={showGiftShops}
          onToggleLandmarks={handleToggleLandmarks}
          onToggleActivities={handleToggleActivities}
          onToggleRestaurants={handleToggleRestaurants}
          onToggleGiftShops={handleToggleGiftShops}
          selectedLanguage={selectedLanguage}
          departureTime={departureTime}
          startingPoint={startingPoint ? { lat: startingPoint.lat, lng: startingPoint.lng, type: startingPoint.type, name: startingPoint.name } : null}
          endPoint={endPoint ? { lat: endPoint.lat, lng: endPoint.lng, type: endPoint.type, name: endPoint.name } : null}
          onOpenStartEndPointDialog={() => setIsStartingPointPopoverOpen(true)}
          capturedRouteImage={capturedRouteImage}
          onClearCapturedImage={() => setCapturedRouteImage(null)}
          isSimulationMode={isSimulationMode}
          onToggleSimulation={() => setIsSimulationMode(!isSimulationMode)}
          playInBackground={simulationAudioSettings.playInBackground}
        />
      )}

      {/* Bottom Sheet - Mobile Only */}
      {isMobile && (
        <BottomSheet
          defaultTab="list"
          translations={{
            list: t('list', selectedLanguage),
            details: selectedLandmark ? getTranslatedContent(selectedLandmark, selectedLanguage, 'name') : t('map', selectedLanguage),
            settings: t('settings', selectedLanguage),
          }}
          listContent={
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-4">{t('landmarks', selectedLanguage)}</h2>
              <div className="space-y-3">
                {filteredLandmarks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t('noLandmarksFound', selectedLanguage)}
                  </p>
                ) : (
                  filteredLandmarks.map((landmark) => {
                    const distance = position
                      ? calculateDistance(position.latitude, position.longitude, landmark.lat, landmark.lng)
                      : null;
                    const isVisitedLandmark = isVisited(landmark.id);

                    return (
                      <button
                        key={landmark.id}
                        onClick={() => setSelectedLandmark(landmark)}
                        className="w-full text-left p-4 rounded-lg border bg-card hover-elevate active-elevate-2 transition-all"
                        data-testid={`landmark-item-${landmark.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${landmark.category === 'landmark'
                            ? 'bg-[hsl(14,85%,55%)]/20 text-[hsl(14,85%,55%)]'
                            : landmark.category === 'activity'
                              ? 'bg-[hsl(210,85%,55%)]/20 text-[hsl(210,85%,55%)]'
                              : landmark.category === 'restaurant'
                                ? 'bg-[hsl(25,95%,55%)]/20 text-[hsl(25,95%,55%)]'
                                : 'bg-[hsl(45,90%,55%)]/20 text-[hsl(45,90%,55%)]'
                            }`}>
                            {landmark.category === 'landmark' ? (
                              <LandmarkIcon className="w-5 h-5" />
                            ) : landmark.category === 'activity' ? (
                              <Activity className="w-5 h-5" />
                            ) : landmark.category === 'restaurant' ? (
                              <Utensils className="w-5 h-5" />
                            ) : (
                              <ShoppingBag className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">
                              {getTranslatedContent(landmark, selectedLanguage, 'name')}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {getTranslatedContent(landmark, selectedLanguage, 'description')}
                            </p>
                            {distance !== null && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {distance.toFixed(1)} km {t('away', selectedLanguage)}
                              </p>
                            )}
                            {isVisitedLandmark && (
                              <span className="inline-block mt-2 text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                ✓ {t('visited', selectedLanguage)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          }
          detailsContent={
            selectedLandmark ? (
              <div className="p-4">
                <h2 className="text-2xl font-bold mb-2">
                  {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {getTranslatedContent(selectedLandmark, selectedLanguage, 'description')}
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleLandmarkRoute(selectedLandmark)} data-testid="button-navigate-bottom-sheet">
                    Navigate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (tourStops.some(stop => stop.id === selectedLandmark.id)) {
                        setTourStops(tourStops.filter(stop => stop.id !== selectedLandmark.id));
                      } else {
                        handleAddToTour(selectedLandmark);
                      }
                    }}
                    data-testid="button-add-to-tour-bottom-sheet"
                  >
                    {tourStops.some(stop => stop.id === selectedLandmark.id) ? 'Remove from Tour' : 'Add to Tour'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Select a landmark to see details
              </div>
            )
          }
          settingsContent={
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('selectCity', selectedLanguage)}</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  data-testid="select-city-mobile"
                >
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('selectLanguage', selectedLanguage)}</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  data-testid="select-language-mobile"
                >
                  <option value="en">English</option>
                  <option value="ko">한국어</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="pt">Português</option>
                  <option value="ru">Русский</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t('audioGuide', selectedLanguage)}</label>
                  <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${audioEnabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    data-testid="toggle-audio-mobile"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${audioEnabled ? 'translate-x-5' : ''
                        }`}
                    />
                  </button>
                </div>

                {audioEnabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('speechSpeed', selectedLanguage)}: {speechRate}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value);
                        setSpeechRate(newRate);
                        audioService.setRate(newRate);
                      }}
                      className="w-full"
                      data-testid="slider-speech-rate-mobile"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h3 className="text-sm font-medium">{t('progress', selectedLanguage)}</h3>
                <p className="text-2xl font-bold">
                  {filteredLandmarks.filter(l => isVisited(l.id)).length} / {filteredLandmarks.length}
                </p>
                <p className="text-sm text-muted-foreground">{t('landmarksVisited', selectedLanguage)}</p>
              </div>
            </div>
          }
        />
      )
      }

      {/* Google Maps Direction Choice Dialog */}
      <AlertDialog open={showDirectionsDialog} onOpenChange={setShowDirectionsDialog}>
        <AlertDialogContent data-testid="dialog-directions-choice" className="z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chooseNavigationApp', selectedLanguage)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('selectHowToNavigate', selectedLanguage)}
              {pendingLandmark && (
                <span className="block mt-2 font-medium">
                  {getTranslatedContent(pendingLandmark, selectedLanguage, 'name')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => {
                setShowDirectionsDialog(false);
                setPendingLandmark(null);
                // 리스트를 다시 표시
                setForceShowCard(true);
                setTimeout(() => setForceShowCard(false), 100);
              }}
              data-testid="button-cancel-navigation"
            >
              {t('cancel', selectedLanguage)}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={useInAppNavigation}
              data-testid="button-use-in-app"
              className="bg-primary hover:bg-primary/90"
            >
              {t('useInAppMap', selectedLanguage)}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={openGoogleMaps}
              data-testid="button-use-google-maps"
              className="bg-primary hover:bg-primary/90"
            >
              {t('useGoogleMaps', selectedLanguage)}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={openWaze}
              data-testid="button-use-waze"
              className="bg-[#33ccff] hover:bg-[#33ccff]/90 text-black"
            >
              {t('useWaze', selectedLanguage)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Recommendation Dialog - Using GPT-5.1 Thinking */}
      <AIRecommendDialog
        isOpen={showAIRecommend}
        onClose={() => setShowAIRecommend(false)}
        cityId={selectedCityId}
        cityName={selectedCity?.name || ''}
        landmarks={landmarks}
        selectedLanguage={selectedLanguage}
        userPosition={position}
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

      {/* Install Prompt with Download Option */}
      <InstallPrompt
        selectedLanguage={selectedLanguage}
        onDownloadClick={(language) => {
          setAudioDownloadLanguage(language);
          setShowAudioDownloadDialog(true);
        }}
        onClose={() => {
          console.log("🎖️ [Dodari] Welcome Screen Handled. Releasing sequence lock.");
          setIsWelcomeHandled(true);
        }}
      />

      {/* Audio Download Dialog */}
      <AudioDownloadDialog
        isOpen={showAudioDownloadDialog}
        onClose={() => setShowAudioDownloadDialog(false)}
        cityId={selectedCityId}
        cityName={selectedCity?.name || ''}
        country={selectedCity?.country}
        landmarks={landmarks}
        selectedLanguage={audioDownloadLanguage}
      />

      {/* Login Dialog */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        language={selectedLanguage}
      />

      {/* Save Route Dialog */}
      <SaveRouteDialog
        open={showSaveRouteDialog}
        onOpenChange={setShowSaveRouteDialog}
        tourStops={tourStops}
        tourRouteInfo={tourRouteInfo}
        cityId={selectedCityId}
        countryCode={selectedCity?.country === 'Italy' ? 'IT' :
          selectedCity?.country === 'Philippines' ? 'PH' :
            selectedCity?.country === 'France' ? 'FR' :
              selectedCity?.country === 'Spain' ? 'ES' :
                selectedCity?.country === 'Germany' ? 'DE' :
                  selectedCity?.country === 'Japan' ? 'JP' :
                    selectedCity?.country === 'South Korea' ? 'KR' :
                      selectedCity?.country === 'China' ? 'CN' :
                        selectedCity?.country === 'United Kingdom' ? 'GB' :
                          selectedCity?.country === 'Greece' ? 'GR' :
                            selectedCity?.country === 'Thailand' ? 'TH' :
                              selectedCity?.country === 'Vietnam' ? 'VN' : 'XX'}
        selectedLanguage={selectedLanguage}
      />

      {/* [강의 노트: 크리에이터 전용 창구]
          학생 여러분, 이제 우리가 만든 대시보드를 실제 화면에 붙여봅시다.
          DialogContent 안에 CreatorDashboard 컴포넌트를 배치하여
          사용자가 버튼을 눌렀을 때만 나타나도록 설계했습니다. */}
      <Dialog open={showCreatorDashboard} onOpenChange={setShowCreatorDashboard}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <CreatorDashboard />
        </DialogContent>
      </Dialog>

      {/* [디자이너 킴의 매직 UI: 자동 랜딩 다이얼로그 - 프리미엄 시각 고도화] */}
      {/* 🎖️ [Dodari] 시퀀스 강제: 웰컴 화면 처리 완료(isWelcomeHandled) AND 스타트업 다이얼로그 없음(!showStartupDialog) 필수 */}
      <Dialog
        open={!!landingCityId && isWelcomeHandled && !showStartupDialog}
        onOpenChange={(open) => !open && setLandingCityId(null)}
      >
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-2xl scale-100 transition-transform duration-500 ease-out">
          {(() => {
            const landingCity = cities.find(c => c.id === landingCityId);
            // 🎖️ [Data Sync] DB 우선(landingCity?.landingContent), 없으면 하드코딩(LANDING_DATA) Fallback
            const landingContentSource = (landingCity as any)?.landingContent || (landingCityId ? LANDING_DATA[landingCityId] : null);

            if (!landingCityId || !landingContentSource) return null;

            const content = landingContentSource['ko'] || landingContentSource[language] || landingContentSource['en'] || Object.values(landingContentSource)[0];

            return (
              <div className="relative w-full overflow-hidden rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 transition-all animate-in fade-in zoom-in-95 duration-500">
                {/* 히로 이미지 섹션: Ken Burns 효과 적용 */}
                <div className="relative h-72 w-full overflow-hidden">
                  <img
                    src={content?.heroImage}
                    alt="City Welcome"
                    className="h-full w-full object-cover animate-ken-burns"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                  {/* 닫기 버튼: 마이크로 인터랙션 */}
                  <button
                    onClick={() => setLandingCityId(null)}
                    className="absolute top-5 right-5 p-2.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 transition-all active:scale-90"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-8 left-8 right-8 text-white text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/30 backdrop-blur-xl border border-white/30 mb-4 animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                      <MapPin className="w-4 h-4 text-primary-foreground" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">New Destination Unlocked</span>
                    </div>
                    <h2 className="text-4xl font-black mb-1 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] tracking-tight">
                      {content?.title}
                    </h2>
                  </div>
                </div>

                {/* 콘텐츠 섹션: 세련된 타이포그래피 및 버튼 글로우 */}
                <div className="p-10 text-center">
                  <p className="text-slate-600 dark:text-slate-300 mb-10 leading-relaxed font-semibold text-lg drop-shadow-sm">
                    {content?.subTitle}
                  </p>

                  <div className="flex flex-col gap-4">
                    <Button
                      className="w-full h-16 rounded-2xl text-xl font-black shadow-[0_10px_30px_rgba(var(--primary),0.3)] hover:shadow-[0_15px_40px_rgba(var(--primary),0.5)] transition-all active:scale-95 bg-primary text-primary-foreground border-t border-white/20 group relative overflow-hidden"
                      onClick={() => {
                        handleCityChange(landingCityId);
                        setLandingCityId(null);
                      }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {language === 'ko' ? '지금 낙원 탐험하기' : 'Explore Paradise Now'}
                        <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full h-12 rounded-xl text-slate-400 hover:text-primary font-bold transition-colors hover:bg-primary/5 flex items-center justify-center gap-2"
                      onClick={() => setShowQrDialog(true)}
                    >
                      <QrCode className="w-4 h-4" />
                      {language === 'ko' ? 'QR코드로 앱 설치/공유' : 'Install/Share via QR Code'}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full h-12 rounded-xl text-slate-400 hover:text-slate-600 font-bold transition-colors hover:bg-slate-100"
                      onClick={() => setLandingCityId(null)}
                    >
                      {language === 'ko' ? '천천히 둘러볼게요' : 'Maybe Later'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* [적요] QR코드 설치/공유 다이얼로그 */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <QrCode className="h-6 w-6" />
              <h2 className="text-lg font-bold">
                {selectedLanguage === 'ko' ? '앱 설치 / 공유' : 'Install / Share App'}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {selectedLanguage === 'ko'
                ? '아래 QR코드를 스캔하거나 링크를 공유하여 앱을 설치하세요'
                : 'Scan the QR code or share the link to install the app'}
            </p>
            {/* [적요] QR코드 이미지 — qrserver.com API를 활용하여 현재 URL로 QR 이미지 생성 */}
            <div className="bg-white p-4 rounded-2xl shadow-lg border">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                alt="QR Code for app install"
                className="w-48 h-48"
                loading="lazy"
              />
            </div>
            <div className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-lg max-w-full truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.origin);
                    toast({ title: selectedLanguage === 'ko' ? '복사됨!' : 'Copied!', description: selectedLanguage === 'ko' ? '링크가 클립보드에 복사되었습니다.' : 'Link copied to clipboard.' });
                  }
                }}
              >
                <Download className="h-4 w-4" />
                {selectedLanguage === 'ko' ? '링크 복사' : 'Copy Link'}
              </Button>
              <Button
                className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'GPS Tour Guide', url: window.location.origin });
                  } else {
                    navigator.clipboard?.writeText(window.location.origin);
                    toast({ title: selectedLanguage === 'ko' ? '공유됨!' : 'Shared!' });
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                {selectedLanguage === 'ko' ? '공유하기' : 'Share'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
