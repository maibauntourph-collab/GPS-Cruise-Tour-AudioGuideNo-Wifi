import "dotenv/config";
import { db } from "../db";
import { landmarks } from "@shared/schema";
import { isNotNull } from "drizzle-orm";
import fs from "fs";

async function checkNarrationCompleteness() {
    console.log("🔍 Scanning 348 landmarks for missing narration requirements...");

    const allLandmarks = await db.select().from(landmarks).where(isNotNull(landmarks.narration));

    const missingDetails = [];

    for (const lm of allLandmarks) {
        const text = lm.narration || "";

        // 점검할 키워드들 (업데이트된 프롬프트 기준)
        const hasToilet = text.includes("화장실") || text.includes("Toilet");
        const hasIndoorPick = text.includes("실내 원픽") || text.includes("실내");
        const hasOutdoorPick = text.includes("실외 원픽") || text.includes("실외");

        // 이외에도 "먹거리", "맛집", "사야 할 것", "선물", "쇼핑" 등의 키워드가 있는지 확인
        const hasShopping = text.includes("사야") || text.includes("쇼핑") || text.includes("선물") || text.includes("굿즈");
        const hasFood = text.includes("먹어야") || text.includes("맛집") || text.includes("식당") || text.includes("간식");

        // 싱가포르 특정 키워드 누락 확인 (싱가포르 범주에 속하는 랜드마크일 경우 더욱 엄격하게)
        // 현재는 국가 정보가 명확하지 않으므로, 범용적으로 필수 큐레이션 단어 유무로 판별

        let missingReasons = [];
        if (!hasToilet) missingReasons.push("화장실 꿀팁 결여");
        if (!hasIndoorPick || !hasOutdoorPick) missingReasons.push("실내/실외 듀얼 원픽 구분 모호");
        if (!hasShopping) missingReasons.push("쇼핑/선물 정보 결여");
        if (!hasFood) missingReasons.push("식당/먹거리 정보 결여");

        if (missingReasons.length > 0) {
            missingDetails.push({
                id: lm.id,
                name: lm.name,
                missing: missingReasons
            });
        }
    }

    console.log(`\n📋 검사 결과: 총 ${allLandmarks.length}개 중 ${missingDetails.length}개 랜드마크에서 필수 정보 누락 발견!`);

    if (missingDetails.length > 0) {
        console.log("일부 누락 랜드마크 목록 (최대 20개):");
        missingDetails.slice(0, 20).forEach(m => {
            console.log(`- [${m.name}] : ${m.missing.join(", ")}`);
        });

        // 파일로 전체 목록 저장해두기
        fs.writeFileSync('.missing_narrations.json', JSON.stringify(missingDetails, null, 2));
        console.log(`\n전체 누락 목록은 '.missing_narrations.json' 파일에 저장되었습니다.`);
    }

    process.exit(0);
}

checkNarrationCompleteness().catch(console.error);
