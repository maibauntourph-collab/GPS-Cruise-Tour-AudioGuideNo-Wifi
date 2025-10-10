import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapView } from '@/components/MapView';
import { InfoPanel } from '@/components/InfoPanel';
import { LandmarkList } from '@/components/LandmarkList';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { audioService } from '@/lib/audioService';
import { calculateDistance } from '@/lib/geoUtils';
import { Landmark } from '@shared/schema';

export default function Home() {
  const { position, error, isLoading } = useGeoLocation();
  const { data: landmarks = [], isLoading: landmarksLoading } = useQuery<Landmark[]>({
    queryKey: ['/api/landmarks'],
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
        audioService.speak(landmark.narration, landmark.id);
        setSpokenLandmarks((prev) => new Set(prev).add(landmark.id));
        setIsSpeaking(true);
      }
    });

    const checkSpeakingInterval = setInterval(() => {
      setIsSpeaking(audioService.isSpeaking());
    }, 500);

    return () => clearInterval(checkSpeakingInterval);
  }, [position, audioEnabled, landmarks]);

  const handleLandmarkRoute = (landmark: Landmark) => {
    const startPosition = position 
      ? [position.latitude, position.longitude] as [number, number]
      : [41.8902, 12.4922] as [number, number]; // Rome center as fallback

    setActiveRoute({
      start: startPosition,
      end: [landmark.lat, landmark.lng],
    });
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

  if (landmarksLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading landmarks...</p>
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
      />

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
      />
    </div>
  );
}
