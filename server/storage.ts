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
    detailedDescription: 'The Roman Forum, known as Forum Romanum in Latin, represents the beating heart of ancient Rome and stands as one of the most important archaeological sites in the world. For over a thousand years, this rectangular plaza served as the center of Roman public life, witnessing the rise and fall of the Roman Republic and Empire. Originally a marshy burial ground between the Palatine and Capitoline Hills, the area was drained in the 7th century BC and transformed into Rome\'s central marketplace and gathering place. As Rome grew in power and prestige, the Forum evolved from a simple marketplace into a magnificent complex of temples, basilicas, and government buildings that showcased the architectural and political achievements of Roman civilization. The Forum was the site of triumphal processions celebrating military victories, where victorious generals would parade through the Via Sacra (Sacred Road) with their spoils of war and captive enemies. It hosted political assemblies where citizens debated the future of the Republic, criminal trials that determined justice, public speeches that swayed public opinion, and commercial activities that drove the Roman economy. Among its most significant structures was the Curia Julia, the senate house where Rome\'s most powerful political body met to debate legislation and policy. The Temple of Saturn, one of the Forum\'s oldest and most revered buildings, housed the state treasury and was the site of the annual Saturnalia festival. The Arch of Septimius Severus commemorated military victories in the East, while the Column of Phocas, erected in 608 AD, represents one of the last monuments added to the Forum. The Basilica Julia and Basilica Aemilia served as courts of law and commercial centers, their vast interiors bustling with lawyers, merchants, and citizens conducting business. The Temple of Vesta, home to the sacred flame tended by the Vestal Virgins, symbolized the eternal nature of Rome itself. After the fall of the Western Roman Empire, the Forum gradually fell into disrepair, its monuments stripped for building materials and its ground level rising as centuries of debris accumulated. During the Middle Ages, the area was known as "Campo Vaccino" (Cow Field) and was used for grazing cattle. Systematic excavations beginning in the 18th and 19th centuries revealed the Forum\'s magnificent past, uncovering temples, arches, and basilicas that had been buried for centuries. Today, walking through the Roman Forum is like stepping back in time, where every column, arch, and stone tells a story of ancient Rome\'s glory, power, and eventual decline.',
    photos: [
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800'
    ],
    historicalInfo: 'The Roman Forum was the center of day-to-day life in Rome: the site of triumphal processions and elections, the venue for public speeches, criminal trials, and gladiatorial matches, and the nucleus of commercial affairs.',
    yearBuilt: '7th century BC',
    architect: 'Various Roman architects over centuries',
    translations: {
      en: {
        name: 'Roman Forum',
        narration: 'You are at the Roman Forum, the heart of ancient Rome. This was the center of political life during the Republic era, where historic buildings still stand.',
        description: 'The center of ancient Roman public life',
        detailedDescription: 'The Roman Forum, known as Forum Romanum in Latin, represents the beating heart of ancient Rome and stands as one of the most important archaeological sites in the world. For over a thousand years, this rectangular plaza served as the center of Roman public life, witnessing the rise and fall of the Roman Republic and Empire. Originally a marshy burial ground between the Palatine and Capitoline Hills, the area was drained in the 7th century BC and transformed into Rome\'s central marketplace and gathering place. As Rome grew in power and prestige, the Forum evolved from a simple marketplace into a magnificent complex of temples, basilicas, and government buildings that showcased the architectural and political achievements of Roman civilization. The Forum was the site of triumphal processions celebrating military victories, where victorious generals would parade through the Via Sacra (Sacred Road) with their spoils of war and captive enemies. It hosted political assemblies where citizens debated the future of the Republic, criminal trials that determined justice, public speeches that swayed public opinion, and commercial activities that drove the Roman economy. Among its most significant structures was the Curia Julia, the senate house where Rome\'s most powerful political body met to debate legislation and policy. The Temple of Saturn, one of the Forum\'s oldest and most revered buildings, housed the state treasury and was the site of the annual Saturnalia festival. The Arch of Septimius Severus commemorated military victories in the East, while the Column of Phocas, erected in 608 AD, represents one of the last monuments added to the Forum. The Basilica Julia and Basilica Aemilia served as courts of law and commercial centers, their vast interiors bustling with lawyers, merchants, and citizens conducting business. The Temple of Vesta, home to the sacred flame tended by the Vestal Virgins, symbolized the eternal nature of Rome itself. After the fall of the Western Roman Empire, the Forum gradually fell into disrepair, its monuments stripped for building materials and its ground level rising as centuries of debris accumulated. During the Middle Ages, the area was known as "Campo Vaccino" (Cow Field) and was used for grazing cattle. Systematic excavations beginning in the 18th and 19th centuries revealed the Forum\'s magnificent past, uncovering temples, arches, and basilicas that had been buried for centuries. Today, walking through the Roman Forum is like stepping back in time, where every column, arch, and stone tells a story of ancient Rome\'s glory, power, and eventual decline.'
      },
      it: {
        name: 'Foro Romano',
        narration: 'Ti trovi al Foro Romano, il cuore dell\'antica Roma. Questo era il centro della vita politica durante l\'era della Repubblica, dove gli edifici storici sono ancora in piedi.',
        description: 'Il centro della vita pubblica dell\'antica Roma'
      },
      ko: {
        name: '로마 포럼',
        narration: '고대 로마의 심장부인 로마 포럼에 오셨습니다. 이곳은 공화정 시대 정치 생활의 중심지였으며, 역사적인 건물들이 여전히 서 있습니다.',
        description: '고대 로마 공공 생활의 중심지'
      }
    }
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
    detailedDescription: 'The Trevi Fountain, or Fontana di Trevi, stands as Rome\'s largest and most spectacular Baroque fountain, captivating millions of visitors each year with its grandeur, beauty, and legendary traditions. Measuring an impressive 26.3 meters (86 feet) high and 49.15 meters (161 feet) wide, this monumental masterpiece dominates the small Trevi square, creating a breathtaking spectacle of water, marble, and sculptural artistry. The fountain\'s history begins in ancient Rome, where it marked the terminal point of the Aqua Virgo aqueduct, one of the oldest water sources supplying the city. Legend tells of a young virgin who led thirsty Roman soldiers to this water source in 19 BC, giving the aqueduct its name. For centuries, a simple basin collected the aqueduct\'s waters until Pope Urban VIII commissioned Gian Lorenzo Bernini to create a more dramatic fountain in 1629. However, the project was abandoned when the Pope died, and it wasn\'t until 1732 that Pope Clement XII launched a competition to design a grand fountain worthy of the location. Nicola Salvi won the commission, and construction began in 1732, though Salvi would not live to see his masterpiece completed. The fountain was finally finished in 1762 by Giuseppe Pannini, thirty years after construction began. The fountain\'s design centers on a majestic depiction of Oceanus, the Titan god of the sea, riding a shell-shaped chariot pulled by two sea horses - one wild and one docile - representing the varying moods of the ocean. These magnificent creatures are guided by tritons, mythological sea gods depicted blowing conch shells. The central niche housing Oceanus is flanked by two allegorical figures: Abundance on the left, holding a horn of plenty, and Health on the right, holding a cup being drunk by a snake, symbolizing well-being and prosperity. Above these niches, relief sculptures depict the discovery of the spring by the virgin and Agrippa approving the aqueduct\'s construction. The fountain\'s elaborate facade rises from the Palazzo Poli behind it, creating a theatrical backdrop of Corinthian columns, ornate carvings, and flowing drapery sculpted in travertine stone. Water cascades dramatically over artificial rocks into the large basin below, creating a symphony of sound that echoes through the surrounding buildings. The fountain pumps approximately 2,824,800 cubic feet of water through its system daily, a testament to the ancient Roman engineering that still supplies it from the Aqua Virgo aqueduct. Perhaps the most famous tradition associated with the Trevi Fountain is the coin-tossing ritual. Legend holds that visitors who throw a coin over their left shoulder using their right hand will ensure their return to Rome. Throwing two coins will bring romance with a Roman, while three coins promise marriage. This tradition generates an estimated 3,000 euros worth of coins daily, all of which are collected and donated to charity, supporting various social programs in Rome. The fountain has captured imaginations worldwide through its appearances in cinema, most notably in Federico Fellini\'s "La Dolce Vita" (1960), where Anita Ekberg\'s iconic wade through its waters created one of film history\'s most memorable scenes. This moment cemented the fountain\'s status as a symbol of romance and Italian glamour. Throughout its history, the fountain has undergone several restorations to preserve its beauty and structural integrity. The most recent comprehensive restoration, funded by the Italian fashion house Fendi and completed in 2015, cleaned and repaired the monument, restoring its brilliant white travertine to its original splendor. Today, the Trevi Fountain remains one of Rome\'s most beloved landmarks and the world\'s most visited fountain. Visitors are no longer permitted to wade in its waters, as fines were instituted to protect the monument, but this has not diminished its appeal. The fountain continues to enchant with its baroque magnificence, the perpetual sound of flowing water, and the timeless hope embodied in each coin tossed into its sparkling basin.',
    photos: [
      'https://images.unsplash.com/photo-1548585744-6e2d7c1e1a21?w=800',
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800'
    ],
    historicalInfo: 'The Trevi Fountain is the largest Baroque fountain in the city and one of the most famous fountains in the world. Standing 26.3 metres (86 ft) high and 49.15 metres (161.3 ft) wide, it is the largest Baroque fountain in the city.',
    yearBuilt: '1732-1762',
    architect: 'Nicola Salvi',
    translations: {
      en: {
        name: 'Trevi Fountain',
        narration: 'This is the Trevi Fountain. Legend says if you throw a coin over your shoulder into the fountain, you will return to Rome.',
        description: 'The most famous fountain in Rome',
        detailedDescription: 'The Trevi Fountain, or Fontana di Trevi, stands as Rome\'s largest and most spectacular Baroque fountain, captivating millions of visitors each year with its grandeur, beauty, and legendary traditions. Measuring an impressive 26.3 meters (86 feet) high and 49.15 meters (161 feet) wide, this monumental masterpiece dominates the small Trevi square, creating a breathtaking spectacle of water, marble, and sculptural artistry. The fountain\'s history begins in ancient Rome, where it marked the terminal point of the Aqua Virgo aqueduct, one of the oldest water sources supplying the city. Legend tells of a young virgin who led thirsty Roman soldiers to this water source in 19 BC, giving the aqueduct its name. For centuries, a simple basin collected the aqueduct\'s waters until Pope Urban VIII commissioned Gian Lorenzo Bernini to create a more dramatic fountain in 1629. However, the project was abandoned when the Pope died, and it wasn\'t until 1732 that Pope Clement XII launched a competition to design a grand fountain worthy of the location. Nicola Salvi won the commission, and construction began in 1732, though Salvi would not live to see his masterpiece completed. The fountain was finally finished in 1762 by Giuseppe Pannini, thirty years after construction began. The fountain\'s design centers on a majestic depiction of Oceanus, the Titan god of the sea, riding a shell-shaped chariot pulled by two sea horses - one wild and one docile - representing the varying moods of the ocean. These magnificent creatures are guided by tritons, mythological sea gods depicted blowing conch shells. The central niche housing Oceanus is flanked by two allegorical figures: Abundance on the left, holding a horn of plenty, and Health on the right, holding a cup being drunk by a snake, symbolizing well-being and prosperity. Above these niches, relief sculptures depict the discovery of the spring by the virgin and Agrippa approving the aqueduct\'s construction. The fountain\'s elaborate facade rises from the Palazzo Poli behind it, creating a theatrical backdrop of Corinthian columns, ornate carvings, and flowing drapery sculpted in travertine stone. Water cascades dramatically over artificial rocks into the large basin below, creating a symphony of sound that echoes through the surrounding buildings. The fountain pumps approximately 2,824,800 cubic feet of water through its system daily, a testament to the ancient Roman engineering that still supplies it from the Aqua Virgo aqueduct. Perhaps the most famous tradition associated with the Trevi Fountain is the coin-tossing ritual. Legend holds that visitors who throw a coin over their left shoulder using their right hand will ensure their return to Rome. Throwing two coins will bring romance with a Roman, while three coins promise marriage. This tradition generates an estimated 3,000 euros worth of coins daily, all of which are collected and donated to charity, supporting various social programs in Rome. The fountain has captured imaginations worldwide through its appearances in cinema, most notably in Federico Fellini\'s "La Dolce Vita" (1960), where Anita Ekberg\'s iconic wade through its waters created one of film history\'s most memorable scenes. This moment cemented the fountain\'s status as a symbol of romance and Italian glamour. Throughout its history, the fountain has undergone several restorations to preserve its beauty and structural integrity. The most recent comprehensive restoration, funded by the Italian fashion house Fendi and completed in 2015, cleaned and repaired the monument, restoring its brilliant white travertine to its original splendor. Today, the Trevi Fountain remains one of Rome\'s most beloved landmarks and the world\'s most visited fountain. Visitors are no longer permitted to wade in its waters, as fines were instituted to protect the monument, but this has not diminished its appeal. The fountain continues to enchant with its baroque magnificence, the perpetual sound of flowing water, and the timeless hope embodied in each coin tossed into its sparkling basin.'
      },
      it: {
        name: 'Fontana di Trevi',
        narration: 'Questa è la Fontana di Trevi. La leggenda dice che se getti una moneta oltre la spalla nella fontana, tornerai a Roma.',
        description: 'La fontana più famosa di Roma'
      },
      ko: {
        name: '트레비 분수',
        narration: '이곳은 트레비 분수입니다. 전설에 따르면 분수에 어깨 너머로 동전을 던지면 로마로 다시 돌아온다고 합니다.',
        description: '로마에서 가장 유명한 분수'
      },
      es: {
        name: 'Fontana de Trevi',
        narration: 'Esta es la Fontana de Trevi. La leyenda dice que si lanzas una moneda por encima del hombro a la fuente, volverás a Roma.',
        description: 'La fuente más famosa de Roma'
      },
      fr: {
        name: 'Fontaine de Trevi',
        narration: 'Voici la Fontaine de Trevi. La légende dit que si vous jetez une pièce par-dessus votre épaule dans la fontaine, vous reviendrez à Rome.',
        description: 'La fontaine la plus célèbre de Rome'
      },
      de: {
        name: 'Trevi-Brunnen',
        narration: 'Dies ist der Trevi-Brunnen. Die Legende besagt, dass Sie nach Rom zurückkehren werden, wenn Sie eine Münze über Ihre Schulter in den Brunnen werfen.',
        description: 'Der berühmteste Brunnen Roms'
      },
      zh: {
        name: '特莱维喷泉',
        narration: '这是特莱维喷泉。传说如果你把硬币从肩膀上扔进喷泉，你会重返罗马。',
        description: '罗马最著名的喷泉'
      },
      ja: {
        name: 'トレビの泉',
        narration: 'これがトレビの泉です。伝説によれば、肩越しにコインを投げ入れるとローマに戻ってくることができます。',
        description: 'ローマで最も有名な噴水'
      }
    }
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
    detailedDescription: 'The Pantheon stands as one of the best-preserved monuments of ancient Rome and represents one of the most influential buildings in the history of architecture. This remarkable structure, whose name derives from the Greek words "pan" (all) and "theos" (gods), meaning "temple to all gods," continues to inspire architects and visitors nearly two millennia after its construction. The building we see today was commissioned by Emperor Hadrian around 126 AD, though it replaced an earlier temple built by Marcus Agrippa in 27 BC, whose name still appears in the inscription on the portico. What makes the Pantheon truly extraordinary is its massive dome, which remains the world\'s largest unreinforced concrete dome even after nearly 2,000 years. Measuring 43.3 meters (142 feet) in both diameter and height from the floor to the oculus, the dome creates a perfect hemisphere, embodying the Roman architectural ideal of geometric harmony. This architectural marvel was achieved through ingenious engineering techniques that modern builders still study and admire. The concrete used in construction varies in composition throughout the dome\'s height, with heavier aggregates like travertine and brick at the base transitioning to lighter materials like pumice at the apex, reducing the overall weight while maintaining structural integrity. The thickness of the dome also decreases from 6.4 meters at the base to just 1.2 meters at the oculus, further optimizing its weight distribution. The most striking feature of the Pantheon\'s interior is the oculus, a circular opening 8.2 meters (27 feet) in diameter at the dome\'s apex. This remarkable architectural element serves as the building\'s only source of natural light, creating a dramatic beam of sunlight that moves across the interior throughout the day, illuminating different architectural features and creating an ever-changing interplay of light and shadow. The oculus is open to the elements, allowing rain to enter the building, but the floor is slightly convex with drainage holes to channel water away. The symbolic significance of this opening extends beyond its practical purpose - it represents the connection between the temple and the heavens, the dwelling place of the gods to whom the building was dedicated. The Pantheon\'s portico features sixteen massive Corinthian columns, each carved from a single piece of Egyptian granite, standing 11.8 meters (39 feet) tall and weighing approximately 60 tons each. These columns support a triangular pediment that once contained bronze sculptures, though these were removed over the centuries. The bronze that once covered the portico ceiling beams was also stripped away, reportedly taken by Byzantine Emperor Constans II in 663 AD. The building\'s perfect proportions and harmonious design influenced countless structures throughout history. During the Renaissance, artists and architects like Michelangelo, Raphael, and Brunelleschi studied the Pantheon intensively, drawing inspiration from its perfect geometry and innovative construction techniques. Raphael himself is buried here, along with several Italian kings and other notable figures. In 609 AD, Byzantine Emperor Phocas gave the Pantheon to Pope Boniface IV, who converted it into a Christian church dedicated to "St. Mary and the Martyrs," a transformation that ultimately saved the building from the destruction and plundering that befell many other Roman temples. This conversion to a church ensured its continuous maintenance and preservation through the medieval period and beyond. The building has witnessed numerous historical events and transformations. During the Renaissance, it briefly served as a fortress, and in the 17th century, Pope Urban VIII controversially removed the bronze from the portico to make cannons for Castel Sant\'Angelo and to create Bernini\'s baldachin in St. Peter\'s Basilica, an act that gave rise to the saying "What the barbarians didn\'t do, the Barberini did" - a play on the Pope\'s family name. Today, the Pantheon remains an active church where Mass is celebrated, particularly on important occasions, while simultaneously serving as one of Rome\'s most visited tourist attractions and a burial place for distinguished Italians. The building stands as a testament to Roman engineering genius, religious continuity, and architectural perfection, continuing to inspire wonder and admiration in all who enter its sacred space and gaze up at the magnificent dome with its oculus open to the sky.',
    photos: [
      'https://images.unsplash.com/photo-1555992258-ecd66771df1c?w=800',
      'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800'
    ],
    historicalInfo: 'The Pantheon is a former Roman temple and, since 609 AD, a Catholic church. It is the best-preserved of all Ancient Roman buildings and has been in continuous use throughout its history.',
    yearBuilt: '126 AD',
    architect: 'Emperor Hadrian',
    translations: {
      en: {
        name: 'Pantheon',
        narration: 'The Pantheon is a temple dedicated to all the gods. It is a masterpiece of ancient architecture with its magnificent dome.',
        description: 'An architectural marvel with the world\'s largest unreinforced concrete dome',
        detailedDescription: 'The Pantheon stands as one of the best-preserved monuments of ancient Rome and represents one of the most influential buildings in the history of architecture. This remarkable structure, whose name derives from the Greek words "pan" (all) and "theos" (gods), meaning "temple to all gods," continues to inspire architects and visitors nearly two millennia after its construction. The building we see today was commissioned by Emperor Hadrian around 126 AD, though it replaced an earlier temple built by Marcus Agrippa in 27 BC, whose name still appears in the inscription on the portico. What makes the Pantheon truly extraordinary is its massive dome, which remains the world\'s largest unreinforced concrete dome even after nearly 2,000 years. Measuring 43.3 meters (142 feet) in both diameter and height from the floor to the oculus, the dome creates a perfect hemisphere, embodying the Roman architectural ideal of geometric harmony. This architectural marvel was achieved through ingenious engineering techniques that modern builders still study and admire. The concrete used in construction varies in composition throughout the dome\'s height, with heavier aggregates like travertine and brick at the base transitioning to lighter materials like pumice at the apex, reducing the overall weight while maintaining structural integrity. The thickness of the dome also decreases from 6.4 meters at the base to just 1.2 meters at the oculus, further optimizing its weight distribution. The most striking feature of the Pantheon\'s interior is the oculus, a circular opening 8.2 meters (27 feet) in diameter at the dome\'s apex. This remarkable architectural element serves as the building\'s only source of natural light, creating a dramatic beam of sunlight that moves across the interior throughout the day, illuminating different architectural features and creating an ever-changing interplay of light and shadow. The oculus is open to the elements, allowing rain to enter the building, but the floor is slightly convex with drainage holes to channel water away. The symbolic significance of this opening extends beyond its practical purpose - it represents the connection between the temple and the heavens, the dwelling place of the gods to whom the building was dedicated. The Pantheon\'s portico features sixteen massive Corinthian columns, each carved from a single piece of Egyptian granite, standing 11.8 meters (39 feet) tall and weighing approximately 60 tons each. These columns support a triangular pediment that once contained bronze sculptures, though these were removed over the centuries. The bronze that once covered the portico ceiling beams was also stripped away, reportedly taken by Byzantine Emperor Constans II in 663 AD. The building\'s perfect proportions and harmonious design influenced countless structures throughout history. During the Renaissance, artists and architects like Michelangelo, Raphael, and Brunelleschi studied the Pantheon intensively, drawing inspiration from its perfect geometry and innovative construction techniques. Raphael himself is buried here, along with several Italian kings and other notable figures. In 609 AD, Byzantine Emperor Phocas gave the Pantheon to Pope Boniface IV, who converted it into a Christian church dedicated to "St. Mary and the Martyrs," a transformation that ultimately saved the building from the destruction and plundering that befell many other Roman temples. This conversion to a church ensured its continuous maintenance and preservation through the medieval period and beyond. The building has witnessed numerous historical events and transformations. During the Renaissance, it briefly served as a fortress, and in the 17th century, Pope Urban VIII controversially removed the bronze from the portico to make cannons for Castel Sant\'Angelo and to create Bernini\'s baldachin in St. Peter\'s Basilica, an act that gave rise to the saying "What the barbarians didn\'t do, the Barberini did" - a play on the Pope\'s family name. Today, the Pantheon remains an active church where Mass is celebrated, particularly on important occasions, while simultaneously serving as one of Rome\'s most visited tourist attractions and a burial place for distinguished Italians. The building stands as a testament to Roman engineering genius, religious continuity, and architectural perfection, continuing to inspire wonder and admiration in all who enter its sacred space and gaze up at the magnificent dome with its oculus open to the sky.'
      },
      it: {
        name: 'Pantheon',
        narration: 'Il Pantheon è un tempio dedicato a tutti gli dei. È un capolavoro dell\'architettura antica con la sua magnifica cupola.',
        description: 'Una meraviglia architettonica con la più grande cupola in calcestruzzo non armato del mondo'
      },
      ko: {
        name: '판테온',
        narration: '판테온은 모든 신들에게 헌정된 신전입니다. 웅장한 돔이 있는 고대 건축의 걸작입니다.',
        description: '세계에서 가장 큰 무근 콘크리트 돔을 가진 건축의 경이'
      },
      es: {
        name: 'Panteón',
        narration: 'El Panteón es un templo dedicado a todos los dioses. Es una obra maestra de la arquitectura antigua con su magnífica cúpula.',
        description: 'Una maravilla arquitectónica con la cúpula de hormigón sin refuerzo más grande del mundo'
      },
      fr: {
        name: 'Panthéon',
        narration: 'Le Panthéon est un temple dédié à tous les dieux. C\'est un chef-d\'œuvre de l\'architecture antique avec son magnifique dôme.',
        description: 'Une merveille architecturale avec la plus grande coupole en béton non armé du monde'
      },
      de: {
        name: 'Pantheon',
        narration: 'Das Pantheon ist ein Tempel, der allen Göttern gewidmet ist. Es ist ein Meisterwerk antiker Architektur mit seiner prächtigen Kuppel.',
        description: 'Ein architektonisches Wunderwerk mit der größten unbewehrten Betonkuppel der Welt'
      },
      zh: {
        name: '万神殿',
        narration: '万神殿是一座献给所有神灵的神殿。它是古代建筑的杰作，拥有宏伟的圆顶。',
        description: '拥有世界上最大的无钢筋混凝土圆顶的建筑奇迹'
      },
      ja: {
        name: 'パンテオン',
        narration: 'パンテオンは全ての神々に捧げられた神殿です。壮大なドームを持つ古代建築の傑作です。',
        description: '世界最大の無筋コンクリートドームを持つ建築の驚異'
      }
    }
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
    detailedDescription: 'The Spanish Steps, known in Italian as "Scalinata di Trinità dei Monti," represent one of Rome\'s most beloved and photographed landmarks, gracefully connecting the Piazza di Spagna at the base with the Trinità dei Monti church and the Pincian Hill above. This monumental Baroque stairway consists of 135 steps divided into twelve flights, creating a theatrical cascade of travertine stone that has captivated visitors for three centuries. The steps take their English name from the Piazza di Spagna (Spanish Square) at their base, which in turn was named after the Spanish Embassy to the Holy See, located in the square since the 17th century. However, the steps were actually funded by French diplomacy, creating an amusing international confusion that persists to this day. The history of the Spanish Steps begins in the early 17th century when the steep slope between the Spanish Square and the church above proved difficult to navigate. Various proposals were put forward over the decades to create a grand stairway worthy of connecting these two important locations. The project languished for years due to disagreements between the French, who wanted to glorify the French monarchy, and the papacy, which sought to emphasize religious authority. Finally, French diplomat Étienne Gueffier bequeathed a substantial sum of money in his will for the construction of the steps, though it took until 1717 for Pope Clement XI to approve the project. The design competition was won by Francesco de Sanctis, whose elegant proposal drew inspiration from earlier sketches by Alessandro Specchi. Construction began in 1723 and was completed in 1725, creating the magnificent structure we see today. The steps\' design is a masterpiece of Baroque urban planning, featuring a butterfly or fan-like configuration that widens and narrows as it ascends, creating visual interest and accommodating the irregular terrain. The stairway is not merely functional but transforms the steep hillside into a theatrical space where Romans and visitors alike gather, rest, and socialize. At the base, the steps open onto Piazza di Spagna, home to the famous Barcaccia fountain, designed by Pietro Bernini and his more famous son Gian Lorenzo Bernini. This fountain, shaped like a half-sunken boat, provides a whimsical counterpoint to the grandeur of the steps above. At the summit, the twin-towered façade of the Trinità dei Monti church provides a commanding visual terminus, while offering spectacular views over Rome\'s rooftops. The steps have long been a gathering place for artists, writers, and travelers. During the 18th and 19th centuries, artists\' models would congregate on the steps, hoping to be hired by painters and sculptors working in the area. The adjacent houses where poets John Keats and Percy Bysshe Shelley once lived have become museums, adding literary significance to the location\'s artistic heritage. The Spanish Steps achieved immortal fame in cinema through their appearance in the 1953 film "Roman Holiday," where Audrey Hepburn\'s character enjoys gelato on the steps, creating one of cinema\'s most iconic moments and establishing the steps as a symbol of romance and la dolce vita. This scene helped cement the Spanish Steps as an essential stop on any Roman itinerary. In spring, the steps are adorned with magnificent displays of azaleas, transforming the white travertine into a cascade of pink and red blooms, a tradition that dates back centuries and creates one of Rome\'s most spectacular seasonal displays. Throughout the year, the steps serve as an impromptu theater, hosting fashion shows, concerts, and celebrations. The area surrounding the Spanish Steps has evolved into one of Rome\'s most fashionable shopping districts, with luxury boutiques lining the nearby streets, particularly Via Condotti, making it a destination for both culture and commerce. Recent restoration efforts have focused on preserving the steps for future generations. In 2015-2016, the monument underwent a comprehensive €1.5 million restoration sponsored by the jewelry house Bulgari, cleaning and repairing the travertine steps and strengthening their structural integrity. New regulations prohibit sitting on the steps and eating or drinking in the area, measures designed to protect this treasured monument from wear and damage. Despite these restrictions, the Spanish Steps remain one of Rome\'s most vibrant gathering places, where locals meet friends, tourists rest weary feet, and everyone pauses to admire the view and soak in the timeless beauty of this Baroque masterpiece that has graced the Roman landscape for three centuries.',
    photos: [
      'https://images.unsplash.com/photo-1559564323-2598bc839f43?w=800',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800'
    ],
    historicalInfo: 'The Spanish Steps are a set of steps in Rome, climbing a steep slope between the Piazza di Spagna at the base and Piazza Trinità dei Monti, dominated by the Trinità dei Monti church at the top.',
    yearBuilt: '1723-1726',
    architect: 'Francesco de Sanctis and Alessandro Specchi',
    translations: {
      en: {
        name: 'Spanish Steps',
        narration: 'Welcome to the Spanish Steps, famous as a filming location for the movie "Roman Holiday".',
        description: 'A monumental stairway of 135 steps',
        detailedDescription: 'The Spanish Steps, known in Italian as "Scalinata di Trinità dei Monti," represent one of Rome\'s most beloved and photographed landmarks, gracefully connecting the Piazza di Spagna at the base with the Trinità dei Monti church and the Pincian Hill above. This monumental Baroque stairway consists of 135 steps divided into twelve flights, creating a theatrical cascade of travertine stone that has captivated visitors for three centuries. The steps take their English name from the Piazza di Spagna (Spanish Square) at their base, which in turn was named after the Spanish Embassy to the Holy See, located in the square since the 17th century. However, the steps were actually funded by French diplomacy, creating an amusing international confusion that persists to this day. The history of the Spanish Steps begins in the early 17th century when the steep slope between the Spanish Square and the church above proved difficult to navigate. Various proposals were put forward over the decades to create a grand stairway worthy of connecting these two important locations. The project languished for years due to disagreements between the French, who wanted to glorify the French monarchy, and the papacy, which sought to emphasize religious authority. Finally, French diplomat Étienne Gueffier bequeathed a substantial sum of money in his will for the construction of the steps, though it took until 1717 for Pope Clement XI to approve the project. The design competition was won by Francesco de Sanctis, whose elegant proposal drew inspiration from earlier sketches by Alessandro Specchi. Construction began in 1723 and was completed in 1725, creating the magnificent structure we see today. The steps\' design is a masterpiece of Baroque urban planning, featuring a butterfly or fan-like configuration that widens and narrows as it ascends, creating visual interest and accommodating the irregular terrain. The stairway is not merely functional but transforms the steep hillside into a theatrical space where Romans and visitors alike gather, rest, and socialize. At the base, the steps open onto Piazza di Spagna, home to the famous Barcaccia fountain, designed by Pietro Bernini and his more famous son Gian Lorenzo Bernini. This fountain, shaped like a half-sunken boat, provides a whimsical counterpoint to the grandeur of the steps above. At the summit, the twin-towered façade of the Trinità dei Monti church provides a commanding visual terminus, while offering spectacular views over Rome\'s rooftops. The steps have long been a gathering place for artists, writers, and travelers. During the 18th and 19th centuries, artists\' models would congregate on the steps, hoping to be hired by painters and sculptors working in the area. The adjacent houses where poets John Keats and Percy Bysshe Shelley once lived have become museums, adding literary significance to the location\'s artistic heritage. The Spanish Steps achieved immortal fame in cinema through their appearance in the 1953 film "Roman Holiday," where Audrey Hepburn\'s character enjoys gelato on the steps, creating one of cinema\'s most iconic moments and establishing the steps as a symbol of romance and la dolce vita. This scene helped cement the Spanish Steps as an essential stop on any Roman itinerary. In spring, the steps are adorned with magnificent displays of azaleas, transforming the white travertine into a cascade of pink and red blooms, a tradition that dates back centuries and creates one of Rome\'s most spectacular seasonal displays. Throughout the year, the steps serve as an impromptu theater, hosting fashion shows, concerts, and celebrations. The area surrounding the Spanish Steps has evolved into one of Rome\'s most fashionable shopping districts, with luxury boutiques lining the nearby streets, particularly Via Condotti, making it a destination for both culture and commerce. Recent restoration efforts have focused on preserving the steps for future generations. In 2015-2016, the monument underwent a comprehensive €1.5 million restoration sponsored by the jewelry house Bulgari, cleaning and repairing the travertine steps and strengthening their structural integrity. New regulations prohibit sitting on the steps and eating or drinking in the area, measures designed to protect this treasured monument from wear and damage. Despite these restrictions, the Spanish Steps remain one of Rome\'s most vibrant gathering places, where locals meet friends, tourists rest weary feet, and everyone pauses to admire the view and soak in the timeless beauty of this Baroque masterpiece that has graced the Roman landscape for three centuries.'
      },
      it: {
        name: 'Scalinata di Trinità dei Monti',
        narration: 'Benvenuti alla Scalinata di Trinità dei Monti, famosa come location del film "Vacanze Romane".',
        description: 'Una monumentale scalinata di 135 gradini'
      },
      ko: {
        name: '스페인 계단',
        narration: '영화 "로마의 휴일"의 촬영 장소로 유명한 스페인 계단에 오신 것을 환영합니다.',
        description: '135개의 계단으로 이루어진 기념비적인 계단'
      },
      es: {
        name: 'Escalinata de la Plaza de España',
        narration: 'Bienvenido a la Escalinata de la Plaza de España, famosa como lugar de rodaje de la película "Vacaciones en Roma".',
        description: 'Una monumental escalinata de 135 escalones'
      },
      fr: {
        name: 'Escalier de la Trinité-des-Monts',
        narration: 'Bienvenue à l\'Escalier de la Trinité-des-Monts, célèbre comme lieu de tournage du film "Vacances Romaines".',
        description: 'Un escalier monumental de 135 marches'
      },
      de: {
        name: 'Spanische Treppe',
        narration: 'Willkommen an der Spanischen Treppe, berühmt als Drehort des Films "Ein Herz und eine Krone".',
        description: 'Eine monumentale Treppe mit 135 Stufen'
      },
      zh: {
        name: '西班牙台阶',
        narration: '欢迎来到西班牙台阶，以电影《罗马假日》的拍摄地而闻名。',
        description: '由135级台阶组成的纪念性阶梯'
      },
      ja: {
        name: 'スペイン階段',
        narration: '映画「ローマの休日」の撮影場所として有名なスペイン階段へようこそ。',
        description: '135段からなる記念碑的な階段'
      }
    }
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
    category: 'Monument',
    detailedDescription: 'The Eiffel Tower, or "La Tour Eiffel," stands as the undisputed symbol of Paris and France, an iron lattice masterpiece that has captivated the world since its completion in 1889. Rising 330 meters (1,083 feet) into the Parisian sky, this architectural marvel was initially conceived as a temporary structure for the 1889 Exposition Universelle (World\'s Fair), celebrating the centennial of the French Revolution. Today, it welcomes nearly seven million visitors annually, making it the most-visited paid monument in the world. The tower was designed by engineer Gustave Eiffel, whose company specialized in metal framework construction. Eiffel\'s design was selected from over 100 submissions in a competition to create a centerpiece for the World\'s Fair. The structure\'s innovative design and unprecedented height sparked intense controversy among Parisian artists and intellectuals, who published a petition called "Artists Against the Eiffel Tower," denouncing it as a monstrous iron monstrosity that would disfigure the elegant Parisian skyline. Notable critics included author Guy de Maupassant, who reportedly ate lunch in the tower\'s restaurant every day because it was the one place in Paris where he couldn\'t see the tower. Construction began in January 1887 and was completed in a remarkable 2 years, 2 months, and 5 days, a testament to Eiffel\'s engineering prowess and organizational skills. The tower required 18,038 metallic parts, 2.5 million rivets, and over 300 workers to assemble. Despite the enormous scale of the project and the height at which much of the work was performed, only one worker died during construction - a remarkably low casualty rate for the era. The tower\'s lattice structure was revolutionary, using an open-frame design that minimized wind resistance while maximizing strength. The four massive curved legs rest on concrete foundations, each supported by four separate foundation blocks. The legs converge as they rise, meeting at the first platform at 57 meters (187 feet). Above this, the structure continues upward through a second platform at 115 meters (377 feet) before tapering to the summit at 300 meters, with antennas extending the total height to 330 meters. The tower was painted a distinctive reddish-brown color for the exposition, but has since been repainted 18 times, with the current "Eiffel Tower Brown" requiring 60 tons of paint applied in three different shades - darker at the bottom and lighter at the top to enhance its appearance against the sky. Originally intended to stand for only 20 years, the Eiffel Tower was saved from demolition when Eiffel shrewdly emphasized its value as a radiotelegraphy station. The tower proved invaluable during World War I for intercepting enemy communications, and later became essential for radio and television broadcasting. During World War II, when Hitler visited Paris in 1940, French resistance fighters cut the elevator cables, forcing the Führer to climb the stairs if he wanted to reach the summit - he declined. The tower has served as the site of numerous scientific experiments, including Eiffel\'s own aerodynamic and meteorological studies. Physicist Théodore Wulf conducted radiation experiments from the top in 1910, leading to the discovery of cosmic rays. The tower has also witnessed remarkable feats of daring: in 1912, Austrian tailor Franz Reichelt jumped from the first platform wearing a parachute suit of his own design - tragically, it failed. In 1923, journalist Pierre Labric rode a bicycle down the stairs from the first level. The tower\'s three platforms offer spectacular views of Paris and host restaurants, museums, and shops. The first platform, recently renovated, features a glass floor offering a thrilling view straight down. The second platform houses the Michelin-starred restaurant Jules Verne, offering gourmet dining with unparalleled views. The summit, accessible by elevator, provides a breathtaking 360-degree panorama of the City of Light. The tower has been featured in countless films, artworks, and photographs, becoming synonymous with romance, elegance, and French culture. It serves as the backdrop for millions of proposals, weddings, and celebrations each year. Every evening, the tower sparkles for five minutes at the beginning of each hour after sunset, illuminated by 20,000 light bulbs installed in 1985, creating a magical spectacle visible throughout Paris. Recent additions include wind turbines and solar panels, making the iconic structure more environmentally sustainable while maintaining its historic character. The tower also hosts various exhibitions and events, from art installations to sporting events, continually reinventing itself while remaining true to Eiffel\'s original vision. Today, the Eiffel Tower stands not just as an engineering achievement but as a testament to human creativity, ambition, and the power of vision to overcome criticism and create something truly timeless. What was once derided as an eyesore has become the most recognizable landmark on Earth, proving that great art and engineering can transform not just skylines, but hearts and minds across generations.',
    photos: [
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'
    ],
    historicalInfo: 'The Eiffel Tower was built for the 1889 World\'s Fair and was initially criticized by some of France\'s leading artists and intellectuals. It has become a global cultural icon of France.',
    yearBuilt: '1887-1889',
    architect: 'Gustave Eiffel',
    translations: {
      en: {
        name: 'Eiffel Tower',
        narration: 'Welcome to the Eiffel Tower, the iron lady of Paris. Built for the 1889 World\'s Fair, it has become the global icon of France.',
        description: 'The most-visited paid monument in the world',
        detailedDescription: 'The Eiffel Tower, or "La Tour Eiffel," stands as the undisputed symbol of Paris and France, an iron lattice masterpiece that has captivated the world since its completion in 1889. Rising 330 meters (1,083 feet) into the Parisian sky, this architectural marvel was initially conceived as a temporary structure for the 1889 Exposition Universelle (World\'s Fair), celebrating the centennial of the French Revolution. Today, it welcomes nearly seven million visitors annually, making it the most-visited paid monument in the world. The tower was designed by engineer Gustave Eiffel, whose company specialized in metal framework construction. Eiffel\'s design was selected from over 100 submissions in a competition to create a centerpiece for the World\'s Fair. The structure\'s innovative design and unprecedented height sparked intense controversy among Parisian artists and intellectuals, who published a petition called "Artists Against the Eiffel Tower," denouncing it as a monstrous iron monstrosity that would disfigure the elegant Parisian skyline. Notable critics included author Guy de Maupassant, who reportedly ate lunch in the tower\'s restaurant every day because it was the one place in Paris where he couldn\'t see the tower. Construction began in January 1887 and was completed in a remarkable 2 years, 2 months, and 5 days, a testament to Eiffel\'s engineering prowess and organizational skills. The tower required 18,038 metallic parts, 2.5 million rivets, and over 300 workers to assemble. Despite the enormous scale of the project and the height at which much of the work was performed, only one worker died during construction - a remarkably low casualty rate for the era. The tower\'s lattice structure was revolutionary, using an open-frame design that minimized wind resistance while maximizing strength. The four massive curved legs rest on concrete foundations, each supported by four separate foundation blocks. The legs converge as they rise, meeting at the first platform at 57 meters (187 feet). Above this, the structure continues upward through a second platform at 115 meters (377 feet) before tapering to the summit at 300 meters, with antennas extending the total height to 330 meters. The tower was painted a distinctive reddish-brown color for the exposition, but has since been repainted 18 times, with the current "Eiffel Tower Brown" requiring 60 tons of paint applied in three different shades - darker at the bottom and lighter at the top to enhance its appearance against the sky. Originally intended to stand for only 20 years, the Eiffel Tower was saved from demolition when Eiffel shrewdly emphasized its value as a radiotelegraphy station. The tower proved invaluable during World War I for intercepting enemy communications, and later became essential for radio and television broadcasting. During World War II, when Hitler visited Paris in 1940, French resistance fighters cut the elevator cables, forcing the Führer to climb the stairs if he wanted to reach the summit - he declined. The tower has served as the site of numerous scientific experiments, including Eiffel\'s own aerodynamic and meteorological studies. Physicist Théodore Wulf conducted radiation experiments from the top in 1910, leading to the discovery of cosmic rays. The tower has also witnessed remarkable feats of daring: in 1912, Austrian tailor Franz Reichelt jumped from the first platform wearing a parachute suit of his own design - tragically, it failed. In 1923, journalist Pierre Labric rode a bicycle down the stairs from the first level. The tower\'s three platforms offer spectacular views of Paris and host restaurants, museums, and shops. The first platform, recently renovated, features a glass floor offering a thrilling view straight down. The second platform houses the Michelin-starred restaurant Jules Verne, offering gourmet dining with unparalleled views. The summit, accessible by elevator, provides a breathtaking 360-degree panorama of the City of Light. The tower has been featured in countless films, artworks, and photographs, becoming synonymous with romance, elegance, and French culture. It serves as the backdrop for millions of proposals, weddings, and celebrations each year. Every evening, the tower sparkles for five minutes at the beginning of each hour after sunset, illuminated by 20,000 light bulbs installed in 1985, creating a magical spectacle visible throughout Paris. Recent additions include wind turbines and solar panels, making the iconic structure more environmentally sustainable while maintaining its historic character. The tower also hosts various exhibitions and events, from art installations to sporting events, continually reinventing itself while remaining true to Eiffel\'s original vision. Today, the Eiffel Tower stands not just as an engineering achievement but as a testament to human creativity, ambition, and the power of vision to overcome criticism and create something truly timeless. What was once derided as an eyesore has become the most recognizable landmark on Earth, proving that great art and engineering can transform not just skylines, but hearts and minds across generations.'
      },
      it: {
        name: 'Torre Eiffel',
        narration: 'Benvenuto alla Torre Eiffel, la dama di ferro di Parigi. Costruita per l\'Esposizione Universale del 1889, è diventata l\'icona globale della Francia.',
        description: 'Il monumento a pagamento più visitato al mondo'
      },
      ko: {
        name: '에펠탑',
        narration: '파리의 철의 여인, 에펠탑에 오신 것을 환영합니다. 1889년 만국박람회를 위해 건설되어 프랑스의 세계적인 상징이 되었습니다.',
        description: '세계에서 가장 많이 방문하는 유료 기념물'
      },
      es: {
        name: 'Torre Eiffel',
        narration: 'Bienvenido a la Torre Eiffel, la dama de hierro de París. Construida para la Exposición Universal de 1889, se ha convertido en el icono global de Francia.',
        description: 'El monumento de pago más visitado del mundo'
      },
      fr: {
        name: 'Tour Eiffel',
        narration: 'Bienvenue à la Tour Eiffel, la dame de fer de Paris. Construite pour l\'Exposition Universelle de 1889, elle est devenue l\'icône mondiale de la France.',
        description: 'Le monument payant le plus visité au monde'
      },
      de: {
        name: 'Eiffelturm',
        narration: 'Willkommen am Eiffelturm, der eisernen Dame von Paris. Erbaut für die Weltausstellung 1889, ist er zum globalen Symbol Frankreichs geworden.',
        description: 'Das meistbesuchte kostenpflichtige Monument der Welt'
      },
      zh: {
        name: '埃菲尔铁塔',
        narration: '欢迎来到埃菲尔铁塔，巴黎的钢铁女士。为1889年世界博览会建造，已成为法国的全球象征。',
        description: '世界上访问量最多的收费纪念碑'
      },
      ja: {
        name: 'エッフェル塔',
        narration: 'パリの鉄の貴婦人、エッフェル塔へようこそ。1889年の万国博覧会のために建設され、フランスの世界的象徴となりました。',
        description: '世界で最も訪問者の多い有料モニュメント'
      }
    }
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
    category: 'Museum',
    detailedDescription: 'The Louvre Museum, or Musée du Louvre, stands as the world\'s largest and most visited art museum, housing an incomparable collection of over 380,000 objects and displaying 35,000 works of art across 72,735 square meters (782,910 square feet) of galleries. Located in the historic Louvre Palace on the Right Bank of the Seine in Paris, this magnificent institution attracts approximately 10 million visitors annually, making it not only a temple of art but also a pilgrimage site for culture enthusiasts from around the globe. The Louvre\'s history is as rich and layered as the artworks it contains. The site began as a fortress built by King Philippe Auguste in the late 12th century to protect Paris from Viking invasions. Archaeological remains of this medieval fortress can still be seen in the museum\'s basement. In the 14th century, Charles V transformed the fortress into a royal residence, beginning its evolution into a palace. The modern Louvre palace took shape during the Renaissance when Francis I, a great patron of the arts who brought Leonardo da Vinci to France, demolished the old fortress and began constructing a Renaissance palace in 1546. Successive monarchs, particularly Louis XIV before he moved the court to Versailles, continued expanding and embellishing the palace, creating the magnificent complex we see today. The Louvre\'s transformation into a public museum began during the French Revolution. In 1793, the revolutionary government opened the Musée Central des Arts in the Grande Galerie, displaying the royal collection and artworks confiscated from the church and émigrés. Napoleon Bonaparte greatly expanded the collection through his military campaigns, bringing treasures from across Europe and Egypt. Though many pieces were returned after his defeat, the Louvre retained a substantial collection that formed the basis of its current holdings. The museum\'s collections span from ancient civilizations to the mid-19th century and are divided into eight curatorial departments: Egyptian Antiquities, Near Eastern Antiquities, Greek and Roman Antiquities, Islamic Art, Sculpture, Decorative Arts, Paintings, and Prints and Drawings. Among its most famous treasures are Leonardo da Vinci\'s "Mona Lisa," the enigmatic portrait that draws millions of visitors who wait in long lines for a glimpse of her mysterious smile. The ancient Greek sculpture "Venus de Milo," depicting the goddess Aphrodite, captivates with her timeless beauty despite her missing arms. The "Winged Victory of Samothrace," a Hellenistic sculpture of Nike, the goddess of victory, commands attention at the top of the Daru staircase, her powerful form seemingly in motion despite being carved from marble over 2,000 years ago. The museum underwent dramatic transformation in the 1980s under President François Mitterrand\'s "Grand Louvre" project. The most controversial element was I.M. Pei\'s glass pyramid, completed in 1989, which serves as the museum\'s main entrance. Initially criticized as a modern intrusion on the historic palace, the pyramid has become an iconic symbol of the Louvre, its geometric form creating a striking dialogue between classical and contemporary architecture. The pyramid is surrounded by three smaller pyramids and fountains, creating the Cour Napoléon, a space where visitors gather before descending into the vast underground lobby that connects the museum\'s three wings: Sully, Richelieu, and Denon. The Louvre\'s galleries are a journey through human creativity and civilization. In the Egyptian Antiquities department, visitors encounter mummies, sarcophagi, and the monumental Great Sphinx of Tanis. The Near Eastern Antiquities house the Code of Hammurabi, one of the oldest deciphered writings of significant length in the world. The Greek and Roman galleries showcase classical sculptures, pottery, and jewelry that influenced Western art for millennia. The Painting galleries feature masterpieces by Caravaggio, Rembrandt, Vermeer, and countless other masters. Delacroix\'s "Liberty Leading the People" captures the revolutionary spirit of France, while Géricault\'s "The Raft of the Medusa" confronts viewers with the drama and horror of a tragic maritime disaster. The museum\'s Islamic Art department, housed in a stunning modern wing covered by an undulating golden veil designed by architects Rudy Ricciotti and Mario Bellini, displays treasures from three continents spanning 1,300 years. The Louvre is not merely a repository of art but a living institution that continues to evolve. It organizes major temporary exhibitions, conducts scholarly research, and undertakes conservation projects to preserve its treasures for future generations. The museum has also expanded globally, with the Louvre Abu Dhabi opening in 2017, extending the institution\'s mission to new audiences. Recent initiatives have focused on improving visitor experience, including timed entry tickets to manage crowds, enhanced digital guides, and special programs for families and students. The museum has also committed to transparency regarding the provenance of works in its collection, addressing historical injustices and working toward restitution when appropriate. Today, the Louvre stands as more than a museum - it is a symbol of human cultural achievement, a place where the greatest works of art from civilizations across time and space come together under one roof. Walking through its galleries is to journey through human history, to witness the evolution of artistic expression, and to stand before works that have moved, inspired, and challenged viewers for centuries. The Louvre reminds us of our shared cultural heritage and the enduring power of art to transcend time, language, and borders.',
    photos: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800'
    ],
    historicalInfo: 'The Louvre was originally a royal palace before becoming a public museum during the French Revolution in 1793. It houses approximately 38,000 objects from prehistory to the 21st century.',
    yearBuilt: 'Palace: 12th century onwards, Museum: 1793',
    architect: 'Multiple architects over centuries, Modern pyramid: I.M. Pei',
    translations: {
      en: {
        name: 'Louvre Museum',
        narration: 'You are at the Louvre Museum, the world\'s largest art museum. Home to thousands of works including the Mona Lisa.',
        description: 'The world\'s largest art museum and a historic monument',
        detailedDescription: 'The Louvre Museum, or Musée du Louvre, stands as the world\'s largest and most visited art museum, housing an incomparable collection of over 380,000 objects and displaying 35,000 works of art across 72,735 square meters (782,910 square feet) of galleries. Located in the historic Louvre Palace on the Right Bank of the Seine in Paris, this magnificent institution attracts approximately 10 million visitors annually, making it not only a temple of art but also a pilgrimage site for culture enthusiasts from around the globe. The Louvre\'s history is as rich and layered as the artworks it contains. The site began as a fortress built by King Philippe Auguste in the late 12th century to protect Paris from Viking invasions. Archaeological remains of this medieval fortress can still be seen in the museum\'s basement. In the 14th century, Charles V transformed the fortress into a royal residence, beginning its evolution into a palace. The modern Louvre palace took shape during the Renaissance when Francis I, a great patron of the arts who brought Leonardo da Vinci to France, demolished the old fortress and began constructing a Renaissance palace in 1546. Successive monarchs, particularly Louis XIV before he moved the court to Versailles, continued expanding and embellishing the palace, creating the magnificent complex we see today. The Louvre\'s transformation into a public museum began during the French Revolution. In 1793, the revolutionary government opened the Musée Central des Arts in the Grande Galerie, displaying the royal collection and artworks confiscated from the church and émigrés. Napoleon Bonaparte greatly expanded the collection through his military campaigns, bringing treasures from across Europe and Egypt. Though many pieces were returned after his defeat, the Louvre retained a substantial collection that formed the basis of its current holdings. The museum\'s collections span from ancient civilizations to the mid-19th century and are divided into eight curatorial departments: Egyptian Antiquities, Near Eastern Antiquities, Greek and Roman Antiquities, Islamic Art, Sculpture, Decorative Arts, Paintings, and Prints and Drawings. Among its most famous treasures are Leonardo da Vinci\'s "Mona Lisa," the enigmatic portrait that draws millions of visitors who wait in long lines for a glimpse of her mysterious smile. The ancient Greek sculpture "Venus de Milo," depicting the goddess Aphrodite, captivates with her timeless beauty despite her missing arms. The "Winged Victory of Samothrace," a Hellenistic sculpture of Nike, the goddess of victory, commands attention at the top of the Daru staircase, her powerful form seemingly in motion despite being carved from marble over 2,000 years ago. The museum underwent dramatic transformation in the 1980s under President François Mitterrand\'s "Grand Louvre" project. The most controversial element was I.M. Pei\'s glass pyramid, completed in 1989, which serves as the museum\'s main entrance. Initially criticized as a modern intrusion on the historic palace, the pyramid has become an iconic symbol of the Louvre, its geometric form creating a striking dialogue between classical and contemporary architecture. The pyramid is surrounded by three smaller pyramids and fountains, creating the Cour Napoléon, a space where visitors gather before descending into the vast underground lobby that connects the museum\'s three wings: Sully, Richelieu, and Denon. The Louvre\'s galleries are a journey through human creativity and civilization. In the Egyptian Antiquities department, visitors encounter mummies, sarcophagi, and the monumental Great Sphinx of Tanis. The Near Eastern Antiquities house the Code of Hammurabi, one of the oldest deciphered writings of significant length in the world. The Greek and Roman galleries showcase classical sculptures, pottery, and jewelry that influenced Western art for millennia. The Painting galleries feature masterpieces by Caravaggio, Rembrandt, Vermeer, and countless other masters. Delacroix\'s "Liberty Leading the People" captures the revolutionary spirit of France, while Géricault\'s "The Raft of the Medusa" confronts viewers with the drama and horror of a tragic maritime disaster. The museum\'s Islamic Art department, housed in a stunning modern wing covered by an undulating golden veil designed by architects Rudy Ricciotti and Mario Bellini, displays treasures from three continents spanning 1,300 years. The Louvre is not merely a repository of art but a living institution that continues to evolve. It organizes major temporary exhibitions, conducts scholarly research, and undertakes conservation projects to preserve its treasures for future generations. The museum has also expanded globally, with the Louvre Abu Dhabi opening in 2017, extending the institution\'s mission to new audiences. Recent initiatives have focused on improving visitor experience, including timed entry tickets to manage crowds, enhanced digital guides, and special programs for families and students. The museum has also committed to transparency regarding the provenance of works in its collection, addressing historical injustices and working toward restitution when appropriate. Today, the Louvre stands as more than a museum - it is a symbol of human cultural achievement, a place where the greatest works of art from civilizations across time and space come together under one roof. Walking through its galleries is to journey through human history, to witness the evolution of artistic expression, and to stand before works that have moved, inspired, and challenged viewers for centuries. The Louvre reminds us of our shared cultural heritage and the enduring power of art to transcend time, language, and borders.'
      },
      it: {
        name: 'Museo del Louvre',
        narration: 'Ti trovi al Museo del Louvre, il più grande museo d\'arte del mondo. Ospita migliaia di opere tra cui la Gioconda.',
        description: 'Il più grande museo d\'arte del mondo e un monumento storico'
      },
      ko: {
        name: '루브르 박물관',
        narration: '세계 최대의 미술관인 루브르 박물관에 오셨습니다. 모나리자를 포함한 수천 점의 작품이 소장되어 있습니다.',
        description: '세계 최대의 미술관이자 역사적 기념물'
      },
      es: {
        name: 'Museo del Louvre',
        narration: 'Está en el Museo del Louvre, el museo de arte más grande del mundo. Hogar de miles de obras, incluida la Mona Lisa.',
        description: 'El museo de arte más grande del mundo y un monumento histórico'
      },
      fr: {
        name: 'Musée du Louvre',
        narration: 'Vous êtes au Musée du Louvre, le plus grand musée d\'art du monde. Il abrite des milliers d\'œuvres, dont la Joconde.',
        description: 'Le plus grand musée d\'art du monde et un monument historique'
      },
      de: {
        name: 'Louvre-Museum',
        narration: 'Sie befinden sich im Louvre-Museum, dem größten Kunstmuseum der Welt. Heimat Tausender Werke, darunter die Mona Lisa.',
        description: 'Das größte Kunstmuseum der Welt und ein historisches Denkmal'
      },
      zh: {
        name: '卢浮宫博物馆',
        narration: '您正在卢浮宫博物馆，世界上最大的艺术博物馆。收藏了包括蒙娜丽莎在内的数千件作品。',
        description: '世界上最大的艺术博物馆和历史古迹'
      },
      ja: {
        name: 'ルーヴル美術館',
        narration: 'ここは世界最大の美術館、ルーヴル美術館です。モナ・リザを含む数千の作品を所蔵しています。',
        description: '世界最大の美術館であり歴史的建造物'
      }
    }
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
    category: 'Cathedral',
    detailedDescription: 'Notre-Dame de Paris, commonly known as Notre-Dame Cathedral, stands as one of the finest examples of French Gothic architecture and a powerful symbol of Paris, France, and Christian faith. Located on the Île de la Cité, a natural island in the Seine River that has been the heart of Paris since Roman times, this magnificent cathedral has witnessed over 850 years of French history, from medieval coronations to revolutionary turmoil to the tragic fire of 2019. The construction of Notre-Dame began in 1163 under the reign of King Louis VII, with Bishop Maurice de Sully commissioning the cathedral to replace two earlier churches on the site. The ambitious project took nearly two centuries to complete, with the main structure finished by 1260 and additional modifications continuing into the 14th century. This extended construction period resulted in a fascinating blend of architectural styles, though Gothic elements dominate throughout. The cathedral\'s western façade is a masterpiece of Gothic design, featuring two massive towers that rise 69 meters (226 feet) into the Parisian sky. Between these towers sits the famous rose window, a stunning circular stained glass masterpiece measuring 9.6 meters (31 feet) in diameter, depicting scenes from the life of the Virgin Mary. The façade is adorned with three ornate portals, each decorated with intricate stone carvings depicting biblical scenes and figures. The central Portal of the Last Judgment shows Christ presiding over the resurrection of the dead, while the Portal of the Virgin and Portal of St. Anne flank it on either side. Above the portals runs the Gallery of Kings, featuring 28 statues representing the Kings of Judea, though many mistakenly believed them to represent French kings during the Revolution and beheaded them. Inside, Notre-Dame\'s nave stretches 130 meters (427 feet) in length, creating a soaring space that draws the eye heavenward - a fundamental principle of Gothic architecture designed to inspire spiritual contemplation. The interior is supported by flying buttresses, an innovative Gothic engineering solution that transfers the weight of the stone vaulted ceiling to external supports, allowing for higher ceilings and larger windows than previous Romanesque churches could achieve. The cathedral houses three magnificent rose windows, each a triumph of medieval craftsmanship. The western rose window, already mentioned, is joined by equally spectacular north and south rose windows, each measuring approximately 13 meters (43 feet) in diameter. These windows, created in the 13th century, depict biblical scenes and saints in vibrant blues, reds, and purples, casting ethereal colored light across the cathedral\'s interior. Notre-Dame has been the setting for numerous pivotal moments in French history. Napoleon Bonaparte crowned himself Emperor here in 1804, taking the crown from Pope Pius VII and placing it on his own head in a dramatic assertion of imperial authority. The cathedral hosted the coronation of Henry VI of England as King of France in 1431 during the Hundred Years\' War. It witnessed the marriage of Mary, Queen of Scots to the French Dauphin in 1558, and served as the site of a Te Deum service following the liberation of Paris in 1944. During the French Revolution, Notre-Dame suffered tremendous damage. Revolutionary forces ransacked the cathedral, destroyed religious imagery, and rededicated it to the Cult of Reason. Many treasures were lost, statues beheaded, and the cathedral fell into disrepair. It wasn\'t until the 19th century that Notre-Dame\'s fortunes reversed, largely due to Victor Hugo\'s 1831 novel "The Hunchback of Notre-Dame" (Notre-Dame de Paris), which sparked renewed interest in Gothic architecture and the cathedral\'s preservation. This led to a major restoration project led by architect Eugène Viollet-le-Duc between 1844 and 1864, which saved the cathedral from potential demolition and added new elements, including the famous spire and gargoyles that have become iconic symbols of the building. The cathedral\'s bells, immortalized in Hugo\'s novel, are legendary. The largest bell, Emmanuel, weighing over 13 tons, has rung for significant national events and continues to mark important occasions. The cathedral\'s pipe organ, one of the world\'s most famous, contains approximately 8,000 pipes and has been played by renowned organists for centuries. On April 15, 2019, the world watched in horror as fire engulfed Notre-Dame, destroying the 19th-century spire and much of the wooden roof structure, known as "the forest" due to its complex timber framework dating to the 13th century. However, the stone vaults largely held, protecting the interior, and heroic efforts by firefighters saved the structure from total destruction. The north and south rose windows survived, as did many precious artifacts and relics, including the Crown of Thorns believed to have been worn by Jesus. The catastrophe sparked an international outpouring of support, with over one billion euros pledged for reconstruction. French President Emmanuel Macron committed to rebuilding the cathedral within five years, and extensive restoration work is currently underway. Archaeologists and historians are using this opportunity to study the building in unprecedented detail, making discoveries about medieval construction techniques and the cathedral\'s long history. Notre-Dame de Paris remains more than a building - it is a testament to human artistic achievement, religious devotion, and cultural resilience. As reconstruction continues, the cathedral stands as a symbol of hope and renewal, destined to rise again from the ashes to continue its role as a spiritual home, architectural masterpiece, and enduring symbol of Paris and France for generations to come.',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800'
    ],
    historicalInfo: 'Notre-Dame de Paris is a medieval Catholic cathedral dedicated to the Virgin Mary. It is considered one of the finest examples of French Gothic architecture and was badly damaged by fire in 2019.',
    yearBuilt: '1163-1345',
    architect: 'Multiple architects, major restoration by Eugène Viollet-le-Duc',
    translations: {
      en: {
        name: 'Notre-Dame Cathedral',
        narration: 'This is Notre-Dame Cathedral, a masterpiece of French Gothic architecture dating back to the 12th century.',
        description: 'A medieval Catholic cathedral and UNESCO World Heritage Site',
        detailedDescription: 'Notre-Dame de Paris, commonly known as Notre-Dame Cathedral, stands as one of the finest examples of French Gothic architecture and a powerful symbol of Paris, France, and Christian faith. Located on the Île de la Cité, a natural island in the Seine River that has been the heart of Paris since Roman times, this magnificent cathedral has witnessed over 850 years of French history, from medieval coronations to revolutionary turmoil to the tragic fire of 2019. The construction of Notre-Dame began in 1163 under the reign of King Louis VII, with Bishop Maurice de Sully commissioning the cathedral to replace two earlier churches on the site. The ambitious project took nearly two centuries to complete, with the main structure finished by 1260 and additional modifications continuing into the 14th century. This extended construction period resulted in a fascinating blend of architectural styles, though Gothic elements dominate throughout. The cathedral\'s western façade is a masterpiece of Gothic design, featuring two massive towers that rise 69 meters (226 feet) into the Parisian sky. Between these towers sits the famous rose window, a stunning circular stained glass masterpiece measuring 9.6 meters (31 feet) in diameter, depicting scenes from the life of the Virgin Mary. The façade is adorned with three ornate portals, each decorated with intricate stone carvings depicting biblical scenes and figures. The central Portal of the Last Judgment shows Christ presiding over the resurrection of the dead, while the Portal of the Virgin and Portal of St. Anne flank it on either side. Above the portals runs the Gallery of Kings, featuring 28 statues representing the Kings of Judea, though many mistakenly believed them to represent French kings during the Revolution and beheaded them. Inside, Notre-Dame\'s nave stretches 130 meters (427 feet) in length, creating a soaring space that draws the eye heavenward - a fundamental principle of Gothic architecture designed to inspire spiritual contemplation. The interior is supported by flying buttresses, an innovative Gothic engineering solution that transfers the weight of the stone vaulted ceiling to external supports, allowing for higher ceilings and larger windows than previous Romanesque churches could achieve. The cathedral houses three magnificent rose windows, each a triumph of medieval craftsmanship. The western rose window, already mentioned, is joined by equally spectacular north and south rose windows, each measuring approximately 13 meters (43 feet) in diameter. These windows, created in the 13th century, depict biblical scenes and saints in vibrant blues, reds, and purples, casting ethereal colored light across the cathedral\'s interior. Notre-Dame has been the setting for numerous pivotal moments in French history. Napoleon Bonaparte crowned himself Emperor here in 1804, taking the crown from Pope Pius VII and placing it on his own head in a dramatic assertion of imperial authority. The cathedral hosted the coronation of Henry VI of England as King of France in 1431 during the Hundred Years\' War. It witnessed the marriage of Mary, Queen of Scots to the French Dauphin in 1558, and served as the site of a Te Deum service following the liberation of Paris in 1944. During the French Revolution, Notre-Dame suffered tremendous damage. Revolutionary forces ransacked the cathedral, destroyed religious imagery, and rededicated it to the Cult of Reason. Many treasures were lost, statues beheaded, and the cathedral fell into disrepair. It wasn\'t until the 19th century that Notre-Dame\'s fortunes reversed, largely due to Victor Hugo\'s 1831 novel "The Hunchback of Notre-Dame" (Notre-Dame de Paris), which sparked renewed interest in Gothic architecture and the cathedral\'s preservation. This led to a major restoration project led by architect Eugène Viollet-le-Duc between 1844 and 1864, which saved the cathedral from potential demolition and added new elements, including the famous spire and gargoyles that have become iconic symbols of the building. The cathedral\'s bells, immortalized in Hugo\'s novel, are legendary. The largest bell, Emmanuel, weighing over 13 tons, has rung for significant national events and continues to mark important occasions. The cathedral\'s pipe organ, one of the world\'s most famous, contains approximately 8,000 pipes and has been played by renowned organists for centuries. On April 15, 2019, the world watched in horror as fire engulfed Notre-Dame, destroying the 19th-century spire and much of the wooden roof structure, known as "the forest" due to its complex timber framework dating to the 13th century. However, the stone vaults largely held, protecting the interior, and heroic efforts by firefighters saved the structure from total destruction. The north and south rose windows survived, as did many precious artifacts and relics, including the Crown of Thorns believed to have been worn by Jesus. The catastrophe sparked an international outpouring of support, with over one billion euros pledged for reconstruction. French President Emmanuel Macron committed to rebuilding the cathedral within five years, and extensive restoration work is currently underway. Archaeologists and historians are using this opportunity to study the building in unprecedented detail, making discoveries about medieval construction techniques and the cathedral\'s long history. Notre-Dame de Paris remains more than a building - it is a testament to human artistic achievement, religious devotion, and cultural resilience. As reconstruction continues, the cathedral stands as a symbol of hope and renewal, destined to rise again from the ashes to continue its role as a spiritual home, architectural masterpiece, and enduring symbol of Paris and France for generations to come.'
      },
      it: {
        name: 'Cattedrale di Notre-Dame',
        narration: 'Questa è la Cattedrale di Notre-Dame, un capolavoro dell\'architettura gotica francese risalente al XII secolo.',
        description: 'Una cattedrale cattolica medievale e patrimonio mondiale dell\'UNESCO'
      },
      ko: {
        name: '노트르담 대성당',
        narration: '이곳은 12세기로 거슬러 올라가는 프랑스 고딕 건축의 걸작, 노트르담 대성당입니다.',
        description: '중세 가톨릭 대성당이자 유네스코 세계문화유산'
      },
      es: {
        name: 'Catedral de Notre-Dame',
        narration: 'Esta es la Catedral de Notre-Dame, una obra maestra de la arquitectura gótica francesa que data del siglo XII.',
        description: 'Una catedral católica medieval y Patrimonio de la Humanidad de la UNESCO'
      },
      fr: {
        name: 'Cathédrale Notre-Dame',
        narration: 'Voici la Cathédrale Notre-Dame, un chef-d\'œuvre de l\'architecture gothique française datant du XIIe siècle.',
        description: 'Une cathédrale catholique médiévale et site du patrimoine mondial de l\'UNESCO'
      },
      de: {
        name: 'Kathedrale Notre-Dame',
        narration: 'Dies ist die Kathedrale Notre-Dame, ein Meisterwerk französischer Gotik aus dem 12. Jahrhundert.',
        description: 'Eine mittelalterliche katholische Kathedrale und UNESCO-Weltkulturerbe'
      },
      zh: {
        name: '巴黎圣母院',
        narration: '这是巴黎圣母院，可追溯至12世纪的法国哥特式建筑杰作。',
        description: '中世纪天主教大教堂和联合国教科文组织世界遗产'
      },
      ja: {
        name: 'ノートルダム大聖堂',
        narration: 'これは12世紀にさかのぼるフランス・ゴシック建築の傑作、ノートルダム大聖堂です。',
        description: '中世のカトリック大聖堂でユネスコ世界遺産'
      }
    }
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
    category: 'Monument',
    detailedDescription: 'The Arc de Triomphe de l\'Étoile, commonly known as the Arc de Triomphe, stands as one of the most iconic monuments in Paris and a powerful symbol of French national pride, military glory, and historical memory. Located at the center of the Place Charles de Gaulle (formerly Place de l\'Étoile), at the western end of the Champs-Élysées, this monumental triumphal arch honors those who fought and died for France, particularly during the Revolutionary and Napoleonic Wars. Rising 50 meters (164 feet) in height, 45 meters (148 feet) in width, and 22 meters (72 feet) in depth, the Arc de Triomphe is the second-largest triumphal arch in existence, surpassed only by Arch of Triumph in Pyongyang, North Korea. The monument was commissioned by Napoleon Bonaparte in 1806, following his victory at the Battle of Austerlitz, to commemorate the achievements of the French armies. Napoleon declared, "You will return home through arches of triumph," to his soldiers, and he envisioned a monument that would celebrate French military might for centuries to come. The architect Jean Chalgrin was chosen to design the arch, drawing inspiration from the ancient Roman Arch of Titus while creating something distinctly grander and more ambitious. Construction began in 1806, but progressed slowly due to Napoleon\'s political fortunes. When he married Marie-Louise of Austria in 1810, the arch was far from complete, so a full-scale wooden mock-up was hastily erected for the imperial procession. After Napoleon\'s abdication in 1814, construction halted entirely. Work resumed in 1826 under King Louis-Philippe and was finally completed in 1836, fifteen years after Napoleon\'s death. Tragically, Napoleon never saw his grand monument completed, though his funeral procession did pass under the arch in 1840 when his remains were returned to France from Saint Helena. The Arc de Triomphe is adorned with magnificent sculptural reliefs that tell the story of French military glory. The most famous is François Rude\'s "La Marseillaise" (officially titled "Departure of the Volunteers of 1792"), depicting French citizens rallying to defend the young Republic. This dynamic sculpture, with its central figure of Liberty urging the people forward, has become one of the most celebrated works of French Romantic sculpture. Other major reliefs include "The Triumph of 1810" by Jean-Pierre Cortot, showing Napoleon\'s victories; "Resistance" by Antoine Étex, depicting French resistance during the 1814 campaign; and "Peace" by Étex, celebrating the Treaty of Paris. The arch\'s inner walls are engraved with the names of 660 generals and marshals who served during the French Revolution and Napoleonic Empire. Those who died in battle are underlined, creating a poignant memorial to military leadership and sacrifice. The attic level features shields bearing the names of major Revolutionary and Napoleonic victories, while the four pillars support large sculptural groups representing pivotal moments in French military history. Perhaps the most solemn and significant feature of the Arc de Triomphe is the Tomb of the Unknown Soldier, installed beneath the arch on November 11, 1920, to honor the unidentified French soldiers who died in World War I. The eternal flame, rekindled every evening at 6:30 PM in a ceremony that has continued daily since 1923, serves as France\'s national war memorial. This tradition ensures that the memory of those who gave their lives for France is never extinguished. The flame has burned continuously even during the German occupation of Paris in World War II, a powerful symbol of French resilience and resistance. The Arc de Triomphe has witnessed countless historic moments. Victorious armies have marched beneath it, from the Allies in 1919 following World War I to the liberation of Paris in 1944 when General de Gaulle led Free French forces in a triumphant procession down the Champs-Élysées and through the arch. The monument has also served as a focal point for national mourning, including the funeral processions of presidents, war heroes, and cultural icons. The arch stands at the center of the Place Charles de Gaulle, from which twelve grand avenues radiate in a star pattern, earning the square its former name "Place de l\'Étoile" (Star Square). This urban planning creates one of the world\'s most famous traffic circles and provides spectacular views of the arch from multiple vantage points throughout Paris. Visitors can climb the 284 steps to the top of the arch (an elevator is available for those with reduced mobility), where a viewing platform offers breathtaking panoramic views of Paris. From this vantage point, one can see the Champs-Élysées stretching toward the Louvre and Place de la Concorde in one direction, and the Grande Arche de la Défense continuing the axis in the other, creating what Parisians call the "Voie Triomphale" or Triumphal Way. Inside the arch, a museum traces its history, construction, and symbolic importance in French culture. Exhibitions explore the arch\'s role in French national identity, its architectural significance, and the countless ceremonies and events it has witnessed over two centuries. The Arc de Triomphe appears frequently in popular culture, from literature and film to art and photography, cementing its status as an instantly recognizable symbol of Paris. It has served as the finish line for the Tour de France bicycle race since 1975, adding a sporting dimension to its cultural significance. The monument has also been the site of major celebrations, including Bastille Day military parades and New Year\'s Eve festivities. Recent years have seen the arch at the center of both celebration and protest. In 2018, it suffered vandalism during Yellow Vest protests, highlighting its continued relevance as a symbol of French state power and national identity. In 2021, artist Christo\'s posthumous installation wrapped the entire arch in silvery blue recyclable fabric, transforming this stone monument of permanence into a temporary work of ephemeral art, demonstrating how even the most established symbols can be reimagined for new generations. Today, the Arc de Triomphe stands not merely as a monument to past glories but as a living symbol of French identity, resilience, and collective memory. It reminds visitors and Parisians alike of the sacrifices made for liberty, the importance of national unity, and the enduring power of monumental architecture to inspire, commemorate, and bring people together across generations.',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800'
    ],
    historicalInfo: 'The Arc de Triomphe was commissioned by Napoleon in 1806 to honor the French army. It stands at the center of the Place Charles de Gaulle and contains the Tomb of the Unknown Soldier.',
    yearBuilt: '1806-1836',
    architect: 'Jean Chalgrin',
    translations: {
      en: {
        name: 'Arc de Triomphe',
        narration: 'The Arc de Triomphe honors those who fought for France. It stands at the center of Place Charles de Gaulle.',
        description: 'One of the most famous monuments in Paris',
        detailedDescription: 'The Arc de Triomphe de l\'Étoile, commonly known as the Arc de Triomphe, stands as one of the most iconic monuments in Paris and a powerful symbol of French national pride, military glory, and historical memory. Located at the center of the Place Charles de Gaulle (formerly Place de l\'Étoile), at the western end of the Champs-Élysées, this monumental triumphal arch honors those who fought and died for France, particularly during the Revolutionary and Napoleonic Wars. Rising 50 meters (164 feet) in height, 45 meters (148 feet) in width, and 22 meters (72 feet) in depth, the Arc de Triomphe is the second-largest triumphal arch in existence, surpassed only by Arch of Triumph in Pyongyang, North Korea. The monument was commissioned by Napoleon Bonaparte in 1806, following his victory at the Battle of Austerlitz, to commemorate the achievements of the French armies. Napoleon declared, "You will return home through arches of triumph," to his soldiers, and he envisioned a monument that would celebrate French military might for centuries to come. The architect Jean Chalgrin was chosen to design the arch, drawing inspiration from the ancient Roman Arch of Titus while creating something distinctly grander and more ambitious. Construction began in 1806, but progressed slowly due to Napoleon\'s political fortunes. When he married Marie-Louise of Austria in 1810, the arch was far from complete, so a full-scale wooden mock-up was hastily erected for the imperial procession. After Napoleon\'s abdication in 1814, construction halted entirely. Work resumed in 1826 under King Louis-Philippe and was finally completed in 1836, fifteen years after Napoleon\'s death. Tragically, Napoleon never saw his grand monument completed, though his funeral procession did pass under the arch in 1840 when his remains were returned to France from Saint Helena. The Arc de Triomphe is adorned with magnificent sculptural reliefs that tell the story of French military glory. The most famous is François Rude\'s "La Marseillaise" (officially titled "Departure of the Volunteers of 1792"), depicting French citizens rallying to defend the young Republic. This dynamic sculpture, with its central figure of Liberty urging the people forward, has become one of the most celebrated works of French Romantic sculpture. Other major reliefs include "The Triumph of 1810" by Jean-Pierre Cortot, showing Napoleon\'s victories; "Resistance" by Antoine Étex, depicting French resistance during the 1814 campaign; and "Peace" by Étex, celebrating the Treaty of Paris. The arch\'s inner walls are engraved with the names of 660 generals and marshals who served during the French Revolution and Napoleonic Empire. Those who died in battle are underlined, creating a poignant memorial to military leadership and sacrifice. The attic level features shields bearing the names of major Revolutionary and Napoleonic victories, while the four pillars support large sculptural groups representing pivotal moments in French military history. Perhaps the most solemn and significant feature of the Arc de Triomphe is the Tomb of the Unknown Soldier, installed beneath the arch on November 11, 1920, to honor the unidentified French soldiers who died in World War I. The eternal flame, rekindled every evening at 6:30 PM in a ceremony that has continued daily since 1923, serves as France\'s national war memorial. This tradition ensures that the memory of those who gave their lives for France is never extinguished. The flame has burned continuously even during the German occupation of Paris in World War II, a powerful symbol of French resilience and resistance. The Arc de Triomphe has witnessed countless historic moments. Victorious armies have marched beneath it, from the Allies in 1919 following World War I to the liberation of Paris in 1944 when General de Gaulle led Free French forces in a triumphant procession down the Champs-Élysées and through the arch. The monument has also served as a focal point for national mourning, including the funeral processions of presidents, war heroes, and cultural icons. The arch stands at the center of the Place Charles de Gaulle, from which twelve grand avenues radiate in a star pattern, earning the square its former name "Place de l\'Étoile" (Star Square). This urban planning creates one of the world\'s most famous traffic circles and provides spectacular views of the arch from multiple vantage points throughout Paris. Visitors can climb the 284 steps to the top of the arch (an elevator is available for those with reduced mobility), where a viewing platform offers breathtaking panoramic views of Paris. From this vantage point, one can see the Champs-Élysées stretching toward the Louvre and Place de la Concorde in one direction, and the Grande Arche de la Défense continuing the axis in the other, creating what Parisians call the "Voie Triomphale" or Triumphal Way. Inside the arch, a museum traces its history, construction, and symbolic importance in French culture. Exhibitions explore the arch\'s role in French national identity, its architectural significance, and the countless ceremonies and events it has witnessed over two centuries. The Arc de Triomphe appears frequently in popular culture, from literature and film to art and photography, cementing its status as an instantly recognizable symbol of Paris. It has served as the finish line for the Tour de France bicycle race since 1975, adding a sporting dimension to its cultural significance. The monument has also been the site of major celebrations, including Bastille Day military parades and New Year\'s Eve festivities. Recent years have seen the arch at the center of both celebration and protest. In 2018, it suffered vandalism during Yellow Vest protests, highlighting its continued relevance as a symbol of French state power and national identity. In 2021, artist Christo\'s posthumous installation wrapped the entire arch in silvery blue recyclable fabric, transforming this stone monument of permanence into a temporary work of ephemeral art, demonstrating how even the most established symbols can be reimagined for new generations. Today, the Arc de Triomphe stands not merely as a monument to past glories but as a living symbol of French identity, resilience, and collective memory. It reminds visitors and Parisians alike of the sacrifices made for liberty, the importance of national unity, and the enduring power of monumental architecture to inspire, commemorate, and bring people together across generations.'
      },
      it: {
        name: 'Arco di Trionfo',
        narration: 'L\'Arco di Trionfo onora coloro che hanno combattuto per la Francia. Si trova al centro di Place Charles de Gaulle.',
        description: 'Uno dei monumenti più famosi di Parigi'
      },
      ko: {
        name: '개선문',
        narration: '개선문은 프랑스를 위해 싸운 사람들을 기리는 곳입니다. 샤를 드골 광장 중앙에 위치해 있습니다.',
        description: '파리에서 가장 유명한 기념물 중 하나'
      },
      es: {
        name: 'Arco del Triunfo',
        narration: 'El Arco del Triunfo honra a quienes lucharon por Francia. Se encuentra en el centro de la Place Charles de Gaulle.',
        description: 'Uno de los monumentos más famosos de París'
      },
      fr: {
        name: 'Arc de Triomphe',
        narration: 'L\'Arc de Triomphe rend hommage à ceux qui ont combattu pour la France. Il se dresse au centre de la Place Charles de Gaulle.',
        description: 'L\'un des monuments les plus célèbres de Paris'
      },
      de: {
        name: 'Arc de Triomphe',
        narration: 'Der Arc de Triomphe ehrt diejenigen, die für Frankreich gekämpft haben. Er steht im Zentrum des Place Charles de Gaulle.',
        description: 'Eines der berühmtesten Denkmäler in Paris'
      },
      zh: {
        name: '凯旋门',
        narration: '凯旋门是为纪念为法国而战的人们而建。它位于戴高乐广场的中心。',
        description: '巴黎最著名的纪念碑之一'
      },
      ja: {
        name: '凱旋門',
        narration: '凱旋門はフランスのために戦った人々を称えます。シャルル・ド・ゴール広場の中心に立っています。',
        description: 'パリで最も有名な記念碑の一つ'
      }
    }
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
    category: 'Monument',
    detailedDescription: 'Big Ben, one of the world\'s most recognizable landmarks, stands as an enduring symbol of London, British parliamentary democracy, and the precision of Victorian engineering. While "Big Ben" technically refers only to the Great Bell within the tower, the name has become synonymous with the entire Elizabeth Tower at the Palace of Westminster. Rising 96 meters (316 feet) above the Thames, this iconic clock tower has marked time over London since 1859, its distinctive chimes broadcast worldwide as the audio signature of British culture and news programming. The tower was designed by Augustus Pugin in the Gothic Revival style as part of the new Palace of Westminster, built after the devastating fire of 1834 destroyed the previous medieval palace. Construction began in 1843, but the tower was not completed until 1859, with the clock becoming operational on May 31 of that year. The first chimes of Big Ben rang out on July 11, 1859, though the bell cracked shortly after and was silent for four years while repairs were made. The repaired bell, with its distinctive tone created by the crack, began chiming again in 1863 and has continued to this day. The Elizabeth Tower (renamed from Clock Tower in 2012 to celebrate Queen Elizabeth II\'s Diamond Jubilee) showcases spectacular Gothic Revival architecture with its ornate stonework, pointed arches, and decorative cast iron spire topped with the cross of St. George. The tower contains 11 floors, with 334 steps spiraling up to the belfry and a further 59 steps to reach the Ayrton Light at the very top - a lantern that illuminates whenever either House of Parliament is sitting after dark. The Clock Tower houses the Great Clock, designed by Edmund Beckett Denison and built by clockmaker Edward John Dent. When it was completed, it was the largest and most accurate four-faced striking and chiming clock in the world. Each of the four clock faces measures 7 meters (23 feet) in diameter, with minute hands 4.3 meters (14 feet) long and hour hands 2.7 meters (9 feet) long. The clock mechanism, despite its Victorian origins, remains remarkably accurate, kept within two seconds of Greenwich Mean Time. The clock\'s precision is so valued that when the tower tilts slightly (it currently leans about 0.26 degrees), engineers carefully monitor to ensure it doesn\'t affect timekeeping. The tower contains five bells: the four quarter bells that chime every fifteen minutes, and the Great Bell - Big Ben itself - which strikes the hours. Big Ben weighs 13.7 tons and sounds the note E. The origin of the bell\'s name remains disputed; it may honor Sir Benjamin Hall, the Chief Commissioner of Works when the bell was installed, or Benjamin Caunt, a heavyweight boxing champion of the era. The quarter bells play the Westminster Quarters, a melody so famous it has been adopted by clock towers and grandfather clocks worldwide. The melody is based on variations of phrases from Handel\'s Messiah and is often followed by the striking of Big Ben on the hour. Big Ben has witnessed and marked some of Britain\'s most significant historical moments. During World War I, the chimes were silenced to prevent German zeppelins from using them for navigation, and the clock face lights were dimmed. In World War II, the tower suffered bomb damage but continued to keep time. On VE Day in 1945, the silenced bells rang out again to celebrate victory in Europe, their chimes representing the return of peace and normalcy. The clock stopped briefly on D-Day, creating rumors of sabotage, though it was likely a mechanical issue. Throughout the years, the clock has occasionally stopped or been silenced for various reasons. It ceased during Winston Churchill\'s funeral in 1965 and Margaret Thatcher\'s in 2013 as marks of respect. Mechanical failures have occurred, including a memorable incident in 1976 when the clock stopped for nine months due to metal fatigue. In 2007, a flock of starlings landing on a minute hand slowed the clock by several minutes. Big Ben has become a cultural icon appearing in countless films, from Peter Pan to V for Vendetta, where it serves as the ultimate symbol of London. The tower\'s image graces postcards, souvenirs, and media worldwide. Its chimes introduce BBC news broadcasts, making them perhaps the most recognized sound in broadcasting history. The "bongs" of Big Ben mark significant national moments, from New Year celebrations broadcast globally to moments of silence for national tragedies. From 2017 to 2021, Big Ben underwent its most extensive conservation project in its history, costing £80 million. The restoration involved dismantling the clock mechanism, repairing the tower\'s stonework, regilding the clock faces, and upgrading facilities. During this period, the bell was largely silenced except for special occasions, causing consternation among Londoners who missed its familiar hourly presence in the city\'s soundscape. The restoration revealed fascinating historical details, including graffiti left by Victorian workers and damage from World War II bombing raids. The Elizabeth Tower is not regularly open to the public, with tours available only to UK residents who arrange visits through their Members of Parliament, making it one of London\'s most exclusive tourist experiences. Those fortunate enough to climb the tower experience a journey through British history, passing through the prison room (where unruly MPs were once held), the clock room with its magnificent Victorian mechanism, and the belfry where Big Ben and the quarter bells hang. The view from the top offers spectacular panoramas of London, though the constant presence of the clock machinery serves as a reminder that this is a working building, not merely a tourist attraction. Big Ben represents more than Victorian engineering triumph - it symbolizes continuity, democracy, and British resilience. Through wars, celebrations, tragedies, and triumphs, its chimes have provided a constant, reassuring presence. As London continues to evolve around it, Big Ben remains an unchanging reference point, its hourly chimes marking not just time but the passage of history itself. The tower stands as a testament to the skill of Victorian craftsmen, the enduring power of Gothic architecture, and the human need for landmarks that connect us to our past while guiding us into the future.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1503456170271-2f1b94e2c849?w=800'
    ],
    historicalInfo: 'Big Ben is the nickname for the Great Bell of the clock at the Palace of Westminster. The tower was completed in 1859 and has become one of the most prominent symbols of the United Kingdom.',
    yearBuilt: '1843-1859',
    architect: 'Augustus Pugin',
    translations: {
      en: {
        name: 'Big Ben',
        narration: 'Welcome to Big Ben, the iconic clock tower of London. Officially known as Elizabeth Tower, its chimes are known worldwide.',
        description: 'The Great Clock of Westminster',
        detailedDescription: 'Big Ben, one of the world\'s most recognizable landmarks, stands as an enduring symbol of London, British parliamentary democracy, and the precision of Victorian engineering. While "Big Ben" technically refers only to the Great Bell within the tower, the name has become synonymous with the entire Elizabeth Tower at the Palace of Westminster. Rising 96 meters (316 feet) above the Thames, this iconic clock tower has marked time over London since 1859, its distinctive chimes broadcast worldwide as the audio signature of British culture and news programming. The tower was designed by Augustus Pugin in the Gothic Revival style as part of the new Palace of Westminster, built after the devastating fire of 1834 destroyed the previous medieval palace. Construction began in 1843, but the tower was not completed until 1859, with the clock becoming operational on May 31 of that year. The first chimes of Big Ben rang out on July 11, 1859, though the bell cracked shortly after and was silent for four years while repairs were made. The repaired bell, with its distinctive tone created by the crack, began chiming again in 1863 and has continued to this day. The Elizabeth Tower (renamed from Clock Tower in 2012 to celebrate Queen Elizabeth II\'s Diamond Jubilee) showcases spectacular Gothic Revival architecture with its ornate stonework, pointed arches, and decorative cast iron spire topped with the cross of St. George. The tower contains 11 floors, with 334 steps spiraling up to the belfry and a further 59 steps to reach the Ayrton Light at the very top - a lantern that illuminates whenever either House of Parliament is sitting after dark. The Clock Tower houses the Great Clock, designed by Edmund Beckett Denison and built by clockmaker Edward John Dent. When it was completed, it was the largest and most accurate four-faced striking and chiming clock in the world. Each of the four clock faces measures 7 meters (23 feet) in diameter, with minute hands 4.3 meters (14 feet) long and hour hands 2.7 meters (9 feet) long. The clock mechanism, despite its Victorian origins, remains remarkably accurate, kept within two seconds of Greenwich Mean Time. The clock\'s precision is so valued that when the tower tilts slightly (it currently leans about 0.26 degrees), engineers carefully monitor to ensure it doesn\'t affect timekeeping. The tower contains five bells: the four quarter bells that chime every fifteen minutes, and the Great Bell - Big Ben itself - which strikes the hours. Big Ben weighs 13.7 tons and sounds the note E. The origin of the bell\'s name remains disputed; it may honor Sir Benjamin Hall, the Chief Commissioner of Works when the bell was installed, or Benjamin Caunt, a heavyweight boxing champion of the era. The quarter bells play the Westminster Quarters, a melody so famous it has been adopted by clock towers and grandfather clocks worldwide. The melody is based on variations of phrases from Handel\'s Messiah and is often followed by the striking of Big Ben on the hour. Big Ben has witnessed and marked some of Britain\'s most significant historical moments. During World War I, the chimes were silenced to prevent German zeppelins from using them for navigation, and the clock face lights were dimmed. In World War II, the tower suffered bomb damage but continued to keep time. On VE Day in 1945, the silenced bells rang out again to celebrate victory in Europe, their chimes representing the return of peace and normalcy. The clock stopped briefly on D-Day, creating rumors of sabotage, though it was likely a mechanical issue. Throughout the years, the clock has occasionally stopped or been silenced for various reasons. It ceased during Winston Churchill\'s funeral in 1965 and Margaret Thatcher\'s in 2013 as marks of respect. Mechanical failures have occurred, including a memorable incident in 1976 when the clock stopped for nine months due to metal fatigue. In 2007, a flock of starlings landing on a minute hand slowed the clock by several minutes. Big Ben has become a cultural icon appearing in countless films, from Peter Pan to V for Vendetta, where it serves as the ultimate symbol of London. The tower\'s image graces postcards, souvenirs, and media worldwide. Its chimes introduce BBC news broadcasts, making them perhaps the most recognized sound in broadcasting history. The "bongs" of Big Ben mark significant national moments, from New Year celebrations broadcast globally to moments of silence for national tragedies. From 2017 to 2021, Big Ben underwent its most extensive conservation project in its history, costing £80 million. The restoration involved dismantling the clock mechanism, repairing the tower\'s stonework, regilding the clock faces, and upgrading facilities. During this period, the bell was largely silenced except for special occasions, causing consternation among Londoners who missed its familiar hourly presence in the city\'s soundscape. The restoration revealed fascinating historical details, including graffiti left by Victorian workers and damage from World War II bombing raids. The Elizabeth Tower is not regularly open to the public, with tours available only to UK residents who arrange visits through their Members of Parliament, making it one of London\'s most exclusive tourist experiences. Those fortunate enough to climb the tower experience a journey through British history, passing through the prison room (where unruly MPs were once held), the clock room with its magnificent Victorian mechanism, and the belfry where Big Ben and the quarter bells hang. The view from the top offers spectacular panoramas of London, though the constant presence of the clock machinery serves as a reminder that this is a working building, not merely a tourist attraction. Big Ben represents more than Victorian engineering triumph - it symbolizes continuity, democracy, and British resilience. Through wars, celebrations, tragedies, and triumphs, its chimes have provided a constant, reassuring presence. As London continues to evolve around it, Big Ben remains an unchanging reference point, its hourly chimes marking not just time but the passage of history itself. The tower stands as a testament to the skill of Victorian craftsmen, the enduring power of Gothic architecture, and the human need for landmarks that connect us to our past while guiding us into the future.'
      },
      it: {
        name: 'Big Ben',
        narration: 'Benvenuto al Big Ben, l\'iconica torre dell\'orologio di Londra. Ufficialmente conosciuta come Elizabeth Tower, i suoi rintocchi sono noti in tutto il mondo.',
        description: 'Il Grande Orologio di Westminster'
      },
      ko: {
        name: '빅벤',
        narration: '런던의 상징적인 시계탑 빅벤에 오신 것을 환영합니다. 공식적으로 엘리자베스 타워로 알려져 있으며, 그 종소리는 전 세계적으로 유명합니다.',
        description: '웨스트민스터의 대시계'
      },
      es: {
        name: 'Big Ben',
        narration: 'Bienvenido al Big Ben, la icónica torre del reloj de Londres. Conocida oficialmente como Elizabeth Tower, sus campanadas son conocidas en todo el mundo.',
        description: 'El Gran Reloj de Westminster'
      },
      fr: {
        name: 'Big Ben',
        narration: 'Bienvenue à Big Ben, la tour de l\'horloge emblématique de Londres. Officiellement connue sous le nom d\'Elizabeth Tower, ses carillons sont connus dans le monde entier.',
        description: 'La Grande Horloge de Westminster'
      },
      de: {
        name: 'Big Ben',
        narration: 'Willkommen am Big Ben, dem ikonischen Glockenturm Londons. Offiziell als Elizabeth Tower bekannt, sind seine Glockenschläge weltweit bekannt.',
        description: 'Die Große Uhr von Westminster'
      },
      zh: {
        name: '大本钟',
        narration: '欢迎来到大本钟，伦敦标志性的钟楼。正式名称为伊丽莎白塔，其钟声享誉全球。',
        description: '威斯敏斯特大钟'
      },
      ja: {
        name: 'ビッグ・ベン',
        narration: 'ロンドンの象徴的な時計塔、ビッグ・ベンへようこそ。正式にはエリザベス・タワーとして知られ、その鐘の音は世界中で知られています。',
        description: 'ウェストミンスターの大時計'
      }
    }
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
    category: 'Bridge',
    detailedDescription: 'Tower Bridge, one of London\'s most recognizable landmarks, stands as a magnificent example of Victorian engineering ingenuity and Gothic Revival architecture. Spanning the River Thames near the Tower of London, this iconic combined bascule and suspension bridge has become synonymous with London itself, its distinctive twin towers and blue-painted suspension chains appearing in countless photographs, films, and artworks since its completion in 1894. The bridge\'s construction was necessitated by the massive commercial growth of the East End of London during the 19th century, which required a new river crossing east of London Bridge that wouldn\'t disrupt river traffic to the busy Pool of London docks. The challenge was unprecedented: how to build a bridge low enough for pedestrians and vehicles to cross easily, yet able to allow tall-masted ships to pass underneath. In 1876, the City of London Corporation formed a Special Bridge or Subway Committee to find a solution, receiving over 50 design proposals ranging from the practical to the fantastical. The winning design, submitted by Horace Jones, the City Architect, in collaboration with engineer John Wolfe Barry, ingeniously solved the problem with a bascule (seesaw) bridge whose roadway could be raised to allow ships to pass. Jones and Barry\'s Gothic Revival design featured two massive towers rising 65 meters (213 feet) above the Thames, connected at the upper level by two horizontal walkways designed to allow pedestrians to cross even when the bridge was raised. The towers were clad in Cornish granite and Portland stone to provide a pleasing appearance and to protect the steel framework beneath, creating a structure that appeared medieval while incorporating cutting-edge Victorian technology. Construction began in 1886 and employed 432 workers over eight years, tragically claiming the lives of 10 men during the dangerous work. The bridge required 70,000 tons of concrete to be sunk into the riverbed to support the massive structure. Over 11,000 tons of steel formed the framework, which was then clad in stone. The bascule mechanism was revolutionary for its time - two massive bascules (leaves), each weighing over 1,000 tons, could be raised to an angle of 83 degrees in just five minutes. Originally powered by steam, the hydraulic system used water pumped into accumulators by steam engines to move the bascules. The system was so well-designed that it required relatively little power to operate, with the massive counterweights doing much of the work. The high-level walkways, 42 meters (138 feet) above the Thames at high tide, quickly became popular with prostitutes and pickpockets rather than legitimate pedestrians, leading to their closure in 1910. They remained closed until 1982 when they reopened as part of the Tower Bridge Exhibition, now featuring glass floors offering thrilling views down to the river and road below. Tower Bridge was officially opened on June 30, 1894, by the Prince of Wales (the future King Edward VII) and his wife, Alexandra of Denmark. In its early years, the bridge was raised almost 50 times per day to allow ships to pass. Today, it still opens approximately 800 times per year, though the mechanism is now powered by electricity rather than steam. The bridge has been the scene of numerous daring incidents. In 1952, a double-decker bus found itself on the bridge as it began to open; driver Albert Gunter accelerated and jumped the growing gap, earning himself a £10 bonus for bravery. In 1968, Royal Air Force pilot Alan Pollock flew his Hawker Hunter jet through the bridge\'s towers as an unauthorized protest, threading his aircraft through the upper and lower spans. The bridge underwent major color changes over its history. Originally chocolate brown, it was repainted red, white, and blue for Queen Elizabeth II\'s Silver Jubilee in 1977. It was later repainted in the current blue and white color scheme that many consider iconic, though historians note it was never these colors originally. The Engine Rooms, located in the bridge\'s southern approach, house the original Victorian steam engines, accumulators, and boilers that once powered the bridge. These magnificent examples of Victorian engineering, built by Armstrong Mitchell & Company, have been preserved as a museum, allowing visitors to see the intricate machinery that made the bridge\'s operation possible. The engines, though no longer in use, remain in pristine condition, their brass fittings polished and copper pipes gleaming, offering a window into the industrial age. Tower Bridge has appeared in countless films, from "Spice World" to "Bridget Jones\'s Diary," and has been destroyed in numerous disaster movies, including "The Mummy Returns" and "Thor: The Dark World." It often appears incorrectly labeled as "London Bridge" in popular media, causing confusion between the two distinct structures. The bridge has become a symbol of London, appearing on souvenirs, postcards, and promotional materials worldwide. It plays a central role in London\'s major celebrations, including elaborate lighting displays for New Year\'s Eve, royal occasions, and the annual Lord Mayor\'s Show. The bridge is illuminated nightly, and special lighting schemes mark significant events - red and blue for royal celebrations, rainbow colors for Pride, and various national flags for visiting dignitaries. The Tower Bridge Exhibition, opened in 1982, allows visitors to explore the bridge\'s history and engineering while walking across the high-level walkways with their glass floors installed in 2014. The exhibition tells the story of the bridge\'s construction, its role in London\'s history, and the lives of the people who built and maintained it. Visitors can also watch the bridge lift from special viewing areas, experiencing the impressive sight of the massive bascules rising to allow tall ships through. In recent years, Tower Bridge has embraced modern technology while maintaining its Victorian character. LED lighting has replaced older systems, reducing energy consumption while allowing for more dramatic displays. The bridge has also become a focal point for sporting events, including the London Olympics and various marathons and charity events. Conservation work continues to preserve the structure for future generations, with ongoing maintenance of the stonework, steelwork, and mechanical systems. Tower Bridge represents more than Victorian engineering prowess - it symbolizes London\'s ability to blend the old with the new, tradition with innovation. It stands as a working bridge that still raises for river traffic while serving as one of the world\'s most visited tourist attractions. The bridge connects London\'s historic center with the modern developments of the South Bank and beyond, both physically and symbolically. As London continues to evolve, Tower Bridge remains a constant, its distinctive silhouette a reminder of the city\'s rich history and its ongoing journey into the future. The bridge proves that functional infrastructure can also be beautiful, that engineering can be art, and that the best monuments are those that continue to serve their communities while inspiring wonder and pride across generations.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800'
    ],
    historicalInfo: 'Tower Bridge was built between 1886 and 1894 and is one of London\'s most famous landmarks. The bascule bridge mechanism allows the roadway to be raised to let river traffic pass underneath.',
    yearBuilt: '1886-1894',
    architect: 'Horace Jones and John Wolfe Barry',
    translations: {
      en: {
        name: 'Tower Bridge',
        narration: 'You are at Tower Bridge, one of London\'s most famous landmarks. This combined bascule and suspension bridge crosses the River Thames.',
        description: 'An iconic symbol of London since 1894',
        detailedDescription: 'Tower Bridge, one of London\'s most recognizable landmarks, stands as a magnificent example of Victorian engineering ingenuity and Gothic Revival architecture. Spanning the River Thames near the Tower of London, this iconic combined bascule and suspension bridge has become synonymous with London itself, its distinctive twin towers and blue-painted suspension chains appearing in countless photographs, films, and artworks since its completion in 1894. The bridge\'s construction was necessitated by the massive commercial growth of the East End of London during the 19th century, which required a new river crossing east of London Bridge that wouldn\'t disrupt river traffic to the busy Pool of London docks. The challenge was unprecedented: how to build a bridge low enough for pedestrians and vehicles to cross easily, yet able to allow tall-masted ships to pass underneath. In 1876, the City of London Corporation formed a Special Bridge or Subway Committee to find a solution, receiving over 50 design proposals ranging from the practical to the fantastical. The winning design, submitted by Horace Jones, the City Architect, in collaboration with engineer John Wolfe Barry, ingeniously solved the problem with a bascule (seesaw) bridge whose roadway could be raised to allow ships to pass. Jones and Barry\'s Gothic Revival design featured two massive towers rising 65 meters (213 feet) above the Thames, connected at the upper level by two horizontal walkways designed to allow pedestrians to cross even when the bridge was raised. The towers were clad in Cornish granite and Portland stone to provide a pleasing appearance and to protect the steel framework beneath, creating a structure that appeared medieval while incorporating cutting-edge Victorian technology. Construction began in 1886 and employed 432 workers over eight years, tragically claiming the lives of 10 men during the dangerous work. The bridge required 70,000 tons of concrete to be sunk into the riverbed to support the massive structure. Over 11,000 tons of steel formed the framework, which was then clad in stone. The bascule mechanism was revolutionary for its time - two massive bascules (leaves), each weighing over 1,000 tons, could be raised to an angle of 83 degrees in just five minutes. Originally powered by steam, the hydraulic system used water pumped into accumulators by steam engines to move the bascules. The system was so well-designed that it required relatively little power to operate, with the massive counterweights doing much of the work. The high-level walkways, 42 meters (138 feet) above the Thames at high tide, quickly became popular with prostitutes and pickpockets rather than legitimate pedestrians, leading to their closure in 1910. They remained closed until 1982 when they reopened as part of the Tower Bridge Exhibition, now featuring glass floors offering thrilling views down to the river and road below. Tower Bridge was officially opened on June 30, 1894, by the Prince of Wales (the future King Edward VII) and his wife, Alexandra of Denmark. In its early years, the bridge was raised almost 50 times per day to allow ships to pass. Today, it still opens approximately 800 times per year, though the mechanism is now powered by electricity rather than steam. The bridge has been the scene of numerous daring incidents. In 1952, a double-decker bus found itself on the bridge as it began to open; driver Albert Gunter accelerated and jumped the growing gap, earning himself a £10 bonus for bravery. In 1968, Royal Air Force pilot Alan Pollock flew his Hawker Hunter jet through the bridge\'s towers as an unauthorized protest, threading his aircraft through the upper and lower spans. The bridge underwent major color changes over its history. Originally chocolate brown, it was repainted red, white, and blue for Queen Elizabeth II\'s Silver Jubilee in 1977. It was later repainted in the current blue and white color scheme that many consider iconic, though historians note it was never these colors originally. The Engine Rooms, located in the bridge\'s southern approach, house the original Victorian steam engines, accumulators, and boilers that once powered the bridge. These magnificent examples of Victorian engineering, built by Armstrong Mitchell & Company, have been preserved as a museum, allowing visitors to see the intricate machinery that made the bridge\'s operation possible. The engines, though no longer in use, remain in pristine condition, their brass fittings polished and copper pipes gleaming, offering a window into the industrial age. Tower Bridge has appeared in countless films, from "Spice World" to "Bridget Jones\'s Diary," and has been destroyed in numerous disaster movies, including "The Mummy Returns" and "Thor: The Dark World." It often appears incorrectly labeled as "London Bridge" in popular media, causing confusion between the two distinct structures. The bridge has become a symbol of London, appearing on souvenirs, postcards, and promotional materials worldwide. It plays a central role in London\'s major celebrations, including elaborate lighting displays for New Year\'s Eve, royal occasions, and the annual Lord Mayor\'s Show. The bridge is illuminated nightly, and special lighting schemes mark significant events - red and blue for royal celebrations, rainbow colors for Pride, and various national flags for visiting dignitaries. The Tower Bridge Exhibition, opened in 1982, allows visitors to explore the bridge\'s history and engineering while walking across the high-level walkways with their glass floors installed in 2014. The exhibition tells the story of the bridge\'s construction, its role in London\'s history, and the lives of the people who built and maintained it. Visitors can also watch the bridge lift from special viewing areas, experiencing the impressive sight of the massive bascules rising to allow tall ships through. In recent years, Tower Bridge has embraced modern technology while maintaining its Victorian character. LED lighting has replaced older systems, reducing energy consumption while allowing for more dramatic displays. The bridge has also become a focal point for sporting events, including the London Olympics and various marathons and charity events. Conservation work continues to preserve the structure for future generations, with ongoing maintenance of the stonework, steelwork, and mechanical systems. Tower Bridge represents more than Victorian engineering prowess - it symbolizes London\'s ability to blend the old with the new, tradition with innovation. It stands as a working bridge that still raises for river traffic while serving as one of the world\'s most visited tourist attractions. The bridge connects London\'s historic center with the modern developments of the South Bank and beyond, both physically and symbolically. As London continues to evolve, Tower Bridge remains a constant, its distinctive silhouette a reminder of the city\'s rich history and its ongoing journey into the future. The bridge proves that functional infrastructure can also be beautiful, that engineering can be art, and that the best monuments are those that continue to serve their communities while inspiring wonder and pride across generations.'
      },
      it: {
        name: 'Tower Bridge',
        narration: 'Ti trovi al Tower Bridge, uno dei monumenti più famosi di Londra. Questo ponte basculante e sospeso attraversa il Tamigi.',
        description: 'Un simbolo iconico di Londra dal 1894'
      },
      ko: {
        name: '타워 브리지',
        narration: '런던에서 가장 유명한 랜드마크 중 하나인 타워 브리지에 있습니다. 이 도개교와 현수교가 결합된 다리는 템스강을 가로지릅니다.',
        description: '1894년부터 런던의 상징'
      },
      es: {
        name: 'Tower Bridge',
        narration: 'Está en Tower Bridge, uno de los monumentos más famosos de Londres. Este puente basculante y colgante cruza el río Támesis.',
        description: 'Un símbolo icónico de Londres desde 1894'
      },
      fr: {
        name: 'Tower Bridge',
        narration: 'Vous êtes au Tower Bridge, l\'un des monuments les plus célèbres de Londres. Ce pont basculant et suspendu traverse la Tamise.',
        description: 'Un symbole emblématique de Londres depuis 1894'
      },
      de: {
        name: 'Tower Bridge',
        narration: 'Sie befinden sich an der Tower Bridge, einem der berühmtesten Wahrzeichen Londons. Diese kombinierte Klapp- und Hängebrücke überquert die Themse.',
        description: 'Ein ikonisches Symbol Londons seit 1894'
      },
      zh: {
        name: '塔桥',
        narration: '您在伦敦最著名的地标之一塔桥。这座开合桥和悬索桥的组合横跨泰晤士河。',
        description: '自1894年以来伦敦的标志性象征'
      },
      ja: {
        name: 'タワーブリッジ',
        narration: 'ロンドンで最も有名なランドマークの一つ、タワーブリッジにいます。この跳ね橋と吊り橋を組み合わせた橋はテムズ川に架かっています。',
        description: '1894年以来のロンドンの象徴'
      }
    }
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
    category: 'Palace',
    detailedDescription: 'Buckingham Palace, the London residence and administrative headquarters of the British monarch, stands as one of the world\'s most recognizable symbols of royalty, state power, and British national identity. Located in the City of Westminster, this magnificent palace serves not only as the Queen\'s official London residence but also as the venue for numerous state occasions, royal ceremonies, and official entertaining. With 775 rooms, including 19 State Rooms, 52 Royal and guest bedrooms, 188 staff bedrooms, 92 offices, and 78 bathrooms, Buckingham Palace is one of the largest and most complex working palaces in the world. The site\'s history as a royal residence began in 1761 when King George III acquired Buckingham House, a large townhouse built for the Duke of Buckingham in 1703, as a private residence for Queen Charlotte. The original house, designed by William Winde, was a relatively modest brick building, far from the grand palace we see today. George III and Charlotte raised 14 of their 15 children there, preferring its comfortable domestic setting to the formality of St. James\'s Palace. George III called it the Queen\'s House, and it remained a private royal residence for nearly 60 years. The transformation from private house to grand palace began in 1826 when King George IV commissioned architect John Nash to expand and rebuild the structure as a suitable royal palace. Nash\'s ambitious Neoclassical design created a three-sided courtyard facing The Mall, featuring Bath stone façades and a magnificent central dome. However, George IV died before the work was completed, and his brother William IV, who succeeded him, showed little interest in the project. It was Queen Victoria who first made Buckingham Palace the principal royal residence in 1837, shortly after her accession to the throne. Finding the palace too small for court life and her growing family, Victoria commissioned Edward Blore to build a new wing closing the open side of Nash\'s courtyard. This wing, facing The Mall, was completed in 1847 and included the famous balcony where the Royal Family gathers for major celebrations. The original entrance, Nash\'s Marble Arch, was moved to its current position at the northeast corner of Hyde Park. The palace facade that visitors see today, the principal face of the palace, was refaced in 1913 with Portland stone by architect Aston Webb, creating the iconic image of Buckingham Palace known worldwide. Webb\'s design provided a more dignified and monumental backdrop for royal ceremonies and state occasions. The central balcony, part of Blore\'s wing, has become the iconic stage for royal appearances during moments of national celebration, from VE Day in 1945 to royal weddings and jubilees. The State Rooms, opened to the public each summer, showcase some of the greatest treasures of the Royal Collection. The Grand Staircase, with its elaborate gilded bronze balustrade, leads visitors to the State Rooms, which include the Throne Room, used for formal photographs at royal weddings and investiture ceremonies; the Picture Gallery, a 47-meter long room displaying masterpieces by Rembrandt, Rubens, Vermeer, and Canaletto; the White Drawing Room, where the Royal Family gathers before state occasions; and the magnificent Ballroom, the largest room in the palace, used for state banquets and investitures. The Music Room, with its beautiful domed ceiling, has witnessed numerous royal christenings, including those of Prince Charles, Prince William, Prince George, Princess Charlotte, and Prince Louis. The Blue Drawing Room, with its magnificent ceiling design by Nash, contains some of the finest examples of 18th-century French furniture in the Royal Collection. The Green Drawing Room serves as a royal salon, while the Throne Room, with its iconic paired thrones, provides the backdrop for countless official photographs. Buckingham Palace\'s 39-acre garden, the largest private garden in London, hosts the Queen\'s annual garden parties, where approximately 30,000 guests are entertained each summer. The garden contains a helicopter landing pad, a lake with an island that provides a sanctuary for the palace\'s diverse wildlife, and the famous Waterloo Vase, a massive urn carved from a single piece of Carrara marble. The garden has played host to numerous events, from children\'s parties to the Diamond Jubilee concert in 2012. The palace is protected by the Queen\'s Guard, whose Changing of the Guard ceremony has become one of London\'s most popular tourist attractions. This colorful ceremony, accompanied by a Guards band, takes place in the palace forecourt and represents the formal handover of responsibility for protecting the palace from one guard to another. The ceremony attracts thousands of spectators daily during the summer months. Buckingham Palace has been the epicenter of British history and national life for nearly two centuries. It served as a hospital for wounded soldiers during World War I. During World War II, King George VI and Queen Elizabeth (later the Queen Mother) refused to leave London during the Blitz, staying at the palace despite it being bombed nine times. The King\'s famous words, "I\'m glad we\'ve been bombed. It makes me feel I can look the East End in the face," reflected the palace\'s role as a symbol of British resilience. The palace balcony has witnessed some of the most significant moments in British history. Winston Churchill appeared there with the Royal Family on VE Day in 1945. Prince William and Catherine Middleton shared their first kiss as a married couple there in 2011, watched by millions worldwide. The balcony appearance has become a tradition for royal weddings, jubilees, and national celebrations. The Royal Mews, located to the south of the palace, houses the royal collection of historic coaches and carriages, including the Gold State Coach used for coronations since 1762. The Diamond Jubilee State Coach, commissioned in 2012, incorporates wood from historic buildings including Westminster Abbey and the Tower of London. The Mews also houses the working horses and cars used for royal duties. The Queen\'s Gallery, opened in 1962, displays changing exhibitions from the Royal Collection, one of the world\'s great art collections. Originally built as a chapel destroyed during World War II, the gallery allows the public to view treasures that span 500 years, from Leonardo da Vinci drawings to Fabergé eggs. In recent years, Buckingham Palace has undergone a major ten-year renovation program, the largest since World War II, to upgrade its aging infrastructure while preserving its historic character. The work includes replacing aging electrical cables, plumbing, and heating systems, ensuring the palace can continue to function as a working royal residence and national monument for future generations. Buckingham Palace represents more than bricks and mortar - it embodies British monarchy, history, and national identity. It serves as both a family home and a working building, hosting over 50,000 guests annually at banquets, lunches, dinners, receptions, and garden parties. The palace is both a national treasure and a symbol of continuity, connecting Britain\'s past with its present and future. As the administrative headquarters of the monarchy, it remains at the heart of British public life, a place where history is made and where the traditions of centuries continue to evolve for modern times.',
    photos: [
      'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800',
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800'
    ],
    historicalInfo: 'Buckingham Palace has served as the official London residence of the UK\'s sovereigns since 1837. It was originally a large townhouse built for the Duke of Buckingham in 1703.',
    yearBuilt: 'Original house: 1703, Palace expansion: 1826-1837',
    architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb',
    translations: {
      en: {
        name: 'Buckingham Palace',
        narration: 'This is Buckingham Palace, the London residence of the British monarch. Watch the famous Changing of the Guard ceremony.',
        description: 'The official residence of the British monarch',
        detailedDescription: 'Buckingham Palace, the London residence and administrative headquarters of the British monarch, stands as one of the world\'s most recognizable symbols of royalty, state power, and British national identity. Located in the City of Westminster, this magnificent palace serves not only as the Queen\'s official London residence but also as the venue for numerous state occasions, royal ceremonies, and official entertaining. With 775 rooms, including 19 State Rooms, 52 Royal and guest bedrooms, 188 staff bedrooms, 92 offices, and 78 bathrooms, Buckingham Palace is one of the largest and most complex working palaces in the world. The site\'s history as a royal residence began in 1761 when King George III acquired Buckingham House, a large townhouse built for the Duke of Buckingham in 1703, as a private residence for Queen Charlotte. The original house, designed by William Winde, was a relatively modest brick building, far from the grand palace we see today. George III and Charlotte raised 14 of their 15 children there, preferring its comfortable domestic setting to the formality of St. James\'s Palace. George III called it the Queen\'s House, and it remained a private royal residence for nearly 60 years. The transformation from private house to grand palace began in 1826 when King George IV commissioned architect John Nash to expand and rebuild the structure as a suitable royal palace. Nash\'s ambitious Neoclassical design created a three-sided courtyard facing The Mall, featuring Bath stone façades and a magnificent central dome. However, George IV died before the work was completed, and his brother William IV, who succeeded him, showed little interest in the project. It was Queen Victoria who first made Buckingham Palace the principal royal residence in 1837, shortly after her accession to the throne. Finding the palace too small for court life and her growing family, Victoria commissioned Edward Blore to build a new wing closing the open side of Nash\'s courtyard. This wing, facing The Mall, was completed in 1847 and included the famous balcony where the Royal Family gathers for major celebrations. The original entrance, Nash\'s Marble Arch, was moved to its current position at the northeast corner of Hyde Park. The palace facade that visitors see today, the principal face of the palace, was refaced in 1913 with Portland stone by architect Aston Webb, creating the iconic image of Buckingham Palace known worldwide. Webb\'s design provided a more dignified and monumental backdrop for royal ceremonies and state occasions. The central balcony, part of Blore\'s wing, has become the iconic stage for royal appearances during moments of national celebration, from VE Day in 1945 to royal weddings and jubilees. The State Rooms, opened to the public each summer, showcase some of the greatest treasures of the Royal Collection. The Grand Staircase, with its elaborate gilded bronze balustrade, leads visitors to the State Rooms, which include the Throne Room, used for formal photographs at royal weddings and investiture ceremonies; the Picture Gallery, a 47-meter long room displaying masterpieces by Rembrandt, Rubens, Vermeer, and Canaletto; the White Drawing Room, where the Royal Family gathers before state occasions; and the magnificent Ballroom, the largest room in the palace, used for state banquets and investitures. The Music Room, with its beautiful domed ceiling, has witnessed numerous royal christenings, including those of Prince Charles, Prince William, Prince George, Princess Charlotte, and Prince Louis. The Blue Drawing Room, with its magnificent ceiling design by Nash, contains some of the finest examples of 18th-century French furniture in the Royal Collection. The Green Drawing Room serves as a royal salon, while the Throne Room, with its iconic paired thrones, provides the backdrop for countless official photographs. Buckingham Palace\'s 39-acre garden, the largest private garden in London, hosts the Queen\'s annual garden parties, where approximately 30,000 guests are entertained each summer. The garden contains a helicopter landing pad, a lake with an island that provides a sanctuary for the palace\'s diverse wildlife, and the famous Waterloo Vase, a massive urn carved from a single piece of Carrara marble. The garden has played host to numerous events, from children\'s parties to the Diamond Jubilee concert in 2012. The palace is protected by the Queen\'s Guard, whose Changing of the Guard ceremony has become one of London\'s most popular tourist attractions. This colorful ceremony, accompanied by a Guards band, takes place in the palace forecourt and represents the formal handover of responsibility for protecting the palace from one guard to another. The ceremony attracts thousands of spectators daily during the summer months. Buckingham Palace has been the epicenter of British history and national life for nearly two centuries. It served as a hospital for wounded soldiers during World War I. During World War II, King George VI and Queen Elizabeth (later the Queen Mother) refused to leave London during the Blitz, staying at the palace despite it being bombed nine times. The King\'s famous words, "I\'m glad we\'ve been bombed. It makes me feel I can look the East End in the face," reflected the palace\'s role as a symbol of British resilience. The palace balcony has witnessed some of the most significant moments in British history. Winston Churchill appeared there with the Royal Family on VE Day in 1945. Prince William and Catherine Middleton shared their first kiss as a married couple there in 2011, watched by millions worldwide. The balcony appearance has become a tradition for royal weddings, jubilees, and national celebrations. The Royal Mews, located to the south of the palace, houses the royal collection of historic coaches and carriages, including the Gold State Coach used for coronations since 1762. The Diamond Jubilee State Coach, commissioned in 2012, incorporates wood from historic buildings including Westminster Abbey and the Tower of London. The Mews also houses the working horses and cars used for royal duties. The Queen\'s Gallery, opened in 1962, displays changing exhibitions from the Royal Collection, one of the world\'s great art collections. Originally built as a chapel destroyed during World War II, the gallery allows the public to view treasures that span 500 years, from Leonardo da Vinci drawings to Fabergé eggs. In recent years, Buckingham Palace has undergone a major ten-year renovation program, the largest since World War II, to upgrade its aging infrastructure while preserving its historic character. The work includes replacing aging electrical cables, plumbing, and heating systems, ensuring the palace can continue to function as a working royal residence and national monument for future generations. Buckingham Palace represents more than bricks and mortar - it embodies British monarchy, history, and national identity. It serves as both a family home and a working building, hosting over 50,000 guests annually at banquets, lunches, dinners, receptions, and garden parties. The palace is both a national treasure and a symbol of continuity, connecting Britain\'s past with its present and future. As the administrative headquarters of the monarchy, it remains at the heart of British public life, a place where history is made and where the traditions of centuries continue to evolve for modern times.'
      },
      it: {
        name: 'Palazzo di Buckingham',
        narration: 'Questo è Buckingham Palace, la residenza londinese del monarca britannico. Osserva la famosa cerimonia del Cambio della Guardia.',
        description: 'La residenza ufficiale del monarca britannico'
      },
      ko: {
        name: '버킹엄 궁전',
        narration: '영국 군주의 런던 거주지인 버킹엄 궁전입니다. 유명한 근위병 교대식을 관람하세요.',
        description: '영국 군주의 공식 거주지'
      },
      es: {
        name: 'Palacio de Buckingham',
        narration: 'Este es el Palacio de Buckingham, la residencia londinense del monarca británico. Observe la famosa ceremonia del Cambio de Guardia.',
        description: 'La residencia oficial del monarca británico'
      },
      fr: {
        name: 'Palais de Buckingham',
        narration: 'Voici le Palais de Buckingham, la résidence londonienne du monarque britannique. Assistez à la célèbre cérémonie de la relève de la garde.',
        description: 'La résidence officielle du monarque britannique'
      },
      de: {
        name: 'Buckingham Palace',
        narration: 'Dies ist der Buckingham Palace, die Londoner Residenz des britischen Monarchen. Beobachten Sie die berühmte Wachablösung.',
        description: 'Die offizielle Residenz des britischen Monarchen'
      },
      zh: {
        name: '白金汉宫',
        narration: '这是白金汉宫，英国君主的伦敦住所。观看著名的卫兵换岗仪式。',
        description: '英国君主的官方住所'
      },
      ja: {
        name: 'バッキンガム宮殿',
        narration: 'これは英国君主のロンドン邸宅、バッキンガム宮殿です。有名な衛兵交代式をご覧ください。',
        description: '英国君主の公式邸宅'
      }
    }
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
    category: 'Attraction',
    detailedDescription: 'The London Eye, also known as the Millennium Wheel, stands as one of the world\'s most iconic observation wheels and London\'s most popular paid tourist attraction, welcoming over 3.5 million visitors annually to experience breathtaking 360-degree views of the British capital. Rising 135 meters (443 feet) above the South Bank of the River Thames, this engineering marvel has transformed London\'s skyline since its opening in 2000, becoming as synonymous with the city as Big Ben, Tower Bridge, and Buckingham Palace. The London Eye was conceived as part of the millennium celebrations, designed to be a temporary structure that would stand for just five years. However, its immediate popularity and iconic status led to it becoming a permanent fixture of London\'s landscape. The wheel was designed by architects David Marks and Julia Barfield, who won a competition organized by The Sunday Times and the Architecture Foundation to design a landmark to celebrate the new millennium. Their innovative design drew inspiration from the engineering principles of bicycle wheels, creating a cantilevered structure that appears to float effortlessly above the Thames. Construction of the London Eye was an engineering feat of remarkable complexity and ambition. The wheel was constructed in sections, with components manufactured across Europe and transported to London for assembly. The A-frame legs, which support the wheel\'s massive weight, were transported up the Thames on barges and lifted into position by some of Europe\'s largest floating cranes. The wheel itself was assembled horizontally on temporary platforms in the river, then slowly raised to its vertical position over the course of a week in October 1999 using a sophisticated jacking system. The process was so delicate and unprecedented that it captured worldwide attention, with thousands gathering to watch the dramatic tilting of the massive structure. The London Eye consists of 32 sealed and air-conditioned passenger capsules, representing the 32 London boroughs. Interestingly, the capsules are numbered 1 to 33, skipping number 13 for superstitious reasons. Each capsule weighs 10 tons, is built to carry 25 people, and provides unobstructed 360-degree views through its glass construction. The capsules are attached to the external circumference of the wheel and rotate in motorized fashion, maintaining a horizontal position as the wheel turns, ensuring passengers always have an upright viewing platform. A complete rotation takes approximately 30 minutes, moving at a stately pace of 0.9 kilometers per hour (0.6 mph), allowing the wheel to continue moving while passengers board and alight - though it can be stopped for disabled or elderly passengers who need more time. The wheel weighs approximately 2,100 tons, with the rim alone weighing 1,700 tons. It is supported by an A-frame on one side only, making it the world\'s tallest cantilevered observation wheel. This cantilever design, with the wheel supported from one side rather than both, creates the distinctive silhouette that has become so recognizable. The structure requires 1,700 tons of steel and took seven years from conception to completion, at a cost of £75 million. From the top of the London Eye, on a clear day, visitors can see up to 40 kilometers (25 miles) in all directions, encompassing Windsor Castle to the west and the hills of Kent to the south. The views include all of London\'s major landmarks: the Houses of Parliament and Big Ben directly across the river, St. Paul\'s Cathedral\'s distinctive dome, the Tower of London, Tower Bridge, the Shard piercing the sky, and countless other historic and modern buildings that tell the story of London\'s evolution from Roman settlement to global metropolis. The London Eye has become much more than an observation wheel - it serves as a cultural landmark and event venue. The capsules have hosted everything from weddings to business meetings, from yoga sessions to wine tastings. In 2005, one capsule was temporarily converted into a luxury apartment where two competition winners spent the night suspended 135 meters above London. The wheel has been illuminated in various colors to mark significant events: red for Chinese New Year, pink for breast cancer awareness, rainbow colors for Pride, and even the colors of national flags to welcome visiting dignitaries. The London Eye played a central role in London\'s millennium celebrations, with a spectacular fireworks display launched from the wheel itself at midnight on January 1, 2000 - though technical problems meant the wheel wasn\'t actually rotating for passengers until March 2000. Since then, it has become the focal point for London\'s New Year\'s Eve celebrations, with elaborate firework displays launched from the wheel and surrounding area, broadcast to millions worldwide. The wheel has also been featured in numerous films, television shows, and music videos, from the James Bond thriller "Spectre" to the romantic comedy "Bridget Jones\'s Diary," cementing its place in popular culture. Its distinctive circular form has become an instantly recognizable symbol of London, appearing in countless photographs, paintings, and promotional materials for the city. In 2015, the London Eye underwent a major refurbishment, with Coca-Cola becoming the title sponsor, leading to it being officially branded as the "Coca-Cola London Eye" - though most Londoners and visitors continue to call it simply "The London Eye." The refurbishment included new lighting systems using LED technology, creating more dynamic and energy-efficient illumination displays that can change color and pattern for special events. The London Eye pioneered the concept of large-scale observation wheels in major cities, inspiring similar structures worldwide, including the Singapore Flyer, the High Roller in Las Vegas, and the Dubai Eye. However, the London Eye remains unique in its cantilever design and its integration into the urban landscape, positioned to provide optimal views of one of the world\'s most historic cityscapes. The observation wheel has also contributed significantly to the regeneration of London\'s South Bank, which has transformed from an underutilized industrial area into one of London\'s most vibrant cultural quarters. The area now features theaters, galleries, restaurants, and public spaces, with the London Eye serving as the anchor attraction that draws millions of visitors who then explore the surrounding cultural offerings. During the COVID-19 pandemic, the London Eye stood silent for months, its empty capsules a poignant symbol of the tourism industry\'s challenges. However, upon reopening, it implemented new safety measures and private capsule bookings, demonstrating its adaptability and resilience. The pandemic period also saw the wheel illuminated in rainbow colors to honor NHS workers and in other meaningful displays of solidarity and hope. Today, the London Eye stands as a symbol of the turn of the millennium, a monument to engineering ingenuity, and a beloved London landmark that offers both residents and visitors a unique perspective on one of the world\'s great cities. It represents London\'s ability to embrace the new while honoring the old, to innovate while respecting tradition. From its capsules, suspended above the Thames, passengers gain not just a view of London but a new understanding of the city\'s layout, history, and evolution - a 30-minute journey that connects past, present, and future in the most literal and spectacular way possible. The London Eye reminds us that sometimes the best way to appreciate where we are is to step back, rise above, and see the bigger picture.',
    photos: [
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800'
    ],
    historicalInfo: 'The London Eye was built to celebrate the millennium and opened to the public in March 2000. It was designed by architects David Marks and Julia Barfield and has become one of London\'s most iconic landmarks.',
    yearBuilt: '1999-2000',
    architect: 'David Marks and Julia Barfield',
    translations: {
      en: {
        name: 'London Eye',
        narration: 'The London Eye is a giant observation wheel offering spectacular views over the city.',
        description: 'Europe\'s tallest cantilevered observation wheel',
        detailedDescription: 'The London Eye, also known as the Millennium Wheel, stands as one of the world\'s most iconic observation wheels and London\'s most popular paid tourist attraction, welcoming over 3.5 million visitors annually to experience breathtaking 360-degree views of the British capital. Rising 135 meters (443 feet) above the South Bank of the River Thames, this engineering marvel has transformed London\'s skyline since its opening in 2000, becoming as synonymous with the city as Big Ben, Tower Bridge, and Buckingham Palace. The London Eye was conceived as part of the millennium celebrations, designed to be a temporary structure that would stand for just five years. However, its immediate popularity and iconic status led to it becoming a permanent fixture of London\'s landscape. The wheel was designed by architects David Marks and Julia Barfield, who won a competition organized by The Sunday Times and the Architecture Foundation to design a landmark to celebrate the new millennium. Their innovative design drew inspiration from the engineering principles of bicycle wheels, creating a cantilevered structure that appears to float effortlessly above the Thames. Construction of the London Eye was an engineering feat of remarkable complexity and ambition. The wheel was constructed in sections, with components manufactured across Europe and transported to London for assembly. The A-frame legs, which support the wheel\'s massive weight, were transported up the Thames on barges and lifted into position by some of Europe\'s largest floating cranes. The wheel itself was assembled horizontally on temporary platforms in the river, then slowly raised to its vertical position over the course of a week in October 1999 using a sophisticated jacking system. The process was so delicate and unprecedented that it captured worldwide attention, with thousands gathering to watch the dramatic tilting of the massive structure. The London Eye consists of 32 sealed and air-conditioned passenger capsules, representing the 32 London boroughs. Interestingly, the capsules are numbered 1 to 33, skipping number 13 for superstitious reasons. Each capsule weighs 10 tons, is built to carry 25 people, and provides unobstructed 360-degree views through its glass construction. The capsules are attached to the external circumference of the wheel and rotate in motorized fashion, maintaining a horizontal position as the wheel turns, ensuring passengers always have an upright viewing platform. A complete rotation takes approximately 30 minutes, moving at a stately pace of 0.9 kilometers per hour (0.6 mph), allowing the wheel to continue moving while passengers board and alight - though it can be stopped for disabled or elderly passengers who need more time. The wheel weighs approximately 2,100 tons, with the rim alone weighing 1,700 tons. It is supported by an A-frame on one side only, making it the world\'s tallest cantilevered observation wheel. This cantilever design, with the wheel supported from one side rather than both, creates the distinctive silhouette that has become so recognizable. The structure requires 1,700 tons of steel and took seven years from conception to completion, at a cost of £75 million. From the top of the London Eye, on a clear day, visitors can see up to 40 kilometers (25 miles) in all directions, encompassing Windsor Castle to the west and the hills of Kent to the south. The views include all of London\'s major landmarks: the Houses of Parliament and Big Ben directly across the river, St. Paul\'s Cathedral\'s distinctive dome, the Tower of London, Tower Bridge, the Shard piercing the sky, and countless other historic and modern buildings that tell the story of London\'s evolution from Roman settlement to global metropolis. The London Eye has become much more than an observation wheel - it serves as a cultural landmark and event venue. The capsules have hosted everything from weddings to business meetings, from yoga sessions to wine tastings. In 2005, one capsule was temporarily converted into a luxury apartment where two competition winners spent the night suspended 135 meters above London. The wheel has been illuminated in various colors to mark significant events: red for Chinese New Year, pink for breast cancer awareness, rainbow colors for Pride, and even the colors of national flags to welcome visiting dignitaries. The London Eye played a central role in London\'s millennium celebrations, with a spectacular fireworks display launched from the wheel itself at midnight on January 1, 2000 - though technical problems meant the wheel wasn\'t actually rotating for passengers until March 2000. Since then, it has become the focal point for London\'s New Year\'s Eve celebrations, with elaborate firework displays launched from the wheel and surrounding area, broadcast to millions worldwide. The wheel has also been featured in numerous films, television shows, and music videos, from the James Bond thriller "Spectre" to the romantic comedy "Bridget Jones\'s Diary," cementing its place in popular culture. Its distinctive circular form has become an instantly recognizable symbol of London, appearing in countless photographs, paintings, and promotional materials for the city. In 2015, the London Eye underwent a major refurbishment, with Coca-Cola becoming the title sponsor, leading to it being officially branded as the "Coca-Cola London Eye" - though most Londoners and visitors continue to call it simply "The London Eye." The refurbishment included new lighting systems using LED technology, creating more dynamic and energy-efficient illumination displays that can change color and pattern for special events. The London Eye pioneered the concept of large-scale observation wheels in major cities, inspiring similar structures worldwide, including the Singapore Flyer, the High Roller in Las Vegas, and the Dubai Eye. However, the London Eye remains unique in its cantilever design and its integration into the urban landscape, positioned to provide optimal views of one of the world\'s most historic cityscapes. The observation wheel has also contributed significantly to the regeneration of London\'s South Bank, which has transformed from an underutilized industrial area into one of London\'s most vibrant cultural quarters. The area now features theaters, galleries, restaurants, and public spaces, with the London Eye serving as the anchor attraction that draws millions of visitors who then explore the surrounding cultural offerings. During the COVID-19 pandemic, the London Eye stood silent for months, its empty capsules a poignant symbol of the tourism industry\'s challenges. However, upon reopening, it implemented new safety measures and private capsule bookings, demonstrating its adaptability and resilience. The pandemic period also saw the wheel illuminated in rainbow colors to honor NHS workers and in other meaningful displays of solidarity and hope. Today, the London Eye stands as a symbol of the turn of the millennium, a monument to engineering ingenuity, and a beloved London landmark that offers both residents and visitors a unique perspective on one of the world\'s great cities. It represents London\'s ability to embrace the new while honoring the old, to innovate while respecting tradition. From its capsules, suspended above the Thames, passengers gain not just a view of London but a new understanding of the city\'s layout, history, and evolution - a 30-minute journey that connects past, present, and future in the most literal and spectacular way possible. The London Eye reminds us that sometimes the best way to appreciate where we are is to step back, rise above, and see the bigger picture.'
      },
      it: {
        name: 'London Eye',
        narration: 'Il London Eye è una gigantesca ruota panoramica che offre viste spettacolari sulla città.',
        description: 'La ruota panoramica a sbalzo più alta d\'Europa'
      },
      ko: {
        name: '런던 아이',
        narration: '런던 아이는 도시의 멋진 전망을 제공하는 거대한 관람차입니다.',
        description: '유럽에서 가장 높은 캔틸레버 관람차'
      },
      es: {
        name: 'London Eye',
        narration: 'El London Eye es una noria gigante que ofrece vistas espectaculares de la ciudad.',
        description: 'La noria en voladizo más alta de Europa'
      },
      fr: {
        name: 'London Eye',
        narration: 'Le London Eye est une grande roue offrant des vues spectaculaires sur la ville.',
        description: 'La plus haute grande roue en porte-à-faux d\'Europe'
      },
      de: {
        name: 'London Eye',
        narration: 'Das London Eye ist ein riesiges Riesenrad, das spektakuläre Ausblicke über die Stadt bietet.',
        description: 'Das höchste freitragende Riesenrad Europas'
      },
      zh: {
        name: '伦敦眼',
        narration: '伦敦眼是一座巨型摩天轮，可欣赏城市壮观景色。',
        description: '欧洲最高的悬臂式摩天轮'
      },
      ja: {
        name: 'ロンドン・アイ',
        narration: 'ロンドン・アイは、街の素晴らしい景色を提供する巨大な観覧車です。',
        description: 'ヨーロッパで最も高い片持ち式観覧車'
      }
    }
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
