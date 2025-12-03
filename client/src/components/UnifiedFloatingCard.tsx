import { useState, useRef, useEffect, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Minus, MapPin, Ship, List, Navigation, Info, Volume2, Activity, Landmark as LandmarkIcon, Play, Pause, Volume2 as AudioIcon, Ticket, ExternalLink, MapPinned, Train, Bus, Car, Clock, Anchor, Utensils, Euro, ChefHat, Phone, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Landmark, City, GpsPosition, CruisePort, TransportOption } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import { calculateDistance, formatDistance } from '@/lib/geoUtils';
import { audioService } from '@/lib/audioService';
import PhotoGallery from './PhotoGallery';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import LandmarkDetailDialog from './LandmarkDetailDialog';

interface UnifiedFloatingCardProps {
  // Control props
  forceShowList?: boolean;
  
  // Landmark Panel props
  selectedLandmark: Landmark | null;
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
  
  // AI Recommendation props
  aiRecommendation?: {
    itinerary: Array<{ landmarkId: string; order: number }>;
    explanation: string;
    totalEstimatedTime: number;
  } | null;
  
  // Common props
  selectedLanguage?: string;
  onMapMarkerClick?: (lat: number, lng: number) => void;
}

function getCruisePortTranslation(cruisePort: CruisePort, language: string, field: 'portName' | 'distanceFromCity' | 'recommendedDuration' | 'tips'): string {
  if (cruisePort.translations?.[language]?.[field]) {
    return cruisePort.translations[language][field] as string;
  }
  return cruisePort[field] || '';
}

function getTransportTranslation(transport: TransportOption, language: string, field: 'name' | 'from' | 'to' | 'duration' | 'frequency' | 'price' | 'tips'): string {
  if (transport.translations?.[language]?.[field]) {
    return transport.translations[language][field] as string;
  }
  return transport[field] || '';
}

function getTransportIcon(type: string) {
  switch (type) {
    case 'train':
      return Train;
    case 'bus':
    case 'shuttle':
      return Bus;
    case 'taxi':
    case 'rideshare':
      return Car;
    default:
      return Car;
  }
}

