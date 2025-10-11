import { type Landmark, type City, type VisitedLandmark, type InsertVisitedLandmark } from "@shared/schema";
import { db } from "./db";
import { visitedLandmarks } from "@shared/schema";
import { eq, count, and } from "drizzle-orm";

export interface IStorage {
  getCities(): Promise<City[]>;
  getCity(id: string): Promise<City | undefined>;
  getLandmarks(cityId?: string): Promise<Landmark[]>;
  getLandmark(id: string): Promise<Landmark | undefined>;
  // Visited landmarks methods
  markLandmarkVisited(landmarkId: string, sessionId?: string): Promise<VisitedLandmark>;
  getVisitedLandmarks(sessionId?: string): Promise<VisitedLandmark[]>;
  isLandmarkVisited(landmarkId: string, sessionId?: string): Promise<boolean>;
  getVisitedCount(sessionId?: string): Promise<number>;
}

const CITIES: City[] = [
  {
    id: 'rome',
    name: 'Rome',
    country: 'Italy',
    lat: 41.8902,
    lng: 12.4922,
    zoom: 14
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    lat: 48.8566,
    lng: 2.3522,
    zoom: 13
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    zoom: 13
  }
];

const LANDMARKS: Landmark[] = [
  // Rome landmarks
  {
    id: 'colosseum',
    cityId: 'rome',
    name: 'Colosseum',
    lat: 41.8902,
    lng: 12.4922,
    radius: 70,
    narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
    description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
    category: 'Ancient Rome',
    detailedDescription: 'The Colosseum, also known as the Flavian Amphitheatre, stands as one of the greatest architectural achievements of ancient Rome and remains the largest amphitheater ever constructed. Built between 70-80 AD under Emperors Vespasian and Titus, this magnificent elliptical structure could accommodate between 50,000 to 80,000 spectators who came to witness gladiatorial contests, animal hunts, mock naval battles, and public executions. The name "Colosseum" likely derives from the colossal bronze statue of Nero that once stood nearby. Constructed primarily of travertine limestone blocks, volcanic tuff, and brick-faced concrete, the Colosseum showcases the engineering brilliance of Roman architecture. Its innovative design featured a complex system of vaults and arches that distributed weight efficiently, allowing for its massive four-story facade. The exterior was adorned with Doric, Ionic, and Corinthian columns on successive levels, demonstrating the Romans mastery of classical architectural orders. The arena floor, once covered with wooden planking and sand, concealed an elaborate underground network called the hypogeum - a two-level subterranean complex of tunnels and chambers where gladiators, animals, and stage equipment were housed and prepared for the spectacles above. A sophisticated system of pulleys, ramps, and trapdoors allowed for dramatic entrances and special effects during performances. The Colosseum also featured a retractable awning system called the velarium, operated by sailors from the Roman navy, which provided shade for spectators during events. Despite suffering damage from earthquakes, stone-robbers who repurposed its materials for other buildings, and the general passage of time, the Colosseum has endured as a powerful symbol of Imperial Rome and ancient civilization. Today, it stands as one of Rome\'s most popular tourist attractions and a UNESCO World Heritage Site, drawing millions of visitors annually who come to marvel at this extraordinary monument to Roman engineering and entertainment.',
    photos: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1548585744-6e2d7c1e1a21?w=800',
      'https://images.unsplash.com/photo-1598559862042-31ebfe8e09f2?w=800'
    ],
    historicalInfo: 'The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of Rome. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held 50,000 to 80,000 spectators.',
    yearBuilt: '70-80 AD',
    architect: 'Emperors Vespasian and Titus',
    translations: {
      en: {
        name: 'Colosseum',
        narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
        description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
        detailedDescription: 'The Colosseum, also known as the Flavian Amphitheatre, stands as one of the greatest architectural achievements of ancient Rome and remains the largest amphitheater ever constructed. Built between 70-80 AD under Emperors Vespasian and Titus, this magnificent elliptical structure could accommodate between 50,000 to 80,000 spectators who came to witness gladiatorial contests, animal hunts, mock naval battles, and public executions. The name "Colosseum" likely derives from the colossal bronze statue of Nero that once stood nearby. Constructed primarily of travertine limestone blocks, volcanic tuff, and brick-faced concrete, the Colosseum showcases the engineering brilliance of Roman architecture. Its innovative design featured a complex system of vaults and arches that distributed weight efficiently, allowing for its massive four-story facade. The exterior was adorned with Doric, Ionic, and Corinthian columns on successive levels, demonstrating the Romans mastery of classical architectural orders. The arena floor, once covered with wooden planking and sand, concealed an elaborate underground network called the hypogeum - a two-level subterranean complex of tunnels and chambers where gladiators, animals, and stage equipment were housed and prepared for the spectacles above. A sophisticated system of pulleys, ramps, and trapdoors allowed for dramatic entrances and special effects during performances. The Colosseum also featured a retractable awning system called the velarium, operated by sailors from the Roman navy, which provided shade for spectators during events. Despite suffering damage from earthquakes, stone-robbers who repurposed its materials for other buildings, and the general passage of time, the Colosseum has endured as a powerful symbol of Imperial Rome and ancient civilization. Today, it stands as one of Rome\'s most popular tourist attractions and a UNESCO World Heritage Site, drawing millions of visitors annually who come to marvel at this extraordinary monument to Roman engineering and entertainment.'
      },
      it: {
        name: 'Colosseo',
        narration: 'Benvenuto al Colosseo, il simbolo iconico di Roma. Questo antico anfiteatro ospitava combattimenti tra gladiatori e spettacoli pubblici.',
        description: 'Il più grande anfiteatro mai costruito, patrimonio mondiale dell\'UNESCO',
        detailedDescription: 'Il Colosseo, conosciuto anche come Anfiteatro Flavio, rappresenta uno dei più grandi risultati architettonici dell\'antica Roma e rimane il più grande anfiteatro mai costruito. Edificato tra il 70 e l\'80 d.C. sotto gli imperatori Vespasiano e Tito, questa magnifica struttura ellittica poteva ospitare tra 50.000 e 80.000 spettatori che venivano ad assistere a combattimenti tra gladiatori, cacce di animali, battaglie navali simulate ed esecuzioni pubbliche. Il nome "Colosseo" deriva probabilmente dalla colossale statua in bronzo di Nerone che un tempo si ergeva nelle vicinanze. Costruito principalmente con blocchi di pietra calcarea travertino, tufo vulcanico e cemento rivestito di mattoni, il Colosseo mostra la genialità ingegneristica dell\'architettura romana. Il suo design innovativo presentava un complesso sistema di volte e archi che distribuivano il peso in modo efficiente, consentendo la sua massiccia facciata a quattro piani. L\'esterno era adornato con colonne doriche, ioniche e corinzie su livelli successivi, dimostrando la padronanza romana degli ordini architettonici classici. Il pavimento dell\'arena, un tempo coperto da assi di legno e sabbia, nascondeva un\'elaborata rete sotterranea chiamata ipogeo - un complesso sotterraneo a due livelli di tunnel e camere dove gladiatori, animali e attrezzature sceniche venivano ospitati e preparati per gli spettacoli soprastanti. Un sofisticato sistema di carrucole, rampe e botole permetteva ingressi drammatici ed effetti speciali durante le rappresentazioni. Il Colosseo disponeva anche di un sistema di tende retrattili chiamato velarium, gestito da marinai della marina romana, che forniva ombra agli spettatori durante gli eventi. Nonostante i danni subiti da terremoti, saccheggiatori di pietra che ne hanno riutilizzato i materiali per altri edifici e il generale trascorrere del tempo, il Colosseo è rimasto un potente simbolo della Roma imperiale e della civiltà antica. Oggi si erge come una delle attrazioni turistiche più popolari di Roma e un sito patrimonio mondiale dell\'UNESCO, attirando milioni di visitatori ogni anno che vengono ad ammirare questo straordinario monumento all\'ingegneria e all\'intrattenimento romano.'
      },
      ko: {
        name: '콜로세움',
        narration: '로마의 상징인 콜로세움에 오신 것을 환영합니다. 이 고대 원형 경기장은 한때 검투사 경기와 공개 행사를 개최했습니다.',
        description: '역사상 가장 큰 원형 경기장이자 유네스코 세계문화유산',
        detailedDescription: '플라비우스 원형극장으로도 알려진 콜로세움은 고대 로마의 가장 위대한 건축적 성취 중 하나로 남아있으며, 지금까지 건설된 가장 큰 원형 경기장입니다. 서기 70-80년 베스파시아누스와 티투스 황제 치하에 건설된 이 웅장한 타원형 구조물은 검투사 경기, 동물 사냥, 모의 해전, 공개 처형을 관람하러 온 5만에서 8만 명의 관중을 수용할 수 있었습니다. "콜로세움"이라는 이름은 근처에 서 있던 네로의 거대한 청동 조각상에서 유래했을 가능성이 큽니다. 주로 석회암 블록, 화산 응회암, 벽돌로 된 콘크리트로 건설된 콜로세움은 로마 건축의 공학적 우수성을 보여줍니다. 혁신적인 설계는 무게를 효율적으로 분산시키는 복잡한 볼트와 아치 시스템을 특징으로 하여 거대한 4층 파사드를 가능하게 했습니다. 외부는 연속적인 층에 도리아식, 이오니아식, 코린트식 기둥으로 장식되어 로마인들의 고전 건축 양식 숙달을 보여줍니다. 한때 나무 판자와 모래로 덮여 있던 경기장 바닥은 하이포지움이라고 불리는 정교한 지하 네트워크를 숨기고 있었습니다 - 검투사, 동물, 무대 장비가 보관되고 위의 공연을 위해 준비되던 2층 지하 터널과 방으로 이루어진 복합 공간이었습니다. 정교한 도르래, 경사로, 함정문 시스템은 공연 중 극적인 등장과 특수 효과를 가능하게 했습니다. 콜로세움은 또한 로마 해군의 선원들이 작동하는 벨라리움이라는 개폐식 차양 시스템을 갖추고 있어 행사 중 관중에게 그늘을 제공했습니다. 지진, 다른 건물에 자재를 재사용한 약탈자들, 그리고 시간의 경과로 인한 피해에도 불구하고, 콜로세움은 로마 제국과 고대 문명의 강력한 상징으로 남아있습니다. 오늘날 로마에서 가장 인기 있는 관광 명소이자 유네스코 세계문화유산으로 서 있으며, 매년 수백만 명의 방문객이 로마 공학과 오락의 이 특별한 기념물을 감상하러 옵니다.'
      },
      es: {
        name: 'Coliseo',
        narration: 'Bienvenido al Coliseo, el símbolo icónico de Roma. Este antiguo anfiteatro albergó combates de gladiadores y espectáculos públicos.',
        description: 'El anfiteatro más grande jamás construido, Patrimonio de la Humanidad de la UNESCO'
      },
      fr: {
        name: 'Colisée',
        narration: 'Bienvenue au Colisée, le symbole emblématique de Rome. Cet amphithéâtre antique accueillait des combats de gladiateurs et des spectacles publics.',
        description: 'Le plus grand amphithéâtre jamais construit, site du patrimoine mondial de l\'UNESCO'
      },
      de: {
        name: 'Kolosseum',
        narration: 'Willkommen im Kolosseum, dem ikonischen Symbol Roms. Dieses antike Amphitheater war Schauplatz von Gladiatorenkämpfen und öffentlichen Spektakeln.',
        description: 'Das größte jemals gebaute Amphitheater, UNESCO-Weltkulturerbe'
      },
      zh: {
        name: '罗马斗兽场',
        narration: '欢迎来到罗马斗兽场，罗马的标志性象征。这座古老的圆形剧场曾举办角斗士比赛和公共表演。',
        description: '有史以来最大的圆形剧场，联合国教科文组织世界遗产'
      },
      ja: {
        name: 'コロッセオ',
        narration: 'ローマの象徴的シンボル、コロッセオへようこそ。この古代円形闘技場では剣闘士の戦いや公開スペクタクルが開催されました。',
        description: '史上最大の円形闘技場、ユネスコ世界遺産'
      }
    }
  },
  {
    id: 'roman_forum',
    cityId: 'rome',
    name: 'Roman Forum',
    lat: 41.8925,
    lng: 12.4853,
    radius: 60,
    narration: 'You are at the Roman Forum, the heart of ancient Rome. This was the center of political life during the Republic era, where historic buildings still stand.',
    description: 'The center of ancient Roman public life',
    category: 'Ancient Rome',
    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800'
    ],
    historicalInfo: 'The Roman Forum was the center of day-to-day life in Rome: the site of triumphal processions and elections, the venue for public speeches, criminal trials, and gladiatorial matches, and the nucleus of commercial affairs.',
    yearBuilt: '7th century BC',
    architect: 'Various Roman architects over centuries'
  },
  {
    id: 'trevi_fountain',
    cityId: 'rome',
    name: 'Trevi Fountain',
    lat: 41.9009,
    lng: 12.4833,
    radius: 50,
    narration: 'This is the Trevi Fountain. Legend says if you throw a coin over your shoulder into the fountain, you will return to Rome.',
    description: 'The most famous fountain in Rome',
    category: 'Fountain',
    photos: [
      'https://images.unsplash.com/photo-1548585744-6e2d7c1e1a21?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'
    ],
    historicalInfo: 'The Trevi Fountain is the largest Baroque fountain in the city and one of the most famous fountains in the world. Standing 26.3 metres (86 ft) high and 49.15 metres (161.3 ft) wide, it is the largest Baroque fountain in the city.',
    yearBuilt: '1732-1762',
    architect: 'Nicola Salvi'
  },
  {
    id: 'pantheon',
    cityId: 'rome',
    name: 'Pantheon',
    lat: 41.8986,
    lng: 12.4768,
    radius: 50,
    narration: 'The Pantheon is a temple dedicated to all the gods. It is a masterpiece of ancient architecture with its magnificent dome.',
    description: 'An architectural marvel with the world\'s largest unreinforced concrete dome',
    category: 'Ancient Rome',
    photos: [
      'https://images.unsplash.com/photo-1555992258-ecd66771df1c?w=800',
      'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800'
    ],
    historicalInfo: 'The Pantheon is a former Roman temple and, since 609 AD, a Catholic church. It is the best-preserved of all Ancient Roman buildings and has been in continuous use throughout its history.',
    yearBuilt: '126 AD',
    architect: 'Emperor Hadrian'
  },
  {
    id: 'spanish_steps',
    cityId: 'rome',
    name: 'Spanish Steps',
    lat: 41.9059,
    lng: 12.4823,
    radius: 50,
    narration: 'Welcome to the Spanish Steps, famous as a filming location for the movie "Roman Holiday".',
    description: 'A monumental stairway of 135 steps',
    category: 'Landmark',
    photos: [
      'https://images.unsplash.com/photo-1559564323-2598bc839f43?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800'
    ],
    historicalInfo: 'The Spanish Steps are a set of steps in Rome, climbing a steep slope between the Piazza di Spagna at the base and Piazza Trinità dei Monti, dominated by the Trinità dei Monti church at the top.',
    yearBuilt: '1723-1726',
    architect: 'Francesco de Sanctis and Alessandro Specchi'
  },
  // Paris landmarks
  {
    id: 'eiffel_tower',
    cityId: 'paris',
    name: 'Eiffel Tower',
    lat: 48.8584,
    lng: 2.2945,
    radius: 70,
    narration: 'Welcome to the Eiffel Tower, the iron lady of Paris. Built for the 1889 World\'s Fair, it has become the global icon of France.',
    description: 'The most-visited paid monument in the world',
    category: 'Monument'
  },
  {
    id: 'louvre',
    cityId: 'paris',
    name: 'Louvre Museum',
    lat: 48.8606,
    lng: 2.3376,
    radius: 60,
    narration: 'You are at the Louvre Museum, the world\'s largest art museum. Home to thousands of works including the Mona Lisa.',
    description: 'The world\'s largest art museum and a historic monument',
    category: 'Museum'
  },
  {
    id: 'notre_dame',
    cityId: 'paris',
    name: 'Notre-Dame Cathedral',
    lat: 48.8530,
    lng: 2.3499,
    radius: 50,
    narration: 'This is Notre-Dame Cathedral, a masterpiece of French Gothic architecture dating back to the 12th century.',
    description: 'A medieval Catholic cathedral and UNESCO World Heritage Site',
    category: 'Cathedral'
  },
  {
    id: 'arc_triomphe',
    cityId: 'paris',
    name: 'Arc de Triomphe',
    lat: 48.8738,
    lng: 2.2950,
    radius: 50,
    narration: 'The Arc de Triomphe honors those who fought for France. It stands at the center of Place Charles de Gaulle.',
    description: 'One of the most famous monuments in Paris',
    category: 'Monument'
  },
  // London landmarks
  {
    id: 'big_ben',
    cityId: 'london',
    name: 'Big Ben',
    lat: 51.5007,
    lng: -0.1246,
    radius: 50,
    narration: 'Welcome to Big Ben, the iconic clock tower of London. Officially known as Elizabeth Tower, its chimes are known worldwide.',
    description: 'The Great Clock of Westminster',
    category: 'Monument'
  },
  {
    id: 'tower_bridge',
    cityId: 'london',
    name: 'Tower Bridge',
    lat: 51.5055,
    lng: -0.0754,
    radius: 60,
    narration: 'You are at Tower Bridge, one of London\'s most famous landmarks. This combined bascule and suspension bridge crosses the River Thames.',
    description: 'An iconic symbol of London since 1894',
    category: 'Bridge'
  },
  {
    id: 'buckingham_palace',
    cityId: 'london',
    name: 'Buckingham Palace',
    lat: 51.5014,
    lng: -0.1419,
    radius: 70,
    narration: 'This is Buckingham Palace, the London residence of the British monarch. Watch the famous Changing of the Guard ceremony.',
    description: 'The official residence of the British monarch',
    category: 'Palace'
  },
  {
    id: 'london_eye',
    cityId: 'london',
    name: 'London Eye',
    lat: 51.5033,
    lng: -0.1195,
    radius: 50,
    narration: 'The London Eye is a giant observation wheel offering spectacular views over the city.',
    description: 'Europe\'s tallest cantilevered observation wheel',
    category: 'Attraction'
  }
];

