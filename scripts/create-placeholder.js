/**
 * [학습 포인트] placeholder.png 생성 스크립트 (ESM 호환)
 * 
 * 목적: 서버 데이터(landmarks.ts)에서 참조하는
 * "/images/landmarks/placeholder.png" 파일이 없어 404가 발생하는 문제 해결.
 * 
 * PhotoGallery.tsx Line 93의 `photo.includes('placeholder.png')` 체크로
 * 자동으로 ImageFallback "No Image" UI가 표시됩니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM에서 __dirname 대체 패턴
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 최소 유효 PNG (1x1 투명 픽셀) — 404 제거가 핵심 목적
const MINIMAL_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8' +
    '/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

const outputDir = path.join(__dirname, '..', 'client', 'public', 'images', 'landmarks');
const outputPath = path.join(outputDir, 'placeholder.png');

// 디렉토리 확인
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 디렉토리 생성 완료: ${outputDir}`);
}

// PNG 파일 생성
const buffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
fs.writeFileSync(outputPath, buffer);

console.log(`✅ placeholder.png 생성 완료!`);
console.log(`   경로: ${outputPath}`);
console.log(`   크기: ${buffer.length} bytes`);
console.log(`   용도: PhotoGallery의 ImageFallback UI가 자동 표시됩니다.`);
