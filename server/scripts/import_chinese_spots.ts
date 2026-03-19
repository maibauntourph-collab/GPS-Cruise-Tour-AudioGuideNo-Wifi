import { db } from "../db";
import { cities, landmarks } from "../../shared/schema";
import { sql } from "drizzle-orm";

/**
 * 🦸‍♂️ [The Avengers Team | 2026-03-20] Phase 3: 중국인 관광객 콘텐츠 원정대
 * 🎭 [Story Teller Lee] "MZ세대의 성지, 성수동부터 런던베이글까지! 생생한 이야기를 담았습니다."
 * 🇨🇳 [Marketer Song] "샤오홍슈(Xiaohongshu) 트렌드 분석 기반 데이터 리스트업 완료."
 */

async function importChineseSpots() {
    console.log("🚀 [Avengers Team] Phase 3: 중국인 관광객 특화 콘텐츠 임포트 미션 시작!");

    const country = "Korea";

    // 1. 신규/업데이트 명소 데이터
    const chineseSpots = [
        {
            id: "kr-seoul-seongsu", cityId: "seoul", name: "Seongsu-dong (Brooklyn of Seoul)", lat: 37.5445, lng: 127.0560, radius: 400, category: "Landmark",
            narration: "The hippest place in Seoul right now.",
            translations: {
                ko: { name: "성수동 (서울의 브루클린)", narration: "지금 서울에서 가장 힙한 성수동입니다. 붉은 벽돌 공장들이 세련된 카페와 팝업스토어로 변신한 풍경을 즐겨보세요.", description: "MZ세대의 핫플레이스" },
                en: { name: "Seongsu-dong", narration: "Welcome to the Brooklyn of Seoul. Explore trendy pop-up stores and unique cafes in renovated factories.", description: "The Trendiest District" },
                "zh-CN": { name: "圣水洞 (首尔的布鲁克林)", narration: "欢迎来到首尔最火的圣水洞！这里曾是老旧工厂区，现在变身为全首尔最顶尖的快闪店和咖啡馆聚集地。简直是拍照圣地！", description: "首尔潮流中心，网红打卡地" }
            }
        },
        {
            id: "kr-seoul-myeongdong-gyoja", cityId: "seoul", name: "Myeongdong Kyoja", lat: 37.5625, lng: 126.9855, radius: 100, category: "Restaurant",
            narration: "A Michelin-starred noodle experience.",
            translations: {
                ko: { name: "명동교자", narration: "명동의 살아있는 전설, 명동교자입니다. 진한 닭 육수의 칼국수와 알싸한 마늘 김치의 환상적인 조화를 맛보세요.", description: "미쉐린 가이드 칼국수 맛집" },
                en: { name: "Myeongdong Kyoja", narration: "A legend in Myeongdong. Don't miss their signature Kalguksu (noodle soup) and famous garlic kimchi!", description: "Michelin Guide Restaurant" },
                "zh-CN": { name: "明洞饺子", narration: "如果您没吃过明洞饺子，就不算来过明洞！那碗浓缩了鸡汤精华的刀切面，配上招牌蒜蓉泡菜，绝对让您回味无穷。", description: "米其林指南推荐，刀切面名店" }
            }
        },
        {
            id: "kr-seoul-london-bagel", cityId: "seoul", name: "London Bagel Museum", lat: 37.5793, lng: 126.9845, radius: 100, category: "Restaurant",
            narration: "The most famous bagel spot in Korea.",
            translations: {
                ko: { name: "런던 베이글 뮤지엄", narration: "극악의 웨이팅으로 유명한 런던 베이글 뮤지엄입니다. 쫀득한 베이글과 유럽풍 인테리어로 샤오홍슈에서 가장 핫한 곳이죠.", description: "SNS 화제의 베이글 맛집" },
                en: { name: "London Bagel Museum", narration: "The most talked-about bagel shop in Seoul. Enjoy the chewy bagels and British-inspired vibe.", description: "Viral Bagel Spot" },
                "zh-CN": { name: "伦敦贝果博物馆", narration: "小红书上排队排到怀疑人生的贝果店！虽然人多，但那口Q弹的贝果和超好拍的欧洲复古装潢，绝对值得您来一趟。", description: "超高人气贝果店，网红必去" }
            }
        },
        {
            id: "kr-seoul-gwangjang-market", cityId: "seoul", name: "Gwangjang Market", lat: 37.5701, lng: 126.9996, radius: 200, category: "Restaurant",
            narration: "A street food paradise.",
            translations: {
                ko: { name: "광장시장", narration: "100년 전통의 먹거리 장터입니다. 육회, 마약김밥, 빈대떡까지 한국의 활기찬 시장 문화를 오감으로 체험해보세요.", description: "전통 시장 먹거리 투어" },
                en: { name: "Gwangjang Market", narration: "A 100-year-old traditional market. Try the famous mung bean pancakes and beef tartare!", description: "Historic Street Food Market" },
                "zh-CN": { name: "广藏市场", narration: "体验最地道的韩国市井生活。这里的生拌牛肉、麻药紫菜包饭和绿豆饼是必吃三件套。快在热闹的摊位前坐下吧！", description: "韩国最古老的传统市场" }
            }
        },
        {
            id: "kr-seoul-lotte-world", cityId: "seoul", name: "Lotte World", lat: 37.5112, lng: 127.1001, radius: 500, category: "Landmark",
            narration: "Magic in the heart of the city.",
            translations: {
                ko: { name: "롯데월드", narration: "도심 속 테마파크 롯데월드입니다. 교복을 대여해 입고 매직 아일랜드 성 앞에서 인생샷을 남기는 것이 필수 코스입니다.", description: "도심형 테마파크" },
                en: { name: "Lotte World", narration: "An indoor/outdoor theme park in central Seoul. Rent a school uniform for the full local experience!", description: "Urban Theme Park" },
                "zh-CN": { name: "乐天世界", narration: "在城市中心的奇幻乐园！推荐租一套韩国校服，在魔幻岛城堡前拍一张像电影一样的照片。室内和室外都非常好玩。", description: "世界上最大的室内主题公园之一" }
            }
        },
        {
            id: "kr-global-olive-young", cityId: "seoul", name: "Olive Young Myeongdong Flagship", lat: 37.5645, lng: 126.9850, radius: 100, category: "Shop",
            narration: "K-Beauty sanctuary.",
            translations: {
                ko: { name: "올리브영 명동 플래그십", narration: "K-뷰티의 모든 것이 이곳에 있습니다. 외국인 관광객에게 가장 인기 있는 쇼핑 성지에서 최신 뷰티 템을 획득하세요.", description: "K-뷰티 쇼핑 1번지" },
                en: { name: "Olive Young", narration: "Your one-stop shop for all things K-Beauty. Find the latest trends and best-sellers here.", description: "Leading Health & Beauty Store" },
                "zh-CN": { name: "欧利芙洋 (Olive Young)", narration: "来到韩国怎么能不逛欧利芙洋？这里汇集了最新、最全的韩国保养品和彩妆。注意：您的钱包可能会在这里“受伤”哦！", description: "韩国NO.1美妆集合店" }
            }
        },
        {
            id: "kr-seoul-the-hyundai", cityId: "seoul", name: "The Hyundai Seoul", lat: 37.5259, lng: 126.9284, radius: 300, category: "Shop",
            narration: "The future of shopping.",
            translations: {
                ko: { name: "더현대 서울", narration: "여의도의 새로운 랜드마크, 더현대 서울입니다. 거대한 실내 정원과 세련된 인테리어로 쇼핑 그 이상의 휴식을 선사합니다.", description: "미래형 백화점" },
                en: { name: "The Hyundai Seoul", narration: "Seoul's largest and trendiest department store. Relax in the massive indoor forest, Sounds Forest.", description: "Lifestyles & Cultural Landmark" },
                "zh-CN": { name: "现代百货首尔 (The Hyundai Seoul)", narration: "首尔最新、最大的概念百货店。顶层的室内森林“声音花园”简直太美了。这里也是首尔潮流快闪店的聚集地。", description: "首尔最美百货店， 여의도地标" }
            }
        }
    ];

    console.log("📍 Phase 3 중국인 특화 명소 데이터를 업데이트 중...");
    for (const entry of chineseSpots) {
        try {
            await db.insert(landmarks).values({
                id: entry.id,
                cityId: entry.cityId,
                name: entry.name,
                lat: entry.lat,
                lng: entry.lng,
                radius: entry.radius,
                narration: entry.narration,
                category: entry.category,
                translations: entry.translations,
            }).onConflictDoUpdate({
                target: landmarks.id,
                set: {
                    name: entry.name,
                    narration: entry.narration,
                    translations: entry.translations,
                    category: entry.category,
                    lat: entry.lat,
                    lng: entry.lng,
                    radius: entry.radius
                }
            });
            console.log(`✅ [Phase 3 OK] ${entry.name}`);
        } catch (e) {
            console.error(`❌ [Failed] ${entry.id}:`, e);
        }
    }

    console.log("🏁 [Avengers Team] Phase 3 특화 콘텐츠 임포트 미션 완료!");
    process.exit(0);
}

importChineseSpots().catch(err => {
    console.error("🔥 [Critical Failure]:", err);
    process.exit(1);
});
