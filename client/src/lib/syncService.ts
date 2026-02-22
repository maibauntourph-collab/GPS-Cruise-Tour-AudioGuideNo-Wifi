import { Landmark, City } from "@shared/schema";
import { offlineStorage } from "./offlineStorage";

/**
 * [Query Master] On-Demand Sync Service
 * 사용자의 액션에 따라 필요한 도시의 데이터를 실시간으로 가져와 
 * 오프라인 저장소(IndexedDB)에 영구 박제합니다.
 */
export const syncService = {
    /**
     * 특정 도시의 모든 데이터를 패키지 형태로 동기화합니다.
     */
    async syncCityData(cityId: string): Promise<boolean> {
        try {
            console.log(`📡 [Sync Service] Fetching offline package for: ${cityId}`);

            const response = await fetch(`/api/offline-package/${cityId}`);
            if (!response.ok) {
                if (response.status === 304) {
                    console.log(`✅ [Sync Service] ${cityId} data is already up-to-date (304)`);
                    return true;
                }
                throw new Error('Sync failed');
            }

            const packageData = await response.json();

            // IndexedDB에 저장
            await offlineStorage.saveOfflinePackage({
                city: packageData.city,
                landmarks: packageData.landmarks,
                version: packageData.version,
                downloadedAt: packageData.downloadedAt
            });

            console.log(`✅ [Sync Service] Successfully synced ${packageData.landmarks.length} items for ${cityId}`);
            return true;
        } catch (error) {
            console.warn(`⚠️ [Sync Service] Failed to sync ${cityId}:`, error);
            return false;
        }
    },

    /**
     * 앱 구동 시 초기 필수 데이터(지수 데이터 등)를 동기화합니다.
     */
    async syncBootstrapData(): Promise<void> {
        try {
            // 도시 목록 정보 등 가벼운 정보 우선 동기화
            const response = await fetch('/api/cities');
            if (response.ok) {
                const cities: City[] = await response.json();
                for (const city of cities) {
                    // 도시 기본 정보만 IndexedDB에 저장 (기존 cities 상점 이용)
                    await (offlineStorage as any).saveCity?.(city); // saveCity가 있다면 사용
                }
            }
        } catch (error) {
            console.error('Bootstrap sync failed:', error);
        }
    }
};
