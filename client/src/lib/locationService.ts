import { calculateDistance } from './geoUtils';
import { Landmark } from '@shared/schema';

/**
 * [도다리 부장 특강: '오프 스카우트'의 지리적 매핑 전략]
 * "사용자가 어디에 있든 우리는 그곳의 이야기를 들려줘야 합니다. 
 * GPS 좌표라는 숫자를 '로마'라는 설레는 이름으로 바꾸는 것, 그것이 이 서비스의 시작입니다."
 */

export interface CityHub {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radiusMeters: number; // 감지 반경
}

// [적요] 주요 거점 도시 데이터베이스 (Magic Prompt 요구사항 반영)
export const CITY_HUBS: CityHub[] = [
    {
        id: 'rome',
        name: 'Rome',
        lat: 41.8902,
        lng: 12.4922,
        radiusMeters: 50000 // 50km
    },
    {
        id: 'civitavecchia',
        name: 'Civitavecchia',
        lat: 42.0925,
        lng: 11.7954,
        radiusMeters: 20000 // 20km
    },
    {
        id: 'cebu',
        name: 'Cebu',
        lat: 10.3157,
        lng: 123.8854,
        radiusMeters: 30000 // 30km
    },
    {
        id: "tokyo",
        name: "Tokyo",
        lat: 35.6895,
        lng: 139.6917,
        radiusMeters: 40000
    },
    {
        id: "paris",
        name: "Paris",
        lat: 48.8566,
        lng: 2.3522,
        radiusMeters: 30000
    },
    {
        id: "barcelona",
        name: "Barcelona",
        lat: 41.3851,
        lng: 2.1734,
        radiusMeters: 30000
    }
];

export interface ProximityResult {
    landmark: Landmark;
    distance: number;
}

/**
 * 현재 위치 정보를 받아 입성한 도시 ID를 반환합니다.
 * @param lat 위도
 * @param lng 경도
 * @param cities DB에서 가져온 도시 목록 (선택 사항, 없으면 CITY_HUBS 사용)
 * @returns 매칭된 도시 ID 또는 null
 */
export function getMatchedCityId(lat: number, lng: number, cities: any[] = []): string | null {
    // 🛰️ [Server Park] DB에서 가져온 동적 도시 데이터가 있다면 우선적으로 사용합니다.
    const targets = cities.length > 0 ? cities : CITY_HUBS;

    for (const city of targets) {
        // DB 도시 데이터와 CITY_HUBS 모두 lat, lng를 가집니다.
        const distance = calculateDistance(lat, lng, city.lat, city.lng);

        // DB 도시 데이터에는 radiusMeters가 없을 수 있으므로 기본값 50km를 적용합니다.
        const radius = (city as any).radiusMeters || 50000;

        if (distance <= radius) {
            // [Bug Doctor] Silent by default to prevent console noise; use debug global if needed
            return city.id;
        }
    }
    return null;
}

/**
 * [교수님 노트] 사용자와 가장 가까운 랜드마크를 찾아주는 '가이드 도우미' 함수입니다.
 * 345개의 랜드마크를 효율적으로 계산하기 위해 루프를 돌며 거리를 측정합니다.
 * 
 * @param userLat - 사용자 위도
 * @param userLng - 사용자 경도
 * @param landmarks - 검색 대상 랜드마크 배열
 * @param excludeIds - 이미 안내된 랜드마크 ID 집합 (중복 안내 방지)
 * @param gpsAccuracy - GPS 정확도(미터). 이 값이 클수록 감지 반경이 소폭 확대됩니다.
 */
export function findNearestLandmark(
    userLat: number,
    userLng: number,
    landmarks: Landmark[],
    excludeIds: Set<string> = new Set(),
    gpsAccuracy: number = 0
): ProximityResult | null {
    let nearest: ProximityResult | null = null;
    let minDistance = Infinity;

    // [적요] GPS 오차를 고려한 보정값 계산 (최대 30m 제한)
    const accuracyBonus = Math.min(gpsAccuracy * 0.5, 30);

    for (const landmark of landmarks) {
        if (excludeIds.has(landmark.id)) continue;

        const distance = calculateDistance(userLat, userLng, landmark.lat, landmark.lng);
        const effectiveRadius = (landmark.radius || 50) + accuracyBonus;

        if (distance <= effectiveRadius && distance < minDistance) {
            minDistance = distance;
            nearest = { landmark, distance };
        }
    }

    if (nearest) {
        console.log(`📡 [GPS] Nearest landmark found: ${nearest.landmark.id} (Distance: ${Math.round(nearest.distance)}m, Radius: ${nearest.landmark.radius}m, Bonus: ${Math.round(accuracyBonus)}m)`);
    }

    return nearest;
}

/**
 * [Server Park] 현재 위치에서 가장 가까운 미방문 랜드마크를 찾는 래퍼 함수입니다.
 */
export function checkProximity(
    userLat: number,
    userLng: number,
    landmarks: Landmark[],
    excludeIds: Set<string> = new Set(),
    gpsAccuracy: number = 0
): ProximityResult | null {
    return findNearestLandmark(userLat, userLng, landmarks, excludeIds, gpsAccuracy);
}
