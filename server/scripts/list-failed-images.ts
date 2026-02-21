import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { notIlike, and, isNotNull } from "drizzle-orm";

async function listFailedLandmarks() {
    console.log("📊 [Query Master] 이미지 생성 미완료 랜드마크 분석 시작...");

    try {
        // 'generated' 경로가 포함되지 않은 랜드마크들 조회
        // (현재 fallback인 placeholder.png 또는 이전의 Unsplash/null 상태인 것들)
        const failedLandmarks = await db.select({
            id: landmarks.id,
            name: landmarks.name,
            category: landmarks.category,
            photos: landmarks.photos
        })
            .from(landmarks)
            .where(
                and(
                    isNotNull(landmarks.photos)
                )
            );

        const list = failedLandmarks.filter(l => {
            const photos = l.photos as string[] | null;
            // '/images/generated/'가 포함되지 않은 것들이 생성 미완료 대상
            return !photos?.some(p => p.includes("/images/generated/"));
        });

        console.log(`\n--- [이미지 생성 미완료 랜드마크 리스트 (총 ${list.length}개)] ---`);
        list.forEach((l, i) => {
            const photos = l.photos as string[] | null;
            console.log(`${i + 1}. [${l.category || "기타"}] ${l.name} (ID: ${l.id})`);
            console.log(`   └─ 현재 경로: ${photos?.join(", ")}`);
        });

    } catch (error) {
        console.error("❌ 조회 중 오류 발생:", error);
    }
}

listFailedLandmarks().then(() => process.exit(0)).catch(console.error);
