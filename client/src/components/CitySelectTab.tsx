import React, { useState } from 'react';
import { Download, Lock, Map, User, Home as HomeIcon } from 'lucide-react';
import { City } from '@shared/schema';
import { LANDING_DATA } from '@/lib/landingData';
import { t } from '@/lib/translations';
import { CountryScrollSelector } from './CountryScrollSelector';

/**
 * [교수님 노트: CitySelectTab - ② City Select 화면 (이미지 디자인 완전 구현)]
 * @에이? "학생 여러분, 이 컴포넌트는 사용자가 기항지를 선택하는 가장 중요한 첫 화면입니다."
 *
 * [수정 적요 - 2026-03-23 23:02]
 * - 이미지 ② city select 화면과 1:1 매칭되도록 전면 재설계
 * - PWA 설치 배너 (다크 배경, 오렌지 다운로드 아이콘)
 * - 기항지 가이드 헤더 + 한/EN/中 언어 토글
 * - 카테고리 탭: 전체/아시아/유럽/크루즈 추천
 * - 도시 카드: 배경 이미지 + 자물쇠 아이콘 + 도시명/국가명/통계
 * - 바텀 내비게이션: 도시/지도/내 플랜
 */

export interface CitySelectTabProps {
    cities: City[];
    selectedCityId: string;
    onCityChange: (cityId: string) => void;
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    onTransitionToList: () => void;
    /** 바텀 탭 전환 콜백 */
    onTabChange?: (tab: 'city' | 'map' | 'plan') => void;
    /** 현재 활성 바텀 탭 */
    activeBottomTab?: 'city' | 'map' | 'plan';
}

// [적요] 카테고리 레이블 (이미지와 동일 한국어 기준)
const CATEGORY_FALLBACK: Record<string, Record<string, string>> = {
    all: { ko: '전체', en: 'All', 'zh-CN': '全部', ja: '全て', th: 'ทั้งหมด' },
    asia: { ko: '아시아', en: 'Asia', 'zh-CN': '亚洲', ja: 'アジア', th: '에เชีย' },
    europe: { ko: '유럽', en: 'Europe', 'zh-CN': '欧洲', ja: 'ヨーロッパ', th: 'ยุโรป' },
    recommended: { ko: '크루즈 추천', en: 'Recommended', 'zh-CN': '推荐', ja: 'おすすめ', th: 'แนะนำ' },
};

function getCategoryLabel(cat: string, lang: string): string {
    const tKey = t(cat, lang);
    if (tKey && tKey !== cat) return tKey;
    return CATEGORY_FALLBACK[cat]?.[lang] || CATEGORY_FALLBACK[cat]?.['en'] || cat;
}

// [적요] 섹션 헤더(Port Guide) 다국어
function getPortGuideLabel(lang: string): string {
    return {
        ko: '기항지 가이드', ja: '寄港地ガイド', 'zh-CN': '港口指南', 'zh-TW': '港口指南',
        th: 'คู่มือท่าเรือ', vi: 'Hướng dẫn cảng', id: 'Panduan Pelabuhan',
        es: 'Guía de Puerto', fr: 'Guide des Ports', de: 'Hafenführer',
        it: 'Guida Portuale', pt: 'Guia de Portos', ru: 'Путеводитель по Портам',
        ar: 'دليل الموانئ',
    }[lang] || 'Port Guide';
}

// [적요] 통계 문구 다국어 헬퍼
function getStatsLabel(city: City, lang: string): string {
    const landmarkCount = (city as any).landmarkCount || 24;
    const hours = (city as any).hours || 6;
    const langCount = (city as any).langCount || 10;

    const stats: Record<string, string> = {
        ko: `랜드마크 ${landmarkCount}개 · 약 ${hours}시간 · ${langCount}개 언어`,
        ja: `ランドマーク${landmarkCount}か所・약${hours}시간・${langCount}언어`,
        'zh-CN': `${landmarkCount}个地标 · 约${hours}小时 · ${langCount}种语言`,
        'zh-TW': `${landmarkCount}個景點 · 約${hours}小時 · ${langCount}種語言`,
        th: `${landmarkCount} แห่ง · ประมาณ ${hours} ชั่วโมง · ${langCount} ภาษา`,
    };
    return stats[lang] || `${landmarkCount} landmarks · ${hours} hours · ${langCount} languages`;
}

