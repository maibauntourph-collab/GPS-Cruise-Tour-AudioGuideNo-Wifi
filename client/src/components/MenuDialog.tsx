import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  TrendingUp,
  Clock,
  Plus,
  Minus,
  Mic,
  Headphones,
  User,
  Users
} from 'lucide-react';
import { CitySelector } from './CitySelector';
import { LanguageSelector } from './LanguageSelector';
import { ProgressStats } from './ProgressStats';
import OfflineDataDialog from './OfflineDataDialog';
import { City, Landmark } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';
import { useState, useEffect } from 'react';
import { TTS_VOICES, VoiceId, getVoiceForLanguage, getSavedVoice, saveVoice } from '@/lib/voiceSettings';

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
  tourTimePerStop: number;
  onTourTimePerStopChange: (time: number) => void;
  
  // Offline Data
  onDownloadData: (password: string) => Promise<void>;
  onUploadData: (file: File, password: string) => Promise<void>;
  
  // Voice selection
  selectedVoice?: VoiceId;
  onVoiceChange?: (voice: VoiceId) => void;
  
  // MP3 Audio Download
  onOpenAudioDownload?: () => void;
}

export default function MenuDialog({
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
  tourTimePerStop,
  onTourTimePerStopChange,
  onDownloadData,
  onUploadData,
  selectedVoice,
  onVoiceChange,
  onOpenAudioDownload
}: MenuDialogProps) {
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [offlineMode2, setOfflineMode2] = useState<'download' | 'upload'>('download');
  
  const [currentVoice, setCurrentVoice] = useState<VoiceId>(() => {
    return getSavedVoice() || getVoiceForLanguage(selectedLanguage);
  });

  useEffect(() => {
    if (selectedVoice) {
      setCurrentVoice(selectedVoice);
    }
  }, [selectedVoice]);

  const handleVoiceChange = (voiceId: VoiceId) => {
    setCurrentVoice(voiceId);
    saveVoice(voiceId);
    onVoiceChange?.(voiceId);
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return <User className="w-3 h-3" />;
      case 'female': return <User className="w-3 h-3 text-pink-500" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 overflow-hidden" data-testid="dialog-menu">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings className="w-4 h-4" />
              {t('settings', selectedLanguage)}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-9 px-4 pt-2">
              <TabsTrigger value="general" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                General
              </TabsTrigger>
              <TabsTrigger value="audio" className="text-xs">
                <Volume2 className="w-3 h-3 mr-1" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="tour" className="text-xs">
                <Route className="w-3 h-3 mr-1" />
                Tour
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
              <TabsContent value="general" className="space-y-3 p-4 mt-0">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('selectCity', selectedLanguage)}</Label>
                  <CitySelector
                    cities={cities}
                    selectedCityId={selectedCityId}
                    onCityChange={onCityChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">{t('language', selectedLanguage)}</Label>
                  <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={onLanguageChange}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">{t('offlineMode', selectedLanguage)}</Label>
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
                      className="text-xs h-8"
                    >
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOfflineMode2('upload');
                        setShowOfflineDialog(true);
                      }}
                      data-testid="button-upload-data"
                      className="text-xs h-8"
                    >
                      Upload
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-xs font-medium">{t('progress', selectedLanguage)}</Label>
                  <ProgressStats 
                    totalLandmarks={totalLandmarks} 
                    cityName={cityName} 
                    selectedLanguage={selectedLanguage} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="audio" className="space-y-3 p-4 mt-0">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t('audioNarration', selectedLanguage)}</Label>
                  <Switch checked={audioEnabled} onCheckedChange={onToggleAudio} data-testid="switch-audio" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">{t('speechSpeed', selectedLanguage)}</Label>
                    <span className="text-xs text-muted-foreground" data-testid="text-speech-rate">
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
                    className="w-full text-xs h-8"
                    onClick={onTestAudio}
                    data-testid="button-test-audio"
                  >
                    <AudioLines className="w-3 h-3 mr-2" />
                    {t('testAudio', selectedLanguage)}
                  </Button>
                )}

                {activeRoute && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-xs font-medium">{t('activeNavigation', selectedLanguage)}</Label>
                    <Button
                      variant="outline"
                      className="w-full text-xs h-8"
                      onClick={onClearRoute}
                      data-testid="button-clear-route"
                    >
                      <X className="w-3 h-3 mr-2" />
                      {t('clearRoute', selectedLanguage)}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tour" className="space-y-3 p-4 mt-0">
                {tourStops.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    {t('noTourStops', selectedLanguage) || 'No tour stops added yet'}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">{t('tourRoute', selectedLanguage)}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearTour}
                        data-testid="button-clear-tour"
                        className="h-6 px-2 text-xs"
                      >
                        Clear All
                      </Button>
                    </div>

                    {/* Time per stop adjustment */}
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30 border">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs">
                          {selectedLanguage === 'ko' ? '장소당 관광시간' : 'Time per stop'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onTourTimePerStopChange(Math.max(15, tourTimePerStop - 15))}
                          className="h-6 w-6"
                          data-testid="button-time-decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-medium w-12 text-center">
                          {tourTimePerStop}{selectedLanguage === 'ko' ? '분' : 'min'}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onTourTimePerStopChange(Math.min(120, tourTimePerStop + 15))}
                          className="h-6 w-6"
                          data-testid="button-time-increase"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Tour summary badges */}
                    <div className="flex flex-wrap gap-2">
                      {tourRouteInfo && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Route className="w-3 h-3" />
                          {(tourRouteInfo.distance / 1000).toFixed(1)}km
                        </Badge>
                      )}
                      {tourRouteInfo && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <NavIcon className="w-3 h-3" />
                          {Math.ceil(tourRouteInfo.duration / 60)}{selectedLanguage === 'ko' ? '분 이동' : 'min travel'}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const visitTime = tourStops.length * tourTimePerStop;
                          const travelTime = tourRouteInfo ? Math.ceil(tourRouteInfo.duration / 60) : 0;
                          const totalMinutes = visitTime + travelTime;
                          const hours = Math.floor(totalMinutes / 60);
                          const mins = totalMinutes % 60;
                          if (selectedLanguage === 'ko') {
                            return hours > 0 ? `총 ${hours}시간 ${mins}분` : `총 ${mins}분`;
                          }
                          return hours > 0 ? `Total ${hours}h ${mins}m` : `Total ${mins}min`;
                        })()}
                      </Badge>
                    </div>

                    <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                      {tourStops.map((landmark, index) => (
                        <div key={landmark.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 group hover-elevate">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: landmark.category === 'Activity' ? 'hsl(195, 85%, 50%)' : 'hsl(14, 85%, 55%)' }} />
                            <span className="text-xs truncate">
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
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
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
