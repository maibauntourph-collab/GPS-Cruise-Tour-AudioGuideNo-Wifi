import type { CityGuideData } from '../templates/city-guide-shorts.js';

export const singaporeData: CityGuideData = {
  city: {
    name: '싱가포르',
    nameEn: 'Singapore',
    country: '싱가포르',
    heroImageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1080&q=80',
  },
  landmarks: [
    {
      name: '마리나 베이 샌즈',
      description: '배 모양 옥상 수영장으로 유명한 미래 도시의 상징',
      imageUrl: 'https://images.unsplash.com/photo-1508964942454-1461b048aa76?w=1080&q=80',
      distanceFromPort: '항구에서 택시 15분',
    },
    {
      name: '가든스 바이 더 베이',
      description: '높이 50m 슈퍼트리가 빛나는 SF 영화 속 정원',
      imageUrl: 'https://images.unsplash.com/photo-1506351421178-63b52a2d0d09?w=1080&q=80',
      distanceFromPort: '마리나 베이에서 도보 10분',
    },
    {
      name: '차이나타운 호커센터',
      description: '미슐랭 별을 받은 3달러짜리 치킨라이스의 성지',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&q=80',
      distanceFromPort: '마리나에서 지하철 10분',
    },
  ],
  language: 'ko',
};

export const singaporeDataEn: CityGuideData = {
  city: {
    name: 'Singapore',
    nameEn: 'Singapore',
    country: 'Singapore',
    heroImageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1080&q=80',
  },
  landmarks: [
    {
      name: 'Marina Bay Sands',
      description: 'Iconic ship-shaped rooftop infinity pool — the symbol of future city',
      imageUrl: 'https://images.unsplash.com/photo-1508964942454-1461b048aa76?w=1080&q=80',
      distanceFromPort: '15 min taxi from port',
    },
    {
      name: 'Gardens by the Bay',
      description: '50m-tall Supertrees glowing like a sci-fi movie set',
      imageUrl: 'https://images.unsplash.com/photo-1506351421178-63b52a2d0d09?w=1080&q=80',
      distanceFromPort: '10 min walk from Marina Bay',
    },
    {
      name: 'Chinatown Hawker Centre',
      description: 'Michelin-starred $3 chicken rice — street food heaven',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&q=80',
      distanceFromPort: '10 min by MRT from Marina',
    },
  ],
  language: 'en',
};
