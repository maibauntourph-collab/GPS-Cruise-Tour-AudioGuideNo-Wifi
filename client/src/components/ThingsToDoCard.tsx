import React from 'react';
import { Star, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface ThingsToDoCardProps {
  tour: {
    productCode: string;
    title: string;
    imageUrl: string;
    rating: number;
    reviewCount: number;
    price: number;
    currency: string;
    duration: number | null;
    bookingUrl: string;
    flags: string[];
  };
  selectedLanguage: string;
  isOnline: boolean;
  onCardClick?: (tour: any) => void;
}

const translations: Record<string, Record<string, string>> = {
  ko: {
    viewTour: '체험 보기',
    freeCancel: '무료 취소',
    sellingFast: '매진 임박',
    from: '부터',
    reviews: '리뷰',
    bookWhenOnline: '온라인 시 예약 가능',
    hr: '시간',
    min: '분',
  },
  en: {
    viewTour: 'View Tour',
    freeCancel: 'Free Cancel',
    sellingFast: 'Selling Fast',
    from: 'From',
    reviews: 'reviews',
    bookWhenOnline: 'Book When Online',
    hr: 'hr',
    min: 'min',
  },
  ja: {
    viewTour: '詳細を見る',
    freeCancel: 'キャンセル無料',
    sellingFast: '残りわずか',
    from: 'から',
    reviews: '件のレビュー',
    bookWhenOnline: 'Book When Online',
    hr: '時間',
    min: '分',
  },
  zh: {
    viewTour: '查看详情',
    freeCancel: '免费取消',
    sellingFast: '即将售罄',
    from: '起',
    reviews: '条评价',
    bookWhenOnline: 'Book When Online',
    hr: '小时',
    min: '分钟',
  },
};

function t(key: string, lang: string): string {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}

function formatDuration(minutes: number, lang: string): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hrs}${t('hr', lang)}`;
    return `${hrs}${t('hr', lang)} ${mins}${t('min', lang)}`;
  }
  return `${minutes}${t('min', lang)}`;
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

export default function ThingsToDoCard({
  tour,
  selectedLanguage,
  isOnline,
  onCardClick,
}: ThingsToDoCardProps) {
  const lang = translations[selectedLanguage] ? selectedLanguage : 'en';
  const hasFreeCancellation = tour.flags.includes('FREE_CANCELLATION');
  const isLikelyToSellOut = tour.flags.includes('LIKELY_TO_SELL_OUT');

  const handleClick = () => {
    onCardClick?.(tour);
    if (isOnline && tour.bookingUrl) {
      window.open(tour.bookingUrl, '_blank');
    }
  };

  return (
    <div
      className="w-64 flex-shrink-0 rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform duration-150 cursor-pointer select-none"
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img
          src={tour.imageUrl}
          alt={tour.title}
          className="w-full h-full object-cover rounded-t-2xl"
          loading="lazy"
        />
        {isLikelyToSellOut && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
            {t('sellingFast', lang)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 min-h-[2.5rem]">
          {tour.title}
        </h3>

        {/* Rating */}
        {tour.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-gray-800">
              {tour.rating.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({tour.reviewCount.toLocaleString()} {t('reviews', lang)})
            </span>
          </div>
        )}

        {/* Duration */}
        {tour.duration != null && (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{formatDuration(tour.duration, lang)}</span>
          </div>
        )}

        {/* Free cancellation */}
        {hasFreeCancellation && (
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{t('freeCancel', lang)}</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-1">
          <span className="text-xs text-gray-500">{t('from', lang)} </span>
          <span className="text-lg font-extrabold text-gray-900">
            {formatPrice(tour.price, tour.currency)}
          </span>
        </div>

        {/* CTA Button */}
        {isOnline ? (
          <button
            className="mt-1.5 w-full flex items-center justify-center gap-1.5 bg-[#E85D36] hover:bg-[#d04e2c] text-white text-sm font-semibold py-2 rounded-xl transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (tour.bookingUrl) {
                window.open(tour.bookingUrl, '_blank');
              }
              onCardClick?.(tour);
            }}
          >
            {t('viewTour', lang)}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            disabled
            className="mt-1.5 w-full flex items-center justify-center gap-1.5 bg-gray-300 text-gray-600 text-sm font-semibold py-2 rounded-xl cursor-not-allowed"
          >
            {t('bookWhenOnline', lang)}
          </button>
        )}
      </div>
    </div>
  );
}
