
import * as fs from 'fs';
import * as path from 'path';

const blockPath = path.join(process.cwd(), 'landmarks_block.ts');
const content = fs.readFileSync(blockPath, 'utf-8');
const lines = content.split('\n');

const landmarks = [];
let currentLandmark: any = null;
let currentLang = null;

for (const line of lines) {
    // 1. Detect Landmark Start (ID at 4 spaces)
    // We use ID as the anchor for a new landmark object
    const idMatch = line.match(/^\s{4}id:\s*'([^']+)'/);
    if (idMatch) {
        // If we were building a landmark, push it
        if (currentLandmark && currentLandmark.id) {
            landmarks.push(currentLandmark);
        }
        // Start new landmark
        currentLandmark = { id: idMatch[1] };
        currentLang = null; // Reset lang context
    }

    // 2. Detect City ID (4 spaces)
    const cityIdMatch = line.match(/^\s{4}cityId:\s*'([^']+)'/);
    if (cityIdMatch && currentLandmark) {
        currentLandmark.cityId = cityIdMatch[1];
    }

    // 3. Detect Default English Name (4 spaces)
    const nameMatch = line.match(/^\s{4}name:\s*'([^']+)'/);
    if (nameMatch && currentLandmark) {
        currentLandmark.name = nameMatch[1];
    }

    // 4. Detect Language Block Start (6 spaces)
    // e.g., "      ko: {"
    const langMatch = line.match(/^\s{6}(\w+):\s*{/);
    if (langMatch) {
        currentLang = langMatch[1];
    }

    // 5. Detect Block End (6 spaces with closing brace)
    if (currentLang && line.match(/^\s{6}},?/)) {
        currentLang = null;
    }

    // 6. Detect Translation Name (8 spaces)
    const transNameMatch = line.match(/^\s{8}name:\s*'([^']+)'/);
    if (transNameMatch && currentLang === 'ko' && currentLandmark) {
        currentLandmark.koName = transNameMatch[1];
    }
}

// Push the last one
if (currentLandmark && currentLandmark.id) {
    landmarks.push(currentLandmark);
}

// --- Generate English Plan ---
let mdContent = '# Image Renewal Plan\n\n';
mdContent += '| ID | City | Name | Status | Prompt |\n';
mdContent += '|----|------|------|--------|--------|\n';

for (const l of landmarks) {
    const safeName = l.name || 'Unknown';
    const safeCity = l.cityId || 'Unknown';
    const prompt = `A breathtaking, premium photo of ${safeName}, ${safeCity}, high quality, 8k resolution, Nanobanana style, vibrant colors, cinematic lighting, photorealistic`;
    mdContent += `| ${l.id} | ${safeCity} | ${safeName} | [ ] | ${prompt} |\n`;
}

const outputPath = path.join(process.cwd(), 'docs', 'image_renewal_plan.md');
const docsDir = path.dirname(outputPath);
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}
fs.writeFileSync(outputPath, mdContent);


// --- Generate Korean Plan ---
let koMdContent = '# 이미지 리뉴얼 계획 (Image Renewal Plan)\n\n';
koMdContent += '| ID | 도시 | 이름 (국문) | 이름 (영문) | 상태 | 프롬프트 (Prompt) |\n';
koMdContent += '|----|------|-------------|-------------|------|-------------------|\n';

for (const l of landmarks) {
    const safeName = l.name || 'Unknown';
    const safeKoName = l.koName || safeName; // Fallback to English if no Korean name
    const safeCity = l.cityId || 'Unknown';

    // Using English prompt for better generation results, but listing it
    const prompt = `A breathtaking, premium photo of ${safeName}, ${safeCity}, high quality, 8k resolution, Nanobanana style, vibrant colors, cinematic lighting, photorealistic`;

    koMdContent += `| ${l.id} | ${safeCity} | ${safeKoName} | ${safeName} | [ ] | ${prompt} |\n`;
}

const koOutputPath = path.join(process.cwd(), 'docs', 'image_renewal_plan_ko.md');
fs.writeFileSync(koOutputPath, koMdContent);

console.log(`Generated English plan at ${outputPath}`);
console.log(`Generated Korean plan at ${koOutputPath}`);
console.log(`Total landmarks: ${landmarks.length}`);
