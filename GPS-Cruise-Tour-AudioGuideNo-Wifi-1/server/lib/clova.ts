import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const CLOVA_API_URL = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts";

export const CLOVA_VOICES = {
  nara: { name: "Nara", nameKo: "나라", gender: "female", language: "ko", description: "Korean female voice" },
  nara_call: { name: "Nara Call", nameKo: "나라 (전화)", gender: "female", language: "ko", description: "Korean female voice for call" },
  nminsang: { name: "Minsang", nameKo: "민상", gender: "male", language: "ko", description: "Korean male voice" },
  nhajun: { name: "Hajun", nameKo: "하준", gender: "male", language: "ko", description: "Korean child male voice" },
  ndain: { name: "Dain", nameKo: "다인", gender: "female", language: "ko", description: "Korean child female voice" },
  njiyun: { name: "Jiyun", nameKo: "지윤", gender: "female", language: "ko", description: "Korean female voice" },
  nsujin: { name: "Sujin", nameKo: "수진", gender: "female", language: "ko", description: "Korean female voice" },
  njinho: { name: "Jinho", nameKo: "진호", gender: "male", language: "ko", description: "Korean male voice" },
  njihun: { name: "Jihun", nameKo: "지훈", gender: "male", language: "ko", description: "Korean male voice" },
  njooahn: { name: "Jooahn", nameKo: "주안", gender: "male", language: "ko", description: "Korean male voice" },
  nseonhee: { name: "Seonhee", nameKo: "선희", gender: "female", language: "ko", description: "Korean female voice" },
  njiyoung: { name: "Jiyoung", nameKo: "지영", gender: "female", language: "ko", description: "Korean female voice" },
  nsiyoon: { name: "Siyoon", nameKo: "시윤", gender: "male", language: "ko", description: "Korean male voice" },
  ngaram: { name: "Garam", nameKo: "가람", gender: "female", language: "ko", description: "Korean child female voice" },
  ntomoko: { name: "Tomoko", nameKo: "토모코", gender: "female", language: "ja", description: "Japanese female voice" },
  nnaomi: { name: "Naomi", nameKo: "나오미", gender: "female", language: "ja", description: "Japanese female voice" },
  nsayuri: { name: "Sayuri", nameKo: "사유리", gender: "female", language: "ja", description: "Japanese female voice" },
  ngoeun: { name: "Goeun", nameKo: "고은", gender: "female", language: "ko", description: "Korean female voice" },
  neunyoung: { name: "Eunyoung", nameKo: "은영", gender: "female", language: "ko", description: "Korean female voice" },
  nsunkyung: { name: "Sunkyung", nameKo: "선경", gender: "female", language: "ko", description: "Korean female voice" },
  nyujin: { name: "Yujin", nameKo: "유진", gender: "female", language: "ko", description: "Korean female voice" },
  ntaejin: { name: "Taejin", nameKo: "태진", gender: "male", language: "ko", description: "Korean male voice" },
  nyoungil: { name: "Youngil", nameKo: "영일", gender: "male", language: "ko", description: "Korean male voice" },
  nseungpyo: { name: "Seungpyo", nameKo: "승표", gender: "male", language: "ko", description: "Korean male voice" },
  nwontak: { name: "Wontak", nameKo: "원탁", gender: "male", language: "ko", description: "Korean male voice" },
  dara_ang: { name: "Dara (Angry)", nameKo: "다라 (분노)", gender: "female", language: "ko", description: "Korean female voice with angry emotion" },
  nsunhee: { name: "Sunhee", nameKo: "순희", gender: "female", language: "ko", description: "Korean female voice" },
  nmammon: { name: "Mammon", nameKo: "마몬", gender: "male", language: "ko", description: "Korean male voice" },
  nwoof: { name: "Woof", nameKo: "우프", gender: "male", language: "ko", description: "Korean male voice" },
  njoonyoung: { name: "Joonyoung", nameKo: "준영", gender: "male", language: "ko", description: "Korean male voice" },
  clara: { name: "Clara", nameKo: "클라라", gender: "female", language: "en", description: "English female voice" },
  matt: { name: "Matt", nameKo: "매트", gender: "male", language: "en", description: "English male voice" },
  shinji: { name: "Shinji", nameKo: "신지", gender: "male", language: "ja", description: "Japanese male voice" },
  meimei: { name: "Meimei", nameKo: "메이메이", gender: "female", language: "zh", description: "Chinese female voice" },
  liangliang: { name: "Liangliang", nameKo: "량량", gender: "male", language: "zh", description: "Chinese male voice" },
  jose: { name: "Jose", nameKo: "호세", gender: "male", language: "es", description: "Spanish male voice" },
  carmen: { name: "Carmen", nameKo: "카르멘", gender: "female", language: "es", description: "Spanish female voice" },
} as const;

export type ClovaVoiceId = keyof typeof CLOVA_VOICES;

export const DEFAULT_CLOVA_VOICE_BY_LANGUAGE: { [key: string]: ClovaVoiceId } = {
  ko: "nara",
  en: "clara",
  ja: "ntomoko",
  zh: "meimei",
  es: "carmen",
  fr: "clara",
  de: "clara",
  it: "clara",
  pt: "clara",
  ru: "clara",
};

export function getClovaVoicesForLanguage(language: string): ClovaVoiceId[] {
  const langMapping: { [key: string]: string } = {
    ko: "ko",
    en: "en",
    ja: "ja",
    zh: "zh",
    es: "es",
  };
  const targetLang = langMapping[language] || "en";
  return (Object.keys(CLOVA_VOICES) as ClovaVoiceId[]).filter(
    (key) => CLOVA_VOICES[key].language === targetLang
  );
}

export interface ClovaAudioResult {
  audioBuffer: Buffer;
  contentType: string;
  voiceId: ClovaVoiceId;
}

export async function generateClovaTTS(
  text: string,
  voiceId: ClovaVoiceId = "nara",
  speed: number = 0,
  pitch: number = 0,
  volume: number = 0
): Promise<ClovaAudioResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID and NAVER_CLIENT_SECRET must be set");
  }

  const params = new URLSearchParams({
    speaker: voiceId,
    text: text,
    volume: volume.toString(),
    speed: speed.toString(),
    pitch: pitch.toString(),
    format: "mp3",
  });

  const response = await fetch(CLOVA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CLOVA TTS API error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  return {
    audioBuffer,
    contentType: "audio/mpeg",
    voiceId,
  };
}

export async function generateAndSaveClovaTTS(
  landmarkId: string,
  text: string,
  language: string = "ko",
  voiceId?: ClovaVoiceId
): Promise<{ audioUrl: string; voiceId: ClovaVoiceId; sizeBytes: number; checksum: string }> {
  const selectedVoice = voiceId || DEFAULT_CLOVA_VOICE_BY_LANGUAGE[language] || "nara";
  
  const result = await generateClovaTTS(text, selectedVoice);
  
  const audioDir = path.join(process.cwd(), "public", "audio", "clova");
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  const filename = `${landmarkId}_${language}_${selectedVoice}.mp3`;
  const filePath = path.join(audioDir, filename);
  fs.writeFileSync(filePath, result.audioBuffer);
  
  const checksum = crypto.createHash("md5").update(result.audioBuffer).digest("hex");
  
  return {
    audioUrl: `/audio/clova/${filename}`,
    voiceId: selectedVoice,
    sizeBytes: result.audioBuffer.length,
    checksum,
  };
}
