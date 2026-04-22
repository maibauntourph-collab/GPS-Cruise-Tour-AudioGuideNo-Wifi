import fs from 'fs';
import path from 'path';

const LANDMARKS_PATH = path.resolve(process.cwd(), 'server/data/landmarks.ts');

// 50개 검증된 고화질 Unsplash 사진 풀
const PHOTO_POOL = [
    '1549463010-14ec428f60b0', '1552832230-c0197dd311b5', '1515542622106-78bda8ba0e5b', '1534351590666-13e3e96b5017',
    '1517713982677-4b66332f98de', '1467269204594-9661b134dd2b', '1539367628448-4bc5c9d170c8', '1476514525535-07fb3b4ae5f1',
    '1502602898757-d4b019760487', '1518391846015-55a9cc003b25', '1520175480921-4edfa0683001', '1493976040374-85c8e12f0c0e',
    '1514282401047-d79a71a590e8', '1533929736458-ca588d08c8be', '1516483638261-f4dbaf036963', '1534008897423-4809f6df849c',
    '1499856871958-5b9627545d1a', '1523906834658-6e24ef23a6f8', '1531572753322-ad063cecc140', '1504280390367-361c6d9f38f4',
    '1554481923-a6918bd997bc', '1490761668535-3147577ac2d9', '1480112424361-3685e13d1000', '1554151228-14d9def656e4',
    '1543783207-ec64e407044a', '1555685812-4b943f1cb0eb', '1506973035872-a4ec16b8e8d9', '1503899036084-c55cdd92da26',
    '1513581166391-8b7a96d740e2', '1468413253725-0d5242719ed0', '1520250497591-112f2f40a3f4', '1501785888041-af3ef285b470',
    '1519681393784-d120267933ba', '1512100356956-c1227c3464bb', '1507525428034-b723cf961d3e', '1510414842564-a33d2c3ef052',
    '1503220317375-aaad61436b1b', '1441974231531-c6227db76b6e', '1470770841072-ccad7fb29bd1', '1472393365324-9b2cdbc29b53',
    '1505761671935-60b3a74cc29a', '1506744038136-46273834b3fb', '1433085468226-530d6a50334b', '1533105071713-efac1f71d3eb',
    '1513635269975-59663e0ac1ad', '1511739001996-78eff79afaf5', '1526392060-da81dee17701', '1530122037915-1aee310dc291',
    '1536245201923-d3493e870020', '1524231754969-440d990bc740'
];

