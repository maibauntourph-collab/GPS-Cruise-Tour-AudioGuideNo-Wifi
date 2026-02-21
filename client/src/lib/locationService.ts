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
 * @returns 매칭된 도시 ID 또는 null
 */
export function getMatchedCityId(lat: number, lng: number): string | null {
    for (const city of CITY_HUBS) {
        const distance = calculateDistance(lat, lng, city.lat, city.lng);
        if (distance <= city.radiusMeters) {
            console.log(`📍 [LocationService] "${city.name}" 거점 진입 감지! (거리: ${Math.round(distance / 1000)}km)`);
            return city.id;
        }
    }
    return null;
}

/**
 * [교수님 노트] 사용자와 가장 가까운 랜드마크를 찾아주는 '가이드 도우미' 함수입니다.
 * 345개의 랜드마크를 효율적으로 계산하기 위해 루프를 돌며 거리를 측정합니다.
 */
export function findNearestLandmark(
    userLat: number,
    userLng: number,
    landmarks: Landmark[],
    excludeIds: Set<string> = new Set()
): ProximityResult | null {
    let nearest: ProximityResult | null = null;
    let minDistance = Infinity;

    for (const landmark of landmarks) {
        if (excludeIds.has(landmark.id)) continue;

        const distance = calculateDistance(userLat, userLng, landmark.lat, landmark.lng);

        // 설정된 반경(landmark.radius) 안에 들어왔는지 확인
        if (distance <= (landmark.radius || 50) && distance < minDistance) {
            minDistance = distance;
            nearest = { landmark, distance };
        }
    }

    return nearest;
}
