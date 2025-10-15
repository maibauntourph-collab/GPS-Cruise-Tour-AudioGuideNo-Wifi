import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  title: string;
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) return null;

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-square overflow-hidden rounded-md hover-elevate active-elevate-2"
            data-testid={`button-photo-${index}`}
          >
            <img
              src={photo}
              alt={`${title} - Photo ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0" data-testid="dialog-photo-viewer">
          <DialogTitle className="sr-only">
            {selectedIndex !== null ? `${title} - Photo ${selectedIndex + 1}` : `${title} Photo Gallery`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {selectedIndex !== null ? `Photo ${selectedIndex + 1} of ${photos.length}` : `View photos of ${title}`}
          </DialogDescription>
          <div className="relative">
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover-elevate"
              data-testid="button-close-photo"
            >
              <X className="w-5 h-5" />
            </button>

            {selectedIndex !== null && (
              <>
                <img
                  src={photos[selectedIndex]}
                  alt={`${title} - Photo ${selectedIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  data-testid="img-photo-viewer"
                />

                <div className="absolute top-1/2 left-4 -translate-y-1/2">
                  {selectedIndex > 0 && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handlePrevious}
                      className="bg-background/80 backdrop-blur-sm"
                      data-testid="button-previous-photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                <div className="absolute top-1/2 right-4 -translate-y-1/2">
                  {selectedIndex < photos.length - 1 && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleNext}
                      className="bg-background/80 backdrop-blur-sm"
                      data-testid="button-next-photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full">
                  <p className="text-sm font-medium" data-testid="text-photo-count">
                    {selectedIndex + 1} / {photos.length}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
