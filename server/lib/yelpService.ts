/**
 * Yelp Fusion API Service
 * 크루즈 기항지 근처 레스토랑 실시간 검색
 * API Docs: https://docs.developer.yelp.com/reference/v3_business_search
 */

import { getEnv } from '../env';

function getConfig() {
  const apiKey = getEnv('YELP_API_KEY') || '';
  const baseUrl = 'https://api.yelp.com/v3';
  return { apiKey, baseUrl };
}

export const CITY_TO_YELP_LOCATION: Record<string, string> = {
  'rome':          'Rome, Italy',
  'civitavecchia': 'Civitavecchia, Italy',
  'barcelona':     'Barcelona, Spain',
  'naples':        'Naples, Italy',
  'athens':        'Athens, Greece',
  'venice':        'Venice, Italy',
  'lisbon':        'Lisbon, Portugal',
  'dubrovnik':     'Dubrovnik, Croatia',
  'santorini':     'Santorini, Greece',
  'mykonos':       'Mykonos, Greece',
  'paris':         'Paris, France',
  'amsterdam':     'Amsterdam, Netherlands',
  'stockholm':     'Stockholm, Sweden',
  'copenhagen':    'Copenhagen, Denmark',
  'cozumel':       'Cozumel, Mexico',
  'nassau':        'Nassau, Bahamas',
  'juneau':        'Juneau, Alaska',
  'ketchikan':     'Ketchikan, Alaska',
  'skagway':       'Skagway, Alaska',
  'singapore':     'Singapore',
  'tokyo':         'Tokyo, Japan',
  'cebu':          'Cebu City, Philippines',
  'seoul':         'Seoul, South Korea',
  'busan':         'Busan, South Korea',
  'hong-kong':     'Hong Kong',
  'osaka':         'Osaka, Japan',
  'taipei':        'Taipei, Taiwan',
  'kuala-lumpur':  'Kuala Lumpur, Malaysia',
  'bangkok':       'Bangkok, Thailand',
};

export interface YelpRestaurant {
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

export interface YelpSearchResult {
  restaurants: YelpRestaurant[];
  totalCount: number;
  keyword: string;
  cityId: string;
  cachedAt: string;
}

async function yelpFetch(endpoint: string, params?: Record<string, string>): Promise<any> {
  const { apiKey, baseUrl } = getConfig();
  if (!apiKey) throw new Error('YELP_API_KEY is not configured');

  const url = new URL(`${baseUrl}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yelp API error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export async function searchRestaurants(
  keyword: string,
  cityId: string,
  count: number = 5
): Promise<YelpSearchResult> {
  const location = CITY_TO_YELP_LOCATION[cityId.toLowerCase()];
  if (!location) {
    return { restaurants: [], totalCount: 0, keyword, cityId, cachedAt: new Date().toISOString() };
  }

  const data = await yelpFetch('/businesses/search', {
    term: keyword,
    location,
    categories: 'restaurants,food',
    limit: String(Math.min(count, 50)),
    sort_by: 'best_match',
  });

  const restaurants: YelpRestaurant[] = (data.businesses || []).map((b: any) => ({
    id: b.id,
    name: b.name,
    imageUrl: b.image_url || '',
    rating: b.rating || 0,
    reviewCount: b.review_count || 0,
    price: b.price || null,
    url: b.url || '',
    categories: (b.categories || []).map((c: any) => c.title),
    phone: b.display_phone || '',
    location: b.location?.display_address?.[0] || '',
  }));

  return {
    restaurants,
    totalCount: data.total || 0,
    keyword,
    cityId,
    cachedAt: new Date().toISOString(),
  };
}

export function toOfflineFormat(restaurants: YelpRestaurant[]) {
  return restaurants.map(r => ({
    id: r.id,
    name: r.name,
    img: r.imageUrl,
    rating: r.rating,
    price: r.price,
    url: r.url,
  }));
}
