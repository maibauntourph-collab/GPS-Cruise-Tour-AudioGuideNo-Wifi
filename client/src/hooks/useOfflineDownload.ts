import { useState, useCallback } from 'react';
import { offlineStorage } from '@/lib/offlineStorage';
import { type City, type Landmark } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export interface DownloadProgress {
    total: number;
    current: number;
    status: 'idle' | 'fetching_cities' | 'fetching_landmarks' | 'caching_images' | 'complete' | 'error';
    currentCountry?: string;
    currentCity?: string;
    downloadedBytes?: number;
    totalBytes?: number;
    error?: string;
}

export type DownloadScope =
    | { type: 'all' }
    | { type: 'asia' }
    | { type: 'europe' }
    | { type: 'country', countryName: string };

/**
 * [교수님의 한마디: useOfflineDownload - ① 일괄 다운로드 사령탑]
 * @에이? "학생 여러분, 이 훅은 WiFi가 잡혔을 때 전 세계의 모든 가이드를 
 * 내 휴대폰으로 쏙! 집어넣는 역할을 합니다. 정말 대단하지 않나요?
 * 이제 '아시아만', '유럽만', '특정 국가만' 골라서 똑똑하게 다운로드할 수 있어요!"
 * 
 * [학습 포인트]
 * 1. 선택적 다운로드(Selective Download): 전체 데이터가 너무 클 경우 지역별로 필터링하여 저장합니다.
 * 2. 이미지 배치(Batch) 처리: 5장씩 끊어서 진행하여 브라우저 부하를 줄였습니다.
 */
export function useOfflineDownload() {
    const [progress, setProgress] = useState<DownloadProgress>({
        total: 0,
        current: 0,
        status: 'idle',
    });
    const { toast } = useToast();

    const downloadData = useCallback(async (scope: DownloadScope = { type: 'all' }) => {
        try {
            setProgress({ total: 0, current: 0, status: 'fetching_cities' });

            // 1. 모든 도시 정보 가져오기
            const citiesResponse = await fetch('/api/cities');
            if (!citiesResponse.ok) throw new Error('Failed to fetch cities');
            const allCities: City[] = await citiesResponse.json();

            // Scope에 따른 필터링 로직
            let cities = allCities;
            if (scope.type === 'asia') {
                const asiaCountries = ['Malaysia', 'Philippines', 'Singapore', 'Thailand', '대한민국', '일본', 'South Korea', 'Japan', 'Vietnam', 'Indonesia', 'Philippines'];
                cities = allCities.filter(c => asiaCountries.includes(c.country));
            } else if (scope.type === 'europe') {
                const europeCountries = ['Italy', 'France', 'United Kingdom', 'Netherlands', 'Spain', 'Hungary', 'Poland', 'Denmark', 'Norway', 'Belgium', 'Czech Republic', 'Sweden'];
                cities = allCities.filter(c => europeCountries.includes(c.country));
            } else if (scope.type === 'country' && scope.countryName) {
                cities = allCities.filter(c => c.country === scope.countryName);
            }

            if (cities.length === 0) {
                throw new Error('선택한 범위에 해당하는 도시가 없습니다.');
            }

            setProgress({ total: cities.length, current: 0, status: 'fetching_landmarks' });

            // 2. 각 도시의 랜드마크 정보 가져오기 및 저장
            let landmarksDownloaded = 0;
            const allImages: string[] = [];

            for (const city of cities) {
                setProgress((prev: DownloadProgress) => ({
                    ...prev,
                    currentCountry: city.country,
                    currentCity: city.name,
                    status: 'fetching_landmarks'
                }));

                const landmarksResponse = await fetch(`/api/landmarks?cityId=${city.id}`);
                if (!landmarksResponse.ok) continue;
                const landmarks: Landmark[] = await landmarksResponse.json();

                // 오프라인 저장소에 저장
                await offlineStorage.saveOfflinePackage({
                    city,
                    landmarks,
                    version: 1,
                    downloadedAt: new Date().toISOString(),
                });

                // 이미지 URL 수집
                if (city.landingContent) {
                    Object.values(city.landingContent).forEach((content: any) => {
                        if (content && typeof content === 'object' && content.heroImage) {
                            allImages.push(content.heroImage);
                        }
                    });
                }

                landmarks.forEach(l => {
                    if (l.photos && Array.isArray(l.photos)) {
                        allImages.push(...l.photos);
                    }
                });

                landmarksDownloaded++;
                setProgress((prev: DownloadProgress) => ({
                    ...prev,
                    current: landmarksDownloaded,
                    total: cities.length,
                    currentCountry: city.country,
                    currentCity: city.name,
                }));
            }

            // 3. 이미지 리소스 브라우저 캐시에 강제 주입
            const uniqueImages = Array.from(new Set(allImages)).filter(url => url && url.startsWith('http'));
            setProgress({ total: uniqueImages.length, current: 0, status: 'caching_images' });

            let imagesCached = 0;
            const batchSize = 5;
            for (let i = 0; i < uniqueImages.length; i += batchSize) {
                const batch = uniqueImages.slice(i, i + batchSize);
                await Promise.all(batch.map(async (url) => {
                    try {
                        await fetch(url, { mode: 'no-cors', cache: 'force-cache' });
                    } catch (e) { }
                    imagesCached++;
                    setProgress((prev: DownloadProgress) => ({
                        ...prev,
                        current: Math.min(imagesCached, uniqueImages.length),
                        total: uniqueImages.length
                    }));
                }));
            }

            setProgress((prev: DownloadProgress) => ({ ...prev, status: 'complete', currentCountry: undefined, currentCity: undefined }));
            toast({
                title: scope.type === 'all' ? "전체 데이터 준비 완료" :
                    scope.type === 'asia' ? "아시아 데이터 준비 완료" :
                        scope.type === 'europe' ? "유럽 데이터 준비 완료" :
                            `${scope.countryName} 데이터 준비 완료`,
                description: "이제 인터넷 연결 없이도 모든 정보를 확인할 수 있습니다.",
            });

        } catch (error: any) {
            console.error('[OfflineDownload] Error:', error);
            setProgress((prev: DownloadProgress) => ({ ...prev, status: 'error', error: error.message }));
            toast({
                title: "다운로드 실패",
                description: error.message,
                variant: "destructive",
            });
        }
    }, [toast]);

    return {
        progress,
        downloadData,
        downloadAllData: () => downloadData({ type: 'all' }), // Backward compatibility
        isDownloading: progress.status !== 'idle' && progress.status !== 'complete' && progress.status !== 'error',
        isComplete: progress.status === 'complete',
    };
}
