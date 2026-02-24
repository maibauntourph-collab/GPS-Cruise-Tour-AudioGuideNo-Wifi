import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoGalleryProps {
  photos: string[];
  title: string;
}

/**
 * [학습 포인트] 프리미엄 UI/UX 디자인 요소
 * 1. Framer Motion: 선언적 애니메이션을 통해 부드러운 인터랙션 제공
 * 2. Glassmorphism: backdrop-blur와 투명도가 조절된 배경을 사용하여 현대적인 유리 질감 구현
 * 3. Stagger Children: 리스트 아이템이 순차적으로 등장하게 하여 시각적 리듬감 부여
 */

// 이미지 로드 실패 시 보여줄 대체 컴포넌트
function ImageFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-muted/50 text-muted-foreground gap-1 backdrop-blur-sm ${className}`}>
      <ImageOff className="w-6 h-6 opacity-40" />
      <span className="text-[10px] opacity-50 font-medium">No Image</span>
    </div>
  );
}

// 애니메이션 변수 설정
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // 자식 요소들이 0.1초 간격으로 등장
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export default function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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

  const handleImageError = (index: number) => {
    setErrorIndices(prev => new Set(prev).add(index));
  };

  return (
    <>
      <motion.div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {photos.map((photo, index) => (
          <motion.button
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedIndex(index)}
            className="relative w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E9633F]/50"
            data-testid={`button-photo-${index}`}
          >
            {errorIndices.has(index) || (photo && photo.includes('placeholder.png')) ? (
              <ImageFallback className="h-full w-full" />
            ) : (
              <div className="h-full w-full">
                <img
                  src={photo}
                  alt={`${title} - Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => handleImageError(index)}
                />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors" />
          </motion.button>
        ))}
      </motion.div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent
          className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none"
          data-testid="dialog-photo-viewer"
        >
          <DialogTitle className="sr-only">
            {selectedIndex !== null ? `${title} - Photo ${selectedIndex + 1}` : `${title} Photo Gallery`}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {selectedIndex !== null ? `Photo ${selectedIndex + 1} of ${photos.length}` : `View photos of ${title}`}
          </DialogDescription>

          <div className="relative flex flex-col items-center justify-center min-h-[50vh]">
            {/* 상단 닫기 버튼 (유리 질감) */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-full p-2.5 hover:bg-white/30 transition-all shadow-xl"
              data-testid="button-close-photo"
            >
              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {selectedIndex !== null && (
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className="relative w-full flex items-center justify-center p-4"
                >
                  {errorIndices.has(selectedIndex) ? (
                    <div className="w-full h-[60vh] flex items-center justify-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <ImageFallback className="p-10 scale-150" />
                    </div>
                  ) : (
                    <img
                      src={photos[selectedIndex]}
                      alt={`${title} - Photo ${selectedIndex + 1}`}
                      className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black/20"
                      data-testid="img-photo-viewer"
                      onError={() => handleImageError(selectedIndex)}
                    />
                  )}

                  {/* 좌우 네비게이션 버튼 (프리미엄 스타일) */}
                  <div className="absolute top-1/2 left-6 -translate-y-1/2 flex items-center">
                    {selectedIndex > 0 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handlePrevious}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg"
                        data-testid="button-previous-photo"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                    )}
                  </div>

                  <div className="absolute top-1/2 right-6 -translate-y-1/2 flex items-center">
                    {selectedIndex < photos.length - 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleNext}
                        className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-lg"
                        data-testid="button-next-photo"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    )}
                  </div>

                  {/* 하단 카운터 (플로팅 유리 질감) */}
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full shadow-xl">
                    <p className="text-white text-sm font-semibold tracking-wider" data-testid="text-photo-count">
                      <span className="text-white/60">PHOTO</span> {selectedIndex + 1} <span className="text-white/40 mx-1">/</span> {photos.length}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
