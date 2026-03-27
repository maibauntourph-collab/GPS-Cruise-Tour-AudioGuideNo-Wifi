import { Link } from "wouter";
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
import { CitySelector } from './CitySelector';
import { LanguageSelector } from './LanguageSelector';
import { ProgressStats } from './ProgressStats';
import { Volume2, VolumeX, WifiOff, Wifi, Navigation as NavIcon, Route, X, MapPin, Settings, Heart, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { City, Landmark } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';

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
  landmarks?: Landmark[];
  onLandmarkClick?: (landmark: Landmark) => void;
  searchedLocations?: Array<{ id: string; name: string; lat: number; lng: number }>;
  onSearchedLocationClick?: (location: { id: string; name: string; lat: number; lng: number }) => void;
  tourStops: Landmark[];
  tourRouteInfo: {
    distance: number;
    duration: number;
    segments?: Array<{ from: string; to: string; distance: number; duration: number }>;
  } | null;
  onRemoveTourStop: (landmarkId: string) => void;
  onClearTour: () => void;
  onOpenSettings: () => void;
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
  landmarks,
  onLandmarkClick,
  searchedLocations,
  onSearchedLocationClick,
  tourStops,
  tourRouteInfo,
  onRemoveTourStop,
  onClearTour,
  onOpenSettings
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="p-0 overflow-y-auto max-h-screen no-scrollbar">
        <Card className="md:border-0 md:bg-transparent md:shadow-none border-0 rounded-none shadow-none">
          <div className="p-3 sm:p-4 md:p-3 space-y-1">
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm sm:text-base flex flex-col items-start h-auto py-2">
                <span>GPS Audio Guide</span>
                <span className="text-[9px] text-primary/60 font-medium tracking-[0.2em] leading-none mt-1">
                  {selectedLanguage === 'ko' ? '여행의 네비게이터' : 'Travel Navigator'}
                </span>
              </SidebarGroupLabel>
              <SidebarGroupContent className="space-y-3 sm:space-y-4 px-2">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">{t('city', selectedLanguage)}</Label>
                    <CitySelector
                      cities={cities}
                      selectedCityId={selectedCityId}
                      onCityChange={onCityChange}
                      selectedLanguage={selectedLanguage}
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

                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={onOpenSettings} data-testid="button-open-settings">
                      <Settings className="w-4 h-4" />
                      <span>{t('settings', selectedLanguage)}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{selectedLanguage === 'ko' ? '나의 활동' : 'My Activity'}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/likes">
                        <Heart className="w-4 h-4" />
                        <span>{selectedLanguage === 'ko' ? '좋아요' : 'Likes'}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/follows">
                        <Users className="w-4 h-4" />
                        <span>{selectedLanguage === 'ko' ? '팔로잉' : 'Following'}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>{t('progress', selectedLanguage)}</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <ProgressStats
                  totalLandmarks={totalLandmarks}
                  cityName={cityName}
                  selectedLanguage={selectedLanguage}
                  landmarks={landmarks}
                  tourStops={tourStops}
                  searchedLocations={searchedLocations}
                  onLandmarkClick={onLandmarkClick}
                  onSearchedLocationClick={onSearchedLocationClick}
                />
              </SidebarGroupContent>
            </SidebarGroup>

            {tourStops && tourStops.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between h-auto py-2">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" />
                    <span className="font-bold">{t('tourRoute', selectedLanguage)}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-black">{tourStops.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearTour}
                    data-testid="button-sidebar-clear-tour"
                    className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </SidebarGroupLabel>
                <SidebarGroupContent className="px-2 space-y-3">
                  {tourRouteInfo && (
                    <div className="flex gap-2 mb-2 p-2 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Distance</span>
                        <span className="text-sm font-black text-primary">{(tourRouteInfo.distance / 1000).toFixed(1)}km</span>
                      </div>
                      <div className="w-px bg-primary/10" />
                      <div className="flex flex-col items-center flex-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Duration</span>
                        <span className="text-sm font-black text-primary">{Math.ceil(tourRouteInfo.duration / 60)}min</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1 no-scrollbar">
                    {(tourStops || []).filter(s => s && s.id).map((landmark, index) => (
                      <div key={landmark.id} className="relative">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white/50 border border-slate-100 group hover:border-primary/30 hover:bg-white hover:shadow-sm transition-all duration-300">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-black text-slate-500 shrink-0">{index + 1}</span>
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: landmark.category === 'Activity' ? 'hsl(195, 85%, 50%)' : 'hsl(14, 85%, 55%)' }} />
                            <span className="text-[13px] font-medium truncate text-slate-700">
                              {getTranslatedContent(landmark, selectedLanguage, 'name') || 'Unknown Landmark'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveTourStop(landmark.id)}
                            className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            data-testid={`button-remove-tour-${landmark.id}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {tourRouteInfo?.segments && tourRouteInfo.segments[index] && (
                          <div className="flex items-center gap-2 pl-4 py-1.5 text-[10px] font-bold text-slate-400">
                            <div className="w-0.5 h-3 bg-slate-100 ml-2" />
                            <span className="tracking-tighter uppercase">Next:</span>
                            <span>{(tourRouteInfo.segments[index].distance / 1000).toFixed(1)}km</span>
                            <span>•</span>
                            <span>{Math.ceil(tourRouteInfo.segments[index].duration / 60)}min</span>
                          </div>
                        )}
                      </div>
                    ))}
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
