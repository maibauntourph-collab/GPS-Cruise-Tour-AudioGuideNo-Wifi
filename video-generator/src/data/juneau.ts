import type { CityGuideData } from '../templates/city-guide-shorts.js';

export const juneauData: CityGuideData = {
  city: {
    name: '주노',
    nameEn: 'Juneau',
    country: '미국 알래스카',
    heroImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
  },
  landmarks: [
    {
      name: '멘든홀 빙하',
      description: '눈앞에서 빙하가 무너지는 소리를 들을 수 있는 접근 가능한 빙하',
      imageUrl: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=1080&q=80',
      distanceFromPort: '항구에서 차로 20분',
    },
    {
      name: '트레이시 암 피요르드',
      description: '고래와 물개가 노니는 깊고 좁은 빙하 협곡',
      imageUrl: 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=1080&q=80',
      distanceFromPort: '보트 투어 필요',
    },
    {
      name: '마운트 로버츠 트램웨이',
      description: '해발 550m에서 내려다보는 주노 항구와 가스티노 해협',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
      distanceFromPort: '항구에서 도보 5분',
    },
  ],
  language: 'ko',
};

export const juneauDataEn: CityGuideData = {
  city: {
    name: 'Juneau',
    nameEn: 'Juneau',
    country: 'Alaska, USA',
    heroImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80',
  },
  landmarks: [
    {
      name: 'Mendenhall Glacier',
      description: 'Hear the thunderous crack of calving ice at this accessible glacier',
      imageUrl: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=1080&q=80',
      distanceFromPort: '20 min drive from port',
    },
    {
      name: 'Tracy Arm Fjord',
      description: 'Deep narrow glacier fjord where whales and seals play',
      imageUrl: 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=1080&q=80',
      distanceFromPort: 'Boat tour required',
    },
    {
      name: 'Mt. Roberts Tramway',
      description: 'Panoramic views of Juneau harbor from 1,800ft above sea level',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80',
      distanceFromPort: '5 min walk from port',
    },
  ],
  language: 'en',
};
