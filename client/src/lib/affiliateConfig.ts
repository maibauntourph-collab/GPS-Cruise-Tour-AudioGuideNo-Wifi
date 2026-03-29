/**
 * Affiliate Configuration for nowifigps.tours
 * Centralized IDs and URL generation logic for booking platforms.
 */

export const AFFILIATE_IDS = {
    getYourGuide: 'YOUR_GYG_PARTNER_ID',
    viator: 'de25d027-3e03-47cb-9c89-196e3e698637',
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
    // [적요] MyRealTrip URL 파라미터 키명
    myrealtrip: 'partner_id'
};
/**
 * Language mapping for GetYourGuide
 */
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

/**
 * Language mapping for Viator
 */
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

/**
 * Language mapping for Klook
 */
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
    const base = `https://www.getyourguide.com/${gygLang}/s/`;
    const url = new URL(base);
    url.searchParams.set('q', searchQuery);

    const partnerId = settings?.gygId || AFFILIATE_IDS.getYourGuide;
    if (partnerId && partnerId !== 'YOUR_GYG_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.getYourGuide, partnerId);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Viator
 */
export const getViatorUrl = (searchQuery: string, lang: string = 'en-US', settings?: AffiliateSettings) => {
    const viatorLang = getViatorLang(lang);
    const base = `https://www.viator.com/${viatorLang}/search`;
    const url = new URL(base);
    url.searchParams.set('q', searchQuery);

    const partnerId = settings?.viatorId || AFFILIATE_IDS.viator;
    if (partnerId && partnerId !== 'YOUR_VIATOR_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.viator, partnerId);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Klook
 * [Bug Doctor] 수정: 파라미터 `q` → `keyword` 로 변경 (Klook 실제 검색 스펙)
 * 실제 URL 예시: https://www.klook.com/en-US/search/?keyword=colosseum
 */
export const getKlookUrl = (searchQuery: string, lang: string = 'en-US', settings?: AffiliateSettings) => {
    const klookLang = getKlookLang(lang);
    // [적요] Klook 검색페이지는 `keyword` 파라미터를 사용. `q`는 미작동.
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
 * [Bug Doctor] 수정: cn.trip.com(중국 도메인) → www.trip.com 글로벌 URL로 변경
 * 형식: https://www.trip.com/search/?query=지명
 */
export const getTripUrl = (searchQuery: string, settings?: AffiliateSettings) => {
    // [적요] Trip.com의 글로벌 검색 URL 패턴. /search/?query= 로 지명 검색 결과 직행
    const url = new URL('https://www.trip.com/search/');
    url.searchParams.set('query', searchQuery);

    const partnerId = settings?.tripId || AFFILIATE_IDS.trip;
    if (partnerId && partnerId !== 'YOUR_TRIP_DOT_COM_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.trip, partnerId);
    }
    return url.toString();
};

/**
 * Generates a Google Search link for a landmark
 */
export const getGoogleSearchUrl = (query: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};

/**
 * Generates a Wikipedia link for a landmark
 */
export const getWikiUrl = (query: string, lang: string = 'ko') => {
    // [연구소장 가이드] 위키백과는 언어별 서브도메인을 사용하므로 lang 값을 반영합니다.
    const wikiLang = lang === 'en' ? 'en' : lang === 'ja' ? 'ja' : lang === 'zh' ? 'zh' : 'ko';
    return `https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
};

/**
 * Generates a Google Maps link for a landmark
 */
export const getGoogleMapsUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

/**
 * Generates a MyRealTrip search link (Korea specific)
 */
/**
 * [Bug Doctor + 적요] MyRealTrip 제휴 링크 생성
 * - 파트너 ID: cheongnyangnamja@gmail.com (partner_id 파라미터)
 * - URL 형식: https://www.myrealtrip.com/search?q=검색어&partner_id=이메일
 * - partner_id가 기본값이 아닌 경우에만 추가 (다른 플랫폼과 동일 패턴)
 */
export const getMyRealTripUrl = (query: string, settings?: AffiliateSettings) => {
    const url = new URL('https://www.myrealtrip.com/search');
    url.searchParams.set('q', query);

    const partnerId = settings?.myrealtripId || AFFILIATE_IDS.myrealtrip;
    // [적요] 파트너 ID가 설정된 경우 URL에 자동 추가
    if (partnerId && partnerId !== 'YOUR_MYREALTRIP_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.myrealtrip, partnerId);
    }
    return url.toString();
};

/**
 * Generates a CatchTable search link (Korea specific restaurant)
 */
export const getCatchTableUrl = (query: string) => {
    return `https://app.catchtable.co.kr/ct/search/integrated?keyword=${encodeURIComponent(query)}`;
};

/**
 * Generates a TheFork search link (Europe/Global restaurant)
 */
export const getTheForkUrl = (query: string, lang: string = 'en') => {
    const forkLang = lang === 'fr' ? 'fr' : lang === 'es' ? 'es' : lang === 'it' ? 'it' : 'en';
    return `https://www.thefork.com/search?text=${encodeURIComponent(query)}&language=${forkLang}`;
};

/**
 * [강의 노트] 에어비앤비 제휴 링크 생성 함수
 * 학생 여러분, 특정 플랫폼의 검색 결과 페이지로 이동시키는 URL을 동적으로 생성합니다.
 */
export const getAirbnbUrl = (locationName: string) => {
    return `https://www.airbnb.com/s/${encodeURIComponent(locationName)}/homes`;
};
