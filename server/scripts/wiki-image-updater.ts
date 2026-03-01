import { db } from "../db";
import { landmarks } from "../../shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
    const headers = { 'User-Agent': 'KennethCruiseTourTracker/1.0 (Contact: admin@example.com)' };
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) return null;
            return await res.json();
        } catch (err: any) {
            if (i === retries - 1) return null;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return null;
}

// Extinfo property grabs license info (extmetadata)
async function fetchWikiImageDetails(query: string, lang: string = 'ko'): Promise<{ url: string, license: string, artist: string } | null> {
    try {
        const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
        const searchData = await fetchWithRetry(searchUrl);

        if (!searchData || !searchData[1] || searchData[1].length === 0) return null;
        const targetTitle = searchData[1][0];

        // 1. Get main image file name
        const imgUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(targetTitle)}&prop=pageimages&format=json&pithumbsize=800`;
        const imgData = await fetchWithRetry(imgUrl);
        const pages = imgData?.query?.pages;
        if (!pages) return null;

        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (!page?.pageimage || !page?.thumbnail?.source) return null;

        const sourceUrl = page.thumbnail.source;
        const filename = page.pageimage;

        // 2. Query imageinfo for license metadata
        const infoUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=extmetadata&format=json`;
        const infoData = await fetchWithRetry(infoUrl);
        const infoPages = infoData?.query?.pages;

        let licenseShortName = "Unknown";
        let artist = "Unknown";

        if (infoPages) {
            const infoPageId = Object.keys(infoPages)[0];
            const imageInfo = infoPages[infoPageId]?.imageinfo?.[0];
            if (imageInfo && imageInfo.extmetadata) {
                licenseShortName = imageInfo.extmetadata.LicenseShortName?.value || "Public Domain/CC";
                artist = imageInfo.extmetadata.Artist?.value?.replace(/<[^>]*>?/gm, '') || "Unknown"; // strip HTML
            }
        }

        return { url: sourceUrl, license: licenseShortName, artist };
    } catch (ex) {
        return null;
    }
}

async function fetchWikiImage(query: string): Promise<{ url: string, license: string, artist: string } | null> {
    const koResult = await fetchWikiImageDetails(query, 'ko');
    if (koResult) return koResult;
    return await fetchWikiImageDetails(query, 'en');
}

async function updateMissingImages() {
    console.log("Starting DB update with Wikipedia CC images...");
    try {
        const allLandmarks = await db.select().from(landmarks);
        const missingLandmarks = allLandmarks.filter(lm => {
            const photos = lm.photos as string[] | null;
            return !photos || photos.length === 0 || photos.some(p => p.includes('placeholder.png'));
        });

        let reportMd = `# 랜드마크 위키백과 CC 이미지 자동 채우기 보고서\n\n`;
        reportMd += `총 대상: **${missingLandmarks.length}개**\n\n`;
        reportMd += `| ID | 본래 지명 | 검색키워드 | 이미지 (CC License) | 저작자/출처 |\n`;
        reportMd += `|---|---|---|---|---|\n`;

        let matchedCount = 0;

        for (let i = 0; i < missingLandmarks.length; i++) {
            const lm = missingLandmarks[i];
            const koName = String(lm.translations?.ko?.name || lm.name || lm.cityId);

            let searchQuery = koName;
            if (searchQuery.includes('프리미엄') || searchQuery.includes('추천') || searchQuery.includes('demo') || searchQuery.includes('맛집 골목') || searchQuery.includes('숨겨진 보석')) {
                const lookup: Record<string, string> = {
                    'new-york': '뉴욕 관광지',
                    'rome': '로마 관광지',
                    'seoul': '서울 관광지',
                    'jeju': '제주도 관광지',
                    'london': '런던 관광지',
                    'tokyo': '도쿄 관광지',
                    'singapore': '싱가포르 관광지',
                    'paris': '파리 관광지',
                    'barcelona': '바르셀로나 관광지'
                };
                searchQuery = lookup[lm.cityId] || lm.cityId;
            }

            let imgData = await fetchWikiImage(searchQuery);
            if (!imgData && searchQuery !== lm.cityId) {
                imgData = await fetchWikiImage(lm.cityId);
                if (imgData) searchQuery = lm.cityId;
            }

            if (imgData) {
                matchedCount++;
                reportMd += `| \`${lm.id}\` | ${koName} | ${searchQuery} | <img src="${imgData.url}" width="100"/><br/>[Link](${imgData.url})<br/>**${imgData.license}** | ${imgData.artist} |\n`;

                await db.update(landmarks)
                    .set({ photos: [imgData.url] })
                    .where(eq(landmarks.id, lm.id));

                console.log(`[${i + 1}/${missingLandmarks.length}] ✅ UPDATED: ${koName} (${imgData.license})`);
            } else {
                reportMd += `| \`${lm.id}\` | ${koName} | ${searchQuery} | ❌ 실패 | ❌ |\n`;
                console.log(`[${i + 1}/${missingLandmarks.length}] ❌ FAILED: ${koName}`);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        reportMd += `\n\n## 📊 요약\n- DB 업데이트 성공: **${matchedCount}개**\n- 실패: **${missingLandmarks.length - matchedCount}개**\n`;

        const artifactPath = "C:\\Users\\jitne\\.gemini\\antigravity\\brain\\c33ff804-7bc6-4357-9b75-f096868caf33\\wiki_image_cc_report.md";
        fs.writeFileSync(artifactPath, reportMd, 'utf8');

        console.log(`\n✅ 완료! 라이선스 보고서 저장됨: ${artifactPath}`);
    } catch (error) {
        console.error("Critical Error:", error);
    } finally {
        process.exit(0);
    }
}

updateMissingImages();
