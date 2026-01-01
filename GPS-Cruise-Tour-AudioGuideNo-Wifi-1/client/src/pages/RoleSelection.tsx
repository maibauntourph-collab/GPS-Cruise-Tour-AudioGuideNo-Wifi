import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, History, Route, Clock, Navigation, Loader2 } from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';
import { getSavedTourData, SavedTourData } from '@/components/StartupDialog';
import { t } from '@/lib/translations';

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const [savedTourData, setSavedTourData] = useState<SavedTourData | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isGpsAvailable, setIsGpsAvailable] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('selected-language');
    return saved || 'ko';
  });

  useEffect(() => {
    const saved = getSavedTourData();
    setSavedTourData(saved);

    if ('geolocation' in navigator) {
      setIsGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsGpsAvailable(true);
          setIsGpsLoading(false);
        },
        () => {
          setIsGpsAvailable(false);
          setIsGpsLoading(false);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffHours < 1) {
        return t('justNow', selectedLanguage);
      } else if (diffHours < 24) {
        return `${diffHours}${t('hoursAgo', selectedLanguage)}`;
      } else if (diffDays < 7) {
        return `${diffDays}${t('daysAgo', selectedLanguage)}`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  const handleStartFromGPS = () => {
    localStorage.setItem('startup-mode', 'gps');
    setLocation('/home');
  };

  const handleRestoreTour = () => {
    if (savedTourData) {
      localStorage.setItem('startup-mode', 'restore');
      localStorage.setItem('restore-city-id', savedTourData.cityId);
    }
    setLocation('/home');
  };

  const handleSkip = () => {
    localStorage.setItem('startup-mode', 'skip');
    setLocation('/home');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Navigation className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('gpsAudioGuide', selectedLanguage)}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('chooseStartMethod', selectedLanguage)}
            </p>
          </div>

          <InstallPrompt selectedLanguage={selectedLanguage} />

          <div className="space-y-4 mt-8">
            <button
              onClick={handleStartFromGPS}
              disabled={isGpsLoading}
              className="w-full p-4 rounded-lg border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group bg-white dark:bg-slate-800"
              data-testid="button-start-gps"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">
                    {t('startFromGPS', selectedLanguage)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isGpsLoading
                      ? t('gettingGPS', selectedLanguage)
                      : isGpsAvailable
                        ? t('gpsSearch', selectedLanguage)
                        : t('gpsUnavailable', selectedLanguage)
                    }
                  </p>
                  {isGpsLoading && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {t('checking', selectedLanguage)}
                      </span>
                    </div>
                  )}
                  {isGpsAvailable && !isGpsLoading && (
                    <Badge variant="secondary" className="mt-2 gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {t('gpsAvailable', selectedLanguage)}
                    </Badge>
                  )}
                </div>
              </div>
            </button>

            {savedTourData && savedTourData.tourStops.length > 0 && (
              <button
                onClick={handleRestoreTour}
                className="w-full p-4 rounded-lg border-2 border-orange-200 dark:border-orange-800/50 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left group bg-white dark:bg-slate-800"
                data-testid="button-restore-tour"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('continuePreviousTour', selectedLanguage)}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {formatDate(savedTourData.savedAt)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {savedTourData.cityName}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Route className="w-3 h-3" />
                        {savedTourData.tourStops.length} {t('stopsCount', selectedLanguage)}
                      </Badge>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {savedTourData.tourTimePerStop}{t('minPerStop', selectedLanguage)}
                      </Badge>
                    </div>
                    {savedTourData.tourStopNames && savedTourData.tourStopNames.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {savedTourData.tourStopNames.slice(0, 3).join(' → ')}
                        {savedTourData.tourStopNames.length > 3 && ` +${savedTourData.tourStopNames.length - 3}`}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              data-testid="button-skip-startup"
            >
              {t('selectCityManually', selectedLanguage)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
