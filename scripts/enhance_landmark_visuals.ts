import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const landmarksPath = path.join(process.cwd(), 'server', 'data', 'landmarks.ts');
const enhancedImagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'landmarks', 'enhanced');

// Ensure directory exists
if (!fs.existsSync(enhancedImagesDir)) {
       fs.mkdirSync(enhancedImagesDir, { recursive: true });
}

const enhancements = [
       { id: 'colosseum', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80' },
       { id: 'eiffel_tower', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1600&q=80' },
       { id: 'big_ben', image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=1600&q=80' },
       { id: 'marina_bay_sands', image: 'https://images.unsplash.com/photo-1527668752968-14dc70a274dd?w=1600&q=80' },
       { id: 'wat_chalong', image: 'https://images.unsplash.com/photo-1563492062711-2092323cc662?w=1600&q=80' },
];

async function enhanceVisuals() {
       console.log("🏙️ Enhancing landmark visuals in server/data/landmarks.ts...");

       let content = fs.readFileSync(landmarksPath, 'utf-8');

       for (const item of enhancements) {
              // Find the landmark object by ID and update the first photo
              // This is a simple regex replacement for the purpose of this task
              const pattern = new RegExp(`id:\\s*'${item.id}'[\\s\\S]*?photos:\\s*\\[([^]*?)\\]`, 'g');
              content = content.replace(pattern, (match, photoGroup) => {
                     const photos = photoGroup.split(',').map(p => p.trim());
                     // Add the new enhanced image at the beginning if not already present
                     if (!photos.includes(`'${item.image}'`)) {
                            photos.unshift(`'${item.image}'`);
                     }
                     return match.replace(photoGroup, `\n      ${photos.join(',\n      ')}\n    `);
              });
       }

       fs.writeFileSync(landmarksPath, content);
       console.log("✅ server/data/landmarks.ts updated.");

       console.log("🔄 Syncing with Neon DB...");
       try {
              execSync('npx tsx scripts/migrate_hardcoded_data.ts', { stdio: 'inherit' });
              console.log("✨ Visual enhancement reflected in DB.");
       } catch (error) {
              console.error("❌ Failed to sync with DB:", error);
       }
}

enhanceVisuals();
