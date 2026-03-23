/**
 * [교수님 노트: CountryScrollSelector - 국가 선택 프리미엄 카드 스크롤]
 * @에이? "학생 여러분, 이 컴포넌트는 단순한 리스트가 아닙니다. 
 * 각 국가의 매력을 한눈에 보여주는 '후킹 멘트(Hooking Ment)'와 프리미엄 이미지를 활용해 
 * 사용자의 여행 기대감을 극대화하는 UX의 핵심입니다."
 * 
 * [수정 적요 - 2026-03-23]
 * - 가로 스크롤 방식의 카드 인터페이스 도입 (Framer Motion 활용)
 * - 국가별 맞춤형 후킹 멘트(Captivating Hooks) 적용
 * - 프리미엄 아바타/배경 이미지 시스템 구축
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CitySelector } from '@/components/CitySelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { City } from '@shared/schema';

interface CountryScrollSelectorProps {
    countries: string[];
    selectedCountry: string;
    onCountrySelect: (country: string) => void;
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
    onNext: () => void;
    cities: City[];
    selectedCityId: string;
    onCityChange: (cityId: string) => void;
}

const hookingMents: Record<string, { ko: string; en: string; th: string; image: string }> = {
    'South Korea': {
        ko: '전통과 첨단이 공존하는 역동적 에너지',
        en: 'Dynamic energy where tradition meets tech',
        th: 'พลังงานที่ไม่หยุดนิ่งที่ประเพณีพบกับเทคโนโลยี',
        image: '/images/countries/korea.png'
    },
    'Italy': {
        ko: '르네상스의 요람, 발길 닿는 곳마다 역사',
        en: 'The cradle of Renaissance and unmatched history',
        th: 'แหล่งกำเนิดของยุคเรอเนสซองส์และประวัติศาสตร์',
        image: '/images/countries/italy.png'
    },
    'France': {
        ko: '예술과 낭만이 가득한 랜드마크의 도시',
        en: 'Art of living and the most romantic landmarks',
        th: 'ศิลปะการใช้ชีวิตและแลนด์มาร์คที่โรแมนติกที่สุด',
        image: '/images/countries/france.png'
    },
    'Thailand': {
        ko: '미소와 황금빛 사원이 반기는 동남아의 보석',
        en: 'Land of smiles and majestic golden temples',
        th: 'ดินแดนแห่งรอยยิ้มและวัดสีทองที่สวยงาม',
        image: '/images/countries/thailand.png'
    },
    'Malaysia': {
        ko: '이국적인 자연과 다문화의 매끄러운 조화',
        en: 'Exotic nature and diverse cultural harmony',
        th: 'ธรรมชาติที่แปลกตาและความสามัคคีทางวัฒนธรรม',
        image: '/images/landmarks/placeholder.png'
    }
};

export function CountryScrollSelector({
    countries,
    selectedCountry,
    onCountrySelect,
    selectedLanguage,
    onLanguageChange,
    onNext,
    cities,
    selectedCityId,
    onCityChange
}: CountryScrollSelectorProps) {

    const getHookingMent = (country: string) => {
        const data = hookingMents[country];
        if (!data) return country;
        if (selectedLanguage === 'ko') return data.ko;
        if (selectedLanguage === 'th') return data.th;
        return data.en;
    };

    const getCountryImage = (country: string) => {
        return hookingMents[country]?.image || '/images/landmarks/placeholder.png';
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden py-4">
            <div className="flex items-center justify-between px-6 mt-2">
                <CitySelector
                    cities={cities}
                    selectedCityId={selectedCityId}
                    onCityChange={(id) => onCityChange(id)}
                    selectedLanguage={selectedLanguage}
                />
                <div className="w-24">
                    <LanguageSelector
                        selectedLanguage={selectedLanguage}
                        onLanguageChange={onLanguageChange}
                    />
                </div>
            </div>

            {/* horizontal scroll container */}
            <div className="flex overflow-x-auto gap-4 px-6 pb-6 no-scrollbar snap-x snap-mandatory">
                {countries.map((country, index) => {
                    const isSelected = selectedCountry === country;
                    return (
                        <motion.div
                            key={country}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="snap-center shrink-0"
                            onClick={() => onCountrySelect(country)}
                        >
                            <Card
                                className={`w-[280px] h-[380px] rounded-[2.5rem] overflow-hidden border-0 relative shadow-xl transition-all duration-300 ${isSelected ? 'ring-4 ring-orange-500 ring-offset-4 scale-[1.02]' : 'hover:scale-[1.01]'
                                    }`}
                            >
                                {/* Background Image */}
                                <div className="absolute inset-0">
                                    <img
                                        src={getCountryImage(country)}
                                        alt={country}
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                    />
                                    {/* 이미지 원본을 가리는 풀커버 레이어를 제거하고, 텍스트 가독성을 위한 최하단 그라디언트만 유지 */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-orange-500/90 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {index === 0 ? 'POPULAR' : 'EXPLORE'}
                                        </Badge>
                                    </div>
                                    <h3 className="text-2xl font-black text-white leading-tight mb-2">
                                        {country}
                                    </h3>
                                    <p className="text-[13px] font-medium text-white/80 leading-snug drop-shadow-md">
                                        {getHookingMent(country)}
                                    </p>

                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4"
                                        >
                                            <Button
                                                className="w-full rounded-2xl bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold border-0 h-11"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNext();
                                                }}
                                            >
                                                {selectedLanguage === 'ko' ? '도시 선택하기' : 'Choose City'} <ArrowRight className="ml-2 w-4 h-4" />
                                            </Button>
                                        </motion.div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
