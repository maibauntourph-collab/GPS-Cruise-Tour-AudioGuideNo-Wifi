import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// 대상 랜드마크 ID
const TARGET_IDS = ["paris_item_82", "busan_item_76"];

if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function regenerateMissingNarrations() {
    console.log("🚀 누락된 랜드마크 2건에 대한 프롬프트 업그레이드 및 재생성 시작...");

    // 프롬프트 읽기
    const promptTemplate = fs.readFileSync("docs/나레이션_업그레이드.md", "utf-8");

    for (const id of TARGET_IDS) {
        const [landmark] = await db.select().from(landmarks).where(eq(landmarks.id, id));

        if (!landmark) {
            console.log(`❌ 랜드마크 ID: ${id} 를 찾을 수 없습니다.`);
            continue;
        }

        console.log(`\n⏳ [${landmark.name}] 재생성 중...`);

        const finalPrompt = promptTemplate
            .replace("{{Landmark_Name_Korean}}", landmark.name)
            .replace("{{Landmark_Description}}", landmark.narration || "기본 역사 정보 부재")
            .replace("{{Nearby_Restaurants_Hotspots}}", "주변 유명 식당, 카페, 쇼핑명소를 추천해주세요.");

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: finalPrompt,
                config: {
                    temperature: 0.7,
                }
            });

            const newNarration = response.text;

            if (newNarration) {
                // 기존 원본 narration과 translations.ko 두 군데 모두 업데이트 (안전장치)
                const currentTranslations = (landmark.translations as Record<string, any>) || {};
                currentTranslations['ko'] = {
                    ...(currentTranslations['ko'] || {}),
                    name: landmark.name,
                    narration: newNarration
                };

                await db.update(landmarks)
                    .set({
                        narration: newNarration,
                        translations: currentTranslations
                    })
                    .where(eq(landmarks.id, id));

                console.log(`✅ [성공] ${landmark.name} 내레이션 업데이트 완료!`);
                console.log(`\n--- [${landmark.name} 생성 샘플 미리보기] ---\n`);
                console.log(newNarration.substring(0, 1000) + "\n...[중략]...\n");
                console.log("------------------------------------------");
            }
        } catch (error) {
            console.error(`❌ [실패] ${landmark.name} 생성 오류:`, error);
        }
    }

    process.exit(0);
}

regenerateMissingNarrations().catch(console.error);
