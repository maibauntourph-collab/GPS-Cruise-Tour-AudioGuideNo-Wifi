
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');

function fix() {
    console.log('--- 🛡️ Advanced Landmarks Syntax Repair ---');
    let content = fs.readFileSync(FILE, 'utf-8');

    // Fix incorrectly placed closing braces followed by "description" or other fields
    // This often happens in the translation block after narration
    const patterns = [
        { from: /\}\s*\n*\s*"description":/g, to: ',\n    "description":' },
        { from: /\}\s*"description":/g, to: ', "description":' }
    ];

    let fixedContent = content;
    patterns.forEach(p => {
        fixedContent = fixedContent.replace(p.from, p.to);
    });

    if (content !== fixedContent) {
        fs.writeFileSync(FILE, fixedContent);
        console.log('✅ Advanced repair complete.');
    } else {
        console.log('⚠️ No errors detected with advanced patterns.');
    }
}

fix();
