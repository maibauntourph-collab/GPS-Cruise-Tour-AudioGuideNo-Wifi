import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark } from '@shared/schema';
import { Navigation, MapPin, Calendar, User, X, Play, Pause, Volume2, Ticket, ExternalLink, Minus, MapPinned } from 'lucide-react';
import { PhotoGallery } from './PhotoGallery';
import { getTranslatedContent, t } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface LandmarkPanelProps {
  landmark: Landmark | null;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  selectedLanguage?: string;
  onMapMarkerClick?: (lat: number, lng: number) => void;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;
}

export function LandmarkPanel({
  landmark,
  onClose,
  onNavigate,
  selectedLanguage = 'en',
  onMapMarkerClick,
  onAddToTour,
  isInTour = false
}: LandmarkPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastCardHeight, setLastCardHeight] = useState(600); // Track card height before minimizing
  const [isCentered, setIsCentered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stop audio when landmark changes or component unmounts
    return () => {
      audioService.stop();
      setIsPlaying(false);
    };
  }, [landmark?.id]);

  useEffect(() => {
    // Stop audio when language changes
    audioService.stop();
    setIsPlaying(false);
  }, [selectedLanguage]);

  // Clamp translate values to keep element within bounds
  const clampTranslate = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate max offsets from center (50%)
    const maxX = (viewportWidth - elementWidth) / 2;
    const maxY = (viewportHeight - elementHeight) / 2;
    
    return {
      x: Math.max(-maxX, Math.min(x, maxX)),
      y: Math.max(-maxY, Math.min(y, maxY))
    };
  }, []);

  // Center card on initial mount - already centered with left/top: 50% and transform: -50%
  useEffect(() => {
    if (!isCentered && landmark) {
      setTranslate({ x: 0, y: 0 });
      setIsCentered(true);
    }
  }, [landmark, isCentered]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!cardRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setHasMoved(true);
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    const cardWidth = cardRef.current.offsetWidth;
    const cardHeight = cardRef.current.offsetHeight;
    
    const clamped = clampTranslate(newX, newY, cardWidth, cardHeight);
    setTranslate(clamped);
  }, [dragStart.x, dragStart.y, clampTranslate]);

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

  const handleStart = (e: ReactMouseEvent | ReactTouchEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.closest('button') || 
        target.closest('[class*="leaflet"]') || 
        target.closest('[data-no-drag]')) {
      return;
    }
    
    if (!target.closest('[data-drag-handle]')) {
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

  const handleCardClick = () => {
    setZIndex(3000);
  };

  if (!landmark) return null;

  const handleNavigate = () => {
    onNavigate(landmark);
  };

  const handlePlayPause = () => {
    const detailedText = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
    
    if (!detailedText) {
      return;
    }

    if (isPlaying) {
      if (audioService.isPaused()) {
        audioService.resumeSpeech();
      } else {
        audioService.pauseSpeech();
      }
    } else {
      audioService.playText(detailedText, selectedLanguage, playbackRate, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setPlaybackRate(newRate);
    audioService.setRate(newRate);
    
    if (isPlaying && !audioService.isPaused()) {
      const detailedText = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
      if (detailedText) {
        audioService.playText(detailedText, selectedLanguage, newRate, () => {
          setIsPlaying(false);
        });
      }
    }
  };

  // Render minimized floating icon
  const renderMinimizedIcon = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'pointer',
        userSelect: 'none',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onMouseUp={(e) => {
        handleMouseUp();
        if (!hasMoved) {
          const fullCardWidth = 384;
          const fullCardHeight = lastCardHeight || Math.min(window.innerHeight - 32, 688);
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
          const fullCardHeight = lastCardHeight || Math.min(window.innerHeight - 32, 688);
          const clamped = clampTranslate(translate.x, translate.y, fullCardWidth, fullCardHeight);
          setTranslate(clamped);
          setIsMinimized(false);
          setZIndex(3000);
        }
      }}
      data-testid="icon-landmark-minimized"
      data-drag-handle
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-500 dark:from-primary dark:to-orange-600 flex items-center justify-center shadow-lg hover-elevate active-elevate-2 border-2 border-white dark:border-gray-800">
          <MapPinned className="w-7 h-7 text-white" />
        </div>
        <div className="absolute inset-0 w-14 h-14 rounded-full bg-primary/40 animate-ping opacity-20"></div>
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
        width: '24rem',
        maxHeight: 'calc(100vh - 32px)',
        userSelect: 'none',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      onClick={handleCardClick}
      data-testid="card-landmark-container"
    >
      <Card className="p-4 bg-background border overflow-y-auto max-h-[calc(100vh-32px)]" data-testid="panel-landmark-details">
        {/* Header */}
        <div 
          className="flex items-start justify-between mb-3"
          data-drag-handle
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl mb-1 truncate" data-testid="text-landmark-name">
              {getTranslatedContent(landmark, selectedLanguage, 'name')}
            </h2>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {landmark.category}
              {landmark.category && ' - '}
              {getTranslatedContent(landmark, selectedLanguage, 'description')?.slice(0, 60)}...
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                // Save current card height before minimizing
                if (cardRef.current) {
                  setLastCardHeight(cardRef.current.offsetHeight);
                }
                setIsMinimized(true);
              }}
              className="h-7 w-7 shrink-0"
              data-testid="button-minimize-landmark"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-7 w-7 shrink-0"
              data-testid="button-close-panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {landmark.category && (
            <Badge variant="secondary" data-testid="badge-category" className="text-xs">
              {landmark.category}
            </Badge>
          )}
          {landmark.yearBuilt && (
            <Badge variant="outline" className="gap-1 text-xs" data-testid="badge-year">
              <Calendar className="w-3 h-3" />
              {landmark.yearBuilt}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {/* Photo Gallery */}
          {landmark.photos && landmark.photos.length > 0 && (
            <div data-no-drag>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" />
                {t('photos', selectedLanguage)}
              </h3>
              <PhotoGallery
                photos={landmark.photos}
                title={getTranslatedContent(landmark, selectedLanguage, 'name')}
              />
            </div>
          )}

          {/* Map View */}
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              {t('location', selectedLanguage)}
            </h3>
            <div className="rounded-md overflow-hidden border h-32" data-testid="map-landmark-location" data-no-drag>
              <MapContainer
                key={landmark.id}
                center={[landmark.lat, landmark.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                zoomControl={true}
                dragging={!isDragging}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[landmark.lat, landmark.lng]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background: ${landmark.category === 'Activity' ? 'hsl(195, 85%, 50%)' : 'hsl(14, 85%, 55%)'}; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                  })}
                  eventHandlers={{
                    click: () => {
                      if (onMapMarkerClick) {
                        onMapMarkerClick(landmark.lat, landmark.lng);
                      }
                    }
                  }}
                >
                  <Popup>
                    <strong className="text-xs">{getTranslatedContent(landmark, selectedLanguage, 'name')}</strong>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>

          {/* Description */}
          {getTranslatedContent(landmark, selectedLanguage, 'description') && (
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('category', selectedLanguage)}</h3>
              <p className="text-sm text-muted-foreground" data-testid="text-description">
                {getTranslatedContent(landmark, selectedLanguage, 'description')}
              </p>
            </div>
          )}

          {/* Historical Info */}
          {getTranslatedContent(landmark, selectedLanguage, 'historicalInfo') && (
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('historicalInfo', selectedLanguage)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-historical-info">
                {getTranslatedContent(landmark, selectedLanguage, 'historicalInfo')}
              </p>
            </div>
          )}

          {/* Architect */}
          {landmark.architect && (
            <div>
              <h3 className="font-semibold text-sm mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-primary" />
                {t('architect', selectedLanguage)}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-architect">
                {landmark.architect}
              </p>
            </div>
          )}

          {/* Audio Controls */}
          {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') && (
            <div className="p-3 bg-muted/30 rounded-md">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-primary" />
                {t('detailedInformation', selectedLanguage)}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPause();
                  }}
                  className="gap-1 text-xs h-8"
                  data-testid="button-audio-play"
                >
                  {isPlaying && !audioService.isPaused() ? (
                    <>
                      <Pause className="w-3 h-3" />
                      {t('pause', selectedLanguage)}
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      {audioService.isPaused() ? t('resume', selectedLanguage) : t('playAudio', selectedLanguage)}
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">{playbackRate.toFixed(1)}x</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <Button
                    key={rate}
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateChange([rate]);
                    }}
                    className={`text-xs px-2 h-6 ${playbackRate === rate ? 'bg-primary text-primary-foreground' : ''}`}
                    data-testid={`button-speed-${rate}`}
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-detailed-description">
                {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')}
              </p>
            </div>
          )}

          {/* Booking */}
          <div className="p-3 bg-muted/30 rounded-md">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Ticket className="w-3 h-3 text-primary" />
              {t('bookTickets', selectedLanguage)}
            </h3>
            <div className="flex flex-col gap-1">
              {['GetYourGuide', 'Viator', 'Klook'].map((platform) => (
                <Button
                  key={platform}
                  variant="outline"
                  size="sm"
                  className="justify-start gap-1 text-xs h-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                    const urls = {
                      'GetYourGuide': `https://www.getyourguide.com/s/?q=${searchQuery}`,
                      'Viator': `https://www.viator.com/searchResults/all?text=${searchQuery}`,
                      'Klook': `https://www.klook.com/en-US/search/?query=${searchQuery}`
                    };
                    window.open(urls[platform as keyof typeof urls], '_blank', 'noopener,noreferrer');
                  }}
                  data-testid={`button-book-${platform.toLowerCase()}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  {t('bookOn', selectedLanguage)} {platform}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              className="flex-1 gap-1 text-xs h-9"
              data-testid="button-navigate-panel"
            >
              <Navigation className="w-3 h-3" />
              {t('getDirections', selectedLanguage)}
            </Button>
            {onAddToTour && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToTour(landmark);
                }}
                variant={isInTour ? "secondary" : "outline"}
                className="flex-1 gap-1 text-xs h-9"
                data-testid={`button-tour-panel-${landmark.id}`}
              >
                {isInTour ? 'Remove' : 'Add to Tour'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
