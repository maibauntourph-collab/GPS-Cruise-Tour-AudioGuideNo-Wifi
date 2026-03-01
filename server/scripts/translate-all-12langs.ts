import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// 12개 언어 (원본 한국어 제외 11개 외국어 타겟)
const TARGET_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh-CN', name: 'Simplified Chinese' },
    { code: 'zh-TW', name: 'Traditional Chinese' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'ru', name: 'Russian' }
];

const PROGRESS_FILE = '.12lang_translation_progress.json';

if (!process.env.GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function loadProgress(): Promise<string[]> {
    if (fs.existsSync(PROGRESS_FILE)) {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

async function saveProgress(completedIds: string[]) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(completedIds, null, 2));
}

async function startBatchTranslation() {
    console.log("🚀 Starting 12-Language Bulk Translation Job (Background)..");
    console.log("💡 Using Smart JSON Batching to translate 11 languages in 1 API call per landmark!");

    const allLandmarks = await db.select().from(landmarks).where(isNotNull(landmarks.narration));
    const completedIds = await loadProgress();

    const pendingLandmarks = allLandmarks.filter(l => !completedIds.includes(l.id));
    console.log(`총 랜드마크: ${allLandmarks.length} | 이미 번역완료: ${completedIds.length} | 번역 대기중: ${pendingLandmarks.length}개`);

    let currentBatch = 0;

    for (const landmark of pendingLandmarks) {
        currentBatch++;
        console.log(`\n⏳ [${currentBatch}/${pendingLandmarks.length}] '${landmark.name}' 다국어 번역 중...`);

        // Existing translations
        const currentTranslations = (landmark.translations as Record<string, any>) || {};

        // 체크: 모든 언어가 이미 번역되어 있는지?
        const missingLanguages = TARGET_LANGUAGES.filter(lang =>
            !currentTranslations[lang.code] ||
            !currentTranslations[lang.code].narration ||
            currentTranslations[lang.code].narration.length < 50
        );

        if (missingLanguages.length === 0) {
            console.log(`  - 모든 언어 이미 존재함. 스킵.`);
            completedIds.push(landmark.id);
            await saveProgress(completedIds);
            continue;
        }

        // 스마트 API 1회 호출을 위한 프롬프트 구성 (비용 및 시간 11배 절감)
        const prompt = `
Translate the following Korean tourist landmark name and audio guide narration into the following languages: 
${missingLanguages.map(l => `${l.name} (${l.code})`).join(', ')}.

Maintain the enthusiastic, engaging, and professional audio guide persona.
The narration uses a "Story Teller" persona with engaging facts and tips. Don't lose the fun tone!

Output ONLY a valid JSON object matching exactly this structure, with no markdown code blocks or extra text:
{
  "LANGUAGE_CODE": {
    "name": "TRANSLATED_NAME",
    "narration": "TRANSLATED_NARRATION"
  },
  ...
}

Original Data:
Name: ${landmark.name}
Narration: ${landmark.narration}
`;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.3
                }
            });

            const responseText = response.text || "{}";
            const translatedData = JSON.parse(responseText);

            // JSON 파싱 후 DB 형식에 맞춰 업데이트
            let updatedCount = 0;
            for (const lang of missingLanguages) {
                if (translatedData[lang.code]) {
                    currentTranslations[lang.code] = {
                        ...currentTranslations[lang.code],
                        name: translatedData[lang.code].name || landmark.name,
                        narration: translatedData[lang.code].narration || landmark.narration
                    };
                    updatedCount++;
                }
            }

            if (updatedCount > 0) {
                await db.update(landmarks)
                    .set({ translations: currentTranslations })
                    .where(eq(landmarks.id, landmark.id));
                console.log(`✅ [성공] ${landmark.name} - ${updatedCount}개 언어 번역 등록 완료 및 DB 갱신`);
            }

            completedIds.push(landmark.id);
            await saveProgress(completedIds);

        } catch (error) {
            console.error(`❌ [실패] ${landmark.name} 번역 중 오류 발생:`, error);
        }

        // Rate Limit 딜레이 (1 API 호출당 4초 대기)
        await new Promise(resolve => setTimeout(resolve, 4000));
    }

    console.log("\n🎉 모든 12개 국어 다국어 번역이 대성공으로 끝났습니다!");
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    process.exit(0);
}

startBatchTranslation().catch(console.error);
