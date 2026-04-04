const fs = require('fs');
const path = 'server/data/landmarks.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const header = 'import { type Landmark } from "../../shared/schema";\n\nexport const LANDMARKS: Landmark[] = [\n';
const footer = '\n];';

let objects = [];
let currentIndex = 0;

// Simple state machine to find whole objects in the LANDMARKS array structure
// We start after the header (after line 3 or similar)
while (currentIndex < lines.length) {
    let line = lines[currentIndex].trim();
    if (line === '{') {
        let objectLines = [];
        let objectStart = currentIndex;
        while (currentIndex < lines.length && !lines[currentIndex].trim().startsWith('},')) {
            objectLines.push(lines[currentIndex]);
            currentIndex++;
        }
        if (currentIndex < lines.length) {
            objectLines.push(lines[currentIndex]); // capture the },
        }
        objects.push(objectLines.join('\n'));
    }
    currentIndex++;
}

console.log(`Found ${objects.length} potential objects.`);

const filtered = objects.filter(obj => {
    // A landmark that should be deleted has:
    // 1. "Premium" in the name
    // 2. AND ID like "city_item_NNN"
    const nameMatch = obj.match(/"name":\s*"([^"]*)"/);
    const idMatch = obj.match(/"id":\s*"([^"]*)"/);
    if (!nameMatch || !idMatch) return true; // Keep if weird
    const name = nameMatch[1];
    const id = idMatch[1];

    // Pattern to delete: Premium string AND city_item_ pattern
    if (name.includes('Premium') && (id.includes('_item_') || id.includes('premium'))) {
        console.log(`Deleting placeholder: ${id} - ${name}`);
        return false;
    }
    return true;
});

const newContent = header + filtered.join('\n') + footer;
fs.writeFileSync(path, newContent);
console.log(`Rebuilt server/data/landmarks.ts. Kept ${filtered.length} valid items.`);
