import OpenAI from "openai";
import { Landmark } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Using gpt-4o for high-quality AI recommendations
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Available OpenAI TTS voices with descriptions
export const TTS_VOICES = {
  alloy: { name: 'Alloy', description: '중성적이고 균형잡힌 목소리', style: 'neutral' },
  echo: { name: 'Echo', description: '남성적이고 깊은 목소리', style: 'deep' },
  fable: { name: 'Fable', description: '재밌고 표현력 풍부한 스토리텔러', style: 'storyteller' },
  onyx: { name: 'Onyx', description: '권위있고 깊은 목소리', style: 'authoritative' },
  nova: { name: 'Nova', description: '부드럽고 따뜻한 여성 목소리', style: 'warm' },
  shimmer: { name: 'Shimmer', description: '밝고 친근한 여성 목소리', style: 'friendly' },
};

// Voice style presets
export const VOICE_STYLES = {
  guide: 'alloy',      // 🎙️ 투어 가이드 - 차분한 설명
  storyteller: 'fable', // 🎭 스토리텔러 - 재밌고 생동감 있는
  friendly: 'shimmer', // 😊 친근한 - 밝고 따뜻한
  professional: 'onyx', // 📰 전문적 - 명확한 전달
};

// Default voice mappings for different languages (can be overridden by user preference)
const DEFAULT_VOICE_MAP: { [key: string]: string } = {
  'en': 'fable',      // Expressive storyteller voice
  'ko': 'nova',       // Soft, natural voice good for Korean
  'es': 'shimmer',    // Warm voice for Spanish
  'fr': 'fable',      // Expressive French voice
  'de': 'onyx',       // Clear German voice
  'it': 'shimmer',    // Warm Italian voice
  'zh': 'nova',       // Soft Chinese voice
  'ja': 'alloy',      // Neutral Japanese voice
  'pt': 'shimmer',    // Warm Portuguese voice
  'ru': 'onyx',       // Deep Russian voice
};

export interface AudioGenerationResult {
  audioUrl: string;
  duration: number;
  sizeBytes: number;
  checksum: string;
  voiceId: string;
}

// Generate MP3 audio using OpenAI TTS
export async function generateLandmarkAudio(
  landmarkId: string,
  text: string,
  language: string = 'en',
  preferredVoice?: string  // Optional: user can specify voice (alloy, echo, fable, onyx, nova, shimmer)
): Promise<AudioGenerationResult> {
  try {
    // Select voice: user preference > language default > fallback
    const voice = preferredVoice && TTS_VOICES[preferredVoice as keyof typeof TTS_VOICES] 
      ? preferredVoice 
      : (DEFAULT_VOICE_MAP[language] || 'fable');
    
    // Generate audio using OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",  // Use tts-1 for speed, tts-1-hd for quality
      voice: voice as any,
      input: text,
      response_format: "mp3",
      speed: 1.0
    });

    // Get audio buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    
    // Calculate checksum
    const checksum = crypto.createHash('md5').update(buffer).digest('hex');
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'audio');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file with unique name
    const fileName = `${landmarkId}-${language}-${checksum.slice(0, 8)}.mp3`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    // Estimate duration (rough estimate: ~150 chars per second for speech)
    const duration = Math.ceil(text.length / 15); // seconds
    
    return {
      audioUrl: `/uploads/audio/${fileName}`,
      duration,
      sizeBytes: buffer.length,
      checksum,
      voiceId: voice
    };
  } catch (error: any) {
    console.error('Failed to generate audio:', error);
    
    if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
      throw new Error('Audio generation rate limit exceeded. Please try again later.');
    }
    
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      throw new Error('Audio service authentication failed.');
    }
    
    throw new Error('Failed to generate audio');
  }
}

export interface TourRecommendation {
  itinerary: Array<{
    landmarkId: string;
    order: number;
  }>;
  explanation: string;
  totalEstimatedTime: number; // in minutes
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
      ? `다음 관광지들을 기반으로 최적의 투어 일정을 추천해주세요. 지리적 위치, 카테고리, 역사적 중요도를 고려하여 효율적인 순서를 제안하세요.

관광지 목록:
${JSON.stringify(landmarkInfo, null, 2)}

${userPosition ? `사용자 현재 위치: 위도 ${userPosition.latitude}, 경도 ${userPosition.longitude}` : ''}

응답은 반드시 다음 JSON 형식으로 해주세요:
{
  "itinerary": [{"landmarkId": "string", "order": number}],
  "explanation": "왜 이 순서를 추천하는지 자세한 설명 (3-5문장)",
  "totalEstimatedTime": number (분 단위)
}`
      : `Based on the following tourist attractions, recommend the best tour itinerary. Consider geographical proximity, category variety, and historical significance to suggest an efficient order.

Landmark list:
${JSON.stringify(landmarkInfo, null, 2)}

${userPosition ? `User current location: latitude ${userPosition.latitude}, longitude ${userPosition.longitude}` : ''}

Respond in this exact JSON format:
{
  "itinerary": [{"landmarkId": "string", "order": number}],
  "explanation": "Detailed explanation of why you recommend this order (3-5 sentences)",
  "totalEstimatedTime": number (in minutes)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      itinerary: result.itinerary || [],
      explanation: result.explanation || "",
      totalEstimatedTime: result.totalEstimatedTime || 180
    };
  } catch (error: any) {
    console.error('Failed to get AI recommendation:', error);
    
    // Check for specific OpenAI errors
    if (error?.status === 429 || error?.code === 'rate_limit_exceeded' || error?.code === 'insufficient_quota') {
      throw new Error('AI service quota exceeded. Please try again later.');
    }
    
    if (error?.status === 401 || error?.code === 'invalid_api_key') {
      throw new Error('AI service authentication failed.');
    }
    
    throw new Error('Failed to generate tour recommendation');
  }
}
