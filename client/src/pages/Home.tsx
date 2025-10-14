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
import { BottomSheet } from '@/components/BottomSheet';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { audioService } from '@/lib/audioService';
import { calculateDistance } from '@/lib/geoUtils';
import { getTranslatedContent, t } from '@/lib/translations';
import { detectDeviceCapabilities, getMaxMarkersToRender, shouldReduceAnimations } from '@/lib/deviceDetection';
import { Landmark, City } from '@shared/schema';
import { Landmark as LandmarkIcon, Activity, Ship, Utensils, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { open: sidebarOpen, openMobile: sidebarOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const { position, error, isLoading } = useGeoLocation();
  const [selectedCityId, setSelectedCityId] = useState<string>('rome');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [offlineMode, setOfflineMode] = useState(false);
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

  // Handler for toggle with scroll to first item
  const handleToggleLandmarks = () => {
    const newState = !showLandmarks;
    setShowLandmarks(newState);
    
    // If turning on, focus on first landmark
    if (newState) {
      const firstLandmark = landmarks.find(l => 
        l.category !== 'Activity' && 
        l.category !== 'Restaurant' && 
        l.category !== 'Gift Shop' && 
        l.category !== 'Shop'
      );
      if (firstLandmark) {
        setFocusLocation({ lat: firstLandmark.lat, lng: firstLandmark.lng, zoom: 16 });
        setTimeout(() => setFocusLocation(null), 1000);
      }
    }
  };

  const handleToggleActivities = () => {
    const newState = !showActivities;
    setShowActivities(newState);
    
    // If turning on, focus on first activity
    if (newState) {
      const firstActivity = landmarks.find(l => l.category === 'Activity');
      if (firstActivity) {
        setFocusLocation({ lat: firstActivity.lat, lng: firstActivity.lng, zoom: 16 });
        setTimeout(() => setFocusLocation(null), 1000);
      }
    }
  };

  const handleToggleRestaurants = () => {
    const newState = !showRestaurants;
    setShowRestaurants(newState);
    
    // If turning on, focus on first restaurant
    if (newState) {
      const firstRestaurant = landmarks.find(l => l.category === 'Restaurant');
      if (firstRestaurant) {
        setFocusLocation({ lat: firstRestaurant.lat, lng: firstRestaurant.lng, zoom: 16 });
        setTimeout(() => setFocusLocation(null), 1000);
      }
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
        <header className="flex items-center gap-1 sm:gap-2 p-2 border-b bg-background z-[1001]">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
          <h1 
            className="font-serif font-semibold text-base sm:text-lg cursor-pointer hover-elevate active-elevate-2 px-2 py-1 rounded-md transition-colors truncate" 
            onClick={toggleSidebar}
            data-testid="h1-title-toggle-sidebar"
          >
            <span className="hidden xs:inline">GPS Audio Guide</span>
            <span className="xs:hidden">GPS Guide</span>
          </h1>
          
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <Button
              variant={showLandmarks ? "default" : "outline"}
              size="icon"
              onClick={handleToggleLandmarks}
              data-testid="button-toggle-landmarks"
              className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1 ${showLandmarks ? '!bg-[hsl(14,85%,55%)] hover:!bg-[hsl(14,85%,50%)] !border-[hsl(14,85%,55%)] text-white' : ''}`}
              title={t('landmarks', selectedLanguage)}
            >
              <LandmarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('landmarks', selectedLanguage)}</span>
            </Button>
            <Button
              variant={showActivities ? "default" : "outline"}
              size="icon"
              onClick={handleToggleActivities}
              data-testid="button-toggle-activities"
              className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1 ${showActivities ? '!bg-[hsl(210,85%,55%)] hover:!bg-[hsl(210,85%,50%)] !border-[hsl(210,85%,55%)] text-white' : ''}`}
              title={t('activities', selectedLanguage)}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">{t('activities', selectedLanguage)}</span>
            </Button>
            <Button
              variant={showRestaurants ? "default" : "outline"}
              size="icon"
              onClick={handleToggleRestaurants}
              data-testid="button-toggle-restaurants"
              className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1 ${showRestaurants ? '!bg-[hsl(25,95%,55%)] hover:!bg-[hsl(25,95%,50%)] !border-[hsl(25,95%,55%)] text-white' : ''}`}
              title={t('restaurants', selectedLanguage)}
            >
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">{t('restaurants', selectedLanguage)}</span>
            </Button>
            <Button
              variant={showGiftShops ? "default" : "outline"}
              size="icon"
              onClick={() => setShowGiftShops(!showGiftShops)}
              data-testid="button-toggle-giftshops"
              className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1 ${showGiftShops ? '!bg-[hsl(45,90%,55%)] hover:!bg-[hsl(45,90%,50%)] !border-[hsl(45,90%,55%)] text-white' : ''}`}
              title={t('giftShops', selectedLanguage)}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t('giftShops', selectedLanguage)}</span>
            </Button>
            {selectedCity?.cruisePort && (
              <Button
                variant={showCruisePort ? "default" : "outline"}
                size="icon"
                onClick={() => setShowCruisePort(!showCruisePort)}
                data-testid="button-toggle-cruise-port"
                className={`h-8 w-8 sm:h-9 sm:w-auto sm:px-3 sm:gap-1 ${showCruisePort ? '!bg-[hsl(200,15%,55%)] hover:!bg-[hsl(200,15%,50%)] !border-[hsl(200,15%,55%)] text-white' : ''}`}
                title={t('cruisePortInfo', selectedLanguage)}
              >
                <Ship className="w-4 h-4" />
                <span className="hidden sm:inline">{t('cruisePortInfo', selectedLanguage)}</span>
              </Button>
            )}
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
              isCompact={!!selectedLandmark && !isMobile}
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

      {/* Unified Floating Card - Desktop only */}
      {!isMobile && !(isMobile && sidebarOpenMobile) && (
        <UnifiedFloatingCard
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
          onMapMarkerClick={handleMapMarkerClick}
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
