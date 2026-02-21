/**
 * Affiliate Configuration for nowifigps.tours
 * Centralized IDs and URL generation logic for booking platforms.
 */

export const AFFILIATE_IDS = {
    getYourGuide: 'YOUR_GYG_PARTNER_ID', // Replace with actual ID
    viator: 'YOUR_VIATOR_PARTNER_ID',     // Replace with actual ID
    klook: 'YOUR_KLOOK_AID',             // Replace with actual ID
    trip: 'YOUR_TRIP_DOT_COM_ID'          // Replace with actual ID
};

export const AFFILIATE_PARAMS = {
    getYourGuide: 'partner_id',
    viator: 'pid',
    klook: 'aid',
    trip: 'allianceid'
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
export const getGYGUrl = (searchQuery: string, lang: string = 'en') => {
    const gygLang = getGYGLang(lang);
    const base = `https://www.getyourguide.com/${gygLang}/s/`;
    const url = new URL(base);
    url.searchParams.set('q', searchQuery);
    if (AFFILIATE_IDS.getYourGuide !== 'YOUR_GYG_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.getYourGuide, AFFILIATE_IDS.getYourGuide);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Viator
 */
export const getViatorUrl = (searchQuery: string, lang: string = 'en-US') => {
    const viatorLang = getViatorLang(lang);
    const base = `https://www.viator.com/${viatorLang}/search`;
    const url = new URL(base);
    url.searchParams.set('q', searchQuery);
    if (AFFILIATE_IDS.viator !== 'YOUR_VIATOR_PARTNER_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.viator, AFFILIATE_IDS.viator);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Klook
 */
export const getKlookUrl = (searchQuery: string, lang: string = 'en-US') => {
    const klookLang = getKlookLang(lang);
    const base = `https://www.klook.com/${klookLang}/search/`;
    const url = new URL(base);
    url.searchParams.set('q', searchQuery);
    if (AFFILIATE_IDS.klook !== 'YOUR_KLOOK_AID') {
        url.searchParams.set(AFFILIATE_PARAMS.klook, AFFILIATE_IDS.klook);
    }
    return url.toString();
};

/**
 * Generates an affiliate-link for Trip.com
 */
export const getTripUrl = (searchQuery: string) => {
    const base = `https://cn.trip.com/search/things-to-do`;
    const url = new URL(base);
    url.searchParams.set('q', searchQuery);
    if (AFFILIATE_IDS.trip !== 'YOUR_TRIP_DOT_COM_ID') {
        url.searchParams.set(AFFILIATE_PARAMS.trip, AFFILIATE_IDS.trip);
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
