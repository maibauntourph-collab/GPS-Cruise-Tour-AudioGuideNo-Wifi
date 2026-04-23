/**
 * NoWiFi Video Generator — 메인 오케스트레이터
 *
 * Usage:
 *   npx tsx src/index.ts                     # 로마 한국어 (기본)
 *   npx tsx src/index.ts --city rome --lang en
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { FrameRenderer } from './renderers/frame-renderer.js';
import { VideoEncoder } from './renderers/video-encoder.js';
import { generateFrameSpecs, getTotalFrames, getTotalDuration, generateTTSScript } from './templates/city-guide-shorts.js';
import type { CityGuideData } from './templates/city-guide-shorts.js';
import { romeData, romeDataEn } from './data/rome.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CLI 인자 파싱
const args = process.argv.slice(2);
const cityArg = args.find((_, i) => args[i - 1] === '--city') || 'rome';
const langArg = args.find((_, i) => args[i - 1] === '--lang') || 'ko';

// 데이터 선택
function getCityData(city: string, lang: string): CityGuideData {
  if (city === 'rome' && lang === 'en') return romeDataEn;
  if (city === 'rome') return romeData;
  // 추후 다른 도시 추가
  return romeData;
}

async function main() {
  const data = getCityData(cityArg, langArg);

  console.log('═══════════════════════════════════════════');
  console.log('  NoWiFi Video Generator — Phase 1 Pilot');
  console.log('═══════════════════════════════════════════');
  console.log(`  City: ${data.city.name} (${data.city.nameEn})`);
  console.log(`  Language: ${data.language}`);
  console.log(`  Landmarks: ${data.landmarks.length}`);
  console.log(`  Duration: ${getTotalDuration(data)}s`);
  console.log(`  Total frames: ${getTotalFrames(data)} (30fps)`);
  console.log('───────────────────────────────────────────');

  // TTS 스크립트 생성 (오디오 생성은 별도)
  const ttsScript = generateTTSScript(data);
  console.log('\n📝 TTS Script:');
  console.log(ttsScript);
  console.log('───────────────────────────────────────────');

  // 프레임 스펙 생성
  const specs = generateFrameSpecs(data);
  const totalFrames = getTotalFrames(data);

  // 렌더러 초기화
  const renderer = new FrameRenderer();
  console.log('\n🖼️  Preloading images...');
  await renderer.preloadImage(data.city.heroImageUrl);
  for (const lm of data.landmarks) {
    await renderer.preloadImage(lm.imageUrl);
  }
  console.log('  Images loaded ✅');

  // 인코더 초기화
  const outputDir = path.resolve(__dirname, '..', 'output');
  const outputFile = path.join(outputDir, `${data.city.nameEn.toLowerCase()}_${data.language}_shorts.mp4`);

  const encoder = new VideoEncoder();

  // Step 1: 프레임 렌더링 → 임시 PNG 파일로 저장
  console.log('\n🖼️  Rendering frames...');
  const startTime = Date.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    const spec = specs.find(s => frame >= s.startFrame && frame < s.endFrame);
    if (!spec) continue;

    const pngBuffer = await renderer.renderFrame(spec, frame);
    encoder.writeFrame(pngBuffer);

    if (frame % 30 === 0) {
      const percent = Math.round((frame / totalFrames) * 100);
      process.stdout.write(`\r  [Render] ${percent}% (${frame}/${totalFrames} frames)`);
    }
  }

  const renderTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Frames rendered in ${renderTime}s ✅`);

  // Step 2: FFmpeg 인코딩 (파일 → MP4)
  console.log(`\n🎬 Encoding → ${outputFile}`);
  const result = encoder.encode({ outputPath: outputFile });

  // 정리
  encoder.cleanup();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n───────────────────────────────────────────');
  console.log(`  ✅ Video generated successfully!`);
  console.log(`  📁 Output: ${outputFile}`);
  console.log(`  ⏱️  Time: ${elapsed}s`);
  console.log(`  📊 ${result}`);
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
