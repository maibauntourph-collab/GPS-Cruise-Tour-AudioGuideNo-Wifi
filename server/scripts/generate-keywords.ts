import { db } from '../db';
import { landmarks } from '../../shared/schema';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function generateKeywords(lm: any) {
    const prompt = `
당신은 세계 최고의 여행 플랫폼 검색 엔진 최적화(SEO) 전문가이자 마케팅 전략가입니다.
현재 사용자가 OTA(온라인 여행사) 플랫폼에서 특정 지명을 검색할 때 겪는 '검색 결과 없음' 문제를 해결하기 위해, 
특정 랜드마크에 대해 '의도 기반(Intent-based) 롱테일 키워드' 20개를 생성해야 합니다.

랜드마크 정보:
- 이름: ${lm.name}
- 도시 ID: ${lm.cityId}
- 카테고리: ${lm.category}
- 기본 설명: ${lm.narration?.substring(0, 300) || lm.description?.substring(0, 300) || "전문 정보 없음"}

[키워드 생성 가이드라인]
1. 사용자가 궁금해할 법한 '질문형' 키워드 (예: "에펠탑 명당 어디인가요?")
2. 아주 세부적인 '하이퍼 로컬' 지명 (예: "성당 뒤쪽 비밀 정원")
3. 해당 장소와 관련된 '문화/역사적 키워드' (예: "나폴레옹이 사랑한 카페")
4. 흔한 '오타' 및 '외래어 표기법' (예: "루브르", "루브레", "Louvre")
5. 크루즈 여행객 특화 키워드 (예: "기항지에서 10분 거리 명소")

위 가이드라인을 바탕으로 ${lm.name}에 최적화된 키워드 20개를 쉼표(,)로 구분된 리스트 형식으로만 출력하세요. 
설명은 필요 없습니다. 오직 키워드 리스트만 출력하세요.
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "당신은 SEO 및 키워드 추출 전문가입니다. 결과는 쉼표로 구분된 단어/문장 리스트로만 응답합니다." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
        });

        const content = response.choices[0].message.content?.trim() || "";
        return content.split(',').map(s => s.trim()).filter(s => s.length > 0);
    } catch (error: any) {
        console.log(`\n  [WARN] OpenAI API Error for ${lm.name}: ${error.message}`);
        return null;
    }
}

async function run() {
    console.log('==================================================');
    console.log('🤖 [Automation Doctor] AI 기반 롱테일 키워드 생성 및 DB 주입 시작');
    console.log('==================================================');

    // Fetch landmarks
    const allLandmarks = await db.query.landmarks.findMany();
    console.log(`총 ${allLandmarks.length}개의 랜드마크를 발견했습니다.`);

    let successCount = 0;

    // Process only first 5 as a trial to prevent over-token usage in one go, or all if preferred.
    // Let's do all but with a clear log.
    for (let i = 0; i < allLandmarks.length; i++) {
        const lm = allLandmarks[i];

        // Skip if keywords already exist to save tokens
        if (lm.searchKeywords && lm.searchKeywords.length >= 10) {
            console.log(`[${i + 1}/${allLandmarks.length}] ${lm.name} - (Skip) 이미 키워드 존재.`);
            continue;
        }

        process.stdout.write(`[${i + 1}/${allLandmarks.length}] ${lm.name} 키워드 생성 중... `);

        const keywords = await generateKeywords(lm);

        if (keywords && keywords.length > 0) {
            await db.update(landmarks)
                .set({
                    searchKeywords: keywords,
                    updatedAt: new Date()
                })
                .where(eq(landmarks.id, lm.id));

            successCount++;
            console.log(`✅ 완료 (${keywords.length}개)`);
        } else {
            console.log('❌ 실패');
        }

        await delay(300); // Rate limit friendly
    }

    console.log('\n==================================================');
    console.log(`🎉 작업 완료! 총 ${successCount}개의 랜드마크 키워드가 업데이트되었습니다.`);
    console.log('==================================================');
    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
