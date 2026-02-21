
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

    // 1. Find landmarks with short narration (< 300 chars) OR missing detailed description
    const targets = await db.select().from(landmarksTable).where(
        or(
            sql`length(${landmarksTable.narration}) < 300`,
            sql`${landmarksTable.detailedDescription} IS NULL`
        )
    );

    console.log(`🎯 Found ${targets.length} landmarks needing enhancement.`);

    for (const landmark of targets) {
        console.log(`\nProcessing: ${landmark.name} (${landmark.id})...`);

        try {
            const systemPrompt = `당신은 세계 최고의 오디오 가이드 크리에이터 **'스토리텔러 이(Story Teller Lee)'**입니다.
                        
            [당신의 미션]
            1. 딱딱하고 지루한 여행지 정보를 찾아서 **5분 분량의 재미있고 몰입감 넘치는 오디오 가이드 대본**으로 재탄생시키세요.
            2. **스타일**: 
                - 유머러스하고 재치 있는 입담 (아재 개그 금지, 세련된 위트 사용).
                - "상상해보세요", "지금 여러분의 발 아래에는..." 처럼 청취자를 현장으로 끌어들이는 몰입형 화법.
                - 친구에게 이야기하듯 친근한 반존대나 해요체 사용 (상황에 맞춰 자연스럽게).
            3. **구성**:
                - **도입부(Hook)**: 듣자마자 귀를 사로잡는 강력한 첫 문장.
                - **본문(Body)**: 역사적 사실을 흥미진진한 스토리로 각색. ("알고 계셨나요?" 같은 트리비아 적극 활용)
                - **결론(Conclusion)**: 여운이 남는 마무리 멘트.
            4. **언어**: 한국어 (Korean)
            
            [출력 형식]
            반드시 다음 JSON 형식으로만 응답하세요 (Markdown 포맷 없이 JSON 객체만):
            {
                "narration": "300~500자 내외의 핵심 요약 (앱 목록 표시용)",
                "detailedDescription": "약 5분 분량의 전체 오디오 가이드 대본 (1500~2000자)"
            }`;

            const userPrompt = `다음 장소의 정보를 스토리텔러 이의 스타일로 고도화해주세요:
                        
            이름: ${landmark.name}
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

                console.log(`✅ Enhanced (Gemini): ${landmark.name}`);
                console.log(`   - Narration Summary: ${content.narration.substring(0, 50)}...`);
            } else {
                console.warn(`⚠️ Failed to generate valid content for ${landmark.name}`);
            }

        } catch (error) {
            console.error(`❌ Error processing ${landmark.name}:`, error);
        }

        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 2000)); // Slower for free tier
    }

    console.log("\n✨ Enhancement Complete! Story Teller Lee is signing off.");
}

enhanceNarration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
