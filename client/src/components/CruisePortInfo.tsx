import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Anchor, MapPin, Clock, Info, Ship, X, Minus } from 'lucide-react';
import { City, Landmark, CruisePort } from '@shared/schema';
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
    setZIndex(2000);
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
    setZIndex(2000);
  };

  const handleLandmarkClick = (landmarkId: string) => {
    // Clear any existing timeout
    if (zIndexTimeoutRef.current) {
      clearTimeout(zIndexTimeoutRef.current);
    }
    
    // Keep z-index elevated for 2 seconds after marker click
    setZIndex(2000);
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
          setZIndex(2000);
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
          setZIndex(2000);
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

      <div className="space-y-3">
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

        {/* Recommended Sites */}
        {recommendedLandmarks.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" />
              {t('recommendedSites', selectedLanguage)}
            </p>
            <div className="flex flex-wrap gap-2">
              {recommendedLandmarks.map(landmark => (
                <Button
                  key={landmark.id}
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLandmarkClick(landmark.id);
                  }}
                  className="text-xs hover-elevate"
                  data-testid={`button-recommended-${landmark.id}`}
                >
                  {getTranslatedContent(landmark, selectedLanguage, 'name')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {tips && (
          <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              {t('tips', selectedLanguage)}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="text-port-tips">
              {tips}
            </p>
          </div>
        )}
        </div>
      </Card>
    </div>
  );

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
