import { db } from '../db';
import { landmarks } from '../../shared/schema';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// OpenAI API settings
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BATCH_SIZE = 5;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function upgradeNarration(lm: any) {
    let focusInstructions = '';

    if (lm.category === 'restaurant' || lm.category === 'cafe') {
        focusInstructions = `
[식당/카페 전용 작성 가이드]
1. 분량: 오디오 가이드로 들었을 때 약 2~3분 길이(약 500~700자)
2. 도입부 스토리텔링: 이 식당/카페의 숨겨진 역사, 독특한 분위기, 혹은 관련된 재미있는 비하인드 스토리를 유머러스하게 약 400~500자로 꽉 채워 설명하세요.
3. 원픽 메뉴:
   - ⭐ 무조건 여기서 먹어야 하는 이유 (원픽 메뉴): 왜 이 메뉴를 먹어야 하는지 재미난 이유(예: 눈치 게임, 홈쇼핑 매치 등 특유의 분위기)와 함께 구체적인 메뉴 이름(현지어 및 한국어)을 추천하세요.
   - 해당 메뉴의 식감, 곁들일 음료(선택이 아닌 생존 필수템 등)를 생생하게 묘사하세요.
`;
    } else if (lm.category === 'activity') {
        focusInstructions = `
[액티비티/투어 전용 작성 가이드]
1. 분량: 오디오 가이드로 들었을 때 약 2~3분 길이(약 500~700자)
2. 도입부 스토리텔링: 이 액티비티/장소가 생기게 된 배경, 역사적 폭망 스토리 혹은 기상천외한 비하인드 스토리를 유머러스하게 약 400~500자로 꽉 채워 설명하세요.
3. 원픽 관전 포인트:
   - ⭐ 꼭 여기서 투어를 해야 하는 이유 (원픽 액티비티 관전 포인트): 단순히 눈으로 보는 걸 넘어, 직접 어떤 행동을 해야 하는지(예: 특정 벤치에 앉기, 특정 각도로 사진 찍기 등) 그 당위성과 재미를 강력 추천하세요.
`;
    } else if (lm.category === 'shopping') {
        focusInstructions = `
[쇼핑/기념품 샵 전용 작성 가이드]
1. 분량: 오디오 가이드로 들었을 때 약 2~3분 길이(약 500~700자)
2. 도입부 스토리텔링: 이 매장의 역사(예: 수십 년 이어진 명가), 철학, 현지인들의 재미있는 일상 활용법을 약 400~500자로 꽉 채워 설명하세요.
3. 원픽 쇼핑템:
   - ⭐ 꼭 사야 하는 이유 (원픽 쇼핑템): 흔한 엽서 자석 대신 무조건 캐리어 빈자리에 쑤셔 넣어야 할 필수 아이템과 그 이유(예: 가성비 생색내기 템, 마법 같은 효능 등)를 재미있게 추천하며 지갑 오픈의 당위성을 부여하세요.
`;
    } else {
        // Default Landmark
        focusInstructions = `
[일반 랜드마크 전용 작성 가이드]
1. 분량: 오디오 가이드로 들었을 때 약 3분 이상 길이(약 600~800자)
2. 도입부 역사 스토리텔링: 인물(건축가 등)의 기행, 공사 비하인드, 얽힌 재미있는 역사적 에피소드 등을 아주 유머러스하고 생생하게 약 500자 분량으로 꽉 채워서 몰입감을 극대화하세요. 
3. 필수 클리어 미션 3가지 (각각 왜 해야만 하는지 재치있는 당위성 부여):
   - 🍽️ 꼭 먹어야 할 것: 랜드마크 근처 로컬 맛집이나 간식과 그 묘사
   - 🎭 꼭 즐겨야 할 것: 특정 뷰포인트, 감상 방법, 디테일
   - 🛍️ 꼭 사야 할 것: 흔한 물건 대신 그 장소와 관련된 특별한 굿즈와 구매후 효과 묘사
4. 🌟 [One-Pick] 인생샷 시크릿 스팟:
   - 사람들이 흔히 찍는 곳 말고 남들이 모르는 각도, 장소, 시간대 등 최고의 사진을 건질 수 있는 아주 구체적인 스팟과 방법 하나를 팁으로 추가하세요.
`;
    }

    const prompt = `
당신은 세계 최고의 여행 스토리텔러 가이드 'Story Teller Lee(에피소드 마스터)'입니다.
다음은 랜드마크/액티비티/식당/쇼핑 정보입니다.
도시: ${lm.cityId}
이름: ${lm.name}
카테고리: ${lm.category}

[기존 설명 베이스]
${lm.narration || lm.description || "정보가 거의 없다면 해당 명소의 역사와 최신 특징을 스스로 웹/사전 지식 기반으로 대폭 보강하여 풍부하게 작성할 것"}

[추가 요청 사항]
1. 위 기존 내용을 바탕으로 "지금 이곳에 서 있는 것처럼", "말하듯 자연스러운" 대화체 가이드 톤으로 완벽하게 창작하세요.
${focusInstructions}
5. 딱딱한 정보 나열식 설명은 절대 금지합니다. "짜잔! 여러분...", "고개를 한껏 젖혀 위를 보세요!" 같은 역동적이고 유머러스한 어투를 적극 활용하세요.

응답 형식은 다른 인사말 없이 오직 '내레이션 본문' 만 마크다운 형태로 텍스트 출력하세요. (JSON 사용 안함)
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
        });

        return response.choices[0].message.content?.trim() || null;
    } catch (error: any) {
        console.log(`\n  [WARN] OpenAI API Error for ${lm.name}: ${error.message}`);
        return null;
    }
}

async function run() {
    console.log('==================================================');
    console.log('🎙️ [진행상황 보고] Story Teller Lee - 전체 348개 내레이션 대규모 업그레이드 시작 🎙️');
    console.log('==================================================');
    console.log('목표: 생동감 있는 스토리텔링 + 꼭 먹어야/즐겨야/사야 할 로컬 팁 의무 반영\n');

    const allLandmarks = await db.query.landmarks.findMany();
    console.log(`총 ${allLandmarks.length}개의 랜드마크 데이터를 가져왔습니다. 변환을 시작합니다...\n`);

    let successCount = 0;

    // To avoid hitting rate limits easily, we process sequentially with a small delay
    for (let i = 0; i < allLandmarks.length; i++) {
        const lm = allLandmarks[i];

        // Check if already upgraded to avoid double billing just in case
        if (lm.narration && lm.narration.includes('🍽️')) {
            console.log(`[${i + 1}/${allLandmarks.length}] ${lm.name} - 이미 업그레이드 됨. (Skip)`);
            continue;
        }

        process.stdout.write(`[${i + 1}/${allLandmarks.length}] ${lm.name} 업그레이드 중... `);

        const upgradedText = await upgradeNarration(lm);

        if (upgradedText) {
            await db.update(landmarks)
                .set({
                    narration: upgradedText,
                    updatedAt: new Date()
                })
                .where(eq(landmarks.id, lm.id));

            successCount++;
            console.log('✅ 완료');
        } else {
            console.log('❌ 실패');
        }

        // Brief 500ms delay between requests
        await delay(500);

        // Periodically sync every 50 to avoid big loss
        if (successCount % 50 === 0 && successCount > 0) {
            console.log(`\n--- [중간 저장] ${successCount}개 변환 완료. 하드코딩 DB 임시 동기화 실행 ---`);
            await import('./sync-neon-to-hardcode.js').catch(() => null);
            console.log('--- 동기화 완료 ---\n');
        }
    }

    console.log('\n==================================================');
    console.log(`🎉 [진행상황 보고] 내레이션 업그레이드 최종 완료! (${successCount}/${allLandmarks.length} 성공)`);
    console.log('==================================================');

    console.log('최종 Neon DB -> Hardcode DB 동기화를 시작합니다...');
    await import('./sync-neon-to-hardcode.js').catch(() => null);

    process.exit(0);
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
