import { neon } from '@neondatabase/serverless';

const sql = neon(
  'postgresql://neondb_owner:npg_RxOvMV2BQ4Lo@ep-summer-smoke-a1ly2y42-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
);

const TARGET_LANDMARKS = [
  'amsterdam_de_l_europe_restaurant',
  'amsterdam_stedelijk_museum',
  'brussels_atomium',
  'copenhagen_national_museum',
  'stockholm_djurgarden',
  'stockholm_moderna_museet',
  'stockholm_city_hall',
  'stockholm_royal_palace',
];

async function main() {
  console.log('=== Step 1: Query 8 European landmarks ===\n');

  const rows = await sql`
    SELECT id, name, description, narration, historical_info, narration_i18n
    FROM landmarks
    WHERE id = ANY(${TARGET_LANDMARKS})
    ORDER BY id
  `;

  console.log(`Found ${rows.length} landmarks\n`);

  for (const r of rows) {
    console.log(`--- ${r.id} ---`);
    console.log(`Name: ${r.name}`);
    const i18n = r.narration_i18n as Record<string, string> | null;
    console.log(`narrationI18n keys: ${i18n ? Object.keys(i18n).join(', ') : 'null'}`);
    console.log('');
  }

  // Step 2: Generate Korean narrations - Story Teller Lee style, 600-800 chars
  console.log('=== Step 2: Generate Korean narrations (Story Teller Lee style) ===\n');

  const koNarrations: Record<string, string> = {};

  // 1. amsterdam_de_l_europe_restaurant
  koNarrations['amsterdam_de_l_europe_restaurant'] =
    '여러분, 지금 눈앞에 펼쳐진 이 우아한 건물이 바로 호텔 드 뢰로프입니다. 암스텔강이 유유히 흘러가는 바로 그 자리, 암스테르담의 심장부에 자리 잡고 있죠. ' +
    '1896년에 문을 연 이 건물은 네덜란드 르네상스 양식의 걸작으로, 백 년이 넘는 세월 동안 유럽 각지에서 온 여행자들과 왕족들의 안식처가 되어 왔습니다. ' +
    '건물 정면을 한번 올려다보세요. 붉은 벽돌 사이로 하얀 석재 장식이 정교하게 새겨져 있는데, 이것이 바로 암스테르담 황금시대의 건축 미학입니다. 세월이 흘러도 그 품격은 변하지 않았죠. ' +
    '한때 이곳 보르도 레스토랑에서는 유럽 각국 정상들이 운하를 바라보며 만찬을 즐겼다고 합니다. 미슐랭 스타를 받은 셰프 리하르트 반 오스터하우트가 선보이는 정통 네덜란드 요리는 미식가들 사이에서 전설로 통하죠. ' +
    '저녁 무렵 테라스에 앉으면, 운하를 오가는 보트의 물결 소리, 멀리서 들려오는 교회 종소리, 그리고 운하 위로 반짝이는 조명이 만들어내는 암스테르담의 낭만이 온몸으로 전해집니다. 마치 17세기 네덜란드 거장의 그림 속에 들어온 듯한 기분이 들 거예요. ' +
    '꿀팁 하나 드리자면, 해 질 녘에 테라스 자리를 미리 예약하세요. 암스텔강 위로 물드는 주황빛 노을과 함께 잊지 못할 저녁 식사를 경험하실 수 있습니다. 운하 크루즈와 함께 즐기면 더욱 특별한 하루가 될 겁니다.';

  // 2. amsterdam_stedelijk_museum
  koNarrations['amsterdam_stedelijk_museum'] =
    '자, 여러분 앞에 보이는 독특한 건물이 바로 스테델릭 미술관입니다. 암스테르담 뮤지엄 광장의 한쪽을 당당히 차지하고 있는 현대미술의 보물창고죠. ' +
    '1895년 개관 이래로 이곳은 몬드리안, 말레비치, 마티스, 워홀 같은 거장들의 작품을 품어 왔습니다. 유럽에서 가장 오래된 현대미술 전문 미술관 중 하나라는 사실, 알고 계셨나요? ' +
    '건물 자체가 하나의 예술 작품입니다. 원래의 신르네상스 양식 건물 위에 2012년 증축된 거대한 흰색 구조물을 보세요. 사람들은 이것을 욕조라고 부르는데, 직접 보시면 왜 그런 별명이 붙었는지 바로 이해하실 겁니다. 전통과 현대가 이렇게 대담하게 만날 수 있다니, 감탄이 절로 나옵니다. ' +
    '내부에 들어서면 데 스틸 운동의 기하학적 아름다움부터 팝아트의 강렬한 색채, 그리고 바스키아의 거친 에너지까지, 현대미술의 모든 흐름을 한 지붕 아래에서 만날 수 있습니다. 특히 말레비치의 작품 컬렉션은 러시아 밖에서 세계 최대 규모를 자랑하는데, 절대주의 미술의 정수를 이곳에서 직접 느껴보시길 바랍니다. ' +
    '전시실을 걷다 보면 자연광이 쏟아지는 넓은 공간에서 작품들이 살아 숨 쉬는 듯한 느낌을 받게 됩니다. ' +
    '꿀팁을 드리자면, 금요일 저녁에는 특별 야간 개장을 하는데, 관람객이 적어 작품을 여유롭게 감상하기에 안성맞춤입니다. 뮤지엄 카페에서 에스프레소 한 잔과 함께 여운을 즐겨보세요.';

  // 3. brussels_atomium
  koNarrations['brussels_atomium'] =
    '브뤼셀 하늘 위로 우뚝 솟은 저 빛나는 구조물이 보이시나요? 바로 아토미움입니다. 마치 외계에서 날아온 우주선 같기도 하고, 거대한 분자 모형 같기도 하죠. ' +
    '1958년 브뤼셀 만국박람회를 위해 건설된 아토미움은 철 결정 구조를 무려 1650억 배로 확대한 것입니다. 높이 102미터, 아홉 개의 거대한 스테인리스 스틸 구체가 서로 튜브로 연결된 이 모습을 처음 보면 누구나 감탄사를 내뱉게 됩니다. ' +
    '당시 전후 유럽은 원자력의 평화적 이용이라는 꿈에 부풀어 있었고, 건축가 앙드레 바테르케인이 설계한 아토미움은 바로 그 시대 정신의 상징이었죠. 임시 건축물로 지어졌지만 시민들의 사랑을 받아 영구 보존이 결정되었고, 2006년 대대적인 리노베이션을 거쳐 지금의 은빛 광채를 되찾았습니다. ' +
    '엘리베이터를 타고 단 23초 만에 꼭대기 구체에 올라가면 브뤼셀 시내가 360도 파노라마처럼 펼쳐집니다. 맑은 날에는 벨기에 북부 평원 너머까지 시야가 닿아, 이 작은 나라의 넓은 품을 느낄 수 있습니다. ' +
    '밤이 되면 각 구체에서 뿜어져 나오는 조명이 밤하늘에 은빛 별자리를 수놓아, 낮과는 전혀 다른 몽환적인 아름다움을 선사합니다. ' +
    '꿀팁 하나 알려드릴게요. 해 질 무렵에 방문하시면 석양빛에 물든 아토미움과 환상적인 야경을 동시에 즐기실 수 있습니다. 꼭대기 레스토랑에서의 식사도 잊지 못할 경험이 될 겁니다.';

  // 4. copenhagen_national_museum
  koNarrations['copenhagen_national_museum'] =
    '코펜하겐 국립박물관에 오신 것을 환영합니다. 이곳은 덴마크 역사의 거대한 타임캡슐이자, 북유럽 문명의 이야기가 고스란히 담긴 보물 상자입니다. ' +
    '18세기 로코코 양식으로 지어진 이 우아한 건물은 원래 왕세자의 궁전이었는데, 1892년부터 박물관으로 사용되기 시작했습니다. 건물 자체의 화려한 천장 장식과 대리석 바닥만으로도 이미 눈이 즐겁죠. ' +
    '안으로 들어서면 바이킹 시대의 유물들이 여러분을 맞이합니다. 천 년 전 북유럽 전사들이 실제로 사용하던 검과 방패, 정교한 금세공 장신구, 그리고 룬 문자가 깊이 새겨진 돌비석까지. 바이킹들이 단순한 약탈자가 아니라 뛰어난 항해사이자 장인이었다는 사실을 이곳에서 직접 확인하실 수 있습니다. ' +
    '특히 태양의 전차라 불리는 청동기 시대 유물은 무려 삼천오백 년의 세월을 건너 우리 앞에 서 있는데, 황금빛 태양 원반의 광채가 여전히 눈부십니다. 고대 스칸디나비아인들의 태양 숭배 문화를 보여주는 세계적 보물이죠. ' +
    '중세 전시실에서는 덴마크 왕실의 화려한 보물들을 만날 수 있고, 민속 전시실에서는 그린란드까지 뻗어간 덴마크의 역사를 느낄 수 있습니다. ' +
    '꿀팁을 하나 전해드리면, 이 박물관은 무료 입장이 가능합니다. 바이킹 전시실은 꼭 오디오 가이드와 함께 관람하시길 추천드려요.';

  // 5. stockholm_djurgarden
  koNarrations['stockholm_djurgarden'] =
    '스톡홀름 한복판에 이런 섬이 있다니, 유르고르덴에 처음 발을 디디면 다들 놀라움을 감추지 못합니다. 도심에서 불과 몇 분 거리에 이토록 울창한 자연이 펼쳐질 수 있다니 말이죠. ' +
    '한때 스웨덴 왕실의 전용 사냥터였던 이 섬은 1868년 시민들에게 개방된 이후, 스톡홀름 사람들이 가장 사랑하는 녹색 안식처이자 문화의 보물섬이 되었습니다. ' +
    '수백 년 된 참나무 숲 사이로 난 산책로를 걸어보세요. 도시의 소음은 사라지고 새소리와 바람에 흔들리는 나뭇잎 소리만 남습니다. 봄이면 섬 곳곳에 벚꽃과 야생화가 만발하고, 여름이면 운하를 따라 카약을 즐기는 사람들로 활기가 넘칩니다. ' +
    '이 섬에는 바사 박물관, 스칸센 야외 박물관, 아바 박물관, 그뢰나 룬드 놀이공원 등 스웨덴을 대표하는 명소들이 모여 있어 하루로는 절대 부족할 정도입니다. 특히 바사 박물관에서는 1628년 처녀 항해에서 침몰한 전함 바사호의 실물을 직접 만날 수 있는데, 64문의 대포를 장착한 그 웅장한 규모에 숨이 멎을 겁니다. ' +
    '스칸센에서는 5세기에 걸친 스웨덴 전통 가옥들 사이를 거닐며 북유럽의 옛 생활상을 체험할 수 있죠. ' +
    '꿀팁 하나 드리자면, 시내 슬뤼센 선착장에서 페리를 타고 오시면 발트해 위에서 스톡홀름의 아름다운 스카이라인을 감상하며 도착할 수 있어, 그 자체가 멋진 경험이 됩니다.';

  // 6. stockholm_moderna_museet
  koNarrations['stockholm_moderna_museet'] =
    '셰프스홀멘 섬 위에 자리한 모데르나 미술관은 북유럽 현대미술의 심장부이자 세계적인 걸작들의 보금자리입니다. ' +
    '1958년 개관 이래 피카소, 달리, 마티스, 워홀, 라우셴버그 같은 거장들의 작품을 소장해 왔으며, 스웨덴이 세계에 자랑하는 최고 수준의 미술관이죠. ' +
    '스페인 건축가 라파엘 모네오가 1998년에 설계한 현재의 건물은 단아하면서도 현대적인 매력을 뿜어내는데, 내부로 들어서면 커다란 창을 통해 쏟아지는 자연광 아래에서 작품들이 마치 살아 숨 쉬는 듯합니다. ' +
    '특히 달리의 윌리엄 텔의 수수께끼는 초현실주의의 정수를 보여주는 대작이고, 마티스의 모로코 풍경은 색채의 마법사라는 별명에 걸맞은 환상적인 색감을 자랑합니다. 이 두 작품만으로도 이곳을 방문할 충분한 이유가 됩니다. ' +
    '미술관 카페에 잠시 앉아 창밖을 내다보면 발트해의 잔잔한 물결 위로 스톡홀름의 첨탑들이 그림엽서처럼 펼쳐집니다. 예술과 자연이 이토록 아름답게 어우러지는 공간은 세상에 많지 않을 거예요. ' +
    '현대미술이 어렵게 느껴지시더라도 걱정 마세요. 이곳의 전시 동선은 관람객이 자연스럽게 작품과 대화할 수 있도록 세심하게 설계되어 있습니다. ' +
    '꿀팁을 알려드리면, 상설 전시는 무료입니다. 그리고 야외 조각 정원도 놓치지 마세요. 바다 바람을 맞으며 즐기는 예술 산책은 정말 특별한 경험이 될 겁니다.';

  // 7. stockholm_city_hall
  koNarrations['stockholm_city_hall'] =
    '멜라렌 호수 기슭에 우뚝 선 스톡홀름 시청사는 스웨덴 건축의 자존심이자 노벨상의 전설이 살아 숨 쉬는 곳입니다. ' +
    '1923년 완공된 이 건물은 건축가 라그나르 외스트베리가 12년에 걸쳐 약 800만 개의 붉은 벽돌을 한 장 한 장 쌓아 올린 역작인데, 그 장인 정신에 절로 감탄이 나옵니다. ' +
    '106미터 높이의 탑 꼭대기를 올려다보세요. 스웨덴의 상징인 세 개의 금빛 왕관이 푸른 하늘 아래 찬란하게 빛나고 있어, 스톡홀름 어디에서든 이 탑을 찾을 수 있습니다. ' +
    '매년 12월 10일 알프레드 노벨의 기일에 바로 이곳 블루홀에서 노벨상 수상 만찬이 열립니다. 천 삼백 명의 하객이 한자리에 모여 축배를 드는 그 장대한 광경을 한번 상상해 보세요. ' +
    '그런데 재미있는 사실이 하나 있습니다. 블루홀이라는 이름과 달리 실제 벽면은 붉은 벽돌 그대로입니다. 원래 파란색으로 칠할 예정이었으나, 건축가가 벽돌 자체의 아름다움에 반해 그대로 두었다고 하죠. ' +
    '이층의 황금의 방으로 올라가면, 천구백만 개의 금박 모자이크 타일이 벽면과 천장을 가득 채우고 있어, 마치 황금빛 꿈속에 들어온 듯한 황홀감을 선사합니다. ' +
    '꿀팁 하나 드릴게요. 여름철에는 탑에 직접 올라갈 수 있는데, 스톡홀름의 열네 개 섬이 한눈에 들어오는 최고의 전망 포인트입니다. 가이드 투어도 꼭 참여해 보세요.';

  // 8. stockholm_royal_palace
  koNarrations['stockholm_royal_palace'] =
    '감라스탄 구시가지의 언덕 위에 웅장하게 자리한 스톡홀름 왕궁이 바로 눈앞에 있습니다. 현재도 스웨덴 국왕이 공식 업무에 사용하는 유럽 최대 규모의 왕궁 중 하나이죠. ' +
    '1754년에 완공된 이탈리아 바로크 양식의 이 궁전에는 무려 1430개의 방이 있습니다. 방 하나하나를 돌아보려면 며칠이 걸릴 정도의 어마어마한 규모죠. ' +
    '원래 이 자리에는 중세 성채인 트레 크로노르, 세 개의 왕관이라는 뜻의 성이 있었는데, 1697년 대화재로 소실된 후 건축가 니코데무스 테신이 설계한 지금의 궁전이 세워졌습니다. 불행에서 태어난 걸작이라고 할 수 있죠. ' +
    '매일 정오에 펼쳐지는 근위병 교대식은 놓칠 수 없는 볼거리입니다. 군악대의 우렁찬 연주와 함께 화려한 군복을 입은 병사들이 정렬하는 모습은 스웨덴 왕실의 위엄 그 자체입니다. ' +
    '궁전 내부의 왕실 아파트에 들어서면 로코코 양식의 화려한 장식과 크리스탈 샹들리에가 눈을 사로잡고, 보물의 방에서는 역대 왕들의 황금 왕관과 보검을 직접 볼 수 있습니다. 지하에는 왕실 무기고와 고대 유물 박물관이 있어 스웨덴 왕실 천 년의 역사를 한곳에서 만나볼 수 있습니다. ' +
    '꿀팁을 드리자면, 근위병 교대식은 여름에는 매일 낮 12시 15분에 시작하니 최소 30분 전에 도착해서 궁전 앞 광장에 좋은 자리를 잡으시길 강력 추천합니다.';

  // Validate lengths
  console.log('--- Narration lengths ---');
  let allGood = true;
  for (const [uid, text] of Object.entries(koNarrations)) {
    const len = text.length;
    const status = len >= 600 && len <= 800 ? 'OK' : 'WARNING';
    console.log(`${uid}: ${len} chars [${status}]`);
    if (status === 'WARNING') allGood = false;
  }

  if (!allGood) {
    console.log('\nSome narrations are outside 600-800 range. Proceeding anyway...\n');
  }

  // Step 3: Update narrationI18n for each landmark
  console.log('\n=== Step 3: Update narrationI18n with ko key ===\n');

  for (const row of rows) {
    const lid = row.id as string;
    const koText = koNarrations[lid];

    if (!koText) {
      console.log(`[SKIP] ${lid} - no narration generated`);
      continue;
    }

    const existing = (row.narration_i18n as Record<string, string>) || {};
    const updated = { ...existing, ko: koText };

    await sql`
      UPDATE landmarks
      SET narration_i18n = ${JSON.stringify(updated)}::jsonb
      WHERE id = ${lid}
    `;

    console.log(`[OK] ${lid} - ko narration set (${koText.length} chars), keys: ${Object.keys(updated).join(', ')}`);
  }

  // Step 4: Verify
  console.log('\n=== Step 4: Verify ===\n');
  const verify = await sql`
    SELECT id,
           length(narration_i18n->>'ko') as ko_len
    FROM landmarks
    WHERE id = ANY(${TARGET_LANDMARKS})
    ORDER BY id
  `;

  for (const v of verify) {
    console.log(`${v.id}: ko_len=${v.ko_len}`);
  }

  console.log('\nDone!');
}

main().catch(console.error);
