import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * [디자이너 킴의 UX 철학: '언어는 배려입니다']
 * "사용자가 앱을 켜자마자 자신의 모국어를 만나는 것,
 * 그것은 기술이 줄 수 있는 가장 따뜻한 환영 인사입니다."
 */

/**
 * [교수님 노트: 전 세계를 아우르는 다국어 컨텍스트]
 * @에이? "기존에 'ko'와 'en'만 지원하던 좁은 문을 활짝 열었습니다."
 *
 * [수정 적요 - 2026-03-23 09:38]
 * - Language 타입: string으로 확장 (25개 언어 코드 모두 수용)
 * - 전체 25개 언어 자동 감지 지원 (유럽어/아시아어 모두 포함)
 * - localStorage에 마지막 선택 언어 저장 → 재방문 시 복원
 * - handleSetLanguage() 헬퍼 도입 → 변경 즉시 저장
 */
type Language = string;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('en');

    useEffect(() => {
        /**
         * [교수님 노트: 기기 언어 자동 감지 로직]
         * navigator.language 예시:
         *   'th-TH' → langPrefix='th' → 태국어
         *   'ko-KR' → langPrefix='ko' → 한국어
         *   'zh-CN' → langPrefix='zh' → 중국어(간체)
         *   'zh-TW' → 번체 중국어 (전체 코드로 먼저 체크!)
         *
         * [적요] 재방문 사용자는 localStorage 저장값을 우선 복원합니다.
         */
        // 1) 마지막 저장 언어 복원 (재방문 사용자 우선 처리)
        const savedLang = localStorage.getItem('app-language');
        if (savedLang) {
            setLanguage(savedLang);
            console.log(`🌐 [LanguageContext] 저장된 언어 복원: ${savedLang}`);
            return;
        }

        // 2) 브라우저 언어 자동 감지 (신규 사용자)
        const browserLang = navigator.language.toLowerCase();
        const langPrefix = browserLang.split('-')[0];

        // [적요] 중국어는 번체/간체 구분이 필요하므로 전체 코드를 먼저 체크
        let initialLang: Language = 'en'; // 기본값: 영어

        if (browserLang.startsWith('zh-tw') || browserLang.startsWith('zh-hk'))
            initialLang = 'zh-TW';             // 🇹🇼 번체 중국어
        else if (langPrefix === 'zh') initialLang = 'zh-CN'; // 🇨🇳 간체 중국어
        else if (langPrefix === 'ko') initialLang = 'ko';    // 🇰🇷 한국어
        else if (langPrefix === 'th') initialLang = 'th';    // 🇹🇭 태국어
        else if (langPrefix === 'ja') initialLang = 'ja';    // 🇯🇵 일본어
        else if (langPrefix === 'vi') initialLang = 'vi';    // 🇻🇳 베트남어
        else if (langPrefix === 'id') initialLang = 'id';    // 🇮🇩 인도네시아어
        else if (langPrefix === 'es') initialLang = 'es';    // 🇪🇸 스페인어
        else if (langPrefix === 'fr') initialLang = 'fr';    // 🇫🇷 프랑스어
        else if (langPrefix === 'de') initialLang = 'de';    // 🇩🇪 독일어
        else if (langPrefix === 'it') initialLang = 'it';    // 🇮🇹 이탈리아어
        else if (langPrefix === 'pt') initialLang = 'pt';    // 🇵🇹 포르투갈어
        else if (langPrefix === 'ru') initialLang = 'ru';    // 🇷🇺 러시아어
        else if (langPrefix === 'ar') initialLang = 'ar';    // 🇸🇦 아랍어
        else if (langPrefix === 'hi') initialLang = 'hi';    // 🇮🇳 힌디어
        else if (langPrefix === 'tr') initialLang = 'tr';    // 🇹🇷 터키어
        else if (langPrefix === 'nl') initialLang = 'nl';    // 🇳🇱 네덜란드어
        else if (langPrefix === 'pl') initialLang = 'pl';    // 🇵🇱 폴란드어
        else if (langPrefix === 'sv') initialLang = 'sv';    // 🇸🇪 스웨덴어
        else if (langPrefix === 'da') initialLang = 'da';    // 🇩🇰 덴마크어
        else if (langPrefix === 'fi') initialLang = 'fi';    // 🇫🇮 핀란드어
        else if (langPrefix === 'no') initialLang = 'no';    // 🇳🇴 노르웨이어
        else if (langPrefix === 'el') initialLang = 'el';    // 🇬🇷 그리스어
        else if (langPrefix === 'cs') initialLang = 'cs';    // 🇨🇿 체코어

        setLanguage(initialLang);
        console.log(`🌐 [LanguageContext] 기기 언어 감지: ${browserLang} -> 적용: ${initialLang}`);
    }, []);

    /**
     * [적요] 언어 변경 핸들러
     * - 상태 업데이트와 localStorage 저장을 동시에 처리
     * - 재방문 시 선택한 언어를 자동 복원하기 위함
     */
    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        try {
            localStorage.setItem('app-language', lang);
            console.log(`🌐 [LanguageContext] 언어 변경 & 저장: ${lang}`);
        } catch (e) {
            // localStorage 접근 불가 환경(예: 시크릿 모드 일부) 무시
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
