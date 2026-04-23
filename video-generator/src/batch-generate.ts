/**
 * 배치 영상 생성 — 모든 도시 × 모든 언어
 *
 * Usage:
 *   npx tsx src/batch-generate.ts                  # 전체 (5도시 × 2언어 = 10영상)
 *   npx tsx src/batch-generate.ts --lang ko        # 한국어만 (5영상)
 *   npx tsx src/batch-generate.ts --city rome,barcelona  # 특정 도시만
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALL_CITIES = ['rome', 'barcelona', 'santorini', 'singapore', 'juneau'];
const ALL_LANGS = ['ko', 'en'];

// CLI 인자
const args = process.argv.slice(2);
const langFilter = args.find((_, i) => args[i - 1] === '--lang')?.split(',');
const cityFilter = args.find((_, i) => args[i - 1] === '--city')?.split(',');
const noTTS = args.includes('--no-tts') ? ' --no-tts' : '';

const cities = cityFilter || ALL_CITIES;
const langs = langFilter || ALL_LANGS;
const total = cities.length * langs.length;

console.log('═══════════════════════════════════════════');
console.log('  NoWiFi Video Generator — Batch Mode');
console.log('═══════════════════════════════════════════');
console.log(`  Cities: ${cities.join(', ')}`);
console.log(`  Languages: ${langs.join(', ')}`);
console.log(`  Total: ${total} videos`);
console.log(`  TTS: ${noTTS ? 'Disabled' : 'Enabled'}`);
console.log('───────────────────────────────────────────');

let completed = 0;
let failed = 0;
const results: Array<{ city: string; lang: string; status: string; time: string; size: string }> = [];

for (const city of cities) {
  for (const lang of langs) {
    completed++;
    console.log(`\n[${completed}/${total}] ${city} (${lang})...`);

    const start = Date.now();
    try {
      execSync(
        `npx tsx src/generate-full.ts --city ${city} --lang ${lang}${noTTS}`,
        {
          cwd: path.resolve(__dirname, '..'),
          stdio: 'pipe',
          timeout: 600000, // 10분
          env: { ...process.env },
        }
      );

      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      const outFile = path.resolve(__dirname, '..', 'output', `${city}_${lang}_shorts_full.mp4`);
      const size = fs.existsSync(outFile)
        ? `${(fs.statSync(outFile).size / 1024).toFixed(0)}KB`
        : '?';

      results.push({ city, lang, status: '✅', time: `${elapsed}s`, size });
      console.log(`  ✅ Done in ${elapsed}s (${size})`);
    } catch (e: any) {
      failed++;
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      results.push({ city, lang, status: '❌', time: `${elapsed}s`, size: '-' });
      console.log(`  ❌ Failed in ${elapsed}s`);
    }
  }
}

// 결과 요약
console.log('\n═══════════════════════════════════════════');
console.log('  Batch Complete!');
console.log('═══════════════════════════════════════════');
console.log(`  Total: ${total} | Success: ${total - failed} | Failed: ${failed}`);
console.log('');
console.log('  City         Lang  Status  Time    Size');
console.log('  ─────────────────────────────────────────');
for (const r of results) {
  console.log(`  ${r.city.padEnd(13)} ${r.lang}    ${r.status}    ${r.time.padEnd(7)} ${r.size}`);
}
console.log('═══════════════════════════════════════════');
