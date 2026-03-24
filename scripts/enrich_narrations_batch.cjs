const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../server/data/landmarks.ts');

const DATA_TO_ENRICH = [
    {
        name: "오르세 미술관", // Using name-based search for robustness
        narration: "멋진 보자르 양식 기차역에 자리한 오르세 미술관에 오신 것을 환영합니다. 이곳은 단순한 박물관 그 이상으로, 1900년 파리 만국박람회를 위해 지어진 기차역의 웅장함을 그대로 간직하고 있습니다. 루브르가 고대부터 19세기 중반까지를 다룬다면, 오르세는 1848년부터 1914년까지의 찬란한 근대 미술을 책임지고 있습니다. \\n\\n이곳의 진정한 백미는 5층 인상파 갤러리입니다. 모네의 '루앙 대성당', 르누아르의 '물랭 드 라 갈레트의 무도회', 그리고 빈센트 반 고흐의 강렬한 '자화상'과 '별이 빛나는 밤'을 마주하는 순간, 여러분은 전율을 느끼게 될 것입니다. 빛의 변화를 포착하려 했던 예술가들의 열정이 캔버스 너머로 고스란히 전해집니다.\\n\\n특별한 팁을 드릴까요? 미술관 꼭대기에 있는 거대한 시계창을 찾아보세요. 시계바늘 사이로 비치는 몽마르트르 언덕과 사크레쾨르 대성당의 풍경은 그 자체로 한 폭의 그림입니다. 인생샷을 남기기에 가장 완벽한 장소죠. 또한, 과거 기차역의 흔적인 금빛 찬란한 레스토랑에서의 식사는 여러분의 파리 여행을 더욱 우아하게 만들어 줄 것입니다. 인상파 거장들의 숨결이 살아 숨 쉬는 오르세에서, 예술이 주는 깊은 위로와 감동을 만끽해 보시기 바랍니다.",
        detail: "오르세 미술관은 파리 세느강 좌안에 위치한 국립 미술관입니다. 원래는 1900년 파리 만국박람회를 위해 건설된 오르세 역이었으나, 기술의 발달로 기차역으로서의 기능을 잃게 되자 1986년 미술관으로 개관했습니다. 건물의 웅장한 아치형 천장과 거대한 시계는 여전히 기차역 시절의 낭만을 간직하고 있습니다.\\n\\n이곳은 1848년부터 1914년까지 제작된 회화, 조각, 가구, 사진 등 방대한 컬렉션을 보유하고 있습니다. 특히 인상파와 후기 인상파 거장들의 작품이 집중되어 있어 '인상주의의 보고'라고 불립니다. 밀레의 '이삭 줍는 사람들', 고갱의 '타히티의 여인들', 마네의 '풀밭 위의 점심 식사' 등 서양 미술사를 상징하는 걸작들을 한자리에서 만날 수 있는 특별한 공간입니다."
    },
    {
        name: "Pink Mamma",
        narration: "파리 9구에 위치한 '핑크 마마'는 눈과 입이 동시에 즐거운 티그라네(Big Mamma) 그룹의 대표적인 이탈리안 레스토랑입니다. 4층 건물 전체가 각기 다른 개성 있는 인테리어로 꾸며져 있으며, 특히 거대한 통유리창을 통해 파리의 하늘을 감상할 수 있는 최상층 옥상 정원은 파리에서 가장 핫한 포토존으로 유명합니다. \\n\\n이곳의 시그니처 메뉴인 '트러플 파스타'는 진한 트러플 향과 크리미한 소스가 어우러져 한 번 맛보면 잊을 수 없는 풍미를 선사합니다. 또한 피렌체식 티본스테이크인 '비스테카 알라 피오렌티나'는 장작불에 구워내 풍부한 육즙과 불맛이 일품입니다. \\n\\n방문 팁을 드리자면, 예약 없이는 자리를 잡기 매우 힘드니 최소 1-2주 전 온라인 예약을 추천합니다. 만약 예약을 못했다면 오픈 30분 전부터 줄을 서는 것이 좋습니다. 활기차고 왁자지껄한 분위기 속에서 파리의 가장 트렌디한 이탈리안 다이닝을 경험해 보세요!",
        detail: "핑크 마마는 파리에서 가장 줄이 긴 레스토랑 중 하나로, 정통 이탈리아 식재료를 사용한 합리적인 가격의 요리를 제공합니다. 층마다 테마가 다른 빈티지한 인테리어는 마치 이탈리아의 어느 가정을 방문한 듯한 따뜻함을 줍니다. 피렌체에서 공수해 온 고기를 직접 에이징하여 구워주는 스테이크 전문 구역도 따로 마련되어 있어, 파리 한복판에서 정통 토스카나의 맛을 느낄 수 있습니다."
    },
    {
        name: "Septime",
        narration: "파리 11구에 위치한 '셉팀'은 현대 프랑스 요리의 정수를 보여주는 미슐랭 1스타 레스토랑이자 '세계 50대 베스트 레스토랑'에 꾸준히 이름을 올리는 곳입니다. 화려함보다는 재료 본연의 맛에 집중하는 '네오 비스트로'의 선두주자로, 셰프 베르트랑 그레보는 매일 시장에서 공수한 최상의 제철 식재료로 창의적인 코스 요리를 선보입니다.\\n\\n격식에 얽매이지 않는 편안하고 캐주얼한 분위기 속에서, 예술 작품처럼 정갈하게 담긴 요리들을 즐길 수 있습니다. 특히 와인 페어링은 요리의 풍미를 극대화해주기로 정평이 나 있으니 꼭 권해드립니다. \\n\\n이곳은 파리에서 예약하기 가장 어려운 레스토랑 중 하나로 꼽힙니다. 매일 오전 10시(현지 시간)에 3주 후의 예약이 오픈되니, 광클할 준비를 하셔야 합니다. 장인 정신과 세련된 감각이 만난 셉팀에서의 한 끼는 여러분의 파리 미식 여행 중 최고의 순간으로 기억될 것입니다.",
        detail: "셉팀은 지속 가능한 미식을 추구하는 곳으로도 유명합니다. 지역 농부들과의 긴밀한 협력을 통해 탄소 발자국을 줄이고, 버려지는 식재료를 최소화하는 조리법을 연구합니다. 셰프의 철학이 담긴 메뉴는 시즌마다 급격히 변하며, 방문할 때마다 새로운 미각의 발견을 선사합니다."
    },
    {
        name: "Antico Arco",
        narration: "로마의 자니콜로 언덕 위에 위치한 '안티코 아르코'는 로마 시내의 탁 트인 전경과 함께 정통 이탈리안 요리의 현대적 재해석을 만날 수 있는 곳입니다. 1996년에 문을 연 이후 꾸준히 현지인과 미식가들에게 사랑받아온 이곳은, 품격 있는 분위기와 세심한 서비스로 특별한 날을 기념하기에 완벽한 장소입니다.\\n\\n추천 메뉴로는 입안에서 사르르 녹는 '송아지 고기 라구 파스타'와 독창적인 소스가 곁들여진 '오리 가슴살 요리'가 있습니다. 또한 2만 병 이상의 와인을 보유한 거대한 와인 셀러는 와인 애호가들을 설레게 하기에 충분합니다.\\n\\n저녁 식사 전, 미리 자니콜로 언덕에 도착해 로마의 노을을 감상한 뒤 이곳으로 향하는 일정을 추천합니다. 관광지의 번잡함에서 벗어나 고요하고 로맨틱한 분위기 속에서 진정한 로마의 맛을 느껴보시기 바랍니다.",
        detail: "안티코 아르코는 고전적인 로마 요리에 셰프의 섬세한 터치를 더해 세련된 미식을 제공합니다. 특히 이곳의 트러플 요리와 매 시즌 구성이 바뀌는 테이스팅 메뉴는 실패 없는 선택입니다. 로마의 복잡한 관광 중심지에서 살짝 벗어나, 조용히 음식과 와인에 집중하고 싶은 분들에게 최고의 추천지가 될 것입니다."
    }
];

