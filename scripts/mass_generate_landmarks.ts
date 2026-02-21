import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from "@google/genai";
import pg from 'pg';

const dbUrl = process.env.NOWIFIGPSTOURS;
const geminiApiKey = process.env.GEMINI_API_KEY;

const targetCities = [
    { id: 'jeju', name: '제주특별자치도' },
    { id: 'new-york', name: '뉴욕' },
    { id: 'tokyo', name: '도쿄' },
    { id: 'busan', name: '부산광역시' },
    { id: 'seoul', name: '서울특별시' }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function massGenerate() {
    if (!geminiApiKey) {
        console.error("GEMINI_API_KEY missing");
        process.exit(1);
    }
    if (!dbUrl) {
        console.error("NOWIFIGPSTOURS missing");
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
당신은 전 세계의 숨겨진 보석을 발굴하는 '월드 클래스 럭셔리 트래블 큐레이터'이자 '역사 스토리텔러'입니다.
'${city.name}'의 명소, 식당, 액티비티를 기획하되, 아래의 **V3 프리미엄 규격**을 엄격히 준수하세요.

### 🎯 V3 생성 원칙
1. **명확한 지명 (Precise Naming)**:
   - 'Premium Landmark 1' 같은 성의 없는 이름은 절대 금지합니다.
   - 실제 존재하는 지명 중 사용자에게 가장 매력적으로 다가갈 수 있는 명확한 명칭을 사용하세요. (예: '경복궁 근정전', '도쿄 타워 스카이 데크')

2. **심도 있는 스토리텔링 (Deep Narrative)**:
   - detailed_description: 최소 400자 이상. 역사적 팩트에 '재미있는 뒷이야기'나 '현지인만 아는 꿀팁'을 버무려 읽는 재미를 극대화하세요.
   - narration: 최소 500자 이상. 사용자의 오감을 자극하는 표현(냄새, 소리, 빛의 각도 등)을 사용하여 영화 같은 오디오 가이드를 만드세요.

3. **나노바나나 스타일 이미지 (5+ Photos)**:
   - 각 장소당 **5장 이상의 서로 다른 이미지**를 기획하세요.
   - photos: Nano Banana 스타일 (Hyper-realistic, 8k, Cinematic lighting, Architectural precision, Vibrant colors)을 반영한 영어 이미지 생성 프롬프트 5개를 리스트로 작성하세요.

4. **실질적인 정보**:
   - reservation_url: 식당이나 유료 액티비티인 경우, 공식 예약 사이트나 플랫폼(OpenTable, TheFork, Klook 등)의 실제 링크 형식을 제공하세요. 없으면 null.

결과는 반드시 JSON 형식으로만 응답하세요:
{
  "landmarks": [
    {
      "name": "장소의 고유하고 명확한 명칭",
      "category": "Landmark | Restaurant | Activity | Shopping",
      "lat": 0.0,
      "lng": 0.0,
      "description": "사용자를 매료시키는 강렬한 한 줄 서사",
      "detailed_description": "400자 이상의 프리미엄 가이드 콘텐츠",
      "narration": "500자 이상의 몰입형 오디오 가이드 스크립트",
      "photos": [
        "Photo 1: Wide exterior (Nanobanana style prompt)",
        "Photo 2: Interior atmosphere",
        "Photo 3: Special detail",
        "Photo 4: Night view",
        "Photo 5: Street context"
      ],
      "reservation_url": "URL 또는 null",
      "price_range": "가격대 (예: €50 - €100)",
      "opening_hours": "영약시간 (예: 매일 09:00 - 22:00)"
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

                console.log(`  ✅ Received ${data.landmarks.length} V3 Premium items for ${city.id}.`);

                for (const item of data.landmarks) {
                    const sanitizedId = item.name.toLowerCase().replace(/[^\w\s가-힣]/g, '').replace(/\s+/g, '_').slice(0, 30);
                    const id = `${city.id}_${sanitizedId}`;

                    // In a real scenario, we would use these prompts to generate images.
                    // For now, we store them as photo URLs or placeholders that look premium.
                    const photos = item.photos && Array.isArray(item.photos)
                        ? item.photos.map((p: string, i: number) => `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000&sig=${id}_${i}`)
                        : [`https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000&sig=${id}`];

                    await client.query(`
            INSERT INTO landmarks (
              id, city_id, name, lat, lng, radius, narration, description, category,
              detailed_description, photos, reservation_url, opening_hours, price_range, translations
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (id) DO UPDATE SET
              narration = EXCLUDED.narration,
              description = EXCLUDED.description,
              detailed_description = EXCLUDED.detailed_description,
              photos = EXCLUDED.photos,
              reservation_url = EXCLUDED.reservation_url,
              opening_hours = EXCLUDED.opening_hours,
              price_range = EXCLUDED.price_range,
              translations = EXCLUDED.translations,
              updated_at = NOW()
          `, [
                        id, city.id, item.name, item.lat, item.lng, 75, item.narration,
                        item.description, item.category, item.detailed_description,
                        JSON.stringify(photos), item.reservation_url,
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

