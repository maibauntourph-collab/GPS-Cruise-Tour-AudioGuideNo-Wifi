import { db } from "../server/db";
import { landmarks } from "../shared/schema";
import { sql, isNull, or } from "drizzle-orm";
import { autoTranslateLandmark, SUPPORTED_LANGUAGES } from "../server/lib/autoTranslate";

async function main() {
    console.log("🔍 [Query Master] Neon DB 24개국어 번역 상태 점검 시작...");

    try {
        // 1. 번역이 누락된 랜드마크 조회
        const allLandmarks = await db.select().from(landmarks);
        const targetLanguages = Object.keys(SUPPORTED_LANGUAGES);

        const missingTranslations = allLandmarks.filter(l => {
            const i18n = l.narrationI18n as Record<string, string> | null;
            if (!i18n) return true;
            return targetLanguages.some(lang => !i18n[lang]);
        });

        console.log(`📊 점검 결과: 총 ${allLandmarks.length}개 중 ${missingTranslations.length}개의 랜드마크에서 번역 누락 발견.`);

        if (missingTranslations.length === 0) {
            console.log("✅ 모든 랜드마크의 24개국어 번역이 완벽합니다!");
            return;
        }

        // 2. 누락된 항목 보고
        console.log("\n📝 누락된 랜드마크 목록 (샘플):");
        missingTranslations.slice(0, 5).forEach(m => {
            const currentLangs = Object.keys((m.narrationI18n || {}) as object).length;
            console.log(`- [${m.id}] ${m.name} (현재 ${currentLangs}/24 언어 번역됨)`);
        });

        // 3. 번역 작업 재시작 (지수 백오프 적용)
        console.log("\n🚀 [Automation Doctor] 누락된 번역 작업을 재시작합니다 (Gemini 2.0 Flash 사용)...");

        let successCount = 0;
        let failCount = 0;

        for (const landmark of missingTranslations) {
            let retryCount = 0;
            const maxRetries = 5;
            let currentWait = 7000; // Gemini 429 에러 시 최소 6-7초 대기 필요

            while (retryCount < maxRetries) {
                try {
                    process.stdout.write(`⏳ [${successCount + failCount + 1}/${missingTranslations.length}] '${landmark.name}' 번역 시도 중... `);

                    await autoTranslateLandmark(landmark.id, {
                        name: landmark.name,
                        narration: landmark.narration,
                        description: landmark.description,
                        detailedDescription: landmark.detailedDescription
                    });

                    console.log("✅ 완료");
                    successCount++;
                    break; // 다음 랜드마크로
                } catch (error: any) {
                    const errorMsg = error.message.toLowerCase();
                    if (errorMsg.includes('429') || errorMsg.includes('exhausted') || errorMsg.includes('limit')) {
                        retryCount++;
                        if (retryCount < maxRetries) {
                            console.log(`\n⚠️ Rate limit 감지! ${currentWait / 1000}초 대기 후 재시도 (${retryCount}/${maxRetries})...`);
                            await new Promise(resolve => setTimeout(resolve, currentWait));
                            currentWait *= 1.5; // 점진적 증가
                        } else {
                            console.log(`\n❌ 재시도 초과 실패: ${landmark.id}`);
                            failCount++;
                        }
                    } else {
                        console.log(`\n❌ 치명적 오류: ${error.message}`);
                        failCount++;
                        break;
                    }
                }
            }
            // 매 작업 사이 최소한의 쿨타임
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n🎉 모든 작업 종료! (최종 성공: ${successCount}, 최종 실패: ${failCount})`);

    } catch (error: any) {
        console.error("❌ 작업 중 치명적 오류 발생:", error.message);
    }
}

main().catch(console.error);
