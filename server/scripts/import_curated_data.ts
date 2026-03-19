import { db } from "../db";
import { cities, landmarks } from "../../shared/schema";
import { sql } from "drizzle-orm";

/**
 * 🦸‍♂️ [The Avengers Team | 2026-03-20] NoWiFi GPS Tours: 콘텐츠 원정대
 * 🎭 [Story Teller Lee] "지루한 명소 설명은 가라! 이야기가 살아있는 가이드를 구축합니다."
 * 🎖️ [Dodari Manager] "어벤져스 팀 전체 출동! 데이터 무결성과 정밀도를 보장하라."
 */

async function importAvengersMission() {
    console.log("🚀 [Avengers Team] NoWiFi GPS Tours 다국어 스토리텔링 임포트 미션 시작!");

    const country = "Korea";

    // 1. 기항지 도시 데이터
    const cityEntries = [
        { id: "seoul", name: "Seoul", country, lat: 37.5665, lng: 126.9780, zoom: 12 },
        { id: "busan", name: "Busan", country, lat: 35.1796, lng: 129.0756, zoom: 12 },
        { id: "jeju", name: "Jeju", country, lat: 33.4996, lng: 126.5312, zoom: 11 },
        { id: "gyeongju", name: "Gyeongju", country, lat: 35.8562, lng: 129.2248, zoom: 13 },
        { id: "suwon", name: "Suwon", country, lat: 37.2636, lng: 127.0286, zoom: 13 },
        { id: "chuncheon", name: "Chuncheon", country, lat: 37.8813, lng: 127.7298, zoom: 13 },
        { id: "suncheon", name: "Suncheon", country, lat: 34.9506, lng: 127.4872, zoom: 13 },
        { id: "gochang", name: "Gochang", country, lat: 35.4358, lng: 126.7021, zoom: 13 },
    ];

    for (const city of cityEntries) {
        try {
            await db.insert(cities).values(city).onConflictDoUpdate({
                target: cities.id,
                set: {
                    name: city.name,
                    lat: city.lat,
                    lng: city.lng,
                    zoom: city.zoom
                }
            });
        } catch (e) {
            console.error(`❌ City [${city.id}] Error:`, e);
        }
    }

    // 2. 스토리텔러 Lee의 명소 데이터
    const masterData = [
        {
            id: "kr-seoul-gyeongbokgung", cityId: "seoul", name: "Gyeongbokgung Palace", lat: 37.580467, lng: 126.976944, radius: 300, category: "Landmark",
            narration: "The crown jewel of Joseon.",
            translations: {
                ko: { name: "경복궁", narration: "조선 왕조의 위엄이 서린 경복궁입니다. 수문장 교대식을 선두로 왕실의 화려한 비밀을 엿보세요.", description: "조선의 법궁" },
                en: { name: "Gyeongbokgung Palace", narration: "Welcome to the heart of Korean history. Experience the Royal Guard Changing Ceremony!", description: "The Grand Main Palace" },
                "zh-CN": { name: "景福宫", narration: "欢迎来到景福宫！这里是首尔最大、最古老的皇家宫殿，穿上韩服在勤政殿前打卡，仿佛穿越回朝鲜时代。", description: "朝鲜时代最重要的宫殿" }
            }
        },
        {
            id: "kr-seoul-bukchon", cityId: "seoul", name: "Bukchon Hanok Village", lat: 37.5826, lng: 126.9830, radius: 200, category: "Landmark",
            narration: "600 years of living history.",
            translations: {
                ko: { name: "북촌한옥마을", narration: "600년 역사가 살아 숨 쉬는 한옥 사이를 걸어보세요. 빌딩 숲과 대비되는 한옥의 지붕 능선이 백미입니다.", description: "전통 한옥 주거지" },
                en: { name: "Bukchon Hanok Village", narration: "Experience the living history in 600-year-old Hanoks.", description: "Historic Residential Area" },
                "zh-CN": { name: "北村韩屋村", narration: "漫步在拥有600年历史的传统巷弄中。这里可以拍到传统韩屋与现代摩天大楼重叠的绝美画面。", description: "首尔保存最完好的古村落" }
            }
        },
        {
            id: "kr-seoul-myeongdong", cityId: "seoul", name: "Myeongdong Street", lat: 37.5636, lng: 126.9840, radius: 200, category: "Shop",
            narration: "Seoul's vibrant heartbeat.",
            translations: {
                ko: { name: "명동 쇼핑 거리", narration: "길거리 음식의 천국, 명동에 오신 것을 환영합니다! 랍스터 구이부터 떡볶이까지 맛보세요.", description: "대한민국 쇼핑 1번지" },
                en: { name: "Myeongdong Shopping Street", narration: "Lobster skewers, tteokbokki, and all the K-Beauty brands you love!", description: "Famous shopping district" },
                "zh-CN": { name: "明洞购物街", narration: "走在明洞，空气中都是诱人的食物香气。龙虾串、旋风土豆，还有各种K-Beauty品牌，快来打卡！", description: "首尔必去的街头美食与购物中心" }
            }
        },
        {
            id: "kr-busan-haeundae", cityId: "busan", name: "Haeundae Beach", lat: 35.1587, lng: 129.1604, radius: 500, category: "Landmark",
            narration: "The Blue Heart of Busan.",
            translations: {
                ko: { name: "해운대 해수욕장", narration: "부산을 대표하는 해변, 해운대입니다. 아름다운 바다와 마천루가 이루는 절경을 감상하세요.", description: "대한민국 대표 해변" },
                en: { name: "Haeundae Beach", narration: "Welcome to Haeundae, Busan's most famous beach. Enjoy the dynamic vibe and endless horizon.", description: "Premier Beach Destination" },
                "zh-CN": { name: "海云台海水浴场", narration: "釜山的骄傲——海云台！在这里吹着海风，看着摩天大楼与大海完美契合，感受釜山的热情。", description: "釜山最具代表性的海滨胜地" }
            }
        },
        {
            id: "kr-jeju-seongsan", cityId: "jeju", name: "Seongsan Ilchulbong", lat: 33.4581, lng: 126.9426, radius: 500, category: "Landmark",
            narration: "The Sun's First Kiss on Jeju.",
            translations: {
                ko: { name: "성산일출봉", narration: "유네스코 세계자연유산의 웅장함을 직접 등반하며 체감해보세요. 정상에서 보는 경관이 일품입니다.", description: "제주 일출 성지" },
                en: { name: "Seongsan Ilchulbong", narration: "A magnificent volcanic crater rising from the ocean. Hike to the top for a breathtaking view!", description: "Sunrise Peak (UNESCO)" },
                "zh-CN": { name: "城山日出峰", narration: "大自然的神奇造化！攀登这座像巨蛋一样的火山丘，站在峰顶，海天一色的美景尽收眼底。", description: "世界自然遗产，日出名所" }
            }
        }
    ];

    console.log("📍 명소 스토리텔링 데이터를 순차 업데이트 중...");
    for (const entry of masterData) {
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
                    category: entry.category
                }
            });
            console.log(`✅ [Story OK] ${entry.name}`);
        } catch (e) {
            console.error(`❌ [Failed] ${entry.id}:`, e);
        }
    }

    console.log("🏁 [Avengers Team] 모든 스토리텔링 임포트 미션 완료!");
    process.exit(0);
}

importAvengersMission().catch(err => {
    console.error("🔥 [Critical Failure]:", err);
    process.exit(1);
});
