/**
 * TTS 오디오 생성 — OpenAI → ElevenLabs → 무음 폴백
 *
 * 우선순위:
 * 1. OpenAI TTS (OPENAI_API_KEY)
 * 2. ElevenLabs TTS (ELEVENLABS_API_KEY)
 * 3. 무음 오디오 (FFmpeg)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';

export interface TTSOptions {
  text: string;
  language: string;
  voice?: string;
  speed?: number;
  outputPath?: string;
}

// ═══════════════════════════════════════
// OpenAI 언어별 음성
// ═══════════════════════════════════════
const OPENAI_VOICE_MAP: Record<string, string> = {
  ko: 'nova', en: 'onyx', ja: 'nova', zh: 'nova',
  es: 'nova', fr: 'shimmer', de: 'onyx', it: 'nova',
  pt: 'nova', ru: 'onyx',
};

// ═══════════════════════════════════════
// ElevenLabs 언어별 음성 ID
// ═══════════════════════════════════════
// 기본 다국어 음성 (Eleven Multilingual v2 모델)
const ELEVENLABS_VOICE_MAP: Record<string, string> = {
  ko: 'EXAVITQu4vr4xnSDxMaL',  // Sarah — 다국어 지원, 따뜻한 여성
  en: 'pNInz6obpgDQGcFmaJgB',  // Adam — 깊은 남성
  ja: 'EXAVITQu4vr4xnSDxMaL',  // Sarah
  zh: 'EXAVITQu4vr4xnSDxMaL',  // Sarah
  es: 'EXAVITQu4vr4xnSDxMaL',  // Sarah
  fr: 'jsCqWAovK2LkecY7zXl4',  // Freya — 우아한 여성
  de: 'pNInz6obpgDQGcFmaJgB',  // Adam
  it: 'EXAVITQu4vr4xnSDxMaL',  // Sarah
  pt: 'EXAVITQu4vr4xnSDxMaL',  // Sarah
  ru: 'pNInz6obpgDQGcFmaJgB',  // Adam
};

// ═══════════════════════════════════════
// 메인 TTS 함수 — 자동 폴백
// ═══════════════════════════════════════
export async function generateTTS(options: TTSOptions): Promise<string> {
  // 1차: OpenAI
  if (OPENAI_API_KEY) {
    try {
      return await generateOpenAI(options);
    } catch (e: any) {
      console.warn(`  [TTS] OpenAI failed: ${e.message}`);
      // quota 에러면 ElevenLabs로 폴백
    }
  }

  // 2차: ElevenLabs
  if (ELEVENLABS_API_KEY) {
    try {
      return await generateElevenLabs(options);
    } catch (e: any) {
      console.warn(`  [TTS] ElevenLabs failed: ${e.message}`);
    }
  }

  // 3차: 무음
  console.warn('[TTS] No API key available — generating silent audio');
  return generateSilentAudio(15, options.outputPath);
}

// ═══════════════════════════════════════
// OpenAI TTS
// ═══════════════════════════════════════
async function generateOpenAI(options: TTSOptions): Promise<string> {
  const {
    text, language,
    voice = OPENAI_VOICE_MAP[language] || 'nova',
    speed = 1.0, outputPath,
  } = options;

  const outPath = outputPath || path.join(os.tmpdir(), `tts_openai_${Date.now()}.mp3`);

  console.log(`  [TTS:OpenAI] voice=${voice}, speed=${speed}, lang=${language}`);
  console.log(`  [TTS:OpenAI] "${text.substring(0, 60)}..."`);

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      speed,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI ${response.status}: ${err.substring(0, 200)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  [TTS:OpenAI] ✅ ${(buffer.length / 1024).toFixed(1)}KB`);
  return outPath;
}

// ═══════════════════════════════════════
// ElevenLabs TTS
// ═══════════════════════════════════════
async function generateElevenLabs(options: TTSOptions): Promise<string> {
  const {
    text, language, outputPath,
  } = options;

  const voiceId = ELEVENLABS_VOICE_MAP[language] || 'EXAVITQu4vr4xnSDxMaL';
  const outPath = outputPath || path.join(os.tmpdir(), `tts_eleven_${Date.now()}.mp3`);

  console.log(`  [TTS:ElevenLabs] voiceId=${voiceId}, lang=${language}`);
  console.log(`  [TTS:ElevenLabs] "${text.substring(0, 60)}..."`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs ${response.status}: ${err.substring(0, 200)}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  console.log(`  [TTS:ElevenLabs] ✅ ${(buffer.length / 1024).toFixed(1)}KB`);
  return outPath;
}

// ═══════════════════════════════════════
// 무음 폴백 (FFmpeg)
// ═══════════════════════════════════════
function generateSilentAudio(durationSec: number, outputPath?: string): string {
  const { execSync } = require('child_process');
  const outPath = outputPath || path.join(os.tmpdir(), `silent_${Date.now()}.mp3`);

  try {
    execSync(
      `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t ${durationSec} -q:a 9 "${outPath.replace(/\\/g, '/')}"`,
      { stdio: 'pipe', timeout: 10000 }
    );
    console.log(`  [TTS] Silent fallback: ${durationSec}s`);
  } catch {
    fs.writeFileSync(outPath, Buffer.alloc(0));
  }

  return outPath;
}
