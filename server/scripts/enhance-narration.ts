
import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, or, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is missing. Skipping AI enhancement.");
    process.exit(0);
}
const genAI = new GoogleGenAI({ apiKey });

async function enhanceNarration() {
    console.log("🎤 Story Teller Lee is entering the stage... (Gemini Edition / 한국어 모드)");

    // 1. Find landmarks that do not meet Gravity V3 Premium standards (MD500+ narration, MD400+ detailedDescription)
    const targets = await db.select().from(landmarksTable).where(
        or(
            sql`length(${landmarksTable.narration}) < 500`,
            sql`length(${landmarksTable.detailedDescription}) < 400`,
            sql`${landmarksTable.detailedDescription} IS NULL`
        )
    );

    console.log(`🎯 Found ${targets.length} landmarks needing enhancement.`);

    for (const landmark of targets) {
        console.log(`\nProcessing: ${landmark.name} (${landmark.id})...`);

        try {
            const systemPrompt = `당신은 세계 최고의 오디오 가이드 크리에이터 **'스토리텔러 이(Story Teller Lee)'**입니다.
                        
            [당신의 미션]
            1. 딱딱하고 지루한 여행지 정보를 찾아서 **최고급 프리미엄(Gravity V3 Premium)** 오디오 가이드와 상세 설명으로 재탄생시키세요.
            2. **나레이션 (narration)**: 
                - **최소 500자 이상**의 풍부한 분량.
                - 현장의 공기, 냄새, 소리, 전설을 담은 영화 같은 대본.
                - "상상해보세요", "지금 여러분의 발 아래에는..." 처럼 청취자를 현장으로 끌어들이는 몰입형 화법.
                - 친구에게 이야기하듯 친근한 '해요체' 사용.
            3. **상세 설명 (detailedDescription)**:
                - **최소 400자 이상**.
                - 역사적 팩트에 '현지인만 아는 꿀팁'이나 '숨겨진 비화'를 버무린 매혹적인 텍스트.
            4. **이미지 프롬프트 (imagePrompt)**:
                - **Nanobanana 스타일** 반영: "Hyper-realistic, 8k, cinematic lighting, wide-angle, vibrant colors".
                - 해당 장소의 가장 아름다운 순간을 묘사하는 정밀한 영문 프롬프트 생성.
            5. **언어**: 모든 텍스트 설명은 한국어로 작성하되, 'imagePrompt'만 영어로 작성하세요.
            
            [출력 형식]
            반드시 다음 JSON 형식으로만 응답하세요 (Markdown 포맷 없이 JSON 객체만):
            {
                "narration": "500자 이상의 프리미엄 나레이션 대본",
                "detailedDescription": "400자 이상의 심도 있는 상세 설명",
                "imagePrompt": "Nanobanana style English image prompt"
            }`;

            const userPrompt = `다음 장소의 정보를 Gravity V3 Premium 등급으로 고도화해주세요:
                        
            이름: ${landmark.name}
            도시: ${landmark.cityId}
            카테고리: ${landmark.category}
            기존 정보: ${landmark.narration || landmark.description || "정보 없음"}`;

            const response = await genAI.models.generateContent({
                model: "gemini-2.0-flash",
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
                ],
                config: {
                    responseMimeType: "application/json"
                }
            });


            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                console.log("Full Response Object:", JSON.stringify(response, null, 2));
                throw new Error("No text found in Gemini response");
            }

            const content = JSON.parse(text);

            if (content.narration && content.detailedDescription) {
                await db.update(landmarksTable)
                    .set({
                        narration: content.narration,
                        detailedDescription: content.detailedDescription,
                        updatedAt: new Date()
                    })
                    .where(eq(landmarksTable.id, landmark.id));

                console.log(`✅ Enhanced (V3 Premium): ${landmark.name}`);
                console.log(`   - Narration length: ${content.narration.length} chars`);
                console.log(`   - Description length: ${content.detailedDescription.length} chars`);
                console.log(`   - Image Prompt: ${content.imagePrompt?.substring(0, 30)}...`);
            } else {
                console.warn(`⚠️ Failed to generate valid content for ${landmark.name}`);
            }

        } catch (error) {
            console.error(`❌ Error processing ${landmark.name}:`, error);
        }

        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 3000)); // Be gentle with Gemini API (3s for free tier)
    }

    console.log("\n✨ Enhancement Complete! Story Teller Lee is signing off.");
}

enhanceNarration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
