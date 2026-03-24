const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');
const content = fs.readFileSync(FILE, 'utf-8');
const lines = content.split('\n');

let currentId = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track current ID
    const idMatch = line.match(/"id":\s*"([^"]+)"/);
    if (idMatch) {
        currentId = idMatch[1];
    }

    if (line.includes('오르세')) {
        console.log(`Found '오르세' at line ${i + 1}. Current ID: ${currentId}`);
    }
}
