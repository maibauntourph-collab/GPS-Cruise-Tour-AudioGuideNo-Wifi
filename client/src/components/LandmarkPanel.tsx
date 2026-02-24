import { useState, useEffect, useRef, useCallback, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Landmark } from '@shared/schema';
import { Navigation, MapPin, X, Play, Pause, Ticket, ExternalLink, Minus, MapPinned, Info } from 'lucide-react';
import PhotoGallery from './PhotoGallery';
import { getTranslatedContent, t } from '@/lib/translations';
import { audioService } from '@/lib/audioService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface LandmarkPanelProps {
  landmark: Landmark | null;
  onClose: () => void;
  onNavigate: (landmark: Landmark) => void;
  selectedLanguage?: string;
  onAddToTour?: (landmark: Landmark) => void;
  isInTour?: boolean;
}

export default function LandmarkPanel({
  landmark,
  onClose,
  onNavigate,
  selectedLanguage = 'en',
  onAddToTour,
  isInTour = false
}: LandmarkPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zIndex, setZIndex] = useState(1000);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [lastCardHeight, setLastCardHeight] = useState(600);
  const [isCentered, setIsCentered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      audioService.stop();
      setIsPlaying(false);
      setIsPaused(false);
    };
  }, [landmark?.id]);

  useEffect(() => {
    audioService.stop();
    setIsPlaying(false);
    setIsPaused(false);
  }, [selectedLanguage]);

  const clampTranslate = useCallback((x: number, y: number, elementWidth: number, elementHeight: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxX = (viewportWidth - elementWidth) / 2;
    const maxY = (viewportHeight - elementHeight) / 2;
    return {
      x: Math.max(-maxX, Math.min(x, maxX)),
      y: Math.max(-maxY, Math.min(y, maxY))
    };
  }, []);

  useEffect(() => {
    if (!isCentered && landmark) {
      setTranslate({ x: 0, y: 0 });
      setIsCentered(true);
    }
  }, [landmark, isCentered]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!cardRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setHasMoved(true);
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    const cardWidth = cardRef.current.offsetWidth;
    const cardHeight = cardRef.current.offsetHeight;
    const clamped = clampTranslate(newX, newY, cardWidth, cardHeight);
    setTranslate(clamped);
  }, [dragStart.x, dragStart.y, clampTranslate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as EventListener);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove as EventListener);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove as EventListener);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleStart = (e: ReactMouseEvent | ReactTouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[class*="leaflet"]') || target.closest('[data-no-drag]')) return;
    if (!target.closest('[data-drag-handle]')) return;
    if ('touches' in e) e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: clientX - translate.x, y: clientY - translate.y });
    setZIndex(3000);
  };

  if (!landmark) return null;

  const handlePlayPause = async () => {
    const detailedText = getTranslatedContent(landmark, selectedLanguage, 'detailedDescription');
    if (!detailedText) return;
    if (isPlaying) {
      if (audioService.isPaused()) {
        await audioService.resumeSpeech();
      } else {
        audioService.pauseSpeech();
        setIsPaused(true);
      }
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      audioService.playText(detailedText, selectedLanguage, playbackRate, () => {
        setIsPlaying(false);
        setIsPaused(false);
      });
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioService.setRate(rate);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-6">
      <div className="w-2 h-2 bg-[#E9633F] rounded-[1px]" />
      <h3 className="font-bold text-sm text-[#444] tracking-tight">{title}</h3>
    </div>
  );

  const renderFullCard = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        width: '24rem',
        maxHeight: '90vh',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      className="bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100/50 overflow-hidden flex flex-col pointer-events-auto"
      onClick={() => setZIndex(3000)}
    >
      {/* Header */}
      <div
        className="p-5 pb-2 flex items-start justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20"
        data-drag-handle
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <div className="flex-1 pr-4">
          <h2 className="text-[20px] font-black text-[#1a1a1a] leading-tight mb-1">
            {getTranslatedContent(landmark, selectedLanguage, 'name')}
          </h2>
          <p className="text-[11px] text-gray-400 font-medium tracking-tight">
            {landmark.category} - {getTranslatedContent(landmark, selectedLanguage, 'description')?.slice(0, 80)}...
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-0 space-y-2 scrollbar-hide">
        {/* Badges */}
        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="h-7 px-3 rounded-full border-[#E9633F]/20 bg-[#E9633F]/5 text-[#E9633F] font-bold text-[10px]">
            {landmark.category}
          </Badge>
          {landmark.yearBuilt && (
            <Badge variant="outline" className="h-7 px-3 rounded-full border-gray-100 bg-gray-50/50 text-gray-500 font-bold text-[10px] gap-1">
              <span className="opacity-50 font-normal">🏗️</span> {landmark.yearBuilt}
            </Badge>
          )}
        </div>

        {/* Sections */}
        <section>
          <SectionHeader title={t('photos', selectedLanguage)} />
          <div className="rounded-2xl overflow-hidden" data-no-drag>
            <PhotoGallery
              photos={landmark.photos || []}
              title={getTranslatedContent(landmark, selectedLanguage, 'name')}
            />
          </div>
        </section>

        <section>
          <SectionHeader title={t('location', selectedLanguage)} />
          <div className="rounded-2xl overflow-hidden border border-gray-100 h-36 relative shadow-inner" data-no-drag>
            <MapContainer
              key={landmark.id}
              center={[landmark.lat, landmark.lng]}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              zoomControl={false}
              dragging={!isDragging}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker
                position={[landmark.lat, landmark.lng]}
                icon={L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="background: #E9633F; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(233, 99, 63, 0.4);"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7],
                })}
              />
            </MapContainer>
          </div>
        </section>

        <section>
          <SectionHeader title={t('category', selectedLanguage)} />
          <p className="text-[13px] text-[#555] leading-relaxed font-medium">
            {getTranslatedContent(landmark, selectedLanguage, 'description')}
          </p>
        </section>

        <section>
          <SectionHeader title={t('historicalInfo', selectedLanguage)} />
          <p className="text-[13px] text-[#555] leading-relaxed">
            {getTranslatedContent(landmark, selectedLanguage, 'historicalInfo')}
          </p>
        </section>

        {landmark.architect && (
          <section>
            <SectionHeader title={t('architect', selectedLanguage)} />
            <p className="text-[12px] text-gray-500 font-medium italic">
              {landmark.architect}
            </p>
          </section>
        )}

        {/* Audio (상세 정보) */}
        {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription') && (
          <section className="bg-[#FFF8F6] p-5 rounded-[20px] border border-[#FFE7E0] mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#E9633F] rounded-full" />
                <span className="font-bold text-[13px] text-[#E9633F]">{t('detailedInformation', selectedLanguage)}</span>
              </div>
              <span className="text-[10px] font-bold text-[#E9633F]/60 tracking-wider uppercase">{playbackRate.toFixed(1)}x</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={handlePlayPause}
                className="h-10 px-6 rounded-full bg-[#E9633F] text-white flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(233,99,63,0.3)]"
              >
                {isPlaying && !isPaused ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                <span className="font-bold text-sm tracking-tighter">재생</span>
              </button>

              <div className="flex gap-1 overflow-x-auto py-1 scrollbar-hide">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={`h-7 px-2.5 rounded-lg text-[10px] font-black transition-all ${playbackRate === rate
                        ? 'bg-[#E9633F] text-white shadow-md'
                        : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
                      }`}
                  >
                    {rate.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-[#714B40] leading-relaxed font-medium">
              {getTranslatedContent(landmark, selectedLanguage, 'detailedDescription')}
            </p>
          </section>
        )}

        {/* Booking */}
        <section className="bg-gray-50/50 p-5 rounded-[20px] border border-gray-100">
          <SectionHeader title={t('bookTickets', selectedLanguage)} />
          <div className="space-y-2">
            {['GetYourGuide', 'Viator', 'Klook'].map((platform) => (
              <button
                key={platform}
                onClick={() => {
                  const query = encodeURIComponent(getTranslatedContent(landmark, selectedLanguage, 'name'));
                  window.open(`https://www.google.com/search?q=${platform}+${query}`, '_blank');
                }}
                className="w-full h-11 bg-white border border-gray-100 rounded-xl px-4 flex items-center justify-between group hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" />
                  <span className="text-[12px] font-bold text-gray-600">{platform}에서 예약</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Fix spacer */}
        <div className="h-6" />
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-3 border-t border-gray-50 bg-white/90 backdrop-blur-md flex gap-3">
        <button
          onClick={handleNavigate}
          className="flex-1 h-12 bg-[#E9633F] text-white rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(233,99,63,0.3)]"
        >
          <Navigation className="w-4 h-4 fill-white" />
          <span className="font-bold text-[15px] tracking-tight">길안내</span>
        </button>
        {onAddToTour && (
          <button
            onClick={() => onAddToTour(landmark)}
            className="flex-1 h-12 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            <span className="text-gray-300 font-light text-xl">+</span>
            <span className="font-bold text-[15px] tracking-tight">{isInTour ? '제거' : '투어 추가'}</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderMinimizedIcon = () => (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex,
        cursor: 'pointer',
        transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`
      }}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onClick={() => { if (!hasMoved) setIsMinimized(false); }}
      className="p-1 rounded-full bg-white shadow-2xl border-4 border-[#E9633F]"
    >
      <div className="w-12 h-12 rounded-full bg-[#E9633F] flex items-center justify-center">
        <MapPinned className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return isMinimized ? renderMinimizedIcon() : renderFullCard();
}
