/**
 * 풀 품질 영상 생성 — 30fps + TTS 나레이션
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx npx tsx src/generate-full.ts
 *   npx tsx src/generate-full.ts              # (TTS 없이 무음)
 *   npx tsx src/generate-full.ts --lang en    # 영어 버전
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { FrameRenderer } from './renderers/frame-renderer.js';
import { VideoEncoder } from './renderers/video-encoder.js';
import { generateFrameSpecs, getTotalFrames, getTotalDuration, generateTTSScript } from './templates/city-guide-shorts.js';
import { generateTTS } from './audio/tts-generator.js';
import { romeData, romeDataEn } from './data/rome.js';
import { barcelonaData, barcelonaDataEn } from './data/barcelona.js';
import { santoriniData, santoriniDataEn } from './data/santorini.js';
import { singaporeData, singaporeDataEn } from './data/singapore.js';
import { juneauData, juneauDataEn } from './data/juneau.js';
import type { CityGuideData } from './templates/city-guide-shorts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FPS = 15;

// CLI 인자
const args = process.argv.slice(2);
const langArg = args.find((_, i) => args[i - 1] === '--lang') || 'ko';
const cityArg = args.find((_, i) => args[i - 1] === '--city') || 'rome';
const skipTTS = args.includes('--no-tts');

const CITY_DATA: Record<string, Record<string, CityGuideData>> = {
  rome: { ko: romeData, en: romeDataEn },
  barcelona: { ko: barcelonaData, en: barcelonaDataEn },
  santorini: { ko: santoriniData, en: santoriniDataEn },
  singapore: { ko: singaporeData, en: singaporeDataEn },
  juneau: { ko: juneauData, en: juneauDataEn },
};

function getData(city: string, lang: string): CityGuideData {
  const cityData = CITY_DATA[city];
  if (!cityData) {
    console.error(`Unknown city: ${city}. Available: ${Object.keys(CITY_DATA).join(', ')}`);
    process.exit(1);
  }
  return cityData[lang] || cityData['ko'];
}

async function main() {
  const data = getData(cityArg, langArg);
  const totalDuration = getTotalDuration(data);
  const totalFrames = totalDuration * FPS;

  console.log('═══════════════════════════════════════════');
  console.log('  NoWiFi Video Generator — Full Quality');
  console.log('═══════════════════════════════════════════');
  console.log(`  City: ${data.city.name} (${data.city.nameEn})`);
  console.log(`  Language: ${data.language}`);
  console.log(`  FPS: ${FPS}`);
  console.log(`  Duration: ${totalDuration}s`);
  console.log(`  Frames: ${totalFrames}`);
  console.log(`  TTS: ${skipTTS ? 'Disabled' : (process.env.OPENAI_API_KEY ? 'OpenAI' : 'Silent')}`);
  console.log('───────────────────────────────────────────');

  const startTime = Date.now();

  // Step 1: TTS 오디오 생성
  const ttsScript = generateTTSScript(data);
  console.log('\n📝 TTS Script:');
  console.log(ttsScript);

  let audioPath: string | undefined;
  if (!skipTTS) {
    console.log('\n🔊 Generating TTS audio...');
    const audioDir = path.resolve(__dirname, '..', 'output');
    audioPath = path.join(audioDir, `${data.city.nameEn.toLowerCase()}_${data.language}_narration.mp3`);
    try {
      audioPath = await generateTTS({
        text: ttsScript,
        language: data.language,
        speed: 1.0,
        outputPath: audioPath,
      });
    } catch (e: any) {
      console.warn(`  [TTS] Failed: ${e.message} — continuing without audio`);
      audioPath = undefined;
    }
  }

  // Step 2: 이미지 프리로드
  console.log('\n🖼️  Loading images...');
  const renderer = new FrameRenderer();
  await renderer.preloadImage(data.city.heroImageUrl);
  for (const lm of data.landmarks) {
    await renderer.preloadImage(lm.imageUrl);
  }
  console.log('  Images loaded ✅');

  // Step 3: 프레임 렌더링
  const specs = generateFrameSpecs(data);
  const originalTotalFrames = getTotalFrames(data); // 30fps 기준
  const encoder = new VideoEncoder();

  console.log(`\n🎨 Rendering ${totalFrames} frames...`);
  const renderStart = Date.now();

  for (let frame = 0; frame < totalFrames; frame++) {
    // FPS 매핑 (15fps → 30fps 기준 spec 참조)
    const mappedFrame = Math.floor(frame * (originalTotalFrames / totalFrames));
    const spec = specs.find(s => mappedFrame >= s.startFrame && mappedFrame < s.endFrame);
    if (!spec) continue;

    const buf = await renderer.renderFrame(spec, mappedFrame);
    encoder.writeFrame(buf);

    if (frame % FPS === 0) {
      const pct = Math.round((frame / totalFrames) * 100);
      const elapsed = ((Date.now() - renderStart) / 1000).toFixed(0);
      process.stdout.write(`\r  [Render] ${pct}% (${frame}/${totalFrames}) — ${elapsed}s`);
    }
  }

  const renderTime = ((Date.now() - renderStart) / 1000).toFixed(1);
  console.log(`\n  Render complete: ${renderTime}s ✅`);

  // Step 4: FFmpeg 인코딩
  const outputFile = path.resolve(__dirname, '..', 'output',
    `${data.city.nameEn.toLowerCase()}_${data.language}_shorts_full.mp4`);

  console.log(`\n🎬 Encoding → ${path.basename(outputFile)}`);
  const result = encoder.encode({
    outputPath: outputFile,
    fps: FPS,
    crf: 23,
    audioPath,
  });
  encoder.cleanup();

  // 결과
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  const fs = await import('fs');
  const fileSize = fs.statSync(outputFile).size;

  console.log('\n═══════════════════════════════════════════');
  console.log('  ✅ Video generated successfully!');
  console.log(`  📁 ${path.basename(outputFile)}`);
  console.log(`  📐 1080×1920 (9:16) @ ${FPS}fps`);
  console.log(`  ⏱️  Duration: ${totalDuration}s`);
  console.log(`  💾 Size: ${(fileSize / 1024).toFixed(0)}KB`);
  console.log(`  🕐 Total time: ${totalTime}s`);
  console.log(`  🔊 Audio: ${audioPath ? 'Yes (TTS)' : 'No'}`);
  console.log('═══════════════════════════════════════════');
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
