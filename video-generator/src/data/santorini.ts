import type { CityGuideData } from '../templates/city-guide-shorts.js';

export const santoriniData: CityGuideData = {
  city: {
    name: '산토리니',
    nameEn: 'Santorini',
    country: '그리스',
    heroImageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80',
  },
  landmarks: [
    {
      name: '이아 마을',
      description: '세계에서 가장 아름다운 석양을 볼 수 있는 절벽 위 하얀 마을',
      imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1080&q=80',
      distanceFromPort: '항구에서 버스 25분',
    },
    {
      name: '피라 타운',
      description: '칼데라 절벽 위 미로처럼 펼쳐진 산토리니의 수도',
      imageUrl: 'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1080&q=80',
      distanceFromPort: '케이블카 또는 당나귀',
    },
    {
      name: '레드 비치',
      description: '붉은 화산암 절벽이 만든 이색적인 해변',
      imageUrl: 'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=1080&q=80',
      distanceFromPort: '피라에서 버스 20분',
    },
  ],
  language: 'ko',
};

export const santoriniDataEn: CityGuideData = {
  city: {
    name: 'Santorini',
    nameEn: 'Santorini',
    country: 'Greece',
    heroImageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1080&q=80',
  },
  landmarks: [
    {
      name: 'Oia Village',
      description: 'White-washed cliffside village famous for the world\'s most beautiful sunset',
      imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1080&q=80',
      distanceFromPort: '25 min by bus from port',
    },
    {
      name: 'Fira Town',
      description: 'The labyrinthine capital perched on the caldera cliff edge',
      imageUrl: 'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=1080&q=80',
      distanceFromPort: 'Cable car or donkey ride',
    },
    {
      name: 'Red Beach',
      description: 'Striking volcanic red cliff beach unlike anywhere else',
      imageUrl: 'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=1080&q=80',
      distanceFromPort: '20 min by bus from Fira',
    },
  ],
  language: 'en',
};
