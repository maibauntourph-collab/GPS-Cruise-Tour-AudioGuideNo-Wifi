import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, History, Route, Clock, Navigation, Loader2, Sparkles, Shield, User, Store } from 'lucide-react';
import InstallPrompt from '@/components/InstallPrompt';
import { getSavedTourData, SavedTourData } from '@/components/StartupDialog';
import { t } from '@/lib/translations';

/**
 * [학습 가이드: 역할 및 시작 모드 선택 페이지]
 * 앱이 처음 실행될 때 사용자가 어떤 방식으로 여정을 시작할지 결정하는 '관문'입니다.
 * 
 * 학습 포인트:
 * 1. navigator.geolocation: 브라우저의 전역 객체를 이용해 GPS 사용 가능 여부를 미리 체크합니다.
 * 2. localStorage: 사용자가 선택한 시작 언어와 모드를 브라우저에 저장하여 다음 접속 시 기억하게 합니다.
 * 3. 기획적 유연성: 'GPS 기반', '수동 복원', '둘러보기' 등 다양한 진입 경로를 제공하는 설계입니다.
 */
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
    // [적요: 이전 데이터 복원] 기존에 진행 중이던 투어 데이터가 있는지 확인합니다.
    const saved = getSavedTourData();
    setSavedTourData(saved);
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
    // Check permission and availability on click
    if (!('geolocation' in navigator)) {
      alert(t('gpsUnavailable', selectedLanguage));
      return;
    }

    setIsGpsLoading(true);

    // Explicitly request position with timeout
    navigator.geolocation.getCurrentPosition(
      () => {
        // Success
        setIsGpsLoading(false);
        setIsGpsAvailable(true);
        localStorage.setItem('startup-mode', 'gps');
        setLocation('/home');
      },
      (err) => {
        // Error
        setIsGpsLoading(false);
        setIsGpsAvailable(false);
        console.warn('GPS Error:', err);
        // Still allow entry, but notify (optional)
        // Or prompt to manually select city
        if (confirm(`${t('gpsUnavailable', selectedLanguage)}\n${t('selectCityManually', selectedLanguage)}?`)) {
          handleSkip();
        }
      },
      { timeout: 8000, enableHighAccuracy: false } // Increased timeout slightly
    );
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
              className="w-full p-4 rounded-lg border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group bg-white dark:bg-slate-800 relative overflow-hidden"
              data-testid="button-start-gps"
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">
                    {t('startFromGPS', selectedLanguage)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isGpsLoading ? t('gpsSearch', selectedLanguage) : t('startFromGPSDesc', selectedLanguage) || "Detect current location"}
                  </p>

                  {isGpsLoading && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {t('checking', selectedLanguage)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Progress bar effect when loading */}
              {isGpsLoading && (
                <div className="absolute bottom-0 left-0 h-1 bg-primary/30 w-full animate-pulse">
                  <div className="h-full bg-primary w-1/3 animate-[loading_1s_ease-in-out_infinite]" />
                </div>
              )}
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

          {/* 개발자용 빠른 역할 전환 섹션 */}
          <div className="mt-12 pt-8 border-t border-primary/10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Avengers Dev Quick Login
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/api/auth/dev-login/shop_owner"
                className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group"
              >
                <Store className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-100">코다리부장</span>
              </a>
              <a
                href="/api/auth/dev-login/admin"
                className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors group"
              >
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">마스터어드민</span>
              </a>
              <a
                href="/api/auth/dev-login/creator"
                className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">크리에이터</span>
              </a>
              <div
                className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800/50 opacity-60 cursor-not-allowed group"
                title="문지기 부장이 카카오톡, 왓츠앱, 토스 등 통합 로그인 연동을 준비 중입니다!"
              >
                <div className="w-4 h-4 flex items-center justify-center text-gray-500">💬</div>
                <span className="text-[10px] font-medium text-gray-500">통합로그인(준비중)</span>
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-4 italic">
              "문지기 부장: 카카오, 왓츠앱, X, 구글, 네이버, 토스 등 모든 문을 열기 위해 공사 중입니다!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
