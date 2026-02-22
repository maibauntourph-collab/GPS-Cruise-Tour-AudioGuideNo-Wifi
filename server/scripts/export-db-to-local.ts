import "dotenv/config";
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import * as fs from "fs";
import * as path from "path";

async function exportNeonToLocal() {
    console.log("📤 [Query Master] Neon DB -> 로컬 하드코딩 데이터 동기화 시작...");

    try {
        // 1. Neon DB에서 모든 랜드마크 데이터 가져오기
        const allLandmarks = await db.select().from(landmarksTable);
        console.log(`📊 DB에서 ${allLandmarks.length}개의 랜드마크를 로드했습니다.`);

        // 2. 파일 내용 생성
        const filePath = path.join(process.cwd(), "server", "data", "landmarks.ts");

        let content = `import { type Landmark } from "../../shared/schema";\n\n`;
        content += `export const LANDMARKS: Landmark[] = ${JSON.stringify(allLandmarks, null, 2)};\n`;

        // 3. 파일 쓰기 (기존 landmarks.ts 덮어쓰기)
        fs.writeFileSync(filePath, content, "utf8");

        console.log(`\n✅ 동기화 완료! ${filePath}에 데이터가 저장되었습니다.`);
        console.log("🎨 이제 로컬 하드코딩 DB도 Gravity V3 Premium 등급입니다!");

    } catch (error) {
        console.error("❌ 데이터 수출 중 오류 발생:", error);
    }
}

exportNeonToLocal().then(() => process.exit(0)).catch(console.error);
