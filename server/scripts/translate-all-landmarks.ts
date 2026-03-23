import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../shared/schema";
import { env } from "../env";
import { autoTranslateLandmark } from "../lib/autoTranslate";

if (!env.NOWIFIGPSTOURS || !env.OPENAI_API_KEY) {
    console.error("Missing NOWIFIGPSTOURS or OPENAI_API_KEY. Aborting.");
    process.exit(1);
}

const sql = neon(env.NOWIFIGPSTOURS);
const db = drizzle(sql, { schema });

async function run() {
    console.log("Fetching all landmarks...");
    const allLandmarks = await db.select().from(schema.landmarks);
    console.log(`Found ${allLandmarks.length} landmarks. Starting translation process...`);

    // To prevent rate limiting and overload, we do this sequentially
    for (let i = 0; i < allLandmarks.length; i++) {
        const l = allLandmarks[i];
        // Check if it already has translations (e.g. at least 5 keys)
        const existingCount = l.translations ? Object.keys(l.translations).length : 0;
        if (existingCount >= 24) {
            console.log(`[${i + 1}/${allLandmarks.length}] Skipping ${l.name} - already has ${existingCount} translations.`);
            continue;
        }

        console.log(`[${i + 1}/${allLandmarks.length}] Translating ${l.name}...`);
        try {
            await autoTranslateLandmark(l.id, {
                name: l.name,
                narration: l.narration || "",
                description: l.description,
                detailedDescription: l.detailedDescription
            });
            // 딜레이 짧게 주어 Rate limit 우회
            await new Promise(r => setTimeout(r, 1500));
        } catch (e: any) {
            console.error(`Error translating ${l.name}:`, e?.message);
        }
    }

    console.log("Translation process completed.");
    process.exit(0);
}

run();