function enrichAll() {
    console.log('--- 🚀 Starting Batch Enrichment ---');
    let content = fs.readFileSync(FILE, 'utf-8');
    let overallSuccess = 0;

    DATA_TO_ENRICH.forEach(item => {
        console.log(`Enriching: ${item.name}...`);
        const nameKey = `"name": "${item.name}"`;
        const namePos = content.indexOf(nameKey);

        if (namePos === -1) {
            console.warn(`⚠️ Warning: ${item.name} not found by name.`);
            return;
        }

        const objStart = content.lastIndexOf('{', namePos);

        function replaceField(key, newValue, startPos) {
            const keyFull = `"${key}": "`;
            const keyPos = content.indexOf(keyFull, startPos);
            if (keyPos === -1) return false;

            const valueStart = keyPos + keyFull.length;
            const valueEnd = content.indexOf('"', valueStart);

            content = content.substring(0, valueStart) + newValue + content.substring(valueEnd);
            return true;
        }

        let success = false;
        if (replaceField('narration', item.narration, objStart)) success = true;
        replaceField('detailedDescription', item.detail, objStart);

        const koPos = content.indexOf('"ko": {', objStart);
        if (koPos !== -1) {
            replaceField('narration', item.narration, koPos);
        }

        if (success) {
            overallSuccess++;
            console.log(`✅ Success: ${item.name} enriched.`);
        }
    });

    fs.writeFileSync(FILE, content);
    console.log(`🎉 Batch Enrichment Complete! (${overallSuccess}/${DATA_TO_ENRICH.length} successful)`);
}

enrichAll();
