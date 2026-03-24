
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');

function analyze() {
    console.log('--- 📊 Narration Length Analysis ---');
    // Using simple regex or string search to avoid massive memory usage if parsing as JS
    const content = fs.readFileSync(FILE, 'utf-8');

    // We export const landmarks = [...]
    // We'll try to find objects that start with {"id": ... } or {id: ...}
    const blocks = content.split(/\{(?:id|"id"): "/);
    const shortNarrations = [];

    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i];
        const idMatch = block.match(/^([^"]+)"/);
        const nameMatch = block.match(/"name":\s*"([^"]+)"/);
        const narrationMatch = block.match(/"narration":\s*"([^"]+)"/);

        if (idMatch && narrationMatch) {
            const id = idMatch[1];
            const name = nameMatch ? nameMatch[1] : id;
            const narration = narrationMatch[1];
            if (narration.length < 500) {
                shortNarrations.push({ id, name, length: narration.length });
            }
        }
    }

    console.log(`Found ${shortNarrations.length} landmarks with narration < 500 characters.`);
    fs.writeFileSync(path.join(__dirname, '../short_narrations_list.json'), JSON.stringify(shortNarrations, null, 2));
}

analyze();
