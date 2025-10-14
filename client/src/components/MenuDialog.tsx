import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  VolumeX, 
  WifiOff, 
  Wifi, 
  Navigation as NavIcon, 
  Route,
  X,
  MapPin,
  Settings,
  AudioLines,
  Gauge,
  Globe,
  MapPinned,
  TrendingUp
} from 'lucide-react';
import { CitySelector } from './CitySelector';
import { LanguageSelector } from './LanguageSelector';
import { ProgressStats } from './ProgressStats';
import { OfflineDataDialog } from './OfflineDataDialog';
import { City, Landmark } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';
import { useState } from 'react';

interface MenuDialogProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Audio
  audioEnabled: boolean;
  onToggleAudio: () => void;
  isSpeaking: boolean;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  onTestAudio?: () => void;
  
  // City & Language
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  
  // Navigation
  activeRoute: any;
  onClearRoute: () => void;
  
  // Offline
  offlineMode: boolean;
  onToggleOfflineMode: () => void;
  
  // Progress
  totalLandmarks: number;
  cityName?: string;
  
  // Tour
  tourStops: Landmark[];
  tourRouteInfo: { 
    distance: number; 
    duration: number;
    segments?: Array<{ from: string; to: string; distance: number; duration: number }>;
  } | null;
  onRemoveTourStop: (landmarkId: string) => void;
  onClearTour: () => void;
  
  // Offline Data
  onDownloadData: (password: string) => Promise<void>;
  onUploadData: (file: File, password: string) => Promise<void>;
}

export function MenuDialog({
  isOpen,
  onClose,
  audioEnabled,
  onToggleAudio,
  isSpeaking,
  speechRate,
  onSpeechRateChange,
  onTestAudio,
  cities,
  selectedCityId,
  onCityChange,
  selectedLanguage,
  onLanguageChange,
  activeRoute,
  onClearRoute,
  offlineMode,
  onToggleOfflineMode,
  totalLandmarks,
  cityName,
  tourStops,
  tourRouteInfo,
  onRemoveTourStop,
  onClearTour,
  onDownloadData,
  onUploadData
}: MenuDialogProps) {
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineMode2, setOfflineMode2] = useState<'download' | 'upload'>('download');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-menu">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('settings', selectedLanguage)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* City Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <MapPinned className="w-4 h-4" />
                {t('selectCity', selectedLanguage)}
              </Label>
              <CitySelector
                cities={cities}
                selectedCityId={selectedCityId}
                onCityChange={onCityChange}
              />
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4" />
                {t('language', selectedLanguage)}
              </Label>
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={onLanguageChange}
              />
            </div>

            {/* Audio Controls */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {t('audioNarration', selectedLanguage)}
                  {isSpeaking && (
                    <Badge variant="secondary" className="ml-2">
                      {t('speaking', selectedLanguage)}
                    </Badge>
                  )}
                </Label>
                <Switch checked={audioEnabled} onCheckedChange={onToggleAudio} data-testid="switch-audio" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Gauge className="w-4 h-4" />
                    {t('speechSpeed', selectedLanguage)}
                  </Label>
                  <span className="text-sm text-muted-foreground" data-testid="text-speech-rate">
                    {speechRate.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={[speechRate]}
                  onValueChange={(values) => onSpeechRateChange(values[0])}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                  data-testid="slider-speech-rate"
                />
              </div>

              {onTestAudio && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={onTestAudio}
                  data-testid="button-test-audio"
                >
                  <AudioLines className="w-4 h-4" />
                  {t('testAudio', selectedLanguage)}
                </Button>
              )}
            </div>

            {/* Offline Mode */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  {offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                  {t('offlineMode', selectedLanguage)}
                </Label>
                <Switch checked={offlineMode} onCheckedChange={onToggleOfflineMode} data-testid="switch-offline" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOfflineMode2('download');
                    setShowOfflineDialog(true);
                  }}
                  data-testid="button-download-data"
                >
                  {t('downloadOfflineData', selectedLanguage)}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOfflineMode2('upload');
                    setShowOfflineDialog(true);
                  }}
                  data-testid="button-upload-data"
                >
                  {t('uploadOfflineData', selectedLanguage)}
                </Button>
              </div>
            </div>

            {/* Active Navigation */}
            {activeRoute && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="flex items-center gap-2 text-sm">
                  <NavIcon className="w-4 h-4" />
                  {t('activeNavigation', selectedLanguage)}
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={onClearRoute}
                  data-testid="button-clear-route"
                >
                  <X className="w-4 h-4" />
                  {t('clearRoute', selectedLanguage)}
                </Button>
              </div>
            )}

            {/* Progress */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                {t('progress', selectedLanguage)}
              </Label>
              <ProgressStats 
                totalLandmarks={totalLandmarks} 
                cityName={cityName} 
                selectedLanguage={selectedLanguage} 
              />
            </div>

            {/* Tour Route */}
            {tourStops.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Route className="w-4 h-4" />
                    {t('tourRoute', selectedLanguage)}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearTour}
                    data-testid="button-clear-tour"
                    className="h-6 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {tourRouteInfo && (
                  <div className="flex gap-2 mb-2">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <span>{(tourRouteInfo.distance / 1000).toFixed(1)}km</span>
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <span>{Math.ceil(tourRouteInfo.duration / 60)}min</span>
                    </Badge>
                  </div>
                )}

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tourStops.map((landmark, index) => (
                    <div key={landmark.id}>
                      <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 group hover-elevate">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: landmark.category === 'Activity' ? 'hsl(195, 85%, 50%)' : 'hsl(14, 85%, 55%)' }} />
                          <span className="text-sm truncate">
                            {getTranslatedContent(landmark, selectedLanguage, 'name')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveTourStop(landmark.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-tour-${landmark.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <OfflineDataDialog
        isOpen={showOfflineDialog}
        onClose={() => setShowOfflineDialog(false)}
        mode={offlineMode2}
        onDownload={onDownloadData}
        onUpload={onUploadData}
        selectedLanguage={selectedLanguage}
      />
    </>
  );
}
