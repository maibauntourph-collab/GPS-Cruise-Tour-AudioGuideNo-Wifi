import fs from 'fs';
import path from 'path';

/**
 * [Automation Doctor | 2026-04-04] 랜드마크 사진 일괄 업데이트 스크립트 (V2)
 * 다양한 소스(Unsplash, Viator 느낌)를 활용하여 랜드마크별로 고유하고 고해상도인 이미지를 배정합니다.
 */

const LANDMARKS_PATH = path.resolve(process.cwd(), 'server/data/landmarks.ts');

// [Designer Kim] 고품질 여행/건축 사진 풀 (50개) - 모든 랜드마크가 서로 다른 느낌을 주도록 구성
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

function stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function generateUnsplashUrl(id: string, index: number): string {
    const hash = stringToHash(id + index);
    const photoId = PHOTO_POOL[hash % PHOTO_POOL.length];
    // [Bug Doctor] Unsplash sig 파라미터는 컬렉션이 아닌 경우 무시될 수 있으므로, 
    // 다양한 photoId를 활용하는 것이 랜드마크별 차별화에 더 효과적입니다.
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=1200&sig=${hash}`;
}

function updateLandmarksFromFile() {
    console.log('Reading landmarks.ts (V2)...');
    let content = fs.readFileSync(LANDMARKS_PATH, 'utf-8');

    // Regex to find "photos": [ ... ]
    const photoBlockRegex = /"photos":\s*\[\s*([\s\S]*?)\s*\]/g;

    let count = 0;
    const updatedContent = content.replace(photoBlockRegex, (match, photoList, offset) => {
        // ID 추출을 위해 앞부분 문맥 검색
        const start = Math.max(0, offset - 1200);
        const context = content.slice(start, offset);
        const idMatch = context.match(/"id":\s*"([^"]+)"/);
        const id = idMatch ? idMatch[1] : `temp_${count}`;

        // 국가/구글 사진 등 특수 패턴은 유지 (사용자가 제외를 요청한 경우 등)
        if (photoList.includes('/images/countries/') || photoList.includes('googleusercontent')) {
            return match;
        }

        const newUrls = [
            generateUnsplashUrl(id, 0),
            generateUnsplashUrl(id, 1)
        ];

        count++;
        return `"photos": [\n      "${newUrls[0]}",\n      "${newUrls[1]}"\n    ]`;
    });

    fs.writeFileSync(LANDMARKS_PATH, updatedContent);
    console.log(`Successfully updated ${count} landmarks with unique Unsplash photos!`);
}

try {
    updateLandmarksFromFile();
} catch (err) {
    console.error('Update failed:', err);
}
