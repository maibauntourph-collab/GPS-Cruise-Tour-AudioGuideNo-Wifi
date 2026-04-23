/**
 * 바르셀로나 기항지 데이터 (ko/en)
 */
import type { CityGuideData } from '../templates/city-guide-shorts.js';

export const barcelonaData: CityGuideData = {
  language: 'ko',
  city: {
    name: '바르셀로나',
    nameEn: 'Barcelona',
    country: '스페인',
    heroImageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1080&q=80',
  },
  landmarks: [
    {
      name: '사그라다 파밀리아',
      imageUrl: 'https://images.unsplash.com/photo-1615876063860-d971f6dca5dc?w=1080&q=80',
      description: '가우디가 평생을 바친, 140년째 건축 중인 기적의 성당',
      distanceFromPort: '지하철 30분',
    },
    {
      name: '구엘 공원',
      imageUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=1080&q=80',
      description: '모자이크 도마뱀과 물결치는 벤치의 동화 속 공원',
      distanceFromPort: '버스 40분',
    },
    {
      name: '라 보케리아 시장',
      imageUrl: 'https://images.unsplash.com/photo-1551523713-c1a8e44e2f0e?w=1080&q=80',
      description: '시각과 미각을 모두 사로잡는 유럽 최대 재래시장',
      distanceFromPort: '도보 20분',
    },
  ],
  brandColor: '#E85D36',
  appUrl: 'nowifigps.tours',
};

export const barcelonaDataEn: CityGuideData = {
  language: 'en',
  city: {
    name: 'Barcelona',
    nameEn: 'Barcelona',
    country: 'Spain',
    heroImageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1080&q=80',
  },
  landmarks: [
    {
      name: 'Sagrada Família',
      imageUrl: 'https://images.unsplash.com/photo-1615876063860-d971f6dca5dc?w=1080&q=80',
      description: "Gaudí's unfinished masterpiece, under construction for 140 years",
      distanceFromPort: '30 min by metro',
    },
    {
      name: 'Park Güell',
      imageUrl: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=1080&q=80',
      description: 'A fairytale park with mosaic lizards and wavy benches',
      distanceFromPort: '40 min by bus',
    },
    {
      name: 'La Boqueria Market',
      imageUrl: 'https://images.unsplash.com/photo-1551523713-c1a8e44e2f0e?w=1080&q=80',
      description: "Europe's largest food market — a feast for eyes and taste",
      distanceFromPort: '20 min walk',
    },
  ],
  brandColor: '#E85D36',
  appUrl: 'nowifigps.tours',
};
