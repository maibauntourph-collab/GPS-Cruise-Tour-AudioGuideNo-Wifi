import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark } from '@shared/schema';
import { getTranslatedContent, t } from '@/lib/translations';
import PhotoGallery from './PhotoGallery';
import { Navigation, MapPinned, MapPin, Play, Pause, Ticket, ExternalLink, Clock, Euro, ChefHat, Phone, Utensils, Activity as ActivityIcon, Landmark as LandmarkIcon, Info, Image as ImageIcon, Calendar, CreditCard } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
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

export default function LandmarkDetailDialog({
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
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);

  // Split text into sentences for highlighting
  const sentences = useMemo(() => {
    if (!landmark) return [];
    const description = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
    if (!description) return [];
    return audioService.splitIntoSentences(description);
  }, [landmark, selectedLanguage]);

  // Stop all audio and reset state when dialog closes or landmark changes
  useEffect(() => {
    if (!isOpen) {
      setCurrentSentenceIndex(-1);
      setIsPlaying(false);
      // Stop all types of audio
      audioService.stopSentences();
      audioService.stop();
      audioService.stopMP3();
    }
  }, [isOpen, landmark]);

  // Handle dialog close - stop all audio first
  const handleDialogClose = () => {
    setCurrentSentenceIndex(-1);
    setIsPlaying(false);
    audioService.stopSentences();
    audioService.stop();
    audioService.stopMP3();
    onClose();
  };

  if (!landmark) return null;

  const handlePlayAudio = async () => {
    const detailedDescription = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
    if (!detailedDescription) return;

    if (isPlaying) {
      audioService.stopSentences();
      audioService.stop();
      audioService.stopMP3();
      setIsPlaying(false);
      setCurrentSentenceIndex(-1);
    } else {
      const audioMode = audioService.getAudioMode();
      
      // For CLOVA mode, use CLOVA TTS with sentence-by-sentence highlighting
      if (audioMode === 'clova') {
        setIsPlaying(true);
        const success = await audioService.playClovaSentences(
          detailedDescription,
          selectedLanguage,
          (index) => setCurrentSentenceIndex(index),
          () => {
            setIsPlaying(false);
            setCurrentSentenceIndex(-1);
          }
        );
        if (!success) {
          // Fallback to system TTS if CLOVA fails
          audioService.playSentences(
            detailedDescription, 
            selectedLanguage, 
            playbackRate, 
            (index) => setCurrentSentenceIndex(index),
            () => {
              setIsPlaying(false);
              setCurrentSentenceIndex(-1);
            }
          );
        }
      } else {
        // Use sentence-by-sentence playback with highlighting for TTS/Auto/MP3 modes
        audioService.playSentences(
          detailedDescription, 
          selectedLanguage, 
          playbackRate, 
          (index) => setCurrentSentenceIndex(index),
          () => {
            setIsPlaying(false);
            setCurrentSentenceIndex(-1);
          }
        );
        setIsPlaying(true);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-3 border-b flex-shrink-0">
          <div>
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
                    {isPlaying && audioService.getAudioMode() !== 'clova' && (
                      <select
                        value={playbackRate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value);
                          setPlaybackRate(rate);
                          audioService.setRate(rate);
                          const detailedDescription = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
                          if (detailedDescription) {
                            audioService.playSentences(
                              detailedDescription, 
                              selectedLanguage, 
                              rate, 
                              (index) => setCurrentSentenceIndex(index),
                              () => {
                                setIsPlaying(false);
                                setCurrentSentenceIndex(-1);
                              }
                            );
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
                  {/* Sentence-by-sentence text with memory pen highlighting */}
                  <div className="text-sm leading-relaxed" data-testid="audio-text-container">
                    {sentences.length > 0 ? (
                      sentences.map((sentence, index) => {
                        const isCurrentSentence = currentSentenceIndex === index;
                        const isReadSentence = currentSentenceIndex > index && isPlaying;
                        
                        return (
                          <span
                            key={index}
                            className={`inline rounded-sm px-0.5 transition-all duration-300 ease-in-out ${
                              isCurrentSentence 
                                ? 'bg-yellow-300/50 font-medium shadow-sm dark:bg-yellow-400/40' 
                                : isReadSentence
                                ? 'bg-green-300/30 dark:bg-green-400/20'
                                : 'bg-transparent'
                            }`}
                            style={{
                              boxDecorationBreak: 'clone',
                              WebkitBoxDecorationBreak: 'clone'
                            }}
                            data-testid={`sentence-${index}`}
                          >
                            {sentence}{' '}
                          </span>
                        );
                      })
                    ) : (
                      <span>{getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="flex-1 overflow-y-auto p-4 m-0">
            <div className="max-w-2xl mx-auto">
              {landmark.category === 'Restaurant' && landmark.restaurantPhotos ? (
                <Tabs defaultValue="exterior" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="exterior">{t('exteriorPhotos', selectedLanguage)}</TabsTrigger>
                    <TabsTrigger value="interior">{t('interiorPhotos', selectedLanguage)}</TabsTrigger>
                    <TabsTrigger value="menu">{t('menuPhotos', selectedLanguage)}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="exterior" className="mt-4">
                    {landmark.restaurantPhotos.exterior && landmark.restaurantPhotos.exterior.length > 0 ? (
                      <PhotoGallery 
                        photos={landmark.restaurantPhotos.exterior} 
                        title={`${getTranslatedContent(landmark, selectedLanguage, 'name')} - ${t('exteriorPhotos', selectedLanguage)}`}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No exterior photos available
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="interior" className="mt-4">
                    {landmark.restaurantPhotos.interior && landmark.restaurantPhotos.interior.length > 0 ? (
                      <PhotoGallery 
                        photos={landmark.restaurantPhotos.interior} 
                        title={`${getTranslatedContent(landmark, selectedLanguage, 'name')} - ${t('interiorPhotos', selectedLanguage)}`}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No interior photos available
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="menu" className="mt-4">
                    {landmark.restaurantPhotos.menu && landmark.restaurantPhotos.menu.length > 0 ? (
                      <PhotoGallery 
                        photos={landmark.restaurantPhotos.menu} 
                        title={`${getTranslatedContent(landmark, selectedLanguage, 'name')} - ${t('menuPhotos', selectedLanguage)}`}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No menu photos available
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              ) : landmark.photos && landmark.photos.length > 0 ? (
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
              {/* GPS Coordinates Section */}
              <div className="p-3 border rounded-lg">
                <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {t('location', selectedLanguage)}
                </h5>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t('latitude', selectedLanguage)}:</span>
                    <span className="font-mono" data-testid="text-landmark-latitude">{landmark.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t('longitude', selectedLanguage)}:</span>
                    <span className="font-mono" data-testid="text-landmark-longitude">{landmark.lng.toFixed(6)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2 text-xs h-8"
                    onClick={() => {
                      window.open(`https://www.google.com/maps?q=${landmark.lat},${landmark.lng}`, '_blank', 'noopener,noreferrer');
                    }}
                    data-testid="button-open-google-maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t('openInGoogleMaps', selectedLanguage)}
                  </Button>
                </div>
              </div>

              {/* Ticket & Tour Booking - for Activities and Landmarks */}
              {(landmark.category === 'Activity' || (landmark.category !== 'Restaurant' && landmark.category !== 'Gift Shop' && landmark.category !== 'Shop')) ? (
                <div className="p-3 border rounded-lg">
                  <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5" />
                    {t('bookTicketsTours', selectedLanguage)}
                  </h5>
                  <div className="space-y-1.5">
                    {/* 한국어: Klook */}
                    {selectedLanguage === 'ko' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs h-8"
                        onClick={() => {
                          const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                          window.open(`https://www.klook.com/ko/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                        }}
                        data-testid="button-book-klook-dialog"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Klook에서 예약
                      </Button>
                    )}
                    
                    {/* 일본어: Klook, Viator */}
                    {selectedLanguage === 'ja' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs h-8"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                            window.open(`https://www.klook.com/ja/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-klook-dialog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Klookで予約
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs h-8"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                            window.open(`https://www.viator.com/ja-JP/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-viator-dialog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
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
                          className="w-full justify-start gap-2 text-xs h-8"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                            window.open(`https://www.klook.com/zh-CN/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-klook-dialog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Klook预订
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs h-8"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                            window.open(`https://cn.trip.com/search/things-to-do?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-trip-dialog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Trip.com预订
                        </Button>
                      </>
                    )}
                    
                    {/* 동남아시아 언어: Klook */}
                    {(selectedLanguage === 'th' || selectedLanguage === 'vi' || selectedLanguage === 'id') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs h-8"
                        onClick={() => {
                          const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                          const langCode = selectedLanguage === 'th' ? 'th-TH' : selectedLanguage === 'vi' ? 'vi-VN' : 'id-ID';
                          window.open(`https://www.klook.com/${langCode}/search/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                        }}
                        data-testid="button-book-klook-dialog"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {selectedLanguage === 'th' ? 'จองกับ Klook' : selectedLanguage === 'vi' ? 'Đặt trên Klook' : 'Pesan di Klook'}
                      </Button>
                    )}
                    
                    {/* 영어/유럽 언어: GetYourGuide, Viator */}
                    {['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'tr', 'nl', 'pl', 'sv', 'da', 'fi', 'no', 'el', 'cs'].includes(selectedLanguage) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 text-xs h-8"
                          onClick={() => {
                            const searchQuery = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                            // Language mapping for GetYourGuide
                            const gygLang = selectedLanguage === 'es' ? 'es' : selectedLanguage === 'fr' ? 'fr' : selectedLanguage === 'de' ? 'de' : selectedLanguage === 'it' ? 'it' : selectedLanguage === 'pt' ? 'pt-BR' : 'en';
                            window.open(`https://www.getyourguide.com/${gygLang}/s/?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
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
                            // Language mapping for Viator
                            const viatorLang = selectedLanguage === 'es' ? 'es-ES' : selectedLanguage === 'fr' ? 'fr-FR' : selectedLanguage === 'de' ? 'de-DE' : selectedLanguage === 'it' ? 'it-IT' : selectedLanguage === 'pt' ? 'pt-BR' : 'en-US';
                            window.open(`https://www.viator.com/${viatorLang}/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
                          }}
                          data-testid="button-book-viator-dialog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t('bookOnViator', selectedLanguage)}
                        </Button>
                      </>
                    )}
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
                    
                    {landmark.paymentMethods && landmark.paymentMethods.length > 0 && (
                      <div className="flex items-start gap-1.5 text-xs">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{t('paymentMethods', selectedLanguage)}</p>
                          <p className="text-muted-foreground">{landmark.paymentMethods.join(', ')}</p>
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
                        <div className="flex flex-wrap gap-1 mb-2">
                          {landmark.menuHighlights.slice(0, 4).map((dish, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {dish}
                            </Badge>
                          ))}
                        </div>
                        {landmark.restaurantPhotos?.menu && landmark.restaurantPhotos.menu.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {landmark.restaurantPhotos.menu.slice(0, 3).map((photo, idx) => (
                              <img 
                                key={idx}
                                src={photo} 
                                alt={`Menu ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  // Open photo gallery at this index
                                  const event = new CustomEvent('openPhotoGallery', { 
                                    detail: { photos: landmark.restaurantPhotos?.menu || [], startIndex: idx }
                                  });
                                  window.dispatchEvent(event);
                                }}
                                data-testid={`menu-photo-${idx}`}
                              />
                            ))}
                          </div>
                        )}
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
