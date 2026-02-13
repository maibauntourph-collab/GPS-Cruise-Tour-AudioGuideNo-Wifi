import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

const data = [
    // --- SEOUL (서울특별시) ---
    {
        city_id: 'seoul',
        items: [
            {
                id: 'seoul_gyeongbokgung',
                name: '경복궁 (Gyeongbokgung Palace)',
                category: 'Landmark',
                lat: 37.5796, lng: 126.9770,
                description: '조선 왕조의 법궁이자 가장 웅장한 궁궐입니다.',
                narration: '안녕하세요! 지금 여러분은 조선 왕조의 심장이었던 경복궁 앞에 서 계십니다. 1395년에 창건된 이 궁궐은 임진왜란 당시 소실되는 아픔을 겪었지만, 고종 대에 이르러 흥선대원군에 의해 다시금 그 위용을 되찾았죠. 특히 경회루의 연못에 비친 누각의 모습이나 근정전의 웅장한 조정 마당을 보고 있으면 당시 조선 왕실의 위엄이 고스란히 느껴집니다. 한복을 입고 거닐다 보면 마치 시간을 거슬러 조선 시대로 돌아간 듯한 착각에 빠지게 될 거예요. 수문장 교대식도 놓치지 마세요!',
                detailed_description: '서울의 5대 궁궐 중 으뜸인 곳으로, 북악산을 배경으로 펼쳐진 아름다운 건축미를 자랑합니다.',
                historical_info: '태조 이성계가 한양으로 천도하며 지은 첫 번째 궁궐입니다.',
                photos: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_namsan_tower',
                name: 'N서울타워 (N Seoul Tower)',
                category: 'Landmark',
                lat: 37.5511, lng: 126.9882,
                description: '서울의 전경을 한눈에 볼 수 있는 상징적인 랜드마크입니다.',
                narration: '해발 480미터 높이의 남산 꼭대기에서 서울을 내려다보는 기분은 어떨까요? N서울타워는 1969년 종합전파탑으로 시작해 지금은 전 세계 관광객들이 몰려드는 사랑의 성지가 되었습니다. 타워 앞 난간에 빼곡히 걸린 수만 개의 "사랑의 자물쇠"는 이곳이 얼마나 많은 연인들의 약속을 담고 있는지 보여주죠. 밤이 되면 타워의 조명이 대기질 상태에 따라 색깔이 변한다는 사실을 알고 계셨나요? 파란색일 때는 공기가 아주 맑다는 뜻이니 마음껏 숨을 들이마셔 보세요!',
                detailed_description: '남산 정상에 위치한 통신 및 전망용 타워로, 서울의 야경 명소로 유명합니다.',
                historical_info: '1975년 완공되었으며, 1980년부터 일반인에게 공개되었습니다.',
                photos: ['https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_bukchon',
                name: '북촌 한옥마을 (Bukchon Hanok Village)',
                category: 'Landmark',
                lat: 37.5815, lng: 126.9825,
                description: '수백 년의 역사를 간직한 전통 한옥 주거 지역입니다.',
                narration: '고층 빌딩이 즐비한 도심 한복판에 이런 곳이 있다는 게 믿겨지시나요? 북촌은 조선 시대 양반들이 모여 살던 최고급 주거지였습니다. 좁은 골목길 사이로 기와지붕이 파도처럼 넘실대는 풍경은 서울에서 가장 한국적인 아름다움을 보여주는 장면이죠. 실제로 주민들이 거주하고 있는 곳이니 조용히 걷는 예의가 필요합니다. 처마 밑에 서서 하늘을 바라보면 전통과 현대가 절묘하게 교차하는 서울만의 매력을 깊이 느낄 수 있습니다.',
                detailed_description: '경복궁과 창덕궁 사이에 위치한 전통 한옥 보존 지구입니다.',
                historical_info: '600년 역사 동안 권문세가들의 주거지로 명성을 이어온 곳입니다.',
                photos: ['https://images.unsplash.com/photo-1554522256-11f879683707?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_lotte_tower',
                name: '롯데월드타워 (Lotte World Tower)',
                category: 'Landmark',
                lat: 37.5126, lng: 127.1025,
                description: '대한민국에서 가장 높고 세계에서 6번째로 높은 초고층 빌딩입니다.',
                narration: '구름 위를 걷는 기분을 느끼고 싶다면 바로 이곳입니다! 123층, 555미터 높이의 롯데월드타워는 한국의 붓을 형상화한 매끄러운 디자인으로 서울의 스카이라인을 완전히 바꿔놓았습니다. 전망대인 "서울스카이"에 오르면 날씨가 좋은 날에는 서해 바다까지 보인다고 하죠. 바닥이 투명한 유리로 된 "스카이데크" 위에 섰을 때 발밑으로 아찔하게 펼쳐지는 도심의 모습은 정말 잊지 못할 전율을 선사할 거예요. 최첨단 기술과 한국적 미가 결합된 현대의 성이랍니다.',
                detailed_description: '송파구 잠실에 위치한 랜드마크로 전망대, 쇼핑몰, 호텔, 아쿠아리움이 결합된 복합 문화 공간입니다.',
                historical_info: '2017년 개장하였으며, 대한민국 현대 건축의 자존심을 상징합니다.',
                photos: ['https://images.unsplash.com/photo-1601675200508-251f4961918a?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_gwangjang_market',
                name: '광장시장 (Gwangjang Market)',
                category: 'Restaurant',
                lat: 37.5701, lng: 126.9992,
                description: '서울에서 가장 유명한 먹거리와 전통이 살아있는 시장입니다.',
                narration: '맛있는 냄새가 코끝을 찌르는 이곳은 서울 먹거리의 천국, 광장시장입니다! 지글지글 소리를 내며 익어가는 빈대떡과 마약김밥의 고소함은 시장의 활기찬 에너지와 어우러져 최고의 맛을 자랑하죠. 특히 육회 골목에서 맛보는 신선한 육회 탕탕이는 해외 여행객들에게도 인기 만점입니다. 시장통 좁은 의자에 앉아 상인들의 정겨운 입담을 들으며 먹는 음식 한 접시는 그 어떤 고급 레스토랑보다 따뜻하고 풍족한 기억을 남겨줄 거예요. 이곳의 진정한 맛은 바로 시장의 살아있는 생명력입니다.',
                detailed_description: '100년 이상의 역사를 가진 서울 최초의 상설 시장으로 빈대떡, 육회, 보리밥 등 먹거리가 풍부합니다.',
                historical_info: '1905년 한성부 허가를 받아 설립된 유서 깊은 시장입니다.',
                photos: ['https://images.unsplash.com/photo-1579600161224-ca575971a4d8?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_myeongdong_kyoja',
                name: '명동교자 (Myeongdong Kyoja)',
                category: 'Restaurant',
                lat: 37.5625, lng: 126.9856,
                description: '50년 넘게 사랑받아온 칼국수와 만두 전문점입니다.',
                narration: '명동에 오면 반드시 들러야 하는 미슐랭 빕구르망 맛집, 명동교자입니다. 이곳의 칼국수는 진한 닭 육수와 부드러운 면발, 그리고 매콤하고 알싸한 겉절이 김치의 조화가 일품이죠. 처음 맛을 보면 김치의 강한 마늘 향에 놀랄 수도 있지만, 한 입 더 먹다 보면 중독적인 매력에 빠져 젓가락을 멈출 수 없게 됩니다. 만두 역시 얇은 피 안에 육즙이 가득 차 있어 입안 가득 행복을 전해줍니다. 수십 년간 변함없는 맛을 지켜온 이곳은 서울 시민들의 소울 푸드를 대변하는 장소입니다.',
                detailed_description: '명동 본점과 분점을 운영하며, 칼국수와 비빔국수, 만두 등을 주 메뉴로 합니다.',
                historical_info: '1966년 창업하여 명동의 터줏대감 역할을 하고 있는 식당입니다.',
                photos: ['https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_han River_activity',
                name: '한강 자전거 라이딩 (Han River Cycling)',
                category: 'Activity',
                lat: 37.5256, lng: 126.9256,
                description: '아름다운 한강변을 따라 시원한 강바람을 느끼며 자전거를 타보세요.',
                narration: '서울 시민들이 가장 사랑하는 휴식처, 한강으로 가볼까요? 탁 트인 한강공원은 자전거 라이딩을 즐기기에 완벽한 장소입니다. 강바람을 가르며 달리는 기분은 일상의 스트레스를 단번에 날려버릴 만큼 상쾌하죠. 라이딩 중간에 편의점에서 직접 끓여 먹는 "한강 라면"은 그 자체로 하나의 특별한 체험이 됩니다. 해 질 녘 노을을 바라보며 자전거를 타다 보면 바쁘게 돌아가는 도시 서울의 또 다른 평온한 얼굴을 만나게 될 거예요. 돗자리 하나 펴놓고 즐기는 '치맥'도 놓치지 말아야 할 필수 코스입니다!',
                detailed_description: '서울 곳곳의 한강공원에서 공공자전거 "따릉이"를 빌려 쉽게 즐길 수 있는 야외 활동입니다.',
                historical_info: '한강 종합 개발 사업 이후 조성된 시민 공원 인프라의 결과물입니다.',
                photos: ['https://images.unsplash.com/photo-1541604193435-22287d32c2c2?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'seoul_insadong_shopping',
                name: '인사동 쌈지길 (Ssamziegil)',
                category: 'Shopping',
                lat: 37.5741, lng: 126.9845,
                description: '한국의 전통 공예와 현대적 디자인이 만나는 쇼핑 갤러리입니다.',
                narration: '전통의 거리 인사동에서도 가장 돋보이는 건축물, 쌈지길입니다. 이곳은 특이하게도 계단 대신 경사로를 따라 건물을 빙글빙글 돌며 올라가는 구조로 되어 있어요. 층을 오를 때마다 아기자기한 공방과 갤러리들이 나타나 마치 보물찾기를 하는 기분을 주죠. 한국 전통 문양을 현대적으로 해석한 장신구부터 장인이 직접 만든 도자기까지, 소중한 사람에게 전할 특별한 기념품을 찾기에 이보다 좋은 곳은 없습니다. 작가들의 손길이 닿은 세상에 단 하나뿐인 물건들을 구경하며 한국의 창의적인 예술 감각에 흠뻑 빠져보세요.',
                detailed_description: '인사동 중심에 위치한 'ㅁ'자 형태의 건축물로 개성 넘치는 수공예 전문점들이 모여 있습니다.',
                historical_info: '2004년 건축가 최문규가 설계하여 개장한 이후 인사동의 대표 명소가 되었습니다.',
                photos: ['https://images.unsplash.com/photo-1536411516738-99d868972e27?auto=format&fit=crop&q=80&w=1000']
            }
        ]
    },
    // --- TOKYO (도쿄) ---
    {
        city_id: 'tokyo',
        items: [
            {
                id: 'tokyo_sensoji',
                name: '센소지 (Senso-ji Temple)',
                category: 'Landmark',
                lat: 35.7148, lng: 139.7967,
                description: '도쿄에서 가장 오래된 불교 사원이며 아사쿠사의 상징입니다.',
                narration: '붉은색 거다한 제등이 걸린 "카미나리몬"을 통과하는 순간, 도쿄의 역동적인 과거가 시작됩니다! 628년에 세워진 센소지는 도쿄의 정신적 중심지이자 가장 큰 관광지죠. 입구에서 사원 본당까지 이어진 "나카미세" 거리는 에도 시대부터 이어진 상점가로 일본 전통 간식과 기념품들이 눈을 즐겁게 합니다. 본당 앞에서 향로의 연기를 몸으로 끌어당겨 보세요. 그 연기가 아픈 곳을 낫게 하고 행운을 가져다준다는 믿음이 전해져 오거든요. 화려한 금빛 본당과 5층 탑의 조화는 밤이 되어 조명이 켜지면 더욱 환상적인 분위기를 자아냅니다.',
                detailed_description: '아사쿠사 지구에 위치한 성관음종 본산으로, 연간 수백만 명이 방문하는 명소입니다.',
                historical_info: '도쿄 내에서 가장 오래된 역사를 지닌 유서 깊은 사찰입니다.',
                photos: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'tokyo_skytree',
                name: '도쿄 스카이트리 (Tokyo Skytree)',
                category: 'Landmark',
                lat: 35.7101, lng: 139.8107,
                description: '세계를 압도하는 높이를 자랑하는 전파탑이자 도쿄의 랜드마크입니다.',
                narration: '바라만 봐도 고개가 아플 정도로 높은 634미터의 도쿄 스카이트리! 이 숫자는 옛 무사시 지역을 상징하는 '무사시' 숫자의 일본어 발음에서 따왔다고 하죠. 세계에서 가장 높은 자립식 타워인 이곳의 전망대에 오르면 도쿄의 거대한 빌딩 숲은 물론, 맑은 날에는 일본의 영산 후지산까지 한눈에 조망할 수 있습니다. 타워 곳곳에 녹아든 최첨단 기술과 일본 전통 건축의 '소리(휘어짐)' 미학이 결합된 모습은 현대 일본 디자인의 정수를 보여줍니다. 아래쪽 소라마치 쇼핑몰에서의 즐거운 시간도 잊지 마세요!',
                detailed_description: '스미다구에 위치한 디지털 방송용 타워로, 350m와 450m 높이에 전망대가 있습니다.',
                historical_info: '2012년 완공되어 도쿄 타워를 잇는 새로운 도쿄의 상징이 되었습니다.',
                photos: ['https://images.unsplash.com/photo-1517722014278-c256a91a6fba?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'tokyo_shibuya_sky',
                name: '시부야 스카이 (Shibuya Sky)',
                category: 'Landmark',
                lat: 35.6585, lng: 139.7025,
                description: '시부야 스크램블 교차로를 발밑에 두는 지상 229미터의 전망대입니다.',
                narration: '전 세계 사람들의 발걸음이 교차하는 시부야의 심장부, 그 정점에 서 있는 기분은 정말 특별합니다. 시부야 스크램블 스퀘어 꼭대기에 위치한 이 루프탑 전망대는 탁 트인 하늘과 도심의 전경을 장애물 없이 감상할 수 있는 최고의 장소죠. 가장자리 "스카이 엣지"에서 교차로를 내려다보면 개미처럼 작게 보이는 수많은 사람들의 활발한 움직임이 경이롭게 느껴질 정도입니다. 해가 지는 골든 타워 시간에 방문하여 노을빛으로 물드는 도쿄를 배경으로 인생샷을 남겨보세요. 음악과 바람, 그리고 빛이 어우러진 현대적인 힐링의 공간입니다.',
                detailed_description: '시부야 스크램블 스퀘어의 전망 시설로, 옥상 전망 공간인 스카이 스테이지가 유명합니다.',
                historical_info: '2019년 11월 시부야 재개발 프로젝트의 일환으로 세워졌습니다.',
                photos: ['https://images.unsplash.com/photo-1540959733332-e9ab4247feee?auto=format&fit=crop&q=80&w=1000']
            },
            {
                id: 'tokyo_shinjuku_yakiniku',
                name: '신주쿠 로쿠센 (Shinjuku Rokusen)',
                category: 'Restaurant',
                lat: 35.6938, lng: 139.7032,
                description: '입안에서 살살 녹는 최상급 와규 야키니쿠를 즐길 수 있는 곳입니다.',
                narration: '지글지글 불판 위에서 고기가 구워지는 소리와 고소한 향기가 가득한 이곳은 육식 애호가들의 천국입니다! 일본에 오면 꼭 맛봐야 할 와규 야키니쿠를 전문으로 하는 이곳은 엄선된 최고 등급의 소고만을 제공하죠. 마블링이 화려하게 수놓아진 와규 한 조각을 입에 넣으면 사르르 녹아 없어지는 마법 같은 경험을 하게 될 거예요. 특유의 달콤 짭짤한 타레 소스나 깔끔한 소금 중 취향껏 선택해 보세요. 현지 분위기 물씬 풍기는 신주쿠 거리를 바라보며 시원한 생맥주 한 잔을 곁들이면 여행의 피로가 온데간데없이 사라지는 것을 느낄 수 있습니다.',
                detailed_description: '최상급 흑우(쿠로게와규)를 제공하는 고급 구이 전문점으로 깔끔한 인테리어를 자랑합니다.',
                historical_info: '전통적인 일본식 육류 조리법을 현대적으로 계승한 식당입니다.',
                photos: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000']
            }
        ]
    }
];

async function insertData() {
    if (!dbUrl) {
        console.error("DATABASE_URL missing");
        process.exit(1);
    }
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log("🚀 Starting Bulk Migration (Manual High Quality Batch)...");

        let count = 0;
        for (const city of data) {
            console.log(`Processing City: ${city.city_id}`);
            for (const item of city.items) {
                await client.query(`
          INSERT INTO landmarks (
            id, city_id, name, lat, lng, radius, narration, description, category,
            detailed_description, historical_info, photos, translations
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET 
            name=$3, lat=$4, lng=$5, narration=$7, description=$8, category=$9, 
            detailed_description=$10, historical_info=$11, photos=$12, translations=$13, updated_at=NOW()
        `, [
                    item.id, city.city_id, item.name, item.lat, item.lng, 50, item.narration,
                    item.description, item.category, item.detailed_description, item.historical_info,
                    JSON.stringify(item.photos),
                    JSON.stringify({ ko: { name: item.name, description: item.description, narration: item.narration } })
                ]);
                count++;
            }
        }
        console.log(`✅ Success! Inserted ${count} high-quality items.`);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

insertData();
