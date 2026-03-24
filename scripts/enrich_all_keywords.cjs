const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');
let content = fs.readFileSync(FILE, 'utf-8');
const lines = content.split('\n');

let newLines = [];
let pendingKeywords = [];
let hasKeywords = true; // Default true so we don't insert randomly until we hit an ID
let currentId = null;
let injectedCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of landmark
    const idMatch = line.match(/^\s*"id":\s*"([^"]+)"/);
    if (idMatch) {
        currentId = idMatch[1];
        hasKeywords = false; // Reset for this landmark

        let catMatch = "Landmark";
        let nameMatch = "";

        // Lookahead to find category and name
        for (let j = i; j < i + 50 && j < lines.length; j++) {
            if (lines[j].match(/^\s*"id":\s*"/)) break; // Stop looking ahead if we hit the next landmark

            const cMatch = lines[j].match(/^\s*"category":\s*"([^"]+)"/);
            if (cMatch) catMatch = cMatch[1];

            const nMatch = lines[j].match(/^\s*"name":\s*"([^"]+)"/);
            if (!nameMatch && nMatch) nameMatch = nMatch[1];
        }

        let baseTags = ["명소", "관광지", "필수코스", "인생샷"];
        if (catMatch === 'Restaurant' || catMatch === 'Food') baseTags = ["맛집", "추천식당", "현지인맛집", "먹거리"];
        if (catMatch === 'Activity' || catMatch === 'Experience') baseTags = ["액티비티", "체험", "필수코스", "즐길거리"];
        if (catMatch === 'Gift Shop' || catMatch === 'Shopping') baseTags = ["쇼핑", "기념품", "마켓", "기념품샵"];

        // Add context from the name
        if (nameMatch.includes("성당") || nameMatch.includes("교회") || nameMatch.includes("사원")) {
            baseTags.push("종교건축", "경건함");
        }
        if (nameMatch.includes("박물관") || nameMatch.includes("미술관") || catMatch === 'Museum') {
            baseTags.push("전시", "문화", "예술");
        }
        if (catMatch === 'Park' || catMatch === 'Nature' || nameMatch.includes("공원") || nameMatch.includes("해변")) {
            baseTags.push("휴식", "자연", "산책");
        }

        // Deduplicate
        pendingKeywords = [...new Set(baseTags)];
    }

    // Detect if this landmark already has searchKeywords
    if (line.includes('"searchKeywords":')) {
        hasKeywords = true;
    }

    // Insert right before root-level 'isPremium', 'price', or 'createdAt'
    // Root-level fields typically have exactly 6 spaces or 4 spaces of identation.
    // The translations blocks have deeper indentation.
    const isInsertionPoint = !hasKeywords &&
        (line.match(/^\s{4,6}"isPremium":/) || line.match(/^\s{4,6}"price":/) || line.match(/^\s{4,6}"createdAt":/));

    if (isInsertionPoint) {
        const indentMatch = line.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : "      ";
        newLines.push(`${indent}"searchKeywords": ${JSON.stringify(pendingKeywords)},`);
        hasKeywords = true;
        injectedCount++;
    }

    newLines.push(line);
}

// Join and save
fs.writeFileSync(FILE, newLines.join('\n'));
console.log(`🎉 Injected searchKeywords into ${injectedCount} landmarks!`);
