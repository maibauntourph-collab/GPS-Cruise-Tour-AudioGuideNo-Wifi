
import fs from 'fs';

function analyzeLandmarks(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const landmarks = [];

    // Improved regex to handle blocks more reliably
    // We look for objects started by { and ended by }, (roughly)
    // Finding id and photos.
    const blocks = content.split(/\n\s*\{\s*\n/);

    for (const block of blocks) {
        const idMatch = block.match(/["']?id["']?\s*:\s*["']([^"']+)["']/);
        const nameMatch = block.match(/["']?name["']?\s*:\s*["']([^"']+)["']/);
        if (!idMatch) continue;

        const id = idMatch[1];
        const name = nameMatch ? nameMatch[1] : id;

        // Find photos array content
        const photosMatch = block.match(/["']?photos["']?\s*:\s*(\[[^\]]*\]|null|undefined)/);
        let isEmpty = false;
        let isPlaceholder = false;

        if (!photosMatch) {
            isEmpty = true;
        } else {
            const photosVal = photosMatch[1];
            if (photosVal === '[]' || photosVal === 'null' || photosVal === 'undefined') {
                isEmpty = true;
            } else {
                // Check for placeholder
                if (photosVal.includes('placeholder.png')) {
                    isPlaceholder = true;
                }
                // Check if it's actually empty array like [ ]
                const cleaned = photosVal.replace(/\[|\]|\s|\n|'|"/g, '');
                if (cleaned === '') isEmpty = true;
            }
        }

        landmarks.push({ id, name, isEmpty, isPlaceholder });
    }

    return landmarks;
}

const hardcodedPath = 'e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/data/hardcodedLandmarks.ts';
const serverPath = 'e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/server/data/landmarks.ts';

console.log('--- ANALYSIS RESULTS ---');

const hardcoded = analyzeLandmarks(hardcodedPath);
const server = analyzeLandmarks(serverPath);

const hardcodedEmpty = hardcoded.filter(l => l.isEmpty || l.isPlaceholder);
const serverEmpty = server.filter(l => l.isEmpty || l.isPlaceholder);

console.log(`Hardcoded Stats: Total ${hardcoded.length}, Missing/Placeholder: ${hardcodedEmpty.length}`);
console.log(`Server Stats: Total ${server.length}, Missing/Placeholder: ${serverEmpty.length}`);

const report = {
    hardcoded: hardcodedEmpty.map(l => ({ id: l.id, name: l.name, type: l.isEmpty ? 'Empty' : 'Placeholder' })),
    server: serverEmpty.map(l => ({ id: l.id, name: l.name, type: l.isEmpty ? 'Empty' : 'Placeholder' }))
};

fs.writeFileSync('e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/scripts/photo_analysis_report.json', JSON.stringify(report, null, 2));
console.log('Report saved to scripts/photo_analysis_report.json');
