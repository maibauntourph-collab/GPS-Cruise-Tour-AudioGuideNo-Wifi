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
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set());

  if (!photos || photos.length === 0) return null;

  const handleImageLoad = (index: number) => {
    setLoadedIndices(prev => new Set(prev).add(index));
  };

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
            className="relative w-24 h-24 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E9633F]/50"
            data-testid={`button-photo-${index}`}
          >
            {/* [Designer Kim] Skeleton UI with Pulse Effect */}
            <AnimatePresence>
              {!loadedIndices.has(index) && !errorIndices.has(index) && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                </motion.div>
              )}
            </AnimatePresence>

            {errorIndices.has(index) || (photo && photo.includes('placeholder.png')) ? (
              <ImageFallback className="h-full w-full" />
            ) : (
              <div className="h-full w-full">
                <img
                  src={photo}
                  alt={`${title} - Photo ${index + 1}`}
                  className={`h-full w-full object-cover transition-opacity duration-700 ${loadedIndices.has(index) ? 'opacity-100' : 'opacity-0'}`}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => handleImageLoad(index)}
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

          <div className="relative flex flex-col items-center justify-center min-h-[60vh] w-full overflow-hidden">
            {/* 상단 닫기 버튼 (유리 질감) */}
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-6 right-6 z-50 bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-full p-3 hover:bg-white/30 transition-all shadow-2xl active:scale-90"
              data-testid="button-close-photo"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full h-[70vh] flex items-center justify-center touch-none">
              <AnimatePresence mode="wait" initial={false}>
                {selectedIndex !== null && (
                  <motion.div
                    key={selectedIndex}
                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={(_, info) => {
                      const swipeThreshold = 50;
                      if (info.offset.x < -swipeThreshold) handleNext();
                      else if (info.offset.x > swipeThreshold) handlePrevious();
                    }}
                    className="absolute inset-0 flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
                  >
                    {errorIndices.has(selectedIndex) ? (
                      <div className="w-full max-w-3xl aspect-square flex items-center justify-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                        <ImageFallback className="p-10 scale-150" />
                      </div>
                    ) : (
                      <motion.img
                        src={photos[selectedIndex]}
                        alt={`${title} - Photo ${selectedIndex + 1}`}
                        className="w-full max-w-4xl h-auto max-h-[75vh] object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-black/20"
                        data-testid="img-photo-viewer"
                        onError={() => handleImageError(selectedIndex)}
                        layoutId={`photo-${selectedIndex}`}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 좌우 네비게이션 버튼 (데스크톱용/프리미엄 스타일) - 모바일에서는 스와이프로 대체 가능하지만 보조 수단으로 유지 */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-40">
              {selectedIndex !== null && selectedIndex > 0 ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                  className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-2xl pointer-events-auto"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              ) : <div />}

              {selectedIndex !== null && selectedIndex < photos.length - 1 ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-2xl pointer-events-auto"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              ) : <div />}
            </div>

            {/* 하단 카운터 인디케이터 (프리미엄 슬림 디자인) */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-40">
              <div className="flex gap-1.5">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${i === selectedIndex ? 'w-8 bg-[#E9633F]' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full shadow-2xl">
                <p className="text-white text-[11px] font-black tracking-[0.2em]" data-testid="text-photo-count">
                  {selectedIndex !== null && selectedIndex + 1} <span className="opacity-30 mx-2">/</span> {photos.length}
                </p>
              </div>
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
