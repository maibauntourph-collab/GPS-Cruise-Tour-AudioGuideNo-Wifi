import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  MapPin,
  Navigation,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  Gauge,
} from 'lucide-react';
import { Landmark, GpsPosition } from '@shared/schema';
import { calculateDistance, formatDistance } from '@/lib/geoUtils';

interface InfoPanelProps {
  userPosition: GpsPosition | null;
  isLoadingPosition: boolean;
  positionError: string | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onClearRoute: () => void;
  hasActiveRoute: boolean;
  nearestLandmark?: { landmark: Landmark; distance: number } | null;
  isSpeaking: boolean;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
}

export function InfoPanel({
  userPosition,
  isLoadingPosition,
  positionError,
  audioEnabled,
  onToggleAudio,
  onClearRoute,
  hasActiveRoute,
  nearestLandmark,
  isSpeaking,
  speechRate,
  onSpeechRateChange,
}: InfoPanelProps) {
  return (
    <Card className="absolute top-4 left-4 z-[1000] max-w-sm backdrop-blur-md bg-background/90 border-2 shadow-xl">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-serif font-semibold text-lg">Rome GPS Audio Guide</h2>
          </div>
        </div>

        <div className="space-y-2">
          {isLoadingPosition && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Finding your location...</span>
            </div>
          )}

          {positionError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{positionError}</span>
            </div>
          )}

          {userPosition && !positionError && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5" data-testid="badge-gps-status">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  GPS Active
                </Badge>
                {isSpeaking && (
                  <Badge variant="secondary" className="gap-1.5" data-testid="badge-audio-playing">
                    <Volume2 className="w-3 h-3" />
                    Playing
                  </Badge>
                )}
              </div>

              {nearestLandmark && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Nearest landmark:</p>
                  <p className="font-medium">
                    {nearestLandmark.landmark.name} -{' '}
                    <span className="text-primary">
                      {formatDistance(nearestLandmark.distance)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Audio guide plays automatically within 50m of landmarks
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Speech Speed</span>
            </div>
            <span className="text-sm text-muted-foreground" data-testid="text-speech-rate">
              {speechRate.toFixed(1)}x
            </span>
          </div>
          <Slider
            value={[speechRate]}
            onValueChange={(values) => onSpeechRateChange(values[0])}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
            data-testid="slider-speech-rate"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={audioEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleAudio}
            className="flex-1"
            data-testid="button-toggle-audio"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Audio On
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 mr-2" />
                Audio Off
              </>
            )}
          </Button>

          {hasActiveRoute && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearRoute}
              className="flex-1"
              data-testid="button-clear-route"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Clear Route
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
