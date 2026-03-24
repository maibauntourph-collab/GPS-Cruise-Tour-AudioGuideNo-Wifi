import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../env";

let genAI: GoogleGenerativeAI | null = null;

export function getGemini() {
  if (genAI) return genAI;

  const apiKey = env.GEMINI_API_KEY;
  if (apiKey) {
    // [Fix] API 버전을 v1으로 명시
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.warn("WARNING: GEMINI_API_KEY not set.");
  }
  return genAI;
}

/**
 * [교수님 노트] Gemini를 이용한 텍스트 번역 함수
 * GPT와 유사하게 JSON 출력을 유도하여 구조화된 데이터를 받아옵니다.
 */
export async function translateWithGemini(prompt: string): Promise<string> {
  const ai = getGemini();
  if (!ai) throw new Error("Gemini API key not configured");

  // [Fix] 2026년 환경에 맞춰 지원되는 모델로 변경 (gemini-1.5 -> gemini-2.0-flash)
  const model = ai.getGenerativeModel({
    model: "gemini-2.0-flash",
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const response = await result.response;
  return response.text();
}

/**
 * [교수님 노트] 도시 이름으로 기본 정보 및 랜드마크 추천을 생성하는 함수
 */
export async function generateCityInfo(cityQuery: string, language: string = 'ko'): Promise<any> {
  const prompt = `Generate a detailed travel guide for the city "${cityQuery}" in ${language}. 
  Return a JSON object with: name, country, description, and a list of 5 key landmarks with name, lat, lng, and brief description.`;

  const response = await translateWithGemini(prompt);
  try {
    return JSON.parse(response);
  } catch (e) {
    console.error("Failed to parse Gemini response for city info:", e);
    return { name: cityQuery, error: "Failed to generate structured data" };
  }
}

/**
 * [교수님 노트] 사용자 취향에 맞는 투어 경로 추천
 */
export async function recommendTourItinerary(preferences: any, language: string = 'ko'): Promise<any> {
  const prompt = `Based on these preferences: ${JSON.stringify(preferences)}, recommend a half-day tour itinerary. 
  Language: ${language}. Return JSON with title, duration, and stops.`;

  const response = await translateWithGemini(prompt);
  return JSON.parse(response);
}

/**
 * [교수님 노트] 일반 텍스트 번역
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text as a JSON object: {"translatedText": "..."}\n\nText: ${text}`;

  const responseText = await translateWithGemini(prompt);
  try {
    const json = JSON.parse(responseText);
    return json.translatedText || responseText;
  } catch (e) {
    return responseText;
  }
}

/** [ Fix] Aliasing getGemini to getAI for automationService compatibility */
export const getAI = getGemini;
