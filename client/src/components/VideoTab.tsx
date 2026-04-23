/**
 * VideoTab — 크루즈 기항지 YouTube 영상 탭
 *
 * 기항지 도시 관련 YouTube 영상을 가로 스크롤 카드로 표시
 * 카드 클릭 시 인라인 YouTube iframe 바텀시트 재생
 * 테마: 빨간색 (YouTube 브랜드)
 */

import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Play, Eye, Clock, X } from 'lucide-react';

const I18N: Record<string, Record<string, string>> = {
  ko: {
    sectionTitle: '▶ 관련 YouTube 영상',
    loading: '영상을 불러오는 중...',
    noResult: '이 도시의 YouTube 영상을 불러올 수 없습니다.',
    poweredBy: 'YouTube Data API',
    views: '조회수',
    watchNow: '영상 보기',
    close: '닫기',
    fallback: '데모 영상 (API 키 미설정)',
  },
  en: {
    sectionTitle: '▶ YouTube Videos',
    loading: 'Loading videos...',
    noResult: 'No YouTube videos available for this city.',
    poweredBy: 'YouTube Data API',
    views: 'views',
    watchNow: 'Watch Now',
    close: 'Close',
    fallback: 'Demo videos (API key not set)',
  },
};

function t(lang: string, key: string): string {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  isOwnChannel?: boolean;
}

interface Props {
  city: string;
  language?: string;
}

function formatViewCount(count: string | undefined): string {
  const n = parseInt(count || '0');
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

function formatDuration(iso: string | undefined): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(dateStr: string, lang: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return lang === 'ko' ? '오늘' : 'Today';
  if (days < 30) return lang === 'ko' ? `${days}일 전` : `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return lang === 'ko' ? `${months}개월 전` : `${months}mo ago`;
  const years = Math.floor(months / 12);
  return lang === 'ko' ? `${years}년 전` : `${years}y ago`;
}

export default function VideoTab({ city, language = 'en' }: Props) {
  const lang = I18N[language] ? language : 'en';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const { data, isLoading, isError } = useQuery<{ videos: YouTubeVideo[]; isFallback?: boolean }>({
    queryKey: ['/api/youtube/search', city],
    queryFn: async () => {
      const res = await fetch(`/api/youtube/search?city=${encodeURIComponent(city)}`);
      if (!res.ok) throw new Error(`YouTube API ${res.status}`);
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
    retry: 1,
    enabled: !!city,
  });

  const videos = data?.videos ?? [];
  const isFallback = data?.isFallback ?? false;

  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight">
            {t(lang, 'sectionTitle')}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{city}</p>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#FF0000">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span className="text-[10px] font-bold text-[#FF0000]/70">YouTube</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-hidden">
          {[0, 1, 2].map((n) => (
            <div key={n} className="animate-pulse flex-shrink-0 w-60 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              <div className="relative bg-gray-200" style={{ paddingBottom: '56.25%' }} />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-5/6" />
                <div className="h-3 bg-gray-200 rounded w-4/6" />
                <div className="h-3 bg-gray-200 rounded w-3/6" />
              </div>
            </div>
          ))}
        </div>
      ) : isError || videos.length === 0 ? (
        <div className="flex items-center gap-3 w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 24 24" fill="#FF0000" opacity="0.5">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <div>
            <p className="text-[13px] font-bold text-red-600">YouTube</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{t(lang, 'noResult')}</p>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -256, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 256, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {videos.map((video) => (
              <VideoCard key={video.videoId} video={video} lang={lang} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-2.5">
        {isFallback && <span className="text-[9px] text-amber-500 mr-1">{t(lang, 'fallback')} ·</span>}
        <span className="text-[9px] text-gray-300">{t(lang, 'poweredBy')}</span>
      </div>

      {selectedVideo && (
        <VideoBottomSheet video={selectedVideo} lang={lang} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}

function VideoCard({ video, lang, onClick }: { video: YouTubeVideo; lang: string; onClick: () => void }) {
  const dur = formatDuration(video.duration);
  const views = formatViewCount(video.viewCount);

  return (
    <div
      className="flex-shrink-0 w-60 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="relative overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
        <img src={video.thumbnailUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
          <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {video.isOwnChannel ? (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
            ✨ Official Guide
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-[#FF0000] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">YouTube</span>
        )}
        {dur && <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">{dur}</span>}
      </div>
      <div className="p-2.5 space-y-1">
        <h4 className="text-[12px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.5rem]">{video.title}</h4>
        <p className="text-[11px] text-gray-500 truncate">{video.channelTitle}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {views && views !== '0' && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{views}</span>}
          <span>{timeAgo(video.publishedAt, lang)}</span>
        </div>
      </div>
    </div>
  );
}

function VideoBottomSheet({ video, lang, onClose }: { video: YouTubeVideo; lang: string; onClose: () => void }) {
  const embedUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-h-[90vh] bg-[#0f0f0f] rounded-t-3xl overflow-hidden"
        style={{ animation: 'slideUp 0.25s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pt-3 pb-2 px-4">
          <div className="w-10 h-1 rounded-full bg-gray-600 mx-auto absolute left-1/2 -translate-x-1/2" />
          <div className="w-10" />
          <button onClick={onClose} className="ml-auto flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <div className="px-4 py-3 space-y-1.5 overflow-y-auto max-h-[30vh]">
          <h3 className="text-sm font-bold text-white leading-snug">{video.title}</h3>
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span className="font-medium text-gray-300">{video.channelTitle}</span>
            {video.viewCount && video.viewCount !== '0' && (
              <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatViewCount(video.viewCount)} {t(lang, 'views')}</span>
            )}
            {video.duration && (
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{formatDuration(video.duration)}</span>
            )}
          </div>
          {video.description && <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">{video.description}</p>}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
