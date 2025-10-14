import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import { PhotoGallery } from './PhotoGallery';
import { X, Navigation, MapPinned, Play, Pause, Ticket, ExternalLink, Clock, Euro, ChefHat, Phone, Utensils, Activity as ActivityIcon, Landmark as LandmarkIcon, Info, Image as ImageIcon, Calendar } from 'lucide-react';
import { useState } from 'react';
import { audioService } from '@/lib/audioService';

interface LandmarkDetailDialogProps {
  landmark: Landmark | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;
  selectedLanguage?: string;
}

export function LandmarkDetailDialog({
  landmark,
  isOpen,
  onClose,
  onNavigate,
  onAddToTour,
  isInTour = false,
  selectedLanguage = 'en'
}: LandmarkDetailDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  if (!landmark) return null;

  const handlePlayAudio = () => {
    const detailedDescription = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
    if (!detailedDescription) return;

    if (isPlaying) {
      audioService.stop();
      setIsPlaying(false);
    } else {
      audioService.playText(detailedDescription, selectedLanguage, playbackRate, () => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-1" data-testid="text-landmark-detail-name">
                {getTranslatedContent(landmark, selectedLanguage, 'name')}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={landmark.category === 'Activity' ? 'default' : 'secondary'} className="text-xs">
                  {landmark.category === 'Activity' ? <ActivityIcon className="w-3 h-3 mr-1" /> : <LandmarkIcon className="w-3 h-3 mr-1" />}
                  {landmark.category === 'Activity' ? t('activity', selectedLanguage) : t('landmark', selectedLanguage)}
                </Badge>
                {landmark.category && landmark.category !== 'Activity' && (
                  <Badge variant="outline" className="text-xs">{landmark.category}</Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-detail-dialog"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-4 grid w-auto grid-cols-3 flex-shrink-0">
            <TabsTrigger value="overview" className="gap-2">
              <Info className="w-4 h-4" />
              {t('overview', selectedLanguage)}
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              {t('photos', selectedLanguage)}
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <Calendar className="w-4 h-4" />
              {t('details', selectedLanguage)}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground">
                  {getTranslatedContent(landmark, selectedLanguage, 'description')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => onNavigate(landmark)}
                  className="w-full gap-2"
                  data-testid="button-get-directions-dialog"
                >
                  <Navigation className="w-4 h-4" />
                  {t('getDirections', selectedLanguage)}
                </Button>
                
                {onAddToTour && (
                  <Button
                    onClick={() => onAddToTour(landmark)}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isInTour}
                    data-testid="button-add-to-tour-dialog"
                  >
                    <MapPinned className="w-4 h-4" />
                    {isInTour ? t('inTour', selectedLanguage) : t('addToTour', selectedLanguage)}
                  </Button>
                )}
              </div>

              {/* Audio Section */}
              {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') && (
                <div className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlayAudio}
                      className="gap-2"
                      data-testid="button-play-audio-dialog"
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
                          const detailedDescription = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
                          if (detailedDescription) {
                            audioService.playText(detailedDescription, selectedLanguage, rate, () => setIsPlaying(false));
                          }
                        }}
                        className="px-2 py-1 text-sm border rounded"
                        data-testid="select-playback-rate-dialog"
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
                    {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="max-w-2xl mx-auto">
              {landmark.photos && landmark.photos.length > 0 ? (
                <PhotoGallery 
                  photos={landmark.photos} 
                  title={getTranslatedContent(landmark, selectedLanguage, 'name')}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No photos available
                </p>
              )}
            </div>
          </TabsContent>

          {/* Details Tab - Booking & Additional Info */}
          <TabsContent value="details" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="max-w-2xl mx-auto space-y-3">
              {/* Activity Booking */}
              {landmark.category === 'Activity' ? (
                <div className="p-3 border rounded-lg">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5" />
                    {t('bookTicketsTours', selectedLanguage)}
                  </h5>
                  <div className="space-y-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs h-8"
                      onClick={() => {
                        const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                        window.open(`https://www.getyourguide.com/s/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                      }}
                      data-testid="button-book-getyourguide-dialog"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t('bookOnGetYourGuide', selectedLanguage)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-xs h-8"
                      onClick={() => {
                        const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                        window.open(`https://www.viator.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                      }}
                      data-testid="button-book-viator-dialog"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t('bookOnViator', selectedLanguage)}
                    </Button>
                  </div>
                </div>
              ) : landmark.category === 'Restaurant' ? (
                <div className="p-3 border rounded-lg">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Utensils className="w-3.5 h-3.5" />
                    {t('restaurantInfo', selectedLanguage)}
                  </h5>
                  <div className="space-y-2">
                    {landmark.openingHours && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{t('openingHours', selectedLanguage)}</p>
                          <p className="text-muted-foreground">{landmark.openingHours}</p>
                        </div>
                      </div>
                    )}
                    
                    {landmark.priceRange && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Euro className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{t('priceRange', selectedLanguage)}</p>
                          <p className="text-muted-foreground">{landmark.priceRange}</p>
                        </div>
                      </div>
                    )}
                    
                    {landmark.cuisine && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <ChefHat className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{t('cuisine', selectedLanguage)}</p>
                          <p className="text-muted-foreground">{landmark.cuisine}</p>
                        </div>
                      </div>
                    )}
                    
                    {landmark.phoneNumber && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{t('phoneNumber', selectedLanguage)}</p>
                          <a 
                            href={`tel:${landmark.phoneNumber}`}
                            className="text-primary hover:underline"
                            data-testid="link-restaurant-phone-dialog"
                          >
                            {landmark.phoneNumber}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {landmark.menuHighlights && landmark.menuHighlights.length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium mb-1">{t('menuHighlights', selectedLanguage)}</p>
                        <div className="flex flex-wrap gap-1">
                          {landmark.menuHighlights.slice(0, 4).map((dish, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {dish}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-1.5 pt-1">
                      {landmark.phoneNumber && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1.5 text-xs h-8"
                          onClick={() => window.open(`tel:${landmark.phoneNumber}`, '_self')}
                          data-testid="button-call-restaurant-dialog"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {t('callRestaurant', selectedLanguage)}
                        </Button>
                      )}
                      {landmark.reservationUrl && (
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 text-xs h-8"
                          onClick={() => window.open(landmark.reservationUrl, '_blank', 'noopener,noreferrer')}
                          data-testid="button-make-reservation-dialog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('makeReservation', selectedLanguage)}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <Info className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">{t('noBookingInfo', selectedLanguage)}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
