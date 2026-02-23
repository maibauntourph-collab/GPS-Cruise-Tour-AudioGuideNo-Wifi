
const fs = require('fs');
const path = require('path');

/**
 * [Query Master] Landmark Data Integrity Cleanup Script
 * 목적: 좌표가 (0,0)이거나 사진이 없는 부실 데이터를 식별하여 리포트를 생성합니다.
 */

// 실행 경로 기준으로 파일 위치 설정
const landmarksPath = path.join(process.cwd(), 'server', 'data', 'landmarks.ts');

try {
    const content = fs.readFileSync(landmarksPath, 'utf8');

    // JSON 배열 부분 추출 (단순 정규식 사용)
    const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!match) {
        console.error("Could not find the landmarks array in the file.");
        process.exit(1);
    }

    // 파일이 .ts이므로 JSON.parse를 위해 문자열 정제가 필요할 수 있음
    // 하지만 landmarks.ts는 보통 객체 리터럴이므로 직접 eval 하거나 루프를 돌며 체크
    // 여기서는 안전하게 문자열 기반으로 분석합니다.

    const landmarkStrings = content.split('},').filter(s => s.trim().length > 10);

    const reporting = {
        zeroCoordinates: [],
        missingPhotos: [],
        placeholderPhotos: [],
        summary: {
            totalChecked: landmarkStrings.length,
            zeroCoordsCount: 0,
            missingPhotosCount: 0,
            placeholderCount: 0
        }
    };

    landmarkStrings.forEach(str => {
        const idMatch = str.match(/"id":\s*"([^"]+)"/);
        const nameMatch = str.match(/"name":\s*"([^"]+)"/);
        const latMatch = str.match(/"lat":\s*([\d.-]+)/);
        const lngMatch = str.match(/"lng":\s*([\d.-]+)/);
        const photosMatch = str.match(/"photos":\s*\[([^\]]*)\]/);

        if (!idMatch) return;

        const id = idMatch[1];
        const name = nameMatch ? nameMatch[1] : "Unknown";
        const lat = latMatch ? parseFloat(latMatch[1]) : null;
        const lng = lngMatch ? parseFloat(lngMatch[1]) : null;
        const photosStr = photosMatch ? photosMatch[1] : "";

        // 1. 좌표 (0,0) 체크
        if (lat === 0 && lng === 0) {
            reporting.zeroCoordinates.push({ id, name });
            reporting.summary.zeroCoordsCount++;
        }

        // 2. 사진 부재 체크
        if (!photosStr || photosStr.trim() === "") {
            reporting.missingPhotos.push({ id, name });
            reporting.summary.missingPhotosCount++;
        }

        // 3. 플레이스홀더 체크
        if (photosStr.includes('placeholder.png')) {
            reporting.placeholderPhotos.push({ id, name });
            reporting.summary.placeholderCount++;
        }
    });

    const reportPath = path.join(__dirname, 'data_cleanup_report_20260223_1707.json');
    fs.writeFileSync(reportPath, JSON.stringify(reporting, null, 2));

    console.log(`\n--- Integrity Check Result ---`);
    console.log(`Total Checked: ${reporting.summary.totalChecked}`);
    console.log(`Zero Coordinates: ${reporting.summary.zeroCoordsCount}`);
    console.log(`Missing Photos: ${reporting.summary.missingPhotosCount}`);
    console.log(`Placeholder Photos: ${reporting.summary.placeholderCount}`);
    console.log(`\nReport saved to: ${reportPath}`);

} catch (error) {
    console.error("Error analyzing landmarks:", error);
}
