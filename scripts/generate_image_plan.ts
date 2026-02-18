
import * as fs from 'fs';
import * as path from 'path';

const blockPath = path.join(process.cwd(), 'landmarks_block.ts');
let content = fs.readFileSync(blockPath, 'utf-8');

// Strip the declaration
content = content.replace(/const LANDMARKS: Landmark\[\] =/, '');
content = content.replace(/];\s*$/, ']');

// We need to be careful with eval. 
// It's better to use Function to evaluate it as an expression.
// However, the file might have comments // Rome landmarks
// We need to strip comments or use a parser that handles them.

// Simple comment stripper
content = content.replace(/\/\/.*/g, '');

try {
    // Use Function to return the array
    const landmarks = new Function(`return ${content}`)();

    let mdContent = '# Image Renewal Plan\n\n';
    mdContent += '| ID | City | Name | Status | Prompt |\n';
    mdContent += '|----|------|------|--------|--------|\n';

    for (const l of landmarks) {
        const prompt = `A breathtaking, premium photo of ${l.name}, ${l.cityId}, high quality, 8k resolution, Nanobanana style, vibrant colors, cinematic lighting, photorealistic`;
        mdContent += `| ${l.id} | ${l.cityId} | ${l.name} | [ ] | ${prompt} |\n`;
    }

    const outputPath = path.join(process.cwd(), 'docs', 'image_renewal_plan.md');
    const docsDir = path.dirname(outputPath);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, mdContent);
    console.log(`Generated plan at ${outputPath} with ${landmarks.length} landmarks.`);

} catch (error) {
    console.error('Failed to parse landmarks:', error);
    // Fallback to regex if eval fails
    console.log('Attempting regex fallback...');
    // ... regex logic if needed, but the file looks clean enough
}
