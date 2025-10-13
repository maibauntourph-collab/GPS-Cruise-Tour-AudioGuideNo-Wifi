import { useState, useEffect } from 'react';
import { GpsPosition } from '@shared/schema';

export function useGeoLocation() {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    // Try to get initial position first with lower accuracy for faster response
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
        setIsLoading(false);
      },
      () => {
        // Ignore initial error, watchPosition will handle it
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 30000,
      }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, error, isLoading };
}
