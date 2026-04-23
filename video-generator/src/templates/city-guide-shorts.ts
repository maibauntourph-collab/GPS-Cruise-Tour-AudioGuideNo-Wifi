/**
 * Template A: 기항지 가이드 Shorts (15-30초, 9:16)
 *
 * 구조:
 * Frame 1 (0-3초): 도시 히어로 + 이름
 * Frame 2-4 (3-12초): 랜드마크 3개 슬라이드
 * Frame 5 (12-15초): CTA + QR + 로고
 */

export interface CityGuideData {
  city: {
    name: string;
    nameEn: string;
    country: string;
    heroImageUrl: string;
  };
  landmarks: Array<{
    name: string;
    description: string;      // 한줄 설명
    imageUrl: string;
    distanceFromPort: string;  // "항구에서 75분"
  }>;
  language: string;
  ttsAudioPath?: string;
}

export interface FrameSpec {
  startFrame: number;
  endFrame: number;
  type: 'title' | 'landmark' | 'cta';
  data: any;
}

// 30fps 기준
const FPS = 30;
const TITLE_DURATION = 3;     // 3초
const LANDMARK_DURATION = 3;  // 각 3초
const CTA_DURATION = 3;       // 3초

export function generateFrameSpecs(data: CityGuideData): FrameSpec[] {
  const specs: FrameSpec[] = [];
  let currentFrame = 0;

  // Frame 1: 타이틀
  specs.push({
    startFrame: currentFrame,
    endFrame: currentFrame + TITLE_DURATION * FPS,
    type: 'title',
    data: {
      cityName: data.city.name,
      country: data.city.country,
      heroImage: data.city.heroImageUrl,
      brandText: data.language === 'ko'
        ? 'WiFi 없이 즐기는 오디오 투어'
        : 'Audio Tour — No WiFi Needed',
    },
  });
  currentFrame += TITLE_DURATION * FPS;

  // Frame 2-4: 랜드마크 (최대 3개)
  const landmarks = data.landmarks.slice(0, 3);
  landmarks.forEach((landmark, index) => {
    specs.push({
      startFrame: currentFrame,
      endFrame: currentFrame + LANDMARK_DURATION * FPS,
      type: 'landmark',
      data: {
        index: index + 1,
        name: landmark.name,
        description: landmark.description,
        imageUrl: landmark.imageUrl,
        distance: landmark.distanceFromPort,
        totalLandmarks: landmarks.length,
      },
    });
    currentFrame += LANDMARK_DURATION * FPS;
  });

  // Frame 5: CTA
  specs.push({
    startFrame: currentFrame,
    endFrame: currentFrame + CTA_DURATION * FPS,
    type: 'cta',
    data: {
      mainText: data.language === 'ko'
        ? 'WiFi 없이도,\n여행의 즐거움은\n멈추지 않습니다'
        : 'Without WiFi,\nthe joy of travel\ndoesn\'t stop',
      subText: data.language === 'ko'
        ? 'QR 스캔으로 무료 체험'
        : 'Scan QR for free trial',
      url: 'nowifigps.tours',
    },
  });

  return specs;
}

export function getTotalFrames(data: CityGuideData): number {
  const landmarkCount = Math.min(data.landmarks.length, 3);
  return (TITLE_DURATION + landmarkCount * LANDMARK_DURATION + CTA_DURATION) * FPS;
}

export function getTotalDuration(data: CityGuideData): number {
  const landmarkCount = Math.min(data.landmarks.length, 3);
  return TITLE_DURATION + landmarkCount * LANDMARK_DURATION + CTA_DURATION;
}

// TTS 스크립트 자동 생성
export function generateTTSScript(data: CityGuideData): string {
  const isKo = data.language === 'ko';
  const lines: string[] = [];

  // 타이틀
  lines.push(
    isKo
      ? `${data.city.name}, 크루즈에서 내리면 꼭 가봐야 할 곳!`
      : `${data.city.nameEn}, must-see spots when your cruise docks!`
  );

  // 랜드마크
  const ordinals = isKo
    ? ['첫 번째', '두 번째', '세 번째']
    : ['First', 'Second', 'Third'];

  data.landmarks.slice(0, 3).forEach((lm, i) => {
    lines.push(
      isKo
        ? `${ordinals[i]}, ${lm.name}. ${lm.description}`
        : `${ordinals[i]}, ${lm.name}. ${lm.description}`
    );
  });

  // CTA
  lines.push(
    isKo
      ? `지금 무료로 다운로드하고, ${data.city.name} 오디오 투어를 미리 들어보세요!`
      : `Download free now and preview the ${data.city.nameEn} audio tour!`
  );

  return lines.join('\n');
}
