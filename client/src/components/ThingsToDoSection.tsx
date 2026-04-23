/**
 * ThingsToDoSection — 랜드마크 근처 체험 예약 섹션
 *
 * 플랫폼: Viator (Partner API 실연동 유일)
 * UI 참고: cruiseportiq.com
 */

import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Star, Clock, CheckCircle, Search } from "lucide-react";

// ── 다국어 ────────────────────────────────────────────────────
const I18N: Record<string, Record<string, string>> = {
  ko: {
    sectionTitle: "📍 근처 인기 체험",
    seeAll: "비아터에서 더보기 →",
    loading: "체험을 불러오는 중...",
    noResult: "현재 이 도시의 Viator 상품을 불러올 수 없습니다.",
    searchViator: "Viator에서 직접 검색하기 →",
    from: "부터",
    reviews: "리뷰",
    hr: "시간",
    min: "분",
    freeCancelLabel: "무료 취소",
    bookNow: "예약하기",
    sellingFast: "매진 임박",
    poweredBy: "실시간 투어 정보 제공",
  },
  en: {
    sectionTitle: "📍 Things to Do Nearby",
    seeAll: "See All on Viator →",
    loading: "Loading experiences...",
    noResult: "Viator tours unavailable for this city right now.",
    searchViator: "Search on Viator →",
    from: "From",
    reviews: "reviews",
    hr: "hr",
    min: "min",
    freeCancelLabel: "Free Cancellation",
    bookNow: "Book Now",
    sellingFast: "Selling Fast",
    poweredBy: "Live tour data",
  },
};

function i(lang: string, key: string): string {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

function fmtDuration(min: number, lang: string): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}${i(lang, "hr")}` : `${h}${i(lang, "hr")} ${m}${i(lang, "min")}`;
  }
  return `${min}${i(lang, "min")}`;
}

const VIATOR_SEARCH_URL = (kw: string) =>
  `https://www.viator.com/searchResults/all?text=${encodeURIComponent(kw)}`;

// ── 타입 ──────────────────────────────────────────────────────
interface Tour {
  productCode: string;
  title: string;
  description?: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration: number | null;
  bookingUrl: string;
  flags: string[];
}

interface Props {
  landmark: {
    id: string;
    name: string;
    cityId: string;
    translations?: any;
  };
  selectedLanguage: string;
  isOnline: boolean;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function ThingsToDoSection({ landmark, selectedLanguage, isOnline }: Props) {
  const lang = I18N[selectedLanguage] ? selectedLanguage : "en";
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const cacheRef = useRef<Map<string, Tour[]>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!landmark?.id || !landmark?.cityId) { setLoading(false); return; }

    const cacheKey = `${landmark.id}_${landmark.cityId}`;
    if (cacheRef.current.has(cacheKey)) {
      setTours(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }

    if (!isOnline) { setLoading(false); return; }

    let cancelled = false;

    async function fetchTours() {
      setLoading(true);
      setApiError(false);
      try {
        // 1차: 랜드마크 키워드 검색
        const res = await fetch(
          `/api/viator/search?${new URLSearchParams({ q: landmark.name, city: landmark.cityId, count: "6" })}`
        );
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        let results: Tour[] = data.tours || data.products || data.data || [];

        // 2차: 도시 인기 투어 폴백
        if (results.length === 0) {
          const fb = await fetch(`/api/viator/tours/${landmark.cityId}?count=6`);
          if (fb.ok) {
            const fbData = await fb.json();
            results = fbData.tours || fbData.products || fbData.data || [];
          }
        }

        if (!cancelled) {
          setTours(results);
          cacheRef.current.set(cacheKey, results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setApiError(true); setLoading(false); }
      }
    }

    fetchTours();
    return () => { cancelled = true; };
  }, [landmark?.id, landmark?.cityId, landmark?.name, isOnline]);

  // 오프라인 + 캐시 없음 → 숨김
  if (!isOnline && tours.length === 0) return null;

  const showCards = !apiError && tours.length > 0;