// [적요] PWA 홈화면 추가 안내 문구 다국어
function getInstallLabels(lang: string) {
    return ({
        ko: { prompt: '홈화면에 추가하면', benefit: '완전 오프라인!', desc: '한 번 저장하면 WiFi 없이도 사용 가능', btn: '설치' },
        ja: { prompt: 'ホーム画面に追加', benefit: '完全オフ라인!', desc: '一度保存すればWiFiなしで自動再生', btn: 'インストール' },
        'zh-CN': { prompt: '添加到主屏幕', benefit: '完全离线!', desc: '保存一次后无需WiFi即可自动播放', btn: '安装' },
        'zh-TW': { prompt: '加入主畫面', benefit: '完全離線!', desc: '儲存一次後無需WiFi即可自動播放', btn: '安裝' },
        th: { prompt: 'เพิ่มหน้าจอหลัก', benefit: 'ออฟ라인 100%!', desc: 'บันทึกครั้งเดียว เล่นอัตโนมัติไม่ต้องใช้ WiFi', btn: 'ติดตั้ง' },
    } as Record<string, { prompt: string; benefit: string; desc: string; btn: string }>)[lang]
        || { prompt: 'Add to home screen', benefit: '100% Offline!', desc: 'Auto plays without WiFi after initial save', btn: 'Install' };
}

// [적요] 도시의 대륙/카테고리 분류 헬퍼
function getCityCategory(city: City): 'asia' | 'europe' | 'recommended' {
    const asianCountries = ['South Korea', 'Japan', 'China', 'Thailand', 'Singapore', 'Malaysia', 'Philippines', 'Vietnam', 'Indonesia', 'Taiwan'];
    const europeanCountries = ['Italy', 'France', 'Spain', 'Germany', 'UK', 'Greece', 'Portugal', 'Netherlands', 'Croatia', 'Turkey'];
    if (asianCountries.includes(city.country)) return 'asia';
    if (europeanCountries.includes(city.country)) return 'europe';
    return 'recommended';
}

// [적요] 도시명 → 배경 이미지 URL 헬퍼
const CITY_IMAGES: Record<string, string> = {
    'rome': '/images/countries/italy.png',
    'venice': '/images/countries/italy_luxury.png',
    'rome': '/images/cities/rome.jpg',
    'venice': '/images/cities/venice.jpg',
    'paris': '/images/countries/france.png',
    'london': '/images/landmarks/big_ben_nanobanana.png', // 실제 런던 랜드마크 활용
    'barcelona': '/images/cities/barcelona.jpg', // 고정 매핑
    'naples': '/images/countries/italy_luxury.png',
    'shanghai': '/images/countries/china.png',
    'seoul': '/images/countries/south_korea.png',
    'singapore': '/images/countries/singapore.png',
    'penang': '/images/countries/malaysia_luxury.png',
    'phuket': '/images/countries/thailand.png',
    'cebu': '/images/cities/cebu.jpg',
    'kuala-lumpur': '/images/countries/malaysia_luxury.png',
    'anchorage': '/images/cities/anchorage.jpg',
    'amsterdam': '/images/countries/netherlands.png',
    'budapest': '/images/countries/hungary.png',
    'warsaw': '/images/countries/poland.png',
    'copenhagen': '/images/cities/copenhagen.jpg',
    'oslo': '/images/cities/oslo.jpg',
    'busan': '/images/countries/south_korea.png',
    'jeju': '/images/countries/south_korea.png',
    'brussels': '/images/cities/brussels.jpg',
    'prague': '/images/cities/prague.jpg',
    'stockholm': '/images/countries/sweden.png',
    'philippines': '/images/countries/philippines.png',
};

