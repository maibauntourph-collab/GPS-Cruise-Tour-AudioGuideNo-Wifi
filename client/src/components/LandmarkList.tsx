import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark, GpsPosition } from '@shared/schema';
import { Navigation, MapPin, Volume2, Info, Activity, Landmark as LandmarkIcon, Minus, List } from 'lucide-react';
import { calculateDistance, formatDistance } from '@/lib/geoUtils';
import { getTranslatedContent, t } from '@/lib/translations';

interface LandmarkListProps {
  landmarks: Landmark[];
  userPosition: GpsPosition | null;
  onLandmarkRoute: (landmark: Landmark) => void;
  spokenLandmarks: Set<string>;
  selectedLanguage?: string;
  onLandmarkSelect?: (landmark: Landmark) => void;
}

export function LandmarkList({
  landmarks,
  userPosition,
  onLandmarkRoute,
  spokenLandmarks,
  selectedLanguage = 'en',
  onLandmarkSelect,
}: LandmarkListProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      return { x: isMobile ? 0 : window.innerWidth - 400, y: 0 };
    }
    return { x: 0, y: 0 };
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastCardHeight, setLastCardHeight] = useState(320);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const clampTranslate = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const maxX = viewportWidth - elementWidth - 32;
    const maxY = viewportHeight - elementHeight - 32;
    
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!cardRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setHasMoved(true);
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
    const cardWidth = cardRef.current.offsetWidth;
    const cardHeight = cardRef.current.offsetHeight;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const maxX = viewportWidth - cardWidth - 32;
    const maxY = viewportHeight - cardHeight - 32;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    setTranslate({ x: clampedX, y: clampedY });
  }, [dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const options = { passive: false };
      window.addEventListener('mousemove', handleMouseMove as EventListener);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove as EventListener, options);
      window.addEventListener('touchend', handleMouseUp, options);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove as EventListener);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    if (target.closest('button') || !target.closest('[data-drag-handle]')) {
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

  const renderMinimizedIcon = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        right: '16px',
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
          const fullCardHeight = lastCardHeight || Math.min(window.innerHeight - 32, 320);
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
          const fullCardHeight = lastCardHeight || Math.min(window.innerHeight - 32, 320);
          const clamped = clampTranslate(translate.x, translate.y, fullCardWidth, fullCardHeight);
          setTranslate(clamped);
          setIsMinimized(false);
          setZIndex(3000);
        }
      }}
      data-testid="icon-landmarklist-minimized"
      data-drag-handle
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-500 dark:from-primary dark:to-orange-600 flex items-center justify-center shadow-lg hover-elevate active-elevate-2 border-2 border-white dark:border-gray-800">
          <List className="w-7 h-7 text-white" />
        </div>
        <div className="absolute inset-0 w-14 h-14 rounded-full bg-primary/40 animate-ping opacity-20"></div>
      </div>
    </div>
  );

  const renderFullCard = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '16px',
        top: '16px',
        zIndex,
        width: '24rem',
        maxHeight: 'calc(100vh - 32px)',
        userSelect: 'none',
        transform: `translate(${translate.x}px, ${translate.y}px)`
      }}
      onClick={handleCardClick}
      data-testid="card-landmarklist-container"
    >
      <Card className="backdrop-blur-md bg-background/90 border-2 shadow-xl max-h-80 overflow-y-auto">
        <div 
          className="p-4 border-b flex items-center justify-between"
          data-drag-handle
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t('landmarks', selectedLanguage)}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (cardRef.current) {
                setLastCardHeight(cardRef.current.offsetHeight);
              }
              setIsMinimized(true);
            }}
            className="h-7 w-7 shrink-0"
            data-testid="button-minimize-landmarklist"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>
        <div className="divide-y">
          {sortedLandmarks.map(({ landmark, distance }) => (
            <div 
              key={landmark.id} 
              className="p-4 hover-elevate cursor-pointer" 
              data-testid={`card-landmark-${landmark.id}`}
              onClick={() => onLandmarkSelect?.(landmark)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {landmark.category === 'Activity' ? (
                      <Activity className="w-4 h-4 shrink-0" style={{ color: 'hsl(195, 85%, 50%)' }} />
                    ) : (
                      <LandmarkIcon className="w-4 h-4 shrink-0" style={{ color: 'hsl(14, 85%, 55%)' }} />
                    )}
                    <h4 className="font-serif font-semibold truncate">
                      {getTranslatedContent(landmark, selectedLanguage, 'name')}
                    </h4>
                    {spokenLandmarks.has(landmark.id) && (
                      <Badge variant="secondary" className="gap-1 shrink-0">
                        <Volume2 className="w-3 h-3" />
                        {t('heard', selectedLanguage)}
                      </Badge>
                    )}
                  </div>
                  {getTranslatedContent(landmark, selectedLanguage, 'description') && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {getTranslatedContent(landmark, selectedLanguage, 'description')}
                    </p>
                  )}
                  {distance !== null && (
                    <p className="text-sm font-medium text-primary">
                      {formatDistance(distance)} {t('away', selectedLanguage)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLandmarkSelect?.(landmark);
                    }}
                    data-testid={`button-info-${landmark.id}`}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLandmarkRoute(landmark);
                    }}
                    data-testid={`button-navigate-${landmark.id}`}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
