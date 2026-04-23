/**
 * 로마 파일럿 데이터 — 실제 랜드마크 정보
 */

import type { CityGuideData } from '../templates/city-guide-shorts.js';

export const romeData: CityGuideData = {
  city: {
    name: '로마',
    nameEn: 'Rome',
    country: '이탈리아',
    heroImageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1080&q=80', // 콜로세움
  },
  landmarks: [
    {
      name: '콜로세움',
      description: '2천 년 전 검투사들의 함성이 울려 퍼지던 원형 경기장',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1080&q=80',
      distanceFromPort: '항구에서 차로 75분',
    },
    {
      name: '트레비 분수',
      description: '동전을 던지면 로마에 다시 온다는 전설의 바로크 분수',
      imageUrl: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1080&q=80',
      distanceFromPort: '콜로세움에서 도보 15분',
    },
    {
      name: '바티칸 시국',
      description: '미켈란젤로의 천지창조를 품은 세계 최소 국가',
      imageUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1080&q=80',
      distanceFromPort: '트레비 분수에서 버스 20분',
    },
  ],
  language: 'ko',
};

export const romeDataEn: CityGuideData = {
  city: {
    name: 'Rome',
    nameEn: 'Rome',
    country: 'Italy',
    heroImageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1080&q=80',
  },
  landmarks: [
    {
      name: 'Colosseum',
      description: 'The iconic amphitheater where gladiators once fought 2,000 years ago',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1080&q=80',
      distanceFromPort: '75 min from port by car',
    },
    {
      name: 'Trevi Fountain',
      description: 'Toss a coin and legend says you\'ll return to Rome',
      imageUrl: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1080&q=80',
      distanceFromPort: '15 min walk from Colosseum',
    },
    {
      name: 'Vatican City',
      description: 'The world\'s smallest country, home to Michelangelo\'s Sistine Chapel',
      imageUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1080&q=80',
      distanceFromPort: '20 min by bus from Trevi',
    },
  ],
  language: 'en',
};
