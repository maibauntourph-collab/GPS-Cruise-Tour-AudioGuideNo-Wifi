/**
 * FoodSection — Yelp Fusion API 기반 레스토랑 카드 캐루셀
 * ThingsToDoSection.tsx 패턴을 그대로 미러링합니다.
 * Viator API 실패 시처럼 fallback prop으로 기존 플랫폼 버튼 유지
 */

import React, { useEffect, useState, useRef } from 'react';
import { Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface YelpRestaurant {
  id: string;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  price: string | null;
  url: string;
  categories: string[];
  phone: string;
  location: string;
}

interface Props {
  landmark: {
    id: string;
    name: string;
    cityId: string;
  };
  selectedLanguage: string;
  isOnline: boolean;
  fallback?: React.ReactNode;
}

const I18N: Record<string, Record<string, string>> = {
  ko: {
    sectionTitle: '🍽️ 근처 레스토랑',
    seeAll: 'Yelp에서 더보기 →',
    loading: '맛집을 불러오는 중...',
    noResult: 'Yelp 정보를 불러올 수 없습니다.',
    reviews: '리뷰',
    viewOnYelp: 'Yelp에서 보기',
    poweredBy: '맛집 정보 제공',
  },
  en: {
    sectionTitle: '🍽️ Nearby Restaurants',
    seeAll: 'See All on Yelp →',
    loading: 'Loading restaurants...',
    noResult: 'Yelp restaurants unavailable.',
    reviews: 'reviews',
    viewOnYelp: 'View on Yelp',
    poweredBy: 'Restaurant data',
  },
};

function t(lang: string, key: string): string {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

export default function FoodSection({ landmark, selectedLanguage, isOnline, fallback }: Props) {
  const lang = I18N[selectedLanguage] ? selectedLanguage : 'en';
  const [restaurants, setRestaurants] = useState<YelpRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const cacheRef = useRef<Map<string, YelpRestaurant[]>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!landmark?.id || !landmark?.cityId) { setLoading(false); return; }

    const cacheKey = `${landmark.id}_${landmark.cityId}`;
    if (cacheRef.current.has(cacheKey)) {
      setRestaurants(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }
    if (!isOnline) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    setApiError(false);

    fetch(`/api/yelp/search?${new URLSearchParams({ q: landmark.name, city: landmark.cityId, count: '5' })}`)
      .then(res => { if (!res.ok) throw new Error('yelp failed'); return res.json(); })
      .then(data => {
        if (cancelled) return;
        const results: YelpRestaurant[] = data.restaurants || [];
        setRestaurants(results);
        cacheRef.current.set(cacheKey, results);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setApiError(true); setLoading(false); } });

    return () => { cancelled = true; };
  }, [landmark?.id, landmark?.cityId, landmark?.name, isOnline]);

  if (!isOnline && restaurants.length === 0) return fallback ? <>{fallback}</> : null;
  if (!loading && (apiError || restaurants.length === 0)) return fallback ? <>{fallback}</> : null;

  const showCards = !apiError && restaurants.length > 0;

  return (
    <div className="mb-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-bold text-gray-900">{t(lang, 'sectionTitle')}</h3>
        {showCards && (
          <a
            href={`https://www.yelp.com/search?find_desc=restaurants&find_loc=${encodeURIComponent(landmark.name)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline flex-shrink-0"
          >
            {t(lang, 'seeAll')}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-hidden">
          {[0, 1, 2].map(n => (
            <div key={n} className="animate-pulse flex-shrink-0 w-52 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <div className="h-28 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-3/6" />
                <div className="h-8 bg-gray-200 rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[#FCF9F6] to-transparent pointer-events-none z-[5]" />
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any}
          >
            {restaurants.map(r => <RestaurantCard key={r.id} restaurant={r} isOnline={isOnline} lang={lang} />)}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        <span className="text-[9px] text-gray-300">{t(lang, 'poweredBy')}</span>
        <span className="text-[9px] font-bold text-red-400/60">Yelp Fusion API</span>
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant: r, isOnline, lang }: { restaurant: YelpRestaurant; isOnline: boolean; lang: string }) {
  return (
    <div
      className="flex-shrink-0 w-52 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => { if (isOnline && r.url) window.open(r.url, '_blank'); }}
    >
      <div className="relative h-28 overflow-hidden bg-amber-50">
        {r.imageUrl ? (
          <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
        )}
        <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Yelp</span>
        {r.price && (
          <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{r.price}</span>
        )}
      </div>
      <div className="p-2.5 space-y-1.5">
        <h4 className="text-[12px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.2rem]">{r.name}</h4>
        {r.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-gray-800">{r.rating.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400">({r.reviewCount.toLocaleString()})</span>
          </div>
        )}
        {r.categories.length > 0 && (
          <p className="text-[10px] text-gray-400 line-clamp-1">{r.categories.slice(0, 2).join(' · ')}</p>
        )}
        <button
          className="w-full flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold py-1.5 rounded-xl transition-colors"
          onClick={e => { e.stopPropagation(); if (isOnline && r.url) window.open(r.url, '_blank'); }}
        >
          {I18N[lang]?.viewOnYelp ?? 'View on Yelp'}
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
