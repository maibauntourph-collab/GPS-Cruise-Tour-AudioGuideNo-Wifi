import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapView } from '@/components/MapView';
import { InfoPanel } from '@/components/InfoPanel';
import { LandmarkList } from '@/components/LandmarkList';
import { CitySelector } from '@/components/CitySelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ProgressStats } from '@/components/ProgressStats';
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
        
        // Mark landmark as visited when within radius
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

  const nearestLandmark = position && landmarks.length > 0
    ? landmarks.map((landmark) => ({
        landmark,
        distance: calculateDistance(
          position.latitude,
          position.longitude,
          landmark.lat,
          landmark.lng
        ),
      })).sort((a, b) => a.distance - b.distance)[0]
    : null;

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
    <div className="relative h-screen w-full">
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

      <div className="absolute top-4 right-4 z-[1000] space-y-3">
        <div className="bg-background/90 backdrop-blur-md border-2 rounded-lg p-3 shadow-xl space-y-3">
          <CitySelector
            cities={cities}
            selectedCityId={selectedCityId}
            onCityChange={handleCityChange}
          />
          <div className="border-t pt-3">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </div>
        
        <ProgressStats 
          totalLandmarks={landmarks.length}
          cityName={selectedCity?.name}
        />
      </div>

      <InfoPanel
        userPosition={position}
        isLoadingPosition={isLoading}
        positionError={error}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onClearRoute={handleClearRoute}
        hasActiveRoute={activeRoute !== null}
        nearestLandmark={nearestLandmark}
        isSpeaking={isSpeaking}
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
  );
}
