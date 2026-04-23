/**
 * FFmpeg 비디오 인코더
 * 프레임 파일 → FFmpeg → MP4
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface EncoderOptions {
  outputPath: string;
  fps?: number;
  crf?: number;
  audioPath?: string;
}

export class VideoEncoder {
  private framesDir: string;
  private frameCount: number = 0;

  constructor() {
    this.framesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nowifi-frames-'));
  }

  /**
   * 프레임 PNG 파일로 저장
   */
  writeFrame(pngBuffer: Buffer): void {
    const framePath = path.join(this.framesDir, `frame_${String(this.frameCount).padStart(5, '0')}.png`);
    fs.writeFileSync(framePath, pngBuffer);
    this.frameCount++;
  }

  /**
   * 모든 프레임을 FFmpeg로 인코딩
   */
  encode(options: EncoderOptions): string {
    const { outputPath, fps = 30, crf = 23, audioPath } = options;

    // 출력 디렉토리 확인
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const inputPattern = path.join(this.framesDir, 'frame_%05d.png').replace(/\\/g, '/');
    const outPath = outputPath.replace(/\\/g, '/');

    let cmd = `ffmpeg -y -framerate ${fps} -i "${inputPattern}"`;

    if (audioPath) {
      cmd += ` -i "${audioPath.replace(/\\/g, '/')}"`;
    }

    cmd += ` -c:v libx264 -preset medium -crf ${crf} -pix_fmt yuv420p`;

    if (audioPath) {
      cmd += ` -c:a aac -b:a 128k -shortest`;
    } else {
      cmd += ` -an`;
    }

    cmd += ` -movflags +faststart "${outPath}"`;

    console.log(`\n  [FFmpeg] Encoding ${this.frameCount} frames...`);
    console.log(`  [FFmpeg] Command: ${cmd.substring(0, 120)}...`);

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 120000 });
      console.log(`  [FFmpeg] ✅ Encoding complete!`);
    } catch (err: any) {
      const stderr = err.stderr?.toString() || '';
      console.error(`  [FFmpeg] ❌ Error:`, stderr.substring(0, 300));
      throw err;
    }

    return `${this.frameCount} frames encoded → ${outputPath}`;
  }

  /**
   * 임시 파일 정리
   */
  cleanup(): void {
    try {
      fs.rmSync(this.framesDir, { recursive: true, force: true });
      console.log(`  [Cleanup] Temp frames deleted`);
    } catch {
      // ignore
    }
  }
}
