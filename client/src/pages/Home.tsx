import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
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
import MapView from '@/components/MapView';
import UnifiedFloatingCard from '@/components/UnifiedFloatingCard';
import MenuDialog from '@/components/MenuDialog';
import OfflineIndicator from '@/components/OfflineIndicator';
import InstallPrompt from '@/components/InstallPrompt';
import BottomSheet from '@/components/BottomSheet';
import StartupDialog, { getSavedTourData, saveTourData, clearSavedTourData } from '@/components/StartupDialog';
import { encryptData, decryptData, downloadEncryptedData, readEncryptedFile } from '@/lib/offlineDataEncryption';
import { useToast } from '@/hooks/use-toast';
import { Menu } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { audioService } from '@/lib/audioService';
import { calculateDistance } from '@/lib/geoUtils';
import { getTranslatedContent, t } from '@/lib/translations';
import { detectDeviceCapabilities, getMaxMarkersToRender, shouldReduceAnimations } from '@/lib/deviceDetection';
import { Landmark, City } from '@shared/schema';
import { Landmark as LandmarkIcon, Activity, Ship, Utensils, ShoppingBag, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Detect browser language and map to supported language
const detectBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Supported languages
  const supportedLanguages = ['en', 'ko', 'es', 'fr', 'de', 'it', 'zh', 'ja', 'pt', 'ru'];
  
  const detectedLang = supportedLanguages.includes(langCode) ? langCode : 'en';
  
  console.log('🌐 Browser language detection:', {
    browserLang,
    langCode,
    detectedLang,
    supportedLanguages
  });
  
  // Return matched language or default to English
  return detectedLang;
};