  return (
    <div className="mt-6 mb-2">
      {/* ── 헤더 ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            {i(lang, "sectionTitle")}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">{landmark.name}</p>
        </div>
        {showCards && (
          <a
            href={VIATOR_SEARCH_URL(landmark.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold text-[#E85D36] hover:underline flex-shrink-0"
          >
            {i(lang, "seeAll")}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* ── 콘텐츠 ─────────────────────────────────────────────── */}
      {loading ? (
        // 스켈레톤
        <div className="flex gap-3 overflow-x-hidden">
          {[0, 1, 2].map((n) => (
            <div key={n} className="animate-pulse flex-shrink-0 w-56 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <div className="h-32 bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-3/6" />
                <div className="h-8 bg-gray-200 rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : showCards ? (
        // Viator API 카드 캐루셀
        <div className="relative group">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -240, behavior: "smooth" })}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-[#FCF9F6] to-transparent pointer-events-none z-[5]" />

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as any}
          >
            {tours.map((tour) => (
              <ViatorCard
                key={tour.productCode}
                tour={tour}
                lang={lang}
                isOnline={isOnline}
                onSelect={setSelectedTour}
              />
            ))}
          </div>
        </div>
      ) : (
        // API 실패 / 결과 없음 → Viator 직접 검색 유도
        <a
          href={isOnline ? VIATOR_SEARCH_URL(landmark.name) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 w-full rounded-2xl border border-[#E85D36]/30 bg-[#FFF3EF] px-4 py-4 ${
            isOnline ? "cursor-pointer hover:border-[#E85D36]/60 transition-colors" : "cursor-default opacity-60"
          }`}
        >
          <span className="text-2xl">🌟</span>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-[#E85D36]">Viator</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{i(lang, "noResult")}</p>
          </div>
          {isOnline && (
            <span className="text-[11px] font-semibold text-[#E85D36] whitespace-nowrap flex items-center gap-1">
              {i(lang, "searchViator")}
            </span>
          )}
        </a>
      )}

      {/* ── Viator 크레딧 ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        <span className="text-[9px] text-gray-300">{i(lang, "poweredBy")}</span>
        <span className="text-[9px] font-bold text-[#E85D36]/60">Viator Partner API</span>
      </div>

      {/* ── 투어 상세 바텀시트 ─────────────────────────────────── */}
      {selectedTour && (
        <TourBottomSheet
          tour={selectedTour}
          lang={lang}
          onClose={() => setSelectedTour(null)}
        />
      )}
    </div>
  );
}

// ── Viator 투어 카드 ─────────────────────────────────────────
function ViatorCard({
  tour,
  lang,
  isOnline,
  onSelect,
}: {
  tour: Tour;
  lang: string;
  isOnline: boolean;
  onSelect: (t: Tour) => void;
}) {
  const hasFreeCancellation = tour.flags.includes("FREE_CANCELLATION");
  const isLikelyToSellOut = tour.flags.includes("LIKELY_TO_SELL_OUT");

  return (
    <div
      className="flex-shrink-0 w-56 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => {
        onSelect(tour);
        if (isOnline && tour.bookingUrl) window.open(tour.bookingUrl, "_blank");
      }}
    >
      {/* 이미지 */}
      <div className="relative h-32 overflow-hidden bg-gray-100">
        <img
          src={tour.imageUrl}
          alt={tour.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute top-2 left-2 bg-[#E85D36] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
          Viator
        </span>
        {isLikelyToSellOut && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
            {i(lang, "sellingFast")}
          </span>
        )}
        {/* 가격 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2.5 pb-1.5 pt-4">
          <span className="text-white text-xs">{i(lang, "from")} </span>
          <span className="text-white text-sm font-extrabold">${tour.price.toFixed(0)}</span>
        </div>
      </div>

      {/* 내용 */}
      <div className="p-2.5 space-y-1.5">
        <h4 className="text-[12px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">
          {tour.title}
        </h4>

        {tour.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-gray-800">{tour.rating.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400">({tour.reviewCount.toLocaleString()})</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
          {tour.duration != null && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {fmtDuration(tour.duration, lang)}
            </span>
          )}
          {hasFreeCancellation && (
            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
              <CheckCircle className="w-3 h-3" />
              {i(lang, "freeCancelLabel")}
            </span>
          )}
        </div>

        <button
          className="w-full flex items-center justify-center gap-1 bg-[#E85D36] hover:bg-[#cf4f2d] text-white text-[11px] font-bold py-1.5 rounded-xl transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (isOnline && tour.bookingUrl) window.open(tour.bookingUrl, "_blank");
          }}
        >
          {i(lang, "bookNow")}
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── 투어 상세 바텀시트 ─────────────────────────────────────
function TourBottomSheet({
  tour,
  lang,
  onClose,
}: {
  tour: Tour;
  lang: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-h-[85vh] bg-white rounded-t-3xl overflow-hidden"
        style={{ animation: "slideUp 0.25s ease-out" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="relative aspect-video overflow-hidden">
          <img src={tour.imageUrl} alt={tour.title} className="w-full h-full object-cover" />
          <span className="absolute top-3 left-3 bg-[#E85D36] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Viator
          </span>
          {tour.flags.includes("FREE_CANCELLATION") && (
            <span className="absolute bottom-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              ✓ {i(lang, "freeCancelLabel")}
            </span>
          )}
        </div>

        <div className="p-5 space-y-3 overflow-y-auto max-h-[40vh]">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{tour.title}</h3>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            {tour.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <strong>{tour.rating.toFixed(1)}</strong>
                <span className="text-gray-400">({tour.reviewCount.toLocaleString()} {i(lang, "reviews")})</span>
              </span>
            )}
            {tour.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {fmtDuration(tour.duration, lang)}
              </span>
            )}
          </div>

          {tour.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{tour.description}</p>
          )}

          <div className="flex items-end justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400">{i(lang, "from")}</p>
              <p className="text-2xl font-extrabold text-gray-900">${tour.price.toFixed(0)}</p>
            </div>
            <button
              className="px-6 py-3 bg-[#E85D36] hover:bg-[#cf4f2d] text-white font-bold rounded-2xl shadow-lg transition-colors"
              onClick={() => tour.bookingUrl && window.open(tour.bookingUrl, "_blank")}
            >
              {i(lang, "bookNow")} →
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
            <span>🔒 {lang === "ko" ? "안전 결제" : "Secure Payment"}</span>
            <span>⚡ {lang === "ko" ? "즉시 확인" : "Instant Confirmation"}</span>
            <span>📱 {lang === "ko" ? "앱 유지" : "App Stays Open"}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
