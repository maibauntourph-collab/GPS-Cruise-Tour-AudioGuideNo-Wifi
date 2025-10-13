import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { SidebarTrigger, SidebarInset, useSidebar } from '@/components/ui/sidebar';
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
import { MapView } from '@/components/MapView';
import { UnifiedFloatingCard } from '@/components/UnifiedFloatingCard';
import { AppSidebar } from '@/components/AppSidebar';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { audioService } from '@/lib/audioService';
import { calculateDistance } from '@/lib/geoUtils';
import { getTranslatedContent, t } from '@/lib/translations';
import { Landmark, City } from '@shared/schema';
import { Landmark as LandmarkIcon, Activity, Ship, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { open: sidebarOpen, toggleSidebar } = useSidebar();
  const { position, error, isLoading } = useGeoLocation();
  const [selectedCityId, setSelectedCityId] = useState<string>('rome');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [offlineMode, setOfflineMode] = useState(false);
  const { markVisited, isVisited } = useVisitedLandmarks();
  useServiceWorker();
  
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
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showActivities, setShowActivities] = useState(true);
  const [showRestaurants, setShowRestaurants] = useState(true);
  const [showCruisePort, setShowCruisePort] = useState(true);
  const [keepCruisePortVisible, setKeepCruisePortVisible] = useState(false);
  const [tourStops, setTourStops] = useState<Landmark[]>([]);
  const [tourRouteInfo, setTourRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
  const cruisePortTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioService.setEnabled(audioEnabled);
  }, [audioEnabled]);

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
    
    window.open(googleMapsUrl, '_blank');
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

  const handleAddToTour = (landmark: Landmark) => {
    // Check if landmark is already in tour
    if (tourStops.some(stop => stop.id === landmark.id)) {
      // Remove from tour if already added
      setTourStops(tourStops.filter(stop => stop.id !== landmark.id));
    } else {
      // Add to tour
      setTourStops([...tourStops, landmark]);
    }
  };

  const handleClearTour = () => {
    setTourStops([]);
    setTourRouteInfo(null);
  };

  const handleTourRouteFound = (route: any) => {
    if (route && route.summary) {
      setTourRouteInfo({
        distance: route.summary.totalDistance,
        duration: route.summary.totalTime
      });
    }
  };

  // Filter landmarks based on category
  const filteredLandmarks = landmarks.filter(landmark => {
    const isActivity = landmark.category === 'Activity';
    const isRestaurant = landmark.category === 'Restaurant';
    if (isActivity) return showActivities;
    if (isRestaurant) return showRestaurants;
    return showLandmarks;
  });

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
      <AppSidebar
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        cities={cities}
        selectedCityId={selectedCityId}
        onCityChange={handleCityChange}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        isSpeaking={isSpeaking}
        activeRoute={activeRoute}
        onClearRoute={handleClearRoute}
        offlineMode={offlineMode}
        onToggleOfflineMode={handleToggleOfflineMode}
        totalLandmarks={landmarks.length}
        cityName={selectedCity?.name}
        onTestAudio={handleTestAudio}
        speechRate={speechRate}
        onSpeechRateChange={handleSpeechRateChange}
        tourStops={tourStops}
        tourRouteInfo={tourRouteInfo}
        onRemoveTourStop={(landmarkId) => setTourStops(tourStops.filter(stop => stop.id !== landmarkId))}
        onClearTour={handleClearTour}
      />
      
      <SidebarInset className="flex w-full flex-1 flex-col">
        <header className="flex items-center gap-2 p-2 border-b bg-background z-[1001]">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <h1 
            className="font-serif font-semibold text-lg cursor-pointer hover-elevate active-elevate-2 px-2 py-1 rounded-md transition-colors" 
            onClick={toggleSidebar}
            data-testid="h1-title-toggle-sidebar"
          >
            GPS Audio Guide
          </h1>
          
          <div className="ml-auto flex items-center gap-1 flex-wrap">
            <Button
              variant={showLandmarks ? "default" : "outline"}
              size="sm"
              onClick={() => setShowLandmarks(!showLandmarks)}
              data-testid="button-toggle-landmarks"
              className="gap-1"
            >
              <LandmarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('landmarks', selectedLanguage)}</span>
            </Button>
            <Button
              variant={showActivities ? "default" : "outline"}
              size="sm"
              onClick={() => setShowActivities(!showActivities)}
              data-testid="button-toggle-activities"
              className={`gap-1 ${showActivities ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">{t('activities', selectedLanguage)}</span>
            </Button>
            <Button
              variant={showRestaurants ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRestaurants(!showRestaurants)}
              data-testid="button-toggle-restaurants"
              className={`gap-1 ${showRestaurants ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
            >
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">{t('restaurants', selectedLanguage)}</span>
            </Button>
            {selectedCity?.cruisePort && (
              <Button
                variant={showCruisePort ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCruisePort(!showCruisePort)}
                data-testid="button-toggle-cruise-port"
                className={`gap-1 ${showCruisePort ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
              >
                <Ship className="w-4 h-4" />
                <span className="hidden sm:inline">{t('cruisePortInfo', selectedLanguage)}</span>
              </Button>
            )}
          </div>
        </header>
        
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {/* Map Section - shrinks when landmark is selected or sidebar is open */}
          <div className={`relative ${selectedLandmark ? 'h-1/2' : 'flex-1'} transition-all duration-300`}>
            <MapView
              landmarks={filteredLandmarks}
              userPosition={position}
              onLandmarkRoute={handleLandmarkRoute}
              activeRoute={activeRoute}
              onRouteFound={setRouteInfo}
              cityCenter={selectedCity ? [selectedCity.lat, selectedCity.lng] : undefined}
              cityZoom={selectedCity?.zoom}
              selectedLanguage={selectedLanguage}
              isCompact={!!selectedLandmark}
              sidebarOpen={sidebarOpen}
              focusLocation={focusLocation}
              tourStops={tourStops}
              onAddToTour={handleAddToTour}
              onTourRouteFound={handleTourRouteFound}
            />

            <OfflineIndicator />
            <InstallPrompt />
          </div>
        </div>
      </SidebarInset>

      {/* Unified Floating Card - combines Landmark Panel, Cruise Port Info, and Landmark List */}
      <UnifiedFloatingCard
        selectedLandmark={selectedLandmark}
        onLandmarkClose={() => setSelectedLandmark(null)}
        onNavigate={handleLandmarkRoute}
        onAddToTour={handleAddToTour}
        isInTour={selectedLandmark ? tourStops.some(stop => stop.id === selectedLandmark.id) : false}
        city={selectedCity || null}
        showCruisePort={showCruisePort}
        onCruisePortClose={() => setShowCruisePort(false)}
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
        onToggleLandmarks={() => setShowLandmarks(!showLandmarks)}
        onToggleActivities={() => setShowActivities(!showActivities)}
        onToggleRestaurants={() => setShowRestaurants(!showRestaurants)}
        selectedLanguage={selectedLanguage}
        onMapMarkerClick={handleMapMarkerClick}
      />

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
          <AlertDialogFooter>
            <AlertDialogCancel onClick={useInAppNavigation} data-testid="button-use-in-app">
              {t('useInAppMap', selectedLanguage)}
            </AlertDialogCancel>
            <AlertDialogAction onClick={openGoogleMaps} data-testid="button-use-google-maps">
              {t('useGoogleMaps', selectedLanguage)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
