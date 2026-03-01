import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { env } from "../env";
import * as fs from 'fs';
import * as path from 'path';

// 진행 상태 저장을 위한 파일 경로
const PROGRESS_FILE = path.join(process.cwd(), ".narration_progress.json");

// [적요: 3분 썰 + 화장실 꿀팁 + 듀얼 줌인 원픽 생성용 마스터 시스템 프롬프트]
const SYSTEM_PROMPT = `
당신은 최고의 입담을 자랑하는 현지 여행 가이드이자 스토리텔러 'Story Teller Lee' 이며, 동시에 숨겨진 로컬 맛집과 기프트샵을 찰지게 추천하여 고객의 지갑을 열게 만드는 마케팅 천재 'Marketer Song' 입니다. 
입력받은 [랜드마크 정보]를 바탕으로 관광객이 지루할 틈 없이 오디오 가이드에 3분 이상 몰입할 수 있도록 코믹하고 상세한 스토리텔링 내레이션 대본을 작성해 주세요.

## 📝 텍스트 구조 및 필수 포함 항목
작성할 오디오 내레이션 코드는 반드시 아래의 구조와 조건을 완벽히 충족해야 합니다:

### 1. 도입부: 흥미진진한 3분 썰 (TMI 방출)
- 해당 랜드마크의 뻔한 역사적 사실보다는, 인물(건축가, 왕 등)에 얽힌 코믹한 일화, 황당한 사건, 오해나 비하인드 스토리(TMI)를 위주로 썰을 풀어주세요.
- 여행자가 지금 서 있는 현장에서 눈으로 직접 찾아볼 수 있는 디테일(예: 숨겨진 조각상, 이상한 색깔의 벽)을 콕 찝어 질문하며 유도하세요.
- 길이는 오디오로 읽었을 때 최소 2~3분이 훌쩍 넘어가도록 풍성하게 작성합니다.

### 2. 강력한 '듀얼 원픽' 추천 큐레이션 (먹거리/볼거리/살거리)
- 🍽️ 꼭 먹어야 할 것: ⭐ [실내 원픽] 과 ⭐ [실외 원픽]
- 🎭 꼭 즐겨야 할 것: ⭐ [실내 원픽] 과 ⭐ [실외 원픽]
- 🛍️ 꼭 사야 할 것: ⭐ [실내 원픽] 과 ⭐ [실외 원픽]

### 3. 초정밀 줌인(Zoom-in) 오프라인 길안내
- 각 원픽 아이템 하단에는 "📍 [줌인(Zoom-in) 위치 가이드]"를 명시하며, "정문 등지고 오른쪽으로 엎어지면 코 닿을 거리" 등 아주 디테일하고 코믹한 길안내 지침을 제공해야 합니다.

### 4. 🚽 생존 필수 코스: 화장실 꿀팁 (Toilet Guide)
- 📍 [줌인(Zoom-in) 화장실 위치]: 길을 헤매지 않도록 구체적인 방위 명시
- 🚻 혼잡성 & 쾌적도: 주말 대기 시간 등 코믹 묘사
- 💸 비용 (유로/무료): 동전 필수 유무 등
- 🧻 휴지 준비 유무: 개인 티슈 필수 여부 경고

## 🗣️ 어조와 톤앤매너
- "~입니다", "~하죠?", "~해보세요!" 같은 친근하고 유쾌한 현지인 가이드 말투 사용.
`;

// 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getAI(apiKey?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    return new GoogleGenAI({ apiKey: key });
}

async function generateNarration(ai: GoogleGenAI, lm: any): Promise<string> {
    const userPrompt = `
[랜드마크 정보]
- 이름: ${lm.name}
- 설명: ${lm.description || '정보 없음'}
- 부가정보: ${lm.detailedDescription || '정보 없음'}
- 역사/문화: ${lm.historicalInfo || '정보 없음'}

위 랜드마크 정보를 바탕으로 완벽한 스토리텔링 내레이션을 작성해주세요. (응답은 마크다운 문법을 제외한 순수 텍스트 문자열이나 가벼운 포맷팅만 사용하세요.)
`;

    // Gemini-2.0-flash 모델 호출
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT + "\\n" + userPrompt }] }
        ]
    });

    let text = response.text;
    if (!text && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
    }

    if (!text) {
        throw new Error("AI returned empty response");
    }

    return text;
}

function loadProgress(): Set<string> {
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
            return new Set(JSON.parse(data));
        } catch (e) {
            console.error("Failed to load progress file:", e);
        }
    }
    return new Set();
}

function saveProgress(completedIds: Set<string>) {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedIds)));
}

async function main() {
    const isDryRun = process.argv.includes('--dry-run');
    console.log("==================================================");
    console.log("🎙️ [Automation Doctor] 코믹 내레이션 일괄 업데이트 배치 스크립트 시작");
    console.log(isDryRun ? ">> [DRY-RUN MODE] DB 저장 없이 1개만 테스트 생성합니다." : ">> [EXECUTION MODE] 전체 DB 랜드마크 업데이트 진행");

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY가 없습니다. .env 파일을 확인하세요.");
        process.exit(1);
    }

    const ai = await getAI(apiKey);
    const allLandmarks = await db.select().from(landmarks);

    console.log(`총 ${allLandmarks.length}개의 랜드마크 텍스트 생성 대기 중...`);

    const completedIds = loadProgress();

    for (let i = 0; i < allLandmarks.length; i++) {
        const lm = allLandmarks[i];

        if (!isDryRun && completedIds.has(lm.id)) {
            console.log(`[SKIP] ${i + 1}/${allLandmarks.length} : ${lm.name} (이미 갱신됨)`);
            continue;
        }

        console.log(`\n⏳ [${i + 1}/${allLandmarks.length}] '${lm.name}' 내레이션 생성 중...`);

        try {
            const newNarration = await generateNarration(ai, lm);

            if (isDryRun) {
                console.log("\\n============================================");
                console.log(`[테스트 결과 - ${lm.name}]`);
                console.log("============================================");
                console.log(newNarration.substring(0, 1500) + "...(생략)...");
                console.log("============================================");
                console.log(">> 드라이런 완료!");
                break;
            }

            // DB 업데이트
            await db.update(landmarks)
                .set({ narration: newNarration, updatedAt: new Date() })
                .where(eq(landmarks.id, lm.id));

            completedIds.add(lm.id);
            saveProgress(completedIds);

            console.log(`✅ [${i + 1}/${allLandmarks.length}] 업데이트 성공: ${lm.name}`);

            // 토큰 오버플로우 방지 (딜레이)
            await delay(4000);

        } catch (err: any) {
            console.error(`❌ [${lm.name}] 업데이트 실패:`, err.message);
            await delay(10000); // 에러 시 약간 더 길게 대기
        }
    }

    console.log("\\n🎉 [배치 작업 완료] 텍스트 생성이 끝났습니다!");
    if (!isDryRun && fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE); // 완료 시 프로그래스 삭제
    }
    process.exit(0);
}

main().catch(err => {
    console.error("💥 최상위 예외 발생 (Unhandled Error in main):", err);
    process.exit(1);
});
