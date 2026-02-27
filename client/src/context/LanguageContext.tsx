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
 * [수정 적요]
 * - Language 타입을 string으로 변경하여 translations.ts에 정의된 24개국 이상의 언어 코드를 모두 수용할 수 있게 되었습니다.
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
        // [적요] 기기 언어 자동 감지 로직
        const browserLang = navigator.language.split('-')[0];
        const initialLang: Language = browserLang === 'ko' ? 'ko' : 'en';
        setLanguage(initialLang);
        console.log(`🌐 [LanguageContext] 기기 언어 감지: ${browserLang} -> 적용: ${initialLang}`);
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
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
