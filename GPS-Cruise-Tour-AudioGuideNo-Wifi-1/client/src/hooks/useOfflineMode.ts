import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, type OfflinePackage, type CityMetadata } from '@/lib/offlineStorage';
import type { City, Landmark } from '@shared/schema';

interface DownloadProgress {
  cityId: string;
  status: 'downloading' | 'complete' | 'error';
  message?: string;
}

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloadedCities, setDownloadedCities] = useState<CityMetadata[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Network status: Online');
      setIsOnline(true);
      syncQueuedVisits();
    };

    const handleOffline = () => {
      console.log('Network status: Offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    offlineStorage.init().then(() => {
      setIsInitialized(true);
      loadDownloadedCities();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDownloadedCities = async () => {
    try {
      const cities = await offlineStorage.getAllCitiesMetadata();
      setDownloadedCities(cities);
    } catch (error) {
      console.error('Failed to load downloaded cities:', error);
    }
  };

  const downloadCity = useCallback(async (cityId: string): Promise<boolean> => {
    setDownloadProgress({ cityId, status: 'downloading', message: 'Downloading...' });

    try {
      const existingMetadata = await offlineStorage.getCityMetadata(cityId);
      const headers: HeadersInit = {};

      if (existingMetadata?.etag) {
        headers['If-None-Match'] = existingMetadata.etag;
      }

      const response = await fetch(`/api/offline-package/${cityId}`, { headers });

      if (response.status === 304) {
        setDownloadProgress({ cityId, status: 'complete', message: 'Already up to date' });
        setTimeout(() => setDownloadProgress(null), 2000);
        return true;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const packageData: OfflinePackage = await response.json();
      const etag = response.headers.get('ETag') || undefined;

      await offlineStorage.saveOfflinePackage(packageData, etag);

      setDownloadProgress({ cityId, status: 'complete', message: `Downloaded ${packageData.landmarks.length} items` });
      await loadDownloadedCities();

      setTimeout(() => setDownloadProgress(null), 2000);
      return true;
    } catch (error: any) {
      console.error('Download failed:', error);

      let message = 'Download failed';
      if (error.message === 'STORAGE_QUOTA_EXCEEDED') {
        message = 'STORAGE_QUOTA_EXCEEDED';
      } else if (error instanceof Error) {
        message = error.message;
      }

      setDownloadProgress({
        cityId,
        status: 'error',
        message: message
      });
      setTimeout(() => setDownloadProgress(null), 3000);
      return false;
    }
  }, [loadDownloadedCities]);

  const deleteCity = useCallback(async (cityId: string): Promise<void> => {
    await offlineStorage.deleteCityData(cityId);
    await loadDownloadedCities();
  }, []);

  const isCityDownloaded = useCallback(async (cityId: string): Promise<boolean> => {
    return offlineStorage.isCityDownloaded(cityId);
  }, []);

  const getCities = useCallback(async (): Promise<City[]> => {
    if (isOnline) {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('Online fetch failed, falling back to offline:', error);
      }
    }
    return offlineStorage.getAllCities();
  }, [isOnline]);

  const getCity = useCallback(async (cityId: string): Promise<City | null> => {
    if (isOnline) {
      try {
        const response = await fetch(`/api/cities/${cityId}`);
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('Online fetch failed, falling back to offline:', error);
      }
    }
    return offlineStorage.getCity(cityId);
  }, [isOnline]);

  const getLandmarks = useCallback(async (cityId?: string): Promise<Landmark[]> => {
    if (isOnline) {
      try {
        const url = cityId ? `/api/landmarks?cityId=${cityId}` : '/api/landmarks';
        const response = await fetch(url);
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('Online fetch failed, falling back to offline:', error);
      }
    }
    return offlineStorage.getLandmarks(cityId);
  }, [isOnline]);

  const getLandmark = useCallback(async (id: string): Promise<Landmark | null> => {
    if (isOnline) {
      try {
        const response = await fetch(`/api/landmarks/${id}`);
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('Online fetch failed, falling back to offline:', error);
      }
    }
    return offlineStorage.getLandmark(id);
  }, [isOnline]);

  const markVisited = useCallback(async (landmarkId: string, sessionId?: string): Promise<void> => {
    if (isOnline) {
      try {
        const response = await fetch('/api/visited', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarkId, sessionId })
        });
        if (response.ok) return;
      } catch (error) {
        console.warn('Online post failed, queueing for later:', error);
      }
    }
    await offlineStorage.queueVisitedLandmark(landmarkId, sessionId);
  }, [isOnline]);

  const syncQueuedVisits = useCallback(async (): Promise<void> => {
    if (!isOnline) return;

    try {
      const unsynced = await offlineStorage.getUnsynkedVisits();

      for (const visit of unsynced) {
        try {
          const response = await fetch('/api/visited', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              landmarkId: visit.landmarkId,
              sessionId: visit.sessionId
            })
          });

          if (response.ok) {
            await offlineStorage.markVisitSynced(visit.id);
          }
        } catch (error) {
          console.warn('Failed to sync visit:', visit.id, error);
        }
      }

      await offlineStorage.clearSyncedVisits();
      console.log('Synced queued visits');
    } catch (error) {
      console.error('Failed to sync queued visits:', error);
    }
  }, [isOnline]);

  const getStorageInfo = useCallback(async () => {
    return offlineStorage.getStorageSize();
  }, []);

  const clearAllOfflineData = useCallback(async (): Promise<void> => {
    await offlineStorage.clearAll();
    setDownloadedCities([]);
  }, []);

  return {
    isOnline,
    isInitialized,
    downloadedCities,
    downloadProgress,
    downloadCity,
    deleteCity,
    isCityDownloaded,
    getCities,
    getCity,
    getLandmarks,
    getLandmark,
    markVisited,
    syncQueuedVisits,
    getStorageInfo,
    clearAllOfflineData
  };
}
