import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ImageOff } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  title: string;
}

/**
 * [학습 포인트] 이미지 에러 처리(Fallback Image)
 * 외부 이미지 URL(Unsplash 등)은 시간이 지나면 만료될 수 있습니다.
 * onError 핸들러를 사용하여 이미지 로드 실패 시 대체 UI를 보여줍니다.
 * - ImageOff 아이콘: 이미지를 찾을 수 없음을 시각적으로 표현
 * - data-error="true": CSS 또는 JS에서 에러 상태 감지에 활용
 */

// 이미지 로드 실패 시 보여줄 대체 컴포넌트
function ImageFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-muted text-muted-foreground gap-1 ${className}`}>
      <ImageOff className="w-6 h-6 opacity-40" />
      <span className="text-[10px] opacity-50">No Image</span>
    </div>
  );
}

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // 각 인덱스별로 이미지 에러 추적 (Set으로 효율적 관리)
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

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

  // 이미지 에러 발생 시 해당 인덱스를 errorIndices에 추가
  const handleImageError = (index: number) => {
    setErrorIndices(prev => new Set(prev).add(index));
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
            {errorIndices.has(index) ? (
              /* 이미지 에러 발생: 대체 UI 표시 */
              <ImageFallback className="h-full w-full" />
            ) : (
              <img
                src={photo}
                alt={`${title} - Photo ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => handleImageError(index)}
              />
            )}
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
                {errorIndices.has(selectedIndex) ? (
                  /* 전체화면 뷰에서도 에러 대체 UI */
                  <div className="w-full h-[60vh] flex items-center justify-center bg-muted">
                    <ImageFallback />
                  </div>
                ) : (
                  <img
                    src={photos[selectedIndex]}
                    alt={`${title} - Photo ${selectedIndex + 1}`}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    data-testid="img-photo-viewer"
                    onError={() => handleImageError(selectedIndex)}
                  />
                )}

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
