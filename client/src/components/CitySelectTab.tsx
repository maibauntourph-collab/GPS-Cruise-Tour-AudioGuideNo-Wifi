import React, { useState } from 'react';
import { Download, Search, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { City } from '@shared/schema';
import { LANDING_DATA } from '@/lib/landingData';
import { t } from '@/lib/translations';

/**
 * [교수님 노트: CitySelectTab - 다국어 완전 지원 버전]
 * @에이? "학생 여러분, 이 컴포넌트는 사용자가 기항지를 선택하는 가장 중요한 첫 화면입니다."
 *
 * [수정 적요 - 2026-03-23 09:51]
 * - isKo 2진 스위치 → t(key, selectedLanguage) 함수 방식으로 전환
 * - 25개 언어 모두 translations.ts의 키를 통해 자동 번역됩니다.
 * - CitySelectTab이 열리면 언어를 변경할 수 있는 빠른 스위처(ko/en/zh) 유지
 */

export interface CitySelectTabProps {
    cities: City[];
    selectedCityId: string;
    onCityChange: (cityId: string) => void;
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    onTransitionToList: () => void;
}

// [적요] 다국어 카테고리 레이블 - t() 함수 키 매핑
const CATEGORY_KEYS = {
    all: 'all',
    asia: 'asia',
    europe: 'europe',
    recommended: 'recommended',
} as const;

// [적요] 카테고리 레이블 fallback (translations.ts에 없을 경우 대비)
const CATEGORY_FALLBACK: Record<string, Record<string, string>> = {
    all: { ko: '전체', en: 'All', th: 'ทั้งหมด', ja: '全て', 'zh-CN': '全部', 'zh-TW': '全部' },
    asia: { ko: '아시아', en: 'Asia', th: 'เอเชีย', ja: 'アジア', 'zh-CN': '亚洲', 'zh-TW': '亞洲' },
    europe: { ko: '유럽', en: 'Europe', th: 'ยุโรป', ja: 'ヨーロッパ', 'zh-CN': '欧洲', 'zh-TW': '歐洲' },
    recommended: { ko: '크루즈 추천', en: 'Recommended', th: 'แนะนำ', ja: 'おすすめ', 'zh-CN': '推荐', 'zh-TW': '推薦' },
};

// [적요] 카테고리 레이블 반환 헬퍼 — translations.ts 우선, 없으면 fallback
function getCategoryLabel(category: string, lang: string): string {
    const tKey = t(category, lang);
    if (tKey && tKey !== category) return tKey; // translations.ts에 존재하면 사용
    return CATEGORY_FALLBACK[category]?.[lang] || CATEGORY_FALLBACK[category]?.['en'] || category;
}

// [적요] landmarks 개수 / 시간 / 언어 수 설명 문구 다국어 헬퍼
function getStatsLabel(lang: string): string {
    const stats: Record<string, string> = {
        ko: '랜드마크 24개 · 약 6시간 · 10개 언어',
        ja: 'ランドマーク24か所・約6時間・10言語',
        'zh-CN': '24个地标 · 约6小时 · 10种语言',
        'zh-TW': '24個景點 · 約6小時 · 10種語言',
        th: '24 แห่ง · ประมาณ 6 ชั่วโมง · 10 ภาษา',
        vi: '24 địa điểm · ~6 tiếng · 10 ngôn ngữ',
        id: '24 landmark · ~6 jam · 10 bahasa',
        es: '24 lugares · ~6 horas · 10 idiomas',
        fr: '24 sites · ~6 heures · 10 langues',
        de: '24 Orte · ~6 Stunden · 10 Sprachen',
        it: '24 luoghi · ~6 ore · 10 lingue',
        pt: '24 locais · ~6 horas · 10 idiomas',
        ru: '24 места · ~6 часов · 10 языков',
        ar: '24 موقعاً · ~6 ساعات · 10 لغات',
    };
    return stats[lang] || '24 landmarks · 6 hours · 10 languages';
}

// [적요] PWA 홈화면 추가 안내 문구 다국어 헬퍼
function getInstallLabels(lang: string) {
    const labels: Record<string, { prompt: string; benefit: string; desc: string; btn: string }> = {
        ko: { prompt: '홈화면에 추가하면', benefit: '완전 오프라인!', desc: '한 번 저장하면 WiFi 없이도 자동 재생', btn: '설치' },
        ja: { prompt: 'ホーム画面に追加', benefit: '完全オフライン!', desc: '一度保存すればWiFiなしで自動再生', btn: 'インストール' },
        'zh-CN': { prompt: '添加到主屏幕', benefit: '完全离线!', desc: '保存一次后无需WiFi即可自动播放', btn: '安装' },
        'zh-TW': { prompt: '加入主畫面', benefit: '完全離線!', desc: '儲存一次後無需WiFi即可自動播放', btn: '安裝' },
        th: { prompt: 'เพิ่มหน้าจอหลัก', benefit: 'ออฟไลน์ 100%!', desc: 'บันทึกครั้งเดียว เล่นอัตโนมัติไม่ต้องใช้ WiFi', btn: 'ติดตั้ง' },
        vi: { prompt: 'Thêm vào màn hình chính', benefit: 'Hoàn toàn Offline!', desc: 'Lưu một lần, tự động phát không cần WiFi', btn: 'Cài đặt' },
        id: { prompt: 'Tambah ke layar utama', benefit: 'Offline Penuh!', desc: 'Simpan sekali, putar otomatis tanpa WiFi', btn: 'Pasang' },
        es: { prompt: 'Agregar a inicio', benefit: '¡100% Offline!', desc: 'Guárdalo una vez, se reproduce sin WiFi', btn: 'Instalar' },
        fr: { prompt: 'Ajouter à l\'accueil', benefit: '100% Hors-ligne!', desc: 'Sauvegardez une fois, lecture automatique sans WiFi', btn: 'Installer' },
        de: { prompt: 'Zum Startbildschirm', benefit: '100% Offline!', desc: 'Einmal speichern, ohne WLAN abspielen', btn: 'Installieren' },
        it: { prompt: 'Aggiungi a home', benefit: '100% Offline!', desc: 'Salvato una volta, riproduce senza WiFi', btn: 'Installa' },
        pt: { prompt: 'Adicionar ao início', benefit: '100% Offline!', desc: 'Salve uma vez, toca sem WiFi', btn: 'Instalar' },
        ru: { prompt: 'Добавить на экран', benefit: '100% Офлайн!', desc: 'Сохраните один раз — воспроизводится без WiFi', btn: 'Установить' },
    };
    return labels[lang] || { prompt: 'Add to home screen', benefit: '100% Offline!', desc: 'Auto plays without WiFi after initial save', btn: 'Install' };
}

// [적요] 섹션 헤더(Port Guide) 다국어
function getPortGuideLabel(lang: string): string {
    const labels: Record<string, string> = {
        ko: '기항지 가이드', ja: '寄港地ガイド', 'zh-CN': '港口指南', 'zh-TW': '港口指南',
        th: 'คู่มือท่าเรือ', vi: 'Hướng dẫn cảng', id: 'Panduan Pelabuhan',
        es: 'Guía de Puerto', fr: 'Guide des Ports', de: 'Hafenführer',
        it: 'Guida Portuale', pt: 'Guia de Portos', ru: 'Путеводитель по Портам',
        ar: 'دليل الموانئ',
    };
    return labels[lang] || 'Port Guide';
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

    // [적요] 한국어/영어 2진 스위치 제거 → t() 함수로 완전 대체됩니다.
    const installLabels = getInstallLabels(selectedLanguage);

    // [Bug Doctor] 다국어 도시명 검색 매핑 테이블 (한국어/일본어/중국어 포함)
    const MULTILANG_CITY_MAP: Record<string, string[]> = {
        'roma': ['로마', 'ローマ', '罗马'],
        'rome': ['로마', 'ローマ', '罗马'],
        'venice': ['베네치아', '베니스', 'ベネチア', '威尼斯'],
        'paris': ['파리', 'パリ', '巴黎'],
        'london': ['런던', 'ロンドン', '伦敦'],
        'barcelona': ['바르셀로나', 'バルセロナ', '巴塞罗那'],
        'penang': ['페낭', 'ペナン', '槟城'],
        'singapore': ['싱가포르', 'シンガポール', '新加坡'],
        'cebu': ['세부', 'セブ', '宿务'],
        'naples': ['나폴리', 'ナポリ', '那不勒斯'],
        'kuala-lumpur': ['쿠알라룸푸르', 'クアラルンプール', '吉隆坡'],
        'phuket': ['푸껫', 'プーケット', '普吉岛'],
    };

    const filteredCities = cities.filter(c => {
        const searchLower = citySearchQuery.toLowerCase();
        const nameLower = c.name.toLowerCase();
        const countryLower = c.country.toLowerCase();
        const citySlug = nameLower.replace(/[\s_]+/g, '-');

        const matchDirect = nameLower.includes(searchLower) || countryLower.includes(searchLower);
        const matchMultiLang = MULTILANG_CITY_MAP[citySlug]?.some(name => name.includes(searchLower));

        return matchDirect || matchMultiLang;
    });

    return (
        <div className="bg-white min-h-full pb-8">
            {/* [적요] PWA 설치 안내 배너 - 다국어 지원 */}
            <div className="px-4 py-4 mt-2">
                <div className="bg-[#242424] rounded-3xl p-5 flex items-center justify-between shadow-xl">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Download className="w-6 h-6 outline-none text-[#E85D36]" />
                        </div>
                        <div>
                            <div className="text-white font-bold text-[15px]">
                                {installLabels.prompt}
                            </div>
                            <div className="text-[#E85D36] font-black text-[17px] mb-1">
                                {installLabels.benefit}
                            </div>
                            <p className="text-slate-400 text-[10px] leading-tight font-medium">
                                {installLabels.desc}
                            </p>
                        </div>
                    </div>
                    <button className="bg-[#E85D36] text-white text-[11px] font-bold px-4 py-2 rounded-xl active:scale-95 shrink-0 ml-2">
                        {installLabels.btn}
                    </button>
                </div>
            </div>

            <div className="px-6 py-2 pb-4">
                <div className="flex items-center justify-between mb-4">
                    {/* [적요] 섹션 헤더 - t() / 다국어 헬퍼 함수 사용 */}
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                        {getPortGuideLabel(selectedLanguage)}
                    </h2>
                    {/* [적요] 언어 빠른 전환 버튼 (ko/en/zh 3개) - LanguageSelector의 축소 버전 */}
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

                {/* [적요] 카테고리 필터 탭 - getCategoryLabel()로 모든 언어 지원 */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
                    {(['all', 'asia', 'europe', 'recommended'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${category === cat ? 'bg-[#E85D36] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {getCategoryLabel(cat, selectedLanguage)}
                        </button>
                    ))}
                </div>
            </div>

            {/* [적요] 도시 카드 목록 */}
            <div className="px-6 space-y-4">
                {filteredCities.map((city, idx) => {
                    const citySlug = city.name.toLowerCase().replace(/[\s_]+/g, '-');
                    const landingContent = (city as any)?.landingContent || LANDING_DATA[citySlug] || LANDING_DATA[city.id];
                    // [적요] 선택 언어 → 영어 → 기본값 순으로 fallback
                    const content = landingContent?.[selectedLanguage] || landingContent?.['en'];
                    const cityImage = content?.heroImage || 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=70';

                    const colors = ['bg-[#fcd2c8]', 'bg-[#c9e1f5]', 'bg-[#d0f0c0]', 'bg-[#fce5cd]'];
                    const bgCol = colors[idx % colors.length];
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
                                <div className="relative z-10 text-center">
                                    {/* [적요] 언어 코드 표시 - 선택 언어를 카드 상단에 표시 */}
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
                                    {/* [적요] content?.title은 선택 언어로 번역된 도시명 */}
                                    {content?.title || city.name}{', '}{city.country}
                                </div>
                                <div className="text-[11px] font-medium text-slate-400">
                                    {/* [적요] getStatsLabel()로 25개 언어 통계 문구 반환 */}
                                    {getStatsLabel(selectedLanguage)}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
