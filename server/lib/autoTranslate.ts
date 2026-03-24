/**
 * [Server Park & Query Master | 2026-03-23 10:05]
 * 자동 24개 언어 번역 모듈 — NeonDB translations 필드 자동 저장
 *
 * [교수님 노트: 이 파일의 역할]
 * 새로운 장소(Landmark)가 추가될 때 자동으로 OpenAI GPT를 호출하여
 * 24개 언어 번역본을 생성하고 NeonDB의 translations JSON 필드에 저장합니다.
 *
 * [흐름도]
 * LandmarkFormDialog → POST /api/landmarks → createLandmark()
 *   → autoTranslateLandmark() → OpenAI GPT-4o
 *   → db.update(landmarks).set({ translations }) → NeonDB 저장
 */

import { getOpenAI } from "./openai";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { eq } from "drizzle-orm";

// [적요] 지원하는 24개 언어 목록 (코드: 언어명 쌍)
export const SUPPORTED_LANGUAGES: Record<string, string> = {
    en: "English",
    ko: "Korean",
    ja: "Japanese",
    "zh-CN": "Simplified Chinese",
    "zh-TW": "Traditional Chinese",
    th: "Thai",
    vi: "Vietnamese",
    id: "Indonesian",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    tr: "Turkish",
    nl: "Dutch",
    pl: "Polish",
    sv: "Swedish",
    da: "Danish",
    fi: "Finnish",
    no: "Norwegian",
    el: "Greek",
};

// [적요] 번역 결과 1개 언어 타입
interface TranslationContent {
    name: string;
    narration: string;
    description: string;
    detailedDescription: string;
}

// [적요] 전체 번역 결과 타입 (언어코드 → 번역내용)
type AllTranslations = Record<string, TranslationContent>;

/**
 * [교수님 노트: OpenAI를 이용한 일괄 번역 함수]
 * 한 번의 API 호출로 24개 언어를 모두 번역하여 비용/시간을 절약합니다.
 * GPT-4o의 JSON mode를 활용하여 구조화된 결과를 받아옵니다.
 *
 * @param name - 장소 이름 (주로 한국어 또는 영어 원본)
 * @param narration - 오디오 나레이션 원본 텍스트
 * @param description - 짧은 설명 원본
 * @param detailedDescription - 상세 설명 원본
 * @returns 24개 언어 번역 결과 객체
 */
export async function translateToAllLanguages(
    name: string,
    narration: string,
    description: string,
    detailedDescription: string
): Promise<AllTranslations> {
    const openai = getOpenAI();

    // [적요] OpenAI 키가 없을 경우 영어만 반환 (개발 환경 fallback)
    if (!openai) {
        console.warn("[autoTranslate] OpenAI key not set. Returning English only.");
        return {
            en: { name, narration, description, detailedDescription },
        };
    }

    const languageList = Object.entries(SUPPORTED_LANGUAGES)
        .map(([code, langName]) => `"${code}": "${langName}"`)
        .join(", ");

    const prompt = `
You are a professional multilingual travel content translator.
Translate the following landmark information into ALL 24 languages listed below.
Preserve proper nouns (place names, historical figures, etc.) appropriately for each language.
Return ONLY valid JSON with no extra text.

Languages to translate into:
{ ${languageList} }

Source content to translate:
- name: "${name}"
- narration: "${narration.substring(0, 1500)}"
- description: "${description?.substring(0, 500) || ""}"
- detailedDescription: "${detailedDescription?.substring(0, 800) || ""}"

Return format (JSON object with language codes as keys):
{
  "en": { "name": "...", "narration": "...", "description": "...", "detailedDescription": "..." },
  "ko": { "name": "...", "narration": "...", "description": "...", "detailedDescription": "..." },
  ... (all 24 languages)
}
`.trim();

    try {
        console.log(`[autoTranslate] Translating "${name}" into 24 languages via GPT-4o...`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            // [적요] max_tokens 충분히 설정 - 24개 언어 × 4개 필드
            max_tokens: 16000,
            temperature: 0.3, // 낮은 온도 = 일관된 번역
        });

        const raw = response.choices[0].message.content || "{}";
        const parsed: AllTranslations = JSON.parse(raw);

        const langCount = Object.keys(parsed).length;
        console.log(`[autoTranslate] ✅ Translated into ${langCount} languages successfully.`);
        return parsed;
    } catch (error: any) {
        console.error("[autoTranslate] GPT translation failed:", error?.message);
        // [적요] 실패 시 원본 데이터만 영어로 반환
        return {
            en: { name, narration, description, detailedDescription },
        };
    }
}

/**
 * [교수님 노트: 랜드마크 ID로 자동 번역 실행 및 NeonDB 저장]
 * 장소 추가 API에서 호출됩니다.
 * 번역 완료 후 즉시 NeonDB의 해당 행 translations 컬럼을 업데이트합니다.
 *
 * @param landmarkId - 번역할 랜드마크의 DB ID
 * @param sourceData - 원본 텍스트 데이터
 */
export async function autoTranslateLandmark(
    landmarkId: string,
    sourceData: {
        name: string;
        narration: string;
        description?: string | null;
        detailedDescription?: string | null;
    }
): Promise<void> {
    try {
        // [적요] 24개 언어 번역 실행
        const translations = await translateToAllLanguages(
            sourceData.name,
            sourceData.narration,
            sourceData.description || "",
            sourceData.detailedDescription || ""
        );

        // [Server Park 2026-03-25] 신규 다국어 스키마 전용 컬럼 데이터 생성
        const narrationI18n: Record<string, string> = {};
        const descriptionI18n: Record<string, string> = {};

        for (const [lang, content] of Object.entries(translations)) {
            if (content.narration) narrationI18n[lang] = content.narration;
            if (content.description) descriptionI18n[lang] = content.description;
        }

        // [적요] NeonDB translations 및 전용 I18n 컬럼 업데이트
        await db
            .update(landmarks)
            .set({
                translations: translations as any,
                narrationI18n: narrationI18n as any,
                descriptionI18n: descriptionI18n as any,
                updatedAt: new Date(),
            })
            .where(eq(landmarks.id, landmarkId));

        console.log(`[autoTranslate] ✅ NeonDB updated: landmark ${landmarkId} with ${Object.keys(translations).length} language translations (incl. narrationI18n).`);
    } catch (error: any) {
        // [적요] 번역 실패는 랜드마크 저장을 막지 않음 (비동기 처리)
        console.error(`[autoTranslate] ❌ Failed to auto-translate landmark ${landmarkId}:`, error?.message);
    }
}
