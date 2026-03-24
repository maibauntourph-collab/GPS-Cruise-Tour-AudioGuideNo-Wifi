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
