import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { eq, or, ilike } from "drizzle-orm";

/**
 * [Server Park | 2026-03-20] Phase 4: 글로벌 국가별 맞춤 추천 데이터 주입
 * 학생들에게: 단순히 데이터를 넣는 것이 아니라, 어느 국적의 사용자가 좋아할지 '태그(targetNations)'를 다는 작업입니다.
 */
async function importGlobalRecommendations() {
    console.log("🌏 글로벌 국가별 맞춤 추천 데이터 업데이트 시작...");

    const recommendationMap = [
        {
            keywords: ["Gyeongbokgung", "Palace", "DMZ", "Museum", "National"],
            nations: ["US", "EU"] // 역사와 정통 문화를 좋아하는 서구권
        },
        {
            keywords: ["Insadong", "Market", "Spa", "Tea", "Traditional"],
            nations: ["JP"] // 안전하고 아기자기한 감성을 좋아하는 일본
        },
        {
            keywords: ["Haeundae", "Beach", "Jeju", "Style", "Sinsa", "Myeongdong"],
            nations: ["TW", "CN"] // K-Pop, 쇼핑, 휴양을 선호하는 중화권
        },
        {
            keywords: ["Lotte World", "Everland", "Tower", "Starfield"],
            nations: ["CN", "US"] // 화려한 랜드마크를 선호
        }
    ];

    for (const item of recommendationMap) {
        for (const keyword of item.keywords) {
            const results = await db.select().from(landmarks).where(ilike(landmarks.name, `%${keyword}%`));

            for (const landmark of results) {
                const currentNations = landmark.targetNations || [];
                const newNations = Array.from(new Set([...currentNations, ...item.nations]));

                await db.update(landmarks)
                    .set({ targetNations: newNations })
                    .where(eq(landmarks.id, landmark.id));

                console.log(`✅ [${landmark.name}] -> 추천 국가 추가: ${item.nations.join(", ")}`);
            }
        }
    }

    console.log("🚀 글로벌 추천 데이터 업데이트 완료!");
}

importGlobalRecommendations().catch(console.error);