function getCityImage(city: City): string {
    const slug = city.name.toLowerCase().replace(/[\s_]+/g, '-');
    const citySlug = city.id?.toLowerCase().replace(/[\s_]+/g, '-');
    const landingContent = LANDING_DATA[slug] || LANDING_DATA[citySlug || ''] || LANDING_DATA[city.id];
    const heroImage = landingContent?.['en']?.heroImage || landingContent?.['ko']?.heroImage;
    return heroImage || CITY_IMAGES[slug] || CITY_IMAGES[citySlug || ''] || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=70';
}

// [적요] 도시 현지 이름 (중국어 표기 등)
function getCityLocalName(city: City, lang: string): string {
    const localNames: Record<string, Record<string, string>> = {
        'shanghai': { 'zh-CN': '上海 (Shanghai)', 'zh-TW': '上海 (Shanghai)', 'ko': '상하이 (吳淞港), 중국', 'en': 'Shanghai, China' },
        'rome': { 'ko': '로마, 이탈리아', 'en': 'Rome, Italy', 'zh-CN': '罗马, 意大利', 'ja': 'ローマ、イタリア' },
        'seoul': { 'ko': '서울, 한국', 'en': 'Seoul, South Korea', 'zh-CN': '首尔, 韩国' },
        'venice': { 'ko': '베네치아, 이탈리아', 'en': 'Venice, Italy', 'zh-CN': '威尼斯, 意大利' },
        'paris': { 'ko': '파리, 프랑스', 'en': 'Paris, France', 'zh-CN': '巴黎, 法国' },
        'singapore': { 'ko': '싱가포르', 'en': 'Singapore', 'zh-CN': '新加坡' },
        'copenhagen': { 'ko': '코펜하겐, 덴마크', 'en': 'Copenhagen, Denmark', 'zh-CN': '哥本哈根, 丹麦' },
        'stockholm': { 'ko': '스톡홀름, 스웨덴', 'en': 'Stockholm, Sweden', 'zh-CN': '斯德哥尔摩, 瑞典' },
        'busan': { 'ko': '부산, 한국', 'en': 'Busan, South Korea', 'zh-CN': '釜산, 韩国' },
        'jeju': { 'ko': '제주도, 한국', 'en': 'Jeju, South Korea', 'zh-CN': '济州岛, 韩国' },
        'bangkok': { 'ko': '방콕, 태국', 'en': 'Bangkok, Thailand', 'zh-CN': '曼谷, 泰国' },
        'phuket': { 'ko': '푸켓, 태국', 'en': 'Phuket, Thailand', 'zh-CN': '普吉岛, 泰国' },
    };
    const slug = city.name.toLowerCase().replace(/[\s_]+/g, '-');
    return localNames[slug]?.[lang] || localNames[slug]?.['en'] || `${city.name}, ${city.country}`;
}

