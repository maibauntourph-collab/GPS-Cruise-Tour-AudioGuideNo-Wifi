import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark } from '@shared/schema';
import { Navigation, MapPin, Calendar, User } from 'lucide-react';
import { PhotoGallery } from './PhotoGallery';
import { getTranslatedContent } from '@/lib/translations';

interface LandmarkDetailsProps {
  landmark: Landmark | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  selectedLanguage?: string;
}

export function LandmarkDetails({
  landmark,
  open,
  onClose,
  onNavigate,
  selectedLanguage = 'en'
}: LandmarkDetailsProps) {
  if (!landmark) return null;

  const handleNavigate = () => {
    onNavigate(landmark);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-landmark-details">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl" data-testid="text-landmark-name">
            {getTranslatedContent(landmark, selectedLanguage, 'name')}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
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
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {landmark.photos && landmark.photos.length > 0 && (
            <div>
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

          {getTranslatedContent(landmark, selectedLanguage, 'description') && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground" data-testid="text-description">
                {getTranslatedContent(landmark, selectedLanguage, 'description')}
              </p>
            </div>
          )}

          {landmark.historicalInfo && (
            <div>
              <h3 className="font-semibold mb-2">Historical Information</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-historical-info">
                {landmark.historicalInfo}
              </p>
            </div>
          )}

          {landmark.architect && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Architect / Creator
              </h3>
              <p className="text-muted-foreground" data-testid="text-architect">
                {landmark.architect}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              onClick={handleNavigate} 
              className="w-full gap-2"
              data-testid="button-navigate-details"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
