import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 마커 아이콘 깨짐 방지용 (Leaflet 기본 이슈)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// GPS 추적 핸들링 컴포넌트
function LocationTracker({ setLocation }: { setLocation: (loc: [number, number]) => void }) {
    const map = useMap();

    useEffect(() => {
        if (!navigator.geolocation) {
            alert('브라우저가 GPS(Geolocation)를 지원하지 않습니다.');
            return;
        }

        // 초기 위치 가져오기 및 지속 추적
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
                setLocation(coords);
                map.flyTo(coords, 15);
            },
            (error) => {
                console.error('GPS 오류:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [map, setLocation]);

    return null;
}

export default function AppMap() {
    // 서울 시청 초기 좌표
    const [currentLoc, setCurrentLoc] = useState<[number, number]>([37.5665, 126.9780]);

    return (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <MapContainer
                center={currentLoc}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                {/* Designer Kim: 중국 폰(Amap 타일) 지원을 위한 高德 지도 URL 적용 */}
                <TileLayer
                    attribution='&copy; 高德地图 (Amap)'
                    url="https://webrd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8"
                    subdomains={['1', '2', '3', '4']}
                />

                <LocationTracker setLocation={setCurrentLoc} />

                {/* 내 위치 마커 */}
                <Marker position={currentLoc}>
                    <Popup>
                        📍 현재 나의 위치 <br />
                        (GPS 기반 실시간 연동)
                    </Popup>
                </Marker>
            </MapContainer>

            {/* 상단 오버레이 UI */}
            <div style={{
                position: 'absolute', top: '16px', left: '16px', zIndex: 400,
                backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '12px',
                borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(4px)'
            }}>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>NoWiFi GPS Tours</h1>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>현재 위치: {currentLoc[0].toFixed(4)}, {currentLoc[1].toFixed(4)}</p>
            </div>
        </div>
    );
}
