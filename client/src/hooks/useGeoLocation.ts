import { useState, useEffect } from 'react';
import { GpsPosition } from '@shared/schema';

/**
 * [교수님의 한마디: useGeoLocation - ③ 실시간 GPS 항해사]
 * @에이? "이 훅은 브라우저의 GPS 센서를 React와 연결해 줍니다. 
 * 위도와 경도를 실시간으로 추적하여 목적지까지의 거리를 계산하죠."
 */
export function useGeoLocation(enabled: boolean = true) {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        // [적요] GPS 정확도 필터링:
        // accuracy가 100m 초과인 경우 부정확한 GPS 신호로 판단하여 무시합니다.
        // 이를 통해 실내, 터널, 고층 빌딩 사이 등에서 잘못된 랜드마크 트리거를 방지합니다.
        if (pos.coords.accuracy > 100) {
          console.log(`⚠️ [GPS] 정확도 낮음: ${Math.round(pos.coords.accuracy)}m — 위치 업데이트 무시`);
          setIsLoading(false);
          return;
        }

        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        // [적요] timeout: 15초 — 터널/실내 등 GPS가 느린 환경 대응
        timeout: 15000,
        // [적요] maximumAge: 3초 — 최근 3초 이내 캐시된 위치를 재사용하여 배터리 절약
        maximumAge: 3000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return { position, error, isLoading };
}
