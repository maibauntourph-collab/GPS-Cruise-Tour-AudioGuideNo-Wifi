import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

const targetCities = [
    { id: 'barcelona', name: '바르셀로나' },
    { id: 'singapore', name: '싱가포르' },
    { id: 'busan', name: '부산광역시' },
    { id: 'jeju', name: '제주특별자치도' },
    { id: 'new-york', name: '뉴욕' }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function massGenerate() {
    if (!geminiApiKey) {
        console.error("GEMINI_API_KEY missing");
        process.exit(1);
    }
    if (!dbUrl) {
        console.error("DATABASE_URL missing");
        process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    console.log("🚀 Starting Premium Content Expansion with Advanced AI Prompting...");

    let totalGenerated = 0;

    for (const city of targetCities) {
        console.log(`📡 Discovering premium content for ${city.name} (${city.id})...`);

        const prompt = `
당신은 전 세계의 숨겨진 보석을 찾아내는 '럭셔리 트래블 큐레이터'이자 '역사 스토리텔러'입니다.
'${city.name}' 도시의 명소, 식당, 액티비티를 기획해주세요.

### 🎯 생성 가이드라인
1. **깊이 있는 설명 (300자 이상)**:
   - detailed_description: 단순 정보가 아닌, 그 장소의 분위기, 방문해야 하는 이유, 숨겨진 팁을 포함하여 최소 300자 이상의 매력적인 문장으로 작성하세요.
   - narration: 사용자가 현장에서 듣는 오디오 가이드입니다. 400자 이상의 생생한 현장감(소리, 냄새, 전설 등)을 담으세요.

2. **정확한 이미지 매칭**:
   - image_prompt: 고해상도 풍경 사진을 위한 정교한 영어 프롬프트를 작성하세요. (예: "Cinematic drone view of Colosseum during sunset, high detail, 8k")

3. **실질적인 정보**:
   - reservation_url: 식당이나 유료 액티비티인 경우, 공식 예약 사이트나 플랫폼(OpenTable, TheFork, Klook 등)의 링크 형식을 제공하세요. 없으면 null.

결과는 반드시 JSON 형식으로만 응답하세요:
{
  "landmarks": [
    {
      "name": "장소의 정확한 명칭",
      "category": "Landmark | Restaurant | Activity | Shopping",
      "lat": 0.0,
      "lng": 0.0,
      "description": "강렬한 한 줄 요약",
      "detailed_description": "300자 이상의 상세 설명",
      "narration": "400자 이상의 오디오 가이드 스크립트",
      "reservation_url": "URL 또는 null",
      "price_range": "가격대 (예: €€)",
      "opening_hours": "영업시간 정보",
      "image_prompt": "Specific English prompt"
    }
  ]
}
        `;

        let success = false;
        let retries = 0;
        const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

        while (!success && retries < 5) {
            try {
                const modelName = models[retries % models.length];
                console.log(`  Trying with model: ${modelName} (Attempt ${retries + 1})...`);

                const result = await (ai as any).models.generateContent({
                    model: modelName,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                });

                const contentText = result.text || "";
                if (!contentText) {
                    console.error("  ⚠️ Empty response from AI. Retrying...");
                    retries++;
                    continue;
                }

                let jsonStr = contentText.replace(/```json|```/g, "").trim();
                const jsonMatch = contentText.match(/\{[\s\S]*\}/);
                if (jsonMatch) jsonStr = jsonMatch[0];

                const data = JSON.parse(jsonStr);

                if (!data.landmarks || !Array.isArray(data.landmarks)) {
                    console.error("  ⚠️ Invalid JSON structure. Retrying...");
                    retries++;
                    continue;
                }

                console.log(`  ✅ Received ${data.landmarks.length} premium items for ${city.id}.`);

                for (const item of data.landmarks) {
                    // Generate ID based on name for consistency (allowing updates)
                    const sanitizedName = item.name.toLowerCase().replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, '_').slice(0, 30);
                    const id = `${city.id}_${sanitizedName}`;

                    // Photos: Use a slightly more descriptive Unsplash URL or at least tag it
                    const photoUrl = `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000&sig=${id}`;

                    await client.query(`
            INSERT INTO landmarks (
              id, city_id, name, lat, lng, radius, narration, description, category,
              detailed_description, photos, reservation_url, opening_hours, price_range, translations
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              narration = EXCLUDED.narration,
              description = EXCLUDED.description,
              detailed_description = EXCLUDED.detailed_description,
              reservation_url = EXCLUDED.reservation_url,
              opening_hours = EXCLUDED.opening_hours,
              price_range = EXCLUDED.price_range,
              translations = EXCLUDED.translations,
              updated_at = NOW()
          `, [
                        id, city.id, item.name, item.lat, item.lng, 70, item.narration,
                        item.description, item.category, item.detailed_description,
                        JSON.stringify([photoUrl]), item.reservation_url,
                        item.opening_hours, item.price_range,
                        JSON.stringify({
                            ko: {
                                name: item.name,
                                description: item.description,
                                narration: item.narration,
                                detailedDescription: item.detailed_description
                            }
                        })
                    ]);
                    totalGenerated++;
                }
                success = true;
            } catch (err: any) {
                const errMsg = err.message || "";
                if (errMsg.includes("429") || errMsg.includes("quota")) {
                    console.warn(`  🔴 Rate limit hit for ${city.id}. Waiting 60s before retry...`);
                    await delay(60000);
                    retries++;
                } else {
                    console.error(`  ❌ Error processing ${city.id}:`, errMsg);
                    retries++;
                    await delay(10000);
                }
            }
        }
        await delay(5000);
    }

    console.log(`✨ DONE! Successfully generated/updated ${totalGenerated} premium items.`);
    await client.end();
}

massGenerate();

