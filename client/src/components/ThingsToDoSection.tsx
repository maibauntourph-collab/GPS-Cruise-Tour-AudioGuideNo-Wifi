import React, { useEffect, useState, useRef } from "react";
import ThingsToDoCard from "./ThingsToDoCard";

interface ThingsToDoSectionProps {
  landmark: {
    id: string;
    name: string;
    cityId: string;
    translations?: any;
  };
  selectedLanguage: string;
  isOnline: boolean;
}

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

const translations: Record<string, { title: (name: string) => string; seeAll: string; loading: string; offline: string }> = {
  ko: {
    title: (name: string) => `📍 ${name} 근처 인기 체험`,
    seeAll: "체험 더보기 →",
    loading: "추천 체험을 불러오는 중...",
    offline: "오프라인",
  },
  en: {
    title: (name: string) => `📍 Things to Do near ${name}`,
    seeAll: "See All →",
    loading: "Loading tours...",
    offline: "Offline",
  },
};

function getTranslation(lang: string) {
  return translations[lang] || translations.en;
}

export default function ThingsToDoSection({
  landmark,
  selectedLanguage,
  isOnline,
}: ThingsToDoSectionProps) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const cacheRef = useRef<Map<string, Tour[]>>(new Map());

  const t = getTranslation(selectedLanguage);

  useEffect(() => {
    if (!landmark?.id || !landmark?.cityId) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `${landmark.id}_${landmark.cityId}`;
    if (cacheRef.current.has(cacheKey)) {
      setTours(cacheRef.current.get(cacheKey)!);
      setLoading(false);
      return;
    }

    if (!isOnline) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTours() {
      setLoading(true);
      setError(false);

      try {
        // Primary: keyword search
        const searchParams = new URLSearchParams({
          q: landmark.name,
          city: landmark.cityId,
          count: "6",
        });
        const searchRes = await fetch(`/api/viator/search?${searchParams}`);

        if (!searchRes.ok) throw new Error("Search failed");

        const searchData = await searchRes.json();
        let results: Tour[] = searchData.tours || searchData.products || searchData.data || [];

        // Fallback: city tours if keyword search returned empty
        if (results.length === 0) {
          const fallbackRes = await fetch(
            `/api/viator/tours/${landmark.cityId}?count=6`
          );
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            results = fallbackData.tours || fallbackData.products || fallbackData.data || [];
          }
        }

        if (!cancelled) {
          setTours(results);
          cacheRef.current.set(cacheKey, results);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    fetchTours();

    return () => {
      cancelled = true;
    };
  }, [landmark?.id, landmark?.cityId, landmark?.name, isOnline]);

  // Error state: silent
  if (error) return null;

  // Loading state
  if (loading) {
    return (
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-base font-bold text-gray-900">
            {t.title(landmark.name)}
          </h3>
        </div>
        <div className="flex overflow-x-auto gap-3 scrollbar-hide">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 rounded-2xl w-64 h-48 flex-shrink-0"
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">{t.loading}</p>
      </div>
    );
  }

  // Offline with no cached data
  if (!isOnline && tours.length === 0) {
    return (
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="text-base font-bold text-gray-900">
            {t.title(landmark.name)}
          </h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">{t.offline}</p>
      </div>
    );
  }

  // Empty state: don't render
  if (tours.length === 0) return null;

  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-base font-bold text-gray-900">
          {t.title(landmark.name)}
        </h3>
        <a
          href={`https://www.viator.com/searchResults/all?text=${encodeURIComponent(landmark.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#E85D36] font-semibold"
        >
          {t.seeAll}
        </a>
      </div>

      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        {tours.map((tour) => (
          <div key={tour.productCode} className="snap-start flex-shrink-0">
            <ThingsToDoCard tour={tour} selectedLanguage={selectedLanguage} isOnline={isOnline} />
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-300 text-center mt-2">
        Powered by Viator
      </p>
    </div>
  );
}