export default function Home() {
  const { position, error, isLoading } = useGeoLocation();
  const [selectedCityId, setSelectedCityId] = useState<string>('rome');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    // Check localStorage first, then browser language
    const savedLanguage = localStorage.getItem('selected-language');
    const finalLanguage = savedLanguage || detectBrowserLanguage();
    
    console.log('📝 Language initialization:', {
      savedLanguage,
      finalLanguage,
      source: savedLanguage ? 'localStorage' : 'browser detection'
    });
    
    return finalLanguage;
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  const { markVisited, isVisited } = useVisitedLandmarks();
  useServiceWorker();
  
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
  const [speechRate, setSpeechRate] = useState<number>(audioService.getCurrentRate());
  const [showDirectionsDialog, setShowDirectionsDialog] = useState(false);
  const [pendingLandmark, setPendingLandmark] = useState<Landmark | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  // Single category selection: 'all', 'landmarks', 'activities', 'restaurants', 'giftshops', 'cruiseport'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // Derived show states from selectedCategory
  const showLandmarks = selectedCategory === 'all' || selectedCategory === 'landmarks';
  const showActivities = selectedCategory === 'all' || selectedCategory === 'activities';
  const showRestaurants = selectedCategory === 'all' || selectedCategory === 'restaurants';
  const showGiftShops = selectedCategory === 'all' || selectedCategory === 'giftshops';
  const showCruisePort = selectedCategory === 'all' || selectedCategory === 'cruiseport';
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
  const [showMenu, setShowMenu] = useState(false);
  const [forceShowCard, setForceShowCard] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    itinerary: Array<{ landmarkId: string; order: number }>;
    explanation: string;
    totalEstimatedTime: number;
  } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const cruisePortTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  // Startup dialog state
  const [showStartupDialog, setShowStartupDialog] = useState<boolean>(() => {
    // Show dialog only if not shown in this session
    const shownThisSession = sessionStorage.getItem('startup-dialog-shown');
    return !shownThisSession;
  });
  const [savedTourData, setSavedTourData] = useState(() => getSavedTourData());

  useEffect(() => {
    audioService.setEnabled(audioEnabled);
  }, [audioEnabled]);

  // Save selected language to localStorage
  useEffect(() => {
    localStorage.setItem('selected-language', selectedLanguage);
  }, [selectedLanguage]);

  // Save tour time per stop to localStorage
  useEffect(() => {
    localStorage.setItem('tour-time-per-stop', tourTimePerStop.toString());
  }, [tourTimePerStop]);

  // Save tour data when it changes (for restoration on next visit)
  useEffect(() => {
    const city = cities.find(c => c.id === selectedCityId);
    if (tourStops.length > 0 && city) {
      saveTourData(selectedCityId, city.name, tourStops, tourTimePerStop, selectedLanguage);
    }
  }, [tourStops, selectedCityId, cities, tourTimePerStop, selectedLanguage]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (tourStops.length < 2) {
      setTourRouteInfo(null);
    }
  }, [tourStops]);

  useEffect(() => {
    if (!position || !audioEnabled || !landmarks.length) return;

    landmarks.forEach((landmark) => {
      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        landmark.lat,
        landmark.lng
      );

      if (distance < landmark.radius && !audioService.isLandmarkSpoken(landmark.id)) {
        const narration = getTranslatedContent(landmark, selectedLanguage, 'narration');
        audioService.speak(narration, landmark.id, selectedLanguage);
        setSpokenLandmarks((prev) => new Set(prev).add(landmark.id));
        setIsSpeaking(true);
        
        if (!isVisited(landmark.id)) {
          markVisited(landmark.id);
        }
      }
    });

    const checkSpeakingInterval = setInterval(() => {
      setIsSpeaking(audioService.isSpeaking());
    }, 500);

    return () => clearInterval(checkSpeakingInterval);
  }, [position, audioEnabled, landmarks, selectedLanguage]);

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
    
    setShowDirectionsDialog(false);
    setPendingLandmark(null);
  };
  
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    setSelectedLandmark(null);
    setActiveRoute(null);
    audioService.reset();
    setSpokenLandmarks(new Set());
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

  const handleToggleOfflineMode = () => {
    setOfflineMode((prev) => !prev);
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
    const testMessages = {
      en: "Welcome to GPS Audio Guide. This is a test of the audio narration system.",
      it: "Benvenuti alla Guida Audio GPS. Questo è un test del sistema di narrazione audio.",
      ko: "GPS 오디오 가이드에 오신 것을 환영합니다. 이것은 오디오 해설 시스템의 테스트입니다."
    };
    const message = testMessages[selectedLanguage as keyof typeof testMessages] || testMessages.en;
    
    if (audioEnabled) {
      // Remove test-audio id so it can be played again
      audioService.removeLandmark('test-audio');
      audioService.speak(message, 'test-audio', selectedLanguage);
    }
  };

  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
    audioService.setRate(rate);
  };

  const handleMapMarkerClick = (lat: number, lng: number) => {
    setFocusLocation({ lat, lng, zoom: 17 });
    // Clear focus after animation completes
    setTimeout(() => setFocusLocation(null), 1000);
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

  const handleAddToTour = (landmark: Landmark) => {
    // Check if landmark is already in tour
    if (tourStops.some(stop => stop.id === landmark.id)) {
      // Remove from tour if already added
      setTourStops(tourStops.filter(stop => stop.id !== landmark.id));
    } else {
      // Add to tour
      setTourStops([...tourStops, landmark]);
      
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

  const handleClearTour = () => {
    setTourStops([]);
    setTourRouteInfo(null);
    clearSavedTourData();
  };

  // Startup dialog handlers
  const handleStartupClose = () => {
    setShowStartupDialog(false);
    sessionStorage.setItem('startup-dialog-shown', 'true');
  };

  const handleSelectGPS = () => {
    handleStartupClose();
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
      setFocusLocation({ lat: position.latitude, lng: position.longitude, zoom: 15 });
      
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
          
          // Focus on first stop
          const firstStop = restoredStops[0];
          setFocusLocation({ lat: firstStop.lat, lng: firstStop.lng, zoom: 14 });
          
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
      if (route.legs && route.legs.length > 0 && tourStops.length >= 2) {
        for (let i = 0; i < route.legs.length && i < tourStops.length - 1; i++) {
          const leg = route.legs[i];
          segments.push({
            from: getTranslatedContent(tourStops[i], selectedLanguage, 'name'),
            to: getTranslatedContent(tourStops[i + 1], selectedLanguage, 'name'),
            distance: leg.summary?.totalDistance || leg.distance || 0,
            duration: leg.summary?.totalTime || leg.duration || 0
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

  const handleTourRouteClick = () => {
    // Tour route info is already displayed in AppSidebar and UnifiedFloatingCard
    // No state change needed - just maintain current state
    // This prevents any UI flicker or unwanted changes
  };

  const handleAiRecommendation = async () => {
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/ai/recommend-tour', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityId: selectedCityId,
          language: selectedLanguage,
          userPosition: position ? {
            latitude: position.latitude,
            longitude: position.longitude
          } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to get AI recommendation' }));
        throw new Error(errorData.error || 'Failed to get AI recommendation');
      }

      const recommendation = await response.json();
      setAiRecommendation(recommendation);

      // Apply recommended itinerary to tour
      const recommendedLandmarks = recommendation.itinerary
        .sort((a: any, b: any) => a.order - b.order)
        .map((item: any) => landmarks.find(l => l.id === item.landmarkId))
        .filter((l: any) => l !== undefined);

      // Check if all landmarks were resolved
      if (recommendedLandmarks.length !== recommendation.itinerary.length) {
        const missingCount = recommendation.itinerary.length - recommendedLandmarks.length;
        console.warn(`${missingCount} recommended landmarks were not found in the current landmark list`);
        
        const warningMessage = selectedLanguage === 'ko'
          ? `AI 추천 중 ${missingCount}개 장소를 찾을 수 없습니다. ${recommendedLandmarks.length}개 장소만 추가되었습니다.`
          : `Could not find ${missingCount} recommended locations. Only ${recommendedLandmarks.length} added.`;
        
        toast({
          description: warningMessage,
          variant: 'destructive',
          duration: 4000,
        });
      }

      if (recommendedLandmarks.length === 0) {
        throw new Error('No valid landmarks in recommendation');
      }

      setTourStops(recommendedLandmarks);

      const message = selectedLanguage === 'ko' 
        ? `AI 추천 일정 ${recommendedLandmarks.length}개 장소가 투어에 추가되었습니다`
        : selectedLanguage === 'es'
        ? `${recommendedLandmarks.length} lugares recomendados por IA añadidos al tour`
        : selectedLanguage === 'fr'
        ? `${recommendedLandmarks.length} lieux recommandés par IA ajoutés au tour`
        : selectedLanguage === 'de'
        ? `${recommendedLandmarks.length} KI-empfohlene Orte zur Tour hinzugefügt`
        : selectedLanguage === 'it'
        ? `${recommendedLandmarks.length} luoghi consigliati dall'IA aggiunti al tour`
        : selectedLanguage === 'zh'
        ? `${recommendedLandmarks.length}个AI推荐地点已添加到旅程`
        : selectedLanguage === 'ja'
        ? `${recommendedLandmarks.length}個のAI推奨地点がツアーに追加されました`
        : selectedLanguage === 'pt'
        ? `${recommendedLandmarks.length} locais recomendados por IA adicionados ao tour`
        : selectedLanguage === 'ru'
        ? `${recommendedLandmarks.length} мест, рекомендованных ИИ, добавлено в тур`
        : `${recommendedLandmarks.length} AI recommended locations added to tour`;

      toast({
        description: message,
        duration: 3000,
      });
    } catch (error: any) {
      console.error('AI recommendation error:', error);
      
      let errorMessage: string;
      
      // Check if it's a quota error or rate limit error
      const errorText = error.message || JSON.stringify(error);
      if (errorText.includes('quota') || errorText.includes('rate limit') || errorText.includes('429')) {
        errorMessage = selectedLanguage === 'ko'
          ? 'AI 서비스 한도에 도달했습니다. 나중에 다시 시도해주세요.'
          : selectedLanguage === 'es'
          ? 'Límite del servicio de IA alcanzado. Inténtelo más tarde.'
          : selectedLanguage === 'fr'
          ? 'Limite du service IA atteinte. Réessayez plus tard.'
          : selectedLanguage === 'de'
          ? 'KI-Dienstlimit erreicht. Versuchen Sie es später erneut.'
          : selectedLanguage === 'it'
          ? 'Limite del servizio IA raggiunto. Riprova più tardi.'
          : selectedLanguage === 'zh'
          ? 'AI服务已达限额。请稍后重试。'
          : selectedLanguage === 'ja'
          ? 'AIサービスの制限に達しました。後でもう一度お試しください。'
          : selectedLanguage === 'pt'
          ? 'Limite do serviço de IA atingido. Tente novamente mais tarde.'
          : selectedLanguage === 'ru'
          ? 'Достигнут лимит сервиса ИИ. Попробуйте позже.'
          : 'AI service limit reached. Please try again later.';
      } else {
        errorMessage = selectedLanguage === 'ko'
          ? 'AI 추천을 가져오는데 실패했습니다'
          : 'Failed to get AI recommendation';
      }
      
      toast({
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Handler for category selection change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    // Focus on first item of selected category
    if (category !== 'all' && category !== 'cruiseport') {
      let firstItem: Landmark | undefined;
      
      if (category === 'landmarks') {
        firstItem = landmarks.find(l => 
          l.category !== 'Activity' && 
          l.category !== 'Restaurant' && 
          l.category !== 'Gift Shop' && 
          l.category !== 'Shop'
        );
      } else if (category === 'activities') {
        firstItem = landmarks.find(l => l.category === 'Activity');
      } else if (category === 'restaurants') {
        firstItem = landmarks.find(l => l.category === 'Restaurant');
      } else if (category === 'giftshops') {
        firstItem = landmarks.find(l => l.category === 'Gift Shop' || l.category === 'Shop');
      }
      
      if (firstItem) {
        setFocusLocation({ lat: firstItem.lat, lng: firstItem.lng, zoom: 16 });
        setTimeout(() => setFocusLocation(null), 1000);
      }
    } else if (category === 'cruiseport' && selectedCity?.cruisePort) {
      setFocusLocation({ 
        lat: selectedCity.cruisePort.lat, 
        lng: selectedCity.cruisePort.lng, 
        zoom: 15 
      });
      setTimeout(() => setFocusLocation(null), 1000);
    }
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

  if (citiesLoading || landmarksLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
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
        totalLandmarks={landmarks.length}
        cityName={selectedCity?.name}
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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowMenu(true)}
            data-testid="button-menu-toggle" 
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 
            className="font-serif font-semibold text-base sm:text-lg cursor-pointer hover-elevate active-elevate-2 px-2 py-0.5 rounded-md transition-colors truncate" 
            onClick={() => setShowMenu(true)}
            data-testid="h1-title-toggle-menu"
          >
            <span className="hidden xs:inline">GPS Audio Guide</span>
            <span className="xs:hidden">GPS Guide</span>
          </h1>
          
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleAiRecommendation}
              disabled={isLoadingAi}
              data-testid="button-ai-recommend"
              className="h-7 w-7 sm:h-8 sm:w-auto sm:px-2.5 sm:gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
              title={selectedLanguage === 'ko' ? 'AI 추천 일정' : 'AI Recommend'}
            >
              {isLoadingAi ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="hidden sm:inline text-xs">
                    {selectedLanguage === 'ko' ? 'AI 추천' : 'AI'}
                  </span>
                </>
              )}
            </Button>
            
            {/* Category Selection Menu */}
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger 
                className="h-8 w-auto min-w-[120px] sm:min-w-[140px] text-xs gap-1"
                data-testid="select-category"
              >
                <div className="flex items-center gap-1.5">
                  {selectedCategory === 'all' && <LandmarkIcon className="w-3.5 h-3.5" />}
                  {selectedCategory === 'landmarks' && <LandmarkIcon className="w-3.5 h-3.5 text-[hsl(14,85%,55%)]" />}
                  {selectedCategory === 'activities' && <Activity className="w-3.5 h-3.5 text-[hsl(210,85%,55%)]" />}
                  {selectedCategory === 'restaurants' && <Utensils className="w-3.5 h-3.5 text-[hsl(25,95%,55%)]" />}
                  {selectedCategory === 'giftshops' && <ShoppingBag className="w-3.5 h-3.5 text-[hsl(45,90%,55%)]" />}
                  {selectedCategory === 'cruiseport' && <Ship className="w-3.5 h-3.5 text-[hsl(200,15%,55%)]" />}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <LandmarkIcon className="w-4 h-4" />
                    <span>{selectedLanguage === 'ko' ? '전체 보기' : 'All'}</span>
                  </div>
                </SelectItem>
                <SelectItem value="landmarks">
                  <div className="flex items-center gap-2">
                    <LandmarkIcon className="w-4 h-4 text-[hsl(14,85%,55%)]" />
                    <span>{t('landmarks', selectedLanguage)}</span>
                  </div>
                </SelectItem>
                <SelectItem value="activities">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[hsl(210,85%,55%)]" />
                    <span>{t('activities', selectedLanguage)}</span>
                  </div>
                </SelectItem>
                <SelectItem value="restaurants">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[hsl(25,95%,55%)]" />
                    <span>{t('restaurants', selectedLanguage)}</span>
                  </div>
                </SelectItem>
                <SelectItem value="giftshops">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[hsl(45,90%,55%)]" />
                    <span>{t('giftShops', selectedLanguage)}</span>
                  </div>
                </SelectItem>
                {selectedCity?.cruisePort && (
                  <SelectItem value="cruiseport">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-[hsl(200,15%,55%)]" />
                      <span>{t('cruisePortInfo', selectedLanguage)}</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </header>
        
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Map Section - always show, full screen on mobile */}
          <div className={`relative ${!isMobile && selectedLandmark ? 'h-1/2' : 'flex-1'} transition-all duration-300`}>
            <MapView
              landmarks={filteredLandmarks}
              userPosition={position}
              onLandmarkRoute={handleLandmarkRoute}
              activeRoute={activeRoute}
              onRouteFound={setRouteInfo}
              cityCenter={selectedCity ? [selectedCity.lat, selectedCity.lng] : undefined}
              cityZoom={selectedCity?.zoom}
              selectedLanguage={selectedLanguage}
              isCompact={false}
              sidebarOpen={false}
              focusLocation={focusLocation}
              tourStops={tourStops}
              onAddToTour={handleAddToTour}
              onTourRouteFound={handleTourRouteFound}
              onTourRouteClick={handleTourRouteClick}
            />

            <OfflineIndicator />
            <InstallPrompt />
          </div>
        </div>
      </div>

      {/* Unified Floating Card */}
      <UnifiedFloatingCard
          forceShowList={forceShowCard}
          selectedLandmark={selectedLandmark}
          onLandmarkClose={() => setSelectedLandmark(null)}
          onNavigate={handleLandmarkRoute}
          onAddToTour={handleAddToTour}
          isInTour={selectedLandmark ? tourStops.some(stop => stop.id === selectedLandmark.id) : false}
          city={selectedCity || null}
          showCruisePort={showCruisePort}
          onCruisePortClose={() => setShowCruisePort(false)}
          tourStops={tourStops}
          tourRouteInfo={tourRouteInfo}
          onRemoveTourStop={(landmarkId) => setTourStops(tourStops.filter(stop => stop.id !== landmarkId))}
          tourTimePerStop={tourTimePerStop}
          aiRecommendation={aiRecommendation}
          onLandmarkClick={(landmarkId) => {
            const landmark = filteredLandmarks.find(l => l.id === landmarkId);
            if (landmark) {
              // Clear any existing timeout
              if (cruisePortTimeoutRef.current) {
                clearTimeout(cruisePortTimeoutRef.current);
              }
              
              // Use flushSync to immediately update state before rendering
              flushSync(() => {
                setKeepCruisePortVisible(true);
              });
              
              // Now set selected landmark
              setSelectedLandmark(landmark);
              
              // Start the 2-second countdown
              cruisePortTimeoutRef.current = setTimeout(() => {
                setKeepCruisePortVisible(false);
                cruisePortTimeoutRef.current = null;
              }, 2000);
            }
          }}
          landmarks={filteredLandmarks}
          userPosition={position}
          onLandmarkRoute={handleLandmarkRoute}
          spokenLandmarks={spokenLandmarks}
          onLandmarkSelect={setSelectedLandmark}
          showLandmarks={showLandmarks}
          showActivities={showActivities}
          showRestaurants={showRestaurants}
          showGiftShops={showGiftShops}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedLanguage={selectedLanguage}
          onMapMarkerClick={handleMapMarkerClick}
        />

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
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            landmark.category === 'landmark' 
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
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      audioEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                    data-testid="toggle-audio-mobile"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        audioEnabled ? 'translate-x-5' : ''
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
      )}

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
    </>
  );
}
