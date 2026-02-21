import { db } from "../db";
import { landmarks, cities } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * [마케터 쏭의 SNS 최적화 특강: 'Dynamic OG Tag Engine']
 * 
 * 안녕 학생 여러분! 우리가 만든 링크를 카카오톡이나 인스타그램에 올렸을 때,
 * 예쁜 사진과 제목이 자동으로 짠! 하고 나타나는 걸 본 적 있지?
 * 그게 바로 HTML의 `meta property="og:..."` 태그 덕분이란다.
 * 
 * 이 `OgService`는 링크 주소가 바뀔 때마다 그 주소에 딱 맞는(명소 이름, 명소 사진 등)
 * 메타 태그를 실시간으로 만들어서 HTML 페이지에 심어주는 역할을 해.
 * 
 * ⚠️ [마케터 쏭 감사 수정] XSS 방어를 위한 HTML 이스케이프 함수 추가
 */

/**
 * [마케터 쏭 감사 수정] HTML 특수문자 이스케이프 함수
 * DB에서 가져온 문자열에 `"`, `<`, `>` 등이 포함되면
 * 메타 태그 속성을 깨뜨려 XSS 공격에 노출될 수 있습니다.
 * 이 함수로 모든 동적 값을 안전하게 인코딩합니다.
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export class OgService {
    /**
     * 접속한 URL 주소를 분석해서 맞춤형 메타 태그를 생성합니다.
     * @param url 현재 사용자가 접속하려고 시도하는 주소 (예: /landmark/namsan-tower)
     */
    async generateMetaTags(url: string) {
        // 1. URL 패턴 분석 (정규표현식을 사용해요)
        const landmarkIdMatch = url.match(/\/landmark\/([^\/?#]+)/);
        const cityIdMatch = url.match(/\/city\/([^\/?#]+)/);

        // [기본값 설정] 만약 특정 명소 주소가 아니라면 보여줄 기본 정보들이야.
        let title = "SNS Cruise Tour Audio Guide";
        let description = "No-WiFi GPS Cruise Tour Audio Guide - Your perfect travel companion.";
        let imageUrl = "https://nowifigps.tours/og-default.png"; // 플랫폼 로고나 대표 이미지

        // 2. DB에서 실제 데이터 찾아오기
        if (landmarkIdMatch) {
            // 명소 주소인 경우 (예: /landmark/123)
            const landmarkId = landmarkIdMatch[1];
            const [landmark] = await db.select().from(landmarks).where(eq(landmarks.id, landmarkId));

            if (landmark) {
                // [마케터 쏭 감사 수정] name은 varchar(string)이므로 직접 사용
                // 기존: landmark.name.ko || landmark.name.en (오류 — name은 객체가 아님)
                // 수정: landmark.name 직접 사용 + translations에서 한국어 가져오기
                const translations = landmark.translations as Record<string, any> | null;
                const localizedName = translations?.ko?.name || landmark.name;
                const localizedDesc = translations?.ko?.description || landmark.description || description;

                title = `${localizedName} | GPS Cruise Tour`;
                description = localizedDesc;

                // [마케터 쏭 감사 수정] imageUrl 대신 photos 배열의 첫 번째 사용
                // 기존: landmark.imageUrl (스키마에 해당 컬럼 없음)
                // 수정: photos JSON 배열에서 가져오기
                const photos = landmark.photos as string[] | null;
                if (photos && photos.length > 0) {
                    imageUrl = photos[0];
                }
            }
        } else if (cityIdMatch) {
            // 도시 주소인 경우 (예: /city/cebu)
            const cityId = cityIdMatch[1];
            const [city] = await db.select().from(cities).where(eq(cities.id, cityId));

            if (city) {
                title = `${city.name} 여행 가이드 | GPS Cruise Tour`;
                description = `${city.name}의 숨은 재미를 오디오 가이드로 발견해보세요.`;
                // 도시에는 imageUrl이 없으므로 기본 이미지 유지
            }
        }

        // [마케터 쏭 감사 수정] 모든 동적 값을 HTML 이스케이프 처리!
        const safeTitle = escapeHtml(title);
        const safeDescription = escapeHtml(description);
        const safeImageUrl = escapeHtml(imageUrl);
        const safeUrl = escapeHtml(url);

        // 3. SNS 로봇들이 읽기 좋아하는 형식(HTML Meta Tags)으로 결과물 반환!
        return `
      <!-- Dr.'s Engine이 실시간으로 생성한 멋진 메타 태그들이야! -->
      <title>${safeTitle}</title>
      <meta name="description" content="${safeDescription}">
      <meta property="og:title" content="${safeTitle}">
      <meta property="og:description" content="${safeDescription}">
      <meta property="og:image" content="${safeImageUrl}">
      <meta property="og:url" content="https://nowifigps.tours${safeUrl}">
      <meta property="og:type" content="website">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${safeTitle}">
      <meta name="twitter:description" content="${safeDescription}">
      <meta name="twitter:image" content="${safeImageUrl}">
    `;
    }

    /**
     * 만들어진 메타 태그를 실제 index.html 소스코드에 쏙 끼워넣는 함수야.
     * @param html 원본 index.html 내용
     * @param url 사용자가 보고 있는 주소
     */
    async injectMetaTags(html: string, url: string) {
        const metaTags = await this.generateMetaTags(url);

        // index.html 안에 우리가 미리 만들어둔 플레이스홀더를 찾아내서 교체(Replace)해버려.
        if (html.includes("<!-- OG_TAGS_PLACEHOLDER -->")) {
            return html.replace("<!-- OG_TAGS_PLACEHOLDER -->", metaTags);
        }

        // 만약 플레이스홀더가 없다면, <head> 태그가 시작되는 바로 다음 지점에 살짝 끼워넣자!
        return html.replace("<head>", `<head>${metaTags}`);
    }
}

export const ogService = new OgService();
