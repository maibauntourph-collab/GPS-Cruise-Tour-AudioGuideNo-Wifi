/**
 * AmazonSection — Amazon PA API 5.0 여행상품 2열 그리드
 * ThingsToDoSection.tsx 패턴 미러링 + Shopify 카드 fallback 지원
 */

import React, { useEffect, useState, useRef } from 'react';
import { Star, ExternalLink, ShoppingBag } from 'lucide-react';

interface AmazonProduct {
  asin: string;
  title: string;
  imageUrl: string;
  price: number | null;
  currency: string;
  rating: number | null;
  reviewCount: number | null;
  affiliateUrl: string;
}

interface Props {
  keyword?: string;
  count?: number;
  selectedLanguage: string;
  isOnline: boolean;
  fallback?: React.ReactNode;
}

const I18N: Record<string, Record<string, string>> = {
  ko: {
    sectionTitle: '🛍️ 여행 필수 아이템',
    seeAll: 'Amazon에서 더보기 →',
    loading: '상품을 불러오는 중...',
    buyOnAmazon: 'Amazon에서 구매',
    poweredBy: '상품 정보 제공',
    reviews: '리뷰',
  },
  en: {
    sectionTitle: '🛍️ Travel Essentials',
    seeAll: 'See More on Amazon →',
    loading: 'Loading products...',
    buyOnAmazon: 'Buy on Amazon',
    poweredBy: 'Product data',
    reviews: 'reviews',
  },
};

function t(lang: string, key: string): string {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

export default function AmazonSection({ keyword, count = 6, selectedLanguage, isOnline, fallback }: Props) {
  const lang = I18N[selectedLanguage] ? selectedLanguage : 'en';
  const [products, setProducts] = useState<AmazonProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const cacheRef = useRef<Map<string, AmazonProduct[]>>(new Map());

  useEffect(() => {
    if (!isOnline) { setLoading(false); return; }

    const cacheKey = keyword || '__random__';
    if (cacheRef.current.has(cacheKey)) {
      setProducts(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setApiError(false);

    const params = new URLSearchParams({ count: String(count) });
    if (keyword) params.set('q', keyword);

    fetch(`/api/amazon/search?${params}`)
      .then(res => { if (!res.ok) throw new Error('amazon failed'); return res.json(); })
      .then(data => {
        if (cancelled) return;
        const results: AmazonProduct[] = data.products || [];
        setProducts(results);
        cacheRef.current.set(cacheKey, results);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setApiError(true); setLoading(false); } });

    return () => { cancelled = true; };
  }, [keyword, count, isOnline]);

  if (!isOnline && products.length === 0) return fallback ? <>{fallback}</> : null;
  if (!loading && (apiError || products.length === 0)) return fallback ? <>{fallback}</> : null;

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-bold text-gray-900">{t(lang, 'sectionTitle')}</h3>
        </div>
        {products.length > 0 && (
          <a
            href="https://www.amazon.com/s?k=travel+accessories"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:underline flex-shrink-0"
          >
            {t(lang, 'seeAll')}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-1">
          {[0, 1, 2, 3].map(n => (
            <div key={n} className="animate-pulse rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <div className="aspect-square bg-gray-200" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-7 bg-gray-200 rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-1">
          {products.map(p => <AmazonProductCard key={p.asin} product={p} isOnline={isOnline} lang={lang} />)}
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        <span className="text-[9px] text-gray-300">{t(lang, 'poweredBy')}</span>
        <span className="text-[9px] font-bold text-orange-400/60">Amazon PA API 5.0</span>
      </div>
    </div>
  );
}

function AmazonProductCard({ product: p, isOnline, lang }: { product: AmazonProduct; isOnline: boolean; lang: string }) {
  return (
    <div
      className="rounded-2xl bg-white border border-orange-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => { if (isOnline && p.affiliateUrl) window.open(p.affiliateUrl, '_blank'); }}
    >
      <div className="relative aspect-square overflow-hidden bg-orange-50">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-contain p-2" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
        )}
        <span className="absolute top-1.5 right-1.5 bg-orange-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Amazon</span>
      </div>
      <div className="p-2 space-y-1">
        <h4 className="text-[11px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2rem]">{p.title}</h4>
        {p.rating != null && (
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-gray-800">{p.rating.toFixed(1)}</span>
            {p.reviewCount != null && <span className="text-[10px] text-gray-400">({p.reviewCount.toLocaleString()})</span>}
          </div>
        )}
        {p.price != null && (
          <p className="font-extrabold text-orange-600 text-sm">${p.price.toFixed(2)}</p>
        )}
        <button
          className="w-full flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold py-1.5 rounded-xl transition-colors"
          onClick={e => { e.stopPropagation(); if (isOnline && p.affiliateUrl) window.open(p.affiliateUrl, '_blank'); }}
        >
          {I18N[lang]?.buyOnAmazon ?? 'Buy on Amazon'}
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}
