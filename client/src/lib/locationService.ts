import { calculateDistance } from './geoUtils';

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
    }
];

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
