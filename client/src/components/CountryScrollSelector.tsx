/**
 * [교수님 노트: CountryScrollSelector - 국가 선택 프리미엄 카드 스크롤]
 * @에이? "학생 여러분, 이 컴포넌트는 단순한 리스트가 아닙니다. 
 * 각 국가의 매력을 한눈에 보여주는 '후킹 멘트(Hooking Ment)'와 프리미엄 이미지를 활용해 
 * 사용자의 여행 기대감을 극대화하는 UX의 핵심입니다."
 */
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
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
    isEmbedded?: boolean;
}

const hookingMents: Record<string, { ko: string; en: string; th: string; image: string }> = {
    'South Korea': {
        ko: '현대적 혁신과 고궁의 품격이 어우러진 럭셔리 서울',
        en: 'Luxury Seoul: Where modern innovation meets royal dignity',
        th: 'โซลที่หรูหรา: ที่ซึ่งนวัตกรรมสมัยใหม่มาพบกับความสง่างามของราชวงศ์',
        // [적요] 경로 수정: south_korea.webp -> 실제 파일명 south_korea.webp 혹은 korea.webp 매핑
        image: '/images/countries/south_korea.webp'
    },
    'Italy': {
        ko: '지중해의 낭만과 역사가 숨쉬는 명품 이탈리아',
        en: 'Luxury Italy: Mediterranean romance and timeless history',
        th: 'อิตาลีที่หรูหรา: ความโรแมนติกของเมดิเตอร์เรเนียนและประวัติศาสตร์ที่เหนือกาลเวลา',
        // [적요] Italy 전용 로컬 이미지 italy.webp (존재함)
        image: '/images/countries/italy.webp'
    },
    'France': {
        ko: '예술과 미식, 세련된 취향의 정점 프랑스 파리',
        en: 'Luxury France: The pinnacle of art, cuisine, and refined taste',
        th: 'ฝรั่งเศสที่หรูหรา: จุดสูงสุดของศิลปะ อาหาร และรสชาติที่ประณีต',
        // [적요] France 전용 로컬 이미지 france.webp (존재함)
        image: '/images/countries/france.webp'
    },
    'Thailand': {
        ko: '에메랄드빛 바다와 황금빛 사원의 럭셔리 휴양지',
        en: 'Luxury Thailand: Emerald seas and majestic golden temples',
        th: 'ไทยที่หรูหรา: ทะเลสีมรกตและวัดสีทองที่งดงาม',
        // [적요] Thailand 전용 로컬 이미지 thailand.webp (존재함)
        image: '/images/countries/thailand.webp'
    },
    'Malaysia': {
        ko: '스카이라인과 열대림이 공존하는 시크한 말레이시아',
        en: 'Luxury Malaysia: Where skylines meet tropical rainforests',
        th: 'มาเลเซียที่หรูหรา: ที่ซึ่งเส้นขอบฟ้ามาบรรจบกับป่าฝนเขตร้อน',
        // [적요] Malaysia 럭셔리 이미지 (존재함)
        image: '/images/countries/malaysia_luxury.webp'
    },
    'Japan': {
        ko: '전통의 고요함과 찬란한 야경의 명품 교토-도쿄',
        en: 'Luxury Japan: Zen serenity and dazzling futuristic skylines',
        th: 'ญี่ปุ่นที่หรูหรา: ความสงบแบบเซนและเส้นขอบฟ้าแห่งอนาคตที่ตระการตา',
        image: '/images/landmarks/sensoji_nanobanana.webp'
    },
    'USA': {
        ko: '압도적인 스카이라인과 자유의 상징 뉴욕',
        en: 'Luxury USA: Iconic skylines and symbols of freedom',
        th: 'สหรัฐอเมริกาที่หรูหรา: เส้นขอบฟ้าที่เป็นสัญลักษณ์และสัญลักษณ์แห่งเสรีภาพ',
        // [적요] External URL → 로컬 이미지 (USA.webp 존재함)
        image: '/images/countries/usa.webp'
    },
    'United Kingdom': {
        ko: '전통과 현대가 공존하는 품격 있는 런던 여행',
        en: 'Luxury UK: Sophisticated journey through history and royalty',
        th: 'สหราชอาณาจักรที่หรูหรา: การเดินทางที่ซับซ้อนผ่านประวัติศาสตร์และความเป็นราชวงศ์',
        image: '/images/landmarks/big_ben_nanobanana.webp'
    },
    'Spain': {
        ko: '가우디의 예술혼과 열정적인 태양의 스페인',
        en: 'Luxury Spain: Gaudi’s artistic soul and passionate sun',
        th: '스페인ที่หรูหรา: จิตวิญญาณแห่งศิลปะของเกาดีและแสงแด드ที่ร้อนแรง',
        // [적요] Spain 로컬 이미지 (spain.webp 존재함)
        image: '/images/countries/spain.webp'
    },
    'Singapore': {
        ko: '초현대적 정원과 미래형 럭셔리 싱가포르',
        en: 'Luxury Singapore: Ultra-modern gardens and futuristic lifestyle',
        th: '스ิงคโปร์ที่หรูหรา: 스완ที่ทันสมัยสุด ๆ และ라이프스토어แห่งอนาค트',
        // [적요] Singapore 로컬 이미지 (singapore.webp 존재함)
        image: '/images/countries/singapore.webp'
    },
    'China': {
        ko: '장엄한 만리장성과 화려한 상하이의 야경',
        en: 'Luxury China: Ancient wonders and glittering modern metropolises',
        th: 'จีนที่หรูหรา: สิ่งมหัศจรรย์โบราณและเมืองที่ทันสมัยที่เปล่งประกาย',
        // [적요] China 로컬 이미지 (china.webp 존재함)
        image: '/images/countries/china.webp'
    },
    'Vietnam': {
        ko: '신비로운 하롱베이와 활력 넘치는 베트남의 미소',
        en: 'Luxury Vietnam: Mystical bays and vibrant cultural heritage',
        th: 'เวียดนามที่หรูหรา: อ่าวที่ลึกลับและมรดกทางวัฒนธรรมที่มีชีวิตชีวา',
        // [적요] Vietnam 로컬 이미지 (vietnam.webp 존재함)
        image: '/images/countries/vietnam.webp'
    },
    'Netherlands': {
        ko: '튤립 로맨스와 운하의 서정이 가득한 네덜란드',
        en: 'Luxury Netherlands: Canal-side elegance and tulip romance',
        th: 'เนเธอร์แลนด์ที่หรูหรา: ความสง่างามริมคลองและความโรแมนติกของดอกทิวลิป',
        // [적요] Netherlands 로컬 이미지 (netherlands.webp 존재함)
        image: '/images/countries/netherlands.webp'
    },
    'Philippines': {
        ko: '지상 최후의 낙원, 에메랄드빛 필리핀의 휴양지',
        en: 'Luxury Philippines: Paradise islands and emerald crystal waters',
        th: 'ฟิลิปปินส์ที่หรูหรา: เกาะสวรรค์และน้ำใสสีมรกต',
        // [적요] Philippines 로컬 이미지 (philippines.webp 존재함)
        image: '/images/countries/philippines.webp'
    },
    'Denmark': {
        ko: '동화 속 풍경과 북유럽 감성의 코펜하겐',
        en: 'Luxury Denmark: Fairy-tale charm and Nordic sophistication',
        th: 'เดนมาร์กที่หรูหรา: เสน่ห์ของเทพนิยายและความซับซ้อนของนอร์ดิก',
        // [적요] Denmark 로컬 이미지 (denmark.webp 존재함)
        image: '/images/countries/denmark.webp'
    },
    'Norway': {
        ko: '거대한 피오르드와 대자연의 경이로움 오슬로',
        en: 'Luxury Norway: Majestic fjords and breathtaking natural wonders',
        th: 'นอร์เวย์ที่หรูหรา: ฟยอร์ดที่สง่างามและสิ่งมหัศจรรย์ทางธรรมชาติที่น่าทึ่ง',
        // [적요] Norway 로컬 이미지 (norway.webp 존재함)
        image: '/images/countries/norway.webp'
    },
    'Hungary': {
        ko: '다뉴브강의 진주, 찬란한 야경의 부다페스트',
        en: 'Luxury Hungary: Pearl of the Danube and glittering architecture',
        th: 'ฮังการีที่หรูหรา: ไข่มุกแห่งแม่น้ำดานูบและสถาปัตยกรรมที่ระยิบระยับ',
        // [적요] Hungary 로컬 이미지 (hungary.webp 존재함)
        image: '/images/countries/hungary.webp'
    },
    'Poland': {
        ko: '중세의 낭만과 고전적 기품의 폴란드',
        en: 'Luxury Poland: Medieval romance and classical elegance',
        th: 'โปแลนด์ที่หรูหรา: ความโรแมนติกในยุคกลางและความสง่างามแบบคลาสสิก',
        // [적요] Poland 로컬 이미지 (poland.webp 존재함)
        image: '/images/countries/poland.webp'
    },
    'Belgium': {
        ko: '중세풍 건물과 초콜릿처럼 달콤한 브뤼셀 여행',
        en: 'Luxury Belgium: Gothic grandeur and world-class delights',
        th: 'เบลเยียมที่หรูหรา: ความยิ่งใหญ่สไตล์โกธิคและความสุขอันดับโลก',
        // [적요] Belgium 로컬 이미지 (belgium.webp 존재함)
        image: '/images/countries/belgium.webp'
    },
    'Czech Republic': {
        ko: '시간이 멈춘 중세의 신비로움, 프라하의 밤',
        en: 'Luxury Czech: Mystical medieval charm and gothic wonders',
        th: 'สาธารณรัฐเช็กที่หรูหรา: เสน่ห์ในยุคกลางที่ลึกลับและสิ่งมหัศจรรย์สไตล์โกธิค',
        // [적요] Czech Republic 로컬 이미지 (czech_republic.webp 존재함)
        image: '/images/countries/czech_republic.webp'
    },
    'Sweden': {
        ko: '정교한 디자인과 정갈한 북유럽의 조화 스톡홀름',
        en: 'Luxury Sweden: Refined design and Nordic harmony',
        th: 'สวีเดนที่หรูหรา: การออกแบบที่ประณีตและความสามัคคีของนอร์ดิก',
        // [적요] Sweden 로컬 이미지 (sweden.webp 존재함)
        image: '/images/countries/sweden.webp'
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
    onCityChange,
    isEmbedded = false
}: CountryScrollSelectorProps) {

    // [적요] DB에서 넘어오는 다양한 국가명(한글/영어)을 hookingMents 키와 매칭되도록 정규화
    const normalizeCountryName = (country: string): string => {
        const mapping: Record<string, string> = {
            '대한민국': 'South Korea', 'South Korea': 'South Korea',
            '일본': 'Japan', 'Japan': 'Japan',
            '태국': 'Thailand', 'Thailand': 'Thailand',
            '미국': 'USA', 'USA': 'USA',
            '말레이시아': 'Malaysia', 'Malaysia': 'Malaysia',
            '필리핀': 'Philippines', 'Philippines': 'Philippines',
            '베트남': 'Vietnam', 'Vietnam': 'Vietnam',
            '중국': 'China', 'China': 'China',
            '이탈리아': 'Italy', 'Italy': 'Italy',
            '프랑스': 'France', 'France': 'France',
            '영국': 'United Kingdom', 'United Kingdom': 'United Kingdom',
            'UK': 'United Kingdom',
            '스페인': 'Spain', 'Spain': 'Spain',
            '싱가포르': 'Singapore', 'Singapore': 'Singapore',
            '네덜란드': 'Netherlands', 'Netherlands': 'Netherlands',
            '덴마크': 'Denmark', 'Denmark': 'Denmark',
            '노르웨이': 'Norway', 'Norway': 'Norway',
            '헝가리': 'Hungary', 'Hungary': 'Hungary',
            '폴란드': 'Poland', 'Poland': 'Poland',
            '벨기에': 'Belgium', 'Belgium': 'Belgium',
            '체코': 'Czech Republic', 'Czech Republic': 'Czech Republic',
            '스웨덴': 'Sweden', 'Sweden': 'Sweden',
        };
        const trimmed = country.trim();
        return mapping[trimmed] || trimmed;
    };

    const getHookingMent = (country: string) => {
        const normalized = normalizeCountryName(country);
        const data = hookingMents[normalized];
        if (!data) return country;
        if (selectedLanguage === 'ko') return data.ko;
        if (selectedLanguage === 'th') return data.th;
        return data.en;
    };

    const getCountryImage = (country: string) => {
        const normalized = normalizeCountryName(country);
        const data = hookingMents[normalized];
        if (!data) return 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200';
        return data.image;
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollStart, setScrollStart] = useState(0);

    // [Mouse Wheel Scroll] 가로 방향 휠 스크롤 구현
    const handleWheel = (e: React.WheelEvent) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
            }
        }
    };

    // [Pick & Grab] 마우스 드래그 스크롤 구현
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        if (scrollRef.current) {
            setStartX(e.pageX - scrollRef.current.offsetLeft);
            setScrollStart(scrollRef.current.scrollLeft);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // 스크롤 감도 조정
        scrollRef.current.scrollLeft = scrollStart - walk;
    };

    const stopDragging = () => {
        setIsDragging(false);
    };

    return (
        <div className={`flex flex-col w-full max-w-full overflow-hidden ${isEmbedded ? 'gap-2 py-0' : 'gap-6 py-4'}`}>
            {!isEmbedded && (
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
            )}

            {/* horizontal scroll container - [Drag & Wheel Support] */}
            <div
                ref={scrollRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                className={`flex overflow-x-auto gap-4 px-6 pb-6 no-scrollbar snap-x snap-mandatory ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
            >
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
                                {/* Background Image with Performance Optimization */}
                                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800">
                                    <img
                                        src={getCountryImage(country)}
                                        alt={country}
                                        loading="lazy"
                                        decoding="async"
                                        fetchPriority={index < 3 ? "high" : "low"}
                                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                        onLoad={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.opacity = '1';
                                        }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            // [교수님 팁] WebP 로드 실패 시 PNG로 대체하거나 기본 플레이스홀더를 사용합니다.
                                            if (target.src.endsWith('.webp')) {
                                                target.src = target.src.replace('.webp', '.png');
                                            } else if (!target.src.includes('unsplash')) {
                                                target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200';
                                            }
                                        }}
                                        style={{ opacity: '0.6', transition: 'opacity 0.5s ease-in-out' }}
                                    />
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
