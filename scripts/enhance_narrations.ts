
import * as fs from 'fs';
import * as path from 'path';

const LANDMARKS_FILE = path.join(__dirname, '../server/data/landmarks.ts');

const HOOKS = {
    History: {
        KO: "유구한 세월을 머금은 이곳에는 우리가 미처 알지 못했던 놀라운 비하인드 스토리가 숨겨져 있습니다. 과거의 영광과 현재의 활기가 교차하는 이곳의 역사적 깊이를 직접 느껴보세요.",
        EN: "This place, steeped in history, hides amazing behind-the-scenes stories you might not know. Feel the historical depth where past glory meets modern-day vibrancy.",
        TH: "สถานที่แห่งนี้ซึ่งเต็มไปด้วยประวัติศาสตร์ ซ่อนเรื่องราวเบื้องหลังที่น่าทึ่งที่คุณอาจไม่เคยรู้ สัมผัสความลึกซึ้งทางประวัติศาสตร์ที่ความรุ่งโรจน์ในอดีตบรรจบกับความมีชีวิตชีวาในปัจจุบัน"
    },
    Activity: {
        KO: "절대 놓치지 마세요(DON'T MISS)! 심장을 뛰게 할 짜릿한 액티비티와 인생샷을 위한 최고의 스팟이 바로 여기 있습니다. 지금 이 순간, 당신만의 특별한 체험을 시작해보세요.",
        EN: "DON'T MISS OUT! Thrilling activities to get your heart racing and the best spots for once-in-a-lifetime photos are right here. Start your unique experience this very moment.",
        TH: "อย่าพลาด! กิจกรรมที่น่าตื่นเต้นที่จะทำให้หัวใจคุณเต้นแรงและจุดถ่ายรูปที่ดีที่สุดในชีวิตอยู่ที่นี่แล้ว เริ่มต้นประสบการณ์พิเศษของคุณในขณะนี้"
    },
    Food: {
        KO: "미식가라면 필수 코스! 현지인들 사이에서도 입소문 난 진정한 맛집과 이곳에서만 맛볼 수 있는 특별한 풍미가 당신의 오감을 자극할 것입니다.",
        EN: "A must-visit for foodies! Real local favorites and unique flavors you can only taste here will awaken your senses.",
        TH: "จุดหมายที่ไม่ควรพลาดสำหรับคนรักอาหาร! ร้านอร่อยขวัญใจคนท้องถิ่นและรสชาติที่เป็นเอกลักษณ์ที่คุณหาทานได้ที่นี่เท่านั้นจะช่วยเพิ่มสีสันให้การเดินทางของคุณ"
    },
    Shopping: {
        KO: "쇼핑의 즐거움이 가득! 장인의 손길이 담긴 수공예 기념품부터 최신 트렌드 아이템까지, 소중한 사람을 위한 특별한 선물을 발견하는 기쁨을 누려보세요.",
        EN: "Full of shopping joy! From handcrafted souvenirs with a master's touch to the latest trend items, enjoy the pleasure of finding special gifts for your loved ones.",
        TH: "เติมเต็มความสุขด้วยการช้อปปิ้ง! ตั้งแต่ของที่ระลึกงานฝีมือสุดประณีตไปจนถึงไอเทมตามเทรนด์ล่าสุด เพลิดเพลินไปกับความสุขในการมองหาของขวัญสุดพิเศษสำหรับคนที่คุณรัก"
    }
};

function enhanceLandmarks() {
    console.log('--- 🧭 High-Efficiency Chunked Narration Enhancement ---');

    if (!fs.existsSync(LANDMARKS_FILE)) {
        console.error(`File not found: ${LANDMARKS_FILE}`);
        return;
    }

    const content = fs.readFileSync(LANDMARKS_FILE, 'utf-8');

    // Split the file into landmarks array parts
    const headerMatch = content.match(/^[\s\S]*?export const LANDMARKS: Landmark\[\] = \[\n/);
    if (!headerMatch) {
        console.error("Could not find start of LANDMARKS array.");
        return;
    }

    const header = headerMatch[0];
    const footer = "\n];";
    const body = content.substring(header.length, content.lastIndexOf(footer));

    // Each landmark starts with { and ends with }, (mostly)
    // We'll split by "  }," or "  }," followed by newline
    const landmarkBlocks = body.split(/\n  \},/);

    console.log(`Initial chunk count: ${landmarkBlocks.length}`);

    const processedBlocks = landmarkBlocks.map((block, index) => {
        if (block.trim() === '') return block;

        // Simple detection of name and category without heavy regex
        const nameMatch = block.match(/name:\s*["'](.*?)["']/);
        const categoryMatch = block.match(/category:\s*["'](.*?)["']/);

        if (!nameMatch || !categoryMatch) return block;

        const name = nameMatch[1];
        const category = categoryMatch[1];

        // Choose hooks based on category hints
        let activeHooks = [HOOKS.History];
        if (category.includes('Activity') || category.includes('Tour')) activeHooks.push(HOOKS.Activity);
        if (category.includes('Restaurant') || category.includes('Food') || category.includes('Cafe')) activeHooks.push(HOOKS.Food);
        if (category.includes('Shopping') || category.includes('Mall') || category.includes('Shop')) activeHooks.push(HOOKS.Shopping);

        // Combine 2-3 hooks randomly or by category
        const hookKO = activeHooks.map(h => h.KO).join(' ');
        const hookEN = activeHooks.map(h => h.EN).join(' ');
        const hookTH = activeHooks.map(h => h.TH).join(' ');

        // Update 'narration' and 'translations'
        let updatedBlock = block;

        // 1. Update top-level narration if it's generic
        updatedBlock = updatedBlock.replace(/narration:\s*["']([\s\S]*?)["']/, (match, narration) => {
            if (narration.includes("반갑습니다!") || narration.length < 100) {
                const newNarration = `${name}에 오신 것을 환영합니다! ${hookKO} 이곳은 당신의 여행에서 가장 기억에 남을 장소가 될 것입니다.`;
                return `narration: ${JSON.stringify(newNarration)}`;
            }
            return match;
        });

        // 2. Update translations
        const transRegex = /translations:\s*\{([\s\S]*?)\}/;
        updatedBlock = updatedBlock.replace(transRegex, (match, transContent) => {
            let updatedTrans = transContent;

            // Update KO narration in translations
            updatedTrans = updatedTrans.replace(/ko:\s*\{([\s\S]*?)\}/, (match, koContent) => {
                return `ko: {${koContent.replace(/narration:\s*["']([\s\S]*?)["']/, (m, n) => {
                    const newN = `${name}의 숨겨진 이야기와 팁! ${hookKO}`;
                    return `narration: ${JSON.stringify(newN)}`;
                })}}`;
            });

            // Update EN narration
            updatedTrans = updatedTrans.replace(/en:\s*\{([\s\S]*?)\}/, (match, enContent) => {
                return `en: {${enContent.replace(/narration:\s*["']([\s\S]*?)["']/, (m, n) => {
                    const newN = `Discover the secrets of ${name}! ${hookEN}`;
                    return `narration: ${JSON.stringify(newN)}`;
                })}}`;
            });

            return `translations: {${updatedTrans}}`;
        });

        return updatedBlock;
    });

    const finalContent = header + processedBlocks.join('\n  },') + footer;
    fs.writeFileSync(LANDMARKS_FILE, finalContent);

    console.log(`✅ Finished processing ${processedBlocks.length} landmarks.`);
}

enhanceLandmarks();
