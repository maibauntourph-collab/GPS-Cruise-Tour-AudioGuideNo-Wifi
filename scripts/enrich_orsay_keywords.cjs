const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');
const TARGET_ID = "musee_dorsay";

function enrichOrsayAndKeywords() {
    console.log(`--- 🔍 Enhancing & Adding searchKeywords to ${TARGET_ID} ---`);
    let content = fs.readFileSync(FILE, 'utf-8');

    const entryStart = content.indexOf(`"id": "${TARGET_ID}"`);
    if (entryStart === -1) {
        console.error(`❌ ${TARGET_ID} not found.`);
        return;
    }

    // 1. Inject search keywords before createdAt
    const objEnd = content.indexOf('createdAt', entryStart);
    if (objEnd !== -1) {
        const keywordsJSON = `\n    "searchKeywords": ["Beaux-Arts", "인상파 갤러리", "빈센트 반 고흐", "인생샷"],`;
        const targetNationsPos = content.lastIndexOf('"targetNations":', objEnd);
        const pricePos = content.lastIndexOf('"price":', objEnd);
        const premiumPos = content.lastIndexOf('"isPremium":', objEnd);

        let insertPos = Math.max(targetNationsPos, pricePos, premiumPos);
        if (insertPos !== -1 && insertPos > entryStart) {
            let endOfLine = content.indexOf('\n', insertPos);
            if (endOfLine !== -1) {
                // Remove if it already exists to avoid duplicates
                if (!content.substring(entryStart, objEnd).includes('"searchKeywords"')) {
                    content = content.substring(0, endOfLine + 1) + keywordsJSON + content.substring(endOfLine + 1);
                    console.log(`✅ Success: Added searchKeywords to ${TARGET_ID}.`);
                } else {
                    console.log(`⚠️ searchKeywords already exist for ${TARGET_ID}.`);
                }
            }
        }
    }

    const ENRICHED_NARRATION = "멋진 보자르(Beaux-Arts) 양식 기차역에 자리한 오르세 미술관에 오신 것을 환영합니다. 이곳은 단순한 박물관 그 이상으로, 1900년 파리 만국박람회를 위해 지어진 기차역의 웅장함을 그대로 간직하고 있습니다. 루브르가 고대부터 19세기 중반까지를 다룬다면, 오르세는 1848년부터 1914년까지의 찬란한 근대 미술을 책임지고 있습니다. \\n\\n이곳의 진정한 백미는 5층 인상파 갤러리입니다. 모네의 '루앙 대성당', 르누아르의 '물랭 드 라 갈레트의 무도회', 그리고 빈센트 반 고흐의 강렬한 '자화상'과 '별이 빛나는 밤'을 마주하는 순간, 여러분은 전율을 느끼게 될 것입니다. 빛의 변화를 포착하려 했던 예술가들의 열정이 캔버스 너머로 고스란히 전해집니다.\\n\\n특별한 팁을 드릴까요? 미술관 꼭대기에 있는 거대한 시계창을 찾아보세요. 시계바늘 사이로 비치는 몽마르트르 언덕과 사크레쾨르 대성당의 풍경은 그 자체로 한 폭의 그림입니다. 인생샷을 남기기에 가장 완벽한 장소죠. 또한, 과거 기차역의 흔적인 금빛 찬란한 레스토랑에서의 식사는 여러분의 파리 여행을 더욱 우아하게 만들어 줄 것입니다. 인상파 거장들의 숨결이 살아 숨 쉬는 오르세에서, 예술이 주는 깊은 위로와 감동을 만끽해 보시기 바랍니다.";

    const ENRICHED_DETAIL = "오르세 미술관은 파리 세느강 좌안에 위치한 국립 미술관입니다. 원래는 1900년 파리 만국박람회를 위해 건설된 오르세 역이었으나, 기술의 발달로 기차역으로서의 기능을 잃게 되자 1986년 미술관으로 개관했습니다. 건물의 웅장한 아치형 천장과 거대한 시계는 여전히 기차역 시절의 낭만을 간직하고 있습니다.\\n\\n이곳은 1848년부터 1914년까지 제작된 회화, 조각, 가구, 사진 등 방대한 컬렉션을 보유하고 있습니다. 특히 인상파와 후기 인상파 거장들의 작품이 집중되어 있어 '인상주의의 보고'라고 불립니다. 밀레의 '이삭 줍는 사람들', 고갱의 '타히티의 여인들', 마네의 '풀밭 위의 점심 식사' 등 서양 미술사를 상징하는 걸작들을 한자리에서 만날 수 있는 특별한 공간입니다.";

    // 2. Main Narration Update
    const narrationKey = '"narration":';
    let narrationPos = content.indexOf(narrationKey, entryStart);
    if (narrationPos !== -1 && narrationPos < objEnd) {
        let valueStart = content.indexOf('"', narrationPos + narrationKey.length) + 1;
        let valueEnd = content.indexOf('",', valueStart);
        content = content.substring(0, valueStart) + ENRICHED_NARRATION + content.substring(valueEnd);
        console.log('✅ Main narration enriched.');
    }

    // 3. Detailed Description Update
    const detailKey = '"detailedDescription":';
    let detailPos = content.indexOf(detailKey, entryStart);
    if (detailPos !== -1 && detailPos < objEnd) {
        let valueStart = content.indexOf('"', detailPos + detailKey.length) + 1;
        let valueEnd = content.indexOf('",', valueStart);
        if (valueEnd === -1) valueEnd = content.indexOf('"', valueStart);
        content = content.substring(0, valueStart) + ENRICHED_DETAIL + content.substring(valueEnd);
        console.log('✅ Detailed description enriched.');
    }

    fs.writeFileSync(FILE, content);
    console.log('🎉 Orsay Enrichment with Keywords Complete!');
}

enrichOrsayAndKeywords();
