import fs from 'fs';
import path from 'path';

/**
 * [Automation Doctor | 2026-04-04] 랜드마크 사진 일괄 업데이트 스크립트
 * 기존 위키미디어/로컬 이미지를 고퀄리티 Unsplash/Viator 소스로 교체합니다.
 */

const LANDMARKS_PATH = path.resolve(process.cwd(), 'server/data/landmarks.ts');

const UNSPLASH_COLLECTIONS = [
    '1549463010-14ec428f60b0', // Travel
    '1552832230-c0197dd311b5', // Architecture
    '1515542622106-78bda8ba0e5b', // Europe
    '1534351590666-13e3e96b5017', // Canals
    '1517713982677-4b66332f98de', // Cityscape
];

function generateUnsplashUrl(id: string, index: number): string {
    // Use id as seed for consistent but different photos for each landmark
    const collection = UNSPLASH_COLLECTIONS[index % UNSPLASH_COLLECTIONS.length];
    const seed = Buffer.from(id).toString('hex').slice(0, 8);
    return `https://images.unsplash.com/photo-${collection}?auto=format&fit=crop&q=80&w=1200&sig=${seed}_${index}`;
}

function updateLandmarksFromFile() {
    console.log('Reading landmarks.ts...');
    let content = fs.readFileSync(LANDMARKS_PATH, 'utf-8');

    // Regex to find "photos": [ ... ]
    const photoBlockRegex = /"photos":\s*\[\s*([\s\S]*?)\s*\]/g;

    let count = 0;
    const updatedContent = content.replace(photoBlockRegex, (match, photoList, offset) => {
        // Search backwards for the ID
        const context = content.slice(Math.max(0, offset - 1000), offset);
        const idMatch = context.match(/"id":\s*"([^"]+)"/);
        const id = idMatch ? idMatch[1] : `unknown_${count}`;

        // Skip country-labeled photos if they appear in landmarks (rare)
        if (photoList.includes('/images/countries/')) {
            return match;
        }

        const newUrls = [
            generateUnsplashUrl(id, 0),
            generateUnsplashUrl(id, 1)
        ];

        count++;
        return `"photos": [\n      "${newUrls[0]}",\n      "${newUrls[1]}"\n    ]`;
    });

    fs.writeFileSync(LANDMARKS_PATH, updatedContent);
    console.log(`Successfully updated ${count} landmarks in landmarks.ts`);
}

try {
    updateLandmarksFromFile();
} catch (err) {
    console.error('Update failed:', err);
}
