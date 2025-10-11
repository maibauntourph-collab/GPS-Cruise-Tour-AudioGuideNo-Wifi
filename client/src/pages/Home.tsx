import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { MapView } from '@/components/MapView';
import { LandmarkList } from '@/components/LandmarkList';
import { AppSidebar } from '@/components/AppSidebar';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useVisitedLandmarks } from '@/hooks/useVisitedLandmarks';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { audioService } from '@/lib/audioService';
import { calculateDistance } from '@/lib/geoUtils';
import { getTranslatedContent } from '@/lib/translations';
import { Landmark, City } from '@shared/schema';

export default function Home() {
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

  useEffect(() => {
    audioService.setEnabled(audioEnabled);
  }, [audioEnabled]);

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
    const startPosition = position 
      ? [position.latitude, position.longitude] as [number, number]
      : selectedCity 
        ? [selectedCity.lat, selectedCity.lng] as [number, number]
        : [41.8902, 12.4922] as [number, number];

    setActiveRoute({
      start: startPosition,
      end: [landmark.lat, landmark.lng],
    });
  };
  
  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
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
      />
      
      <SidebarInset className="flex w-full flex-1 flex-col">
        <header className="flex items-center gap-2 p-2 border-b bg-background z-[1001]">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <h1 className="font-serif font-semibold text-lg">GPS Audio Guide</h1>
        </header>
        
        <div className="relative flex-1 overflow-hidden">
          <MapView
            landmarks={landmarks}
            userPosition={position}
            onLandmarkRoute={handleLandmarkRoute}
            activeRoute={activeRoute}
            onRouteFound={setRouteInfo}
            cityCenter={selectedCity ? [selectedCity.lat, selectedCity.lng] : undefined}
            cityZoom={selectedCity?.zoom}
            selectedLanguage={selectedLanguage}
          />

          <LandmarkList
            landmarks={landmarks}
            userPosition={position}
            onLandmarkRoute={handleLandmarkRoute}
            spokenLandmarks={spokenLandmarks}
            selectedLanguage={selectedLanguage}
          />

          <OfflineIndicator />
          <InstallPrompt />
        </div>
      </SidebarInset>
    </>
  );
}
