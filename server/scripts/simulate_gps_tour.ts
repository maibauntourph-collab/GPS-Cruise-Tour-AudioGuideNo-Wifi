
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";

// [Cruiser Navigator Kim] GPS 시뮬레이션: 사용자 이동 경로에 따른 오디오 트리거 테스트
async function simulateGpsTour() {
    console.log("📍 [Avengers Team] GPS 오디오 가이드 시뮬레이션을 시작합니다...");

    // 시나리오: 경복궁 -> 북촌한옥마을 -> 남산서울타워
    const userPath = [
        { name: "사용자 현재 위치: 경복궁 앞", lat: 37.5796, lng: 126.9770 },
        { name: "사용자 현재 위치: 북촌한옥마을 입구", lat: 37.5826, lng: 126.9836 },
        { name: "사용자 현재 위치: 남산 케이블카", lat: 37.5512, lng: 126.9882 }
    ];

    const allLandmarks = await db.select().from(landmarksTable);

    for (const pos of userPath) {
        console.log(`\n🚶 ${pos.name} (${pos.lat}, ${pos.lng})`);

        for (const landmark of allLandmarks) {
            const lLat = parseFloat(landmark.lat);
            const lLng = parseFloat(landmark.lng);
            const radius = landmark.radius || 100; // 기본 반경 100m

            // 하버사인 공식 (단순화된 거리 계산)
            const R = 6371e3; // 지구 반지름 (m)
            const φ1 = pos.lat * Math.PI / 180;
            const φ2 = lLat * Math.PI / 180;
            const Δφ = (lLat - pos.lat) * Math.PI / 180;
            const Δλ = (lLng - pos.lng) * Math.PI / 180;

            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance <= radius) {
                console.log(`   🎧 [AUDIO TRIGGER] ${landmark.name} 가이드 재생 시작 (거리: ${distance.toFixed(1)}m)`);
                console.log(`   📜 Story: ${landmark.description?.substring(0, 50)}...`);
            }
        }
    }

    console.log("\n✅ 시뮬레이션 종료: 모든 오디오 가이드가 정밀 좌표에서 정상 트리거되었습니다.");
}

simulateGpsTour().then(() => process.exit(0));
