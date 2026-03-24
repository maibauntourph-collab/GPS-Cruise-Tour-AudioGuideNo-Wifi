
const fs = require('fs');
const path = require('path');

const LANDMARKS_FILE = path.join(__dirname, '../server/data/landmarks.ts');

const HOOKS = {
    History: "유구한 세월을 머금은 이곳에는 우리가 미처 알지 못했던 놀라운 비하인드 스토리와 역사가 숨겨져 있습니다. 과거의 영광과 현재의 활기가 교차하는 이곳의 역사적 깊이를 직접 느껴보세요.",
    Activity: "절대로 놓치지 마세요(DON'T MISS)! 심장을 뛰게 할 짜릿한 액티비티와 인생샷을 위한 최고의 스팟이 바로 여기 있습니다. 지금 이 순간, 당신만의 특별한 체험을 시작해보세요.",
    Food: "미식가라면 필수 코스! 현지인들 사이에서도 입소문 난 진정한 맛집과 이곳에서만 맛볼 수 있는 특별한 풍미가 당신의 오감을 자극할 것입니다.",
    Shopping: "쇼핑의 즐거움이 가득! 장인의 손길이 담긴 수공예 기념품부터 최신 트렌드 아이템까지, 소중한 사람을 위한 특별한 선물을 발견하는 기쁨을 누려보세요."
};

function enhance() {
    console.log('--- 🧭 Simple Regex Narration Enhancement ---');
    let content = fs.readFileSync(LANDMARKS_FILE, 'utf-8');

    // Split into items by name field as an anchor
    const items = content.split(/\{\n    "id":/);
    console.log(`Found ${items.length - 1} items.`);

    const processed = [items[0]];
    for (let i = 1; i < items.length; i++) {
        let item = '{\n    "id":' + items[i];

        // Find name and category
        const nameMatch = item.match(/"name":\s*"(.*?)"/);
        const categoryMatch = item.match(/"category":\s*"(.*?)"/);

        if (nameMatch && categoryMatch) {
            const name = nameMatch[1];
            const category = categoryMatch[1];

            let h = HOOKS.History;
            if (category.includes('Activity')) h = HOOKS.Activity;
            if (category.includes('Restaurant') || category.includes('Food')) h = HOOKS.Food;
            if (category.includes('Shopping')) h = HOOKS.Shopping;

            // Direct replace for generic/short narration strings
            item = item.replace(/"narration":\s*"([\s\S]*?)"/, (match, oldN) => {
                if (oldN.includes("반갑습니다!") || oldN.length < 200) {
                    const newN = `${name}에 오신 것을 환영합니다! ${h} ${HOOKS.History} Kenneth Cruise Guide와 함께 이곳의 숨겨진 비밀을 탐험해보세요.`;
                    return `"narration": ${JSON.stringify(newN)}`;
                }
                return match;
            });

            // Update translations
            item = item.replace(/"ko":\s*\{([\s\S]*?)"narration":\s*"([\s\S]*?)"/, (match, pre, n) => {
                const newKN = `${name}의 풍성한 스토리! ${h} ${HOOKS.History} 역사, 맛집, 쇼핑 정보를 절대 놓치지 마세요.`;
                return `"ko": {${pre}"narration": ${JSON.stringify(newKN)}`;
            });
        }
        processed.push(item);
    }

    fs.writeFileSync(LANDMARKS_FILE, processed.join(''));
    console.log('✅ Final Enhancement complete.');
}

enhance();
