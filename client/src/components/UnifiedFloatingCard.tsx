
import React, { useState, useRef, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  Volume2,
  Navigation,
  MapPin,
  Clock,
  List,
  Search,
  MessageCircle,
  ExternalLink,
  MapPinned,
  ChevronLeft,
  ChevronRight,
  Info,
  Activity as ActivityIcon,
  Map as LandmarkIcon,
  ShoppingBag,
  Utensils,
  Maximize2,
  Minimize2,
  Ship,
  Phone,
  Globe,
  Euro,
  ChefHat,
  Ticket,
  Image as ImageIcon,
  User as UserIcon,
  Wand2,
  Anchor,
  Bus,
  Save,
  FolderOpen,
  Square,
  Train,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Landmark, GpsPosition, City, CruisePort, TransportOption } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import LandmarkDetailDialog from './LandmarkDetailDialog';

interface UnifiedFloatingCardProps {
  // Landmark Panel props
  selectedLandmark: Landmark | null;
  isTransitMode?: boolean;
  onLandmarkClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;

  // Cruise Port props
  city: City | null;
  showCruisePort: boolean;
  onCruisePortClose?: () => void;
  onLandmarkClick?: (landmarkId: string) => void;

  // Landmark List props
  landmarks: Landmark[];
  userPosition: GpsPosition | null;
  onLandmarkRoute: (landmark: Landmark) => void;
  spokenLandmarks: Set<string>;
  onLandmarkSelect?: (landmark: Landmark) => void;

  // Filter props (synced with Home)
  showLandmarks: boolean;
  showActivities: boolean;
  showRestaurants: boolean;
  showGiftShops: boolean;
  onToggleLandmarks: () => void;
  onToggleActivities: () => void;
  onToggleRestaurants: () => void;
  onToggleGiftShops: () => void;

  // Tour Route props
  tourStops?: Landmark[];
  tourRouteInfo?: {
    distance: number;
    duration: number;
    segments?: Array<{ from: string; to: string; distance: number; duration: number }>;
  } | null;
  onRemoveTourStop?: (landmarkId: string) => void;
  tourTimePerStop?: number;
  tourStopDurations?: Record<string, number>;
  onUpdateStopDuration?: (landmarkId: string, duration: number) => void;
  onSaveRoute?: () => void;
  onOpenMyRoutes?: () => void;

  // AI Recommendation props
  aiRecommendation?: {
    itinerary: Array<{ landmarkId: string; order: number }>;
    explanation: string;
    totalEstimatedTime: number;
  } | null;

  // Common props
  selectedLanguage?: string;

  // Departure time for traffic estimation
  departureTime?: Date | null;

  // Starting point for distance calculation
  startingPoint?: { lat: number; lng: number; type: string; name?: string } | null;

  // End point for tour
  endPoint?: { lat: number; lng: number; type: string; name?: string } | null;

  // Callback to open start/end point setup dialog
  onOpenStartEndPointDialog?: () => void;

  // Captured route image
  capturedRouteImage?: string | null;
  onClearCapturedImage?: () => void;

  // Regional Guide props
  selectedRegionalGuideId?: string | null;
  onRegionalGuideChange?: (guideId: string | null) => void;

  // 🛰️ Simulation props
  isSimulationMode?: boolean;
  onToggleSimulation?: () => void;
  playInBackground?: boolean;

  // 🛰️ [Server Park] Minimal Transit UI props
  showMinimalTransitUI?: boolean;
  onToggleMinimalTransitUI?: () => void;
}

function getCruisePortTranslation(cruisePort: CruisePort | null | undefined, language: string, field: 'portName' | 'distanceFromCity' | 'recommendedDuration' | 'tips'): string {
  if (!cruisePort) return '';
  if (language === 'ko' && cruisePort.translations?.ko) return cruisePort.translations.ko[field] || '';
  return cruisePort[field] || '';
}

function getTransportTranslation(transport: TransportOption, language: string, field: 'name' | 'from' | 'to' | 'duration' | 'price' | 'tips'): string {
  if (language === 'ko' && transport.translations?.ko) return transport.translations.ko[field] || '';
  return transport[field] || '';
}

function getGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function getAirbnbUrl(query: string): string {
  return `https://www.airbnb.com/s/${encodeURIComponent(query)}/homes`;
}

