import React, { useState } from 'react';
import { Download, Search, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { City } from '@shared/schema';
import { LANDING_DATA } from '@/lib/landingData';

export interface CitySelectTabProps {
    cities: City[];
    selectedCityId: string;
    onCityChange: (cityId: string) => void;
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    onTransitionToList: () => void;
}

export function CitySelectTab({
    cities,
    selectedCityId,
    onCityChange,
    selectedLanguage,
    onLanguageChange,
    onTransitionToList
}: CitySelectTabProps) {
    const [category, setCategory] = useState<'all' | 'asia' | 'europe' | 'recommended'>('all');
    const [citySearchQuery, setCitySearchQuery] = useState('');

    const isKo = selectedLanguage === 'ko';

    // [Bug Doctor] 검색 시 다국어(한국어) 입력을 영어 이름으로 변환하여 매칭을 돕는 매핑 테이블
    const KOREAN_CITY_MAP: Record<string, string[]> = {
        'roma': ['로마'],
        'rome': ['로마'],
        'venice': ['베네치아', '베니스'],
        'paris': ['파리'],
        'london': ['런던'],
        'barcelona': ['바르셀로나'],
        'penang': ['페낭'],
        'singapore': ['싱가포르', '싱가폴'],
        'cebu': ['세부'],
        'naples': ['나폴리'],
        'kuala-lumpur': ['쿠알라룸푸르', '쿠알라 룸푸르'],
        'phuket': ['푸껫', '푸켓']
    };

    const filteredCities = cities.filter(c => {
        const searchLower = citySearchQuery.toLowerCase();
        const nameLower = c.name.toLowerCase();
        const countryLower = c.country.toLowerCase();
        const citySlug = nameLower.replace(/[\s_]+/g, '-');

        const matchDirect = nameLower.includes(searchLower) || countryLower.includes(searchLower);
        const matchKorean = KOREAN_CITY_MAP[citySlug] && KOREAN_CITY_MAP[citySlug].some(koreanName => koreanName.includes(searchLower));

        return matchDirect || matchKorean;
    });

    return (
        <div className="bg-white min-h-full pb-8">
            {/* Install PWA Prompt */}
            <div className="px-4 py-4 mt-2">
                <div className="bg-[#242424] rounded-3xl p-5 flex items-center justify-between shadow-xl">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Download className="w-6 h-6 outline-none text-[#E85D36]" />
                        </div>
                        <div>
                            <div className="text-white font-bold text-[15px]">
                                {isKo ? '홈화면에 추가하면' : 'Add to home screen'}
                            </div>
                            <div className="text-[#E85D36] font-black text-[17px] mb-1">
                                {isKo ? '완전 오프라인!' : '100% Offline!'}
                            </div>
                            <p className="text-slate-400 text-[10px] leading-tight font-medium">
                                {isKo ? '한 번 저장하면 WiFi 없이도 자동 재생' : 'Auto plays without WiFi after initial save'}
                            </p>
                        </div>
                    </div>
                    <button className="bg-[#E85D36] text-white text-[11px] font-bold px-4 py-2 rounded-xl active:scale-95 shrink-0 ml-2">
                        {isKo ? '설치' : 'Install'}
                    </button>
                </div>
            </div>

            <div className="px-6 py-2 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {isKo ? '기항지 가이드' : 'Port Guide'}
                    </h2>
                    <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-sm">
                        <button
                            onClick={() => onLanguageChange('ko')}
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${selectedLanguage === 'ko' ? 'bg-[#E85D36] text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            한
                        </button>
                        <button
                            onClick={() => onLanguageChange('en')}
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${selectedLanguage === 'en' ? 'bg-[#E85D36] text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            EN
                        </button>
                        <button
                            onClick={() => onLanguageChange('zh-CN')}
                            className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${selectedLanguage.startsWith('zh') ? 'bg-[#E85D36] text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            中
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                    <button
                        onClick={() => setCategory('all')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${category === 'all' ? 'bg-[#E85D36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isKo ? '전체' : 'All'}
                    </button>
                    <button
                        onClick={() => setCategory('asia')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${category === 'asia' ? 'bg-[#E85D36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isKo ? '아시아' : 'Asia'}
                    </button>
                    <button
                        onClick={() => setCategory('europe')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${category === 'europe' ? 'bg-[#E85D36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isKo ? '유럽' : 'Europe'}
                    </button>
                    <button
                        onClick={() => setCategory('recommended')}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${category === 'recommended' ? 'bg-[#E85D36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        {isKo ? '크루즈 추천' : 'Recommended'}
                    </button>
                </div>
            </div>

            <div className="px-6 space-y-4">
                {filteredCities.map((city, idx) => {
                    const citySlug = city.name.toLowerCase().replace(/[\s_]+/g, '-');
                    const landingContent = (city as any)?.landingContent || LANDING_DATA[citySlug] || LANDING_DATA[city.id];
                    const content = landingContent?.[selectedLanguage] || landingContent?.['en'];
                    const cityImage = content?.heroImage || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=70';

                    const colors = ['bg-[#fcd2c8]', 'bg-[#c9e1f5]', 'bg-[#d0f0c0]', 'bg-[#fce5cd]'];
                    const bgCol = colors[idx % colors.length];

                    // Fake lock visualization for demonstration
                    const isLocked = idx > 0;

                    return (
                        <button
                            key={city.id}
                            onClick={() => {
                                onCityChange(city.id);
                                onTransitionToList();
                            }}
                            className="w-full relative bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all pt-5 flex flex-col active:scale-[0.98] overflow-hidden"
                        >
                            <div className={`mx-5 h-[100px] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden`}>
                                <div className="absolute inset-0 z-0">
                                    <img src={cityImage} className="w-full h-full object-cover opacity-60 mix-blend-overlay" alt={city.name} />
                                    <div className={`absolute inset-0 ${bgCol} mix-blend-multiply opacity-80`} />
                                </div>
                                {/* Overlay Text inside card */}
                                <div className="relative z-10 text-center">
                                    <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest mb-1 shadow-black blur-0">
                                        {selectedLanguage.startsWith('zh') ? '中文' : selectedLanguage.toUpperCase()}
                                    </div>
                                    <div className="text-white text-[28px] font-black tracking-widest uppercase drop-shadow-md">
                                        {city.name}
                                    </div>
                                </div>

                                {isLocked && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/60 backdrop-blur-md p-1.5 rounded-full z-20">
                                        <Lock className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="p-5 text-left bg-white relative z-20">
                                <div className="text-[17px] font-black text-slate-800 mb-1">
                                    {content?.title || city.name}{', '}{city.country}
                                </div>
                                <div className="text-[11px] font-medium text-slate-400">
                                    {isKo ? `랜드마크 24개 · 약 6시간 · 10개 언어` : `24 landmarks · 6 hours · 10 languages`}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
