import { db } from "../db";
import { Landmark, marketingContents, Translations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { openai } from "../lib/openai";

/**
 * [마케터 쏭의 마케팅 특강: AI를 활용한 자동 홍보 시스템]
 * 
 * 안녕 학생 여러분! 이 서비스는 우리 플랫폼의 '자동 홍보 엔진(Dr.'s Engine)'의 심장부야.
 * 관리자가 새로운 명소(Landmark)를 등록하면, 이 코드가 백그라운드에서 실행되어 
 * 자동으로 SNS 포스팅 문구를 만들어준단다.
 * 
 * 핵심 포인트:
 * 1. OpenAI 연동: GPT-4o 모델을 사용하여 인간 마케터보다 더 활기찬 문구를 생성해.
 * 2. 페르소나 설정: '마케터 쏭'이라는 활기차고 세련된 페르소나를 부여해서 브랜드의 일관성을 유지해.
 * 3. 플랫폼별 맞춤화: 네이버 블로그, 인스타그램, 틱톡, 트위터 각각의 성격에 맞는 형식으로 결과물을 만들어내지.
 * 4. JSON 출력: 프로그램이 나중에 처리하기 쉽도록 AI에게 JSON 형식으로 대답하라고 강제하는 기술을 사용했어.
 */
export class AutomationService {
    /**
     * 홍보 콘텐츠 생성 로직
     * @param landmark 등록된 명소 정보 (ID, 이름, 설명, 이미지 등 포함)
     */
    async generatePromotionContent(landmark: Landmark) {
        // 1. 프롬프트 구성 (AI에게 시키는 섬세한 명령서)
        // 인공지능에게 단순히 '글 써줘'라고 하기보다, 구체적인 상황과 정체성을 부여하는 것이 훨씬 퀄리티가 높아!
        const prompt = `
      너는 'Dr.'s Engine'의 수석 마케터 '마케터 쏭'이야.
      아주 활기차고 에너지가 넘치며, 사람들을 당장 여행 떠나고 싶게 만드는 능력이 있어.
      
      새로운 여행 명소가 등록되었으니, 이를 홍보할 4가지 플랫폼용 콘텐츠를 만들어줘.
      명소 이름: ${landmark.name}
      명소 설명: ${landmark.description || ''}
      
      각 플랫폼별 특징:
      1. Naver Blog: 정보 위주로 풍부하게, '내돈내산' 느낌의 친근한 말투
      2. Instagram: 감성 뿜뿜, 이모지 듬뿍, 세련된 해시태그 포함
      3. TikTok: 아주 짧고 강렬한 훅(Hook) 문구 위주
      4. Twitter: 트렌디하고 유머러스하게
      
      결과는 반드시 다음 JSON 형식을 지켜야 해:
      {
        "blog": "콘텐츠 내용",
        "instagram": "콘텐츠 내용",
        "tiktok": "콘텐츠 내용",
        "twitter": "콘텐츠 내용"
      }
    `;

        try {
            console.log(`[Dr.'s Engine] '${landmark.name}' 명소에 대한 홍보 마케팅 캠페인을 시작합니다!`);

            // 2. OpenAI API 호출
            // response_format: { type: "json_object" } 를 사용하면 AI가 항상 객체 형태로만 대답하게 돼. (아주 편리한 기술!)
            if (!openai) {
                console.warn("[Dr.'s Engine] OpenAI가 설정되지 않아 홍보 콘텐츠 생성을 건너뜁니다.");
                return;
            }

            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "너는 창의적이고 활기찬 20대 여성 마케터 '마케터 쏭'이야. 항상 에너제틱하게 대답해!"
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            // 3. 생성된 결과 확인
            const content = response.choices[0].message.content;
            if (content) {
                const result = JSON.parse(content);
                console.log(`[Dr.'s Engine] 마케터 쏭의 창의적인 콘텐츠가 도착했습니다!`, result);

                // [강의 노트] 여기서 생성된 문구를 DB에 저장하거나 실제 SNS API로 쏠 수 있단다. 
                // 지금은 일단 콘솔에 출력해서 확인하는 단계야.
                await this.saveGeneratedContent(landmark.id, result);
            }

        } catch (error) {
            // 오류 처리도 교육적으로! AI 호출 시 API 키가 틀렸거나 네트워크 문제가 생길 수 있어.
            console.error("[Dr.'s Engine] 아차! 마케터 쏭이 글을 쓰는 중에 연필이 부러졌나봐요(OpenAI 오류):", error);
        }
    }

    /**
     * [박사님의 연구 노트: AI 기반 도시 자동 탐사]
     * 특정 도시의 명소를 AI가 스스로 찾아내고, 300자 이상의 재미있는 스토리를 입히는 핵심 기능이야.
     */
    async discoverLandmarks(cityName: string) {
        const prompt = `
      너는 전 세계를 여행하는 전문 가이드이자 스토리텔러야.
      '${cityName}' 도시에 대해 다음 4가지 카테고리의 장소를 각각 적어도 3개씩(총 12개 이상) 추천해줘.
      1. Landmark (역사적 명소, 유적지)
      2. Activity (할 일, 체험, 액티비티)
      3. Restaurant (식당, 카페)
      4. Shopping (쇼핑몰, 시장)

      각 장소에 대해 반드시 다음 정보를 포함해야 해:
      - name: 장소 이름
      - category: 위의 4가지 중 하나
      - lat: 위도 (숫자)
      - lng: 경도 (숫자)
      - narration: 해당 장소에 얽힌 '재미있고 흥미진진한' 스토리. 반드시 **300자 이상**으로 작성할 것. (청취자가 몰입할 수 있도록 생생하게 기술)
      - description: 한 줄 요약
      - detailed_description: 장소에 대한 상세 정보
      - historical_info: 역사적 배경 (Landmark인 경우 특히 중요)

      결과는 반드시 다음 JSON 형식을 지켜야 해:
      {
        "landmarks": [
          {
            "id": "slug-style-id",
            "name": "장소명",
            "category": "Landmark",
            "lat": 0.0,
            "lng": 0.0,
            "narration": "300자 이상의 스토리...",
            "description": "요약",
            "detailedDescription": "상세",
            "historicalInfo": "역사"
          }
        ]
      }
    `;

        try {
            console.log(`[Dr.'s Engine] '${cityName}' 도시에 대한 AI 자동 탐사를 시작합니다...`);

            // OpenAI API 키가 없는 경우 로컬 데모 데이터를 반환합니다.
            if (!process.env.OPENAI_API_KEY) {
                console.warn("[Dr.'s Engine] OPENAI_API_KEY가 설정되지 않았습니다. 데모 데이터를 반환합니다.");
                return this.getMockLandmarks(cityName);
            }

            const response = await openai?.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "너는 최고의 여행 가이드이자 이야기꾼이야. 항상 흥미진진하고 생생한 이야기를 들려줘."
                    },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = response?.choices[0].message.content;
            if (content) {
                return JSON.parse(content).landmarks;
            }
            return [];
        } catch (error) {
            console.error("[Dr.'s Engine] AI 탐사 중 오류 발생, 데모 데이터로 전환합니다:", error);
            return this.getMockLandmarks(cityName);
        }
    }

    /**
     * [박사님의 비밀 가이드] API 키가 없을 때를 대비한 가상 탐사 데이터 생성기란다.
     */
    private getMockLandmarks(cityName: string) {
        return [
            {
                id: `${cityName.toLowerCase()}-demo-1`,
                name: `${cityName}의 숨겨진 보석`,
                category: "Landmark",
                lat: 0.0,
                lng: 0.0,
                narration: "AI API 키가 설정되지 않아 생성된 데모 내레이션입니다. 실제 서비스를 이용하시려면 OPENAI_API_KEY를 설정해주세요. 이 장소는 수천 년의 역사를 간직한 곳으로, 사실 이 글은 박사님이 미리 써둔 샘플이란다. 하지만 UI 구성과 흐름을 테스트하기에는 충분할 거야!",
                description: "로컬 테스트용 데모 장소",
                detailedDescription: "상세 정보가 준비 중입니다.",
                historicalInfo: "데모 데이터입니다."
            },
            {
                id: `${cityName.toLowerCase()}-demo-2`,
                name: `${cityName}의 맛집 골목`,
                category: "Restaurant",
                lat: 0.1,
                lng: 0.1,
                narration: "현지인들만 아는 비밀스러운 맛집들이 모여있는 곳입니다. 데모 모드에서는 AI가 직접 생성한 것처럼 보이지만, 사실 시스템이 제공하는 안전한 테스트 데이터란다. 맛있어 보이는 음식 사진들이 눈앞에 그려지지 않니?",
                description: "로컬 테스트용 맛집 거리",
                detailedDescription: "다양한 현지 음식을 맛볼 수 있습니다.",
                historicalInfo: "역사적 배경이 존재하지 않는 현대식 구역입니다."
            }
        ];
    }

    /**
     * 생성된 콘텐츠를 나중에 쓸 수 있도록 어딘가에 보관하는 함수 (Placeholder)
     */
    private async saveGeneratedContent(landmarkId: string, content: any) {
        try {
            // [회계부장&마케터쏭의 협업] 기존에 이 명소에 대한 문구가 있다면 업데이트하고, 없으면 새로 만듭니다.
            // upsert 로직을 구현하기 위해 먼저 존재 여부를 확인해요.
            const existing = await db.select().from(marketingContents).where(eq(marketingContents.landmarkId, landmarkId)).limit(1);

            if (existing.length > 0) {
                await db.update(marketingContents)
                    .set({ content, updatedAt: new Date() })
                    .where(eq(marketingContents.landmarkId, landmarkId));
                console.log(`[Dr.'s Engine] 명소 ID ${landmarkId}의 홍보 문구가 성공적으로 업데이트되었습니다. (자산 가치 상승!)`);
            } else {
                await db.insert(marketingContents).values({
                    landmarkId,
                    content,
                });
                console.log(`[Dr.'s Engine] 명소 ID ${landmarkId}의 홍보 문구가 신규 자산으로 DB에 등록되었습니다.`);
            }
        } catch (error) {
            console.error("[Dr.'s Engine] DB에 문구를 저장하는 중 오류가 발생했어요:", error);
        }
    }
}

// 싱글톤 패턴으로 서비스를 내보내서 서버 어디서든 똑같은 서비스를 쓸 수 있게 했어.
export const automationService = new AutomationService();
