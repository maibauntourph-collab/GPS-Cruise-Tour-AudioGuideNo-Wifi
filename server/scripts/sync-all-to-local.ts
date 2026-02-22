import "dotenv/config";
import { db } from "../db";
import { landmarks as landmarksTable, cities as citiesTable, type Landmark, type City } from "../../shared/schema";
import * as fs from "fs";
import * as path from "path";

async function syncNeonToLocal() {
    console.log("📤 [Query Master] Neon DB -> 로컬 하드코딩 데이터 통합 동기화 시작...");

    try {
        // 1. Neon DB에서 데이터 가져오기
        const allCities = await db.select().from(citiesTable);
        const allLandmarksRaw = await db.select().from(landmarksTable);

        // 타입 캐스팅
        const allLandmarks = allLandmarksRaw as unknown as Landmark[];

        console.log(`📊 DB 리포트: 도시 ${allCities.length}개, 전체 명소 ${allLandmarks.length}개 로드 완료.`);

        // 2. 데이터 분류 (명소 vs 식당)
        const restaurants = allLandmarks.filter(l => l.category === 'Restaurant');
        const landmarksOnly = allLandmarks.filter(l => l.category !== 'Restaurant');

        console.log(`📍 분류 결과: 일반 명소 ${landmarksOnly.length}개, 식당 ${restaurants.length}개`);

        const dataDir = path.join(process.cwd(), "server", "data");

        // 3. 파일 생성 함수
        const saveToFile = (fileName: string, variableName: string, data: any[], typeName: string) => {
            const filePath = path.join(dataDir, fileName);
            let content = `import { type ${typeName} } from "../../shared/schema";\n\n`;
            content += `export const ${variableName}: ${typeName}[] = ${JSON.stringify(data, null, 2)};\n`;
            fs.writeFileSync(filePath, content, "utf8");
            console.log(`✅ ${fileName} 업데이트 완료 (${data.length} items)`);
        };

        // 4. 각각의 파일 업데이트
        saveToFile("cities.ts", "CITIES", allCities, "City");
        saveToFile("landmarks.ts", "LANDMARKS", landmarksOnly, "Landmark");
        saveToFile("restaurants.ts", "RESTAURANTS", restaurants, "Landmark");

        console.log("\n✨ 모든 데이터가 Neon DB와 완벽하게 동기화되었습니다!");
        console.log("🇮🇹 이탈리아(로마)를 포함한 전 세계 데이터가 로컬 하드코드 DB에 이식되었습니다.");

    } catch (error) {
        console.error("❌ 동기화 중 치명적 오류 발생:", error);
    }
}

syncNeonToLocal().then(() => process.exit(0)).catch(console.error);
