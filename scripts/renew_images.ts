
import * as fs from 'fs';
import * as path from 'path';
import { generateImage } from '../server/lib/openai';

// Config
const PLAN_PATH = path.join(process.cwd(), 'docs', 'image_renewal_plan.md');
const STORAGE_PATH = path.join(process.cwd(), 'server', 'storage.ts');
const IMAGES_DIR = path.join(process.cwd(), 'client', 'public', 'images', 'landmarks');
const BATCH_SIZE = 20; // Increased to cover manual batch
const DRY_RUN = false; // Set to false to actually run

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

async function main() {
    console.log("Starting image renewal automation...");

    if (!fs.existsSync(PLAN_PATH)) {
        console.error("Plan file not found:", PLAN_PATH);
        process.exit(1);
    }

    const planContent = fs.readFileSync(PLAN_PATH, 'utf-8');
    const lines = planContent.split('\n');

    // Parse plan
    // Format: | ID | City | Name | Status | Prompt |
    // Status: [ ] or [x]

    const pendingItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.startsWith('|')) continue;

        const parts = line.split('|').map(s => s.trim());
        if (parts.length < 6) continue;

        // parts[0] is empty (before first |)
        const id = parts[1];
        const status = parts[4];
        const prompt = parts[5];

        if (status === '[ ]' && id !== 'ID' && !id.includes('---')) {
            pendingItems.push({ index: i, id, prompt, line });
        }
    }

    console.log(`Found ${pendingItems.length} pending items.`);

    // Process batch
    const batch = pendingItems.slice(0, BATCH_SIZE);
    console.log(`Processing batch of ${batch.length}...`);

    for (const item of batch) {
        console.log(`Processing: ${item.id}`);

        const imageFilename = `${item.id}.png`;
        const imagePath = path.join(IMAGES_DIR, imageFilename);
        const publicUrl = `/images/landmarks/${imageFilename}`;

        // 1. Generate Image (Skip if file exists for testing manual copies)
        if (fs.existsSync(imagePath)) {
            console.log(`  Image already exists at ${imagePath}, skipping generation.`);
        } else {
            if (!DRY_RUN) {
                try {
                    console.log(`  Generating image with prompt: ${item.prompt.substring(0, 50)}...`);
                    // We need to import openai env
                    if (!process.env.OPENAI_API_KEY) {
                        console.error("  OPENAI_API_KEY not set!");
                        continue;
                    }

                    const b64 = await generateImage(item.prompt);
                    fs.writeFileSync(imagePath, Buffer.from(b64, 'base64'));
                    console.log(`  Saved image to ${imagePath}`);
                } catch (e) {
                    console.error(`  Failed to generate image for ${item.id}:`, e);
                    continue;
                }
            } else {
                console.log(`  [DRY RUN] Would generate image for ${item.id}`);
            }
        }

        // 2. Update storage.ts
        // We need to find the landmark entry and update photos
        if (!DRY_RUN) {
            let storageContent = fs.readFileSync(STORAGE_PATH, 'utf-8');
            // Strategy: Find "id: 'itemId'" and then look for "photos: ["
            // This is tricky with simple replace. 
            // We will do a regex replacement that matches the id and the photos array nearby.

            // Regex to find the landmark object. 
            // We search for id: 'item.id', then capture until we see photos: [

            // Note: This regex assumes the file structure is consistent.
            // It looks for `id: 'the_id'`, followed by anything (non-greedy) until `photos: [\n`.
            // Then captures the first string in the array (the current primary photo).

            const regex = new RegExp(`(id:\\s*'${item.id}'[\\s\\S]*?photos:\\s*\\[\\s*)(['"][^'"]*['"])`, 'g');

            // Replace the first photo with our new local path, and KEEP the old first photo as second (if we want) 
            // OR just prepend.
            // The instruction was to update with new image paths. Let's prepend.

            if (regex.test(storageContent)) {
                // Check if already updated to avoid duplicates
                if (!storageContent.includes(`'${publicUrl}'`)) {
                    storageContent = storageContent.replace(regex, `$1'${publicUrl}',\n      $2`);
                    fs.writeFileSync(STORAGE_PATH, storageContent);
                    console.log(`  Updated storage.ts for ${item.id}`);
                } else {
                    console.log(`  storage.ts already contains ${publicUrl}`);
                }
            } else {
                console.error(`  Could not find landmark entry in storage.ts for ${item.id}`);
            }
        }

        // 3. Update Plan
        if (!DRY_RUN) {
            // Update the line in memory 
            lines[item.index] = lines[item.index].replace('[ ]', '[x]');
        }
    }

    if (!DRY_RUN) {
        fs.writeFileSync(PLAN_PATH, lines.join('\n'));
        console.log("Updated plan file.");
    }
}

// Check for .env to load API key locally if needed
import dotenv from 'dotenv';
dotenv.config();

main().catch(console.error);
