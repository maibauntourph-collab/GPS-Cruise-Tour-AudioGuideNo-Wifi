import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton 
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CitySelector } from './CitySelector';
import { LanguageSelector } from './LanguageSelector';
import { ProgressStats } from './ProgressStats';
import { Volume2, VolumeX, WifiOff, Wifi, Navigation as NavIcon, AudioLines, Gauge, Route as RouteIcon, X, Trash2, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { City, Landmark } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  audioEnabled: boolean;
  onToggleAudio: () => void;
  cities: City[];
  selectedCityId: string;
  onCityChange: (cityId: string) => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  isSpeaking: boolean;
  activeRoute: any;
  onClearRoute: () => void;
  offlineMode: boolean;
  onToggleOfflineMode: () => void;
  totalLandmarks: number;
  cityName?: string;
  onTestAudio?: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  tourStops?: Landmark[];
  tourRouteInfo?: { distance: number; duration: number } | null;
  onClearTour?: () => void;
  onRemoveStop?: (stopId: string) => void;
}

export function AppSidebar({
  audioEnabled,
  onToggleAudio,
  cities,
  selectedCityId,
  onCityChange,
  selectedLanguage,
  onLanguageChange,
  isSpeaking,
  activeRoute,
  onClearRoute,
  offlineMode,
  onToggleOfflineMode,
  totalLandmarks,
  cityName,
  onTestAudio,
  speechRate,
  onSpeechRateChange,
  tourStops = [],
  tourRouteInfo = null,
  onClearTour,
  onRemoveStop
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent className="p-4 md:p-0">
        <Card className="md:border-0 md:bg-transparent md:shadow-none">
          <div className="p-4 md:p-0">
            <SidebarGroup>
              <SidebarGroupLabel>GPS Audio Guide</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-4 px-2">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">{t('city', selectedLanguage)}</Label>
                    <CitySelector 
                      cities={cities}
                      selectedCityId={selectedCityId}
                      onCityChange={onCityChange}
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">{t('language', selectedLanguage)}</Label>
                    <LanguageSelector
                      selectedLanguage={selectedLanguage}
                      onLanguageChange={onLanguageChange}
                    />
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t('audioGuide', selectedLanguage)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <Label htmlFor="audio-toggle" className="text-sm cursor-pointer">
                          {t('audioGuide', selectedLanguage)} {isSpeaking && '(Speaking...)'}
                        </Label>
                      </div>
                      <Switch 
                        id="audio-toggle"
                        checked={audioEnabled}
                        onCheckedChange={onToggleAudio}
                        data-testid="switch-audio"
                      />
                    </div>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <div className="flex items-center justify-between px-2 py-2">
                      <div className="flex items-center gap-2">
                        {offlineMode ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                        <Label htmlFor="offline-toggle" className="text-sm cursor-pointer">
                          {t('offlineMode', selectedLanguage)}
                        </Label>
                      </div>
                      <Switch 
                        id="offline-toggle"
                        checked={offlineMode}
                        onCheckedChange={onToggleOfflineMode}
                        data-testid="switch-offline"
                      />
                    </div>
                  </SidebarMenuItem>

                  {activeRoute && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={onClearRoute} data-testid="button-clear-route">
                        <NavIcon className="w-4 h-4" />
                        <span>{t('clearRoute', selectedLanguage)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {onTestAudio && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={onTestAudio} data-testid="button-test-audio">
                        <AudioLines className="w-4 h-4" />
                        <span>{t('testAudio', selectedLanguage)}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  <SidebarMenuItem>
                    <div className="space-y-2 px-2 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4" />
                          <Label className="text-sm">{t('speechSpeed', selectedLanguage)}</Label>
                        </div>
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
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t('progress', selectedLanguage)}</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <ProgressStats totalLandmarks={totalLandmarks} cityName={cityName} selectedLanguage={selectedLanguage} />
              </SidebarGroupContent>
            </SidebarGroup>

            {tourStops.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent className="px-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RouteIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{t('tourRoute', selectedLanguage)}</span>
                      </div>
                      <Badge variant="secondary" className="gap-1" data-testid="sidebar-tour-stops">
                        {tourStops.length} {t('stops', selectedLanguage)}
                      </Badge>
                    </div>
                    
                    {tourRouteInfo && tourStops.length >= 2 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="gap-1" data-testid="sidebar-tour-info">
                          {(tourRouteInfo.distance / 1000).toFixed(1)}km • {Math.ceil(tourRouteInfo.duration / 60)}min
                        </Badge>
                      </div>
                    )}

                    <div className="space-y-1">
                      {tourStops.map((stop, index) => (
                        <div 
                          key={stop.id}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover-elevate"
                          data-testid={`tour-stop-${stop.id}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground font-medium shrink-0">
                              {index + 1}
                            </span>
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            <span className="text-sm truncate">
                              {getTranslatedContent(stop, selectedLanguage, 'name')}
                            </span>
                          </div>
                          {onRemoveStop && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveStop(stop.id)}
                              className="h-6 w-6 shrink-0"
                              data-testid={`button-remove-stop-${stop.id}`}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      {onClearTour && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onClearTour}
                          className="gap-2 flex-1"
                          data-testid="button-clear-tour"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('clearTour', selectedLanguage)}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </div>
        </Card>
      </SidebarContent>
    </Sidebar>
  );
}
