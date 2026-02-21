import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import fs from "fs";
import path from "path";

async function exportPrompts() {
    console.log("📝 [Query Master] 모든 랜드마크 이미지 생성 프롬프트 추출 시작...");

    try {
        const allLandmarks = await db.select().from(landmarksTable);
        console.log(`🎯 처리 대상: 총 ${allLandmarks.length}개 랜드마크.`);

        let mdContent = "# Landmark Image Generation Prompts\n\n";
        mdContent += "본 문서는 외부 이미지 생성 AI(DALL-E, Midjourney 등)에서 사용할 수 있는 고도로 최적화된 프롬프트 리스트입니다.\n\n";

        const promptList = allLandmarks.map((l, index) => {
            const prompt = `Capture a breathtaking, high-quality professional travel photograph of ${l.name} in ${l.category || "its city"}. Detailed view: ${l.description || l.name}. Style: Photorealistic, 8k resolution, cinematic lighting, sharp focus, vibrant and natural colors. Strictly NO text, NO watermarks.`;

            mdContent += `## ${index + 1}. ${l.name} (ID: ${l.id})\n`;
            mdContent += `**Prompt:** \`${prompt}\`\n\n`;

            return {
                id: l.id,
                name: l.name,
                category: l.category,
                prompt: prompt
            };
        });

        const OUTPUT_MD = path.join(process.cwd(), "docs", "LANDMARK_IMAGE_PROMPTS_20260221.md");
        const OUTPUT_JSON = path.join(process.cwd(), "docs", "landmark_image_prompts_detail.json");

        fs.writeFileSync(OUTPUT_MD, mdContent);
        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(promptList, null, 2));

        console.log(`\n✅ 프롬프트 추출 완료!`);
        console.log(`📂 Markdown: ${OUTPUT_MD}`);
        console.log(`📂 JSON: ${OUTPUT_JSON}`);

    } catch (error) {
        console.error("❌ 추출 실패:", error);
    }
}

exportPrompts().then(() => process.exit(0));
