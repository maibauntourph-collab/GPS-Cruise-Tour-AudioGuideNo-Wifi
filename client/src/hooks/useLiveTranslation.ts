import { useState, useEffect } from 'react';

export function useLiveTranslation(text: string | null | undefined, targetLanguage: string): string {
    const [translated, setTranslated] = useState(text || '');

    useEffect(() => {
        if (!text) {
            setTranslated('');
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