export class MemStorage implements IStorage {
  async getCities(): Promise<City[]> {
    return CITIES;
  }

  async getCity(id: string): Promise<City | undefined> {
    return CITIES.find(city => city.id === id);
  }

  async getLandmarks(cityId?: string): Promise<Landmark[]> {
    if (cityId) {
      return LANDMARKS.filter(landmark => landmark.cityId === cityId);
    }
    return LANDMARKS;
  }

  async getLandmark(id: string): Promise<Landmark | undefined> {
    return LANDMARKS.find(landmark => landmark.id === id);
  }

  // Visited landmarks methods - using database
  async markLandmarkVisited(landmarkId: string, sessionId?: string): Promise<VisitedLandmark> {
    // Use ON CONFLICT DO NOTHING to prevent duplicate visits
    const [visited] = await db
      .insert(visitedLandmarks)
      .values({ landmarkId, sessionId })
      .onConflictDoNothing()
      .returning();
    
    // If no row returned (duplicate), fetch the existing one
    if (!visited) {
      const conditions = sessionId 
        ? and(eq(visitedLandmarks.landmarkId, landmarkId), eq(visitedLandmarks.sessionId, sessionId))
        : eq(visitedLandmarks.landmarkId, landmarkId);
      
      const [existing] = await db
        .select()
        .from(visitedLandmarks)
        .where(conditions!);
      return existing;
    }
    
    return visited;
  }

  async getVisitedLandmarks(sessionId?: string): Promise<VisitedLandmark[]> {
    if (sessionId) {
      return await db
        .select()
        .from(visitedLandmarks)
        .where(eq(visitedLandmarks.sessionId, sessionId));
    }
    return await db.select().from(visitedLandmarks);
  }

  async isLandmarkVisited(landmarkId: string, sessionId?: string): Promise<boolean> {
    const conditions = sessionId
      ? and(eq(visitedLandmarks.landmarkId, landmarkId), eq(visitedLandmarks.sessionId, sessionId))
      : eq(visitedLandmarks.landmarkId, landmarkId);
    
    const results = await db
      .select()
      .from(visitedLandmarks)
      .where(conditions!);
    
    return results.length > 0;
  }

  async getVisitedCount(sessionId?: string): Promise<number> {
    if (sessionId) {
      const result = await db
        .select({ count: count() })
        .from(visitedLandmarks)
        .where(eq(visitedLandmarks.sessionId, sessionId));
      return result[0]?.count || 0;
    }
    
    const result = await db
      .select({ count: count() })
      .from(visitedLandmarks);
    return result[0]?.count || 0;
  }
}

export const storage = new MemStorage();
