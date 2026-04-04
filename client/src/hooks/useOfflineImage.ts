import { useState, useEffect } from 'react';
import { offlineStorage } from '../lib/offlineStorage';

/**
 * [Designer Kim | 2026-04-04] 오프라인 이미지 전략 훅
 * 온라인일 때는 원본 URL을 반환하고 백그라운드에서 캐싱하며,
 * 오프라인일 때는 IndexedDB에서 Blob을 가져와 브라우저 URL로 변환해 반환합니다.
 */
export function useOfflineImage(src: string | undefined, landmarkId?: string) {
    const [displayUrl, setDisplayUrl] = useState<string | undefined>(src);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!src) {
            setDisplayUrl(undefined);
            return;
        }

        let isMounted = true;
        let objectUrl: string | null = null;

        async function loadAndCache() {
            if (!src) return;

            // 1. 오프라인이거나 로컬 이미지가 이미 있는지 확인
            const cached = await offlineStorage.getImage(src);

            if (isOffline) {
                if (cached && cached.blob) {
                    objectUrl = URL.createObjectURL(cached.blob);
                    if (isMounted) setDisplayUrl(objectUrl);
                } else {
                    // 오프라인인데 캐시도 없으면 원본 시도 (보통 실패)
                    if (isMounted) setDisplayUrl(src);
                }
            } else {
                // 2. 온라인인 경우 원본 표시
                if (isMounted) setDisplayUrl(src);

                // 3. 백그라운드 캐싱 (30일 지났거나 없으면)
                const isStale = await offlineStorage.isImageStale(src);
                if (isStale) {
                    try {
                        const response = await fetch(src);
                        if (response.ok) {
                            const blob = await response.blob();
                            await offlineStorage.saveImage(src, blob, landmarkId);
                            // console.log(`[OfflineImg] Cached: ${src}`);
                        }
                    } catch (err) {
                        // CORS 이슈 등으로 실패할 수 있음
                        // console.warn(`[OfflineImg] Failed to cache: ${src}`, err);
                    }
                }
            }
        }

        loadAndCache();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src, isOffline, landmarkId]);

    return displayUrl;
}
