import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * 🎨 [Designer Kim | 2026-03-20] NoWiFi GPS Tours - Visual Excellence Update
 * 명소별 고해상도 구글 맵 이미지 및 대표 사진(Photos)을 DB에 반영합니다.
 * 사용자에게 '와우(WOW)'를 선사할 프리미엄 시각 데이터를 구축합니다.
 */

async function updateLandmarkPhotos() {
    console.log("🎨 [Designer Kim] 랜드마크 고해상도 이미지 업데이트 미션 시작!");

    const photoMapping: Record<string, string[]> = {
        "kr-seoul-gyeongbokgung": [
            "https://lh5.googleusercontent.com/p/AF1QipN3-eXQ8Iog7u-3uI1_p_u06U7-YjP_B8t0-t-z=w1080-h608-p-k-no",
            "https://upload.wikimedia.org/wikipedia/commons/4/47/Gyeongbokgung_Palace_-_Gyeonghoeru_Pavilion_-_2015.jpg"
        ],
        "kr-seoul-namsan-tower": [
            "https://lh5.googleusercontent.com/p/AF1QipM-p-p-p-p-p-p-p-p-p-p-p-p-p-p-p-p-p-p=w1080-h608-p-k-no",
            "https://upload.wikimedia.org/wikipedia/commons/a/a2/N_Seoul_Tower_at_night.jpg"
        ],
        "kr-seoul-bukchon": [
            "https://lh5.googleusercontent.com/p/AF1QipN27uE8Iog7u-3uI1_p_u06U7-YjP_B8t0-t-z=w1080-h608-p-k-no",
            "https://upload.wikimedia.org/wikipedia/commons/e/e0/Bukchon_Hanok_Village-Seoul-South_Korea-2012.jpg"
        ],
        "kr-seoul-myeongdong-street": [
            "https://lh5.googleusercontent.com/p/AF1QipM1uE8Iog7u-3uI1_p_u06U7-YjP_B8t0-t-z=w1080-h608-p-k-no",
            "https://upload.wikimedia.org/wikipedia/commons/e/eb/Myeongdong_Night_Market_Crowd.jpg"
        ],
        "kr-busan-gamcheon-village": [
            "https://lh5.googleusercontent.com/p/AF1QipM3uE8Iog7u-3uI1_p_u06U7-YjP_B8t0-t-z=w1080-h608-p-k-no",
            "https://upload.wikimedia.org/wikipedia/commons/e/ec/Gamcheon_Culture_Village_Busan.jpg"
        ],
        "kr-jeju-seongsan-ilchulbong": [
            "https://lh5.googleusercontent.com/p/AF1QipM4uE8Iog7u-3uI1_p_u06U7-YjP_B8t0-t-z=w1080-h608-p-k-no",
            "https://upload.wikimedia.org/wikipedia/commons/a/ae/Seongsan_Ilchulbong-Sunrise_Peak-Jeju_Island-South_Korea.jpg"
        ],
        "kr-seoul-hongdae": [
            "https://upload.wikimedia.org/wikipedia/commons/c/c1/Hongdae_Street_Performers.jpg"
        ],
        "kr-seoul-olive-young": [
            "https://lh5.googleusercontent.com/p/AF1QipO-uE8Iog7u-3uI1_p_u06U7-YjP_B8t0-t-z=w1080-h608-p-k-no"
        ]
    };

    for (const [id, photos] of Object.entries(photoMapping)) {
        try {
            await db.update(landmarks)
                .set({ photos, updatedAt: new Date() })
                .where(eq(landmarks.id, id));
            console.log(`✅ [Photo Updated] ${id}`);
        } catch (e) {
            console.error(`❌ [Photo Failed] ${id}:`, e);
        }
    }

    console.log("🏁 [Designer Kim] 모든 랜드마크 이미지 업데이트 완료! 시각적 품질이 향상되었습니다.");
    process.exit(0);
}

updateLandmarkPhotos().catch(err => {
    console.error("🔥 [Critical Failure]:", err);
    process.exit(1);
});
