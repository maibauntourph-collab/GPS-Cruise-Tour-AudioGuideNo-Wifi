/**
 * Affiliate Configuration for nowifigps.tours
 * Centralized IDs and URL generation logic for booking platforms.
 */

export const AFFILIATE_IDS = {
    getYourGuide: 'YOUR_GYG_PARTNER_ID',
    viator: '',
    klook: 'YOUR_KLOOK_AID',
    trip: 'YOUR_TRIP_DOT_COM_ID',
    myrealtrip: 'cheongnyangnamja@gmail.com'
};

export interface AffiliateSettings {
    viatorId?: string;
    klookId?: string;
    gygId?: string;
    tripId?: string;
    myrealtripId?: string;
}

export const AFFILIATE_PARAMS = {
    getYourGuide: 'partner_id',
    viator: 'pid',
    klook: 'aid',
    trip: 'allianceid',
    myrealtrip: 'partner_id'
};

export const getGYGLang = (selectedLanguage: string): string => {
    const mapping: Record<string, string> = {
        'es': 'es',
        'fr': 'fr',
        'de': 'de',
        'it': 'it',
        'pt': 'pt-BR'
    };
    return mapping[selectedLanguage] || 'en';
};

export const getViatorLang = (selectedLanguage: string): string => {
    const mapping: Record<string, string> = {
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-BR'
    };
    return mapping[selectedLanguage] || 'en-US';
};

export const getKlookLang = (selectedLanguage: string): string => {
    const mapping: Record<string, string> = {
        'ko': 'ko',
        'ja': 'ja',
        'zh': 'zh-CN',
        'th': 'th-TH',
        'vi': 'vi-VN',
        'id': 'id-ID'
    };
    return mapping[selectedLanguage] || 'en-US';
};

/**
 * Generates an affiliate-link for GetYourGuide
 */
