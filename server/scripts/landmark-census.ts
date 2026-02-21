//랜드마크 전체 이미지 개수 조사
// [학습 권고: 데이터 정교화의 기초 - Query Master]
// 1. 전수 조사: DB에 등록된 모든 데이터를 하나도 빠뜨리지 않고 검사합니다.
// 2. 상태 분류: 사진 개수에 따라 0개, 1~4개, 5개 이상으로 카테고리를 나누어 현황을 파악합니다.
// 3. 타겟 식별: 리뉴얼이 시급한 대상(사진 5장 미만)을 식별하여 자동화 작업의 입력값으로 활용합니다.

import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function runCensus() {
    console.log("🔍 [Query Master] Neon DB 랜드마크 전수 조사를 시작합니다...");

    try {
        // [적요] 전체 데이터 로드: Drizzle ORM을 사용하여 landmarks 테이블의 모든 레코드를 가져옵니다.
        const allLandmarks = await db.select().from(landmarksTable);
        const totalCount = allLandmarks.length;

        console.log(`📊 DB 내 전체 랜드마크 수: ${totalCount}`);

        // [적요] 통계 오브젝트: 상태별 카운트를 저장하기 위한 변수입니다.
        const stats = {
            zero: 0,
            oneToFour: 0,
            fivePlus: 0,
            nullOrEmpty: 0
        };

        const lackPrompts: any[] = [];

        // [적요] 순회 검사: 각 랜드마크를 돌며 photos 배열의 길이를 체크합니다.
        for (const l of allLandmarks) {
            const photoCount = Array.isArray(l.photos) ? l.photos.length : 0;

            if (!l.photos || photoCount === 0) {
                stats.nullOrEmpty++;
                stats.zero++;
                lackPrompts.push({ id: l.id, name: l.name, count: 0 });
            } else if (photoCount < 5) {
                stats.oneToFour++;
                lackPrompts.push({ id: l.id, name: l.name, count: photoCount });
            } else {
                stats.fivePlus++;
            }
        }

        // [적요] 결과 보고: 콘솔에 최종 통계를 출력하여 관리자가 상황을 한눈에 보게 합니다.
        console.log("\n📈 상세 통계:");
        console.log(`- 사진 0장: ${stats.zero}개`);
        console.log(`- 사진 1~4장: ${stats.oneToFour}개`);
        console.log(`- 사진 5장 이상 (양호): ${stats.fivePlus}개`);

        console.log(`\n🎯 리뉴얼 작업 대상 (5장 미만): ${stats.zero + stats.oneToFour}개`);

        // [적요] 샘플링: 조사 결과 중 상위 10개를 표 형식으로 보여주어 데이터 유효성을 검증합니다.
        console.log("\n📋 작업 대상 샘플 (상위 10개):");
        console.table(lackPrompts.slice(0, 10));

    } catch (error) {
        console.error("❌ 조사 실패:", error);
    }
}

runCensus().then(() => process.exit(0));
