
import dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
import { db } from "../db";
import { landmarks as landmarksTable } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";

// Initialize OpenAI
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
    console.error("❌ OPENAI_API_KEY is missing. Cannot generate photos.");
    process.exit(1);
}
const openai = new OpenAI({ apiKey });

const GENERATED_DIR = path.join(process.cwd(), "client", "public", "images", "generated");

async function downloadImage(url: string, filepath: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    if (!res.body) throw new Error("No body in response");

    const fileStream = fs.createWriteStream(filepath);
    // @ts-ignore - native fetch body is a readable stream in Node 18+
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function enhancePhotos() {
    console.log("📸 Designer Kim started photo enhancement session... (DALL-E 3)");

    // Ensure directory exists
    if (!fs.existsSync(GENERATED_DIR)) {
        fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    // 1. Find landmarks with empty photos array or null

    // Postgres specific: check for empty JSON array or null
    const targets = await db.select().from(landmarksTable).where(
        sql`json_array_length(${landmarksTable.photos}) = 0 OR ${landmarksTable.photos} IS NULL`
    );

    console.log(`🎯 Found ${targets.length} landmarks needing photos.`);

    // Process a limited number to control costs/time (e.g., first 5 for test, or all if user wants)
    // For now, let's do all but strictly sequentially.
    let successCount = 0;

    for (const landmark of targets) {
        console.log(`\nProcessing: ${landmark.name} (${landmark.id})...`);

        try {
            // Prompt Engineering (Designer Kim Style)
            const prompt = `A breathtaking, premium photo of ${landmark.name}, ${landmark.description?.substring(0, 50) || "historic landmark"}, high quality, 8k resolution, Nanobanana style, vibrant colors, cinematic lighting, photorealistic, travel photography masterpiece.`;

            console.log(`   🎨 Generating image...`);

            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard", // "hd" is more expensive
                response_format: "url",
            });

            const imageUrl = response.data[0].url;
            if (!imageUrl) throw new Error("No image URL returned");

            const filename = `${landmark.id}_${Date.now()}.jpg`;
            const localPath = path.join(GENERATED_DIR, filename);
            const dbPath = `/images/generated/${filename}`;

            console.log(`   ⬇️ Downloading to ${localPath}...`);
            await downloadImage(imageUrl, localPath);

            // Update DB
            await db.update(landmarksTable)
                .set({
                    photos: [dbPath], // Set as the first photo
                    updatedAt: new Date()
                })
                .where(eq(landmarksTable.id, landmark.id));

            console.log(`   ✅ Saved & Updated: ${dbPath}`);
            successCount++;

        } catch (error: any) {
            if (error?.status === 429) {
                console.error("❌ Quota exceeded or Rate limit hit.");
                break; // Stop loop on rate limit
            }
            console.error(`   ❌ Failed to generate/save photo for ${landmark.name}:`, error.message);
        }

        // Rate limit / Cost control delay
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log(`\n✨ Photo Enhancement Session Complete. Success: ${successCount} / ${targets.length}`);
}

enhancePhotos().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
