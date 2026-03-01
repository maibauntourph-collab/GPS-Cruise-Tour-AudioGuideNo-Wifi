import { db } from "../db";
import { landmarks } from "../../shared/schema";
import fs from "fs";
import path from "path";

async function fetchWikiImage(query: string): Promise<string | null> {
    try {
        const headers = { 'User-Agent': 'KennethCruiseTourTracker/1.0 (Contact: admin@example.com)' };
        const searchUrl = `https://ko.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
        const searchRes = await fetch(searchUrl, { headers });
        if (!searchRes.ok) return null;
        const searchData = await searchRes.json();

        let targetTitle = query;
        if (!searchData[1] || searchData[1].length === 0) {
            const engSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
            const engSearchRes = await fetch(engSearchUrl, { headers });
            if (!engSearchRes.ok) return null;
            const engSearchData = await engSearchRes.json();

            if (!engSearchData[1] || engSearchData[1].length === 0) return null;
            targetTitle = engSearchData[1][0];
        } else {
            targetTitle = searchData[1][0];
        }

        const imgUrl = `https://ko.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(targetTitle)}&prop=pageimages&format=json&pithumbsize=800`;
        const imgRes = await fetch(imgUrl, { headers });
        if (!imgRes.ok) return null;
        const imgData = await imgRes.json();

        const pages = imgData?.query?.pages;
        if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pages[pageId]?.thumbnail?.source) {
                return pages[pageId].thumbnail.source;
            }
        }

        const engImgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(targetTitle)}&prop=pageimages&format=json&pithumbsize=800`;
        const engImgRes = await fetch(engImgUrl, { headers });
        if (!engImgRes.ok) return null;
        const engImgData = await engImgRes.json();

        const engPages = engImgData?.query?.pages;
        if (engPages) {
            const engPageId = Object.keys(engPages)[0];
            if (engPages[engPageId]?.thumbnail?.source) {
                return engPages[engPageId].thumbnail.source;
            }
        }

        return null;
    } catch (error) {
        console.error(`Wikipedia API Error for ${query}:`, error);
        return null;
    }
}

async function generateWikiImageReport() {
    console.log("Starting Wikipedia image mapping...");
    try {
        const allLandmarks = await db.select().from(landmarks);

        const missingLandmarks = allLandmarks.filter(lm => {
            const photos = lm.photos as string[] | null;
            return !photos || photos.length === 0 || photos.some(p => p.includes('placeholder.png'));
        });

        console.log(`Found ${missingLandmarks.length} landmarks needing images.`);

        let reportMd = `# 랜드마크 위키백과 이미지 매핑 보고서\n\n`;
        reportMd += `총 대상: **${missingLandmarks.length}개**\n\n`;
        reportMd += `| ID | 도시 | 지명 (검색어) | 찾은 이미지 URL | 바로보기 |\n`;
        reportMd += `|---|---|---|---|---|\n`;

        let matchedCount = 0;

        for (let i = 0; i < missingLandmarks.length; i++) {
            const lm = missingLandmarks[i];
            const koName = String(lm.translations?.ko?.name || lm.name || lm.cityId);

            let searchQuery = koName;
            // 더미 데이터 대응
            if (searchQuery.includes('프리미엄') || searchQuery.includes('추천') || searchQuery.includes('demo') || searchQuery.includes('맛집 골목') || searchQuery.includes('숨겨진 보석')) {
                searchQuery = lm.cityId; // 도시 이름으로 대체 검색
            }

            console.log(`[${i + 1}/${missingLandmarks.length}] Fetching for: ${koName} (Query: ${searchQuery})`);

            let imgUrl = await fetchWikiImage(searchQuery);

            if (!imgUrl && searchQuery !== lm.cityId) {
                // 검색 실패시, 도시 이름으로 fallback 검색
                imgUrl = await fetchWikiImage(lm.cityId);
                if (imgUrl) {
                    searchQuery = lm.cityId; // 표시용 쿼리 업데이트
                }
            }

            if (imgUrl) {
                matchedCount++;
                const isFallback = (searchQuery === lm.cityId && koName !== lm.cityId) ? `⚠️(대체: ${lm.cityId})` : '';
                reportMd += `| \`${lm.id}\` | ${lm.cityId} | ${koName} ${isFallback} | [Image Link](${imgUrl}) | <img src="${imgUrl}" width="100"/> |\n`;
            } else {
                reportMd += `| \`${lm.id}\` | ${lm.cityId} | ${koName} | ❌ 실패 | ❌ |\n`;
            }

            // 너무 빠른 요청 방지 (Rate Limit 보호)
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        reportMd += `\n\n## 📊 요약\n- 매핑 성공 (대체 포함): **${matchedCount}개**\n- 매핑 실패: **${missingLandmarks.length - matchedCount}개**\n`;

        // Save to artifacts directory directly for user review
        const artifactPath = "C:\\Users\\jitne\\.gemini\\antigravity\\brain\\c33ff804-7bc6-4357-9b75-f096868caf33\\wiki_image_mapping.md";
        fs.writeFileSync(artifactPath, reportMd, 'utf8');

        console.log(`\n✅ 완료! 보고서가 아티팩트로 저장되었습니다.`);
        console.log(`성공: ${matchedCount} / ${missingLandmarks.length}`);

    } catch (error) {
        console.error("Critical Error:", error);
    } finally {
        process.exit(0);
    }
}

generateWikiImageReport();
