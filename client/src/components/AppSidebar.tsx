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
import { CitySelector } from './CitySelector';
import { LanguageSelector } from './LanguageSelector';
import { ProgressStats } from './ProgressStats';
import { Volume2, VolumeX, WifiOff, Wifi, Navigation as NavIcon, AudioLines } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { City } from '@shared/schema';
import { t } from '@/lib/translations';

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
  onTestAudio
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('progress', selectedLanguage)}</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <ProgressStats totalLandmarks={totalLandmarks} cityName={cityName} selectedLanguage={selectedLanguage} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
