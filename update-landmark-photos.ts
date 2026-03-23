/**
 * update-landmark-photos.ts
 * landmarks 테이블의 photos 컬럼을 Unsplash/Pexels 이미지 URL로 업데이트
 * 
 * 실행: npx tsx update-landmark-photos.ts
 * 필요: npm install @neondatabase/serverless dotenv
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

// ============================================================
// 설정값 (필요시 수정)
// ============================================================
const PHOTOS_PER_LANDMARK = 5;          // 장소당 사진 수
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY!;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY!;
const BATCH_SIZE = 50;                  // DB 업데이트 배치 크기
const API_DELAY_MS = 300;               // API 호출 간격 (rate limit 방지)

// ============================================================
// 카테고리 → 검색 키워드 매핑
// 복합 카테고리(Landmark | Activity)는 | 기준으로 첫 번째 사용
// ============================================================
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // 핵심 카테고리
  "Activity": ["korea outdoor activity", "korea tourism experience"],
  "Landmark": ["korea famous landmark", "korea tourist attraction"],
  "Restaurant": ["korean restaurant interior", "korea food dining"],
  "Shopping": ["korea shopping market street", "korea retail store"],
  "Religious": ["korea temple shrine", "korean buddhist temple"],
  "Monument": ["korea monument memorial", "korea historic monument"],
  "Museum": ["korea museum gallery", "museum exhibition"],
  "Gift Shop": ["korea souvenir shop", "gift shop interior"],

  // 확장 카테고리
  "Ancient Rome": ["ancient rome ruins", "roman architecture ruins"],
  "Cultural Heritage": ["cultural heritage site", "traditional heritage"],
  "Historic District": ["historic district street", "old town architecture"],
  "Historical": ["historical landmark site", "historic building"],
  "National Park": ["national park nature", "korea nature landscape"],
  "Religious Site": ["religious site temple", "sacred place architecture"],
  "Shop": ["retail shop store", "boutique shop"],
  "Architecture": ["modern architecture building", "architectural design"],
  "Cathedral": ["cathedral church architecture", "gothic cathedral interior"],
  "Historic Bridge": ["historic bridge landmark", "old stone bridge"],
  "Historic Square": ["historic square plaza", "old city square"],
  "Maritime Museum": ["maritime museum ship", "naval museum exhibition"],
  "Modern Architecture": ["modern architecture skyscraper", "contemporary building"],
  "Museum & Heritage": ["museum heritage exhibition", "cultural museum"],
  "Natural Wonder": ["natural wonder landscape", "scenic nature view"],
  "Palace": ["palace royal architecture", "historic palace"],
  "Viewpoint": ["scenic viewpoint panorama", "city overlook view"],
  "Amusement Park": ["amusement park rides", "theme park attraction"],
  "Art Museum": ["art museum gallery interior", "contemporary art museum"],
  "Attraction": ["tourist attraction famous", "popular sightseeing"],
  "Beach & Entertainment": ["beach resort entertainment", "tropical beach"],
  "Bridge": ["famous bridge landmark", "bridge architecture"],
  "Cultural & Shopping": ["cultural shopping district", "traditional market"],
  "Cultural Building": ["cultural building architecture", "arts center"],
  "Fortress": ["fortress castle walls", "historic fortress"],
  "Fountain": ["fountain plaza square", "decorative fountain"],
  "Garden & Nature": ["garden nature botanical", "japanese garden"],
  "Government Building": ["government building architecture", "civic building"],
  "Historic Castle": ["historic castle medieval", "castle architecture"],
  "Historical Site": ["historical site ruins", "ancient site"],
  "Island & Beach": ["island beach tropical", "scenic island"],
  "Island & Marine Park": ["marine park coral reef", "island marine"],
  "Island Resort": ["island resort luxury", "resort destination"],
  "Nature & Park": ["nature park scenery", "park landscape"],
  "Nature & Viewpoint": ["nature viewpoint scenic", "mountain viewpoint"],
  "Observation": ["observation deck view", "observation tower"],
  "Observation & Modern Architecture": ["observation tower modern", "skyline view"],
  "Opera House": ["opera house performing arts", "concert hall architecture"],
  "Park": ["urban park garden", "city park landscape"],
  "Park & Garden": ["park garden botanical", "landscape garden"],
  "Public Service": ["public building service", "community center"],
  "Religious & Natural": ["nature religious site", "scenic temple"],
  "Religious & Viewpoint": ["hilltop temple viewpoint", "religious site panorama"],
  "Residential": ["traditional residential area", "historic neighborhood"],
  "UNESCO Heritage": ["UNESCO world heritage", "world heritage site"],
  "Wildlife Sanctuary": ["wildlife sanctuary animals", "nature wildlife park"],

  // 기본 폴백
  "default": ["korea travel tourism", "korea sightseeing"],
};

// ============================================================
// 유틸리티
// ============================================================
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 복합 카테고리 정규화: "Landmark | Activity" → "Landmark"
function normalizeCategory(category: string): string {
  if (!category) return "default";
  const first = category.split("|")[0].trim();
  return CATEGORY_KEYWORDS[first] ? first : "default";
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

// ============================================================
// Unsplash API (1차)
// ============================================================
const unsplashCache: Record<string, string[]> = {};

async function fetchUnsplashImages(keyword: string, count = 15): Promise<string[]> {
  if (unsplashCache[keyword]) return unsplashCache[keyword];
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const data = await res.json();
    const urls: string[] = data.results.map((r: any) => r.urls.regular);
    unsplashCache[keyword] = urls;
    console.log(`  ✅ Unsplash [${keyword}]: ${urls.length}개`);
    return urls;
  } catch (e) {
    console.warn(`  ⚠️  Unsplash 실패 [${keyword}]:`, e);
    return [];
  }
}

// ============================================================
// Pexels API (2차 폴백)
// ============================================================
const pexelsCache: Record<string, string[]> = {};

async function fetchPexelsImages(keyword: string, count = 15): Promise<string[]> {
  if (pexelsCache[keyword]) return pexelsCache[keyword];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) throw new Error(`Pexels ${res.status}`);
    const data = await res.json();
    const urls: string[] = data.photos.map((p: any) => p.src.large);
    pexelsCache[keyword] = urls;
    console.log(`  ✅ Pexels [${keyword}]: ${urls.length}개`);
    return urls;
  } catch (e) {
    console.warn(`  ⚠️  Pexels 실패 [${keyword}]:`, e);
    return [];
  }
}

// ============================================================
// 카테고리별 이미지 풀 미리 구성 (핵심 최적화!)
// API 호출 횟수: 카테고리 수 × 2 (약 100회) → 375개 처리
// ============================================================
async function buildImagePool(): Promise<Record<string, string[]>> {
  console.log("\n📦 이미지 풀 구성 시작...\n");
  const pool: Record<string, string[]> = {};

  // DB에 실제 존재하는 카테고리만 처리
  const rows = await sql`
    SELECT DISTINCT category FROM landmarks WHERE category IS NOT NULL
  `;
  const existingCategories = rows.map((r: any) => r.category);

  for (const rawCategory of existingCategories) {
    const normalized = normalizeCategory(rawCategory);
    if (pool[normalized]) continue; // 이미 처리됨

    const keywords = CATEGORY_KEYWORDS[normalized] || CATEGORY_KEYWORDS["default"];
    const images: string[] = [];

    for (const kw of keywords) {
      // Unsplash 먼저
      const unsplashImgs = await fetchUnsplashImages(kw, 15);
      images.push(...unsplashImgs);
      await delay(API_DELAY_MS);

      // Unsplash 부족하면 Pexels 추가
      if (images.length < 20) {
        const pexelsImgs = await fetchPexelsImages(kw, 15);
        images.push(...pexelsImgs);
        await delay(API_DELAY_MS);
      }
    }

    pool[normalized] = [...new Set(images)]; // 중복 제거
    console.log(`  🗂️  [${normalized}] 풀: ${pool[normalized].length}개 이미지\n`);
  }

  return pool;
}

// ============================================================
// 메인 업데이트 로직
// ============================================================
async function updateLandmarkPhotos() {
  console.log("🚀 landmarks photos 업데이트 시작\n");

  // 1. 이미지 풀 구성 (API 호출 최소화)
  const imagePool = await buildImagePool();

  // 2. 업데이트 필요한 landmarks 조회
  const landmarks = await sql`
    SELECT id, name, category
    FROM landmarks
    WHERE 
      photos IS NULL 
      OR photos::text = 'null'
      OR photos::text = '[]'
      OR photos::text LIKE '%placeholder%'
    ORDER BY category, id
  `;

  console.log(`\n🔍 업데이트 필요: ${landmarks.length}개\n`);

  // 3. 카테고리별 인덱스 (순환 배분)
  const categoryIndex: Record<string, number> = {};
  const updates: { id: string; photos: string }[] = [];

  for (const lm of landmarks) {
    const normalized = normalizeCategory(lm.category);
    const pool = imagePool[normalized] || imagePool["default"] || [];

    if (pool.length === 0) {
      console.warn(`  ⚠️  [${lm.id}] 이미지 풀 없음`);
      continue;
    }

    // 순환 배분으로 다양성 확보
    const startIdx = (categoryIndex[normalized] || 0) % pool.length;
    categoryIndex[normalized] = startIdx + PHOTOS_PER_LANDMARK;

    const selectedPhotos: string[] = [];
    for (let i = 0; i < PHOTOS_PER_LANDMARK; i++) {
      selectedPhotos.push(pool[(startIdx + i) % pool.length]);
    }

    updates.push({
      id: lm.id,
      photos: JSON.stringify(selectedPhotos),
    });
  }

  // 4. 배치 DB 업데이트 (개별 쿼리 X → 배치로 처리)
  console.log(`\n💾 DB 업데이트 시작 (배치 크기: ${BATCH_SIZE})...\n`);
  const batches = chunkArray(updates, BATCH_SIZE);

  let totalUpdated = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      for (const item of batch) {
        await sql`
          UPDATE landmarks 
          SET photos = ${item.photos}::json,
              updated_at = NOW()
          WHERE id = ${item.id}
        `;
      }
      totalUpdated += batch.length;
      console.log(`  ✅ 배치 ${i + 1}/${batches.length} 완료 (${totalUpdated}/${updates.length})`);
    } catch (e) {
      console.error(`  ❌ 배치 ${i + 1} 실패:`, e);
    }
  }

  // 5. 결과 리포트
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 완료!
   업데이트: ${totalUpdated}개
   스킵:     ${landmarks.length - totalUpdated}개
   총 사진:  ${totalUpdated * PHOTOS_PER_LANDMARK}개 URL 저장
━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

// ============================================================
// 검증 함수 (실행 후 확인용)
// ============================================================
async function verifyResults() {
  const result = await sql`
    SELECT 
      category,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE photos IS NOT NULL AND photos::text != 'null' AND photos::text != '[]') as has_photos,
      COUNT(*) FILTER (WHERE photos IS NULL OR photos::text = 'null' OR photos::text = '[]') as no_photos
    FROM landmarks
    GROUP BY category
    ORDER BY total DESC
  `;

  console.log("\n📊 업데이트 결과:\n");
  console.table(result);
}

// ============================================================
// 실행
// ============================================================
const args = process.argv.slice(2);
if (args.includes("--verify")) {
  verifyResults().catch(console.error);
} else {
  updateLandmarkPhotos()
    .then(verifyResults)
    .catch(console.error);
}
