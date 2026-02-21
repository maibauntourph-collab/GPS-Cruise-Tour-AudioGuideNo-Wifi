//랜드마크 전체 이미지를 위한 명령 프롬프트 생성


// [학습 권고: AI 업무자동화의 정석 - Automation Doctor]
// 1. 데이터 추출: DB에서 작업이 필요한 대상(사진 5장 미만)을 선별합니다.
// 2. 배치 처리: API 비용과 속도 제한을 고려하여 10개씩 묶어서 처리합니다.
// 3. LLM 페르소나: Gemini에게 '세계 최고 수준의 이미지 프롬프터' 역할을 부여하여 고품질 결과를 유도합니다.
// 4. 구조화된 출력: JSON 형식을 강제하여 후속 DB 반영 작업이 자동화될 수 있게 설계했습니다.

import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { sql } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

// [적요] Gemini AI 설정: 2025년 6월 출시된 안정판 'gemini-2.5-flash' 모델을 사용합니다.
// 이 모델은 대규모 데이터를 빠르고 정확하게 처리하며, 이미지 프롬프트 생성에 최적화되어 있습니다.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// [적요] 결과물 저장 경로: 생성된 1,725개(예상) 프롬프트는 docs 폴더에 JSON으로 저장됩니다.
const OUTPUT_PATH = path.join(process.cwd(), "docs", "full_image_prompts.json");

async function generatePrompts() {
    console.log("🤖 [Automation Doctor] 대량 프롬프트 생성 세션을 시작합니다...");

    try {
        // [적요] 데이터 필터링: 사진이 부족한(5장 미만) 랜드마크 294개를 추출합니다.
        const allLandmarks = await db.select().from(landmarksTable);
        const targets = allLandmarks.filter(l => !l.photos || (Array.isArray(l.photos) && l.photos.length < 5));

        console.log(`🎯 대상 선정: 총 ${targets.length}개의 랜드마크가 리뉴얼 대상입니다.`);

        const results: any = {};

        // [적요] 효율적 배치 작업: 10개 단위로 LLM에게 요청하여 안정성을 확보합니다.
        const batchSize = 10;
        for (let i = 0; i < targets.length; i += batchSize) {
            const batch = targets.slice(i, i + batchSize);
            console.log(`\n📦 배치 처리 중... (${Math.floor(i / batchSize) + 1}/${Math.ceil(targets.length / batchSize)})`);

            // [적요] 프롬프트 엔지니어링: Designer Kim이 정의한 5대 컨셉을 LLM에게 명확히 지시합니다.
            const promptTask = `
                너는 세계 최고의 AI 이미지 프롬프트 엔지니어다. 다음 랜드마크 데이터를 바탕으로 
                DALL-E 3에서 사용할 5가지 서로 다른 비주얼 컨셉의 프롬프트를 생성해라:
                1. Concept A (현장감): 24mm 광각 렌즈로 찍은 실사풍 대낮 사진.
                2. Concept B (로맨틱 밤): 따뜻한 랜턴 조명과 밤하늘이 어우러진 시네마틱한 분위기.
                3. Concept C (예술적 화풍): 수채화와 잉크를 사용한 미니멀한 일러스트 느낌.
                4. Concept D (역동적 시점): 드론 시점에서 내려다본 웅장한 풍경.
                5. Concept E (디테일/질감): 건축물의 조각이나 석재의 질감을 강조한 매크로 뷰.

                랜드마크 리스트:
                ${batch.map(l => `- ${l.name} (ID: ${l.id}, 설명: ${l.description})`).join('\n')}

                출력 형식: 반드시 아래 구조의 순수 JSON 객체여야 함 (다른 설명 생략):
                {
                  "landmark_id": ["프롬프트1", "프롬프트2", "프롬프트3", "프롬프트4", "프롬프트5"]
                }
            `;

            const result = await model.generateContent(promptTask);
            const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

            try {
                // [적요] 데이터 무결성: LLM의 응답을 JSON으로 파싱하여 결과 객체에 합칩니다.
                const batchResults = JSON.parse(responseText);
                Object.assign(results, batchResults);
                console.log(`✅ 배치 ${Math.floor(i / batchSize) + 1} 완료.`);
            } catch (e) {
                console.error(`❌ JSON 파싱 실패 (배치 ${Math.floor(i / batchSize) + 1}):`, responseText);
            }

            // [적요] 실시간 저장: 작업 도중 중단되어도 데이터를 잃지 않도록 즉시 파일에 씁니다.
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

            // [적요] API 보호: 초당 요청 제한(Rate Limit)을 준수하기 위해 2초간 대기합니다.
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log(`\n✨ 총 ${Object.keys(results).length}개 랜드마크의 프롬프트 생성이 완료되었습니다.`);
        console.log(`📂 저장 위치: ${OUTPUT_PATH}`);

    } catch (error) {
        console.error("❌ 작업 실패:", error);
    }
}

generatePrompts().then(() => process.exit(0));