export function CitySelectTab({
    cities,
    selectedCityId,
    onCityChange,
    selectedLanguage,
    onLanguageChange,
    onTransitionToList,
    onTabChange,
    activeBottomTab = 'city',
}: CitySelectTabProps) {
    const [category, setCategory] = useState<'all' | 'asia' | 'europe' | 'recommended'>('all');
    const [selectedCountry, setSelectedCountry] = useState<string>('All');

    const installLabels = getInstallLabels(selectedLanguage);

    // [적요] 국가 목록 추출 (카테고리 연동)
    const countries = React.useMemo(() => {
        const filteredForCategory = category === 'all'
            ? cities
            : cities.filter(c => getCityCategory(c) === category);
        const countrySet = new Set(filteredForCategory.map(c => c.country));
        return ['All', ...Array.from(countrySet).sort()];
    }, [cities, category]);

    // [적요] 카테고리/국가 필터링
    const filteredCities = cities.filter(c => {
        // 1. 카테고리 필터
        if (category !== 'all' && getCityCategory(c) !== category) return false;

        // 2. 국가 필터
        if (selectedCountry !== 'All' && c.country !== selectedCountry) return false;

        return true;
    });

    // [적요] 바텀 탭 아이콘 및 레이블
    const bottomTabs = [
        {
            id: 'city' as const,
            icon: <HomeIcon className="w-5 h-5" />,
            label: selectedLanguage === 'ko' ? '도시' : selectedLanguage.startsWith('zh') ? '城市' : 'Cities',
        },
        {
            id: 'map' as const,
            icon: <Map className="w-5 h-5" />,
            label: selectedLanguage === 'ko' ? '지도' : selectedLanguage.startsWith('zh') ? '地图' : 'Map',
        },
        {
            id: 'plan' as const,
            icon: <User className="w-5 h-5" />,
            label: selectedLanguage === 'ko' ? '내 플랜' : selectedLanguage.startsWith('zh') ? '我的计划' : 'My Plan',
        },
    ];

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* 스크롤 가능한 본문 영역 */}
            <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">

                {/* ─────────────────────────────────── */}
                {/* [적요] ① PWA 설치 안내 배너 - 다크 배경 */}
                {/* ─────────────────────────────────── */}
                <div className="px-4 pt-4 pb-2">
                    <div className="bg-[#242424]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-lg">
                        <div className="flex gap-3 items-center flex-1 min-w-0">
                            {/* 오렌지 다운로드 아이콘 박스 */}
                            <div className="w-11 h-11 bg-[#E85D36] rounded-2xl flex items-center justify-center shrink-0">
                                <Download className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-white font-bold text-[13px] leading-tight">
                                    {installLabels.prompt}
                                </div>
                                <div className="text-[#E85D36] font-black text-[15px] leading-tight">
                                    {installLabels.benefit}
                                </div>
                                <p className="text-slate-400 text-[10px] leading-tight mt-0.5 font-medium">
                                    {installLabels.desc}
                                </p>
                            </div>
                        </div>
                        {/* 설치 버튼 */}
                        <button className="bg-[#E85D36] text-white text-[11px] font-black px-4 py-2 rounded-xl active:scale-95 shrink-0 ml-3">
                            {installLabels.btn}
                        </button>
                    </div>
                </div>

                {/* ─────────────────────────────────── */}
                {/* [적요] ② 헤더 - 기항지 가이드 + 언어 토글 */}
                {/* ─────────────────────────────────── */}
                <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[22px] font-black text-slate-800 tracking-tight">
                            {getPortGuideLabel(selectedLanguage)}
                        </h2>
                        {/* 한 / EN / 中 언어 토글 버튼 */}
                        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-sm">
                            <button
                                onClick={() => onLanguageChange('ko')}
                                className={`w-9 h-9 rounded-full text-[11px] font-black transition-all ${selectedLanguage === 'ko'
                                    ? 'bg-[#E85D36] text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                한
                            </button>
                            <button
                                onClick={() => onLanguageChange('en')}
                                className={`w-9 h-9 rounded-full text-[11px] font-black transition-all ${selectedLanguage === 'en'
                                    ? 'bg-[#E85D36] text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => onLanguageChange('zh-CN')}
                                className={`w-9 h-9 rounded-full text-[11px] font-black transition-all ${selectedLanguage.startsWith('zh')
                                    ? 'bg-[#E85D36] text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                中
                            </button>
                        </div>
                    </div>

                    {/* ─────────────────────────────────── */}
                    {/* [적요] ③ 카테고리 필터 탭 */}
                    {/* ─────────────────────────────────── */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                        {(['all', 'asia', 'europe', 'recommended'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => {
                                    setCategory(cat);
                                    setSelectedCountry('All');
                                }}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 ${category === cat
                                    ? 'bg-[#E85D36] text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {getCategoryLabel(cat, selectedLanguage)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─────────────────────────────────── */}
                {/* [적요] ②-1 국가별 럭셔리 카드 스크롤      */}
                {/* ─────────────────────────────────── */}
                <div className="mt-2">
                    <CountryScrollSelector
                        countries={countries.filter(c => c !== 'All')}
                        selectedCountry={selectedCountry}
                        onCountrySelect={(country) => {
                            if (selectedCountry === country) {
                                setSelectedCountry('All');
                            } else {
                                setSelectedCountry(country);
                                // 국가 선택 시 해당 국가의 첫 번째 도시로 자동 스크롤(선택은 안함)
                                const firstCity = cities.find(c => c.country === country);
                                if (firstCity) {
                                    const element = document.getElementById(`city-card-${firstCity.id}`);
                                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }
                        }}
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={onLanguageChange}
                        onNext={() => {
                            // 국가 카드에서 '도시 선택' 클릭 시 첫 번째 도시 선택 후 리스트로 이동
                            const firstCity = filteredCities[0];
                            if (firstCity) {
                                onCityChange(firstCity.id);
                                onTransitionToList();
                            }
                        }}
                        cities={cities}
                        selectedCityId={selectedCityId}
                        onCityChange={onCityChange}
                        isEmbedded={true}
                    />
                </div>

                {/* ─────────────────────────────────── */}
                {/* [적요] ④ 도시 카드 목록 */}
                {/* ─────────────────────────────────── */}
                <div className="px-4 mt-3 space-y-4">
                    {filteredCities.length === 0 ? (
                        // 로딩 스켈레톤
                        [1, 2, 3].map(i => (
                            <div key={i} className="w-full h-[200px] rounded-[2rem] bg-slate-100 animate-pulse" />
                        ))
                    ) : (
                        filteredCities.map((city, idx) => {
                            const cityImage = getCityImage(city);
                            const isLocked = idx > 0; // 첫 번째 도시만 잠금 해제
                            const isSelected = city.id === selectedCityId;

                            return (
                                <button
                                    key={city.id}
                                    id={`city-card-${city.id}`}
                                    onClick={() => {
                                        onCityChange(city.id);
                                        onTransitionToList();
                                    }}
                                    className={`w-full relative bg-white/40 backdrop-blur-md border rounded-[2rem] shadow-sm hover:shadow-md transition-all active:scale-[0.98] overflow-hidden flex flex-col ${isSelected
                                        ? 'border-[#E85D36] border-2 shadow-[#E85D36]/10'
                                        : 'border-white/20'
                                        }`}
                                >
                                    {/* 카드 상단: 배경 이미지 영역 */}
                                    <div className="mx-4 mt-4 h-[110px] rounded-2xl overflow-hidden relative">
                                        <img
                                            src={cityImage}
                                            alt={city.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[28px] font-black tracking-[0.15em] uppercase text-white drop-shadow-md select-none">
                                                {city.name.toUpperCase()}
                                            </span>
                                        </div>
                                        {selectedLanguage.startsWith('zh') && (
                                            <div className="absolute top-2 right-2 bg-[#E85D36] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                                中文
                                            </div>
                                        )}
                                        {isLocked && (
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
                                                <Lock className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* 카드 하단: 도시 정보 */}
                                    <div className="px-5 py-3 pb-4 text-left bg-transparent">
                                        <div className="text-[16px] font-black text-slate-800 leading-tight mb-0.5">
                                            {getCityLocalName(city, selectedLanguage)}
                                        </div>
                                        <div className="text-[11px] text-slate-700 font-bold whitespace-nowrap opacity-80">
                                            {getStatsLabel(city, selectedLanguage)}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="h-6" />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-2xl border-t border-white/20 shadow-lg z-50">
                <div className="flex">
                    {bottomTabs.map(tab => {
                        const isActive = activeBottomTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`bottom-tab-${tab.id}`}
                                onClick={() => onTabChange?.(tab.id)}
                                className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors"
                            >
                                <span className={isActive ? 'text-[#E85D36]' : 'text-slate-400'}>
                                    {tab.icon}
                                </span>
                                <span className={`text-[10px] font-bold ${isActive ? 'text-[#E85D36]' : 'text-slate-400'}`}>
                                    {tab.label}
                                </span>
                                {isActive && (
                                    <span className="w-1 h-1 rounded-full bg-[#E85D36]" />
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="h-safe-area-inset-bottom" />
            </div>
        </div>
    );
}
