import { GoogleGenAI } from "@google/genai";
import { Landmark } from "@shared/schema";

// Using user's own Gemini API key for Gemini Pro
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface TourRecommendation {
  itinerary: Array<{
    landmarkId: string;
    order: number;
  }>;
  explanation: string;
  totalEstimatedTime: number;
}

export async function recommendTourItinerary(
  landmarks: Landmark[],
  userPosition?: { latitude: number; longitude: number },
  language: string = 'en'
): Promise<TourRecommendation> {
  try {
    const landmarkInfo = landmarks.map(l => ({
      id: l.id,
      name: l.name,
      category: l.category,
      lat: l.lat,
      lng: l.lng,
      description: l.description
    }));

    const systemPrompt = language === 'ko' 
      ? "당신은 여행 전문가입니다. 주어진 관광지 정보를 분석하여 최적의 투어 일정을 추천하세요."
      : language === 'es'
      ? "Eres un experto en viajes. Analiza los lugares turísticos dados y recomienda el mejor itinerario de tour."
      : language === 'fr'
      ? "Vous êtes un expert en voyages. Analysez les lieux touristiques donnés et recommandez le meilleur itinéraire de visite."
      : language === 'de'
      ? "Sie sind ein Reiseexperte. Analysieren Sie die gegebenen Sehenswürdigkeiten und empfehlen Sie die beste Reiseroute."
      : language === 'it'
      ? "Sei un esperto di viaggi. Analizza i luoghi turistici dati e consiglia il miglior itinerario di tour."
      : language === 'zh'
      ? "您是旅行专家。分析给定的旅游景点并推荐最佳旅游行程。"
      : language === 'ja'
      ? "あなたは旅行の専門家です。与えられた観光地情報を分析し、最適なツアー行程を推薦してください。"
      : language === 'pt'
      ? "Você é um especialista em viagens. Analise os pontos turísticos dados e recomende o melhor itinerário de tour."
      : language === 'ru'
      ? "Вы эксперт по путешествиям. Проанализируйте данные туристические места и порекомендуйте лучший маршрут тура."
      : "You are a travel expert. Analyze the given tourist attractions and recommend the best tour itinerary.";

    const userPrompt = language === 'ko'
      ? `${systemPrompt}

다음 관광지들을 기반으로 최적의 투어 일정을 추천해주세요. 지리적 위치, 카테고리, 역사적 중요도를 고려하여 효율적인 순서를 제안하세요.

관광지 목록:
${JSON.stringify(landmarkInfo, null, 2)}

${userPosition ? `사용자 현재 위치: 위도 ${userPosition.latitude}, 경도 ${userPosition.longitude}` : ''}

응답은 반드시 다음 JSON 형식으로 해주세요 (다른 텍스트 없이 JSON만):
{
  "itinerary": [{"landmarkId": "string", "order": number}],
  "explanation": "왜 이 순서를 추천하는지 자세한 설명 (3-5문장)",
  "totalEstimatedTime": number (분 단위)
}`
      : `${systemPrompt}

Based on the following tourist attractions, recommend the best tour itinerary. Consider geographical proximity, category variety, and historical significance to suggest an efficient order.

Landmark list:
${JSON.stringify(landmarkInfo, null, 2)}

${userPosition ? `User current location: latitude ${userPosition.latitude}, longitude ${userPosition.longitude}` : ''}

Respond with ONLY this exact JSON format (no other text):
{
  "itinerary": [{"landmarkId": "string", "order": number}],
  "explanation": "Detailed explanation of why you recommend this order (3-5 sentences)",
  "totalEstimatedTime": number (in minutes)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
    });

    const text = response.text || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find JSON object directly
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const result = JSON.parse(jsonStr);
    
    return {
      itinerary: result.itinerary || [],
      explanation: result.explanation || "",
      totalEstimatedTime: result.totalEstimatedTime || 180
    };
  } catch (error: any) {
    console.error('Failed to get Gemini AI recommendation:', error);
    
    if (error?.message?.includes('429') || error?.message?.includes('RATELIMIT')) {
      throw new Error('AI service rate limit exceeded. Please try again later.');
    }
    
    if (error?.message?.includes('401') || error?.message?.includes('authentication')) {
      throw new Error('AI service authentication failed.');
    }
    
    throw new Error('Failed to generate tour recommendation');
  }
}