export default function UnifiedFloatingCard({
  forceShowList = false,
  selectedLandmark,
  onLandmarkClose,
  onNavigate,
  onAddToTour,
  isInTour = false,
  city,
  showCruisePort,
  onCruisePortClose,
  onLandmarkClick,
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
  tourRouteInfo = null,
  onRemoveTourStop,
  tourTimePerStop = 45,
  aiRecommendation = null,
  selectedLanguage = 'en',
  onMapMarkerClick
}: UnifiedFloatingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('list');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [tourAddedInDialog, setTourAddedInDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transportPage, setTransportPage] = useState(1);
  const [tourPage, setTourPage] = useState(1);
  const itemsPerPage = 5;
  const transportItemsPerPage = 3;
  const tourItemsPerPage = 4;
  const cardRef = useRef<HTMLDivElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const zIndexTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' && window.innerWidth < 640
  );

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-switch to landmark tab when landmark is selected
  useEffect(() => {
    if (selectedLandmark) {
      if (activeTab !== 'landmark') {
        setActiveTab('landmark');
      }
    } else {
      if (activeTab === 'landmark') {
        // If landmark tab was active and landmark is closed, switch to list
        setActiveTab('list');
      }
    }
  }, [selectedLandmark, activeTab]);

  // Auto-switch to list tab when cruise port is closed
  useEffect(() => {
    if (!showCruisePort && activeTab === 'cruise') {
      setActiveTab('list');
    }
  }, [showCruisePort, activeTab]);

  // Handle forceShowList - show card and switch to list tab
  useEffect(() => {
    if (forceShowList) {
      setIsMinimized(false);
      setActiveTab('list');
    }
  }, [forceShowList]);

  // Wrapper handlers for list tab filters with scroll functionality
  const handleListToggleLandmarks = () => {
    const wasOff = !showLandmarks;
    onToggleLandmarks();
    
    // If turning on and in List tab, scroll to first landmark
    if (wasOff && activeTab === 'list') {
      setTimeout(() => {
        const firstLandmark = landmarks.find(l => 
          l.category !== 'Activity' && 
          l.category !== 'Restaurant' && 
          l.category !== 'Gift Shop' && 
          l.category !== 'Shop'
        );
        if (firstLandmark && listScrollRef.current) {
          const element = listScrollRef.current.querySelector(`[data-testid="card-landmark-${firstLandmark.id}"]`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const handleListToggleActivities = () => {
    const wasOff = !showActivities;
    onToggleActivities();
    
    // If turning on and in List tab, scroll to first activity
    if (wasOff && activeTab === 'list') {
      setTimeout(() => {
        const firstActivity = landmarks.find(l => l.category === 'Activity');
        if (firstActivity && listScrollRef.current) {
          const element = listScrollRef.current.querySelector(`[data-testid="card-landmark-${firstActivity.id}"]`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const handleListToggleRestaurants = () => {
    const wasOff = !showRestaurants;
    onToggleRestaurants();
    
    // If turning on and in List tab, scroll to first restaurant
    if (wasOff && activeTab === 'list') {
      setTimeout(() => {
        const firstRestaurant = landmarks.find(l => l.category === 'Restaurant');
        if (firstRestaurant && listScrollRef.current) {
          const element = listScrollRef.current.querySelector(`[data-testid="card-landmark-${firstRestaurant.id}"]`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  const handleListToggleGiftShops = () => {
    const wasOff = !showGiftShops;
    onToggleGiftShops();
    
    // If turning on and in List tab, scroll to first gift shop
    if (wasOff && activeTab === 'list') {
      setTimeout(() => {
        const firstGiftShop = landmarks.find(l => l.category === 'Gift Shop' || l.category === 'Shop');
        if (firstGiftShop && listScrollRef.current) {
          const element = listScrollRef.current.querySelector(`[data-testid="card-landmark-${firstGiftShop.id}"]`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  // Determine which tab to show
  useEffect(() => {
    if (selectedLandmark) {
      setActiveTab('landmark');
      setShowDetailDialog(true);
    } else if (showCruisePort && city?.cruisePort) {
      setActiveTab('cruise');
    }
    // Note: Don't change activeTab when selectedLandmark is null
    // This allows Info icon to show in Tour tab when no landmark is selected
  }, [selectedLandmark, showCruisePort, city]);

  // Stop audio when landmark changes or component unmounts
  useEffect(() => {
    return () => {
      audioService.stop();
      setIsPlaying(false);
    };
  }, [selectedLandmark?.id]);

  useEffect(() => {
    audioService.stop();
    setIsPlaying(false);
  }, [selectedLanguage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [showLandmarks, showActivities, showRestaurants, showGiftShops]);

  // Reset transport page when city changes
  useEffect(() => {
    setTransportPage(1);
  }, [city?.id]);

  // Clamp transport page when transport options change
  useEffect(() => {
    if (city?.cruisePort?.transportOptions) {
      const totalPages = Math.ceil(city.cruisePort.transportOptions.length / transportItemsPerPage);
      if (transportPage > totalPages && totalPages > 0) {
        setTransportPage(totalPages);
      }
    }
  }, [city?.cruisePort?.transportOptions?.length, transportPage, transportItemsPerPage]);

  // Clamp translate values to keep element within bounds
  const clampTranslate = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const maxX = (viewportWidth - elementWidth) / 2;
    const maxY = (viewportHeight - elementHeight) / 2;
    
    return {
      x: Math.max(-maxX, Math.min(x, maxX)),
      y: Math.max(-maxY, Math.min(y, maxY))
    };
  }, []);


  const handleStart = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select, [role="button"]')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({ x: clientX - translate.x, y: clientY - translate.y });
    
    if (zIndexTimeoutRef.current) {
      clearTimeout(zIndexTimeoutRef.current);
    }
    setZIndex(1001);
  }, [translate]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!cardRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    const rect = cardRef.current.getBoundingClientRect();
    const clamped = clampTranslate(newX, newY, rect.width, rect.height);
    
    setTranslate(clamped);
  }, [dragStart, clampTranslate]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
    
    if (zIndexTimeoutRef.current) {
      clearTimeout(zIndexTimeoutRef.current);
    }
    zIndexTimeoutRef.current = setTimeout(() => {
      setZIndex(1000);
    }, 100);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handleMouseMove(e);
      const endHandler = () => handleEnd();
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', endHandler);
      window.addEventListener('touchmove', moveHandler);
      window.addEventListener('touchend', endHandler);
      
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', endHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('touchend', endHandler);
      };
    }
  }, [isDragging, handleMouseMove, handleEnd]);

  const handleCardClick = (e: ReactMouseEvent) => {
    if (zIndexTimeoutRef.current) {
      clearTimeout(zIndexTimeoutRef.current);
    }
    setZIndex(1001);
    
    zIndexTimeoutRef.current = setTimeout(() => {
      setZIndex(1000);
    }, 100);
  };

  const handlePlayAudio = () => {
    if (!selectedLandmark) return;
    
    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      const text = getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription') || 
                   getTranslatedContent(selectedLandmark, selectedLanguage, 'description') || '';
      
      audioService.playText(text, selectedLanguage, playbackRate, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const landmarksWithDistance = landmarks.map((landmark) => {
    const distance = userPosition
      ? calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          landmark.lat,
          landmark.lng
        )
      : null;
    return { landmark, distance };
  });

  const sortedLandmarks = [...landmarksWithDistance].sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  // Filter landmarks in List tab based on category (synced with Home filter state)
  // Also exclude landmarks that are already in tour stops
  const filteredListLandmarks = sortedLandmarks.filter(({ landmark }) => {
    // Hide landmarks that are already in tour stops
    const isInTour = tourStops.some(stop => stop.id === landmark.id);
    if (isInTour) return false;
    
    const isActivity = landmark.category === 'Activity';
    const isRestaurant = landmark.category === 'Restaurant';
    const isGiftShop = landmark.category === 'Gift Shop' || landmark.category === 'Shop';
    if (isActivity) return showActivities;
    if (isRestaurant) return showRestaurants;
    if (isGiftShop) return showGiftShops;
    return showLandmarks;
  });

  // Clamp currentPage when filtered list length changes
  useEffect(() => {
    const totalPages = Math.ceil(filteredListLandmarks.length / itemsPerPage);
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredListLandmarks.length, currentPage, itemsPerPage]);

  // Render full card
  const renderFullCard = () => (
    <div
      ref={cardRef}
      className="bg-card border border-border rounded-lg shadow-lg flex flex-col"
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        cursor: 'default',
        width: isMobile ? 'calc(100vw - 16px)' : '28rem',
        maxWidth: 'calc(100vw - 16px)',
        maxHeight: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 32px)',
        transform: 'translate(-50%, -50%)'
      }}
      onClick={handleCardClick}
      data-testid="card-unified-floating-container"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b flex-shrink-0">
          <h3 className="font-semibold text-lg flex-1" data-testid="text-unified-card-title">
            {t('infoPanel', selectedLanguage)}
          </h3>
          
          {/* Action buttons - Only show when landmark is selected */}
          {selectedLandmark && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.(selectedLandmark);
                  setIsMinimized(true);
                }}
                className="h-8 w-8"
                data-testid="button-header-navigate"
              >
                <Navigation className="w-4 h-4" />
              </Button>
              {onAddToTour && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToTour(selectedLandmark);
                    // List 탭으로 먼저 전환
                    setActiveTab('list');
                    // 그 다음 랜드마크 닫기
                    setTimeout(() => {
                      onLandmarkClose();
                    }, 100);
                  }}
                  disabled={isInTour || tourStops.some(stop => stop.id === selectedLandmark.id)}
                  className="h-8 w-8"
                  data-testid="button-header-add-to-tour"
                >
                  <MapPinned className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
          
          {/* Info icon - Only show when no landmark selected */}
          {!selectedLandmark && activeTab === 'landmark' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled
              data-testid="button-header-info-icon"
            >
              <Info className="w-4 h-4 opacity-50" />
            </Button>
          )}
          
          {/* List button in header */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('list');
            }}
            className="h-8 w-8"
            data-testid="button-header-list"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (selectedLandmark) {
                if (tourAddedInDialog) {
                  setActiveTab('list');
                  setTourAddedInDialog(false);
                }
                onLandmarkClose();
              } else if (showCruisePort && onCruisePortClose) {
                setActiveTab('list');
                onCruisePortClose();
              } else {
                setActiveTab('list');
              }
              // 항상 카드 숨기기
              setIsMinimized(true);
            }}
            className="h-6 w-6"
            data-testid="button-close-unified"
          >
            <X className="w-4 h-4" />
          </Button>
      </div>

      {/* Content area with scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">

          {/* Tour Tab with filters */}
          <TabsContent value="landmark" className="mt-4 flex flex-col">
            {/* AI Recommendation Box */}
            {aiRecommendation && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div className="flex-1">
                    <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      {selectedLanguage === 'ko' ? 'AI 추천 이유' : 'AI Recommendation'}
                    </h5>
                    <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                      {aiRecommendation.explanation}
                    </p>
                    <div className="mt-2 text-xs text-purple-700 dark:text-purple-300">
                      {selectedLanguage === 'ko' 
                        ? `예상 소요 시간: ${aiRecommendation.totalEstimatedTime}분`
                        : `Estimated time: ${aiRecommendation.totalEstimatedTime} min`
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable content - Contains both selected landmark and list */}
            <div className="space-y-4">
            {selectedLandmark && (
              <div className="space-y-4 pb-4 border-b">{/* Selected landmark details */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-xl mb-2" data-testid="text-landmark-name">
                      {getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge variant={selectedLandmark.category === 'Activity' ? 'default' : 'secondary'}>
                        {selectedLandmark.category === 'Activity' ? <Activity className="w-3 h-3 mr-1" /> : <LandmarkIcon className="w-3 h-3 mr-1" />}
                        {selectedLandmark.category === 'Activity' ? t('activity', selectedLanguage) : t('landmark', selectedLanguage)}
                      </Badge>
                      {selectedLandmark.category && selectedLandmark.category !== 'Activity' && (
                        <Badge variant="outline">{selectedLandmark.category}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      onLandmarkClose();
                      setIsMinimized(true);
                    }}
                    className="h-8 w-8 flex-shrink-0"
                    data-testid="button-close-landmark-info"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {selectedLandmark.photos && selectedLandmark.photos.length > 0 && (
                  <PhotoGallery 
                    photos={selectedLandmark.photos} 
                    title={getTranslatedContent(selectedLandmark, selectedLanguage, 'name')}
                  />
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {getTranslatedContent(selectedLandmark, selectedLanguage, 'description')}
                  </p>
                  
                  {getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription') && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePlayAudio}
                          className="gap-2"
                          data-testid="button-play-audio"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {isPlaying ? t('pause', selectedLanguage) : t('playAudio', selectedLanguage)}
                        </Button>
                        {isPlaying && (
                          <select
                            value={playbackRate}
                            onChange={(e) => {
                              const rate = parseFloat(e.target.value);
                              setPlaybackRate(rate);
                              audioService.setRate(rate);
                            }}
                            className="px-2 py-1 text-sm border rounded"
                            data-testid="select-playback-rate"
                          >
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1.0">1.0x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2.0">2.0x</option>
                          </select>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">
                        {getTranslatedContent(selectedLandmark, selectedLanguage, 'detailedDescription')}
                      </p>
                    </div>
                  )}
                </div>

                {selectedLandmark.category === 'Activity' && (
                  <div className="pt-3 border-t">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      {t('bookTicketsTours', selectedLanguage)}
                    </h5>
                    <div className="space-y-2">
                      {/* 한국어: Klook */}
                      {selectedLanguage === 'ko' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                            window.open(`https://www.klook.com/ko/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-klook"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Klook에서 예약
                        </Button>
                      )}
                      
                      {/* 일본어: Klook, Viator */}
                      {selectedLanguage === 'ja' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                              window.open(`https://www.klook.com/ja/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                            }}
                            data-testid="button-book-klook"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Klookで予約
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                              window.open(`https://www.viator.com/ja-JP/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                            }}
                            data-testid="button-book-viator"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Viatorで予約
                          </Button>
                        </>
                      )}
                      
                      {/* 중국어: Klook, Trip.com */}
                      {selectedLanguage === 'zh' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                              window.open(`https://www.klook.com/zh-CN/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                            }}
                            data-testid="button-book-klook"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Klook预订
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                              window.open(`https://cn.trip.com/search/things-to-do?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                            }}
                            data-testid="button-book-trip"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Trip.com预订
                          </Button>
                        </>
                      )}
                      
                      {/* 동남아시아 언어: Klook */}
                      {(selectedLanguage === 'th' || selectedLanguage === 'vi' || selectedLanguage === 'id') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                            const langCode = selectedLanguage === 'th' ? 'th-TH' : selectedLanguage === 'vi' ? 'vi-VN' : 'id-ID';
                            window.open(`https://www.klook.com/${langCode}/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-klook"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {selectedLanguage === 'th' ? 'จองกับ Klook' : selectedLanguage === 'vi' ? 'Đặt trên Klook' : 'Pesan di Klook'}
                        </Button>
                      )}
                      
                      {/* 영어/유럽 언어: GetYourGuide, Viator */}
                      {['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'tr', 'nl', 'pl', 'sv', 'da', 'fi', 'no', 'el', 'cs'].includes(selectedLanguage) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                              // Language mapping for GetYourGuide
                              const gygLang = selectedLanguage === 'es' ? 'es' : selectedLanguage === 'fr' ? 'fr' : selectedLanguage === 'de' ? 'de' : selectedLanguage === 'it' ? 'it' : selectedLanguage === 'pt' ? 'pt-BR' : 'en';
                              window.open(`https://www.getyourguide.com/${gygLang}/s/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                            }}
                            data-testid="button-book-getyourguide"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t('bookOnGetYourGuide', selectedLanguage)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => {
                              const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                              // Language mapping for Viator
                              const viatorLang = selectedLanguage === 'es' ? 'es-ES' : selectedLanguage === 'fr' ? 'fr-FR' : selectedLanguage === 'de' ? 'de-DE' : selectedLanguage === 'it' ? 'it-IT' : selectedLanguage === 'pt' ? 'pt-BR' : 'en-US';
                              window.open(`https://www.viator.com/${viatorLang}/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                            }}
                            data-testid="button-book-viator"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t('bookOnViator', selectedLanguage)}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedLandmark.category === 'Restaurant' && (
                  <div className="pt-3 border-t">
                    <h5 className="font-semibold mb-3 flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      {t('restaurantInfo', selectedLanguage)}
                    </h5>
                    <div className="space-y-3">
                      {selectedLandmark.openingHours && (
                        <div className="flex items-start gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{t('openingHours', selectedLanguage)}</p>
                            <p className="text-muted-foreground">{selectedLandmark.openingHours}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedLandmark.priceRange && (
                        <div className="flex items-start gap-2 text-sm">
                          <Euro className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{t('priceRange', selectedLanguage)}</p>
                            <p className="text-muted-foreground">{selectedLandmark.priceRange}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedLandmark.cuisine && (
                        <div className="flex items-start gap-2 text-sm">
                          <ChefHat className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{t('cuisine', selectedLanguage)}</p>
                            <p className="text-muted-foreground">{selectedLandmark.cuisine}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedLandmark.phoneNumber && (
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{t('phoneNumber', selectedLanguage)}</p>
                            <a 
                              href={`tel:${selectedLandmark.phoneNumber}`}
                              className="text-primary hover:underline"
                              data-testid="link-restaurant-phone"
                            >
                              {selectedLandmark.phoneNumber}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedLandmark.menuHighlights && selectedLandmark.menuHighlights.length > 0 && (
                        <div className="text-sm">
                          <p className="font-medium mb-1">{t('menuHighlights', selectedLanguage)}</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedLandmark.menuHighlights.map((dish, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {dish}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {selectedLandmark.phoneNumber && (
                          <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => window.open(`tel:${selectedLandmark.phoneNumber}`, '_self')}
                            data-testid="button-call-restaurant"
                          >
                            <Phone className="w-4 h-4" />
                            {t('callRestaurant', selectedLanguage)}
                          </Button>
                        )}
                        {selectedLandmark.reservationUrl && (
                          <Button
                            variant="default"
                            className="flex-1 gap-2"
                            onClick={() => window.open(selectedLandmark.reservationUrl, '_blank', 'noopener,noreferrer')}
                            data-testid="button-make-reservation"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t('makeReservation', selectedLanguage)}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Landmark List - Category-based sections */}
            <div className="space-y-4">
              {(() => {
                const landmarksByCategory = filteredListLandmarks.reduce((acc, item) => {
                  const category = item.landmark.category || 'Landmark';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(item);
                  return acc;
                }, {} as Record<string, typeof filteredListLandmarks>);

                const renderSection = (category: string, items: typeof filteredListLandmarks, title: string, icon: ReactNode) => {
                  if (items.length === 0) return null;
                  return (
                    <div key={category} className="space-y-2">
                      <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                        {icon}
                        {title}
                      </h5>
                      {items.map(({ landmark, distance }) => (
                        <div
                          key={landmark.id}
                          className="p-3 bg-muted/30 rounded-lg hover-elevate cursor-pointer"
                          onClick={() => onLandmarkSelect?.(landmark)}
                          data-testid={`card-landmark-${landmark.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm" data-testid={`text-landmark-name-${landmark.id}`}>
                                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                                </h4>
                                {spokenLandmarks.has(landmark.id) && (
                                  <Volume2 className="w-3 h-3 text-green-600" />
                                )}
                              </div>
                              {distance !== null && (
                                <p className="text-xs text-muted-foreground">
                                  {formatDistance(distance)}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLandmarkRoute(landmark);
                                setIsMinimized(true);
                              }}
                              className="h-8 w-8"
                              data-testid={`button-navigate-${landmark.id}`}
                            >
                              <Navigation className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <>
                    {renderSection('Landmark', landmarksByCategory['Landmark'] || [], t('landmarksSection', selectedLanguage), <LandmarkIcon className="w-4 h-4 text-primary" />)}
                    {renderSection('Activity', landmarksByCategory['Activity'] || [], t('activitiesSection', selectedLanguage), <Activity className="w-4 h-4 text-[hsl(195,85%,50%)]" />)}
                    {renderSection('Restaurant', landmarksByCategory['Restaurant'] || [], t('restaurantsSection', selectedLanguage), <Utensils className="w-4 h-4 text-[hsl(195,85%,50%)]" />)}
                  </>
                );
              })()}
            </div>
            </div>
          </TabsContent>

          {/* Cruise Port Tab with sub-tabs */}
          <TabsContent value="cruise" className="mt-4 flex flex-col flex-1">
            {city?.cruisePort && (
              <Tabs defaultValue="info" className="w-full flex flex-col flex-1 min-h-0">
                <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                  <TabsTrigger value="info" className="text-xs whitespace-normal leading-tight px-1 h-auto py-2">{t('cruiseInfo', selectedLanguage)}</TabsTrigger>
                  <TabsTrigger value="transport" className="text-xs whitespace-normal leading-tight px-1 h-auto py-2">{t('transportation', selectedLanguage)}</TabsTrigger>
                  <TabsTrigger value="tips" className="text-xs whitespace-normal leading-tight px-1 h-auto py-2">{t('tips', selectedLanguage)}</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4 overflow-y-auto flex-1">
                  <div>
                    <h4 className="font-bold text-lg mb-2">
                      {getCruisePortTranslation(city.cruisePort, selectedLanguage, 'portName')}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{getCruisePortTranslation(city.cruisePort, selectedLanguage, 'distanceFromCity')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{getCruisePortTranslation(city.cruisePort, selectedLanguage, 'recommendedDuration')}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transport" className="mt-4 flex flex-col flex-1">
                  {city?.cruisePort?.transportOptions && city.cruisePort.transportOptions.length > 0 ? (
                    <div className="flex-1 min-h-0 flex flex-col">
                      <div className="flex-1 overflow-y-auto space-y-3">
                        {(() => {
                          const transportOptions = city.cruisePort.transportOptions;
                          const totalPages = Math.ceil(transportOptions.length / transportItemsPerPage);
                          const startIndex = (transportPage - 1) * transportItemsPerPage;
                          const endIndex = startIndex + transportItemsPerPage;
                          const currentTransports = transportOptions.slice(startIndex, endIndex);

                          return currentTransports.map((transport, idx) => {
                            const Icon = getTransportIcon(transport.type as 'train' | 'bus' | 'taxi' | 'rideshare' | 'shuttle');
                            return (
                              <div key={startIndex + idx} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                                  <div className="flex-1">
                                    <h6 className="font-medium">{getTransportTranslation(transport, selectedLanguage, 'name')}</h6>
                                    <div className="text-sm text-muted-foreground space-y-1 mt-1">
                                      <p>{getTransportTranslation(transport, selectedLanguage, 'from')} → {getTransportTranslation(transport, selectedLanguage, 'to')}</p>
                                      <p>{getTransportTranslation(transport, selectedLanguage, 'duration')} • {getTransportTranslation(transport, selectedLanguage, 'price')}</p>
                                      {transport.tips && (
                                        <p className="text-xs mt-2 italic">{getTransportTranslation(transport, selectedLanguage, 'tips')}</p>
                                      )}
                                    </div>
                                    {transport.bookingUrl && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 gap-2"
                                        onClick={() => window.open(transport.bookingUrl, '_blank', 'noopener,noreferrer')}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        {t('bookNow', selectedLanguage)}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Pagination Controls for Transport */}
                      {city.cruisePort.transportOptions.length > transportItemsPerPage && (
                        <div className="flex items-center justify-between pt-3 border-t mt-3 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTransportPage(prev => Math.max(1, prev - 1))}
                            disabled={transportPage === 1}
                            className={`gap-1 ${transportPage > 1 ? 'animate-blink' : ''}`}
                            data-testid="button-transport-prev-page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            {t('previous', selectedLanguage)}
                          </Button>
                          
                          <span className="text-sm text-muted-foreground" data-testid="text-transport-page-info">
                            {transportPage} / {Math.ceil(city.cruisePort.transportOptions.length / transportItemsPerPage)}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTransportPage(prev => Math.min(Math.ceil((city?.cruisePort?.transportOptions?.length || 0) / transportItemsPerPage), prev + 1))}
                            disabled={transportPage === Math.ceil((city?.cruisePort?.transportOptions?.length || 0) / transportItemsPerPage)}
                            className={`gap-1 ${transportPage < Math.ceil((city?.cruisePort?.transportOptions?.length || 0) / transportItemsPerPage) ? 'animate-blink' : ''}`}
                            data-testid="button-transport-next-page"
                          >
                            {t('next', selectedLanguage)}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <Bus className="w-12 h-12 mb-3 opacity-50 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {t('noTransportOptions', selectedLanguage)}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tips" className="mt-4 overflow-y-auto flex-1">
                  {city.cruisePort.tips && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {getCruisePortTranslation(city.cruisePort, selectedLanguage, 'tips')}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          {/* Landmark List Tab */}
          <TabsContent value="list" className="mt-4 flex flex-col flex-1">
            {/* Tour Route Section - Scrollable */}
            {tourStops.length > 0 && (
              <div className="pb-3 mb-3 border-b flex-shrink-0">
                <div className="mb-3">
                  <h5 className="font-semibold flex items-center gap-2 mb-2">
                    <MapPinned className="w-4 h-4 text-primary" />
                    {t('tourRoute', selectedLanguage)} ({tourStops.length})
                  </h5>
                  {tourStops.length >= 2 && tourRouteInfo && (
                    <div className="bg-[hsl(14,85%,55%)]/10 border border-[hsl(14,85%,55%)]/30 rounded-lg p-2.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{selectedLanguage === 'ko' ? '이동' : 'Travel'}</span>
                            <span className="text-sm font-semibold text-[hsl(14,85%,55%)]">
                              {tourRouteInfo.distance.toFixed(1)}km
                            </span>
                          </div>
                          <div className="w-px h-4 bg-border"></div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">{selectedLanguage === 'ko' ? '소요' : 'Time'}</span>
                            <span className="text-sm font-semibold text-[hsl(14,85%,55%)]">
                              {Math.round(tourRouteInfo.duration)}min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[hsl(14,85%,55%)] text-white px-2.5 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{selectedLanguage === 'ko' ? '전체' : 'Total'}</span>
                          <span className="text-sm font-bold">
                            {(() => {
                              const totalMinutes = Math.round(tourRouteInfo.duration + (tourStops.length * tourTimePerStop));
                              const hours = Math.floor(totalMinutes / 60);
                              const mins = totalMinutes % 60;
                              return hours > 0 ? `${hours}h ${mins}m` : `${totalMinutes}min`;
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        * {selectedLanguage === 'ko' ? `각 장소 약 ${tourTimePerStop}분 체류 포함` : `Includes ${tourTimePerStop}min per stop`}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {(() => {
                    const totalPages = Math.ceil(tourStops.length / tourItemsPerPage);
                    const startIndex = (tourPage - 1) * tourItemsPerPage;
                    const endIndex = startIndex + tourItemsPerPage;
                    const currentTourStops = tourStops.slice(startIndex, endIndex);
                    
                    return (
                      <>
                        {currentTourStops.map((stop, idx) => {
                          const index = startIndex + idx;
                          // Determine category color
                          const getCategoryColor = (category: string) => {
                            if (category === 'Activity') return 'hsl(210, 85%, 55%)'; // Blue
                            if (category === 'Restaurant') return 'hsl(25, 95%, 55%)'; // Orange
                            if (category === 'Gift Shop') return 'hsl(45, 90%, 55%)'; // Gold
                            return 'hsl(14, 85%, 55%)'; // Terracotta (default for landmarks)
                          };
                          
                          const categoryColor = getCategoryColor(stop.category || '');
                          
                          return (
                            <div key={stop.id}>
                              <div
                                className="p-2 rounded-lg flex items-center gap-2 cursor-pointer hover-elevate"
                                style={{ backgroundColor: categoryColor }}
                                onClick={() => onLandmarkSelect?.(stop)}
                                data-testid={`tour-stop-${stop.id}`}
                              >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/90 text-xs font-bold"
                                  style={{ color: categoryColor }}>
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-white">
                                    {getTranslatedContent(stop, selectedLanguage, 'name')}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-white hover:bg-white/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onLandmarkSelect?.(stop);
                                    }}
                                    data-testid={`button-tour-stop-info-${stop.id}`}
                                  >
                                    <Info className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-white hover:bg-white/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveTourStop?.(stop.id);
                                    }}
                                    data-testid={`button-tour-stop-remove-${stop.id}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              {tourRouteInfo?.segments && tourRouteInfo.segments[index] && (
                                <div className="flex items-center gap-2 pl-9 py-1.5">
                                  <div className="flex items-center gap-1.5 text-xs bg-[hsl(14,85%,55%)]/10 border border-[hsl(14,85%,55%)]/20 rounded-md px-2 py-0.5">
                                    <span className="text-[hsl(14,85%,55%)] font-bold text-sm">↓</span>
                                    <span className="font-medium text-[hsl(14,85%,55%)]">
                                      {(tourRouteInfo.segments[index].distance / 1000).toFixed(1)}km
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="font-medium text-[hsl(14,85%,55%)]">
                                      {Math.ceil(tourRouteInfo.segments[index].duration / 60)}min
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Tour Pagination */}
                        {tourStops.length > tourItemsPerPage && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTourPage(prev => Math.max(1, prev - 1))}
                              disabled={tourPage === 1}
                              className={`gap-1 h-7 text-xs ${tourPage > 1 ? 'animate-blink' : ''}`}
                              data-testid="button-tour-prev-page"
                            >
                              <ChevronLeft className="w-3 h-3" />
                              Prev
                            </Button>
                            
                            <span className="text-xs text-muted-foreground" data-testid="text-tour-page-info">
                              {tourPage} / {totalPages}
                            </span>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTourPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={tourPage === totalPages}
                              className={`gap-1 h-7 text-xs ${tourPage < totalPages ? 'animate-blink' : ''}`}
                              data-testid="button-tour-next-page"
                            >
                              Next
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* Paginated list - Takes remaining space */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div ref={listScrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredListLandmarks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <List className="w-12 h-12 mb-3 opacity-50 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('noLandmarksFound', selectedLanguage)}
                    </p>
                  </div>
                ) : (() => {
                  const totalPages = Math.ceil(filteredListLandmarks.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentItems = filteredListLandmarks.slice(startIndex, endIndex);

                  return currentItems.map(({ landmark, distance }) => (
                    <div
                      key={landmark.id}
                      className="p-3 bg-muted/30 rounded-lg hover-elevate cursor-pointer"
                      onClick={() => onLandmarkSelect?.(landmark)}
                      data-testid={`card-landmark-${landmark.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {landmark.category === 'Activity' ? (
                              <Activity className="w-4 h-4 text-[hsl(195,85%,50%)]" />
                            ) : landmark.category === 'Restaurant' ? (
                              <Utensils className="w-4 h-4 text-[hsl(195,85%,50%)]" />
                            ) : (
                              <LandmarkIcon className="w-4 h-4 text-primary" />
                            )}
                            <h4 className="font-medium text-sm" data-testid={`text-landmark-name-${landmark.id}`}>
                              {getTranslatedContent(landmark, selectedLanguage, 'name')}
                            </h4>
                            {spokenLandmarks.has(landmark.id) && (
                              <Volume2 className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          {distance !== null && (
                            <p className="text-xs text-muted-foreground">
                              {formatDistance(distance)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLandmarkSelect?.(landmark);
                            }}
                            className="h-8 w-8"
                            data-testid={`button-info-${landmark.id}`}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLandmarkRoute(landmark);
                              setIsMinimized(true);
                            }}
                            className="h-8 w-8"
                            data-testid={`button-navigate-${landmark.id}`}
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Pagination Controls */}
              {filteredListLandmarks.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-3 border-t mt-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`gap-1 ${currentPage > 1 ? 'animate-blink' : ''}`}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('previous', selectedLanguage)}
                  </Button>
                  
                  <span className="text-sm text-muted-foreground" data-testid="text-page-info">
                    {currentPage} / {Math.ceil(filteredListLandmarks.length / itemsPerPage)}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredListLandmarks.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredListLandmarks.length / itemsPerPage)}
                    className={`gap-1 ${currentPage < Math.ceil(filteredListLandmarks.length / itemsPerPage) ? 'animate-blink' : ''}`}
                    data-testid="button-next-page"
                  >
                    {t('next', selectedLanguage)}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <LandmarkDetailDialog
        landmark={selectedLandmark}
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          if (tourAddedInDialog) {
            setActiveTab('list');
            setTourAddedInDialog(false);
          }
          onLandmarkClose();
        }}
        onNavigate={onNavigate}
        onAddToTour={onAddToTour ? (landmark) => {
          onAddToTour(landmark);
          setTourAddedInDialog(true);
        } : undefined}
        isInTour={isInTour}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );

  if (!selectedLandmark && !showCruisePort && landmarks.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Schedule Button - Always visible */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '9px',
          transform: 'translateX(calc(-50% - 20px))',
          zIndex: 1002
        }}
        onClick={() => {
          if (isMinimized) {
            setActiveTab('list');
            setIsMinimized(false);
          } else {
            setIsMinimized(true);
          }
        }}
        data-testid="button-floating-schedule"
      >
        <div className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center cursor-pointer shadow-lg">
          <MapPinned className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
      
      {/* Main Card */}
      {isMinimized ? null : renderFullCard()}
    </>
  );
}
