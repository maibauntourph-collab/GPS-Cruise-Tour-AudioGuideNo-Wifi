const fs = require('fs');
const path = require('path');

/**
 * [Bug Doctor | 2026-03-24] Landmarks JSON Syntax Repair Script
 * 학생들에게: narration이나 description 내부에 이스케이프 되지 않은 따옴표(")가 있으면
 * TypeScript/JSON 구문 오류가 발생하여 빌드가 실패합니다. 이를 자동으로 수정하는 스크립트입니다.
 */
const FILE = path.join(__dirname, '../server/data/landmarks.ts');

function fix() {
    console.log('--- 🛠 Fixing Unescaped Quotes in Landmarks ---');
    if (!fs.existsSync(FILE)) {
        console.error('❌ File not found:', FILE);
        return;
    }

    let content = fs.readFileSync(FILE, 'utf-8');
    const lines = content.split('\n');
    let fixCount = 0;

    const fixedLines = lines.map((line, index) => {
        // narration, description, detailedDescription, historicalInfo 키를 포함하는 줄만 처리
        const keys = ['"narration":', '"description":', '"detailedDescription":', '"historicalInfo":'];
        const hasKey = keys.some(key => line.includes(key));

        if (hasKey) {
            // "key": "value", 형태에서 value 부분만 추출
            const match = line.match(/^(\s*"[^"]+":\s*")(.+)("[,]?\s*)$/);
            if (!match) return line;

            const prefix = match[1];
            const value = match[2];
            const suffix = match[3];

            // 이스케이프 되지 않은 " 찾기
            // 규칙: 바로 앞에 \가 없는 "를 \"로 변환
            // 긍정형 후방 탐색(negative lookbehind) 사용: (?<!\\)"
            const fixedValue = value.replace(/(?<!\\)"/g, '\\"');

            if (value !== fixedValue) {
                console.log(`[Line ${index + 1}] Fixed corrupted quotes.`);
                fixCount++;
                return prefix + fixedValue + suffix;
            }
        }
        return line;
    });

    if (fixCount > 0) {
        fs.writeFileSync(FILE, fixedLines.join('\n'));
        console.log(`✅ Success: ${fixCount} lines repaired.`);
    } else {
        console.log('✨ Clean: No unescaped quotes found.');
    }
}

try {
    fix();
} catch (error) {
    console.error('❌ Error during fix:', error);
}
