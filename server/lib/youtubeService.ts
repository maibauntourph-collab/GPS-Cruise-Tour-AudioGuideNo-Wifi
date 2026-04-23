/**
 * YouTube Data API v3 Service
 *
 * 크루즈 기항지 관련 YouTube 영상을 검색하고
 * 인라인 재생을 위한 데이터를 반환하는 서비스
 *
 * API Docs: https://developers.google.com/youtube/v3/docs/search/list
 * Console: https://console.cloud.google.com/apis/credentials
 */

import { getEnv } from '../env';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/** 우리 채널 ID — 자체 영상 우선 노출 */
export const OWN_CHANNEL_ID = 'UCiPYG8Wd1030yC_EISiRG3w';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  isOwnChannel?: boolean;  // 자체 채널 영상 여부 (뱃지 표시용)
}

// API 키 없을 때 반환할 fallback 데이터
function getFallbackVideos(city: string): YouTubeVideo[] {
  return [
    {
      videoId: 'dQw4w9WgXcQ',
      title: `${city} Cruise Port Guide - Top Things To Do`,
      description: `Complete guide to ${city} cruise port. Discover the best attractions, shore excursions, and tips for your cruise visit.`,
      thumbnailUrl: `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`,
      channelTitle: 'Cruise Port Guides',
      publishedAt: '2024-01-15T00:00:00Z',
      viewCount: '125000',
    },
    {
      videoId: 'M7lc1UVf-VE',
      title: `${city} Shore Excursion Tips & Tricks`,
      description: `Best shore excursions and hidden gems in ${city}. A must-watch before your cruise port visit.`,
      thumbnailUrl: `https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg`,
      channelTitle: 'Cruise Travel Tips',
      publishedAt: '2024-02-20T00:00:00Z',
      viewCount: '89000',
    },
    {
      videoId: 'oHg5SJYRHA0',
      title: `${city} Walking Tour - Cruise Port to City Center`,
      description: `Walk from the cruise port through the heart of ${city}. Self-guided walking tour with commentary.`,
      thumbnailUrl: `https://img.youtube.com/vi/oHg5SJYRHA0/hqdefault.jpg`,
      channelTitle: 'Virtual Cruise Tours',
      publishedAt: '2024-03-10T00:00:00Z',
      viewCount: '62000',
    },
  ];
}

async function youtubeFetch(endpoint: string, params: Record<string, string>): Promise<any> {
  const apiKey = getEnv('YOUTUBE_API_KEY');
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured');

  const searchParams = new URLSearchParams({ ...params, key: apiKey });
  const url = `${YOUTUBE_API_BASE}${endpoint}?${searchParams.toString()}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`YouTube API error ${response.status}`);
  return response.json();
}

/** YouTube Search API 결과 → YouTubeVideo[] 변환 */
function parseItems(items: any[], statsMap: Map<string, { viewCount: string; duration: string }>, ownChannelId: string): YouTubeVideo[] {
  return items
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => {
      const videoId = item.id.videoId;
      const snippet = item.snippet || {};
      const stats = statsMap.get(videoId);
      const thumbnails = snippet.thumbnails || {};
      const thumbnailUrl =
        thumbnails.maxres?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId,
        title: snippet.title || '',
        description: (snippet.description || '').substring(0, 200),
        thumbnailUrl,
        channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || '',
        duration: stats?.duration,
        viewCount: stats?.viewCount,
        isOwnChannel: snippet.channelId === ownChannelId,
      };
    });
}

/** videoId 목록으로 통계 Map 조회 */
async function fetchStats(videoIds: string[]): Promise<Map<string, { viewCount: string; duration: string }>> {
  const statsMap = new Map<string, { viewCount: string; duration: string }>();
  if (videoIds.length === 0) return statsMap;
  try {
    const statsData = await youtubeFetch('/videos', {
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
    });
    for (const v of statsData.items || []) {
      statsMap.set(v.id, {
        viewCount: v.statistics?.viewCount || '0',
        duration: v.contentDetails?.duration || '',
      });
    }
  } catch {
    // 통계 실패해도 진행
  }
  return statsMap;
}

/**
 * 도시명으로 크루즈 관련 YouTube 영상 검색
 *
 * 1단계: 우리 채널(OWN_CHANNEL_ID)에서 먼저 검색 → 자체 영상 우선 노출
 * 2단계: 자체 채널 결과가 부족하면 일반 검색으로 보충 (중복 제거)
 * API 키 없으면 fallback 데이터 반환
 */
export async function searchCruiseVideos(
  city: string,
  query?: string
): Promise<YouTubeVideo[]> {
  const apiKey = getEnv('YOUTUBE_API_KEY');

  if (!apiKey) {
    console.warn('[YouTube] YOUTUBE_API_KEY not set — returning fallback data');
    return getFallbackVideos(city);
  }

  const searchQuery = query || `${city} cruise port guide`;
  const TARGET_COUNT = 6;

  try {
    // ── Step 1: 자체 채널 검색 ─────────────────────────────
    const ownData = await youtubeFetch('/search', {
      part: 'snippet',
      channelId: OWN_CHANNEL_ID,
      q: searchQuery,
      type: 'video',
      maxResults: String(TARGET_COUNT),
      videoEmbeddable: 'true',
      order: 'relevance',
    });

    const ownItems: any[] = ownData.items || [];
    const ownIds = ownItems.map((i: any) => i.id?.videoId).filter(Boolean);
    const ownStats = await fetchStats(ownIds);
    const ownVideos = parseItems(ownItems, ownStats, OWN_CHANNEL_ID);

    if (ownVideos.length >= TARGET_COUNT) {
      // 자체 채널 영상만으로 충분
      return ownVideos.slice(0, TARGET_COUNT);
    }

    // ── Step 2: 일반 검색으로 부족분 보충 ──────────────────
    const remaining = TARGET_COUNT - ownVideos.length;
    const generalData = await youtubeFetch('/search', {
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: String(remaining + 3), // 중복 제거 여유분
      relevanceLanguage: 'en',
      safeSearch: 'moderate',
      videoEmbeddable: 'true',
      order: 'relevance',
    });

    const seenIds = new Set(ownIds);
    const generalItems = (generalData.items || []).filter(
      (i: any) => i.id?.videoId && !seenIds.has(i.id.videoId)
    ).slice(0, remaining);

    const generalIds = generalItems.map((i: any) => i.id.videoId);
    const generalStats = await fetchStats(generalIds);
    const generalVideos = parseItems(generalItems, generalStats, OWN_CHANNEL_ID);

    // 자체 채널 영상 먼저, 그 뒤 일반 검색
    const combined = [...ownVideos, ...generalVideos];
    return combined.length > 0 ? combined : getFallbackVideos(city);

  } catch (error) {
    console.error('[YouTube] searchCruiseVideos error:', error);
    return getFallbackVideos(city);
  }
}

export function formatDuration(iso: string): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatViewCount(count: string): string {
  const n = parseInt(count || '0');
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}