// 238개 명명된 랜드마크 — 파일의 실제 ID 순서(알파벳)
// 공식: cycle=floor(idx/50), pos=idx%50
//   photo1 = POOL[pos]
//   photo2 = POOL[(pos + cycle_offset) % 50]  (cycle_offsets: 17,23,31,13,7)
// → 같은 cycle 내 쌍은 모두 고유, 다른 cycle 간 photo2가 달라 쌍이 겹치지 않음
const NAMED_LANDMARKS_ORDERED: string[] = [
    'afternoon-tea-london', 'alaska_wildlife_center', 'anchorage_museum', 'anne_frank_house',
    'arc_triomphe', 'atomium', 'barcelona_구엘_공원_park_gell', 'barcelona_디스프루타르_disfrutar',
    'barcelona_사그라다_파밀리아_sagrada_familia', 'barcelona_프라이빗_선셋_요트_크루즈_private_sunset_',
    'basilica-santo-nino', 'batu-caves', 'batu-caves-tour', 'batu-caves-tour-kl',
    'big_ben', 'big-buddha-phuket', 'borghese-gift-shop-rome', 'british_museum',
    'buckingham_palace', 'bus_gamcheon', 'busan_f1963_복합문화공간_f1963', 'busan_감천문화마을_gamcheon_culture_villag',
    'busan_더베이_101_the_bay_101', 'busan_더베이_101_요트클럽_다이닝_the_bay_101_y',
    'busan_해동_용궁사_haedong_yonggungsa_temp', 'busan_해동용궁사_haedong_yonggungsa_templ',
    'casa_batllo', 'castel_santangelo', 'cebu-heritage-monument', 'cebu-island-hopping',
    'central-market-kl', 'chain_bridge', 'charles_bridge', 'chinatown-heritage-centre',
    'chinatown-night-market-kl', 'colosseum', 'colosseum-memories-rome', 'colosseum-underground-tour',
    'denali_national_park', 'eiffel_tower', 'fort-cornwallis', 'fort-san-pedro',
    'gaisano-grand-mall-talamban', 'gamla_stan', 'gardens-by-the-bay', 'gardens-by-the-bay-night',
    'gardens-light-show-singapore', 'georgetown-street-art', 'george-town-unesco-site', 'glacier_bay',
    // cycle 1 (idx 50-99)
    'grand_place', 'harry-potter-studio-tour', 'island-hopping-cebu',
    'jeju_밀본_제주_milbon_jeju', 'jeju_비자림', 'jeju_성산_일출봉', 'jeju_제주돌문화공원',
    'jeju_한라산_국립공원_어승생악_탐방로', 'karon-viewpoint', 'kawasan-canyoneering',
    'kek-lok-si-temple', 'kenai_fjords', 'khoo-kongsi', 'klcc-aquarium',
    'kl-food-street-tour', 'kl-tower', 'la-cittadella-subdivision', 'little_mermaid',
    'lon_big_ben', 'lon_tower_bridge', 'london_eye', 'london_restaurant_dishoom',
    'london_restaurant_hawksmoor', 'london_restaurant_padella', 'london_restaurant_st_john',
    'london_restaurant_the_ledbury', 'london_더_리츠_런던_애프터눈_티_afternoon_tea_a',
    'london_더_울즐리_the_wolseley', 'london_스케치_sketch_더_렉처_룸_라이브러리_the_le',
    'london_웨스트민스터_사원_westminster_abbey', 'london_웨스트민스터_애비_westminster_abbey',
    'london_템스강_프라이빗_선셋_크루즈_private_thames', 'london_포트넘_앤_메이슨_피카딜리_fortnum_mason_p',
    'london-eye-fast-track', 'louvre', 'louvre-skip-line-tour', 'magellans-cross',
    'marina-bay-sands', 'mendenhall_glacier', 'merlion-park', 'moulin-rouge-show',
    'musee_dorsay', 'national-museum-singapore', 'new-york_grand_central_terminal',
    'new-york_le_bernardin', 'new-york_tenement_museum', 'new-york_the_met_cloisters',
    'northern_lights_point', 'notre_dame',
    // cycle 2 (idx 100-149)
    'nyhavn', 'nyonya-cooking-class', 'old_town_square', 'old-phuket-town',
    'old-phuket-town-walk', 'oslo_opera_house', 'oslob-whale-shark', 'palace_of_culture',
    'pantheon', 'par_eiffel', 'par_louvre', 'paris_restaurant_chez_janou',
    'paris_restaurant_lami_jean', 'paris_restaurant_le_comptoir', 'paris_restaurant_pink_mamma',
    'paris_restaurant_septime', 'paris_르_상크_le_cinq_포시즌스_호텔_조르주_v_파리',
    'paris_베르사유_궁전_거울의_방_galerie_des_glac', 'paris_요트_드_파리_럭셔리_프라이빗_세느강_디너_크루즈',
    'paris-catacombs-tour', 'paris-wine-tasting', 'park_guell', 'parliament_building',
    'patong-beach', 'penang-hill', 'penang-hill-cable-car', 'penang-national-park',
    'penang-street-food-tour', 'penang-trishaw-tour', 'petronas-towers', 'phi-phi-islands',
    'phi-phi-island-tour', 'phuket-cooking-class', 'phuket-snorkeling-tour', 'phuket-sunset-cruise',
    'piazza-navona-crafts-rome', 'pinang-peranakan-mansion', 'prague_castle', 'rijksmuseum',
    'rom_colosseum', 'rom_trevi', 'roman_forum', 'roman-food-tour',
    'rome/aroma-restaurant', 'rome/borghese-gallery', 'rome_restaurant_antico_arco',
    'rome_restaurant_armando_al_pantheon', 'rome_restaurant_da_enzo',
    'rome_restaurant_flavio_al_velavevodetto', 'rome_restaurant_la_pergola',
    // cycle 3 (idx 150-199)
    'rome_restaurant_roscioli', 'rome_더_판테온_로마_the_pantheon_rome',
    'rome_바티칸_박물관_시스티나_예배당_vatican_museu',
    'rome_바티칸_박물관_시스티나_예배당_프라이빗_새벽_투어',
    'rome_바티칸_박물관_시스티나_예배당_프라이빗_이른_아침_투어',
    'rome_보르게세_미술관_보르게세_공원_galleria_borg', 'rome_아로마_레스토랑_팔라초_만프레디',
    'rome_아르만도_알_판테온_armando_al_pantheon', 'rome_아벤티노_열쇠_구멍_aventine_keyhole',
    'rome_젤라테리아_델_테아트로_gelateria_del_tea', 'rome_콜로세움_colosseum',
    'rome_콜로세움_로마_포럼_colosseum_roman_for', 'rome_트라토리아_다_엔조_알_29_trattoria_da_e',
    'rome_판테온_pantheon', 'rome-cooking-class', 'rome-vespa-tour',
    'sacre_coeur', 'sagrada_familia', 'san-isidro-parish-talamban', 'seine-river-cruise',
    'sentosa-island', 'seoul_경복궁_gyeongbokgung_palace', 'seoul_경복궁_경회루_gyeonghoeru_pavilion_g',
    'seoul_권숙수_kwon_sook_soo', 'seoul_리움미술관_leeum_museum_of_art',
    'seoul_북촌한옥마을_전통_차_체험_bukchon_hanok_v', 'seoul_정식당_서울_jungsik_seoul',
    'similan-islands', 'singapore_gardens_by_the_bay_supertree_g',
    'singapore_national_gallery_singapore', 'singapore_national_kitchen_by_violet_oon',
    'singapore_raffles_hotel_singapore', 'singapore-flyer', 'singapore-hawker-food-tour',
    'singapore-night-safari', 'singapore-river-cruise', 'sirao-flower-garden',
    'spanish_steps', 'st_pauls_cathedral', 'st_peters_basilica', 'talamban-post-office',
    'taoist-temple', 'taoist-temple-cebu', 'thames-river-cruise', 'thean-hou-temple',
    'tivoli_gardens', 'tokyo_sensoji_nanobanana', 'tokyo_긴자_', 'tokyo_긴자_코쥬_',
    // cycle 4 (idx 200-237)
    'tokyo_나리사와_narisawa', 'tokyo_메이지_진구_신사_', 'tokyo_시부야_스카이_시부야_스크램블_교차로_',
    'tokyo_팀랩_플래닛_도쿄_dmm_teamlab_planets_', 'tokyo_황궁_동어원_',
    'tops-lookout', 'tower_bridge', 'trastevere-artisan-shop-rome', 'trevi_fountain',
    'vasa_museum', 'vatican_museums', 'vatican-gifts-rome', 'vatican-night-tour',
    'versailles', 'viking_ship_museum', 'warsaw_old_town', 'wat-chalong',
    'west-end-theatre-show', 'westminster_abbey', 'whale-shark-watching-cebu',
    '뉴욕-demo-1', '뉴욕-demo-2', '도쿄-demo-1', '도쿄-demo-2',
    '런던-demo-1', '런던-demo-2', '로마-demo-1', '로마-demo-2',
    '바르셀로나-demo-1', '바르셀로나-demo-2', '부산광역시-demo-1', '부산광역시-demo-2',
    '서울특별시-demo-1', '서울특별시-demo-2', '싱가포르-demo-1', '싱가포르-demo-2',
    '제주특별자치도-demo-1', '제주특별자치도-demo-2',
];