export function UnifiedFloatingCard({
  selectedLandmark,
  isTransitMode = false,
  onLandmarkClose,
  onNavigate,
  onAddToTour,
  isInTour = false,
  city,
  showCruisePort,
  onCruisePortClose,
  landmarks,
  userPosition,
  onLandmarkRoute,
  spokenLandmarks,
  onLandmarkSelect,
  showLandmarks,
  showActivities,
  showRestaurants,
  showGiftShops,
  onToggleLandmarks,
  onToggleActivities,
  onToggleRestaurants,
  onToggleGiftShops,
  tourStops = [],
  tourRouteInfo,
  onRemoveTourStop,
  tourTimePerStop = 30,
  tourStopDurations = {},
  onUpdateStopDuration,
  onSaveRoute,
  onOpenMyRoutes,
  aiRecommendation,
  selectedLanguage = 'en',
  departureTime,
  startingPoint,
  endPoint,
  onOpenStartEndPointDialog,
  capturedRouteImage,
  onClearCapturedImage,
  selectedRegionalGuideId,
  onRegionalGuideChange,
  isSimulationMode = false,
  onToggleSimulation,
  playInBackground = false,
  showMinimalTransitUI = false,
  onToggleMinimalTransitUI
}: UnifiedFloatingCardProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'cruise' | 'tour'>('list');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTransitDetails, setShowTransitDetails] = useState(false);
  const [landmarkSearchQuery, setLandmarkSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transportPage, setTransportPage] = useState(1);
  const [tourPage, setTourPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [tourAddedInDialog, setTourAddedInDialog] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 5;
  const transportItemsPerPage = 3;
  const tourItemsPerPage = 10;

  // Update playback state
  useEffect(() => {
    audioService.setOnStateChange((speaking: boolean) => {
      setIsPlaying(speaking);
      setIsPaused(audioService.isPaused());
    });
    return () => audioService.setOnStateChange(null);
  }, []);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedLandmark) return;

    if (isPlaying) {
      if (isPaused) {
        audioService.resume();
      } else {
        audioService.pause();
      }
    } else {
      const text = getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription') ||
        getTranslatedContent(selectedLandmark, selectedLanguage, 'description');
      if (text) {
        audioService.playText(text, selectedLanguage, playbackRate);
      }
    }
  };

  const calculateDistance = (pos1: GpsPosition, pos2: { lat: number; lng: number }) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (pos1.latitude * Math.PI) / 180;
    const phi2 = (pos2.lat * Math.PI) / 180;
    const deltaPhi = ((pos2.lat - pos1.latitude) * Math.PI) / 180;
    const deltaLambda = ((pos2.lng - pos1.longitude) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const filteredListLandmarks = useMemo(() => {
    let result = landmarks.map(landmark => ({
      landmark,
      distance: userPosition ? calculateDistance(userPosition, { lat: landmark.lat, lng: landmark.lng }) : null
    }));

    // Filter by search query
    if (landmarkSearchQuery) {
      const query = landmarkSearchQuery.toLowerCase();
      result = result.filter(({ landmark }) =>
        getTranslatedContent(landmark, selectedLanguage, 'name').toLowerCase().includes(query) ||
        getTranslatedContent(landmark, selectedLanguage, 'description').toLowerCase().includes(query)
      );
    }

    // Filter by categories
    result = result.filter(({ landmark }) => {
      if (landmark.category === 'Activity') return showActivities;
      if (landmark.category === 'Restaurant') return showRestaurants;
      if (landmark.category === 'Gift Shop') return showGiftShops;
      return showLandmarks; // Default for 'Landmark' category
    });

    // Sort by distance
    return result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [landmarks, userPosition, landmarkSearchQuery, showLandmarks, showActivities, showRestaurants, showGiftShops, selectedLanguage]);

  const handleLandmarkClick = (landmark: Landmark) => {
    onLandmarkSelect?.(landmark);
  };

  const getTrafficInfo = (lang: string, time?: Date | null) => {
    const now = time || new Date();
    const hours = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (hours >= 7 && hours <= 9) return { label: lang === 'ko' ? '출근 시간 (정체)' : 'Rush Hour (Heavy)', multiplier: 1.8, color: '#ef4444' };
    if (hours >= 17 && hours <= 19) return { label: lang === 'ko' ? '퇴근 시간 (정체)' : 'Rush Hour (Heavy)', multiplier: 2.0, color: '#ef4444' };
    if (hours >= 11 && hours <= 14) return { label: lang === 'ko' ? '낮 시간 (보통)' : 'Mid-day (Moderate)', multiplier: 1.3, color: '#f59e0b' };
    if (hours >= 22 || hours <= 5) return { label: lang === 'ko' ? '심야 시간 (원활)' : 'Night (Smooth)', multiplier: 0.8, color: '#10b981' };
    return { label: lang === 'ko' ? '원활' : 'Smooth', multiplier: 1.0, color: '#10b981' };
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'bus': return Bus;
      case 'train': return Train;
      case 'taxi': return Car;
      case 'shuttle': return Ship;
      default: return Bus;
    }
  };

  // State management for detail view
  useEffect(() => {
    if (selectedLandmark) {
      setShowDetailDialog(true);
    }
  }, [selectedLandmark]);

  const zIndex = isTransitMode ? 50 : 20;

  return (
    <div
      style={{ zIndex }}
      className={`fixed bottom-24 right-4 ${selectedLandmark ? 'w-[calc(100vw-48px)] sm:w-[360px]' : 'w-[calc(100vw-32px)] sm:w-[380px]'} max-h-[calc(100vh-180px)] flex flex-col glass-premium aurora-border-premium shadow-2xl rounded-sm overflow-hidden transition-all duration-500 ${isMinimized ? 'opacity-0 pointer-events-none translate-y-20' : 'opacity-100'}`}
    >
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between border-b bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant={activeTab === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-full h-8 px-3 ${activeTab === 'list' ? 'bg-indigo-600 font-bold' : ''}`}
            onClick={() => {
              setActiveTab('list');
              onLandmarkClose();
            }}
          >
            <List className="w-4 h-4 mr-1" />
            <span className="text-xs">{t('list', selectedLanguage)}</span>
          </Button>
          {showCruisePort && (
            <Button
              variant={activeTab === 'cruise' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full h-8 px-3 ${activeTab === 'cruise' ? 'bg-indigo-600 font-bold' : ''}`}
              onClick={() => {
                setActiveTab('cruise');
                onLandmarkClose();
              }}
            >
              <Ship className="w-4 h-4 mr-1" />
              <span className="text-xs">{t('cruisePort', selectedLanguage)}</span>
            </Button>
          )}
          <Button
            variant={activeTab === 'tour' ? 'default' : 'ghost'}
            size="sm"
            className={`rounded-full h-8 px-3 ${activeTab === 'tour' ? 'bg-indigo-600 font-bold' : ''}`}
            onClick={() => {
              setActiveTab('tour');
              onLandmarkClose();
            }}
          >
            <MapPinned className="w-4 h-4 mr-1" />
            <span className="text-xs">{t('myTour', selectedLanguage)}</span>
          </Button>
          {selectedLandmark && (
            <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 ml-2">
              <LandmarkIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-900 truncate max-w-[80px]">
                {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
              </span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onLandmarkClose()}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <AnimatePresence>
        <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          {/* LANDMARK DETAIL LAYER */}
          <AnimatePresence mode="wait">
            {selectedLandmark && (
              <motion.div
                key="detail"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 bg-white dark:bg-slate-900 p-4 overflow-y-auto custom-scrollbar"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg leading-tight">
                        {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
                      </h4>
                      <Badge variant="secondary" className="mt-1">{selectedLandmark.category}</Badge>
                    </div>
                  </div>

                  {aiRecommendation && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-bold text-purple-900">AI 추천</span>
                      </div>
                      <p className="text-purple-800">{aiRecommendation.explanation}</p>
                    </div>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {getTranslatedContent(selectedLandmark, selectedLanguage, 'description')}
                  </p>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePlayAudio} className="flex-1 gap-2">
                      {isPlaying && !isPaused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {selectedLanguage === 'ko' ? (isPlaying && !isPaused ? '정지' : '듣기') : 'Listen'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowDetailDialog(true)} className="flex-1 gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {selectedLanguage === 'ko' ? '사진' : 'Photos'}
                    </Button>
                  </div>

                  {getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription') && (
                    <div className="pt-3 border-t">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription')}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN CONTENT LAYER */}
          <div className={`flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar transition-opacity duration-300 ${selectedLandmark ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
            {activeTab === 'list' && (
              <div className="space-y-4 flex flex-col h-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchLandmarks', selectedLanguage)}
                    className="pl-9 h-9 bg-muted/50 border-none"
                    value={landmarkSearchQuery}
                    onChange={(e) => setLandmarkSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  {filteredListLandmarks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(({ landmark, distance }) => (
                    <div
                      key={landmark.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                      onClick={() => handleLandmarkClick(landmark)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {landmark.photos?.[0] && <img src={landmark.photos[0]} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-semibold truncate">{getTranslatedContent(landmark, selectedLanguage, 'name')}</h5>
                          {distance !== null && <p className="text-[10px] text-muted-foreground">{formatDistance(distance)} • {landmark.category}</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onLandmarkRoute(landmark); }}>
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {filteredListLandmarks.length > itemsPerPage && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs">{currentPage} / {Math.ceil(filteredListLandmarks.length / itemsPerPage)}</span>
                    <Button variant="ghost" size="sm" disabled={currentPage === Math.ceil(filteredListLandmarks.length / itemsPerPage)} onClick={() => setCurrentPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cruise' && city?.cruisePort && (
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{getCruisePortTranslation(city.cruisePort, selectedLanguage, 'portName')}</h4>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm italic">
                  {getCruisePortTranslation(city.cruisePort, selectedLanguage, 'tips')}
                </div>
              </div>
            )}

            {activeTab === 'tour' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm">내 투어 ({tourStops.length})</h5>
                  <Button size="sm" className="bg-indigo-600 rounded-full h-7 text-xs" onClick={() => onToggleSimulation?.()}>
                    {isSimulationMode ? '중단' : '시작'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {tourStops.map((stop, idx) => (
                    <div key={stop.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                      <span className="text-xs font-medium truncate flex-1">{getTranslatedContent(stop, selectedLanguage, 'name')}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveTourStop?.(stop.id)}>
                        <X className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatePresence>

      <LandmarkDetailDialog
        landmark={selectedLandmark}
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          onLandmarkClose();
        }}
        onNavigate={onNavigate}
        onAddToTour={onAddToTour}
        isInTour={isInTour}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}

