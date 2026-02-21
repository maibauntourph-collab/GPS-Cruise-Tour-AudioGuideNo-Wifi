// [학습 권고: 제미나이 기반 비주얼 스토리텔링 - Designer Kim]
// 1. 타겟팅: 사진이 없거나 placeholder인 랜드마크를 대상으로 전수 재작업을 수행합니다.
// 2. 프롬프트 엔지니어링: 고해상도 실사진 스타일을 위해 정밀한 프롬프트를 구성합니다.
// 3. 응답 파싱: Gemini 2.0 Flash의 inlineData에서 이미지 바이너리를 안전하게 추출합니다.

import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, sql, or, like, isNull } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// API 설정
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const GENERATED_DIR = path.join(process.cwd(), "client", "public", "images", "generated");

async function enhancePhotosGeminiFinal() {
    console.log("📸 [Designer Kim] Gemini 이미지 전수 재작업 세션을 시작합니다...");

    if (!fs.existsSync(GENERATED_DIR)) {
        fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    // 모든 랜드마크를 대상으로 전수 재작업 수행 (필터 조건 단순화)
    const targets = await db.select().from(landmarksTable);

    console.log(`🎯 재작업 대상 랜드마크: ${targets.length}개.`);

    let successCount = 0;

    for (const landmark of targets) {
        console.log(`\n⏳ [${successCount + 1}/${targets.length}] 생성 중: ${landmark.name}...`);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

            const prompt = `Capture a breathtaking, high-quality professional travel photograph of ${landmark.name} in ${landmark.category || "its city"}. 
            Detailed view: ${landmark.description || landmark.name}. 
            Style: Photorealistic, 8k resolution, cinematic lighting, sharp focus, vibrant and natural colors. 
            Strictly NO text, NO watermarks.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;

            let imageDataBase64 = null;
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
                        imageDataBase64 = part.inlineData.data;
                        break;
                    }
                }
            }

            if (imageDataBase64) {
                const buffer = Buffer.from(imageDataBase64, "base64");
                const filename = `${landmark.id}_${Date.now()}.png`;
                const localPath = path.join(GENERATED_DIR, filename);
                const dbPath = `/images/generated/${filename}`;

                fs.writeFileSync(localPath, buffer);

                await db.update(landmarksTable)
                    .set({ photos: [dbPath], updatedAt: new Date() })
                    .where(eq(landmarksTable.id, landmark.id));

                console.log(`   ✅ 생성 및 DB 반영 완료: ${dbPath}`);
                successCount++;
            } else {
                console.warn(`   ⚠️ 이미지 데이터를 추출하지 못했습니다. (API 응답 형식 불일치)`);
            }

        } catch (error: any) {
            console.error(`   ❌ FAIL: ${error.message}`);
        }

        // 안정적인 생성을 위해 약간의 지연 시간 부여
        await new Promise(r => setTimeout(r, 4000));
    }

    console.log(`\n✨ 재작업 결과: 성공 ${successCount} / 전체 ${targets.length}`);
}

enhancePhotosGeminiFinal().then(() => process.exit(0)).catch(console.error);
