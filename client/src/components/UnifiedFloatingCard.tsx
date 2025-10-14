import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Minus, MapPin, Ship, List, Navigation, Info, Volume2, Activity, Landmark as LandmarkIcon, Play, Pause, Volume2 as AudioIcon, Ticket, ExternalLink, MapPinned, Train, Bus, Car, Clock, Anchor, Utensils, Euro, ChefHat, Phone } from 'lucide-react';
import { Landmark, City, GpsPosition, CruisePort, TransportOption } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import { calculateDistance, formatDistance } from '@/lib/geoUtils';
import { audioService } from '@/lib/audioService';
import { PhotoGallery } from './PhotoGallery';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface UnifiedFloatingCardProps {
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
  onToggleLandmarks: () => void;
  onToggleActivities: () => void;
  onToggleRestaurants: () => void;
  
  // Tour Route props
  tourStops?: Landmark[];
  tourRouteInfo?: { distance: number; duration: number } | null;
  onRemoveTourStop?: (landmarkId: string) => void;
  
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

export function UnifiedFloatingCard({
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
  onToggleLandmarks,
  onToggleActivities,
  onToggleRestaurants,
  tourStops = [],
  tourRouteInfo = null,
  onRemoveTourStop,
  selectedLanguage = 'en',
  onMapMarkerClick
}: UnifiedFloatingCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('landmark');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const cardRef = useRef<HTMLDivElement>(null);
  const zIndexTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine which tab to show
  useEffect(() => {
    if (selectedLandmark) {
      setActiveTab('landmark');
    } else if (showCruisePort && city?.cruisePort) {
      setActiveTab('cruise');
    } else {
      setActiveTab('list');
    }
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

  useEffect(() => {
    if (!isCentered) {
      setTranslate({ x: 0, y: 0 });
      setIsCentered(true);
    }
  }, [isCentered]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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

  const handleCardClick = (e: React.MouseEvent) => {
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
  const filteredListLandmarks = sortedLandmarks.filter(({ landmark }) => {
    const isActivity = landmark.category === 'Activity';
    const isRestaurant = landmark.category === 'Restaurant';
    if (isActivity) return showActivities;
    if (isRestaurant) return showRestaurants;
    return showLandmarks;
  });

  // Render minimized icon
  const renderMinimizedIcon = () => (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      onClick={() => setIsMinimized(false)}
      data-testid="button-restore-unified-card"
    >
      <div className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center cursor-pointer shadow-lg animate-pulse">
        {activeTab === 'landmark' && <MapPin className="w-6 h-6 text-primary-foreground" />}
        {activeTab === 'cruise' && <Ship className="w-6 h-6 text-primary-foreground" />}
        {activeTab === 'list' && <List className="w-6 h-6 text-primary-foreground" />}
      </div>
    </div>
  );

  // Render full card
  const renderFullCard = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        width: '28rem',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 32px)',
        userSelect: 'none',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={handleCardClick}
      data-testid="card-unified-floating-container"
    >
      <Card className="p-4 flex flex-col h-full" data-testid="card-unified-floating">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <h3 className="font-semibold text-lg flex-1" data-testid="text-unified-card-title">
            {t('infoPanel', selectedLanguage)}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="h-6 w-6"
            data-testid="button-minimize-unified"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (selectedLandmark) {
                onLandmarkClose();
              } else if (showCruisePort && onCruisePortClose) {
                onCruisePortClose();
              }
            }}
            className="h-6 w-6"
            data-testid="button-close-unified"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger 
              value="landmark" 
              data-testid="tab-landmark"
            >
              <MapPin className="w-4 h-4 mr-1" />
              {t('tour', selectedLanguage)}
            </TabsTrigger>
            <TabsTrigger 
              value="cruise" 
              disabled={!city?.cruisePort}
              data-testid="tab-cruise"
            >
              <Ship className="w-4 h-4 mr-1" />
              {t('cruisePort', selectedLanguage)}
            </TabsTrigger>
            <TabsTrigger value="list" data-testid="tab-list">
              <List className="w-4 h-4 mr-1" />
              {t('list', selectedLanguage)}
            </TabsTrigger>
          </TabsList>

          {/* Tour Tab with filters */}
          <TabsContent value="landmark" className="mt-4 flex flex-col flex-1">
            {/* Filter buttons - Fixed at top */}
            <div className="flex gap-2 flex-wrap pb-3 flex-shrink-0">
              <Button
                variant={showLandmarks ? "default" : "outline"}
                size="sm"
                onClick={onToggleLandmarks}
                className="gap-1"
                data-testid="button-tour-filter-landmarks"
              >
                <LandmarkIcon className="w-4 h-4" />
                {t('landmarks', selectedLanguage)}
              </Button>
              <Button
                variant={showActivities ? "default" : "outline"}
                size="sm"
                onClick={onToggleActivities}
                className={`gap-1 ${showActivities ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
                data-testid="button-tour-filter-activities"
              >
                <Activity className="w-4 h-4" />
                {t('activities', selectedLanguage)}
              </Button>
              <Button
                variant={showRestaurants ? "default" : "outline"}
                size="sm"
                onClick={onToggleRestaurants}
                className={`gap-1 ${showRestaurants ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
                data-testid="button-tour-filter-restaurants"
              >
                <Utensils className="w-4 h-4" />
                {t('restaurants', selectedLanguage)}
              </Button>
            </div>

            {/* Scrollable content - Contains both selected landmark and list */}
            <div className="flex-1 overflow-y-auto space-y-4">
            {selectedLandmark && (
              <div className="space-y-4 pb-4 border-b">{/* Selected landmark details */}
                <div>
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

                <div className="pt-3 border-t space-y-2">
                  <Button
                    onClick={() => onNavigate(selectedLandmark)}
                    className="w-full gap-2"
                    data-testid="button-get-directions"
                  >
                    <Navigation className="w-4 h-4" />
                    {t('getDirections', selectedLanguage)}
                  </Button>
                  
                  {onAddToTour && (
                    <Button
                      onClick={() => onAddToTour(selectedLandmark)}
                      variant="outline"
                      className="w-full gap-2"
                      disabled={isInTour}
                      data-testid="button-add-to-tour"
                    >
                      <MapPinned className="w-4 h-4" />
                      {isInTour ? t('inTour', selectedLanguage) : t('addToTour', selectedLanguage)}
                    </Button>
                  )}
                </div>

                {selectedLandmark.category === 'Activity' && (
                  <div className="pt-3 border-t">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      {t('bookTicketsTours', selectedLanguage)}
                    </h5>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => {
                          const searchQuery = encodeURIComponent(getTranslatedContent(selectedLandmark, selectedLanguage, 'name'));
                          window.open(`https://www.getyourguide.com/s/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
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
                          window.open(`https://www.viator.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                        }}
                        data-testid="button-book-viator"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('bookOnViator', selectedLanguage)}
                      </Button>
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

                const renderSection = (category: string, items: typeof filteredListLandmarks, title: string, icon: React.ReactNode) => {
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
              <Tabs defaultValue="info" className="w-full flex flex-col flex-1">
                <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                  <TabsTrigger value="info">{t('cruiseInfo', selectedLanguage)}</TabsTrigger>
                  <TabsTrigger value="transport">{t('transportation', selectedLanguage)}</TabsTrigger>
                  <TabsTrigger value="tips">{t('tips', selectedLanguage)}</TabsTrigger>
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

                <TabsContent value="transport" className="mt-4 overflow-y-auto flex-1">
                  {city?.cruisePort?.transportOptions && city.cruisePort.transportOptions.length > 0 && (
                    <div className="space-y-4">
                      {(() => {
                        const transportOptions = city.cruisePort.transportOptions;
                        const transportsByType = transportOptions.reduce((acc, transport) => {
                          const type = transport.type;
                          if (!acc[type]) acc[type] = [];
                          acc[type].push(transport);
                          return acc;
                        }, {} as Record<string, TransportOption[]>);

                        const renderTransportSection = (type: string, transports: TransportOption[], title: string) => {
                          if (transports.length === 0) return null;
                          const Icon = getTransportIcon(type as 'train' | 'bus' | 'taxi' | 'rideshare' | 'shuttle');
                          
                          return (
                            <div key={type} className="space-y-2">
                              <h5 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                                <Icon className="w-4 h-4 text-primary" />
                                {title}
                              </h5>
                              {transports.map((transport, idx) => (
                                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-start gap-3">
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
                              ))}
                            </div>
                          );
                        };

                        return (
                          <>
                            {renderTransportSection('train', transportsByType['train'] || [], t('trainSection', selectedLanguage))}
                            {renderTransportSection('bus', transportsByType['bus'] || [], t('busSection', selectedLanguage))}
                            {renderTransportSection('shuttle', transportsByType['shuttle'] || [], t('shuttleSection', selectedLanguage))}
                            {renderTransportSection('rideshare', transportsByType['rideshare'] || [], t('rideshareSection', selectedLanguage))}
                            {renderTransportSection('taxi', transportsByType['taxi'] || [], t('taxiSection', selectedLanguage))}
                          </>
                        );
                      })()}
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
            {/* Tour Route Section - Fixed at top */}
            {tourStops.length > 0 && (
              <div className="pb-3 mb-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-primary" />
                    {t('tourRoute', selectedLanguage)} ({tourStops.length})
                  </h5>
                  {tourRouteInfo && (
                    <Badge variant="outline" className="text-xs">
                      {tourRouteInfo.distance.toFixed(1)}km • {Math.round(tourRouteInfo.duration)}min
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {tourStops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="p-2 bg-primary/5 rounded-lg flex items-center gap-2"
                      data-testid={`tour-stop-${stop.id}`}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getTranslatedContent(stop, selectedLanguage, 'name')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onLandmarkSelect?.(stop)}
                          data-testid={`button-tour-stop-info-${stop.id}`}
                        >
                          <Info className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRemoveTourStop?.(stop.id)}
                          data-testid={`button-tour-stop-remove-${stop.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Filter buttons */}
            <div className="flex gap-2 flex-wrap pb-3 flex-shrink-0">
              <Button
                variant={showLandmarks ? "default" : "outline"}
                size="sm"
                onClick={onToggleLandmarks}
                className="gap-1"
                data-testid="button-filter-landmarks"
              >
                <LandmarkIcon className="w-4 h-4" />
                {t('landmarks', selectedLanguage)}
              </Button>
              <Button
                variant={showActivities ? "default" : "outline"}
                size="sm"
                onClick={onToggleActivities}
                className={`gap-1 ${showActivities ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
                data-testid="button-filter-activities"
              >
                <Activity className="w-4 h-4" />
                {t('activities', selectedLanguage)}
              </Button>
              <Button
                variant={showRestaurants ? "default" : "outline"}
                size="sm"
                onClick={onToggleRestaurants}
                className={`gap-1 ${showRestaurants ? '!bg-[hsl(195,85%,50%)] hover:!bg-[hsl(195,85%,45%)] !border-[hsl(195,85%,50%)] text-white' : ''}`}
                data-testid="button-filter-restaurants"
              >
                <Utensils className="w-4 h-4" />
                {t('restaurants', selectedLanguage)}
              </Button>
            </div>
            
            {/* Scrollable list - Takes remaining space */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredListLandmarks.map(({ landmark, distance }) => (
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
                        }}
                        className="h-8 w-8"
                        data-testid={`button-navigate-${landmark.id}`}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );

  if (!selectedLandmark && !showCruisePort && landmarks.length === 0) {
    return null;
  }

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
