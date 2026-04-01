import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";
dotenv.config();

const VIATOR_API_KEY = process.env.VIATOR_API_KEY || ""; // [Security] 하드코딩된 키 제거
console.log('Loaded VIATOR_API_KEY from process.env:', VIATOR_API_KEY ? `${VIATOR_API_KEY.substring(0, 4)}***${VIATOR_API_KEY.substring(VIATOR_API_KEY.length - 4)}` : "MISSING");
const VIATOR_API_URL = "https://api.viator.com/partner/products/search";
const API_DELAY_MS = 500; // Rate limit protection

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchViatorPhotos(query: string): Promise<string[]> {
    try {
        const maskedKey = VIATOR_API_KEY ? `${VIATOR_API_KEY.substring(0, 4)}***${VIATOR_API_KEY.substring(VIATOR_API_KEY.length - 4)}` : "MISSING";
        console.log(`  🔍 [Viator Debug] API Key: ${maskedKey}, Query: ${query}`);
        const requestBody = {
            filtering: { searchText: query },
            pagination: { start: 1, count: 5 },
            currency: "USD"
        };
        console.log(`  🔍 [Viator Debug] Request Body: ${JSON.stringify(requestBody)}`);

        const response = await fetch(VIATOR_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json;version=2.0',
                'Content-Type': 'application/json',
                'exp-api-key': VIATOR_API_KEY,
                'Accept-Language': 'en-US'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`  ❌ [Viator API Error] Status: ${response.status}, Response: ${errorText}`);
            return [];
        }

        const data: any = await response.json();
        const photos: string[] = [];

        if (data.products && data.products.length > 0) {
            data.products.forEach((product: any) => {
                if (product.images && product.images.length > 0) {
                    // 고화질 (1000px 이상) 또는 가장 큰 이미지 선택
                    const img = product.images[0].variants.find((v: any) => v.width >= 1000) || 
                                product.images[0].variants[product.images[0].variants.length - 1];
                    if (img && !photos.includes(img.url) && photos.length < 5) {
                        photos.push(img.url);
                    }
                }
            });
        }
        return photos;
    } catch (error) {
        console.error(`  ⚠️ [Viator API Error] ${query}:`, error);
        return [];
    }
}

async function run() {
    console.log("🚀 [Visual Update] Starting Viator High-Res Photo Update...");
    
    // 1. 모든 랜드마크 가져오기
    const allLandmarks = await db.select().from(landmarks);
    console.log(`📊 Total landmarks to process: ${allLandmarks.length}`);

    let updatedCount = 0;
    let fallbackCount = 0;

    for (let i = 0; i < allLandmarks.length; i++) {
        const lm = allLandmarks[i];
        console.log(`[${i + 1}/${allLandmarks.length}] Processing: ${lm.name} (${lm.id})...`);

        // 2. Viator 사진 검색
        let photos = await fetchViatorPhotos(lm.name);

        // 3. 사진이 없으면 Unsplash 폴백 (기존 스토어 이미지 등 활용 가능)
        if (photos.length === 0) {
            console.log(`  🔸 No Viator photos found. Using high-quality Unsplash fallback...`);
            photos = [
                `https://images.unsplash.com/photo-1541343672885-9be56236302a?w=1200&auto=format&fit=crop`,
                `https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1200&auto=format&fit=crop`,
                `https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=1200&auto=format&fit=crop`
            ];
            fallbackCount++;
        }

        // 4. DB 업데이트
        await db.update(landmarks)
            .set({ 
                photos: photos,
                updatedAt: new Date()
            })
            .where(eq(landmarks.id, lm.id));

        updatedCount++;
        console.log(`  ✅ Updated with ${photos.length} photos.`);

        // API 과부하 방지 지연
        await delay(API_DELAY_MS);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 [Visual Update] Complete!");
    console.log(`✅ Successfully processed: ${updatedCount} landmarks`);
    console.log(`🖼️  Viator Photos used: ${updatedCount - fallbackCount}`);
    console.log(`🎨 Unsplash Fallback used: ${fallbackCount}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
}

run().catch(e => {
    console.error("❌ Global script error:", e);
    process.exit(1);
});
