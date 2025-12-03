import { useState, useEffect } from 'react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wifi, WifiOff, Download, Trash2, HardDrive, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AvailableCity {
  id: string;
  name: string;
  country: string;
  landmarkCount: number;
}

interface OfflineManagerProps {
  onClose?: () => void;
}

export function OfflineManager({ onClose }: OfflineManagerProps) {
  const {
    isOnline,
    isInitialized,
    downloadedCities,
    downloadProgress,
    downloadCity,
    deleteCity,
    getStorageInfo
  } = useOfflineMode();

  const [storageInfo, setStorageInfo] = useState({ cities: 0, landmarks: 0, total: 0 });

  const { data: availableCities = [], isLoading: loadingCities } = useQuery<AvailableCity[]>({
    queryKey: ['/api/offline-package'],
    enabled: isOnline
  });

  useEffect(() => {
    if (isInitialized) {
      getStorageInfo().then(setStorageInfo);
    }
  }, [isInitialized, downloadedCities, getStorageInfo]);

  const handleDownload = async (cityId: string) => {
    await downloadCity(cityId);
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const handleDelete = async (cityId: string) => {
    await deleteCity(cityId);
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const isDownloaded = (cityId: string) => {
    return downloadedCities.some(c => c.id === cityId);
  };

  const getDownloadedCity = (cityId: string) => {
    return downloadedCities.find(c => c.id === cityId);
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="offline-manager">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Offline Data
        </CardTitle>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <Wifi className="h-4 w-4" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <WifiOff className="h-4 w-4" />
              Offline
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground" data-testid="storage-info">
          Stored: {storageInfo.cities} cities, {storageInfo.landmarks} items
        </div>

        {!isOnline && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm text-amber-700 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            You're offline. Using downloaded data.
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-medium">Available Cities</h3>
          
          {loadingCities ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {availableCities.map((city) => {
                const downloaded = isDownloaded(city.id);
                const metadata = getDownloadedCity(city.id);
                const isDownloading = downloadProgress?.cityId === city.id && downloadProgress.status === 'downloading';
                const downloadComplete = downloadProgress?.cityId === city.id && downloadProgress.status === 'complete';
                const downloadError = downloadProgress?.cityId === city.id && downloadProgress.status === 'error';

                return (
                  <div
                    key={city.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`city-row-${city.id}`}
                  >
                    <div>
                      <div className="font-medium">{city.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {city.country} • {city.landmarkCount} items
                        {metadata && (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            (Downloaded)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDownloading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      
                      {downloadComplete && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      
                      {downloadError && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}

                      {downloaded ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(city.id)}
                          disabled={isDownloading}
                          data-testid={`delete-city-${city.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(city.id)}
                          disabled={isDownloading || !isOnline}
                          data-testid={`download-city-${city.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {downloadProgress && (
          <div className="space-y-2">
            <div className="text-sm">
              {downloadProgress.status === 'downloading' && 'Downloading...'}
              {downloadProgress.status === 'complete' && downloadProgress.message}
              {downloadProgress.status === 'error' && `Error: ${downloadProgress.message}`}
            </div>
            {downloadProgress.status === 'downloading' && (
              <Progress value={undefined} className="h-2" />
            )}
          </div>
        )}

        {downloadedCities.length > 0 && (
          <div className="pt-2 border-t">
            <h3 className="text-sm font-medium mb-2">Downloaded Data</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              {downloadedCities.map((city) => (
                <div key={city.id} className="flex justify-between">
                  <span>{city.name}</span>
                  <span>v{city.version} • {city.landmarkCount} items</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
