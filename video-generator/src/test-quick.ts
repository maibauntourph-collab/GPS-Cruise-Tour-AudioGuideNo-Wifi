/**
 * 빠른 테스트 — 5fps, 75프레임으로 로마 Shorts 생성
 */
import { FrameRenderer } from './renderers/frame-renderer.js';
import { VideoEncoder } from './renderers/video-encoder.js';
import { generateFrameSpecs } from './templates/city-guide-shorts.js';
import { romeData } from './data/rome.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FPS = 5;
const DURATION = 15;
const TOTAL_FRAMES = FPS * DURATION; // 75

async function test() {
  console.log(`Quick test: ${TOTAL_FRAMES} frames at ${FPS}fps`);

  const renderer = new FrameRenderer();
  console.log('Loading images...');
  await renderer.preloadImage(romeData.city.heroImageUrl);
  for (const lm of romeData.landmarks) {
    await renderer.preloadImage(lm.imageUrl);
  }
  console.log('Images loaded OK');

  const specs = generateFrameSpecs(romeData);
  const encoder = new VideoEncoder();

  console.log('Rendering frames...');
  const start = Date.now();

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    // 5fps → 30fps 매핑
    const mapped = Math.floor(frame * (450 / TOTAL_FRAMES));
    const spec = specs.find(s => mapped >= s.startFrame && mapped < s.endFrame);
    if (!spec) continue;

    const buf = await renderer.renderFrame(spec, mapped);
    encoder.writeFrame(buf);

    if (frame % 15 === 0) {
      console.log(`  Frame ${frame}/${TOTAL_FRAMES} (${Math.round(frame/TOTAL_FRAMES*100)}%)`);
    }
  }

  const renderMs = Date.now() - start;
  console.log(`Frames rendered in ${(renderMs/1000).toFixed(1)}s`);

  console.log('Encoding to MP4...');
  const outPath = path.resolve(__dirname, '..', 'output', 'rome_ko_test.mp4');
  encoder.encode({ outputPath: outPath, fps: FPS, crf: 28 });
  encoder.cleanup();

  console.log(`\nDone! Output: ${outPath}`);
  console.log(`Total time: ${((Date.now()-start)/1000).toFixed(1)}s`);
}

test().catch(e => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
