import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * [디자이너 킴의 UX 철학: '언어는 배려입니다']
 * "사용자가 앱을 켜자마자 자신의 모국어를 만나는 것, 
 * 그것은 기술이 줄 수 있는 가장 따뜻한 환영 인사입니다."
 */

type Language = 'ko' | 'en';

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
