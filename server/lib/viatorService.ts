/**
 * Viator Partner API Service
 *
 * 크루즈 기항지의 투어/액티비티를 자동으로 검색하고
 * 어필리에이트 링크를 생성하는 서비스
 *
 * API Docs: https://docs.viator.com
 * Dashboard: https://partners.viator.com/dashboard
 */

import { getEnv } from '../env';

const VIATOR_SANDBOX_KEY = 'de25d027-3e03-47cb-9c89-196e3e698637';
const VIATOR_PROD_KEY = '90ec46e6-9e21-492b-9d56-ce6188cb635c';

// 환경에 따라 자동 전환 (Cloudflare Workers 호환)
function getConfig() {
  const nodeEnv = getEnv('NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';
  const apiKey = getEnv('VIATOR_API_KEY') || (isProduction ? VIATOR_PROD_KEY : VIATOR_SANDBOX_KEY);
  const baseUrl = isProduction
    ? 'https://api.viator.com/partner'
    : 'https://api.sandbox.viator.com/partner';

  return { apiKey, baseUrl, isProduction };
}

// 우리 앱의 크루즈 기항지 → Viator destination ID 매핑
export const CITY_TO_VIATOR_DEST: Record<string, string> = {
  // 지중해
  'rome': '511',               // 8,318 tours
  'civitavecchia': '511',      // 로마 항구 → 로마
  'barcelona': '562',          // 2,864 tours
  'naples': '496',             // 4,129 tours
  'athens': '400',             // 297 tours
  'venice': '522',             // 1,921 tours
  'lisbon': '538',             // 4,123 tours
  'dubrovnik': '4146',         // 337 tours
  'santorini': '684',          // sandbox에서 확인됨 (1,287 tours)
  'mykonos': '5459',           // sandbox 미지원 — prod 확인 필요
  'paris': '508',              // 3,174 tours
  'amsterdam': '525',          // 2,068 tours
  'stockholm': '907',          // 545 tours
  'copenhagen': '906',         // 245 tours
  // 카리브해
  'cozumel': '4526',           // 52 tours
  'nassau': '4525',            // sandbox 미지원
  // 알래스카
  'juneau': '799',             // 403 tours
  'ketchikan': '4186',         // 20 tours
  'skagway': '4187',           // 35 tours
  // 아시아
  'singapore': '67',           // 14,717 tours
  'tokyo': '334',              // 3,821 tours
  'cebu': '5097',              // 24 tours
};

export interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration: number | null;       // minutes
  bookingUrl: string;
  flags: string[];               // FREE_CANCELLATION, LIKELY_TO_SELL_OUT 등
}

export interface ViatorSearchResult {
  products: ViatorProduct[];
  totalCount: number;
  cityId: string;
  cachedAt: string;
}

/**
 * Viator API 요청 헬퍼
 */
async function viatorFetch(endpoint: string, body?: any): Promise<any> {
  const { apiKey, baseUrl } = getConfig();

  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: {
      'exp-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json;version=2.0',
      'Accept-Language': 'en-US',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Viator API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * 도시별 인기 투어 검색
 */
export async function searchToursByCity(
  cityId: string,
  options?: {
    count?: number;
    sort?: 'TRAVELER_RATING' | 'ITINERARY_DURATION' | 'PRICE' | 'REVIEW_AVG_RATING';
    language?: string;
  }
): Promise<ViatorSearchResult> {
  const destId = CITY_TO_VIATOR_DEST[cityId.toLowerCase()];
  if (!destId) {
    return { products: [], totalCount: 0, cityId, cachedAt: new Date().toISOString() };
  }

  const data = await viatorFetch('/products/search', {
    filtering: { destination: destId },
    sorting: {
      sort: options?.sort || 'TRAVELER_RATING',
      order: 'DESCENDING',
    },
    pagination: { start: 1, count: options?.count || 10 },
    currency: 'USD',
  });

  const products: ViatorProduct[] = (data.products || []).map((p: any) => ({
    productCode: p.productCode,
    title: p.title,
    description: (p.description || '').substring(0, 200),
    imageUrl: p.images?.[0]?.variants?.find((v: any) => v.width === 480)?.url
      || p.images?.[0]?.variants?.[0]?.url || '',
    rating: p.reviews?.combinedAverageRating || 0,
    reviewCount: p.reviews?.totalReviews || 0,
    price: p.pricing?.summary?.fromPrice || 0,
    currency: 'USD',
    duration: p.duration?.fixedDurationInMinutes || null,
    bookingUrl: p.productUrl || '',
    flags: p.flags || [],
  }));

  return {
    products,
    totalCount: data.totalCount || 0,
    cityId,
    cachedAt: new Date().toISOString(),
  };
}

/**
 * 랜드마크 키워드로 관련 투어 검색
 * 예: searchToursByKeyword("Colosseum", "rome") → 콜로세움 관련 투어
 */
export async function searchToursByKeyword(
  keyword: string,
  cityId: string,
  count: number = 5
): Promise<ViatorProduct[]> {
  const destId = CITY_TO_VIATOR_DEST[cityId.toLowerCase()];
  if (!destId) return [];

  const data = await viatorFetch('/products/search', {
    filtering: {
      destination: destId,
      searchTerm: keyword,
    },
    sorting: { sort: 'TRAVELER_RATING', order: 'DESCENDING' },
    pagination: { start: 1, count },
    currency: 'USD',
  });

  return (data.products || []).map((p: any) => ({
    productCode: p.productCode,
    title: p.title,
    description: (p.description || '').substring(0, 200),
    imageUrl: p.images?.[0]?.variants?.find((v: any) => v.width === 480)?.url
      || p.images?.[0]?.variants?.[0]?.url || '',
    rating: p.reviews?.combinedAverageRating || 0,
    reviewCount: p.reviews?.totalReviews || 0,
    price: p.pricing?.summary?.fromPrice || 0,
    currency: 'USD',
    duration: p.duration?.fixedDurationInMinutes || null,
    bookingUrl: p.productUrl || '',
    flags: p.flags || [],
  }));
}

/**
 * 특정 상품 상세 조회
 */
export async function getProductDetails(productCode: string): Promise<any> {
  return viatorFetch(`/products/${productCode}`);
}

/**
 * 모든 크루즈 기항지의 인기 투어를 일괄 캐싱
 * 크론 작업으로 매일 1회 실행 권장
 */
export async function cacheAllCityTours(
  count: number = 10
): Promise<Map<string, ViatorSearchResult>> {
  const cache = new Map<string, ViatorSearchResult>();
  const cities = Object.keys(CITY_TO_VIATOR_DEST);

  for (const cityId of cities) {
    try {
      const result = await searchToursByCity(cityId, { count });
      cache.set(cityId, result);
      console.log(`[Viator] Cached ${result.products.length}/${result.totalCount} tours for ${cityId}`);
      // Rate limit 방지: 요청 간 500ms 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[Viator] Failed to cache ${cityId}:`, error);
    }
  }

  return cache;
}

/**
 * 투어 데이터를 오프라인용 경량 포맷으로 변환
 * 앱의 offlineStorage에 저장할 수 있는 형태
 */
export function toOfflineFormat(products: ViatorProduct[]) {
  return products.map(p => ({
    code: p.productCode,
    title: p.title,
    img: p.imageUrl,
    rating: p.rating,
    reviews: p.reviewCount,
    price: p.price,
    url: p.bookingUrl,
    free_cancel: p.flags.includes('FREE_CANCELLATION'),
  }));
}
