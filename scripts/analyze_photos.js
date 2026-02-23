
import fs from 'fs';
import path from 'path';

// This is a rough parser for the large TypeScript files
function analyzeLandmarks(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const landmarks = [];

    // Simple regex to find landmark blocks
    // This is not perfect but should catch most if formatted consistently
    const landmarkRegex = /\{\s*id:\s*['"]([^'"]+)['"][\s\S]*?photos:\s*(\[[^\]]*\]|null|undefined)/g;
    let match;

    while ((match = landmarkRegex.exec(content)) !== null) {
        const id = match[1];
        const photosStr = match[2];
        let isEmpty = false;

        if (photosStr === '[]' || photosStr === 'null' || photosStr === 'undefined' || photosStr.trim() === '[]') {
            isEmpty = true;
        } else {
            // Check if it's an array with only whitespace/newlines
            const cleaned = photosStr.replace(/\[|\]|\s|\n|'|"/g, '');
            if (cleaned === '') {
                isEmpty = true;
            }
        }

        landmarks.push({ id, isEmpty });
    }

    return landmarks;
}

const hardcodedPath = 'e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/data/hardcodedLandmarks.ts';
const serverPath = 'e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/server/data/landmarks.ts';

console.log('--- Analyzing Hardcoded Landmarks ---');
const hardcoded = analyzeLandmarks(hardcodedPath);
const hardcodedEmpty = hardcoded.filter(l => l.isEmpty).map(l => l.id);
console.log(`Total: ${hardcoded.length}, Empty Photos: ${hardcodedEmpty.length}`);
console.log(JSON.stringify(hardcodedEmpty));

console.log('\n--- Analyzing Server (Neon) Landmarks ---');
const server = analyzeLandmarks(serverPath);
const serverEmpty = server.filter(l => l.isEmpty).map(l => l.id);
console.log(`Total: ${server.length}, Empty Photos: ${serverEmpty.length}`);
// Only show first 50 to avoid too much output
console.log(JSON.stringify(serverEmpty.slice(0, 50)));
if (serverEmpty.length > 50) console.log(`... and ${serverEmpty.length - 50} more`);