export const getGYGUrl = (searchQuery: string, lang: string = 'en', settings?: AffiliateSettings) => {
    const gygLang = getGYGLang(lang);
    const url = new URL(`https://www.getyourguide.com/search/`);
    url.searchParams.set('q', searchQuery);

    const partnerId = settings?.gygId || AFFILIATE_IDS.getYourGuide;
    if (partnerId && partnerId !== 'YOUR_GYG_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.getYourGuide, partnerId);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Booking.com
 */
export const getBookingUrl = (searchQuery: string, lang: string = 'en-US', settings?: AffiliateSettings) => {
    const url = new URL('https://www.booking.com/searchresults.html');
    url.searchParams.set('ss', searchQuery);
    const aid = '862954987108816';
    url.searchParams.set('aid', aid);
    url.searchParams.set('channel', 'search_landing');
    return url.toString();
};

/**
 * Generates an affiliate-link for Agoda
 * [Bug Doctor | 2026-04-04] 신규 추가
 */
export const getAgodaUrl = (searchQuery: string, lang: string = 'ko-kr', settings?: AffiliateSettings) => {
    const agodaLang = lang.startsWith('ko') ? 'ko-kr' : 'en-us';
    const url = new URL(`https://www.agoda.com/${agodaLang}/search`);
    url.searchParams.set('keyword', searchQuery);
    return url.toString();
};

/**
 * Generates an affiliate-link for Viator (Web Search)
 */
export const getViatorUrl = (searchQuery: string, lang: string = 'en-US', settings?: AffiliateSettings) => {
    const url = new URL(`https://www.viator.com/search/${encodeURIComponent(searchQuery)}`);
    url.searchParams.set('text', searchQuery);

    const partnerId = settings?.viatorId || AFFILIATE_IDS.viator;
    if (partnerId && partnerId !== 'YOUR_VIATOR_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.viator, partnerId);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Klook
 */
export const getKlookUrl = (searchQuery: string, lang: string = 'en-US', settings?: AffiliateSettings) => {
    const klookLang = getKlookLang(lang);
    const url = new URL(`https://www.klook.com/${klookLang}/search/`);
    url.searchParams.set('keyword', searchQuery);

    const partnerId = settings?.klookId || AFFILIATE_IDS.klook;
    if (partnerId && partnerId !== 'YOUR_KLOOK_AID') {
        url.searchParams.set(AFFILIATE_PARAMS.klook, partnerId);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Trip.com
 */
export const getTripUrl = (searchQuery: string, settings?: AffiliateSettings) => {
    const url = new URL('https://www.trip.com/search/');
    url.searchParams.set('query', searchQuery);

    const partnerId = settings?.tripId || AFFILIATE_IDS.trip;
    if (partnerId && partnerId !== 'YOUR_TRIP_DOT_COM_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.trip, partnerId);
    }
    return url.toString();
};

export const getGoogleSearchUrl = (query: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

export const getWikiUrl = (query: string, lang: string = 'ko') => {
    const wikiLang = lang === 'en' ? 'en' : lang === 'ja' ? 'ja' : lang === 'zh' ? 'zh' : 'ko';
    return `https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
};

export const getGoogleMapsUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

/**
 * [Bug Doctor] MyRealTrip 제휴 링크 생성
 */
export const getMyRealTripUrl = (query: string, settings?: AffiliateSettings) => {
    const url = new URL('https://www.myrealtrip.com/search');
    url.searchParams.set('q', query);

    const partnerId = settings?.myrealtripId || AFFILIATE_IDS.myrealtrip;
    if (partnerId && partnerId !== 'YOUR_MYREALTRIP_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.myrealtrip, partnerId);
    }
    return url.toString();
};

export const getCatchTableUrl = (query: string) => {
    return `https://app.catchtable.co.kr/ct/search/integrated?keyword=${encodeURIComponent(query)}`;
};

export const getTheForkUrl = (query: string, lang: string = 'en') => {
    const forkLang = lang === 'fr' ? 'fr' : lang === 'es' ? 'es' : lang === 'it' ? 'it' : 'en';
    return `https://www.thefork.com/search?text=${encodeURIComponent(query)}&language=${forkLang}`;
};

export const getAirbnbUrl = (locationName: string) => {
    return `https://www.airbnb.com/s/${encodeURIComponent(locationName)}/homes`;
};

// ── 차량 렌탈 ─────────────────────────────────────────────────

/** Rentalcars.com — 글로벌 최대 렌터카 비교 플랫폼 */
export const getRentalcarsUrl = (city: string) => {
    return `https://www.rentalcars.com/SearchResults.do?pickup=${encodeURIComponent(city)}`;
};

/** Booking.com 렌터카 — Booking.com 제휴 ID 활용 */
export const getBookingCarsUrl = (city: string) => {
    const url = new URL('https://www.booking.com/cars/');
    url.searchParams.set('aid', '862954987108816');
    url.searchParams.set('label', 'cars-search');
    url.searchParams.set('city', city);
    return url.toString();
};

/** KAYAK 렌터카 검색 */
export const getKayakCarsUrl = (city: string) => {
    return `https://www.kayak.com/cars/${encodeURIComponent(city)}`;
};

// ── 쇼핑 ──────────────────────────────────────────────────────

/** Amazon 쇼핑 검색 (어소시에이트 태그 삽입 가능) */
export const getAmazonUrl = (keyword: string, affiliateTag = '') => {
    const url = new URL('https://www.amazon.com/s');
    url.searchParams.set('k', keyword);
    if (affiliateTag) url.searchParams.set('tag', affiliateTag);
    return url.toString();
};

/** iHerb — 건강·뷰티 제품 (강력한 제휴 프로그램) */
export const getIHerbUrl = (keyword: string) => {
    return `https://www.iherb.com/search?query=${encodeURIComponent(keyword)}`;
};

/** DFS 면세점 검색 */
export const getDFSUrl = (keyword: string) => {
    return `https://www.dfs.com/b2c/en/search#text=${encodeURIComponent(keyword)}`;
};

/**
 * 기존 reservationUrl에 플랫폼 감지 후 제휴 파라미터를 자동 삽입합니다.
 * Viator / Klook / GetYourGuide / Trip.com / MyRealTrip 지원.
 */
export const injectAffiliateParam = (url: string, settings?: AffiliateSettings): string => {
    if (!url || url === '#') return url;
    try {
        const u = new URL(url);
        const h = u.hostname.toLowerCase();
        if (h.includes('viator.com')) {
            const pid = settings?.viatorId || AFFILIATE_IDS.viator;
            if (pid) u.searchParams.set('pid', pid);
        } else if (h.includes('klook.com')) {
            const aid = settings?.klookId || AFFILIATE_IDS.klook;
            if (aid && aid !== 'YOUR_KLOOK_AID') u.searchParams.set('aid', aid);
        } else if (h.includes('getyourguide.com')) {
            const pid = settings?.gygId || AFFILIATE_IDS.getYourGuide;
            if (pid && pid !== 'YOUR_GYG_PARTNER_ID') u.searchParams.set('partner_id', pid);
        } else if (h.includes('trip.com')) {
            const aid = settings?.tripId || AFFILIATE_IDS.trip;
            if (aid && aid !== 'YOUR_TRIP_DOT_COM_ID') u.searchParams.set('allianceid', aid);
        } else if (h.includes('myrealtrip.com')) {
            const pid = settings?.myrealtripId || AFFILIATE_IDS.myrealtrip;
            if (pid) u.searchParams.set('partner_id', pid);
        }
        return u.toString();
    } catch {
        return url;
    }
};
