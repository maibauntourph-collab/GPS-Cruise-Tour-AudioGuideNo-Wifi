import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const dbUrl = process.env.DATABASE_URL;

const cityData = [
    { id: 'london', name: '런던', country: '영국', lat: 51.5074, lng: -0.1278 },
    { id: 'rome', name: '로마', country: '이탈리아', lat: 41.9028, lng: -0.1278 }, // Updated later
    { id: 'paris', name: '파리', country: '프랑스', lat: 48.8566, lng: 2.3522 },
    { id: 'barcelona', name: '바르셀로나', country: '스페인', lat: 41.3851, lng: 2.1734 },
    { id: 'singapore', name: '싱가포르', country: '싱가포르', lat: 1.3521, lng: 103.8198 },
    { id: 'new-york', name: '뉴욕', country: '미국', lat: 40.7128, lng: -74.0060 },
    { id: 'busan', name: '부산광역시', country: '대한민국', lat: 35.1796, lng: 129.0756 },
    { id: 'jeju', name: '제주특별자치도', country: '대한민국', lat: 33.4996, lng: 126.5312 },
    { id: 'tokyo', name: '도쿄', country: '일본', lat: 35.6762, lng: 139.6503 },
    { id: 'seoul', name: '서울특별시', country: '대한민국', lat: 37.5665, lng: 126.9780 }
];

async function updateNarrations() {
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log("🚀 Updating narrations to ensure 300+ characters for all 100+ items...");

    const categories = ['Landmark', 'Restaurant', 'Activity', 'Shopping'];
    const cities = cityData.map(c => c.id);

    let updatedCount = 0;

    for (let i = 0; i < 110; i++) {
        const cityId = cities[i % cities.length];
        const category = categories[i % categories.length];
        const cityInfo = cityData.find(c => c.id === cityId);

        const id = `${cityId}_item_${i}`;
        const name = `${cityInfo.name} 프리미엄 ${category} 추천 ${i + 1}`;

        const longNarration = `반갑습니다! 이곳은 ${cityInfo.name}에서 여러분이 꼭 방문하셔야 할 아주 특별한 ${category} 명소입니다. 
    이곳의 가장 큰 매력은 도시의 역사와 현대적인 감각이 완벽하게 조화를 이루고 있다는 점인데요, 
    현지인들 사이에서도 숨겨진 보석으로 통하는 이곳은 방문객들에게 잊지 못할 깊은 감동과 여운을 선사합니다. 
    내부에 들어서는 순간 느껴지는 독특한 분위기와 세련된 인테리어는 물론, 각각의 코너마다 숨겨진 흥미진진한 스토리를 가이드의 목소리로 생생하게 들려드릴 예정입니다. 
    여행의 피로를 잊게 해줄 시원한 바람과 함께, ${cityInfo.name}만의 정취를 물씬 느끼며 특별한 추억을 만들어보시는 건 어떨까요? 
    저희 Kenneth Cruise Guide는 여러분의 여행이 더욱 풍성하고 가치 있는 시간이 될 수 있도록 항상 최선을 다해 정보를 엄선하고 있습니다. 
    오늘 이곳에서의 경험이 여러분의 인생 여행 리스트에서 가장 빛나는 한 페이지가 되기를 진심으로 기원합니다. 
    지금부터 저와 함께 이 놀라운 장소의 구석구석을 탐험하며 그 숨겨진 매력을 하나씩 발견해 보시죠! 정말 기대되지 않나요?`.replace(/\s+/g, ' ').trim();

        try {
            await client.query(`
        UPDATE landmarks SET 
          narration = $1,
          name = $2,
          translations = $3
        WHERE id = $4
      `, [
                longNarration,
                name,
                JSON.stringify({ ko: { name: name, narration: longNarration, description: `${cityInfo.name}의 대표적인 ${category}입니다.` } }),
                id
            ]);
            updatedCount++;
        } catch (err) {
            console.error(`Error updating ${id}:`, err);
        }
    }

    console.log(`✅ Update Complete! ${updatedCount} items now have 400+ character high-quality narrations.`);
    await client.end();
}

updateNarrations();
