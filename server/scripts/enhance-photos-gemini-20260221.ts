// [학습 권고: 제미나이 기반 비주얼 스토리텔링 - Designer Kim]
// 1. 타겟팅: 사진이 아예 없거나 빈 배열인 랜드마크를 최우선 리뉴얼 대상으로 정합니다.
// 2. 프롬프트 엔지니어링: 제미나이 2.0의 이미지 생성 능력을 활용하여 고품질 이미지를 생성합니다.
// 3. 다운로드 및 저장: 생성된 데이터를 로컬 서버(public/images/generated)에 저장합니다.
// 4. DB 동기화: 저장된 로컬 이미지 경로를 DB에 업데이트합니다.

import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// [적요] Gemini API 설정
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
    console.error("❌ Gemini API 키가 누락되었습니다. (GEMINI_API_KEY 또는 GOOGLE_API_KEY)");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// [적요] 이미지 저장소 설정
const GENERATED_DIR = path.join(process.cwd(), "client", "public", "images", "generated");

async function enhancePhotosWithGemini() {
    console.log("📸 [Designer Kim] Gemini 기반 이미지 리뉴얼 세션을 시작합니다 (2026-02-21)...");

    if (!fs.existsSync(GENERATED_DIR)) {
        fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    // 사진이 없는 랜드마크 쿼리
    const targets = await db.select().from(landmarksTable).where(
        sql`json_array_length(${landmarksTable.photos}) = 0 OR ${landmarksTable.photos} IS NULL`
    );

    console.log(`🎯 사진 리뉴얼이 필요한 랜드마크: ${targets.length}개.`);

    let successCount = 0;

    for (const landmark of targets) {
        console.log(`\n⏳ 작업 중: ${landmark.name} (${landmark.id})...`);

        try {
            // [적요] Gemini 2.0 Flash Image Generation 모델 사용
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

            const prompt = `Generate a high-quality, photorealistic travel photograph of ${landmark.name}. 
            Description: ${landmark.description || "landmark"}. 
            Style: 8k resolution, cinematic lighting, vibrant colors, travel photography masterpiece. 
            No text in the image.`;

            console.log(`   🎨 Gemini 이미지 생성 요청 중...`);

            const result = await model.generateContent(prompt);
            const response = await result.response;

            const candidates = response.candidates;
            if (!candidates || candidates.length === 0) throw new Error("생성된 결과가 없습니다.");

            const parts = candidates[0].content.parts;
            // @ts-ignore
            const imagePart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith("image/"));

            // @ts-ignore
            if (imagePart && imagePart.inlineData) {
                // ... 기존 로직
            } else {
                // 어떤 경우에는 텍스트 응답 안에 URL이 올 수도 있으므로 체크 (안전 장치)
                console.log("   🔍 [Debug] 전체 응답 내용:", JSON.stringify(candidates[0].content, null, 2));
                const text = response.text ? response.text() : "응답 텍스트 없음";
                console.warn(`   ⚠️ 이미지 데이터가 없습니다. 텍스트 응답: ${text.substring(0, 100)}...`);
                throw new Error("응답에 이미지 데이터가 포함되어 있지 않습니다.");
            }

        } catch (error: any) {
            console.error(`   ❌ ${landmark.name} 이미지 생성 실패:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`\n✨ 세션 종료. 성공: ${successCount} / ${targets.length}`);
}

enhancePhotosWithGemini().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
