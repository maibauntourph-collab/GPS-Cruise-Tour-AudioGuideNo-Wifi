
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');

function fix() {
    console.log('--- 🛠 Fixing Landmarks Syntax Error ---');
    let content = fs.readFileSync(FILE, 'utf-8');

    // Fix the case where a closing brace was inserted before "description"
    // Pattern: } "description" or } \n "description"
    const fixedContent = content.replace(/\}\s*"description":/g, ', "description":');

    if (content !== fixedContent) {
        fs.writeFileSync(FILE, fixedContent);
        console.log('✅ Syntax error fixed.');
    } else {
        console.log('⚠️ No errors found with this pattern.');
    }
}

fix();
