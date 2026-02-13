import { GoogleGenAI } from "@google/genai";
import { Landmark } from "@shared/schema";

// Using user's own Gemini API key for Gemini Pro
// Using user's own Gemini API key for Gemini Pro
// The @google/genai library might try to use ADC if not configured correctly.
// We are using the API key from AI Studio, so we set it explicitly.
// Lazy initialization to ensure env vars are loaded
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will use mock data.");
      return null;
    }
    console.log("Initializing Gemini AI with provided API key...");
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

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

    const ai = getAI();
    if (!ai) {
      throw new Error('AI client not initialized (missing API key)');
    }

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

export interface CityInfo {
  name: string;
  country: string;
  lat: number;
  lng: number;
  zoom: number;
}

export async function generateCityInfo(
  query: string,
  language: string = 'ko'
): Promise<CityInfo> {
  const ai = getAI();

  // Fallback to mock if AI is explicitly unavailable or key is missing
  if (!ai) {
    console.warn("[Gemini] API Client not ready. Switching to mock mode.");
    return mockGenerateCityInfo(query);
  }

  try {
    const prompt = language === 'ko'
      ? `도시 '${query}'에 대한 정보를 분석하여 다음 JSON 형식으로 응답해주세요.
         - name: 도시의 공식 명칭 (한국어 권장, 없으면 현지어)
         - country: 해당 국가 명칭 (한국어)
         - lat: 위도 (숫자)
         - lng: 경도 (숫자)
         - zoom: 지도 초기 표시를 위한 적절한 줌 레벨 (보통 10~13 사이, 대도시는 11, 소도시는 13)

         응답 형식 (JSON만):
         {
           "name": "string",
           "country": "string",
           "lat": number,
           "lng": number,
           "zoom": number
         }`
      : `Analyze the city '${query}' and provide the following information in JSON format:
         - name: Official name of the city
         - country: Country name
         - lat: Latitude (number)
         - lng: Longitude (number)
         - zoom: Optimal map zoom level (usually 10-13)

         Response Format (JSON ONLY):
         {
           "name": "string",
           "country": "string",
           "lat": number,
           "lng": number,
           "zoom": number
         }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text || "";

    // Extract JSON from response
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    const result = JSON.parse(jsonStr);

    return {
      name: result.name || query,
      country: result.country || "",
      lat: result.lat || 0,
      lng: result.lng || 0,
      zoom: result.zoom || 12
    };
  } catch (error: any) {
    console.error('Failed to generate city info:', error);
    // Even on API error, try mock fallback if it's a critical failure
    return mockGenerateCityInfo(query);
  }
}

// Mock Data Generator for verification and offline usage
function mockGenerateCityInfo(query: string): CityInfo {
  const q = query.toLowerCase();

  // Pre-defined mock data for common queries
  if (q.includes('pusan') || q.includes('busan') || q.includes('부산')) {
    return { name: "부산광역시", country: "대한민국", lat: 35.1796, lng: 129.0756, zoom: 11 };
  }
  if (q.includes('seoul') || q.includes('서울')) {
    return { name: "서울특별시", country: "대한민국", lat: 37.5665, lng: 126.9780, zoom: 11 };
  }
  if (q.includes('jeju') || q.includes('제주')) {
    return { name: "제주특별자치도", country: "대한민국", lat: 33.4996, lng: 126.5312, zoom: 10 };
  }
  if (q.includes('paris') || q.includes('파리')) {
    return { name: "파리", country: "프랑스", lat: 48.8566, lng: 2.3522, zoom: 12 };
  }
  if (q.includes('london') || q.includes('런던')) {
    return { name: "런던", country: "영국", lat: 51.5074, lng: -0.1278, zoom: 11 };
  }
  if (q.includes('rome') || q.includes('roma') || q.includes('로마')) {
    return { name: "로마", country: "이탈리아", lat: 41.9028, lng: 12.4964, zoom: 12 };
  }
  if (q.includes('barcelona') || q.includes('바르셀로나')) {
    return { name: "바르셀로나", country: "스페인", lat: 41.3851, lng: 2.1734, zoom: 12 };
  }
  if (q.includes('tokyo') || q.includes('도쿄')) {
    return { name: "도쿄", country: "일본", lat: 35.6762, lng: 139.6503, zoom: 11 };
  }
  if (q.includes('osaka') || q.includes('오사카')) {
    return { name: "오사카", country: "일본", lat: 34.6937, lng: 135.5023, zoom: 12 };
  }
  if (q.includes('fukuoka') || q.includes('후쿠오카')) {
    return { name: "후쿠오카", country: "일본", lat: 33.5904, lng: 130.4017, zoom: 12 };
  }
  if (q.includes('danang') || q.includes('다낭')) {
    return { name: "다낭", country: "베트남", lat: 16.0544, lng: 108.2022, zoom: 12 };
  }

  // Generic fallback if city is unknown
  return {
    name: query,
    country: "Unknown Country (Mock)",
    lat: 37.5665, // Default to Seoul
    lng: 126.9780,
    zoom: 12
  };
}
