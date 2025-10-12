import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Landmark } from '@shared/schema';
import { Navigation, MapPin, Calendar, User, X, Play, Pause, Volume2, Ticket, ExternalLink } from 'lucide-react';
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
    
    // If currently playing, restart with new rate
    if (isPlaying && !audioService.isPaused()) {
      const detailedText = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
      if (detailedText) {
        audioService.playText(detailedText, selectedLanguage, newRate, () => {
          setIsPlaying(false);
        });
      }
    }
  };

  return (
    <div className="bg-background border-t overflow-y-auto h-full" data-testid="panel-landmark-details">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="font-serif text-2xl mb-1" data-testid="text-landmark-name">
              {getTranslatedContent(landmark, selectedLanguage, 'name')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {landmark.category && `${landmark.category}`}
              {landmark.category && getTranslatedContent(landmark, selectedLanguage, 'description') && ' - '}
              {getTranslatedContent(landmark, selectedLanguage, 'description')?.slice(0, 100)}
              {getTranslatedContent(landmark, selectedLanguage, 'description') && '...'}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            data-testid="button-close-panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-4">
          {landmark.category && (
            <Badge variant="secondary" data-testid="badge-category">
              {landmark.category}
            </Badge>
          )}
          {landmark.yearBuilt && (
            <Badge variant="outline" className="gap-1" data-testid="badge-year">
              <Calendar className="w-3 h-3" />
              {landmark.yearBuilt}
            </Badge>
          )}
        </div>

        {/* Photo Gallery */}
        {landmark.photos && landmark.photos.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {t('photos', selectedLanguage)}
            </h3>
            <PhotoGallery 
              photos={landmark.photos} 
              title={getTranslatedContent(landmark, selectedLanguage, 'name')} 
            />
          </div>
        )}

        {/* Map View */}
        <div className="mb-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {t('location', selectedLanguage)}
          </h3>
          <div className="rounded-lg overflow-hidden border" data-testid="map-landmark-location">
            <MapContainer
              key={landmark.id}
              center={[landmark.lat, landmark.lng]}
              zoom={16}
              style={{ height: '200px', width: '100%' }}
              scrollWheelZoom={false}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker 
                position={[landmark.lat, landmark.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background: ${landmark.category === 'Activity' ? 'hsl(195, 85%, 50%)' : 'hsl(14, 85%, 55%)'}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
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
                  <strong>{getTranslatedContent(landmark, selectedLanguage, 'name')}</strong>
                  <br />
                  <small className="text-muted-foreground">{t('clickToViewOnMap', selectedLanguage)}</small>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

        {/* About */}
        {getTranslatedContent(landmark, selectedLanguage, 'description') && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t('category', selectedLanguage)}</h3>
            <p className="text-muted-foreground" data-testid="text-description">
              {getTranslatedContent(landmark, selectedLanguage, 'description')}
            </p>
          </div>
        )}

        {/* Historical Information */}
        {getTranslatedContent(landmark, selectedLanguage, 'historicalInfo') && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t('historicalInfo', selectedLanguage)}</h3>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-historical-info">
              {getTranslatedContent(landmark, selectedLanguage, 'historicalInfo')}
            </p>
          </div>
        )}

        {/* Architect */}
        {landmark.architect && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t('architect', selectedLanguage)}
            </h3>
            <p className="text-muted-foreground" data-testid="text-architect">
              {landmark.architect}
            </p>
          </div>
        )}

        {/* Detailed Description with Audio */}
        {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') && (
          <div className="mb-4 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              {t('detailedInformation', selectedLanguage)}
            </h3>
            
            {/* Audio Controls */}
            <div className="mb-3 p-3 bg-background rounded-md border">
              <div className="flex items-center gap-3 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  className="gap-2"
                  data-testid="button-audio-play"
                >
                  {isPlaying && !audioService.isPaused() ? (
                    <>
                      <Pause className="w-4 h-4" />
                      {t('pause', selectedLanguage)}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {audioService.isPaused() ? t('resume', selectedLanguage) : t('playAudio', selectedLanguage)}
                    </>
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{t('speed', selectedLanguage)}</span>
                    <span className="text-xs font-medium" data-testid="text-playback-speed">{playbackRate.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateChange([0.5])}
                      className={`text-xs px-2 h-7 ${playbackRate === 0.5 ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid="button-speed-0.5"
                    >
                      0.5x
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateChange([0.75])}
                      className={`text-xs px-2 h-7 ${playbackRate === 0.75 ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid="button-speed-0.75"
                    >
                      0.75x
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateChange([1.0])}
                      className={`text-xs px-2 h-7 ${playbackRate === 1.0 ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid="button-speed-1.0"
                    >
                      1.0x
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateChange([1.25])}
                      className={`text-xs px-2 h-7 ${playbackRate === 1.25 ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid="button-speed-1.25"
                    >
                      1.25x
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateChange([1.5])}
                      className={`text-xs px-2 h-7 ${playbackRate === 1.5 ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid="button-speed-1.5"
                    >
                      1.5x
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRateChange([2.0])}
                      className={`text-xs px-2 h-7 ${playbackRate === 2.0 ? 'bg-primary text-primary-foreground' : ''}`}
                      data-testid="button-speed-2.0"
                    >
                      2.0x
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Text */}
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-detailed-description">
              {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')}
            </p>
          </div>
        )}

        {/* Ticket Booking Platforms */}
        <div className="mb-4 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-primary" />
            {t('bookTickets', selectedLanguage)}
          </h3>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => {
                const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                window.open(`https://www.getyourguide.com/s/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
              }}
              data-testid="button-book-getyourguide"
            >
              <ExternalLink className="w-4 h-4" />
              {t('bookOn', selectedLanguage)} GetYourGuide
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => {
                const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                window.open(`https://www.viator.com/searchResults/all?text=${searchQuery}`, '_blank', 'noopener,noreferrer');
              }}
              data-testid="button-book-viator"
            >
              <ExternalLink className="w-4 h-4" />
              {t('bookOn', selectedLanguage)} Viator
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => {
                const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                window.open(`https://www.klook.com/en-US/search/?query=${searchQuery}`, '_blank', 'noopener,noreferrer');
              }}
              data-testid="button-book-klook"
            >
              <ExternalLink className="w-4 h-4" />
              {t('bookOn', selectedLanguage)} Klook
            </Button>
          </div>
        </div>

        {/* Navigation Button */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button 
              onClick={handleNavigate} 
              className="flex-1 gap-2"
              data-testid="button-navigate-panel"
            >
              <Navigation className="w-4 h-4" />
              {t('getDirections', selectedLanguage)}
            </Button>
            {onAddToTour && (
              <Button
                onClick={() => onAddToTour(landmark)}
                variant={isInTour ? "secondary" : "outline"}
                className="flex-1 gap-2"
                data-testid={`button-tour-panel-${landmark.id}`}
              >
                {isInTour ? 'Remove from Tour' : 'Add to Tour'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
