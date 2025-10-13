import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anchor, MapPin, Clock, Info, Ship, X, Minus, Train, Bus, Car, ExternalLink } from 'lucide-react';
import { City, Landmark, CruisePort, TransportOption } from '@shared/schema';
import { t, getTranslatedContent } from '@/lib/translations';

interface CruisePortInfoProps {
  city: City;
  landmarks: Landmark[];
  selectedLanguage: string;
  onLandmarkClick: (landmarkId: string) => void;
  onClose?: () => void;
}

function getCruisePortTranslation(cruisePort: CruisePort, language: string, field: 'portName' | 'distanceFromCity' | 'recommendedDuration' | 'tips'): string {
  if (cruisePort.translations?.[language]?.[field]) {
    return cruisePort.translations[language][field] as string;
  }
  // Fallback to default
  return cruisePort[field] || '';
}

function getTransportTranslation(transport: TransportOption, language: string, field: 'name' | 'from' | 'to' | 'duration' | 'frequency' | 'price' | 'tips'): string {
  if (transport.translations?.[language]?.[field]) {
    return transport.translations[language][field] as string;
  }
  // Fallback to default
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
      return Car;
    case 'rideshare':
      return Car;
    default:
      return Car;
  }
}

export function CruisePortInfo({ city, landmarks, selectedLanguage, onLandmarkClick, onClose }: CruisePortInfoProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const zIndexTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clamp translate values to keep element within bounds
  const clampTranslate = (x: number, y: number, elementWidth: number, elementHeight: number) => {
    if (!cardRef.current) return { x, y };
    
    const container = cardRef.current.offsetParent as HTMLElement;
    if (!container) return { x, y };
    
    const containerRect = container.getBoundingClientRect();
    const maxX = containerRect.width - elementWidth - 32; // 16px left + 16px right
    const maxY = containerRect.height - elementHeight - 32;
    
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    };
  };

  if (!city.cruisePort) {
    return null;
  }

  const cruisePort = city.cruisePort;
  const recommendedLandmarkIds = cruisePort.recommendedLandmarks || [];
  const recommendedLandmarks = landmarks.filter(l => recommendedLandmarkIds.includes(l.id));

  const portName = getCruisePortTranslation(cruisePort, selectedLanguage, 'portName');
  const distanceFromCity = getCruisePortTranslation(cruisePort, selectedLanguage, 'distanceFromCity');
  const recommendedDuration = getCruisePortTranslation(cruisePort, selectedLanguage, 'recommendedDuration');
  const tips = getCruisePortTranslation(cruisePort, selectedLanguage, 'tips');

  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!cardRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setHasMoved(true);
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    const container = cardRef.current.offsetParent as HTMLElement;
    if (container) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const maxX = containerRect.width - cardRect.width - 32;
      const maxY = containerRect.height - cardRect.height - 32;
      
      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));
      
      setTranslate({ x: clampedX, y: clampedY });
    } else {
      setTranslate({ x: newX, y: newY });
    }
  }, [dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as EventListener);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove as EventListener);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Prevent default to avoid ghost click on mobile
    if ('touches' in e) {
      e.preventDefault();
    }
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: clientX - translate.x,
      y: clientY - translate.y
    });
    setZIndex(3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (zIndexTimeoutRef.current) {
        clearTimeout(zIndexTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = () => {
    setZIndex(3000);
  };

  const handleLandmarkClick = (landmarkId: string) => {
    // Clear any existing timeout
    if (zIndexTimeoutRef.current) {
      clearTimeout(zIndexTimeoutRef.current);
    }
    
    // Keep z-index elevated for 2 seconds after marker click
    setZIndex(3000);
    onLandmarkClick(landmarkId);
    
    zIndexTimeoutRef.current = setTimeout(() => {
      setZIndex(1000);
      zIndexTimeoutRef.current = null;
    }, 2000);
  };

  // Render minimized floating icon
  const renderMinimizedIcon = () => (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '16px',
        top: '16px',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'pointer',
        userSelect: 'none',
        transform: `translate(${translate.x}px, ${translate.y}px)`
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onMouseUp={(e) => {
        handleMouseUp();
        if (!hasMoved) {
          const fullCardWidth = 384;
          const fullCardHeight = 500;
          const clamped = clampTranslate(translate.x, translate.y, fullCardWidth, fullCardHeight);
          setTranslate(clamped);
          setIsMinimized(false);
          setZIndex(3000);
        }
      }}
      onTouchEnd={(e) => {
        handleMouseUp();
        if (!hasMoved) {
          const fullCardWidth = 384;
          const fullCardHeight = 500;
          const clamped = clampTranslate(translate.x, translate.y, fullCardWidth, fullCardHeight);
          setTranslate(clamped);
          setIsMinimized(false);
          setZIndex(3000);
        }
      }}
      data-testid="icon-cruise-port-minimized"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 flex items-center justify-center shadow-lg hover-elevate active-elevate-2 border-2 border-white dark:border-gray-800">
          <Ship className="w-7 h-7 text-white" />
        </div>
        {/* Pulse animation */}
        <div className="absolute inset-0 w-14 h-14 rounded-full bg-blue-400 dark:bg-blue-500 animate-ping opacity-20"></div>
      </div>
    </div>
  );

  // Render full card
  const renderFullCard = () => (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        left: '16px',
        top: '16px',
        right: '16px',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        maxWidth: '24rem',
        userSelect: 'none',
        transform: `translate(${translate.x}px, ${translate.y}px)`
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={handleCardClick}
      data-testid="card-cruise-port-container"
    >
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800" data-testid="card-cruise-port-info">
        <div className="flex items-center gap-2 mb-3">
          <Ship className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-lg text-blue-900 dark:text-blue-100 flex-1" data-testid="text-cruise-port-title">
            {t('cruisePortInfo', selectedLanguage)}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            className="h-6 w-6 hover:bg-blue-200 dark:hover:bg-blue-800"
            data-testid="button-minimize-cruise-port"
          >
            <Minus className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-6 w-6 hover:bg-blue-200 dark:hover:bg-blue-800"
              data-testid="button-close-cruise-port"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">{t('overview', selectedLanguage)}</TabsTrigger>
            <TabsTrigger value="transport" data-testid="tab-transport">{t('transport', selectedLanguage)}</TabsTrigger>
            <TabsTrigger value="tips" data-testid="tab-tips">{t('tipsTab', selectedLanguage)}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Left side: Port Information */}
              <div className="flex-1 space-y-3">
                {/* Port Name */}
                <div className="flex items-start gap-2">
                  <Anchor className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('portName', selectedLanguage)}</p>
                    <p className="text-sm font-semibold" data-testid="text-port-name">{portName}</p>
                  </div>
                </div>

                {/* Distance */}
                {distanceFromCity && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('distanceFromCity', selectedLanguage)}</p>
                      <p className="text-sm" data-testid="text-port-distance">{distanceFromCity}</p>
                    </div>
                  </div>
                )}

                {/* Recommended Duration */}
                {recommendedDuration && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-1 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('recommendedDuration', selectedLanguage)}</p>
                      <p className="text-sm" data-testid="text-port-duration">{recommendedDuration}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side: Recommended Sites (vertical layout) */}
              {recommendedLandmarks.length > 0 && (
                <div className="border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 min-w-[140px]">
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    {t('recommendedSites', selectedLanguage)}
                  </p>
                  <div className="flex flex-col gap-2">
                    {recommendedLandmarks.map(landmark => (
                      <Button
                        key={landmark.id}
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLandmarkClick(landmark.id);
                        }}
                        className="text-xs hover-elevate justify-start w-full"
                        data-testid={`button-recommended-${landmark.id}`}
                      >
                        {getTranslatedContent(landmark, selectedLanguage, 'name')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transport" className="mt-3 max-h-[400px] overflow-y-auto pr-2">
            {cruisePort.transportOptions && cruisePort.transportOptions.length > 0 ? (
              <div className="space-y-3">
                {cruisePort.transportOptions.map((transport, index) => {
                  const Icon = getTransportIcon(transport.type);
                  const transportName = getTransportTranslation(transport, selectedLanguage, 'name');
                  const transportFrom = getTransportTranslation(transport, selectedLanguage, 'from');
                  const transportTo = getTransportTranslation(transport, selectedLanguage, 'to');
                  const transportDuration = getTransportTranslation(transport, selectedLanguage, 'duration');
                  const transportFrequency = getTransportTranslation(transport, selectedLanguage, 'frequency');
                  const transportPrice = getTransportTranslation(transport, selectedLanguage, 'price');
                  const transportTips = getTransportTranslation(transport, selectedLanguage, 'tips');

                  return (
                    <Card key={index} className="p-3 bg-white/50 dark:bg-gray-800/50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold text-sm">{transportName}</p>
                            {transportFrom && transportTo && (
                              <p className="text-xs text-muted-foreground">
                                {transportFrom} → {transportTo}
                              </p>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {transportDuration && (
                              <div>
                                <span className="text-muted-foreground">{t('duration', selectedLanguage)}:</span>
                                <span className="ml-1 font-medium">{transportDuration}</span>
                              </div>
                            )}
                            {transportPrice && (
                              <div>
                                <span className="text-muted-foreground">{t('price', selectedLanguage)}:</span>
                                <span className="ml-1 font-medium">{transportPrice}</span>
                              </div>
                            )}
                            {transportFrequency && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">{t('frequency', selectedLanguage)}:</span>
                                <span className="ml-1">{transportFrequency}</span>
                              </div>
                            )}
                          </div>

                          {transportTips && (
                            <p className="text-xs text-muted-foreground italic">{transportTips}</p>
                          )}

                          <div className="flex gap-2 pt-1">
                            {transport.type === 'rideshare' && cruisePort.portCoordinates && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const uberUrl = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${city.lat}&dropoff[longitude]=${city.lng}`;
                                    const fallbackUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${city.lat}&dropoff[longitude]=${city.lng}`;
                                    window.open(uberUrl, '_blank', 'noopener,noreferrer');
                                    setTimeout(() => {
                                      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
                                    }, 1000);
                                  }}
                                  className="text-xs flex items-center gap-1"
                                  data-testid="button-open-uber"
                                >
                                  <Car className="w-3 h-3" />
                                  {t('openInUber', selectedLanguage)}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const boltUrl = `bolt://riderequest?pickup=my_location&destination=${city.lat},${city.lng}`;
                                    const fallbackUrl = `https://bolt.eu`;
                                    window.open(boltUrl, '_blank', 'noopener,noreferrer');
                                    setTimeout(() => {
                                      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
                                    }, 1000);
                                  }}
                                  className="text-xs flex items-center gap-1"
                                  data-testid="button-open-bolt"
                                >
                                  <Car className="w-3 h-3" />
                                  {t('openInBolt', selectedLanguage)}
                                </Button>
                              </>
                            )}
                            {transport.bookingUrl && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(transport.bookingUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="text-xs flex items-center gap-1"
                                data-testid={`button-book-transport-${index}`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                {t('bookTransport', selectedLanguage)}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('transportOptions', selectedLanguage)}</p>
            )}
          </TabsContent>

          <TabsContent value="tips" className="mt-3">
            {tips ? (
              <div className="p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  {t('tips', selectedLanguage)}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="text-port-tips">
                  {tips}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('tips', selectedLanguage)}</p>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
