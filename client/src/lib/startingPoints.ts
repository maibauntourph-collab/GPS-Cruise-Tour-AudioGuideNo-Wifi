// Starting points data for each city (airports, cruise terminals, train stations)

export interface StartingPoint {
  id: string;
  type: 'airport' | 'cruise_terminal' | 'train_station' | 'hotel' | 'my_location';
  name: string;
  lat: number;
  lng: number;
  translations?: Record<string, { name: string }>;
}

export interface CityStartingPoints {
  cityId: string;
  airports: StartingPoint[];
  cruiseTerminals: StartingPoint[];
  trainStations: StartingPoint[];
}

// City starting points data
export const cityStartingPoints: Record<string, CityStartingPoints> = {
  rome: {
    cityId: 'rome',
    airports: [
      {
        id: 'fco',
        type: 'airport',
        name: 'Fiumicino Airport (FCO)',
        lat: 41.7999,
        lng: 12.2462,
        translations: {
          ko: { name: '피우미치노 공항 (FCO)' },
          it: { name: 'Aeroporto di Fiumicino (FCO)' },
          es: { name: 'Aeropuerto de Fiumicino (FCO)' },
          zh: { name: '菲乌米奇诺机场 (FCO)' },
          ja: { name: 'フィウミチーノ空港 (FCO)' }
        }
      },
      {
        id: 'cia',
        type: 'airport',
        name: 'Ciampino Airport (CIA)',
        lat: 41.7994,
        lng: 12.5949,
        translations: {
          ko: { name: '치암피노 공항 (CIA)' },
          it: { name: 'Aeroporto di Ciampino (CIA)' },
          es: { name: 'Aeropuerto de Ciampino (CIA)' },
          zh: { name: '钱皮诺机场 (CIA)' },
          ja: { name: 'チャンピーノ空港 (CIA)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'civitavecchia',
        type: 'cruise_terminal',
        name: 'Civitavecchia Cruise Port',
        lat: 42.0933,
        lng: 11.7869,
        translations: {
          ko: { name: '치비타베키아 크루즈 항구' },
          it: { name: 'Porto Crociere Civitavecchia' },
          es: { name: 'Puerto de Cruceros Civitavecchia' },
          zh: { name: '奇维塔韦基亚邮轮港' },
          ja: { name: 'チビタベッキア・クルーズ港' }
        }
      }
    ],
    trainStations: [
      {
        id: 'termini',
        type: 'train_station',
        name: 'Roma Termini Station',
        lat: 41.9003,
        lng: 12.5025,
        translations: {
          ko: { name: '로마 테르미니역' },
          it: { name: 'Stazione Roma Termini' },
          es: { name: 'Estación Roma Termini' },
          zh: { name: '罗马特米尼站' },
          ja: { name: 'ローマ・テルミニ駅' }
        }
      }
    ]
  },
  barcelona: {
    cityId: 'barcelona',
    airports: [
      {
        id: 'bcn',
        type: 'airport',
        name: 'Barcelona-El Prat Airport (BCN)',
        lat: 41.2971,
        lng: 2.0785,
        translations: {
          ko: { name: '바르셀로나 엘프라트 공항 (BCN)' },
          es: { name: 'Aeropuerto de Barcelona-El Prat (BCN)' },
          zh: { name: '巴塞罗那机场 (BCN)' },
          ja: { name: 'バルセロナ空港 (BCN)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'barcelona_port',
        type: 'cruise_terminal',
        name: 'Barcelona Cruise Port',
        lat: 41.3743,
        lng: 2.1766,
        translations: {
          ko: { name: '바르셀로나 크루즈 항구' },
          es: { name: 'Puerto de Cruceros de Barcelona' },
          zh: { name: '巴塞罗那邮轮港' },
          ja: { name: 'バルセロナ・クルーズ港' }
        }
      }
    ],
    trainStations: [
      {
        id: 'sants',
        type: 'train_station',
        name: 'Barcelona Sants Station',
        lat: 41.3792,
        lng: 2.1397,
        translations: {
          ko: { name: '바르셀로나 산츠역' },
          es: { name: 'Estación Barcelona Sants' },
          zh: { name: '巴塞罗那桑茨站' },
          ja: { name: 'バルセロナ・サンツ駅' }
        }
      }
    ]
  },
  paris: {
    cityId: 'paris',
    airports: [
      {
        id: 'cdg',
        type: 'airport',
        name: 'Charles de Gaulle Airport (CDG)',
        lat: 49.0097,
        lng: 2.5479,
        translations: {
          ko: { name: '샤를 드 골 공항 (CDG)' },
          fr: { name: 'Aéroport Charles de Gaulle (CDG)' },
          zh: { name: '戴高乐机场 (CDG)' },
          ja: { name: 'シャルル・ド・ゴール空港 (CDG)' }
        }
      },
      {
        id: 'ory',
        type: 'airport',
        name: 'Orly Airport (ORY)',
        lat: 48.7262,
        lng: 2.3652,
        translations: {
          ko: { name: '오를리 공항 (ORY)' },
          fr: { name: 'Aéroport d\'Orly (ORY)' },
          zh: { name: '奥利机场 (ORY)' },
          ja: { name: 'オルリー空港 (ORY)' }
        }
      }
    ],
    cruiseTerminals: [],
    trainStations: [
      {
        id: 'gare_du_nord',
        type: 'train_station',
        name: 'Gare du Nord',
        lat: 48.8809,
        lng: 2.3553,
        translations: {
          ko: { name: '파리 북역' },
          fr: { name: 'Gare du Nord' },
          zh: { name: '巴黎北站' },
          ja: { name: 'パリ北駅' }
        }
      }
    ]
  },
  london: {
    cityId: 'london',
    airports: [
      {
        id: 'lhr',
        type: 'airport',
        name: 'Heathrow Airport (LHR)',
        lat: 51.4700,
        lng: -0.4543,
        translations: {
          ko: { name: '히드로 공항 (LHR)' },
          zh: { name: '希思罗机场 (LHR)' },
          ja: { name: 'ヒースロー空港 (LHR)' }
        }
      },
      {
        id: 'lgw',
        type: 'airport',
        name: 'Gatwick Airport (LGW)',
        lat: 51.1537,
        lng: -0.1821,
        translations: {
          ko: { name: '개트윅 공항 (LGW)' },
          zh: { name: '盖特威克机场 (LGW)' },
          ja: { name: 'ガトウィック空港 (LGW)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'southampton',
        type: 'cruise_terminal',
        name: 'Southampton Cruise Port',
        lat: 50.8993,
        lng: -1.4103,
        translations: {
          ko: { name: '사우샘프턴 크루즈 항구' },
          zh: { name: '南安普敦邮轮港' },
          ja: { name: 'サウサンプトン・クルーズ港' }
        }
      }
    ],
    trainStations: [
      {
        id: 'kings_cross',
        type: 'train_station',
        name: 'King\'s Cross Station',
        lat: 51.5305,
        lng: -0.1239,
        translations: {
          ko: { name: '킹스 크로스역' },
          zh: { name: '国王十字车站' },
          ja: { name: 'キングス・クロス駅' }
        }
      }
    ]
  },
  amsterdam: {
    cityId: 'amsterdam',
    airports: [
      {
        id: 'ams',
        type: 'airport',
        name: 'Schiphol Airport (AMS)',
        lat: 52.3105,
        lng: 4.7683,
        translations: {
          ko: { name: '스키폴 공항 (AMS)' },
          nl: { name: 'Luchthaven Schiphol (AMS)' },
          zh: { name: '史基浦机场 (AMS)' },
          ja: { name: 'スキポール空港 (AMS)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'amsterdam_port',
        type: 'cruise_terminal',
        name: 'Amsterdam Cruise Terminal',
        lat: 52.3851,
        lng: 4.9026,
        translations: {
          ko: { name: '암스테르담 크루즈 터미널' },
          nl: { name: 'Amsterdam Cruise Terminal' },
          zh: { name: '阿姆斯特丹邮轮码头' },
          ja: { name: 'アムステルダム・クルーズターミナル' }
        }
      }
    ],
    trainStations: [
      {
        id: 'centraal',
        type: 'train_station',
        name: 'Amsterdam Centraal',
        lat: 52.3791,
        lng: 4.9003,
        translations: {
          ko: { name: '암스테르담 중앙역' },
          nl: { name: 'Amsterdam Centraal' },
          zh: { name: '阿姆斯特丹中央车站' },
          ja: { name: 'アムステルダム中央駅' }
        }
      }
    ]
  },
  tokyo: {
    cityId: 'tokyo',
    airports: [
      {
        id: 'nrt',
        type: 'airport',
        name: 'Narita Airport (NRT)',
        lat: 35.7720,
        lng: 140.3929,
        translations: {
          ko: { name: '나리타 공항 (NRT)' },
          ja: { name: '成田空港 (NRT)' },
          zh: { name: '成田机场 (NRT)' }
        }
      },
      {
        id: 'hnd',
        type: 'airport',
        name: 'Haneda Airport (HND)',
        lat: 35.5494,
        lng: 139.7798,
        translations: {
          ko: { name: '하네다 공항 (HND)' },
          ja: { name: '羽田空港 (HND)' },
          zh: { name: '羽田机场 (HND)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'tokyo_port',
        type: 'cruise_terminal',
        name: 'Tokyo Cruise Terminal',
        lat: 35.6342,
        lng: 139.7753,
        translations: {
          ko: { name: '도쿄 크루즈 터미널' },
          ja: { name: '東京クルーズターミナル' },
          zh: { name: '东京邮轮码头' }
        }
      }
    ],
    trainStations: [
      {
        id: 'tokyo_station',
        type: 'train_station',
        name: 'Tokyo Station',
        lat: 35.6812,
        lng: 139.7671,
        translations: {
          ko: { name: '도쿄역' },
          ja: { name: '東京駅' },
          zh: { name: '东京站' }
        }
      }
    ]
  },
  singapore: {
    cityId: 'singapore',
    airports: [
      {
        id: 'sin',
        type: 'airport',
        name: 'Changi Airport (SIN)',
        lat: 1.3644,
        lng: 103.9915,
        translations: {
          ko: { name: '창이 공항 (SIN)' },
          zh: { name: '樟宜机场 (SIN)' },
          ja: { name: 'チャンギ空港 (SIN)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'marina_bay',
        type: 'cruise_terminal',
        name: 'Marina Bay Cruise Centre',
        lat: 1.2649,
        lng: 103.8632,
        translations: {
          ko: { name: '마리나 베이 크루즈 센터' },
          zh: { name: '滨海湾邮轮中心' },
          ja: { name: 'マリーナベイ・クルーズセンター' }
        }
      }
    ],
    trainStations: []
  },
  stockholm: {
    cityId: 'stockholm',
    airports: [
      {
        id: 'arn',
        type: 'airport',
        name: 'Arlanda Airport (ARN)',
        lat: 59.6519,
        lng: 17.9186,
        translations: {
          ko: { name: '알란다 공항 (ARN)' },
          sv: { name: 'Arlanda flygplats (ARN)' },
          zh: { name: '阿兰达机场 (ARN)' },
          ja: { name: 'アーランダ空港 (ARN)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'stockholm_port',
        type: 'cruise_terminal',
        name: 'Stockholm Cruise Terminal',
        lat: 59.3223,
        lng: 18.1043,
        translations: {
          ko: { name: '스톡홀름 크루즈 터미널' },
          sv: { name: 'Stockholms kryssningsterminalen' },
          zh: { name: '斯德哥尔摩邮轮码头' },
          ja: { name: 'ストックホルム・クルーズターミナル' }
        }
      }
    ],
    trainStations: [
      {
        id: 'central_station',
        type: 'train_station',
        name: 'Stockholm Central Station',
        lat: 59.3301,
        lng: 18.0583,
        translations: {
          ko: { name: '스톡홀름 중앙역' },
          sv: { name: 'Stockholms centralstation' },
          zh: { name: '斯德哥尔摩中央车站' },
          ja: { name: 'ストックホルム中央駅' }
        }
      }
    ]
  },
  copenhagen: {
    cityId: 'copenhagen',
    airports: [
      {
        id: 'cph',
        type: 'airport',
        name: 'Copenhagen Airport (CPH)',
        lat: 55.6181,
        lng: 12.6560,
        translations: {
          ko: { name: '코펜하겐 공항 (CPH)' },
          da: { name: 'Københavns Lufthavn (CPH)' },
          zh: { name: '哥本哈根机场 (CPH)' },
          ja: { name: 'コペンハーゲン空港 (CPH)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'copenhagen_port',
        type: 'cruise_terminal',
        name: 'Copenhagen Cruise Port',
        lat: 55.6935,
        lng: 12.6036,
        translations: {
          ko: { name: '코펜하겐 크루즈 항구' },
          da: { name: 'Københavns Krydstogtshavn' },
          zh: { name: '哥本哈根邮轮港' },
          ja: { name: 'コペンハーゲン・クルーズ港' }
        }
      }
    ],
    trainStations: [
      {
        id: 'hovedbanegard',
        type: 'train_station',
        name: 'Copenhagen Central Station',
        lat: 55.6727,
        lng: 12.5647,
        translations: {
          ko: { name: '코펜하겐 중앙역' },
          da: { name: 'Københavns Hovedbanegård' },
          zh: { name: '哥本哈根中央车站' },
          ja: { name: 'コペンハーゲン中央駅' }
        }
      }
    ]
  },
  sydney: {
    cityId: 'sydney',
    airports: [
      {
        id: 'syd',
        type: 'airport',
        name: 'Sydney Airport (SYD)',
        lat: -33.9461,
        lng: 151.1772,
        translations: {
          ko: { name: '시드니 공항 (SYD)' },
          zh: { name: '悉尼机场 (SYD)' },
          ja: { name: 'シドニー空港 (SYD)' }
        }
      }
    ],
    cruiseTerminals: [
      {
        id: 'circular_quay',
        type: 'cruise_terminal',
        name: 'Circular Quay Cruise Terminal',
        lat: -33.8614,
        lng: 151.2111,
        translations: {
          ko: { name: '서큘러 키 크루즈 터미널' },
          zh: { name: '环形码头邮轮码头' },
          ja: { name: 'サーキュラー・キー・クルーズターミナル' }
        }
      }
    ],
    trainStations: [
      {
        id: 'central_station',
        type: 'train_station',
        name: 'Sydney Central Station',
        lat: -33.8840,
        lng: 151.2065,
        translations: {
          ko: { name: '시드니 중앙역' },
          zh: { name: '悉尼中央车站' },
          ja: { name: 'シドニー中央駅' }
        }
      }
    ]
  }
};

// Get translated starting point name
export function getStartingPointName(point: StartingPoint, language: string): string {
  if (point.translations && point.translations[language]) {
    return point.translations[language].name;
  }
  return point.name;
}

// Get all starting points for a city
export function getCityStartingPoints(cityId: string): CityStartingPoints | null {
  return cityStartingPoints[cityId] || null;
}

// Get all available starting points flattened for a city
export function getAllStartingPointsForCity(cityId: string): StartingPoint[] {
  const cityData = cityStartingPoints[cityId];
  if (!cityData) return [];
  
  return [
    ...cityData.airports,
    ...cityData.cruiseTerminals,
    ...cityData.trainStations
  ];
}
