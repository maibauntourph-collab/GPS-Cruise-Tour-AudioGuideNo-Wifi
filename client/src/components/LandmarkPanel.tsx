import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Landmark } from '@shared/schema';
import { Navigation, MapPin, Calendar, User, X, Play, Pause, Volume2 } from 'lucide-react';
import { PhotoGallery } from './PhotoGallery';
import { getTranslatedContent } from '@/lib/translations';
import { audioService } from '@/lib/audioService';

interface LandmarkPanelProps {
  landmark: Landmark | null;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  selectedLanguage?: string;
}

export function LandmarkPanel({
  landmark,
  onClose,
  onNavigate,
  selectedLanguage = 'en'
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
              Photo Gallery
            </h3>
            <PhotoGallery 
              photos={landmark.photos} 
              title={getTranslatedContent(landmark, selectedLanguage, 'name')} 
            />
          </div>
        )}

        {/* About */}
        {getTranslatedContent(landmark, selectedLanguage, 'description') && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground" data-testid="text-description">
              {getTranslatedContent(landmark, selectedLanguage, 'description')}
            </p>
          </div>
        )}

        {/* Historical Information */}
        {landmark.historicalInfo && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Historical Information</h3>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-historical-info">
              {landmark.historicalInfo}
            </p>
          </div>
        )}

        {/* Architect */}
        {landmark.architect && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Architect / Creator
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
              Detailed Information
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
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {audioService.isPaused() ? 'Resume' : 'Play Audio'}
                    </>
                  )}
                </Button>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Playback Speed</span>
                    <span className="text-xs font-medium">{playbackRate.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[playbackRate]}
                    onValueChange={handleRateChange}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="cursor-pointer"
                    data-testid="slider-playback-rate"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">0.5x</span>
                    <span className="text-xs text-muted-foreground">2.0x</span>
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

        {/* Navigation Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={handleNavigate} 
            className="w-full gap-2"
            data-testid="button-navigate-panel"
          >
            <Navigation className="w-4 h-4" />
            Get Directions
          </Button>
        </div>
      </div>
    </div>
  );
}
