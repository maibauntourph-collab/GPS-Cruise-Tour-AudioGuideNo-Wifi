import { db } from "../server/db";
import { landmarks } from "../shared/schema";

async function testInsert() {
    console.log("🛠️ [Debug] 단일 랜드마크 인서트 테스트 시작...");

    const testLandmark = {
        id: "test-landmark-1",
        cityId: "seoul",
        name: "Test Palace",
        lat: 37.5,
        lng: 126.9,
        radius: 100,
        category: "Landmark",
        narration: "Test narration",
        translations: {
            ko: { name: "테스트", narration: "테스트 해설", description: "설명" }
        }
    };

    try {
        await db.insert(landmarks).values(testLandmark).onConflictDoUpdate({
            target: landmarks.id,
            set: {
                name: testLandmark.name,
                translations: testLandmark.translations
            }
        });
        console.log("✅ [Success] 단일 인서트 성공!");
    } catch (e: any) {
        console.error("❌ [Fail] 인서트 실패 사유:", JSON.stringify(e, null, 2));
        if (e.message) console.error("Message:", e.message);
        if (e.detail) console.error("Detail:", e.detail);
        if (e.hint) console.error("Hint:", e.hint);
    } finally {
        process.exit(0);
    }
}

testInsert();
