import { useState, useEffect } from 'react';

/**
 * [교수님의 한마디: useLiveTranslation - ⑤ AI 실시간 번역기]
 * @에이? "학생 여러분, 이 훅은 외국어 설명을 우리말로 즉시 바꿔주는 마법사입니다. 
 * API 호출을 최소화하기 위해 내부적으로 캐싱(Cache) 처리도 하고 있답니다!"
 */
export function useLiveTranslation(text: string | null | undefined, targetLanguage: string): string {
    const [translated, setTranslated] = useState(text || '');

    useEffect(() => {
        if (!text) {
            setTranslated('');
            return;
        }

        // [Bug Doctor | 2026-03-23] 🎖️ 중요: 이미 번역된 텍스트가 대상 언어와 일치한다면 API 호출을 생략합니다.
        // 현재는 원본 텍스트가 번역본인지 알 수 없으므로, getTranslatedContent가 주는 결과가 null이 아닐 때
        // 이 훅을 호출하는 곳에서 원본을 유지하게 하거나, 여기서 간단한 언어 감지로 체크합니다.
        // (단, 여기서는 텍스트가 실시간 응답이 아닐 경우만 수행)

        // 1. 이미 실시간 번역이 불필요한 경우 (이미 해당 언어임)
        // [적요] 한국어 텍스트인데 타겟이 한국어면 즉시 종료
        const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text || '');
        if (isKorean && targetLanguage === 'ko') {
            setTranslated(text);
            return;
        }

        // Set initial text
        setTranslated(text);

        // If English is target and we already have English text (or assume it's English), just return
        // Actually, we don't know the source language reliably here, but we can assume /api/translate handles it.

        const fetchTranslation = async () => {
            const safeTextKey = text.replace(/[^a-zA-Z0-9가-힣]/g, '').substring(0, 30);
            const cacheKey = `trans_${targetLanguage}_${safeTextKey}`;

            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    setTranslated(cached);
                    return;
                }
            } catch (e) {
                // ignore
            }

            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, targetLanguage })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.translatedText) {
                        setTranslated(data.translatedText);
                        try {
                            localStorage.setItem(cacheKey, data.translatedText);
                        } catch (e) { }
                        return;
                    }
                }
            } catch (e) {
                console.error("Live translation failed", e);
            }
        };

        // Small debounce to prevent firing too many requests during fast renders
        const timer = setTimeout(() => {
            fetchTranslation();
        }, 100);

        return () => clearTimeout(timer);
    }, [text, targetLanguage]);

    return translated;
}
