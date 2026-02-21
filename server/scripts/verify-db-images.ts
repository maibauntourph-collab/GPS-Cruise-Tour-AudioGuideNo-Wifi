import { db } from "../db";
import { landmarks } from "../../shared/schema";

async function verifyDbUpdatesSimple() {
    console.log("🔍 Neon DB 데이터 직접 확인 시도 중...");

    try {
        // SQL raw query를 사용하여 스키마 의존성 최소화
        // @ts-ignore
        const result = await db.execute("SELECT id, name, photos FROM landmarks WHERE photos::text ILIKE '%/images/generated/%' LIMIT 5");

        console.log("\n--- [DB Raw Query 결과] ---");
        // @ts-ignore
        if (result.rows && result.rows.length > 0) {
            // @ts-ignore
            result.rows.forEach(row => {
                console.log(`📍 ID: ${row.id} | 이름: ${row.name}`);
                console.log(`   └─ 사진 데이터: ${JSON.stringify(row.photos)}`);
            });
            console.log("\n✅ 생성된 이미지가 DB에 성공적으로 저장된 것을 확인했습니다!");
        } else {
            console.log("❌ '/images/generated/' 경로가 포함된 사진 데이터를 찾을 수 없습니다.");
            console.log("   (아래 명령어로 전체 데이터 개수를 확인해보세요: SELECT count(*) FROM landmarks)");
        }
    } catch (error) {
        console.error("❌ DB raw query 실행 중 오류 발생:", error);
    }
}

verifyDbUpdatesSimple().catch(console.error);
