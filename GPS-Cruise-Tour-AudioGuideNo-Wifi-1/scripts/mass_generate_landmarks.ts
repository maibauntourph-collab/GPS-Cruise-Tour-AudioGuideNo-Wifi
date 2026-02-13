import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

const targetCities = [
    { id: 'seoul', name: '서울특별시' },
    { id: 'tokyo', name: '도쿄' },
    { id: 'london', name: '런던' },
    { id: 'rome', name: '로마' },
    { id: 'paris', name: '파리' },
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

    console.log("🚀 Starting Massive Content Expansion with Quota Management...");

    let totalGenerated = 0;

    for (const city of targetCities) {
        console.log(`📡 Discovering content for ${city.name} (${city.id})...`);

        const prompt = `
      당신은 전 세계를 여행하는 전문 가이드이자 스토리텔러입니다.
      '${city.name}' 도시에 대해 다음 4가지 카테고리의 장소를 각각 3~4개씩(총 12~15개) 추천해주세요.
      1. Landmark (역사적 명소, 유적지)
      2. Activity (할 일, 체험, 액티비티)
      3. Restaurant (식당, 카페)
      4. Shopping (기념품샵, 시장, 쇼핑몰)

      각 장소에 대해 반드시 다음 정보를 포함해야 합니다:
      - name: 장소 이름 (한국어)
      - category: 위의 4가지 중 하나 (Landmark, Activity, Restaurant, Shopping)
      - lat: 위도 (숫자)
      - lng: 경도 (숫자)
      - narration: 해당 장소에 얽힌 '재미있고 흥미진진한' 정교한 스토리. 반드시 **한국어 400자 이상**으로 작성할 것. (청취자가 그 장소에 서 있는 것처럼 생생하게 묘사하세요)
      - description: 한 줄 요약 (한국어)
      - detailed_description: 장소에 대한 상세 정보 (한국어)
      - image_prompt: 이 장소를 가장 잘 나타내는 고해상도 풍경 사진을 위한 영어 프롬프트.

      결과는 반드시 JSON 형식으로만 응답하세요:
      {
        "landmarks": [
          {
            "name": "장소명",
            "category": "Landmark",
            "lat": 0.0,
            "lng": 0.0,
            "narration": "400자 이상의 생생한 이야기...",
            "description": "한 줄 요약",
            "detailed_description": "상세한 정보",
            "image_prompt": "English image prompt"
          }
        ]
      }
    `;

        let success = false;
        let retries = 0;
        const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

        while (!success && retries < 2) {
            try {
                const modelName = models[retries];
                console.log(`  Trying with model: ${modelName}...`);

                const result = await (ai as any).models.generateContent({
                    model: modelName,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                });

                const text = result.text || "";
                let jsonStr = text.replace(/```json|```/g, "").trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) jsonStr = jsonMatch[0];

                const data = JSON.parse(jsonStr);

                console.log(`  ✅ Received ${data.landmarks.length} items.`);

                for (const item of data.landmarks) {
                    const id = `${city.id}_${item.name.toLowerCase().replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, '_').slice(0, 30)}_${Math.floor(Math.random() * 1000)}`;

                    await client.query(`
            INSERT INTO landmarks (
              id, city_id, name, lat, lng, radius, narration, description, category,
              detailed_description, photos, translations
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO NOTHING
          `, [
                        id, city.id, item.name, item.lat, item.lng, 50, item.narration,
                        item.description, item.category, item.detailed_description,
                        JSON.stringify([`https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000`]),
                        JSON.stringify({ ko: { name: item.name, description: item.description, narration: item.narration } })
                    ]);
                    totalGenerated++;
                }
                success = true;
            } catch (err: any) {
                if (err.status === 429) {
                    console.warn(`  🔴 Rate limit hit. Waiting 20s before retry...`);
                    await delay(20000);
                    retries++;
                } else {
                    console.error(`  ❌ Critical Error:`, err.message);
                    break;
                }
            }
        }

        // Add a small delay between cities to respect free tier RPM
        await delay(5000);
    }

    console.log(`✨ DONE! Successfully generated and synced ${totalGenerated} items.`);
    await client.end();
}

massGenerate();
