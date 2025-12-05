import { useState, useEffect, useRef, useCallback } from 'react';
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
import MapView from '@/components/MapView';
import UnifiedFloatingCard from '@/components/UnifiedFloatingCard';
import MenuDialog from '@/components/MenuDialog';
import OfflineIndicator from '@/components/OfflineIndicator';
import InstallPrompt from '@/components/InstallPrompt';
import UpdatePrompt from '@/components/UpdatePrompt';
import BottomSheet from '@/components/BottomSheet';
import StartupDialog, { getSavedTourData, saveTourData, clearSavedTourData } from '@/components/StartupDialog';
import AIRecommendDialog from '@/components/AIRecommendDialog';
import AudioDownloadDialog from '@/components/AudioDownloadDialog';
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
import { Landmark as LandmarkIcon, Activity, Ship, Utensils, ShoppingBag, MapPin, Plane, Hotel, Navigation2, List, Search, Loader2, Flag, Circle, Clock, Route, Camera } from 'lucide-react';
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
import { ChevronDown } from 'lucide-react';

export default function Home() {
  const { position, error, isLoading } = useGeoLocation();
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
  const [speechRate, setSpeechRate] = useState<number>(audioService.getCurrentRate());
  const [showDirectionsDialog, setShowDirectionsDialog] = useState(false);
  const [pendingLandmark, setPendingLandmark] = useState<Landmark | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showGiftShops, setShowGiftShops] = useState(true);
  const [showCruisePort, setShowCruisePort] = useState(true);
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
  const [showMenu, setShowMenu] = useState(false);
  const [forceShowCard, setForceShowCard] = useState(false);
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const [showAIRecommend, setShowAIRecommend] = useState(false);
  const [capturedRouteImage, setCapturedRouteImage] = useState<string | null>(null);
  const [isCapturingRoute, setIsCapturingRoute] = useState(false);
  const [showTourOnly, setShowTourOnly] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [aiRecommendation, setAiRecommendation] = useState<{
    itinerary: Array<{ landmarkId: string; order: number }>;
    explanation: string;
    totalEstimatedTime: number;
  } | null>(null);
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

  // Save individual tour stop durations to localStorage
  useEffect(() => {
    localStorage.setItem('tour-stop-durations', JSON.stringify(tourStopDurations));
  }, [tourStopDurations]);

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
                      {selectedLanguage === 'ko' ? '설정 완료!' : 'Setup Complete!'}
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
                      {selectedLanguage === 'ko' ? '완료' : 'Done'}
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
                      {selectedLanguage === 'ko' ? '초기화' : 'Reset'}
                    </Button>
                  </div>
                </div>
              )}
              
              <Tabs defaultValue="start" value={pointSelectionMode} onValueChange={(v) => setPointSelectionMode(v as 'start' | 'end' | 'time')}>
                <TabsList className="grid w-full grid-cols-3 mb-2 sticky top-0 z-10 bg-popover">
                  <TabsTrigger value="start" className="gap-1 px-2" data-testid="tab-start-point">
                    <Circle className={`w-3 h-3 ${startingPoint ? 'fill-green-500 text-green-500' : ''}`} />
                    <span className="text-xs">{selectedLanguage === 'ko' ? '출발지' : 'Start'}</span>
                    {startingPoint && <span className="text-[10px] text-green-500">✓</span>}
                  </TabsTrigger>
                  <TabsTrigger value="end" className="gap-1 px-2" data-testid="tab-end-point">
                    <Flag className={`w-3 h-3 ${endPoint ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="text-xs">{selectedLanguage === 'ko' ? '도착지' : 'End'}</span>
                    {endPoint && <span className="text-[10px] text-red-500">✓</span>}
                  </TabsTrigger>
                  <TabsTrigger value="time" className="gap-1 px-2" data-testid="tab-departure-time">
                    <Clock className={`w-3 h-3 ${departureTime ? 'text-amber-500' : ''}`} />
                    <span className="text-xs">{selectedLanguage === 'ko' ? '시간' : 'Time'}</span>
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
                      placeholder={selectedLanguage === 'ko' ? '호텔, 주소 검색...' : 'Search hotel, address...'}
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
                            setStartingPoint({
                              id: `search_${index}`,
                              type: 'hotel',
                              name: result.name,
                              lat: result.lat,
                              lng: result.lng
                            });
                            setLocationSearchQuery('');
                            setLocationSearchResults([]);
                            toast({
                              title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
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
                          title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
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
                                title: selectedLanguage === 'ko' ? '출발지 선택' : 'Select Start Point',
                                description: selectedLanguage === 'ko' ? '지도에서 위치를 탭하세요' : 'Tap on map to set location'
                              });
                            }}
                            data-testid="button-starting-hotel-map"
                          >
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-xs">{selectedLanguage === 'ko' ? '지도에서 선택' : 'Select on map'}</span>
                          </Button>
                          
                          {/* Hotel List */}
                          {hotels.length > 0 && (
                            <>
                              <div className="text-[10px] text-muted-foreground px-2 pt-1">
                                {selectedLanguage === 'ko' ? '추천 호텔' : 'Recommended Hotels'}
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
                                      title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
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
                                    title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
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
                                    title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
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
                              {selectedLanguage === 'ko' ? '기차역' : 'Train Station'}
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
                                    title: selectedLanguage === 'ko' ? '출발지 설정됨' : 'Start point set',
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
                          title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
                          description: selectedLanguage === 'ko' ? '출발지와 동일' : 'Same as start point'
                        });
                      }}
                      data-testid="button-end-same-as-start"
                    >
                      <Circle className="w-4 h-4 text-green-500" />
                      {selectedLanguage === 'ko' ? '출발지와 동일' : 'Same as start'}
                    </Button>
                  )}
                  
                  {/* Location Search */}
                  <div className="flex gap-1">
                    <Input
                      placeholder={selectedLanguage === 'ko' ? '호텔, 주소 검색...' : 'Search hotel, address...'}
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
                        {selectedLanguage === 'ko' ? '검색 결과' : 'Search Results'}
                      </p>
                      {locationSearchResults.map((result, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-auto py-1.5"
                          onClick={() => {
                            setEndPoint({
                              id: `end_search_${index}`,
                              type: 'hotel',
                              name: result.name,
                              lat: result.lat,
                              lng: result.lng
                            });
                            setLocationSearchQuery('');
                            setLocationSearchResults([]);
                            toast({
                              title: selectedLanguage === 'ko' ? '도착지 설정됨' : 'End point set',
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
                  onClick={() => setShowGiftShops(!showGiftShops)}
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
              userPosition={position}
              onLandmarkRoute={handleLandmarkRoute}
              activeRoute={activeRoute}
              onRouteFound={setRouteInfo}
              cityCenter={selectedCity ? [selectedCity.lat, selectedCity.lng] : undefined}
              cityZoom={selectedCity?.zoom}
              selectedLanguage={selectedLanguage}
              isCompact={false}
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
                      className={`h-[30px] w-[30px] border-2 rounded-sm shadow-md ${
                        showTourOnly 
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
            <InstallPrompt selectedLanguage={selectedLanguage} />
            <UpdatePrompt 
              isVisible={showUpdatePrompt}
              onUpdate={() => {
                updateServiceWorker();
                setShowUpdatePrompt(false);
              }}
              onDismiss={() => setShowUpdatePrompt(false)}
              selectedLanguage={selectedLanguage}
            />
          </div>
        </div>
      </div>

      {/* Unified Floating Card */}
      <UnifiedFloatingCard
          forceShowList={forceShowCard}
          isCardMinimized={isCardMinimized}
          onToggleMinimized={() => setIsCardMinimized(!isCardMinimized)}
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
          onToggleLandmarks={handleToggleLandmarks}
          onToggleActivities={handleToggleActivities}
          onToggleRestaurants={handleToggleRestaurants}
          onToggleGiftShops={() => setShowGiftShops(!showGiftShops)}
          selectedLanguage={selectedLanguage}
          departureTime={departureTime}
          startingPoint={startingPoint ? { lat: startingPoint.lat, lng: startingPoint.lng, type: startingPoint.type, name: startingPoint.name } : null}
          endPoint={endPoint ? { lat: endPoint.lat, lng: endPoint.lng, type: endPoint.type, name: endPoint.name } : null}
          onOpenStartEndPointDialog={() => {
            toast({
              title: selectedLanguage === 'ko' ? '출발/도착 설정 필요' : 'Start/End Point Required',
              description: selectedLanguage === 'ko' 
                ? '사이드바에서 출발지와 도착지를 먼저 설정해주세요' 
                : 'Please set your start and end points in the sidebar first',
              variant: 'destructive'
            });
          }}
          capturedRouteImage={capturedRouteImage}
          onClearCapturedImage={() => setCapturedRouteImage(null)}
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
    </>
  );
}
