import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../shared/schema";
import { env } from "../env";
import { autoTranslateLandmark } from "../lib/autoTranslate";

if (!env.NOWIFIGPSTOURS) {
    console.error("Missing NOWIFIGPSTOURS. Aborting.");
    process.exit(1);
}

const sql = neon(env.NOWIFIGPSTOURS);
const db = drizzle(sql, { schema });

/**
 * [교수님 노트] 지능형 재시도 함수
 * API 호출 실패 시 지수 백오프(Exponential Backoff)를 사용하여 재시도합니다.
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
): Promise<T> {
    let delay = initialDelay;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            if (i === maxRetries - 1) throw error;
            console.warn(`[Retry] Failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            delay *= 2; // 지수 증가
        }
    }
    throw new Error("Max retries reached");
}

async function run() {
    console.log("🚀 [Bulk Translate] Fetching all landmarks from Neon DB...");
    const allLandmarks = await db.select().from(schema.landmarks);
    console.log(`📊 Found ${allLandmarks.length} landmarks. Starting 24-language translation...`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < allLandmarks.length; i++) {
        const l = allLandmarks[i];

        // [적요] 이미 24개 언어 번역이 있고 narrationI18n 컬럼도 채워져 있다면 스킵
        const hasFullTranslations = l.translations && Object.keys(l.translations as any).length >= 24;
        const hasI18nColumns = l.narrationI18n && Object.keys(l.narrationI18n as any).length >= 5;

        if (hasFullTranslations && hasI18nColumns) {
            console.log(`[${i + 1}/${allLandmarks.length}] ⏭️ Skipping ${l.name} - Already fully translated.`);
            skipCount++;
            continue;
        }

        console.log(`[${i + 1}/${allLandmarks.length}] 🌐 Translating "${l.name}"...`);
        try {
            await retryWithBackoff(async () => {
                await autoTranslateLandmark(l.id, {
                    name: l.name,
                    narration: l.narration || "",
                    description: l.description,
                    detailedDescription: l.detailedDescription
                });
            });
            successCount++;
            // [교수님 노트] API 부하 조절을 위한 골든 타임 (3초 휴식)
            await new Promise(r => setTimeout(r, 3000));
        } catch (e: any) {
            console.error(`[${i + 1}/${allLandmarks.length}] ❌ Error translating ${l.name}:`, e?.message);
            failCount++;
        }
    }

    console.log("\n✨ [Bulk Translate] Process Completed!");
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️ Skipped: ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    process.exit(0);
}

run();
