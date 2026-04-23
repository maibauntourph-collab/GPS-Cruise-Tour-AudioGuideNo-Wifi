/**
 * EssentialsSection — 크루즈 기항지 필수 시설 섹션
 *
 * ATM, 약국, 병원, 경찰서 등을 카테고리별 탭으로 표시
 * 테마: emerald/green
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type EssentialCategory = 'atm' | 'pharmacy' | 'hospital' | 'police' | 'wifi' | 'info' | 'toilet';

interface Essential {
  id: string;
  name: string;
  category: EssentialCategory;
  emoji: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  distance?: number;
  googleMapsUrl: string;
}

const TEXT = {
  ko: {
    title: '🏦 필수 시설',
    all: '전체', atm: '💰 ATM', pharmacy: '💊 약국', hospital: '🏥 병원',
    police: '🚔 경찰', toilet: '🚻 화장실', info: 'ℹ️ 안내',
    showMore: '더 보기', showLess: '접기', mapButton: '지도에서 보기',
    error: '정보를 불러오지 못했습니다.', noResult: '해당 카테고리 시설이 없습니다.',
    distance: (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`,
  },
  en: {
    title: '🏦 Essential Services',
    all: 'All', atm: '💰 ATM', pharmacy: '💊 Pharmacy', hospital: '🏥 Hospital',
    police: '🚔 Police', toilet: '🚻 Toilet', info: 'ℹ️ Info',
    showMore: 'Show More', showLess: 'Show Less', mapButton: 'View on Map',
    error: 'Failed to load services.', noResult: 'No services in this category.',
    distance: (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`,
  },
} as const;

type FilterTab = 'all' | EssentialCategory;
const FILTER_TABS: FilterTab[] = ['all', 'atm', 'pharmacy', 'hospital', 'police', 'toilet', 'info'];
const PAGE_SIZE = 10;

function SkeletonCard() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-emerald-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-emerald-200 rounded w-2/3" />
        <div className="h-3 bg-emerald-100 rounded w-1/3" />
      </div>
    </div>
  );
}

function EssentialCard({ item, t }: { item: Essential; t: typeof TEXT['ko'] }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-emerald-100 bg-white hover:bg-emerald-50 transition-colors">
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.distance !== undefined && (
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              {t.distance(item.distance)}
            </span>
          )}
          {item.address && <span className="text-xs text-gray-400 truncate">{item.address}</span>}
        </div>
        {item.phone && <p className="text-xs text-gray-400 mt-0.5">{item.phone}</p>}
      </div>
      <a
        href={item.googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
      >
        {t.mapButton}
      </a>
    </div>
  );
}

interface Props {
  city: string;
  language?: string;
}

export default function EssentialsSection({ city, language = 'ko' }: Props) {
  const t = language === 'en' ? TEXT.en : TEXT.ko;
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, isError } = useQuery<Essential[]>({
    queryKey: ['essentials', city],
    queryFn: async () => {
      const res = await fetch(`/api/essentials/${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 30,
    retry: 2,
    enabled: !!city,
  });

  const filtered = (data ?? []).filter((item) => activeTab === 'all' || item.category === activeTab);
  const displayed = showAll ? filtered : filtered.slice(0, PAGE_SIZE);
  const hasMore = filtered.length > PAGE_SIZE;

  const tabLabel = (tab: FilterTab): string => {
    if (tab === 'all') return t.all;
    return (t as any)[tab] as string;
  };

  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-bold text-gray-900">{t.title}</h3>
        <span className="text-[9px] text-gray-300">OpenStreetMap</span>
      </div>

      {/* 카테고리 필터 탭 */}
      <div
        className="flex gap-2 pb-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setShowAll(false); }}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div className="space-y-2">
        {isLoading && [0,1,2,3].map((n) => <SkeletonCard key={n} />)}

        {isError && !isLoading && (
          <div className="text-center py-6 text-sm text-red-400 rounded-2xl bg-red-50">{t.error}</div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-6 text-sm text-gray-400 rounded-2xl bg-gray-50">{t.noResult}</div>
        )}

        {!isLoading && !isError && displayed.map((item) => (
          <EssentialCard key={item.id} item={item} t={t} />
        ))}

        {!isLoading && !isError && hasMore && (
          <button
            onClick={() => setShowAll((p) => !p)}
            className="w-full py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
          >
            {showAll ? `▲ ${t.showLess}` : `▼ ${t.showMore} (${filtered.length - PAGE_SIZE})`}
          </button>
        )}
      </div>
    </div>
  );
}