// cycle별 photo2 오프셋 (소수 사용 → 쌍 충돌 방지)
const CYCLE_OFFSETS = [17, 23, 31, 13, 7];

function getNamedLandmarkPhotos(id: string): [string, string] | null {
    const idx = NAMED_LANDMARKS_ORDERED.indexOf(id);
    if (idx === -1) return null;
    const cycle = Math.floor(idx / 50);
    const pos = idx % 50;
    const offset = CYCLE_OFFSETS[cycle % CYCLE_OFFSETS.length];
    return [PHOTO_POOL[pos], PHOTO_POOL[(pos + offset) % 50]];
}

function stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

// 5가지 컨셉 크롭 파라미터 (같은 ID라도 시각적으로 다른 앵글 제공)
const CROP_CONCEPTS = [
    'entropy',   // 0: 전경 (가장 선명한 부분)
    'center',    // 1: 중앙 구도
    'top',       // 2: 상단 (건물 꼭대기·하늘)
    'bottom',    // 3: 하단 (전경·바닥)
    'faces',     // 4: 인물·디테일
];

function makeUrl(photoId: string, sig: number, cropIdx: number = 0): string {
    const crop = CROP_CONCEPTS[cropIdx % CROP_CONCEPTS.length];
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&crop=${crop}&q=80&w=1200&sig=${sig}`;
}

function updateLandmarksFromFile() {
    console.log('Reading landmarks.ts (V4 — 5장, 컨셉별 크롭, named 고유)...');
    let content = fs.readFileSync(LANDMARKS_PATH, 'utf-8');

    const photoBlockRegex = /"photos":\s*\[\s*([\s\S]*?)\s*\]/g;

    let namedCount = 0;
    let genericCount = 0;
    let skippedCount = 0;

    const updatedContent = content.replace(photoBlockRegex, (match, photoList, offset) => {
        if (photoList.includes('/images/countries/') || photoList.includes('googleusercontent')) {
            skippedCount++;
            return match;
        }

        const context = content.slice(Math.max(0, offset - 5000), offset);
        const allIdMatches = [...context.matchAll(/"id":\s*"([^"]+)"/g)];
        const idMatch = allIdMatches.length > 0 ? allIdMatches[allIdMatches.length - 1] : null;
        const id = idMatch ? idMatch[1] : '';

        const specific = getNamedLandmarkPhotos(id);

        // 5장 생성: 고유 named의 경우 pool 슬롯 2개 × 크롭 컨셉 5개 혼합
        const urls: string[] = [];

        if (specific) {
            namedCount++;
            // photo1: 3가지 컨셉, photo2: 2가지 컨셉 → 총 5장
            for (let i = 0; i < 3; i++) {
                urls.push(makeUrl(specific[0], stringToHash(id + `c${i}`), i));
            }
            for (let i = 0; i < 2; i++) {
                urls.push(makeUrl(specific[1], stringToHash(id + `d${i}`), i + 3));
            }
        } else {
            // generic: pool 3개 ID × 크롭 혼합
            genericCount++;
            const h0 = stringToHash(id + '0');
            const h1 = stringToHash(id + '1');
            const h2 = stringToHash(id + '2');
            const p0 = PHOTO_POOL[h0 % 50];
            const p1 = PHOTO_POOL[h1 % 50];
            const p2 = PHOTO_POOL[h2 % 50];
            urls.push(makeUrl(p0, h0, 0));
            urls.push(makeUrl(p1, h1, 1));
            urls.push(makeUrl(p2, h2, 2));
            urls.push(makeUrl(p0, h0 + 1, 3));
            urls.push(makeUrl(p1, h1 + 1, 4));
        }

        const inner = urls.map(u => `"${u}"`).join(',\n      ');
        return `"photos": [\n      ${inner}\n    ]`;
    });

    fs.writeFileSync(LANDMARKS_PATH, updatedContent);
    console.log(`✅ Named (5장 고유):  ${namedCount}`);
    console.log(`   Generic (5장 해시): ${genericCount}`);
    console.log(`   Skipped (특수):     ${skippedCount}`);
    console.log(`   Total:              ${namedCount + genericCount + skippedCount}`);
}

try {
    updateLandmarksFromFile();
} catch (err) {
    console.error('Update failed:', err);
}
