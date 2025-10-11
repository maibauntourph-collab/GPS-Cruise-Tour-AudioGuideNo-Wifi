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
      'https://images.unsplash.com/photo-1598559862042-31ebfe8e09f2?w=800',
      'https://images.unsplash.com/photo-nAb-SFzL1GM?w=800',
      'https://images.unsplash.com/photo-TC73XlNiDeM?w=800',
      'https://images.unsplash.com/photo-VFRTXGw1VjU?w=800',
      'https://images.unsplash.com/photo-_TA9AoKd2j4?w=800'
    ],
    historicalInfo: 'The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of Rome. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held 50,000 to 80,000 spectators.',
    yearBuilt: '70-80 AD',
    architect: 'Emperors Vespasian and Titus',
    translations: {
      en: {
        name: 'Colosseum',
        narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
        description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
        detailedDescription: 'The Colosseum, also known as the Flavian Amphitheatre, stands as one of the greatest architectural achievements of ancient Rome and remains the largest amphitheater ever constructed. Built between 70-80 AD under Emperors Vespasian and Titus, this magnificent elliptical structure could accommodate between 50,000 to 80,000 spectators who came to witness gladiatorial contests, animal hunts, mock naval battles, and public executions. The name "Colosseum" likely derives from the colossal bronze statue of Nero that once stood nearby. Constructed primarily of travertine limestone blocks, volcanic tuff, and brick-faced concrete, the Colosseum showcases the engineering brilliance of Roman architecture. Its innovative design featured a complex system of vaults and arches that distributed weight efficiently, allowing for its massive four-story facade. The exterior was adorned with Doric, Ionic, and Corinthian columns on successive levels, demonstrating the Romans mastery of classical architectural orders. The arena floor, once covered with wooden planking and sand, concealed an elaborate underground network called the hypogeum - a two-level subterranean complex of tunnels and chambers where gladiators, animals, and stage equipment were housed and prepared for the spectacles above. A sophisticated system of pulleys, ramps, and trapdoors allowed for dramatic entrances and special effects during performances. The Colosseum also featured a retractable awning system called the velarium, operated by sailors from the Roman navy, which provided shade for spectators during events. Despite suffering damage from earthquakes, stone-robbers who repurposed its materials for other buildings, and the general passage of time, the Colosseum has endured as a powerful symbol of Imperial Rome and ancient civilization. Today, it stands as one of Rome\'s most popular tourist attractions and a UNESCO World Heritage Site, drawing millions of visitors annually who come to marvel at this extraordinary monument to Roman engineering and entertainment.',
        historicalInfo: 'The Colosseum, also known as the Flavian Amphitheatre, is an oval amphitheatre in the centre of Rome. Built of travertine limestone, tuff, and brick-faced concrete, it was the largest amphitheatre ever built at the time and held 50,000 to 80,000 spectators.',
        yearBuilt: '70-80 AD',
        architect: 'Emperors Vespasian and Titus'
      },
      it: {
        name: 'Colosseo',
        narration: 'Benvenuto al Colosseo, il simbolo iconico di Roma. Questo antico anfiteatro ospitava combattimenti tra gladiatori e spettacoli pubblici.',
        description: 'Il più grande anfiteatro mai costruito, patrimonio mondiale dell\'UNESCO',
        detailedDescription: 'Il Colosseo, conosciuto anche come Anfiteatro Flavio, rappresenta uno dei più grandi risultati architettonici dell\'antica Roma e rimane il più grande anfiteatro mai costruito. Edificato tra il 70 e l\'80 d.C. sotto gli imperatori Vespasiano e Tito, questa magnifica struttura ellittica poteva ospitare tra 50.000 e 80.000 spettatori che venivano ad assistere a combattimenti tra gladiatori, cacce di animali, battaglie navali simulate ed esecuzioni pubbliche. Il nome "Colosseo" deriva probabilmente dalla colossale statua in bronzo di Nerone che un tempo si ergeva nelle vicinanze. Costruito principalmente con blocchi di pietra calcarea travertino, tufo vulcanico e cemento rivestito di mattoni, il Colosseo mostra la genialità ingegneristica dell\'architettura romana. Il suo design innovativo presentava un complesso sistema di volte e archi che distribuivano il peso in modo efficiente, consentendo la sua massiccia facciata a quattro piani. L\'esterno era adornato con colonne doriche, ioniche e corinzie su livelli successivi, dimostrando la padronanza romana degli ordini architettonici classici. Il pavimento dell\'arena, un tempo coperto da assi di legno e sabbia, nascondeva un\'elaborata rete sotterranea chiamata ipogeo - un complesso sotterraneo a due livelli di tunnel e camere dove gladiatori, animali e attrezzature sceniche venivano ospitati e preparati per gli spettacoli soprastanti. Un sofisticato sistema di carrucole, rampe e botole permetteva ingressi drammatici ed effetti speciali durante le rappresentazioni. Il Colosseo disponeva anche di un sistema di tende retrattili chiamato velarium, gestito da marinai della marina romana, che forniva ombra agli spettatori durante gli eventi. Nonostante i danni subiti da terremoti, saccheggiatori di pietra che ne hanno riutilizzato i materiali per altri edifici e il generale trascorrere del tempo, il Colosseo è rimasto un potente simbolo della Roma imperiale e della civiltà antica. Oggi si erge come una delle attrazioni turistiche più popolari di Roma e un sito patrimonio mondiale dell\'UNESCO, attirando milioni di visitatori ogni anno che vengono ad ammirare questo straordinario monumento all\'ingegneria e all\'intrattenimento romano.',
        historicalInfo: 'Il Colosseo, conosciuto anche come Anfiteatro Flavio, è un anfiteatro ovale nel centro di Roma. Costruito in pietra calcarea travertino, tufo e cemento rivestito di mattoni, era il più grande anfiteatro mai costruito all\'epoca e ospitava da 50.000 a 80.000 spettatori.',
        yearBuilt: '70-80 d.C.',
        architect: 'Imperatori Vespasiano e Tito'
      },
      ko: {
        name: '콜로세움',
        narration: '로마의 상징인 콜로세움에 오신 것을 환영합니다. 이 고대 원형 경기장은 한때 검투사 경기와 공개 행사를 개최했습니다.',
        description: '역사상 가장 큰 원형 경기장이자 유네스코 세계문화유산',
        detailedDescription: '플라비우스 원형극장으로도 알려진 콜로세움은 고대 로마의 가장 위대한 건축적 성취 중 하나로 남아있으며, 지금까지 건설된 가장 큰 원형 경기장입니다. 서기 70-80년 베스파시아누스와 티투스 황제 치하에 건설된 이 웅장한 타원형 구조물은 검투사 경기, 동물 사냥, 모의 해전, 공개 처형을 관람하러 온 5만에서 8만 명의 관중을 수용할 수 있었습니다. "콜로세움"이라는 이름은 근처에 서 있던 네로의 거대한 청동 조각상에서 유래했을 가능성이 큽니다. 주로 석회암 블록, 화산 응회암, 벽돌로 된 콘크리트로 건설된 콜로세움은 로마 건축의 공학적 우수성을 보여줍니다. 혁신적인 설계는 무게를 효율적으로 분산시키는 복잡한 볼트와 아치 시스템을 특징으로 하여 거대한 4층 파사드를 가능하게 했습니다. 외부는 연속적인 층에 도리아식, 이오니아식, 코린트식 기둥으로 장식되어 로마인들의 고전 건축 양식 숙달을 보여줍니다. 한때 나무 판자와 모래로 덮여 있던 경기장 바닥은 하이포지움이라고 불리는 정교한 지하 네트워크를 숨기고 있었습니다 - 검투사, 동물, 무대 장비가 보관되고 위의 공연을 위해 준비되던 2층 지하 터널과 방으로 이루어진 복합 공간이었습니다. 정교한 도르래, 경사로, 함정문 시스템은 공연 중 극적인 등장과 특수 효과를 가능하게 했습니다. 콜로세움은 또한 로마 해군의 선원들이 작동하는 벨라리움이라는 개폐식 차양 시스템을 갖추고 있어 행사 중 관중에게 그늘을 제공했습니다. 지진, 다른 건물에 자재를 재사용한 약탈자들, 그리고 시간의 경과로 인한 피해에도 불구하고, 콜로세움은 로마 제국과 고대 문명의 강력한 상징으로 남아있습니다. 오늘날 로마에서 가장 인기 있는 관광 명소이자 유네스코 세계문화유산으로 서 있으며, 매년 수백만 명의 방문객이 로마 공학과 오락의 이 특별한 기념물을 감상하러 옵니다.',
        historicalInfo: '플라비우스 원형극장으로도 알려진 콜로세움은 로마 중심부에 위치한 타원형 원형 경기장입니다. 석회암, 응회암, 벽돌 콘크리트로 건설되었으며, 당시 건설된 가장 큰 원형 경기장으로 5만에서 8만 명의 관중을 수용했습니다.',
        yearBuilt: '서기 70-80년',
        architect: '베스파시아누스 황제와 티투스 황제'
      },
      es: {
        name: 'Coliseo',
        narration: 'Bienvenido al Coliseo, el símbolo icónico de Roma. Este antiguo anfiteatro albergó combates de gladiadores y espectáculos públicos.',
        description: 'El anfiteatro más grande jamás construido, Patrimonio de la Humanidad de la UNESCO',
        historicalInfo: 'El Coliseo, también conocido como Anfiteatro Flavio, es un anfiteatro ovalado en el centro de Roma. Construido con piedra caliza travertino, toba y hormigón revestido de ladrillos, fue el anfiteatro más grande jamás construido en su época y albergaba entre 50.000 y 80.000 espectadores.',
        yearBuilt: '70-80 d.C.',
        architect: 'Emperadores Vespasiano y Tito'
      },
      fr: {
        name: 'Colisée',
        narration: 'Bienvenue au Colisée, le symbole emblématique de Rome. Cet amphithéâtre antique accueillait des combats de gladiateurs et des spectacles publics.',
        description: 'Le plus grand amphithéâtre jamais construit, site du patrimoine mondial de l\'UNESCO',
        historicalInfo: 'Le Colisée, également connu sous le nom d\'Amphithéâtre Flavien, est un amphithéâtre ovale au centre de Rome. Construit en pierre calcaire travertin, tuf et béton revêtu de briques, c\'était le plus grand amphithéâtre jamais construit à l\'époque et pouvait accueillir de 50 000 à 80 000 spectateurs.',
        yearBuilt: '70-80 apr. J.-C.',
        architect: 'Empereurs Vespasien et Titus'
      },
      de: {
        name: 'Kolosseum',
        narration: 'Willkommen im Kolosseum, dem ikonischen Symbol Roms. Dieses antike Amphitheater war Schauplatz von Gladiatorenkämpfen und öffentlichen Spektakeln.',
        description: 'Das größte jemals gebaute Amphitheater, UNESCO-Weltkulturerbe',
        historicalInfo: 'Das Kolosseum, auch als Flavisches Amphitheater bekannt, ist ein ovales Amphitheater im Zentrum Roms. Aus Travertin-Kalkstein, Tuffstein und ziegelverkleideten Beton gebaut, war es das größte jemals gebaute Amphitheater seiner Zeit und fasste 50.000 bis 80.000 Zuschauer.',
        yearBuilt: '70-80 n. Chr.',
        architect: 'Kaiser Vespasian und Titus'
      },
      zh: {
        name: '罗马斗兽场',
        narration: '欢迎来到罗马斗兽场，罗马的标志性象征。这座古老的圆形剧场曾举办角斗士比赛和公共表演。',
        description: '有史以来最大的圆形剧场，联合国教科文组织世界遗产',
        detailedDescription: '罗马斗兽场，也称为弗拉维圆形剧场，是古罗马最伟大的建筑成就之一，至今仍是有史以来建造的最大圆形剧场。这座宏伟的椭圆形建筑建于公元70-80年，由韦斯巴芗皇帝和提图斯皇帝主持建造，可容纳5万至8万名观众，他们来此观看角斗士战斗、动物狩猎、模拟海战和公开处决。"斗兽场"这个名字可能源自曾经矗立在附近的尼禄巨型青铜雕像。斗兽场主要由石灰华石灰岩块、火山凝灰岩和砖面混凝土建造，展示了罗马建筑的工程才华。其创新设计采用了复杂的拱顶和拱门系统，有效分配重量，支撑起巨大的四层外立面。外部装饰有多立克式、爱奥尼亚式和科林斯式柱子，层层叠加，展现了罗马人对古典建筑柱式的精通。竞技场地面曾覆盖着木板和沙子，下面隐藏着一个精密的地下网络，称为地下层——一个两层的地下隧道和房间系统，用于存放角斗士、动物和舞台设备，并为上方的表演做准备。复杂的滑轮、斜坡和活板门系统使表演期间能够实现戏剧性的入场和特效。斗兽场还配备了一个可伸缩的遮阳系统，称为天幕，由罗马海军的水手操作，在活动期间为观众提供遮阳。尽管遭受了地震、掠夺其材料用于其他建筑的石材盗贼以及时间流逝的破坏，斗兽场仍作为罗马帝国和古代文明的强大象征而屹立不倒。如今，它是罗马最受欢迎的旅游景点之一，也是联合国教科文组织世界遗产，每年吸引数百万游客前来欣赏这座罗马工程和娱乐的非凡纪念碑。',
        historicalInfo: '罗马斗兽场，也称为弗拉维圆形剧场，是位于罗马市中心的椭圆形圆形剧场。它由石灰华石灰岩、凝灰岩和砖面混凝土建造，是当时建造的最大的圆形剧场，可容纳5万至8万名观众。',
        yearBuilt: '公元70-80年',
        architect: '韦斯巴芗皇帝和提图斯皇帝'
      },
      ja: {
        name: 'コロッセオ',
        narration: 'ローマの象徴的シンボル、コロッセオへようこそ。この古代円形闘技場では剣闘士の戦いや公開スペクタクルが開催されました。',
        description: '史上最大の円形闘技場、ユネスコ世界遺産',
        detailedDescription: 'フラウィウス円形闘技場としても知られるコロッセオは、古代ローマの最も偉大な建築的成果の一つであり、これまでに建設された最大の円形闘技場です。西暦70-80年にウェスパシアヌス帝とティトゥス帝の下で建設されたこの壮大な楕円形構造物は、剣闘士の戦い、動物狩り、模擬海戦、公開処刑を観覧するために訪れた5万から8万人の観客を収容できました。「コロッセオ」という名前は、かつて近くに立っていたネロの巨大な青銅像に由来すると考えられています。主にトラバーチン石灰岩ブロック、火山凝灰岩、レンガ張りコンクリートで建設されたコロッセオは、ローマ建築の工学的輝きを示しています。革新的な設計は、重量を効率的に分散する複雑なヴォールトとアーチのシステムを特徴とし、巨大な4階建てのファサードを可能にしました。外装は連続する階層にドーリア式、イオニア式、コリント式の柱で装飾され、ローマ人の古典建築様式の習熟を示しています。かつて木製の板と砂で覆われていた闘技場の床は、ハイポジウムと呼ばれる精巧な地下ネットワークを隠していました - 剣闘士、動物、舞台装置が収容され、上での光景のために準備された2層の地下トンネルと部屋の複合体でした。洗練された滑車、スロープ、落とし戸のシステムにより、パフォーマンス中の劇的な登場と特殊効果が可能になりました。コロッセオにはベラリウムと呼ばれる格納式日よけシステムも備えられており、ローマ海軍の船員によって操作され、イベント中に観客に日陰を提供しました。地震、他の建物のために材料を転用した石泥棒、そして時の経過による被害にもかかわらず、コロッセオは帝政ローマと古代文明の強力な象徴として耐えてきました。今日、ローマで最も人気のある観光名所の一つであり、ユネスコ世界遺産として立っており、毎年数百万人の訪問者がローマの工学と娯楽のこの驚異的な記念碑を賞賛するために訪れます。',
        historicalInfo: 'コロッセオは、フラウィウス円形闘技場とも呼ばれ、ローマ中心部にある楕円形の円形闘技場です。トラバーチン石灰岩、凝灰岩、レンガ張りコンクリートで建設され、当時建造された最大の円形闘技場で、5万から8万人の観客を収容しました。',
        yearBuilt: '西暦70-80年',
        architect: 'ウェスパシアヌス帝とティトゥス帝'
      },
      pt: {
        name: 'Coliseu',
        narration: 'Bem-vindo ao Coliseu, o símbolo icônico de Roma. Este antigo anfiteatro já abrigou combates de gladiadores e espetáculos públicos.',
        description: 'O maior anfiteatro já construído, Patrimônio Mundial da UNESCO',
        historicalInfo: 'O Coliseu, também conhecido como Anfiteatro Flaviano, é um anfiteatro oval no centro de Roma. Construído em calcário travertino, tufo e concreto revestido de tijolos, foi o maior anfiteatro já construído na época e comportava de 50.000 a 80.000 espectadores.',
        yearBuilt: '70-80 d.C.',
        architect: 'Imperadores Vespasiano e Tito'
      },
      ru: {
        name: 'Колизей',
        narration: 'Добро пожаловать в Колизей, знаковый символ Рима. Этот древний амфитеатр когда-то принимал гладиаторские бои и публичные зрелища.',
        description: 'Самый большой амфитеатр из когда-либо построенных, объект Всемирного наследия ЮНЕСКО',
        historicalInfo: 'Колизей, также известный как амфитеатр Флавиев, представляет собой овальный амфитеатр в центре Рима. Построенный из травертинового известняка, туфа и облицованного кирпичом бетона, он был самым большим амфитеатром, когда-либо построенным в то время, и вмещал от 50 000 до 80 000 зрителей.',
        yearBuilt: '70-80 гг. н.э.',
        architect: 'Императоры Веспасиан и Тит'
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
      'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800',
      'https://images.unsplash.com/photo-TBKWOtcip1Q?w=800',
      'https://images.unsplash.com/photo--edlR3ZCKv8?w=800',
      'https://images.unsplash.com/photo-c9QzStYxqaU?w=800',
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
      'https://images.unsplash.com/photo-1598559862042-31ebfe8e09f2?w=800'
    ],
    historicalInfo: 'The Roman Forum was the center of day-to-day life in Rome: the site of triumphal processions and elections, the venue for public speeches, criminal trials, and gladiatorial matches, and the nucleus of commercial affairs.',
    yearBuilt: '7th century BC',
    architect: 'Various Roman architects over centuries',
    translations: {
      en: {
        name: 'Roman Forum',
        narration: 'You are at the Roman Forum, the heart of ancient Rome. This was the center of political life during the Republic era, where historic buildings still stand.',
        description: 'The center of ancient Roman public life',
        detailedDescription: 'The Roman Forum, known as Forum Romanum in Latin, represents the beating heart of ancient Rome and stands as one of the most important archaeological sites in the world. For over a thousand years, this rectangular plaza served as the center of Roman public life, witnessing the rise and fall of the Roman Republic and Empire. Originally a marshy burial ground between the Palatine and Capitoline Hills, the area was drained in the 7th century BC and transformed into Rome\'s central marketplace and gathering place. As Rome grew in power and prestige, the Forum evolved from a simple marketplace into a magnificent complex of temples, basilicas, and government buildings that showcased the architectural and political achievements of Roman civilization. The Forum was the site of triumphal processions celebrating military victories, where victorious generals would parade through the Via Sacra (Sacred Road) with their spoils of war and captive enemies. It hosted political assemblies where citizens debated the future of the Republic, criminal trials that determined justice, public speeches that swayed public opinion, and commercial activities that drove the Roman economy. Among its most significant structures was the Curia Julia, the senate house where Rome\'s most powerful political body met to debate legislation and policy. The Temple of Saturn, one of the Forum\'s oldest and most revered buildings, housed the state treasury and was the site of the annual Saturnalia festival. The Arch of Septimius Severus commemorated military victories in the East, while the Column of Phocas, erected in 608 AD, represents one of the last monuments added to the Forum. The Basilica Julia and Basilica Aemilia served as courts of law and commercial centers, their vast interiors bustling with lawyers, merchants, and citizens conducting business. The Temple of Vesta, home to the sacred flame tended by the Vestal Virgins, symbolized the eternal nature of Rome itself. After the fall of the Western Roman Empire, the Forum gradually fell into disrepair, its monuments stripped for building materials and its ground level rising as centuries of debris accumulated. During the Middle Ages, the area was known as "Campo Vaccino" (Cow Field) and was used for grazing cattle. Systematic excavations beginning in the 18th and 19th centuries revealed the Forum\'s magnificent past, uncovering temples, arches, and basilicas that had been buried for centuries. Today, walking through the Roman Forum is like stepping back in time, where every column, arch, and stone tells a story of ancient Rome\'s glory, power, and eventual decline.',
        historicalInfo: 'The Roman Forum was the center of day-to-day life in Rome: the site of triumphal processions and elections, the venue for public speeches, criminal trials, and gladiatorial matches, and the nucleus of commercial affairs.',
        yearBuilt: '7th century BC',
        architect: 'Various Roman architects over centuries'
      },
      it: {
        name: 'Foro Romano',
        narration: 'Ti trovi al Foro Romano, il cuore dell\'antica Roma. Questo era il centro della vita politica durante l\'era della Repubblica, dove gli edifici storici sono ancora in piedi.',
        description: 'Il centro della vita pubblica dell\'antica Roma',
        historicalInfo: 'Il Foro Romano era il centro della vita quotidiana a Roma: sede di processioni trionfali ed elezioni, luogo di discorsi pubblici, processi penali e combattimenti tra gladiatori, e nucleo del commercio.',
        yearBuilt: 'VII secolo a.C.',
        architect: 'Vari architetti romani nel corso dei secoli'
      },
      ko: {
        name: '로마 포럼',
        narration: '고대 로마의 심장부인 로마 포럼에 오셨습니다. 이곳은 공화정 시대 정치 생활의 중심지였으며, 역사적인 건물들이 여전히 서 있습니다.',
        description: '고대 로마 공공 생활의 중심지',
        detailedDescription: '라틴어로 포룸 로마눔(Forum Romanum)으로 알려진 로마 포럼은 고대 로마의 심장부를 대표하며 세계에서 가장 중요한 고고학 유적지 중 하나입니다. 천 년 이상 동안 이 직사각형 광장은 로마 공공 생활의 중심지 역할을 하며 로마 공화정과 제국의 흥망성쇠를 목격했습니다. 원래 팔라티노 언덕과 카피톨리노 언덕 사이의 늪지대 묘지였던 이 지역은 기원전 7세기에 배수되어 로마의 중앙 시장과 집회 장소로 변모했습니다. 로마가 권력과 명성을 얻으면서 포럼은 단순한 시장에서 로마 문명의 건축적, 정치적 성취를 보여주는 신전, 바실리카, 정부 건물의 웅장한 복합 단지로 발전했습니다. 포럼은 군사 승리를 축하하는 개선 행렬의 장소였으며, 승리한 장군들이 전리품과 포로들을 이끌고 비아 사크라(성스러운 길)를 행진했습니다. 시민들이 공화정의 미래를 논의하는 정치 집회, 정의를 결정하는 형사 재판, 여론을 좌우하는 공개 연설, 로마 경제를 이끈 상업 활동이 이곳에서 열렸습니다. 가장 중요한 건축물 중에는 로마의 가장 강력한 정치 기구가 입법과 정책을 논의하기 위해 모인 원로원 건물인 쿠리아 율리아가 있었습니다. 포럼에서 가장 오래되고 존경받는 건물 중 하나인 사투르누스 신전은 국고를 보관했으며 연례 사투르날리아 축제의 장소였습니다. 셉티미우스 세베루스 개선문은 동방에서의 군사 승리를 기념했으며, 서기 608년에 세워진 포카스 기둥은 포럼에 추가된 마지막 기념물 중 하나를 나타냅니다. 율리아 바실리카와 아이밀리아 바실리카는 법정과 상업 중심지로 사용되었으며, 변호사, 상인, 시민들로 붐비는 광대한 내부 공간을 자랑했습니다. 베스타 신전은 베스타 처녀들이 관리하는 신성한 불꽃의 집으로 로마 자체의 영원한 본질을 상징했습니다. 서로마 제국의 몰락 후 포럼은 점차 황폐해졌으며, 기념물들은 건축 자재로 약탈당했고 수세기에 걸친 잔해가 쌓이면서 지면이 상승했습니다. 중세 시대에 이 지역은 "캄포 바치노"(소 밭)로 알려졌으며 소를 방목하는 데 사용되었습니다. 18세기와 19세기에 시작된 체계적인 발굴은 포럼의 웅장한 과거를 드러냈으며, 수세기 동안 묻혀 있던 신전, 아치, 바실리카를 발견했습니다. 오늘날 로마 포럼을 걷는 것은 시간을 거슬러 올라가는 것과 같으며, 모든 기둥, 아치, 돌이 고대 로마의 영광, 권력, 그리고 결국의 쇠퇴에 대한 이야기를 전합니다.',
        historicalInfo: '로마 포럼은 로마의 일상생활의 중심지였습니다: 개선 행렬과 선거가 열렸고, 공개 연설, 형사 재판, 검투사 경기가 열렸으며, 상업 활동의 핵심이었습니다.',
        yearBuilt: '기원전 7세기',
        architect: '여러 세기에 걸친 다양한 로마 건축가들'
      },
      es: {
        name: 'Foro Romano',
        narration: 'Está en el Foro Romano, el corazón de la antigua Roma. Este fue el centro de la vida política durante la era de la República, donde aún se mantienen edificios históricos.',
        description: 'El centro de la vida pública de la antigua Roma',
        historicalInfo: 'El Foro Romano fue el centro de la vida cotidiana en Roma: el lugar de procesiones triunfales y elecciones, el escenario de discursos públicos, juicios penales y combates de gladiadores, y el núcleo de los asuntos comerciales.',
        yearBuilt: 'Siglo VII a.C.',
        architect: 'Varios arquitectos romanos a lo largo de los siglos'
      },
      fr: {
        name: 'Forum Romain',
        narration: 'Vous êtes au Forum Romain, le cœur de la Rome antique. C\'était le centre de la vie politique pendant l\'ère de la République, où se dressent encore des bâtiments historiques.',
        description: 'Le centre de la vie publique de la Rome antique',
        historicalInfo: 'Le Forum Romain était le centre de la vie quotidienne à Rome : lieu de processions triomphales et d\'élections, cadre de discours publics, de procès criminels et de combats de gladiateurs, et noyau des affaires commerciales.',
        yearBuilt: 'VIIe siècle av. J.-C.',
        architect: 'Divers architectes romains au fil des siècles'
      },
      de: {
        name: 'Forum Romanum',
        narration: 'Sie befinden sich am Forum Romanum, dem Herzen des antiken Roms. Dies war das Zentrum des politischen Lebens während der Republik, wo historische Gebäude noch stehen.',
        description: 'Das Zentrum des öffentlichen Lebens im antiken Rom',
        historicalInfo: 'Das Forum Romanum war das Zentrum des täglichen Lebens in Rom: Schauplatz von Triumphzügen und Wahlen, Austragungsort öffentlicher Reden, Gerichtsverhandlungen und Gladiatorenkämpfe sowie Mittelpunkt des Handels.',
        yearBuilt: '7. Jahrhundert v. Chr.',
        architect: 'Verschiedene römische Architekten über Jahrhunderte'
      },
      zh: {
        name: '古罗马广场',
        narration: '您在古罗马广场，古罗马的心脏。这里是共和国时代政治生活的中心，历史建筑仍然屹立。',
        description: '古罗马公共生活的中心',
        detailedDescription: '古罗马广场，拉丁语称为Forum Romanum，代表着古罗马的跳动心脏，是世界上最重要的考古遗址之一。一千多年来，这个长方形广场一直是罗马公共生活的中心，见证了罗马共和国和帝国的兴衰。这片区域最初是帕拉蒂尼山和卡比托利欧山之间的沼泽墓地，在公元前7世纪被排干并改造为罗马的中央市场和集会场所。随着罗马权力和威望的增长，广场从一个简单的市场演变为宏伟的神庙、巴西利卡和政府建筑群，展示了罗马文明的建筑和政治成就。广场是庆祝军事胜利的凯旋游行场所，胜利的将军们带着战利品和俘虏沿着圣道(Via Sacra)游行。这里举行公民辩论共和国未来的政治集会、裁定正义的刑事审判、影响民意的公开演讲，以及推动罗马经济的商业活动。最重要的建筑包括库里亚·朱利亚，即元老院大厦，罗马最强大的政治机构在此会面讨论立法和政策。土星神庙是广场上最古老、最受尊敬的建筑之一，存放着国库，也是每年农神节的举办地。塞普蒂米乌斯·塞维鲁凯旋门纪念东方的军事胜利，而建于公元608年的福卡斯柱代表了添加到广场的最后一批纪念碑之一。朱利亚巴西利卡和埃米利亚巴西利卡作为法庭和商业中心，宽敞的内部空间挤满了律师、商人和办理业务的市民。维斯塔神庙是贞女守护的圣火之家，象征着罗马本身的永恒本质。西罗马帝国灭亡后，广场逐渐荒废，纪念碑被拆除作为建筑材料，数世纪的碎片堆积使地面水平上升。中世纪时期，这片区域被称为"坎波瓦奇诺"(牛场)，用于放牧牛群。始于18和19世纪的系统发掘揭示了广场的辉煌过去，发现了埋藏数世纪的神庙、拱门和巴西利卡。今天，漫步古罗马广场就像穿越时光，每一根柱子、每一座拱门、每一块石头都在讲述古罗马的荣耀、权力以及最终衰落的故事。',
        historicalInfo: '古罗马广场是罗马日常生活的中心：凯旋游行和选举的场所，公开演讲、刑事审判和角斗比赛的场地，以及商业事务的核心。',
        yearBuilt: '公元前7世纪',
        architect: '历代众多罗马建筑师'
      },
      ja: {
        name: 'フォロ・ロマーノ',
        narration: '古代ローマの中心、フォロ・ロマーノにいます。ここは共和政時代の政治生活の中心地で、歴史的建造物が今も立っています。',
        description: '古代ローマの公共生活の中心',
        detailedDescription: 'ラテン語でフォルム・ロマヌム(Forum Romanum)として知られるフォロ・ロマーノは、古代ローマの鼓動する心臓部を表し、世界で最も重要な考古学的遺跡の一つです。千年以上にわたり、この長方形の広場はローマの公共生活の中心として機能し、ローマ共和政と帝国の興亡を目撃しました。元々はパラティーノの丘とカピトリーノの丘の間の湿地帯の墓地でしたが、紀元前7世紀に排水され、ローマの中央市場と集会場に変貌しました。ローマが権力と威信を増すにつれ、フォロは単純な市場から、ローマ文明の建築的・政治的業績を示す神殿、バシリカ、政府建物の壮大な複合施設へと進化しました。フォロは軍事的勝利を祝う凱旋行進の場所であり、勝利した将軍たちが戦利品と捕虜を引き連れてヴィア・サクラ(聖なる道)を行進しました。共和政の未来を議論する市民の政治集会、正義を決定する刑事裁判、世論を動かす公開演説、ローマ経済を推進する商業活動が開催されました。最も重要な建造物の中には、ローマの最も強力な政治組織が立法と政策を議論するために集まった元老院議事堂であるクリア・ユリアがありました。フォロ最古で最も崇敬される建物の一つであるサトゥルヌス神殿は国庫を収容し、年次サトゥルナリア祭の会場でした。セプティミウス・セウェルスの凱旋門は東方での軍事的勝利を記念し、紀元608年に建てられたフォカスの柱はフォロに追加された最後の記念碑の一つを表しています。バシリカ・ユリアとバシリカ・アエミリアは法廷と商業センターとして機能し、その広大な内部は弁護士、商人、業務を行う市民で賑わっていました。ウェスタ神殿はウェスタの処女たちが守る聖なる炎の家であり、ローマ自体の永遠の本質を象徴していました。西ローマ帝国の崩壊後、フォロは徐々に荒廃し、記念碑は建築材料として剥ぎ取られ、何世紀もの瓦礫が蓄積して地面レベルが上昇しました。中世には、この地域は「カンポ・ヴァッキーノ」(牛の野原)として知られ、牛の放牧に使用されていました。18世紀と19世紀に始まった体系的な発掘により、フォロの壮大な過去が明らかになり、何世紀も埋もれていた神殿、アーチ、バシリカが発見されました。今日、フォロ・ロマーノを歩くことは時間を遡るようなもので、すべての柱、アーチ、石が古代ローマの栄光、権力、そして最終的な衰退の物語を語っています。',
        historicalInfo: 'フォロ・ロマーノはローマの日常生活の中心でした：凱旋行進や選挙の場所、公開演説、刑事裁判、剣闘士試合の会場、そして商業活動の中核でした。',
        yearBuilt: '紀元前7世紀',
        architect: '数世紀にわたる様々なローマの建築家たち'
      },
      pt: {
        name: 'Fórum Romano',
        narration: 'Você está no Fórum Romano, o coração da Roma antiga. Este foi o centro da vida política durante a era da República, onde edifícios históricos ainda permanecem.',
        description: 'O centro da vida pública da Roma antiga',
        historicalInfo: 'O Fórum Romano foi o centro da vida cotidiana em Roma: local de procissões triunfais e eleições, palco de discursos públicos, julgamentos criminais e combates de gladiadores, e núcleo dos assuntos comerciais.',
        yearBuilt: 'Século VII a.C.',
        architect: 'Vários arquitetos romanos ao longo dos séculos'
      },
      ru: {
        name: 'Римский форум',
        narration: 'Вы находитесь на Римском форуме, в сердце древнего Рима. Это был центр политической жизни в эпоху Республики, где до сих пор стоят исторические здания.',
        description: 'Центр общественной жизни древнего Рима',
        historicalInfo: 'Римский форум был центром повседневной жизни в Риме: местом триумфальных шествий и выборов, площадкой для публичных выступлений, уголовных судов и гладиаторских боев, а также ядром коммерческой деятельности.',
        yearBuilt: 'VII век до н.э.',
        architect: 'Различные римские архитекторы на протяжении веков'
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
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
      'https://images.unsplash.com/photo-Pezl8-yY6OQ?w=800',
      'https://images.unsplash.com/photo-R4jHG3nsFy8?w=800',
      'https://images.unsplash.com/photo-PamFFHL6fVY?w=800',
      'https://images.unsplash.com/photo-R71bfM2BZiI?w=800',
      'https://images.unsplash.com/photo-LfvMS4zG1Do?w=800'
    ],
    historicalInfo: 'The Trevi Fountain is the largest Baroque fountain in the city and one of the most famous fountains in the world. Standing 26.3 metres (86 ft) high and 49.15 metres (161.3 ft) wide, it is the largest Baroque fountain in the city.',
    yearBuilt: '1732-1762',
    architect: 'Nicola Salvi',
    translations: {
      en: {
        name: 'Trevi Fountain',
        narration: 'This is the Trevi Fountain. Legend says if you throw a coin over your shoulder into the fountain, you will return to Rome.',
        description: 'The most famous fountain in Rome',
        detailedDescription: 'The Trevi Fountain, or Fontana di Trevi, stands as Rome\'s largest and most spectacular Baroque fountain, captivating millions of visitors each year with its grandeur, beauty, and legendary traditions. Measuring an impressive 26.3 meters (86 feet) high and 49.15 meters (161 feet) wide, this monumental masterpiece dominates the small Trevi square, creating a breathtaking spectacle of water, marble, and sculptural artistry. The fountain\'s history begins in ancient Rome, where it marked the terminal point of the Aqua Virgo aqueduct, one of the oldest water sources supplying the city. Legend tells of a young virgin who led thirsty Roman soldiers to this water source in 19 BC, giving the aqueduct its name. For centuries, a simple basin collected the aqueduct\'s waters until Pope Urban VIII commissioned Gian Lorenzo Bernini to create a more dramatic fountain in 1629. However, the project was abandoned when the Pope died, and it wasn\'t until 1732 that Pope Clement XII launched a competition to design a grand fountain worthy of the location. Nicola Salvi won the commission, and construction began in 1732, though Salvi would not live to see his masterpiece completed. The fountain was finally finished in 1762 by Giuseppe Pannini, thirty years after construction began. The fountain\'s design centers on a majestic depiction of Oceanus, the Titan god of the sea, riding a shell-shaped chariot pulled by two sea horses - one wild and one docile - representing the varying moods of the ocean. These magnificent creatures are guided by tritons, mythological sea gods depicted blowing conch shells. The central niche housing Oceanus is flanked by two allegorical figures: Abundance on the left, holding a horn of plenty, and Health on the right, holding a cup being drunk by a snake, symbolizing well-being and prosperity. Above these niches, relief sculptures depict the discovery of the spring by the virgin and Agrippa approving the aqueduct\'s construction. The fountain\'s elaborate facade rises from the Palazzo Poli behind it, creating a theatrical backdrop of Corinthian columns, ornate carvings, and flowing drapery sculpted in travertine stone. Water cascades dramatically over artificial rocks into the large basin below, creating a symphony of sound that echoes through the surrounding buildings. The fountain pumps approximately 2,824,800 cubic feet of water through its system daily, a testament to the ancient Roman engineering that still supplies it from the Aqua Virgo aqueduct. Perhaps the most famous tradition associated with the Trevi Fountain is the coin-tossing ritual. Legend holds that visitors who throw a coin over their left shoulder using their right hand will ensure their return to Rome. Throwing two coins will bring romance with a Roman, while three coins promise marriage. This tradition generates an estimated 3,000 euros worth of coins daily, all of which are collected and donated to charity, supporting various social programs in Rome. The fountain has captured imaginations worldwide through its appearances in cinema, most notably in Federico Fellini\'s "La Dolce Vita" (1960), where Anita Ekberg\'s iconic wade through its waters created one of film history\'s most memorable scenes. This moment cemented the fountain\'s status as a symbol of romance and Italian glamour. Throughout its history, the fountain has undergone several restorations to preserve its beauty and structural integrity. The most recent comprehensive restoration, funded by the Italian fashion house Fendi and completed in 2015, cleaned and repaired the monument, restoring its brilliant white travertine to its original splendor. Today, the Trevi Fountain remains one of Rome\'s most beloved landmarks and the world\'s most visited fountain. Visitors are no longer permitted to wade in its waters, as fines were instituted to protect the monument, but this has not diminished its appeal. The fountain continues to enchant with its baroque magnificence, the perpetual sound of flowing water, and the timeless hope embodied in each coin tossed into its sparkling basin.',
        historicalInfo: 'The Trevi Fountain is the largest Baroque fountain in the city and one of the most famous fountains in the world. Standing 26.3 metres (86 ft) high and 49.15 metres (161.3 ft) wide, it is the largest Baroque fountain in the city.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      it: {
        name: 'Fontana di Trevi',
        narration: 'Questa è la Fontana di Trevi. La leggenda dice che se getti una moneta oltre la spalla nella fontana, tornerai a Roma.',
        description: 'La fontana più famosa di Roma',
        historicalInfo: 'La Fontana di Trevi è la più grande fontana barocca della città e una delle fontane più famose del mondo. Alta 26,3 metri e larga 49,15 metri, è la fontana barocca più grande della città.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      ko: {
        name: '트레비 분수',
        narration: '이곳은 트레비 분수입니다. 전설에 따르면 분수에 어깨 너머로 동전을 던지면 로마로 다시 돌아온다고 합니다.',
        description: '로마에서 가장 유명한 분수',
        detailedDescription: '트레비 분수, 또는 폰타나 디 트레비는 로마에서 가장 크고 장엄한 바로크 양식의 분수로, 매년 수백만 명의 방문객을 그 웅장함, 아름다움, 전설적인 전통으로 매료시킵니다. 높이 26.3미터(86피트), 너비 49.15미터(161피트)의 인상적인 크기를 자랑하는 이 기념비적 걸작은 작은 트레비 광장을 지배하며 물, 대리석, 조각 예술의 숨막히는 광경을 연출합니다. 분수의 역사는 고대 로마로 거슬러 올라가며, 도시에 물을 공급하는 가장 오래된 수원 중 하나인 아쿠아 비르고 수로의 종점을 표시했습니다. 전설에 따르면 기원전 19년 목마른 로마 군인들을 이 수원으로 안내한 어린 처녀에서 수로의 이름이 유래했다고 합니다. 수세기 동안 단순한 물받이가 수로의 물을 모았지만, 1629년 교황 우르바노 8세가 지안 로렌조 베르니니에게 더 극적인 분수를 만들도록 의뢰했습니다. 그러나 교황이 사망하면서 프로젝트는 중단되었고, 1732년이 되어서야 교황 클레멘스 12세가 그 장소에 걸맞은 웅장한 분수를 설계하는 경쟁을 시작했습니다. 니콜라 살비가 위임을 받아 1732년 건설이 시작되었지만, 살비는 자신의 걸작이 완성되는 것을 보지 못했습니다. 분수는 마침내 1762년 주세페 파니니에 의해 건설 시작 30년 후에 완성되었습니다. 분수의 디자인은 바다의 티탄 신 오케아누스가 두 마리의 해마 - 한 마리는 거칠고 한 마리는 온순한 - 가 끄는 조개껍질 모양의 전차를 타는 장엄한 묘사를 중심으로 합니다. 이는 바다의 다양한 기분을 나타냅니다. 이 웅장한 생물들은 소라 껍질을 부는 모습으로 묘사된 신화 속 바다의 신 트리톤들에 의해 인도됩니다. 오케아누스를 수용하는 중앙 벽감은 두 개의 우화적 인물로 둘러싸여 있습니다: 왼쪽의 풍요의 뿔을 들고 있는 풍요와 오른쪽의 뱀이 마시는 컵을 들고 있는 건강으로, 웰빙과 번영을 상징합니다. 이 벽감 위의 부조 조각은 처녀가 샘을 발견하는 모습과 아그리파가 수로 건설을 승인하는 모습을 묘사합니다. 분수 뒤의 건물 외관은 궁전 정면으로 설계되어 분수가 자연스러운 건축 환경의 일부인 것처럼 보이게 합니다. 가장 유명한 전통은 분수에 동전을 던지는 것입니다: 한 개는 로마로의 귀환을 보장하고, 두 개는 새로운 로맨스로 이어지며, 세 개는 결혼으로 이어진다고 합니다. 매년 약 140만 유로의 동전이 분수에 던져지며, 이는 모두 수집되어 로마의 빈곤층을 돕는 자선 단체에 기부됩니다. 트레비 분수는 많은 영화에 등장했으며, 가장 유명한 것은 아니타 에크베리와 마르첼로 마스트로얀니가 주연한 페데리코 펠리니의 "라 돌체 비타"입니다. 오늘날 하루 평균 12,000명의 방문객이 이 상징적인 분수를 방문하여 사진을 찍고, 동전을 던지고, 로마에서 가장 아름다운 바로크 예술 작품 중 하나를 감상합니다.',
        historicalInfo: '트레비 분수는 도시에서 가장 큰 바로크 양식의 분수이자 세계에서 가장 유명한 분수 중 하나입니다. 높이 26.3미터, 너비 49.15미터로 도시에서 가장 큰 바로크 분수입니다.',
        yearBuilt: '1732-1762년',
        architect: '니콜라 살비'
      },
      es: {
        name: 'Fontana de Trevi',
        narration: 'Esta es la Fontana de Trevi. La leyenda dice que si lanzas una moneda por encima del hombro a la fuente, volverás a Roma.',
        description: 'La fuente más famosa de Roma',
        historicalInfo: 'La Fontana de Trevi es la fuente barroca más grande de la ciudad y una de las fuentes más famosas del mundo. Con 26,3 metros de altura y 49,15 metros de ancho, es la fuente barroca más grande de la ciudad.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      fr: {
        name: 'Fontaine de Trevi',
        narration: 'Voici la Fontaine de Trevi. La légende dit que si vous jetez une pièce par-dessus votre épaule dans la fontaine, vous reviendrez à Rome.',
        description: 'La fontaine la plus célèbre de Rome',
        historicalInfo: 'La Fontaine de Trevi est la plus grande fontaine baroque de la ville et l\'une des fontaines les plus célèbres du monde. Mesurant 26,3 mètres de haut et 49,15 mètres de large, c\'est la plus grande fontaine baroque de la ville.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      de: {
        name: 'Trevi-Brunnen',
        narration: 'Dies ist der Trevi-Brunnen. Die Legende besagt, dass Sie nach Rom zurückkehren werden, wenn Sie eine Münze über Ihre Schulter in den Brunnen werfen.',
        description: 'Der berühmteste Brunnen Roms',
        historicalInfo: 'Der Trevi-Brunnen ist der größte Barockbrunnen der Stadt und einer der berühmtesten Brunnen der Welt. Mit 26,3 Metern Höhe und 49,15 Metern Breite ist er der größte Barockbrunnen der Stadt.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      zh: {
        name: '特莱维喷泉',
        narration: '这是特莱维喷泉。传说如果你把硬币从肩膀上扔进喷泉，你会重返罗马。',
        description: '罗马最著名的喷泉',
        detailedDescription: '特莱维喷泉，或称为许愿池(Fontana di Trevi)，是罗马最大、最壮观的巴洛克喷泉，每年以其宏伟、美丽和传奇传统吸引数百万游客。这座纪念碑式的杰作高26.3米(86英尺)，宽49.15米(161英尺)，令人印象深刻，主导着小小的特莱维广场，创造出水、大理石和雕塑艺术的惊人景观。喷泉的历史始于古罗马，它标志着为城市供水的最古老水源之一——处女水道(Aqua Virgo)的终点。传说公元前19年，一位年轻处女将口渴的罗马士兵带到这个水源，水道因此得名。几个世纪以来，一个简单的水盆收集着水道的水，直到1629年教皇乌尔班八世委托济安·洛伦佐·贝尼尼创作一座更具戏剧性的喷泉。然而，教皇去世后项目被搁置，直到1732年教皇克莱门特十二世才发起竞赛，设计一座与这个位置相称的宏伟喷泉。尼古拉·萨尔维赢得委托，1732年开始建设，尽管萨尔维未能看到自己的杰作完成。喷泉最终于1762年由朱塞佩·帕尼尼完成，距离开工已过去30年。喷泉的设计以海洋泰坦神俄刻阿诺斯的雄伟形象为中心，他乘坐贝壳形战车，由两匹海马拉着——一匹狂野，一匹温顺——代表海洋变化的情绪。这些壮丽的生物由特里同引导，这些神话中的海神被描绘为吹响海螺。容纳俄刻阿诺斯的中央壁龛两侧是两个寓言人物：左侧是手持丰饶之角的丰饶女神，右侧是手持杯子让蛇饮用的健康女神，象征着幸福和繁荣。这些壁龛上方的浮雕雕塑描绘了处女发现泉水和阿格里帕批准建造水道的场景。喷泉后面的建筑立面被设计成宫殿正面，使喷泉看起来像是自然建筑环境的一部分。最著名的传统是向喷泉投掷硬币：一枚确保重返罗马，两枚带来新恋情，三枚带来婚姻。每年约有140万欧元的硬币被投入喷泉，所有硬币都被收集并捐赠给帮助罗马贫困人口的慈善机构。特莱维喷泉在许多电影中出现，最著名的是费德里科·费里尼执导、安妮塔·艾克伯格和马塞洛·马斯楚安尼主演的《甜蜜的生活》。如今，平均每天有12,000名游客参观这座标志性喷泉，拍照留念、投掷硬币，欣赏罗马最美丽的巴洛克艺术作品之一。',
        historicalInfo: '特莱维喷泉是城市中最大的巴洛克喷泉，也是世界上最著名的喷泉之一。高26.3米，宽49.15米，是城市中最大的巴洛克喷泉。',
        yearBuilt: '1732-1762年',
        architect: '尼古拉·萨尔维'
      },
      ja: {
        name: 'トレビの泉',
        narration: 'これがトレビの泉です。伝説によれば、肩越しにコインを投げ入れるとローマに戻ってくることができます。',
        description: 'ローマで最も有名な噴水',
        detailedDescription: 'トレビの泉、またはフォンタナ・ディ・トレヴィは、ローマ最大かつ最も壮観なバロック様式の噴水として、その壮大さ、美しさ、そして伝説的な伝統で毎年数百万人の訪問者を魅了しています。高さ26.3メートル(86フィート)、幅49.15メートル(161フィート)という印象的なサイズのこの記念碑的傑作は、小さなトレビ広場を支配し、水、大理石、彫刻芸術の息をのむような光景を作り出しています。噴水の歴史は古代ローマに始まり、都市に水を供給する最も古い水源の一つであるアクア・ヴィルゴ水道の終点を示していました。伝説によると、紀元前19年に喉の渇いたローマ兵をこの水源に導いた若い処女から水道の名前が付けられたといいます。何世紀もの間、単純な水盤が水道の水を集めていましたが、1629年に教皇ウルバヌス8世がジャン・ロレンツォ・ベルニーニにより劇的な噴水の制作を依頼しました。しかし、教皇の死によりプロジェクトは放棄され、1732年になって教皇クレメンス12世がこの場所にふさわしい壮大な噴水を設計するコンペティションを開始しました。ニコラ・サルヴィが委託を獲得し、1732年に建設が始まりましたが、サルヴィは自身の傑作の完成を見ることはありませんでした。噴水は最終的に1762年、建設開始から30年後にジュゼッペ・パニーニによって完成しました。噴水のデザインは、海のティタン神オケアノスが2頭の海馬 - 1頭は荒々しく1頭は従順 - に引かれた貝殻形の戦車に乗る壮大な描写を中心としており、海の様々な気分を表しています。これらの壮大な生き物は、法螺貝を吹く姿で描かれた神話上の海の神トリトンたちに導かれています。オケアノスを収容する中央のニッチは2つの寓意的な人物に挟まれています：左側の豊穣の角を持つ豊饒と、右側の蛇が飲む杯を持つ健康で、幸福と繁栄を象徴しています。これらのニッチの上の浮き彫り彫刻は、処女による泉の発見とアグリッパによる水道建設の承認を描いています。噴水の後ろの建物のファサードは宮殿の正面として設計されており、噴水が自然な建築環境の一部であるかのように見えます。最も有名な伝統は噴水にコインを投げることです：1枚はローマへの帰還を保証し、2枚は新しいロマンスにつながり、3枚は結婚につながるとされています。毎年約140万ユーロのコインが噴水に投げられ、すべて回収されローマの貧しい人々を支援する慈善団体に寄付されます。トレビの泉は多くの映画に登場しており、最も有名なのはアニタ・エクバーグとマルチェロ・マストロヤンニが主演したフェデリコ・フェリーニの「甘い生活」です。今日、1日平均12,000人の訪問者がこの象徴的な噴水を訪れ、写真を撮り、コインを投げ、ローマで最も美しいバロック芸術作品の一つを鑑賞しています。',
        historicalInfo: 'トレビの泉は市内最大のバロック様式の噴水であり、世界で最も有名な噴水の一つです。高さ26.3メートル、幅49.15メートルで、市内最大のバロック様式の噴水です。',
        yearBuilt: '1732-1762年',
        architect: 'ニコラ・サルヴィ'
      },
      pt: {
        name: 'Fontana di Trevi',
        narration: 'Esta é a Fontana di Trevi. A lenda diz que se você jogar uma moeda por cima do ombro na fonte, você retornará a Roma.',
        description: 'A fonte mais famosa de Roma',
        historicalInfo: 'A Fontana di Trevi é a maior fonte barroca da cidade e uma das fontes mais famosas do mundo. Com 26,3 metros de altura e 49,15 metros de largura, é a maior fonte barroca da cidade.',
        yearBuilt: '1732-1762',
        architect: 'Nicola Salvi'
      },
      ru: {
        name: 'Фонтан Треви',
        narration: 'Это фонтан Треви. Легенда гласит, что если бросить монету через плечо в фонтан, вы вернетесь в Рим.',
        description: 'Самый знаменитый фонтан Рима',
        historicalInfo: 'Фонтан Треви — самый большой фонтан в стиле барокко в городе и один из самых известных фонтанов в мире. Высотой 26,3 метра и шириной 49,15 метра, это самый большой фонтан в стиле барокко в городе.',
        yearBuilt: '1732-1762 гг.',
        architect: 'Никола Сальви'
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
      'https://images.unsplash.com/photo-1604924413347-a8c0e20e6635?w=800',
      'https://images.unsplash.com/photo-WW-5ix8Axz4?w=800',
      'https://images.unsplash.com/photo-IpmFVXls4sE?w=800',
      'https://images.unsplash.com/photo-gmzBR1iREcs?w=800',
      'https://images.unsplash.com/photo-iSTkOZVyTiE?w=800',
      'https://images.unsplash.com/photo-0n0WXk1vEOo?w=800'
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
        description: 'Una meraviglia architettonica con la più grande cupola in calcestruzzo non armato del mondo',
        historicalInfo: 'Il Pantheon è un antico tempio romano e, dal 609 d.C., una chiesa cattolica. È il meglio conservato di tutti gli edifici dell\'antica Roma ed è stato in uso continuo per tutta la sua storia.',
        yearBuilt: '126 d.C.',
        architect: 'Imperatore Adriano'
      },
      ko: {
        name: '판테온',
        narration: '판테온은 모든 신들에게 헌정된 신전입니다. 웅장한 돔이 있는 고대 건축의 걸작입니다.',
        description: '세계에서 가장 큰 무근 콘크리트 돔을 가진 건축의 경이',
        detailedDescription: '판테온은 고대 로마에서 가장 잘 보존된 기념물 중 하나이며 건축사에서 가장 영향력 있는 건물 중 하나입니다. 그리스어 "pan"(모든)과 "theos"(신)에서 유래한 이름으로 "모든 신들의 신전"을 의미하며, 건설된 지 거의 2천 년이 지난 지금도 건축가와 방문객들에게 영감을 주고 있습니다. 오늘날 우리가 보는 건물은 서기 126년경 하드리아누스 황제가 의뢰했지만, 서기 27년 마르쿠스 아그리파가 지은 이전 신전을 대체한 것으로 그의 이름은 여전히 현관의 비문에 남아있습니다. 판테온을 진정으로 특별하게 만드는 것은 거대한 돔으로, 거의 2,000년이 지난 지금도 세계에서 가장 큰 무근 콘크리트 돔으로 남아있습니다. 바닥에서 오큘루스까지 직경과 높이가 모두 43.3미터(142피트)로 측정되는 돔은 완벽한 반구를 만들어 로마 건축의 기하학적 조화 이상을 구현합니다. 건설에 사용된 콘크리트는 돔 높이에 따라 구성이 다양하며, 바닥의 트라버틴과 벽돌 같은 무거운 골재에서 정점의 경석 같은 가벼운 재료로 전환되어 구조적 무결성을 유지하면서 전체 무게를 줄입니다. 돔의 두께도 바닥의 6.4미터에서 오큘루스의 1.2미터로 감소하여 무게 분산을 더욱 최적화합니다. 판테온 내부의 가장 인상적인 특징은 돔 꼭대기의 직경 8.2미터(27피트)의 원형 개구부인 오큘루스입니다. 이 놀라운 건축 요소는 건물의 유일한 자연광원 역할을 하며, 하루 종일 내부를 가로질러 이동하는 극적인 햇빛 기둥을 만들어 다양한 건축적 특징을 비추고 빛과 그림자의 끊임없이 변화하는 상호작용을 만들어냅니다. 방문객들은 비가 오는 날에도 오큘루스를 통해 비가 들어오는 것을 볼 수 있으며, 바닥의 배수 시스템이 물을 효과적으로 처리합니다. 방문 팁: 아침 일찍 방문하면 군중을 피하고 오큘루스를 통해 들어오는 아름다운 아침 햇살을 즐길 수 있으며, 입장료는 무료이지만 오디오 가이드는 유료입니다.',
        historicalInfo: '판테온은 고대 로마 신전이었으며 서기 609년부터 가톨릭 교회로 사용되고 있습니다. 고대 로마 건축물 중 가장 잘 보존되어 있으며 역사 전체에 걸쳐 지속적으로 사용되어 왔습니다.',
        yearBuilt: '서기 126년',
        architect: '하드리아누스 황제'
      },
      es: {
        name: 'Panteón',
        narration: 'El Panteón es un templo dedicado a todos los dioses. Es una obra maestra de la arquitectura antigua con su magnífica cúpula.',
        description: 'Una maravilla arquitectónica con la cúpula de hormigón sin refuerzo más grande del mundo',
        historicalInfo: 'El Panteón es un antiguo templo romano y, desde el 609 d.C., una iglesia católica. Es el mejor conservado de todos los edificios de la Antigua Roma y ha estado en uso continuo a lo largo de su historia.',
        yearBuilt: '126 d.C.',
        architect: 'Emperador Adriano'
      },
      fr: {
        name: 'Panthéon',
        narration: 'Le Panthéon est un temple dédié à tous les dieux. C\'est un chef-d\'œuvre de l\'architecture antique avec son magnifique dôme.',
        description: 'Une merveille architecturale avec la plus grande coupole en béton non armé du monde',
        historicalInfo: 'Le Panthéon est un ancien temple romain et, depuis 609 apr. J.-C., une église catholique. C\'est le mieux conservé de tous les bâtiments de la Rome antique et a été en usage continu tout au long de son histoire.',
        yearBuilt: '126 apr. J.-C.',
        architect: 'Empereur Hadrien'
      },
      de: {
        name: 'Pantheon',
        narration: 'Das Pantheon ist ein Tempel, der allen Göttern gewidmet ist. Es ist ein Meisterwerk antiker Architektur mit seiner prächtigen Kuppel.',
        description: 'Ein architektonisches Wunderwerk mit der größten unbewehrten Betonkuppel der Welt',
        historicalInfo: 'Das Pantheon ist ein ehemaliger römischer Tempel und seit 609 n. Chr. eine katholische Kirche. Es ist das am besten erhaltene aller antiken römischen Gebäude und wird seit seiner Geschichte durchgehend genutzt.',
        yearBuilt: '126 n. Chr.',
        architect: 'Kaiser Hadrian'
      },
      zh: {
        name: '万神殿',
        narration: '万神殿是一座献给所有神灵的神殿。它是古代建筑的杰作，拥有宏伟的圆顶。',
        description: '拥有世界上最大的无钢筋混凝土圆顶的建筑奇迹',
        detailedDescription: '万神殿是古罗马保存最完好的纪念碑之一，也是建筑史上最具影响力的建筑之一。这座非凡的建筑名称源自希腊语"pan"（所有）和"theos"（神），意为"所有神的神殿"，在建成近两千年后仍继续启发着建筑师和游客。我们今天看到的建筑是由哈德良皇帝在公元126年左右委托建造的，尽管它取代了公元前27年由马库斯·阿格里帕建造的早期神殿，他的名字仍然出现在门廊的铭文上。万神殿真正非凡之处在于其巨大的圆顶，即使在近2000年后，它仍然是世界上最大的无钢筋混凝土圆顶。圆顶从地板到顶部圆孔的直径和高度都是43.3米（142英尺），形成一个完美的半球体，体现了罗马建筑几何和谐的理想。建筑中使用的混凝土在整个圆顶高度上成分各不相同，从底部的石灰华和砖等较重的骨料过渡到顶部的浮石等较轻的材料，在保持结构完整性的同时减少整体重量。圆顶的厚度也从底部的6.4米减少到圆孔处的仅1.2米，进一步优化其重量分配。万神殿内部最引人注目的特征是圆孔，这是圆顶顶部直径8.2米（27英尺）的圆形开口。这个非凡的建筑元素是建筑唯一的自然光源，创造出戏剧性的阳光束，在一天中穿过内部移动，照亮不同的建筑特征，创造出不断变化的光影交织。圆孔向外开放，游客可以看到雨水进入，但地板的排水系统有效地处理了水。游览提示：清晨参观可以避开人群，欣赏透过圆孔进入的美丽晨光，入场免费但语音导览需付费。',
        historicalInfo: '万神殿是一座古罗马神殿，自公元609年起成为天主教堂。它是所有古罗马建筑中保存最完好的，并且在整个历史中一直被使用。',
        yearBuilt: '公元126年',
        architect: '哈德良皇帝'
      },
      ja: {
        name: 'パンテオン',
        narration: 'パンテオンは全ての神々に捧げられた神殿です。壮大なドームを持つ古代建築の傑作です。',
        description: '世界最大の無筋コンクリートドームを持つ建築の驚異',
        detailedDescription: 'パンテオンは古代ローマで最もよく保存された記念碑の一つであり、建築史上最も影響力のある建物の一つです。ギリシャ語の「pan」（すべて）と「theos」（神）に由来する名前は「すべての神々の神殿」を意味し、建設から約2千年を経た今も建築家や訪問者にインスピレーションを与え続けています。今日私たちが見る建物は紀元126年頃にハドリアヌス帝によって委託されましたが、紀元前27年にマルクス・アグリッパによって建てられた以前の神殿を置き換えたもので、彼の名前は今でもポルティコの碑文に残っています。パンテオンを真に特別なものにしているのは巨大なドームで、約2000年を経た今でも世界最大の無筋コンクリートドームです。床からオクルスまでの直径と高さがともに43.3メートル（142フィート）であるドームは完璧な半球を形成し、ローマ建築の幾何学的調和の理想を体現しています。建設に使用されたコンクリートはドームの高さ全体で組成が異なり、基部のトラバーチンやレンガなどの重い骨材から頂点の軽石などの軽い材料へと移行し、構造の完全性を維持しながら全体の重量を軽減しています。ドームの厚さも基部の6.4メートルからオクルスのわずか1.2メートルまで減少し、重量配分をさらに最適化しています。パンテオン内部の最も印象的な特徴はオクルス、ドーム頂点の直径8.2メートル（27フィート）の円形開口部です。この注目すべき建築要素は建物唯一の自然光源として機能し、一日を通して内部を横切って移動する劇的な太陽光の柱を作り出し、さまざまな建築的特徴を照らし、光と影の絶え間なく変化する相互作用を生み出します。オクルスは外部に開放されており、訪問者は雨が入るのを見ることができますが、床の排水システムが効果的に水を処理します。訪問のヒント：早朝に訪れると混雑を避け、オクルスから入る美しい朝日を楽しむことができ、入場は無料ですがオーディオガイドは有料です。',
        historicalInfo: 'パンテオンはかつてローマの神殿で、609年からはカトリック教会として使用されています。古代ローマ建築の中で最もよく保存されており、その歴史を通じて継続的に使用されてきました。',
        yearBuilt: '紀元126年',
        architect: 'ハドリアヌス帝'
      },
      pt: {
        name: 'Panteão',
        narration: 'O Panteão é um templo dedicado a todos os deuses. É uma obra-prima da arquitetura antiga com sua magnífica cúpula.',
        description: 'Uma maravilha arquitetônica com a maior cúpula de concreto não reforçado do mundo',
        historicalInfo: 'O Panteão é um antigo templo romano e, desde 609 d.C., uma igreja católica. É o mais bem preservado de todos os edifícios da Roma Antiga e está em uso contínuo ao longo de sua história.',
        yearBuilt: '126 d.C.',
        architect: 'Imperador Adriano'
      },
      ru: {
        name: 'Пантеон',
        narration: 'Пантеон — это храм, посвященный всем богам. Это шедевр древней архитектуры с великолепным куполом.',
        description: 'Архитектурное чудо с самым большим неармированным бетонным куполом в мире',
        historicalInfo: 'Пантеон — бывший римский храм, с 609 года нашей эры — католическая церковь. Это наиболее хорошо сохранившееся из всех зданий Древнего Рима, которое непрерывно используется на протяжении всей своей истории.',
        yearBuilt: '126 г. н.э.',
        architect: 'Император Адриан'
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
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800',
      'https://images.unsplash.com/photo-1636804907035-8ae6360f1d4f?w=800',
      'https://images.unsplash.com/photo-1647954486042-0c9b209a2144?w=800',
      'https://images.unsplash.com/photo-1534016493773-9cdaf3eb86c0?w=800',
      'https://images.unsplash.com/photo-1689475132729-ae3341bd9dda?w=800',
      'https://images.unsplash.com/photo-1656948727580-fe50a45f1cfc?w=800',
      'https://images.unsplash.com/photo-1671202201061-619452413d49?w=800',
      'https://images.unsplash.com/photo-1589223733007-4226ca3a7da6?w=800'
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
        description: 'Una monumentale scalinata di 135 gradini',
        historicalInfo: 'La Scalinata di Trinità dei Monti è una serie di scalini a Roma, che sale un ripido pendio tra Piazza di Spagna alla base e Piazza Trinità dei Monti, dominata dalla chiesa della Trinità dei Monti in cima.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis e Alessandro Specchi'
      },
      ko: {
        name: '스페인 계단',
        narration: '영화 "로마의 휴일"의 촬영 장소로 유명한 스페인 계단에 오신 것을 환영합니다.',
        description: '135개의 계단으로 이루어진 기념비적인 계단',
        detailedDescription: '이탈리아어로 "Scalinata di Trinità dei Monti"로 알려진 스페인 계단은 로마에서 가장 사랑받고 사진이 많이 찍히는 랜드마크 중 하나로, 아래의 스페인 광장과 위의 트리니타 데이 몬티 교회 및 핀치아노 언덕을 우아하게 연결합니다. 12개의 계단층으로 나뉜 135개의 계단으로 구성된 이 기념비적인 바로크 계단은 3세기 동안 방문객들을 매료시킨 트라버틴 석재의 극적인 폭포를 만들어냅니다. 계단은 기단부의 스페인 광장에서 영어 이름을 따왔으며, 이 광장은 17세기부터 광장에 위치한 교황청 주재 스페인 대사관의 이름을 따서 명명되었습니다. 그러나 계단은 실제로 프랑스 외교에 의해 자금이 지원되어 오늘날까지 지속되는 재미있는 국제적 혼란을 만들어냈습니다. 스페인 계단의 역사는 17세기 초 스페인 광장과 위의 교회 사이의 가파른 경사면이 이동하기 어려웠던 때부터 시작됩니다. 수십 년에 걸쳐 이 두 중요한 장소를 연결하기에 적합한 웅장한 계단을 만들기 위한 다양한 제안이 제출되었습니다. 프랑스 군주제를 찬양하려는 프랑스와 종교적 권위를 강조하려는 교황청 사이의 의견 차이로 프로젝트는 수년간 지연되었습니다. 마침내 프랑스 외교관 에티엔 게피에가 유언장에 계단 건설을 위한 상당한 금액을 남겼지만, 교황 클레멘스 11세가 프로젝트를 승인하기까지 1717년까지 걸렸습니다. 디자인 경쟁은 알레산드로 스페키의 초기 스케치에서 영감을 받은 우아한 제안을 한 프란체스코 데 산크티스가 승리했습니다. 건설은 1723년에 시작되어 1725년에 완료되었습니다. 방문 팁: 봄에는 계단이 진달래 꽃으로 장식되어 더욱 아름답고, 이른 아침이나 늦은 저녁에 방문하면 군중을 피할 수 있으며, 계단에 앉아 먹거나 마시는 것은 금지되어 있으니 주의하세요.',
        historicalInfo: '스페인 계단은 로마에 있는 계단으로, 아래의 스페인 광장과 위의 트리니타 데이 몬티 광장 사이의 가파른 경사면을 오르며, 꼭대기에는 트리니타 데이 몬티 교회가 자리잡고 있습니다.',
        yearBuilt: '1723-1726년',
        architect: '프란체스코 데 산크티스와 알레산드로 스페키'
      },
      es: {
        name: 'Escalinata de la Plaza de España',
        narration: 'Bienvenido a la Escalinata de la Plaza de España, famosa como lugar de rodaje de la película "Vacaciones en Roma".',
        description: 'Una monumental escalinata de 135 escalones',
        historicalInfo: 'La Escalinata de la Plaza de España es un conjunto de escalones en Roma que sube una empinada pendiente entre la Piazza di Spagna en la base y la Piazza Trinità dei Monti, dominada por la iglesia de Trinità dei Monti en la cima.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis y Alessandro Specchi'
      },
      fr: {
        name: 'Escalier de la Trinité-des-Monts',
        narration: 'Bienvenue à l\'Escalier de la Trinité-des-Monts, célèbre comme lieu de tournage du film "Vacances Romaines".',
        description: 'Un escalier monumental de 135 marches',
        historicalInfo: 'L\'Escalier de la Trinité-des-Monts est un ensemble de marches à Rome, gravissant une pente raide entre la Piazza di Spagna à la base et la Piazza Trinità dei Monti, dominée par l\'église de la Trinité-des-Monts au sommet.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis et Alessandro Specchi'
      },
      de: {
        name: 'Spanische Treppe',
        narration: 'Willkommen an der Spanischen Treppe, berühmt als Drehort des Films "Ein Herz und eine Krone".',
        description: 'Eine monumentale Treppe mit 135 Stufen',
        historicalInfo: 'Die Spanische Treppe ist eine Treppe in Rom, die einen steilen Hang zwischen der Piazza di Spagna am Fuß und der Piazza Trinità dei Monti erklimmt, die von der Kirche Trinità dei Monti an der Spitze dominiert wird.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis und Alessandro Specchi'
      },
      zh: {
        name: '西班牙台阶',
        narration: '欢迎来到西班牙台阶，以电影《罗马假日》的拍摄地而闻名。',
        description: '由135级台阶组成的纪念性阶梯',
        detailedDescription: '西班牙台阶在意大利语中被称为"Scalinata di Trinità dei Monti"，是罗马最受喜爱和拍摄最多的地标之一，优雅地连接着底部的西班牙广场与上方的山上圣三一教堂和平丘山。这座纪念性的巴洛克式楼梯由135级台阶组成，分为12段，形成了三个世纪以来一直吸引游客的壮观的石灰华石梯级联。台阶的英文名称来自其底部的西班牙广场，而广场则以17世纪以来位于广场的圣座西班牙大使馆命名。然而，台阶实际上是由法国外交资助的，造成了一个延续至今的有趣的国际混乱。西班牙台阶的历史始于17世纪初，当时西班牙广场和上方教堂之间的陡坡难以通行。几十年来，人们提出了各种建议，以建造一个值得连接这两个重要地点的宏伟楼梯。由于希望颂扬法国君主制的法国和寻求强调宗教权威的教廷之间的分歧，该项目搁置了多年。最终，法国外交官艾蒂安·盖菲耶在遗嘱中遗赠了一笔可观的资金用于建造台阶，但直到1717年教皇克莱孟十一世才批准该项目。设计竞赛由弗朗切斯科·德·桑克蒂斯赢得，他的优雅提案从亚历山德罗·斯佩基的早期草图中汲取灵感。建设于1723年开始，1725年完成。游览提示：春季台阶装饰有杜鹃花，格外美丽；清晨或傍晚参观可避开人群；请注意禁止在台阶上坐着吃喝。',
        historicalInfo: '西班牙台阶是罗马的一组台阶，爬上西班牙广场和山上圣三一教堂广场之间的陡坡，顶部由山上圣三一教堂主导。',
        yearBuilt: '1723-1726年',
        architect: '弗朗切斯科·德·桑克蒂斯和亚历山德罗·斯佩基'
      },
      ja: {
        name: 'スペイン階段',
        narration: '映画「ローマの休日」の撮影場所として有名なスペイン階段へようこそ。',
        description: '135段からなる記念碑的な階段',
        detailedDescription: 'イタリア語で「Scalinata di Trinità dei Monti」として知られるスペイン階段は、ローマで最も愛され、最も写真に撮られるランドマークの一つで、麓のスペイン広場と上部のトリニタ・デイ・モンティ教会およびピンチョの丘を優雅に結んでいます。12の階段群に分かれた135段からなるこの記念碑的なバロック様式の階段は、3世紀にわたって訪問者を魅了してきたトラバーチン石の劇的な段差を作り出しています。階段は麓のスペイン広場から英語名を取っており、広場は17世紀以来そこに位置する教皇庁駐在スペイン大使館にちなんで名付けられました。しかし、階段は実際にはフランスの外交によって資金提供され、今日まで続く面白い国際的な混乱を生み出しました。スペイン階段の歴史は、スペイン広場と上の教会の間の急な坂が移動困難だった17世紀初頭に始まります。数十年にわたり、これら2つの重要な場所を結ぶにふさわしい壮大な階段を作るための様々な提案がなされました。フランス君主制を讃えたいフランスと宗教的権威を強調したい教皇庁との間の意見の相違により、プロジェクトは何年も停滞しました。最終的に、フランスの外交官エティエンヌ・ゲフィエが遺言で階段建設のための相当な金額を遺贈しましたが、教皇クレメンス11世がプロジェクトを承認するまで1717年までかかりました。デザインコンペティションはアレッサンドロ・スペッキの初期スケッチから着想を得た優雅な提案をしたフランチェスコ・デ・サンクティスが勝利しました。建設は1723年に始まり、1725年に完成しました。訪問のヒント：春には階段がツツジの花で飾られ特に美しく、早朝や夕方に訪れると混雑を避けられ、階段に座って食べたり飲んだりすることは禁止されているのでご注意ください。',
        historicalInfo: 'スペイン階段はローマにある階段で、麓のスペイン広場と山上のトリニタ・デイ・モンティ広場の間の急な坂を登り、頂上にはトリニタ・デイ・モンティ教会が建っています。',
        yearBuilt: '1723-1726年',
        architect: 'フランチェスコ・デ・サンクティスとアレッサンドロ・スペッキ'
      },
      pt: {
        name: 'Escadaria da Piazza di Spagna',
        narration: 'Bem-vindo à Escadaria da Piazza di Spagna, famosa como local de filmagem do filme "A Princesa e o Plebeu".',
        description: 'Uma escadaria monumental de 135 degraus',
        historicalInfo: 'A Escadaria da Piazza di Spagna é um conjunto de degraus em Roma, subindo uma ladeira íngreme entre a Piazza di Spagna na base e a Piazza Trinità dei Monti, dominada pela igreja da Trinità dei Monti no topo.',
        yearBuilt: '1723-1726',
        architect: 'Francesco de Sanctis e Alessandro Specchi'
      },
      ru: {
        name: 'Испанская лестница',
        narration: 'Добро пожаловать на Испанскую лестницу, известную как место съемок фильма «Римские каникулы».',
        description: 'Монументальная лестница из 135 ступеней',
        historicalInfo: 'Испанская лестница — это набор ступеней в Риме, поднимающихся по крутому склону между Пьяцца ди Спанья у подножия и Пьяцца Тринита деи Монти, на вершине которой доминирует церковь Тринита деи Монти.',
        yearBuilt: '1723-1726 гг.',
        architect: 'Франческо де Санктис и Алессандро Спекки'
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
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
      'https://images.unsplash.com/photo-1604175287072-b5e71423060c?w=800',
      'https://images.unsplash.com/photo-1619794578892-cbdd3ff81c95?w=800',
      'https://images.unsplash.com/photo-1569949380643-6e746ecaa3bd?w=800',
      'https://images.unsplash.com/photo-1570097703229-b195d6dd291f?w=800',
      'https://images.unsplash.com/photo-1565881606991-789a8dff9dbb?w=800',
      'https://images.unsplash.com/photo-1492136344046-866c85e0bf04?w=800'
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
        description: 'Il monumento a pagamento più visitato al mondo',
        historicalInfo: 'La Torre Eiffel fu costruita per l\'Esposizione Universale del 1889 e inizialmente fu criticata da alcuni dei principali artisti e intellettuali francesi. È diventata un\'icona culturale globale della Francia.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      ko: {
        name: '에펠탑',
        narration: '파리의 철의 여인, 에펠탑에 오신 것을 환영합니다. 1889년 만국박람회를 위해 건설되어 프랑스의 세계적인 상징이 되었습니다.',
        description: '세계에서 가장 많이 방문하는 유료 기념물',
        detailedDescription: '"라 투르 에펠"이라고도 불리는 에펠탑은 파리와 프랑스의 확실한 상징으로, 1889년 완공 이후 세계를 매료시켜온 철제 격자 구조의 걸작입니다. 파리 하늘 위로 330미터(1,083피트) 높이로 솟아있는 이 건축적 경이는 프랑스 혁명 100주년을 기념하는 1889년 만국박람회를 위한 임시 구조물로 처음 구상되었습니다. 오늘날 매년 거의 700만 명의 방문객을 맞이하며 세계에서 가장 많이 방문하는 유료 기념물이 되었습니다. 탑은 금속 골조 건설을 전문으로 하는 기술자 귀스타브 에펠이 설계했습니다. 에펠의 디자인은 만국박람회의 중심물을 만들기 위한 경쟁에서 100개 이상의 제출작 중에서 선정되었습니다. 구조물의 혁신적인 디자인과 전례 없는 높이는 파리 예술가와 지식인들 사이에서 격렬한 논란을 일으켰으며, 그들은 "에펠탑에 반대하는 예술가들"이라는 청원서를 발표하여 우아한 파리 스카이라인을 훼손할 괴물 같은 철제 괴물이라고 비난했습니다. 건설은 1887년 1월에 시작되어 놀랍게도 2년 2개월 5일 만에 완료되었으며, 이는 에펠의 공학적 능력과 조직 기술을 증명합니다. 탑은 18,038개의 금속 부품, 250만 개의 리벳, 300명 이상의 노동자가 필요했습니다. 작업이 수행된 높이와 프로젝트의 엄청난 규모에도 불구하고 건설 중 단 한 명의 노동자만 사망했습니다. 방문 팁: 일몰 시간에 방문하면 파리의 황금빛 풍경과 밤의 반짝이는 조명쇼를 모두 즐길 수 있으며, 티켓은 온라인으로 미리 예약하는 것이 좋고, 2층까지는 계단으로 올라가면 더 저렴하고 군중을 피할 수 있습니다.',
        historicalInfo: '에펠탑은 1889년 만국박람회를 위해 건설되었으며 처음에는 프랑스의 주요 예술가와 지식인들로부터 비판을 받았습니다. 프랑스의 세계적인 문화 아이콘이 되었습니다.',
        yearBuilt: '1887-1889년',
        architect: '귀스타브 에펠'
      },
      es: {
        name: 'Torre Eiffel',
        narration: 'Bienvenido a la Torre Eiffel, la dama de hierro de París. Construida para la Exposición Universal de 1889, se ha convertido en el icono global de Francia.',
        description: 'El monumento de pago más visitado del mundo',
        historicalInfo: 'La Torre Eiffel fue construida para la Exposición Universal de 1889 y fue inicialmente criticada por algunos de los principales artistas e intelectuales de Francia. Se ha convertido en un icono cultural global de Francia.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      fr: {
        name: 'Tour Eiffel',
        narration: 'Bienvenue à la Tour Eiffel, la dame de fer de Paris. Construite pour l\'Exposition Universelle de 1889, elle est devenue l\'icône mondiale de la France.',
        description: 'Le monument payant le plus visité au monde',
        historicalInfo: 'La Tour Eiffel a été construite pour l\'Exposition Universelle de 1889 et a été initialement critiquée par certains des principaux artistes et intellectuels français. Elle est devenue une icône culturelle mondiale de la France.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      de: {
        name: 'Eiffelturm',
        narration: 'Willkommen am Eiffelturm, der eisernen Dame von Paris. Erbaut für die Weltausstellung 1889, ist er zum globalen Symbol Frankreichs geworden.',
        description: 'Das meistbesuchte kostenpflichtige Monument der Welt',
        historicalInfo: 'Der Eiffelturm wurde für die Weltausstellung 1889 gebaut und wurde anfangs von einigen führenden französischen Künstlern und Intellektuellen kritisiert. Er ist zu einer globalen kulturellen Ikone Frankreichs geworden.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      zh: {
        name: '埃菲尔铁塔',
        narration: '欢迎来到埃菲尔铁塔，巴黎的钢铁女士。为1889年世界博览会建造，已成为法国的全球象征。',
        description: '世界上访问量最多的收费纪念碑',
        detailedDescription: '埃菲尔铁塔，或称"La Tour Eiffel"，是巴黎和法国无可争议的象征，自1889年完工以来一直吸引着世界的铁格子杰作。这座建筑奇迹高耸入巴黎天空330米（1,083英尺），最初是为庆祝法国大革命一百周年的1889年世界博览会而设计的临时建筑。如今，它每年接待近700万游客，成为世界上访问量最多的收费纪念碑。铁塔由专门从事金属框架建设的工程师古斯塔夫·埃菲尔设计。埃菲尔的设计从100多份提交作品中脱颖而出，赢得了为世界博览会创建标志性建筑的竞赛。这座建筑的创新设计和前所未有的高度在巴黎艺术家和知识分子中引发了激烈争议，他们发表了一份名为"反对埃菲尔铁塔的艺术家"的请愿书，谴责它是一个会破坏优雅巴黎天际线的怪异铁怪物。值得注意的批评者包括作家莫泊桑，据说他每天都在塔的餐厅吃午餐，因为那是巴黎唯一一个看不到铁塔的地方。建设于1887年1月开始，并在令人瞩目的2年2个月零5天内完成，这证明了埃菲尔的工程能力和组织技能。铁塔需要18,038个金属部件、250万个铆钉和300多名工人组装。尽管项目规模巨大，工作高度也很高，但施工期间只有一名工人死亡——这在当时是一个非常低的伤亡率。游览提示：日落时分参观可以欣赏巴黎的金色景观和夜晚的闪烁灯光秀，建议提前在线预订门票，步行上二层更便宜且可以避开人群。',
        historicalInfo: '埃菲尔铁塔为1889年世界博览会而建，最初受到一些法国主要艺术家和知识分子的批评。它已成为法国的全球文化象征。',
        yearBuilt: '1887-1889年',
        architect: '古斯塔夫·埃菲尔'
      },
      ja: {
        name: 'エッフェル塔',
        narration: 'パリの鉄の貴婦人、エッフェル塔へようこそ。1889年の万国博覧会のために建設され、フランスの世界的象徴となりました。',
        description: '世界で最も訪問者の多い有料モニュメント',
        detailedDescription: 'エッフェル塔、または「ラ・トゥール・エッフェル」は、パリとフランスの揺るぎない象徴として、1889年の完成以来世界を魅了してきた鉄格子の傑作です。パリの空に330メートル（1,083フィート）の高さでそびえ立つこの建築の驚異は、フランス革命100周年を祝う1889年の万国博覧会のための一時的な構造物として当初考案されました。今日では毎年約700万人の訪問者を迎え、世界で最も訪問者の多い有料モニュメントとなっています。塔は金属骨組み建設を専門とする技術者ギュスターヴ・エッフェルによって設計されました。エッフェルのデザインは、万国博覧会の目玉を作るための競争で100以上の提出作品から選ばれました。構造物の革新的なデザインと前例のない高さは、パリの芸術家や知識人の間で激しい論争を引き起こし、彼らは「エッフェル塔に反対する芸術家たち」という嘆願書を発表し、優雅なパリのスカイラインを台無しにする怪物のような鉄の怪物だと非難しました。著名な批評家には作家ギ・ド・モーパッサンが含まれ、彼は毎日塔のレストランで昼食を食べたと伝えられていますが、それは塔が見えないパリで唯一の場所だったからです。建設は1887年1月に始まり、驚くべき2年2ヶ月5日で完成し、エッフェルの工学的能力と組織力の証となりました。塔には18,038個の金属部品、250万個のリベット、300人以上の労働者が必要でした。プロジェクトの巨大な規模と作業が行われた高さにもかかわらず、建設中に死亡した労働者はわずか1人でした。訪問のヒント：日没時に訪れるとパリの黄金の景色と夜の輝くライトショーの両方を楽しめ、チケットはオンラインで事前予約することをお勧めし、2階まで階段で登るとより安く混雑を避けられます。',
        historicalInfo: 'エッフェル塔は1889年の万国博覧会のために建設され、当初はフランスの主要な芸術家や知識人から批判されました。フランスの世界的な文化的象徴となっています。',
        yearBuilt: '1887-1889年',
        architect: 'ギュスターヴ・エッフェル'
      },
      pt: {
        name: 'Torre Eiffel',
        narration: 'Bem-vindo à Torre Eiffel, a dama de ferro de Paris. Construída para a Exposição Universal de 1889, tornou-se o ícone global da França.',
        description: 'O monumento pago mais visitado do mundo',
        historicalInfo: 'A Torre Eiffel foi construída para a Exposição Universal de 1889 e foi inicialmente criticada por alguns dos principais artistas e intelectuais da França. Tornou-se um ícone cultural global da França.',
        yearBuilt: '1887-1889',
        architect: 'Gustave Eiffel'
      },
      ru: {
        name: 'Эйфелева башня',
        narration: 'Добро пожаловать на Эйфелеву башню, железную леди Парижа. Построенная для Всемирной выставки 1889 года, она стала мировым символом Франции.',
        description: 'Самый посещаемый платный памятник в мире',
        historicalInfo: 'Эйфелева башня была построена для Всемирной выставки 1889 года и первоначально подвергалась критике со стороны некоторых ведущих французских художников и интеллектуалов. Она стала глобальным культурным символом Франции.',
        yearBuilt: '1887-1889 гг.',
        architect: 'Гюстав Эйфель'
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
      'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
      'https://images.unsplash.com/photo-1587648415693-4a5362b2ce41?w=800',
      'https://images.unsplash.com/photo-1567942585146-33d62b775db0?w=800',
      'https://images.unsplash.com/photo-1628811599792-f5d602892048?w=800',
      'https://images.unsplash.com/photo-1586168078184-1fe44f2491e1?w=800',
      'https://images.unsplash.com/photo-1535399475061-ad1dca038c26?w=800',
      'https://images.unsplash.com/photo-1551634979-2b11f8c946fe?w=800',
      'https://images.unsplash.com/photo-1590493231867-b462120f4397?w=800'
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
        description: 'Il più grande museo d\'arte del mondo e un monumento storico',
        historicalInfo: 'Il Louvre era originariamente un palazzo reale prima di diventare un museo pubblico durante la Rivoluzione francese nel 1793. Ospita circa 38.000 oggetti dalla preistoria al XXI secolo.',
        yearBuilt: 'Palazzo: dal XII secolo in poi, Museo: 1793',
        architect: 'Più architetti nel corso dei secoli, Piramide moderna: I.M. Pei'
      },
      ko: {
        name: '루브르 박물관',
        narration: '세계 최대의 미술관인 루브르 박물관에 오셨습니다. 모나리자를 포함한 수천 점의 작품이 소장되어 있습니다.',
        description: '세계 최대의 미술관이자 역사적 기념물',
        detailedDescription: '루브르 박물관(Musée du Louvre)은 세계에서 가장 크고 가장 많이 방문되는 미술관으로, 72,735평방미터(782,910평방피트)의 갤러리 공간에 380,000점 이상의 유물을 소장하고 35,000점의 예술 작품을 전시하고 있습니다. 파리의 센 강 우안에 위치한 역사적인 루브르 궁전에 자리한 이 장엄한 기관은 매년 약 1,000만 명의 방문객을 끌어모으며, 예술의 전당일 뿐만 아니라 전 세계 문화 애호가들의 순례지이기도 합니다. 루브르의 역사는 그곳에 소장된 예술 작품만큼이나 풍부하고 다층적입니다. 이 장소는 12세기 후반 필립 오귀스트 왕이 바이킹의 침략으로부터 파리를 보호하기 위해 건설한 요새로 시작되었습니다. 이 중세 요새의 고고학적 유적은 박물관 지하에서 여전히 볼 수 있습니다. 14세기에 샤를 5세가 요새를 왕실 거주지로 개조하면서 궁전으로의 진화가 시작되었습니다. 현대적인 루브르 궁전은 르네상스 시대에 형성되었는데, 레오나르도 다 빈치를 프랑스로 초청한 위대한 예술 후원자 프랑수아 1세가 1546년에 옛 요새를 철거하고 르네상스 궁전 건설을 시작했습니다. 특히 베르사유로 궁정을 옮기기 전의 루이 14세를 비롯한 후대 군주들이 계속해서 궁전을 확장하고 장식하여 오늘날 우리가 보는 웅장한 복합 건축물을 만들었습니다. 루브르가 공공 박물관으로 변모한 것은 프랑스 혁명 기간에 시작되었습니다. 1793년 혁명 정부는 그랑 갤러리에 중앙 예술 박물관(Musée Central des Arts)을 개관하여 왕실 소장품과 교회 및 망명자들로부터 압수한 예술 작품을 전시했습니다. 나폴레옹 보나파르트는 그의 군사 원정을 통해 유럽과 이집트 전역에서 보물을 가져와 소장품을 크게 확대했습니다. 그의 패배 후 많은 작품이 반환되었지만, 루브르는 현재 소장품의 기초를 형성한 상당한 컬렉션을 보유했습니다. 박물관의 소장품은 고대 문명부터 19세기 중반까지 다양하며 8개 큐레토리얼 부서로 나뉩니다. 방문 팁: 수요일과 금요일 야간 개관을 이용하면 혼잡을 피할 수 있으며, 온라인으로 시간 지정 티켓을 미리 예약하고, 덜 알려진 섹션인 이슬람 예술이나 장식 예술 갤러리를 탐험해 보세요.',
        historicalInfo: '루브르는 원래 왕궁이었으나 1793년 프랑스 혁명 중에 공공 박물관이 되었습니다. 선사시대부터 21세기까지 약 38,000점의 유물을 소장하고 있습니다.',
        yearBuilt: '궁전: 12세기 이후, 박물관: 1793년',
        architect: '여러 세기에 걸친 다양한 건축가들, 현대 피라미드: I.M. 페이'
      },
      es: {
        name: 'Museo del Louvre',
        narration: 'Está en el Museo del Louvre, el museo de arte más grande del mundo. Hogar de miles de obras, incluida la Mona Lisa.',
        description: 'El museo de arte más grande del mundo y un monumento histórico',
        historicalInfo: 'El Louvre fue originalmente un palacio real antes de convertirse en museo público durante la Revolución Francesa en 1793. Alberga aproximadamente 38.000 objetos desde la prehistoria hasta el siglo XXI.',
        yearBuilt: 'Palacio: desde el siglo XII en adelante, Museo: 1793',
        architect: 'Múltiples arquitectos a lo largo de los siglos, Pirámide moderna: I.M. Pei'
      },
      fr: {
        name: 'Musée du Louvre',
        narration: 'Vous êtes au Musée du Louvre, le plus grand musée d\'art du monde. Il abrite des milliers d\'œuvres, dont la Joconde.',
        description: 'Le plus grand musée d\'art du monde et un monument historique',
        historicalInfo: 'Le Louvre était à l\'origine un palais royal avant de devenir un musée public pendant la Révolution française en 1793. Il abrite environ 38 000 objets de la préhistoire au XXIe siècle.',
        yearBuilt: 'Palais : à partir du XIIe siècle, Musée : 1793',
        architect: 'Plusieurs architectes au fil des siècles, Pyramide moderne : I.M. Pei'
      },
      de: {
        name: 'Louvre-Museum',
        narration: 'Sie befinden sich im Louvre-Museum, dem größten Kunstmuseum der Welt. Heimat Tausender Werke, darunter die Mona Lisa.',
        description: 'Das größte Kunstmuseum der Welt und ein historisches Denkmal',
        historicalInfo: 'Der Louvre war ursprünglich ein königlicher Palast, bevor er während der Französischen Revolution 1793 zu einem öffentlichen Museum wurde. Er beherbergt etwa 38.000 Objekte von der Vorgeschichte bis zum 21. Jahrhundert.',
        yearBuilt: 'Palast: ab dem 12. Jahrhundert, Museum: 1793',
        architect: 'Mehrere Architekten über Jahrhunderte, Moderne Pyramide: I.M. Pei'
      },
      zh: {
        name: '卢浮宫博物馆',
        narration: '您正在卢浮宫博物馆，世界上最大的艺术博物馆。收藏了包括蒙娜丽莎在内的数千件作品。',
        description: '世界上最大的艺术博物馆和历史古迹',
        detailedDescription: '卢浮宫博物馆（Musée du Louvre）是世界上最大、参观人数最多的艺术博物馆，在72,735平方米（782,910平方英尺）的画廊空间内收藏了超过380,000件文物，展出35,000件艺术作品。这座宏伟的机构位于巴黎塞纳河右岸的历史悠久的卢浮宫内，每年吸引约1000万游客，不仅是艺术殿堂，也是来自全球文化爱好者的朝圣地。卢浮宫的历史与其收藏的艺术品一样丰富多彩、层次分明。这个地点最初是12世纪末菲利普·奥古斯特国王为保护巴黎免受维京人入侵而建造的堡垒。这座中世纪堡垒的考古遗迹至今仍可在博物馆地下室看到。14世纪，查理五世将堡垒改造为皇家住所，开始了其向宫殿的演变。现代卢浮宫在文艺复兴时期成形，当时伟大的艺术赞助人、将列奥纳多·达·芬奇带到法国的弗朗索瓦一世于1546年拆除了旧堡垒，开始建造文艺复兴宫殿。后继的君主，特别是在将宫廷迁往凡尔赛之前的路易十四，继续扩建和装饰宫殿，创造了我们今天看到的宏伟建筑群。卢浮宫向公共博物馆的转变始于法国大革命期间。1793年，革命政府在大画廊开设了中央艺术博物馆（Musée Central des Arts），展示皇家收藏品和从教会及流亡者那里没收的艺术品。拿破仑·波拿巴通过军事征服大大扩展了收藏，从整个欧洲和埃及带回珍宝。尽管在他战败后许多作品被归还，但卢浮宫保留了大量藏品，构成了其当前收藏的基础。博物馆的藏品跨越从古代文明到19世纪中叶，分为8个策展部门。参观提示：利用周三和周五的夜间开放时间可以避开人群，提前在线预订定时门票，探索较少人知的区域如伊斯兰艺术或装饰艺术画廊。',
        historicalInfo: '卢浮宫最初是一座皇家宫殿，1793年法国大革命期间成为公共博物馆。它收藏了约38,000件从史前到21世纪的文物。',
        yearBuilt: '宫殿：12世纪起，博物馆：1793年',
        architect: '几个世纪以来的多位建筑师，现代金字塔：贝聿铭'
      },
      ja: {
        name: 'ルーヴル美術館',
        narration: 'ここは世界最大の美術館、ルーヴル美術館です。モナ・リザを含む数千の作品を所蔵しています。',
        description: '世界最大の美術館であり歴史的建造物',
        detailedDescription: 'ルーヴル美術館（Musée du Louvre）は、世界最大かつ最も訪問者の多い美術館で、72,735平方メートル（782,910平方フィート）のギャラリースペースに380,000点以上の収蔵品があり、35,000点の美術作品を展示しています。パリのセーヌ川右岸にある歴史的なルーヴル宮殿に位置するこの壮大な施設は、年間約1,000万人の訪問者を魅了し、芸術の殿堂であるだけでなく、世界中の文化愛好家の巡礼地となっています。ルーヴルの歴史は、そこに収蔵されている芸術作品と同じくらい豊かで多層的です。この場所は、12世紀後半にフィリップ・オーギュスト王がヴァイキングの侵略からパリを守るために建設した要塞として始まりました。この中世の要塞の考古学的遺跡は、今でも美術館の地下で見ることができます。14世紀、シャルル5世が要塞を王室の住居に改造し、宮殿への進化が始まりました。現代のルーヴル宮殿はルネサンス期に形を成し、レオナルド・ダ・ヴィンチをフランスに招いた偉大な芸術の庇護者フランソワ1世が1546年に古い要塞を取り壊し、ルネサンス様式の宮殿の建設を始めました。特にヴェルサイユに宮廷を移す前のルイ14世をはじめとする歴代の君主たちが、宮殿の拡張と装飾を続け、今日見られる壮大な複合施設を作り上げました。ルーヴルが公共美術館へと変貌したのは、フランス革命期に始まりました。1793年、革命政府はグランド・ギャラリーに中央芸術美術館（Musée Central des Arts）を開設し、王室コレクションと教会や亡命者から没収した芸術作品を展示しました。ナポレオン・ボナパルトは軍事遠征を通じてヨーロッパとエジプト全域から財宝を持ち帰り、コレクションを大幅に拡大しました。彼の敗北後、多くの作品が返還されましたが、ルーヴルは現在の所蔵品の基礎となる相当なコレクションを保持しました。美術館のコレクションは古代文明から19世紀半ばまでをカバーし、8つのキュレーター部門に分かれています。訪問のヒント：水曜日と金曜日の夜間開館を利用すると混雑を避けられ、オンラインで時間指定チケットを事前予約し、イスラム美術や装飾美術ギャラリーなどあまり知られていないセクションを探索してみてください。',
        historicalInfo: 'ルーヴルは元々王宮でしたが、1793年のフランス革命中に公共美術館となりました。先史時代から21世紀までの約38,000点の作品を所蔵しています。',
        yearBuilt: '宮殿：12世紀以降、美術館：1793年',
        architect: '何世紀にもわたる複数の建築家、現代のピラミッド：I.M.ペイ'
      },
      pt: {
        name: 'Museu do Louvre',
        narration: 'Você está no Museu do Louvre, o maior museu de arte do mundo. Lar de milhares de obras, incluindo a Mona Lisa.',
        description: 'O maior museu de arte do mundo e um monumento histórico',
        historicalInfo: 'O Louvre foi originalmente um palácio real antes de se tornar um museu público durante a Revolução Francesa em 1793. Abriga aproximadamente 38.000 objetos da pré-história ao século XXI.',
        yearBuilt: 'Palácio: do século XII em diante, Museu: 1793',
        architect: 'Múltiplos arquitetos ao longo dos séculos, Pirâmide moderna: I.M. Pei'
      },
      ru: {
        name: 'Музей Лувр',
        narration: 'Вы находитесь в музее Лувр, крупнейшем художественном музее мира. Здесь хранятся тысячи произведений, включая Мону Лизу.',
        description: 'Крупнейший художественный музей мира и исторический памятник',
        historicalInfo: 'Лувр первоначально был королевским дворцом, прежде чем стать публичным музеем во время Французской революции в 1793 году. В нем хранится около 38 000 экспонатов от доисторических времен до XXI века.',
        yearBuilt: 'Дворец: с XII века, Музей: 1793',
        architect: 'Множество архитекторов на протяжении веков, Современная пирамида: И.М. Пей'
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
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      'https://images.unsplash.com/photo-1644603100283-5f29160acc51?w=800',
      'https://images.unsplash.com/photo-1652893343528-453785c7878c?w=800',
      'https://images.unsplash.com/photo-1555425748-f780612e5634?w=800',
      'https://images.unsplash.com/photo-1613822363259-0b72ec056ee2?w=800',
      'https://images.unsplash.com/photo-1551120343-863a43d33990?w=800',
      'https://images.unsplash.com/photo-1565457211452-16f8e7062a0a?w=800',
      'https://images.unsplash.com/photo-1555397227-cbcbc55768de?w=800'
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
        description: 'Una cattedrale cattolica medievale e patrimonio mondiale dell\'UNESCO',
        historicalInfo: 'Notre-Dame de Paris è una cattedrale cattolica medievale dedicata alla Vergine Maria. È considerata uno dei migliori esempi di architettura gotica francese ed è stata gravemente danneggiata da un incendio nel 2019.',
        yearBuilt: '1163-1345',
        architect: 'Più architetti, restauro importante di Eugène Viollet-le-Duc'
      },
      ko: {
        name: '노트르담 대성당',
        narration: '이곳은 12세기로 거슬러 올라가는 프랑스 고딕 건축의 걸작, 노트르담 대성당입니다.',
        description: '중세 가톨릭 대성당이자 유네스코 세계문화유산',
        detailedDescription: '노트르담 드 파리는 프랑스 고딕 건축의 가장 훌륭한 사례 중 하나이자 파리, 프랑스, 그리고 기독교 신앙의 강력한 상징으로 서 있습니다. 로마 시대부터 파리의 심장이었던 센 강의 자연 섬인 시테 섬에 위치한 이 장엄한 대성당은 850년 이상의 프랑스 역사를 목격해 왔으며, 중세 대관식부터 혁명의 혼란, 그리고 2019년의 비극적인 화재까지 겪었습니다. 노트르담의 건설은 1163년 루이 7세 통치 하에 시작되었으며, 모리스 드 쉴리 주교가 이 부지의 두 개의 이전 교회를 대체하기 위해 대성당을 의뢰했습니다. 야심찬 이 프로젝트는 완성하는 데 거의 2세기가 걸렸으며, 주요 구조는 1260년에 완성되었고 14세기까지 추가 수정이 계속되었습니다. 이 긴 건설 기간으로 인해 건축 양식의 매력적인 혼합이 이루어졌지만, 고딕 요소가 전체적으로 지배합니다. 대성당의 서쪽 파사드는 고딕 디자인의 걸작으로, 파리 하늘로 69미터(226피트) 솟아오른 두 개의 거대한 탑이 특징입니다. 이 탑들 사이에는 유명한 장미창이 있는데, 직경 9.6미터(31피트)의 놀라운 원형 스테인드글라스 걸작으로 성모 마리아의 생애 장면을 묘사하고 있습니다. 파사드는 성경 장면과 인물을 묘사한 복잡한 석조 조각으로 장식된 세 개의 화려한 포털로 장식되어 있습니다. 중앙의 최후의 심판 포털은 죽은 자의 부활을 주재하는 그리스도를 보여주며, 성모의 포털과 성 안나의 포털이 양쪽에 있습니다. 포털 위에는 유다 왕들을 나타내는 28개의 조각상이 있는 왕들의 갤러리가 있지만, 많은 사람들이 혁명 중에 프랑스 왕들을 나타낸다고 잘못 믿고 참수했습니다. 내부에서 노트르담의 본당은 길이 130미터(427피트)로 뻗어 있어 시선을 하늘로 이끄는 웅장한 공간을 만듭니다. 방문 팁: 복원 작업이 진행 중이지만 외부에서 건축물을 감상할 수 있으며, 인근 생트 샤펠의 놀라운 스테인드글라스를 방문하고, 대성당 광장에서 노트르담의 역사적 중요성을 반추해 보세요.',
        historicalInfo: '노트르담 드 파리는 성모 마리아에게 봉헌된 중세 가톨릭 대성당입니다. 프랑스 고딕 건축의 가장 훌륭한 사례 중 하나로 여겨지며 2019년 화재로 심각한 피해를 입었습니다.',
        yearBuilt: '1163-1345년',
        architect: '여러 건축가들, 외젠 비올레르뒤크의 주요 복원'
      },
      es: {
        name: 'Catedral de Notre-Dame',
        narration: 'Esta es la Catedral de Notre-Dame, una obra maestra de la arquitectura gótica francesa que data del siglo XII.',
        description: 'Una catedral católica medieval y Patrimonio de la Humanidad de la UNESCO',
        historicalInfo: 'Notre-Dame de París es una catedral católica medieval dedicada a la Virgen María. Se considera uno de los mejores ejemplos de arquitectura gótica francesa y fue gravemente dañada por un incendio en 2019.',
        yearBuilt: '1163-1345',
        architect: 'Múltiples arquitectos, restauración importante de Eugène Viollet-le-Duc'
      },
      fr: {
        name: 'Cathédrale Notre-Dame',
        narration: 'Voici la Cathédrale Notre-Dame, un chef-d\'œuvre de l\'architecture gothique française datant du XIIe siècle.',
        description: 'Une cathédrale catholique médiévale et site du patrimoine mondial de l\'UNESCO',
        historicalInfo: 'Notre-Dame de Paris est une cathédrale catholique médiévale dédiée à la Vierge Marie. Elle est considérée comme l\'un des plus beaux exemples d\'architecture gothique française et a été gravement endommagée par un incendie en 2019.',
        yearBuilt: '1163-1345',
        architect: 'Plusieurs architectes, restauration majeure par Eugène Viollet-le-Duc'
      },
      de: {
        name: 'Kathedrale Notre-Dame',
        narration: 'Dies ist die Kathedrale Notre-Dame, ein Meisterwerk französischer Gotik aus dem 12. Jahrhundert.',
        description: 'Eine mittelalterliche katholische Kathedrale und UNESCO-Weltkulturerbe',
        historicalInfo: 'Notre-Dame de Paris ist eine mittelalterliche katholische Kathedrale, die der Jungfrau Maria gewidmet ist. Sie gilt als eines der schönsten Beispiele französischer Gotik und wurde 2019 durch einen Brand schwer beschädigt.',
        yearBuilt: '1163-1345',
        architect: 'Mehrere Architekten, große Restaurierung durch Eugène Viollet-le-Duc'
      },
      zh: {
        name: '巴黎圣母院',
        narration: '这是巴黎圣母院，可追溯至12世纪的法国哥特式建筑杰作。',
        description: '中世纪天主教大教堂和联合国教科文组织世界遗产',
        detailedDescription: '巴黎圣母院（Notre-Dame de Paris）是法国哥特式建筑的最杰出典范之一，也是巴黎、法国和基督教信仰的强大象征。这座宏伟的大教堂位于西岱岛（Île de la Cité），这是塞纳河中的一个天然岛屿，自罗马时代以来一直是巴黎的心脏。大教堂见证了850多年的法国历史，从中世纪加冕礼到革命动荡，再到2019年的悲惨火灾。巴黎圣母院的建设始于1163年路易七世统治时期，主教莫里斯·德·苏利委托建造这座大教堂以取代该地的两座早期教堂。这个雄心勃勃的项目耗时近两个世纪才完成，主体结构于1260年完工，14世纪继续进行额外的修改。这一漫长的建设期造就了建筑风格的迷人融合，尽管哥特式元素贯穿始终。大教堂的西立面是哥特式设计的杰作，两座巨大的塔楼高耸入巴黎天空69米（226英尺）。在这两座塔楼之间是著名的玫瑰窗，这是一个直径9.6米（31英尺）的惊人圆形彩色玻璃杰作，描绘了圣母玛利亚生平的场景。立面装饰有三个华丽的门廊，每个门廊都装饰着描绘圣经场景和人物的复杂石雕。中央的最后审判门廊展示了主持死者复活的基督，圣母门廊和圣安娜门廊分列两侧。门廊上方是国王画廊，有28座代表犹大国王的雕像，尽管许多人在大革命期间误认为它们代表法国国王而将其斩首。在内部，巴黎圣母院的中殿长达130米（427英尺），创造了一个引导视线向上的宏伟空间——这是哥特式建筑旨在将信徒的思想提升到天堂的基本原则。参观提示：虽然修复工作正在进行中，但您可以从外部欣赏这座建筑，参观附近圣礼拜堂（Sainte-Chapelle）令人惊叹的彩色玻璃窗，并在大教堂广场上思考巴黎圣母院的历史意义。',
        historicalInfo: '巴黎圣母院是一座献给圣母玛利亚的中世纪天主教大教堂。它被认为是法国哥特式建筑的最佳典范之一，在2019年的火灾中严重受损。',
        yearBuilt: '1163-1345年',
        architect: '多位建筑师，欧仁·维奥莱-勒-杜克的主要修复'
      },
      ja: {
        name: 'ノートルダム大聖堂',
        narration: 'これは12世紀にさかのぼるフランス・ゴシック建築の傑作、ノートルダム大聖堂です。',
        description: '中世のカトリック大聖堂でユネスコ世界遺産',
        detailedDescription: 'ノートルダム・ド・パリ（Notre-Dame de Paris）は、フランス・ゴシック建築の最も優れた例の一つであり、パリ、フランス、そしてキリスト教信仰の強力な象徴として立っています。ローマ時代からパリの中心であったセーヌ川の自然の島、シテ島に位置するこの壮大な大聖堂は、中世の戴冠式から革命の混乱、そして2019年の悲劇的な火災まで、850年以上のフランス史を目撃してきました。ノートルダムの建設は1163年にルイ7世の治世下で始まり、モーリス・ド・シュリー司教がこの場所にあった2つの古い教会に代わる大聖堂を委託しました。この野心的なプロジェクトは完成に約2世紀を要し、主要構造は1260年に完成し、14世紀まで追加の修正が続きました。この長い建設期間により、建築様式の魅力的な融合が生まれましたが、ゴシック様式の要素が全体を支配しています。大聖堂の西ファサードはゴシックデザインの傑作で、パリの空に69メートル（226フィート）そびえる2つの巨大な塔が特徴です。これらの塔の間には有名なバラ窓があり、直径9.6メートル（31フィート）の見事な円形ステンドグラスの傑作で、聖母マリアの生涯の場面を描いています。ファサードは、聖書の場面と人物を描いた複雑な石彫で装飾された3つの華麗なポータルで飾られています。中央の最後の審判のポータルは、死者の復活を司るキリストを示し、聖母のポータルと聖アンナのポータルが両側に並んでいます。ポータルの上には、ユダの王たちを表す28の彫像からなる王のギャラリーが並んでいますが、多くの人が革命中にフランスの王を表すと誤って信じて斬首しました。内部では、ノートルダムの身廊は長さ130メートル（427フィート）に及び、視線を天に導く壮大な空間を作り出します。これは信者の心を天国に向けることを目的とするゴシック建築の基本原則です。訪問のヒント：修復作業が進行中ですが、外部から建築物を鑑賞でき、近くのサント・シャペルの素晴らしいステンドグラスを訪れ、大聖堂広場でノートルダムの歴史的重要性を振り返ることができます。',
        historicalInfo: 'ノートルダム・ド・パリは聖母マリアに捧げられた中世のカトリック大聖堂です。フランス・ゴシック建築の最高傑作の一つとされ、2019年の火災で大きな被害を受けました。',
        yearBuilt: '1163-1345年',
        architect: '複数の建築家、ウジェーヌ・ヴィオレ＝ル＝デュクによる大規模修復'
      },
      pt: {
        name: 'Catedral de Notre-Dame',
        narration: 'Esta é a Catedral de Notre-Dame, uma obra-prima da arquitetura gótica francesa que remonta ao século XII.',
        description: 'Uma catedral católica medieval e Patrimônio Mundial da UNESCO',
        historicalInfo: 'Notre-Dame de Paris é uma catedral católica medieval dedicada à Virgem Maria. É considerada um dos melhores exemplos de arquitetura gótica francesa e foi gravemente danificada por um incêndio em 2019.',
        yearBuilt: '1163-1345',
        architect: 'Múltiplos arquitetos, grande restauração por Eugène Viollet-le-Duc'
      },
      ru: {
        name: 'Собор Нотр-Дам',
        narration: 'Это собор Нотр-Дам, шедевр французской готической архитектуры, датируемый XII веком.',
        description: 'Средневековый католический собор и объект Всемирного наследия ЮНЕСКО',
        historicalInfo: 'Собор Парижской Богоматери - средневековый католический собор, посвященный Деве Марии. Он считается одним из лучших образцов французской готической архитектуры и был серьезно поврежден пожаром в 2019 году.',
        yearBuilt: '1163-1345',
        architect: 'Несколько архитекторов, крупная реставрация Эжена Виолле-ле-Дюка'
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
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800',
      'https://images.unsplash.com/photo-e2rtyRTCsns?w=800',
      'https://images.unsplash.com/photo-OSZWXenuke8?w=800',
      'https://images.unsplash.com/photo-VhI3CX2jcV8?w=800',
      'https://images.unsplash.com/photo-Xkkf88pGPTA?w=800',
      'https://images.unsplash.com/photo-JuOJsolqHoU?w=800',
      'https://images.unsplash.com/photo-ZHqXS0lLtZs?w=800',
      'https://images.unsplash.com/photo-fQzGD0hFTb4?w=800'
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
        description: 'Uno dei monumenti più famosi di Parigi',
        historicalInfo: 'L\'Arco di Trionfo fu commissionato da Napoleone nel 1806 per onorare l\'esercito francese. Si trova al centro di Place Charles de Gaulle e contiene la Tomba del Milite Ignoto.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      ko: {
        name: '개선문',
        narration: '개선문은 프랑스를 위해 싸운 사람들을 기리는 곳입니다. 샤를 드골 광장 중앙에 위치해 있습니다.',
        description: '파리에서 가장 유명한 기념물 중 하나',
        detailedDescription: '에투알 개선문(Arc de Triomphe de l\'Étoile)은 파리에서 가장 상징적인 기념물 중 하나이자 프랑스의 국가적 자긍심, 군사적 영광, 그리고 역사적 기억의 강력한 상징으로 서 있습니다. 샹젤리제 거리의 서쪽 끝, 샤를 드골 광장(구 에투알 광장) 중앙에 위치한 이 기념비적인 개선문은 특히 혁명 전쟁과 나폴레옹 전쟁 동안 프랑스를 위해 싸우고 전사한 이들을 기립니다. 높이 50미터(164피트), 너비 45미터(148피트), 깊이 22미터(72피트)로 솟아오른 개선문은 북한 평양의 개선문 다음으로 세계에서 두 번째로 큰 개선문입니다. 이 기념물은 1806년 나폴레옹 보나파르트가 아우스터리츠 전투에서의 승리 이후 프랑스 군대의 업적을 기념하기 위해 의뢰했습니다. 나폴레옹은 그의 병사들에게 "당신들은 개선문을 통해 귀국할 것이다"라고 선언하며, 수세기 동안 프랑스의 군사적 위력을 기념할 기념물을 구상했습니다. 건축가 장 샬그랭이 아치를 설계하도록 선택되었으며, 고대 로마의 티투스 개선문에서 영감을 받되 훨씬 더 웅장하고 야심찬 것을 창조했습니다. 건설은 1806년에 시작되었지만 나폴레옹의 정치적 운명으로 인해 천천히 진행되었습니다. 1810년 오스트리아의 마리 루이즈와 결혼할 때 아치는 완성과 거리가 멀었기 때문에, 황제의 행렬을 위해 실물 크기의 나무 모형이 급히 세워졌습니다. 1814년 나폴레옹의 퇴위 후 건설은 완전히 중단되었습니다. 작업은 1826년 루이 필립 왕 하에 재개되어 나폴레옹 사망 15년 후인 1836년에 마침내 완성되었습니다. 비극적이게도 나폴레옹은 그의 위대한 기념물이 완성되는 것을 보지 못했지만, 1840년 그의 유해가 세인트 헬레나에서 프랑스로 반환될 때 그의 장례 행렬이 아치 아래를 통과했습니다. 개선문은 프랑스 군사적 영광의 이야기를 전하는 장엄한 조각 부조로 장식되어 있습니다. 방문 팁: 개선문 꼭대기로 올라가 파리의 장엄한 파노라마 전망을 감상하고, 매일 저녁 6시 30분에 열리는 무명용사 묘의 추모식을 참석하며, 12개 방사형 대로의 별 모양 패턴을 관찰해 보세요.',
        historicalInfo: '개선문은 1806년 나폴레옹이 프랑스 군대를 기리기 위해 의뢰했습니다. 샤를 드골 광장 중앙에 위치하며 무명용사의 묘가 있습니다.',
        yearBuilt: '1806-1836년',
        architect: '장 샬그랭'
      },
      es: {
        name: 'Arco del Triunfo',
        narration: 'El Arco del Triunfo honra a quienes lucharon por Francia. Se encuentra en el centro de la Place Charles de Gaulle.',
        description: 'Uno de los monumentos más famosos de París',
        historicalInfo: 'El Arco del Triunfo fue encargado por Napoleón en 1806 para honrar al ejército francés. Se encuentra en el centro de la Place Charles de Gaulle y contiene la Tumba del Soldado Desconocido.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      fr: {
        name: 'Arc de Triomphe',
        narration: 'L\'Arc de Triomphe rend hommage à ceux qui ont combattu pour la France. Il se dresse au centre de la Place Charles de Gaulle.',
        description: 'L\'un des monuments les plus célèbres de Paris',
        historicalInfo: 'L\'Arc de Triomphe a été commandé par Napoléon en 1806 pour honorer l\'armée française. Il se trouve au centre de la Place Charles de Gaulle et contient la Tombe du Soldat Inconnu.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      de: {
        name: 'Arc de Triomphe',
        narration: 'Der Arc de Triomphe ehrt diejenigen, die für Frankreich gekämpft haben. Er steht im Zentrum des Place Charles de Gaulle.',
        description: 'Eines der berühmtesten Denkmäler in Paris',
        historicalInfo: 'Der Arc de Triomphe wurde 1806 von Napoleon in Auftrag gegeben, um die französische Armee zu ehren. Er steht im Zentrum des Place Charles de Gaulle und enthält das Grab des Unbekannten Soldaten.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      zh: {
        name: '凯旋门',
        narration: '凯旋门是为纪念为法国而战的人们而建。它位于戴高乐广场的中心。',
        description: '巴黎最著名的纪念碑之一',
        detailedDescription: '星形广场凯旋门（Arc de Triomphe de l\'Étoile），通常简称凯旋门，是巴黎最具标志性的纪念碑之一，也是法国民族自豪感、军事荣耀和历史记忆的强大象征。这座宏伟的凯旋门位于香榭丽舍大街西端的戴高乐广场（原名星形广场）中心，纪念那些为法国而战并牺牲的人们，特别是在革命战争和拿破仑战争期间。凯旋门高50米（164英尺），宽45米（148英尺），深22米（72英尺），是世界上第二大凯旋门，仅次于朝鲜平壤的凯旋门。这座纪念碑由拿破仑·波拿巴于1806年在奥斯特里茨战役胜利后委托建造，以纪念法国军队的成就。拿破仑向他的士兵宣布："你们将通过凯旋门回家"，他设想了一座将在未来几个世纪庆祝法国军事实力的纪念碑。建筑师让·沙尔格兰被选中设计这座拱门，从古罗马提图斯凯旋门中汲取灵感，同时创造出更加宏伟和雄心勃勃的作品。施工于1806年开始，但由于拿破仑的政治命运而进展缓慢。1810年他与奥地利的玛丽·路易丝结婚时，拱门远未完工，因此为皇家游行匆忙搭建了一个全尺寸的木制模型。1814年拿破仑退位后，施工完全停止。工程于1826年在路易·菲利普国王统治下恢复，最终于1836年完工，距拿破仑去世15年。可悲的是，拿破仑从未看到他宏伟的纪念碑完工，尽管1840年他的遗体从圣赫勒拿岛返回法国时，他的葬礼队伍确实通过了拱门下方。凯旋门装饰有讲述法国军事荣耀故事的宏伟雕刻浮雕。参观提示：登上凯旋门顶部欣赏巴黎壮丽的全景，参加每晚6:30在无名战士墓举行的纪念仪式，观察12条放射状大道形成的星形图案。',
        historicalInfo: '凯旋门由拿破仑于1806年委托建造，以纪念法国军队。它位于戴高乐广场的中心，内有无名战士墓。',
        yearBuilt: '1806-1836年',
        architect: '让·沙尔格兰'
      },
      ja: {
        name: '凱旋門',
        narration: '凱旋門はフランスのために戦った人々を称えます。シャルル・ド・ゴール広場の中心に立っています。',
        description: 'パリで最も有名な記念碑の一つ',
        detailedDescription: 'エトワール凱旋門（Arc de Triomphe de l\'Étoile）、一般に凱旋門として知られるこの記念碑は、パリで最も象徴的な建造物の一つであり、フランスの国民的誇り、軍事的栄光、歴史的記憶の強力なシンボルとして立っています。シャンゼリゼ通りの西端、シャルル・ド・ゴール広場（旧エトワール広場）の中心に位置するこの記念碑的な凱旋門は、特に革命戦争とナポレオン戦争中にフランスのために戦い、死んだ人々を称えています。高さ50メートル（164フィート）、幅45メートル（148フィート）、奥行き22メートル（72フィート）そびえる凱旋門は、北朝鮮平壌の凱旋門に次いで世界で2番目に大きな凱旋門です。この記念碑は1806年、アウステルリッツの戦いでの勝利の後、ナポレオン・ボナパルトがフランス軍の功績を記念するために委託しました。ナポレオンは兵士たちに「あなたたちは凱旋門を通って帰還するだろう」と宣言し、何世紀にもわたってフランスの軍事力を祝う記念碑を構想しました。建築家ジャン・シャルグランがアーチの設計に選ばれ、古代ローマのティトゥスの凱旋門からインスピレーションを得ながら、より壮大で野心的なものを創造しました。建設は1806年に始まりましたが、ナポレオンの政治的運命により進行は遅々としていました。1810年にオーストリアのマリー・ルイーズと結婚したとき、アーチは完成には程遠かったため、皇帝の行列のために実物大の木製模型が急遽建てられました。1814年のナポレオンの退位後、建設は完全に停止しました。工事は1826年にルイ・フィリップ王の下で再開され、ナポレオンの死から15年後の1836年にようやく完成しました。悲劇的に、ナポレオンは彼の壮大な記念碑が完成するのを見ることはありませんでしたが、1840年に彼の遺体がセントヘレナからフランスに戻されたとき、彼の葬列はアーチの下を通過しました。凱旋門はフランスの軍事的栄光の物語を語る壮大な彫刻レリーフで飾られています。訪問のヒント：凱旋門の頂上に登ってパリの壮大なパノラマビューを楽しみ、毎晩6時30分に無名戦士の墓で行われる追悼式に参加し、12本の放射状大通りが形成する星型パターンを観察してください。',
        historicalInfo: '凱旋門は1806年にナポレオンがフランス軍を称えるために委託しました。シャルル・ド・ゴール広場の中心にあり、無名戦士の墓があります。',
        yearBuilt: '1806-1836年',
        architect: 'ジャン・シャルグラン'
      },
      pt: {
        name: 'Arco do Triunfo',
        narration: 'O Arco do Triunfo homenageia aqueles que lutaram pela França. Está no centro da Place Charles de Gaulle.',
        description: 'Um dos monumentos mais famosos de Paris',
        historicalInfo: 'O Arco do Triunfo foi encomendado por Napoleão em 1806 para homenagear o exército francês. Está no centro da Place Charles de Gaulle e contém o Túmulo do Soldado Desconhecido.',
        yearBuilt: '1806-1836',
        architect: 'Jean Chalgrin'
      },
      ru: {
        name: 'Триумфальная арка',
        narration: 'Триумфальная арка чествует тех, кто сражался за Францию. Она стоит в центре площади Шарля де Голля.',
        description: 'Один из самых известных памятников Парижа',
        historicalInfo: 'Триумфальная арка была заказана Наполеоном в 1806 году в честь французской армии. Она находится в центре площади Шарля де Голля и содержит Могилу Неизвестного солдата.',
        yearBuilt: '1806-1836',
        architect: 'Жан Шальгрен'
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
      'https://images.unsplash.com/photo-1503456170271-2f1b94e2c849?w=800',
      'https://images.unsplash.com/photo-1UF3d2k93vk?w=800',
      'https://images.unsplash.com/photo-SEB_I5Cl_sw?w=800',
      'https://images.unsplash.com/photo-nVw40ihirM8?w=800',
      'https://images.unsplash.com/photo-l4AIijhW6E4?w=800',
      'https://images.unsplash.com/photo-xN0xvvumnEw?w=800',
      'https://images.unsplash.com/photo--8iE9ykf3Us?w=800',
      'https://images.unsplash.com/photo-mOEqOtmuPG8?w=800',
      'https://images.unsplash.com/photo-szj72gcdtkU?w=800'
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
        description: 'Il Grande Orologio di Westminster',
        historicalInfo: 'Big Ben è il soprannome della Grande Campana dell\'orologio del Palazzo di Westminster. La torre fu completata nel 1859 ed è diventata uno dei simboli più importanti del Regno Unito.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      ko: {
        name: '빅벤',
        narration: '런던의 상징적인 시계탑 빅벤에 오신 것을 환영합니다. 공식적으로 엘리자베스 타워로 알려져 있으며, 그 종소리는 전 세계적으로 유명합니다.',
        description: '웨스트민스터의 대시계',
        detailedDescription: '빅벤은 세계에서 가장 잘 알려진 랜드마크 중 하나로, 런던, 영국 의회 민주주의, 그리고 빅토리아 시대 공학의 정밀함을 상징하는 지속적인 상징입니다. 기술적으로 "빅벤"은 탑 내부의 대종만을 가리키지만, 이 이름은 웨스트민스터 궁전의 전체 엘리자베스 타워와 동의어가 되었습니다. 템스강 위로 96미터(316피트) 높이로 솟아 있는 이 상징적인 시계탑은 1859년부터 런던의 시간을 알려왔으며, 그 독특한 종소리는 영국 문화와 뉴스 방송의 청각적 상징으로 전 세계에 방송되고 있습니다. 이 탑은 아우구스투스 퓨진이 고딕 리바이벌 양식으로 설계했으며, 1834년 대화재로 파괴된 이전 중세 궁전을 대체하기 위해 건설된 새로운 웨스트민스터 궁전의 일부입니다. 건설은 1843년에 시작되었지만 탑은 1859년까지 완공되지 않았으며, 시계는 그해 5월 31일에 작동을 시작했습니다. 빅벤의 첫 종소리는 1859년 7월 11일에 울렸지만, 종은 곧 금이 갔고 수리를 위해 4년간 침묵했습니다. 금으로 인해 만들어진 독특한 음색을 가진 수리된 종은 1863년에 다시 울리기 시작했으며 오늘날까지 계속되고 있습니다. 관광 팁: 탑 꼭대기까지 334개의 계단을 올라가 런던의 장엄한 파노라마 전망을 감상하고(사전 예약 필수), 매시 정각 유명한 종소리를 들으며, 의회가 야간 회의 중일 때 탑 꼭대기의 아이튼 라이트가 켜지는 것을 관찰하세요.',
        historicalInfo: '빅벤은 웨스트민스터 궁전의 시계탑에 있는 대종의 별명입니다. 이 탑은 1859년에 완공되었으며 영국의 가장 중요한 상징 중 하나가 되었습니다.',
        yearBuilt: '1843-1859',
        architect: '아우구스투스 퓨진'
      },
      es: {
        name: 'Big Ben',
        narration: 'Bienvenido al Big Ben, la icónica torre del reloj de Londres. Conocida oficialmente como Elizabeth Tower, sus campanadas son conocidas en todo el mundo.',
        description: 'El Gran Reloj de Westminster',
        historicalInfo: 'Big Ben es el apodo de la Gran Campana del reloj del Palacio de Westminster. La torre se completó en 1859 y se ha convertido en uno de los símbolos más destacados del Reino Unido.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      fr: {
        name: 'Big Ben',
        narration: 'Bienvenue à Big Ben, la tour de l\'horloge emblématique de Londres. Officiellement connue sous le nom d\'Elizabeth Tower, ses carillons sont connus dans le monde entier.',
        description: 'La Grande Horloge de Westminster',
        historicalInfo: 'Big Ben est le surnom de la Grande Cloche de l\'horloge du Palais de Westminster. La tour a été achevée en 1859 et est devenue l\'un des symboles les plus importants du Royaume-Uni.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      de: {
        name: 'Big Ben',
        narration: 'Willkommen am Big Ben, dem ikonischen Glockenturm Londons. Offiziell als Elizabeth Tower bekannt, sind seine Glockenschläge weltweit bekannt.',
        description: 'Die Große Uhr von Westminster',
        historicalInfo: 'Big Ben ist der Spitzname für die Große Glocke der Uhr im Palace of Westminster. Der Turm wurde 1859 fertiggestellt und ist zu einem der bekanntesten Symbole des Vereinigten Königreichs geworden.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      zh: {
        name: '大本钟',
        narration: '欢迎来到大本钟，伦敦标志性的钟楼。正式名称为伊丽莎白塔，其钟声享誉全球。',
        description: '威斯敏斯特大钟',
        detailedDescription: '大本钟是世界上最知名的地标之一，作为伦敦、英国议会民主制和维多利亚时代工程精密性的持久象征。虽然"大本钟"在技术上仅指塔内的大钟，但这个名字已成为威斯敏斯特宫整个伊丽莎白塔的代名词。这座标志性钟楼高耸于泰晤士河上方96米（316英尺），自1859年以来一直为伦敦报时，其独特的钟声作为英国文化和新闻广播的音频标志向全世界播放。该塔由奥古斯塔斯·普金设计，采用哥特复兴风格，是新威斯敏斯特宫的一部分，该宫殿是在1834年大火摧毁之前的中世纪宫殿后建造的。建设始于1843年，但直到1859年才完工，时钟于当年5月31日开始运行。大本钟的第一次钟声在1859年7月11日响起，尽管钟很快就裂了，并在修复期间沉默了四年。修复后的钟具有裂纹造成的独特音色，于1863年再次开始鸣响，并一直持续到今天。伊丽莎白塔（2012年从钟楼更名，以纪念伊丽莎白二世女王的钻禧年）展示了壮观的哥特复兴建筑，其华丽的石雕、尖拱和装饰性铸铁尖顶，顶部是圣乔治十字架。参观提示：攀登334级台阶至塔顶欣赏伦敦壮丽全景（需提前预订），每小时整点聆听著名钟声，观察议会夜间开会时塔顶的艾尔顿灯亮起。',
        historicalInfo: '大本钟是威斯敏斯特宫钟楼大钟的昵称。该塔于1859年完工，已成为英国最重要的象征之一。',
        yearBuilt: '1843-1859',
        architect: '奥古斯塔斯·普金'
      },
      ja: {
        name: 'ビッグ・ベン',
        narration: 'ロンドンの象徴的な時計塔、ビッグ・ベンへようこそ。正式にはエリザベス・タワーとして知られ、その鐘の音は世界中で知られています。',
        description: 'ウェストミンスターの大時計',
        detailedDescription: 'ビッグ・ベンは世界で最も認知度の高いランドマークの一つであり、ロンドン、イギリス議会民主主義、そしてビクトリア朝工学の精密さの永続的なシンボルとして立っています。技術的には「ビッグ・ベン」は塔内の大鐘のみを指しますが、この名前はウェストミンスター宮殿全体のエリザベス・タワーと同義語になっています。テムズ川の上96メートル（316フィート）にそびえ立つこの象徴的な時計塔は、1859年以来ロンドンの時を刻んでおり、その独特の鐘の音はイギリス文化とニュース放送の音声シグネチャーとして世界中に放送されています。この塔はオーガスタス・ピュージンによってゴシック・リバイバル様式で設計され、1834年の大火で破壊された以前の中世宮殿の後に建てられた新しいウェストミンスター宮殿の一部です。建設は1843年に始まりましたが、塔は1859年まで完成せず、時計はその年の5月31日に稼働を始めました。ビッグ・ベンの最初の鐘の音は1859年7月11日に鳴り響きましたが、鐘はすぐにひび割れ、修理のために4年間沈黙しました。ひび割れによって作られた独特の音色を持つ修理された鐘は1863年に再び鳴り始め、今日まで続いています。エリザベス・タワー（2012年にクロック・タワーからエリザベス2世女王のダイヤモンド・ジュビリーを記念して改名）は、装飾的な石細工、尖頭アーチ、そして聖ジョージの十字架で頂上を飾られた装飾的な鋳鉄の尖塔を持つ壮大なゴシック・リバイバル建築を示しています。訪問のヒント：塔の頂上まで334段の階段を登ってロンドンの壮大なパノラマビューを楽しみ（事前予約が必要）、毎時の有名な鐘の音を聞き、議会が夜間に開催されているときに塔の頂上のエアトン・ライトが点灯するのを観察してください。',
        historicalInfo: 'ビッグ・ベンはウェストミンスター宮殿の時計塔にある大鐘の愛称です。この塔は1859年に完成し、イギリスの最も重要なシンボルの一つとなりました。',
        yearBuilt: '1843-1859',
        architect: 'オーガスタス・ピュージン'
      },
      pt: {
        name: 'Big Ben',
        narration: 'Bem-vindo ao Big Ben, a icônica torre do relógio de Londres. Oficialmente conhecida como Torre Elizabeth, seus sinos são conhecidos mundialmente.',
        description: 'O Grande Relógio de Westminster',
        historicalInfo: 'Big Ben é o apelido do Grande Sino do relógio do Palácio de Westminster. A torre foi concluída em 1859 e se tornou um dos símbolos mais proeminentes do Reino Unido.',
        yearBuilt: '1843-1859',
        architect: 'Augustus Pugin'
      },
      ru: {
        name: 'Биг-Бен',
        narration: 'Добро пожаловать в Биг-Бен, знаковую часовую башню Лондона. Официально известная как башня Елизаветы, ее колокольные звоны известны во всем мире.',
        description: 'Большие часы Вестминстера',
        historicalInfo: 'Биг-Бен — это прозвище Большого колокола часов Вестминстерского дворца. Башня была завершена в 1859 году и стала одним из самых важных символов Соединенного Королевства.',
        yearBuilt: '1843-1859',
        architect: 'Огастес Пьюджин'
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
      'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800',
      'https://images.unsplash.com/photo-J-wEJwSiAbQ?w=800',
      'https://images.unsplash.com/photo-Q6UehpkBSnQ?w=800',
      'https://images.unsplash.com/photo-Yn9LiXt53jQ?w=800',
      'https://images.unsplash.com/photo-d8ACu3oWWiM?w=800',
      'https://images.unsplash.com/photo-wNV3C-S-IDI?w=800',
      'https://images.unsplash.com/photo-1471623432079-b009d30b6729?w=800',
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'
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
        description: 'Un simbolo iconico di Londra dal 1894',
        historicalInfo: 'Il Tower Bridge fu costruito tra il 1886 e il 1894 ed è uno dei monumenti più famosi di Londra. Il meccanismo del ponte basculante permette di sollevare la carreggiata per far passare il traffico fluviale.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones e John Wolfe Barry'
      },
      ko: {
        name: '타워 브리지',
        narration: '런던에서 가장 유명한 랜드마크 중 하나인 타워 브리지에 있습니다. 이 도개교와 현수교가 결합된 다리는 템스강을 가로지릅니다.',
        description: '1894년부터 런던의 상징',
        detailedDescription: '타워 브리지는 런던에서 가장 인식하기 쉬운 랜드마크 중 하나로, 빅토리아 시대 공학의 독창성과 고딕 리바이벌 건축의 웅장한 예입니다. 런던 타워 근처 템스강을 가로지르는 이 상징적인 도개교와 현수교의 결합은 1894년 완공 이래 런던 그 자체와 동의어가 되었으며, 독특한 쌍둥이 탑과 푸른색 현수 체인이 수많은 사진, 영화, 예술 작품에 등장했습니다. 다리의 건설은 19세기 런던 이스트 엔드의 대규모 상업적 성장에 의해 필요하게 되었으며, 런던 브리지 동쪽에 새로운 강 횡단이 필요했지만 런던 항구의 번화한 선박 교통을 방해하지 않아야 했습니다. 도시 건축가 호레이스 존스가 엔지니어 존 울프 배리와 협력하여 제출한 우승 디자인은 도로를 들어 올려 선박이 통과할 수 있는 도개교(시소 다리)로 이 문제를 독창적으로 해결했습니다. 존스와 배리의 고딕 리바이벌 디자인은 템스강 위로 65미터(213피트) 높이로 솟은 두 개의 거대한 탑을 특징으로 하며, 다리가 들어 올려졌을 때에도 보행자가 건널 수 있도록 상층에 두 개의 수평 보도로 연결되어 있습니다. 건설은 1886년에 시작되어 8년에 걸쳐 432명의 노동자를 고용했으며, 위험한 작업 중 비극적으로 10명의 생명을 앗아갔습니다. 방문 팁: 유리 바닥 보도에서 아래 템스강과 교통을 내려다보고, 빅토리아 시대 엔진룸을 방문하여 원래 증기 구동 메커니즘을 확인하며, 다리가 들어 올려지는 시간표를 확인하여 이 놀라운 공학적 위업을 직접 목격하세요.',
        historicalInfo: '타워 브리지는 1886년에서 1894년 사이에 건설되었으며 런던의 가장 유명한 랜드마크 중 하나입니다. 도개교 메커니즘은 강 교통이 아래를 통과할 수 있도록 도로를 들어 올릴 수 있게 합니다.',
        yearBuilt: '1886-1894',
        architect: '호레이스 존스와 존 울프 배리'
      },
      es: {
        name: 'Tower Bridge',
        narration: 'Está en Tower Bridge, uno de los monumentos más famosos de Londres. Este puente basculante y colgante cruza el río Támesis.',
        description: 'Un símbolo icónico de Londres desde 1894',
        historicalInfo: 'Tower Bridge fue construido entre 1886 y 1894 y es uno de los monumentos más famosos de Londres. El mecanismo del puente basculante permite que la calzada se eleve para dejar pasar el tráfico fluvial.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones y John Wolfe Barry'
      },
      fr: {
        name: 'Tower Bridge',
        narration: 'Vous êtes au Tower Bridge, l\'un des monuments les plus célèbres de Londres. Ce pont basculant et suspendu traverse la Tamise.',
        description: 'Un symbole emblématique de Londres depuis 1894',
        historicalInfo: 'Le Tower Bridge a été construit entre 1886 et 1894 et est l\'un des monuments les plus célèbres de Londres. Le mécanisme du pont basculant permet de lever la chaussée pour laisser passer le trafic fluvial.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones et John Wolfe Barry'
      },
      de: {
        name: 'Tower Bridge',
        narration: 'Sie befinden sich an der Tower Bridge, einem der berühmtesten Wahrzeichen Londons. Diese kombinierte Klapp- und Hängebrücke überquert die Themse.',
        description: 'Ein ikonisches Symbol Londons seit 1894',
        historicalInfo: 'Die Tower Bridge wurde zwischen 1886 und 1894 erbaut und ist eines der berühmtesten Wahrzeichen Londons. Der Klappbrückenmechanismus ermöglicht es, die Fahrbahn anzuheben, um den Schiffsverkehr durchzulassen.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones und John Wolfe Barry'
      },
      zh: {
        name: '塔桥',
        narration: '您在伦敦最著名的地标之一塔桥。这座开合桥和悬索桥的组合横跨泰晤士河。',
        description: '自1894年以来伦敦的标志性象征',
        detailedDescription: '塔桥是伦敦最知名的地标之一，是维多利亚时代工程独创性和哥特复兴建筑的壮丽典范。这座标志性的开合桥和悬索桥组合横跨伦敦塔附近的泰晤士河，自1894年建成以来已成为伦敦的代名词，其独特的双塔和蓝色悬索链出现在无数照片、电影和艺术作品中。这座桥的建设是由19世纪伦敦东区大规模商业增长所必需的，需要在伦敦桥以东建一座新的过河通道，但又不能干扰伦敦港繁忙码头的河道交通。挑战前所未有：如何建造一座足够低的桥梁让行人和车辆轻松通过，同时又能让高桅杆船只从下面通过。市政建筑师霍勒斯·琼斯与工程师约翰·沃尔夫·巴里合作提交的获胜设计，巧妙地用开合桥（跷跷板式桥）解决了这个问题，其路面可以升起让船只通过。琼斯和巴里的哥特复兴设计有两座巨大的塔楼，高耸于泰晤士河上方65米（213英尺），上层用两条水平人行道连接，即使桥升起时也能让行人通过。建设于1886年开始，历时8年雇用了432名工人，在危险的工作中不幸夺去了10人的生命。参观提示：在玻璃地板人行道上俯瞰下方的泰晤士河和交通，参观维多利亚时代的发动机房查看原始蒸汽动力机制，查看桥梁升起时间表亲眼目睹这一惊人的工程壮举。',
        historicalInfo: '塔桥建于1886年至1894年间，是伦敦最著名的地标之一。开合桥机制允许路面升起以让河道交通通过。',
        yearBuilt: '1886-1894',
        architect: '霍勒斯·琼斯和约翰·沃尔夫·巴里'
      },
      ja: {
        name: 'タワーブリッジ',
        narration: 'ロンドンで最も有名なランドマークの一つ、タワーブリッジにいます。この跳ね橋と吊り橋を組み合わせた橋はテムズ川に架かっています。',
        description: '1894年以来のロンドンの象徴',
        detailedDescription: 'タワーブリッジはロンドンで最も認知度の高いランドマークの一つであり、ビクトリア朝工学の独創性とゴシック・リバイバル建築の壮大な例です。ロンドン塔近くのテムズ川に架かるこの象徴的な跳ね橋と吊り橋の組み合わせは、1894年の完成以来ロンドンそのものの同義語となり、独特の双子の塔と青く塗られた吊り鎖が無数の写真、映画、芸術作品に登場しています。この橋の建設は19世紀のロンドンのイーストエンドの大規模な商業成長によって必要とされ、ロンドン橋の東に新しい川の横断が必要でしたが、ロンドン港の忙しいドックへの河川交通を妨げないようにする必要がありました。課題は前例のないものでした：歩行者や車両が簡単に渡れるほど低く、かつ高いマストの船が下を通過できる橋をどのように建設するか。市の建築家ホレス・ジョーンズがエンジニアのジョン・ウルフ・バリーと協力して提出した優勝デザインは、船が通過できるように道路を持ち上げることができる跳ね橋（シーソー橋）でこの問題を独創的に解決しました。ジョーンズとバリーのゴシック・リバイバルデザインは、テムズ川の上65メートル（213フィート）にそびえる2つの巨大な塔を特徴とし、橋が上がっているときでも歩行者が渡れるように上層で2つの水平歩道で接続されています。建設は1886年に始まり、8年間で432人の労働者を雇用し、危険な作業中に悲劇的に10人の命を奪いました。訪問のヒント：ガラス床の歩道から下のテムズ川と交通を見下ろし、ビクトリア朝のエンジンルームを訪れて元の蒸気駆動メカニズムを確認し、橋が上がる時刻表をチェックしてこの驚くべき工学の偉業を直接目撃してください。',
        historicalInfo: 'タワーブリッジは1886年から1894年にかけて建設され、ロンドンで最も有名なランドマークの一つです。跳ね橋機構により、河川交通を通過させるために道路を持ち上げることができます。',
        yearBuilt: '1886-1894',
        architect: 'ホレス・ジョーンズとジョン・ウルフ・バリー'
      },
      pt: {
        name: 'Tower Bridge',
        narration: 'Você está na Tower Bridge, um dos marcos mais famosos de Londres. Esta ponte basculante e suspensa cruza o Rio Tâmisa.',
        description: 'Um símbolo icônico de Londres desde 1894',
        historicalInfo: 'A Tower Bridge foi construída entre 1886 e 1894 e é um dos marcos mais famosos de Londres. O mecanismo da ponte basculante permite que a pista seja levantada para deixar o tráfego fluvial passar por baixo.',
        yearBuilt: '1886-1894',
        architect: 'Horace Jones e John Wolfe Barry'
      },
      ru: {
        name: 'Тауэрский мост',
        narration: 'Вы находитесь у Тауэрского моста, одной из самых известных достопримечательностей Лондона. Этот разводной и подвесной мост пересекает Темзу.',
        description: 'Знаковый символ Лондона с 1894 года',
        historicalInfo: 'Тауэрский мост был построен между 1886 и 1894 годами и является одной из самых известных достопримечательностей Лондона. Механизм разводного моста позволяет поднимать проезжую часть для пропуска речного транспорта.',
        yearBuilt: '1886-1894',
        architect: 'Гораций Джонс и Джон Вулф Барри'
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
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      'https://images.unsplash.com/photo-MZPwImQUDM0?w=800',
      'https://images.unsplash.com/photo-1592933803758-526e3bb2e704?w=800',
      'https://images.unsplash.com/photo-1588953936179-a3798d0e6b19?w=800',
      'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?w=800',
      'https://images.unsplash.com/photo-1581367439325-55b0b9a15d6f?w=800',
      'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800',
      'https://images.unsplash.com/photo-1575456987130-c1f0a2e4f926?w=800'
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
        description: 'La residenza ufficiale del monarca britannico',
        historicalInfo: 'Buckingham Palace è servito come residenza ufficiale londinese dei sovrani del Regno Unito dal 1837. Originariamente era una grande casa di città costruita per il Duca di Buckingham nel 1703.',
        yearBuilt: 'Casa originale: 1703, Espansione del palazzo: 1826-1837',
        architect: 'William Winde (originale), John Nash, Edward Blore, Aston Webb'
      },
      ko: {
        name: '버킹엄 궁전',
        narration: '영국 군주의 런던 거주지인 버킹엄 궁전입니다. 유명한 근위병 교대식을 관람하세요.',
        description: '영국 군주의 공식 거주지',
        detailedDescription: '버킹엄 궁전은 영국 군주의 런던 거주지이자 행정 본부로, 세계에서 가장 인식하기 쉬운 왕권, 국가 권력, 영국 국가 정체성의 상징 중 하나입니다. 웨스트민스터 시에 위치한 이 웅장한 궁전은 여왕의 공식 런던 거주지일 뿐만 아니라 수많은 국가 행사, 왕실 의식 및 공식 접대의 장소로도 사용됩니다. 19개의 국빈실, 52개의 왕실 및 게스트 침실, 188개의 직원 침실, 92개의 사무실, 78개의 욕실을 포함한 775개의 방을 갖춘 버킹엄 궁전은 세계에서 가장 크고 복잡한 현역 궁전 중 하나입니다. 왕실 거주지로서의 역사는 1761년 조지 3세가 샬롯 왕비를 위한 개인 거주지로 버킹엄 하우스(1703년 버킹엄 공작을 위해 건설된 대형 타운하우스)를 취득하면서 시작되었습니다. 1826년 조지 4세가 건축가 존 내시에게 이 구조물을 적절한 왕궁으로 확장하고 재건하도록 의뢰하면서 개인 주택에서 대궁전으로의 변화가 시작되었습니다. 빅토리아 여왕이 1837년 즉위 직후 버킹엄 궁전을 최초로 주요 왕실 거주지로 만들었습니다. 문화적으로 버킹엄 궁전은 영국 군주제를 세계에 제시하는 무대입니다. 방문 팁: 여름 개방 기간(7-9월) 동안 국빈실을 둘러보고, 4월부터 7월까지 거의 매일 열리는 근위병 교대식을 관람하며, 왕실 마구간에서 황금 마차를 구경하고, 궁전 정원을 산책하세요.',
        historicalInfo: '버킹엄 궁전은 1837년부터 영국 군주의 공식 런던 거주지로 사용되었습니다. 원래는 1703년에 버킹엄 공작을 위해 건설된 큰 저택이었습니다.',
        yearBuilt: '원래 저택: 1703년, 궁전 확장: 1826-1837년',
        architect: '윌리엄 윈드 (원래), 존 내시, 에드워드 블로어, 애스턴 웹'
      },
      es: {
        name: 'Palacio de Buckingham',
        narration: 'Este es el Palacio de Buckingham, la residencia londinense del monarca británico. Observe la famosa ceremonia del Cambio de Guardia.',
        description: 'La residencia oficial del monarca británico',
        historicalInfo: 'El Palacio de Buckingham ha servido como residencia oficial londinense de los soberanos del Reino Unido desde 1837. Originalmente era una gran casa señorial construida para el Duque de Buckingham en 1703.',
        yearBuilt: 'Casa original: 1703, Expansión del palacio: 1826-1837',
        architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb'
      },
      fr: {
        name: 'Palais de Buckingham',
        narration: 'Voici le Palais de Buckingham, la résidence londonienne du monarque britannique. Assistez à la célèbre cérémonie de la relève de la garde.',
        description: 'La résidence officielle du monarque britannique',
        historicalInfo: 'Le Palais de Buckingham sert de résidence officielle londonienne des souverains du Royaume-Uni depuis 1837. À l\'origine, c\'était une grande maison de ville construite pour le duc de Buckingham en 1703.',
        yearBuilt: 'Maison originale: 1703, Expansion du palais: 1826-1837',
        architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb'
      },
      de: {
        name: 'Buckingham Palace',
        narration: 'Dies ist der Buckingham Palace, die Londoner Residenz des britischen Monarchen. Beobachten Sie die berühmte Wachablösung.',
        description: 'Die offizielle Residenz des britischen Monarchen',
        historicalInfo: 'Der Buckingham Palace dient seit 1837 als offizielle Londoner Residenz der britischen Monarchen. Ursprünglich war es ein großes Stadthaus, das 1703 für den Herzog von Buckingham gebaut wurde.',
        yearBuilt: 'Ursprüngliches Haus: 1703, Palasterweiterung: 1826-1837',
        architect: 'William Winde (ursprünglich), John Nash, Edward Blore, Aston Webb'
      },
      zh: {
        name: '白金汉宫',
        narration: '这是白金汉宫，英国君主的伦敦住所。观看著名的卫兵换岗仪式。',
        description: '英国君主的官方住所',
        detailedDescription: '白金汉宫是英国君主的伦敦住所和行政总部，是世界上最知名的皇室、国家权力和英国国家认同象征之一。这座位于威斯敏斯特市的宏伟宫殿不仅是女王的官方伦敦住所，也是众多国家活动、皇家仪式和官方招待的场所。白金汉宫拥有775个房间，包括19间国事厅、52间皇室和客房、188间员工卧室、92间办公室和78间浴室，是世界上最大、最复杂的在用宫殿之一。该地作为皇家住所的历史始于1761年，当时乔治三世购买了白金汉宫（1703年为白金汉公爵建造的大型城镇住宅），作为夏洛特王后的私人住所。从私人住宅到宏伟宫殿的转变始于1826年，当时乔治四世委托建筑师约翰·纳什将该建筑扩建并重建为合适的皇宫。纳什雄心勃勃的新古典主义设计创造了一个面向林荫大道的三面庭院，采用巴斯石外墙和宏伟的中央圆顶。维多利亚女王在1837年登基后不久首次将白金汉宫作为主要皇家住所。文化上，白金汉宫是向世界展示英国君主制的舞台。参观提示：在夏季开放期间（7-9月）参观国事厅，观看4月至7月几乎每天举行的卫兵换岗仪式，在皇家马厩欣赏金马车，漫步宫殿花园。',
        historicalInfo: '白金汉宫自1837年以来一直担任英国君主的官方伦敦住所。它最初是1703年为白金汉公爵建造的一座大型城镇住宅。',
        yearBuilt: '原建筑：1703年，宫殿扩建：1826-1837年',
        architect: '威廉·温德（原建筑），约翰·纳什，爱德华·布洛尔，阿斯顿·韦伯'
      },
      ja: {
        name: 'バッキンガム宮殿',
        narration: 'これは英国君主のロンドン邸宅、バッキンガム宮殿です。有名な衛兵交代式をご覧ください。',
        description: '英国君主の公式邸宅',
        detailedDescription: 'バッキンガム宮殿は英国君主のロンドン邸宅および行政本部であり、世界で最も認知度の高い王権、国家権力、イギリス国家アイデンティティの象徴の一つです。ウェストミンスター市に位置するこの壮大な宮殿は、女王の公式ロンドン邸宅としてだけでなく、数多くの国家行事、王室儀式、公式接待の会場としても機能しています。19の国事室、52の王室および客室寝室、188の職員寝室、92のオフィス、78の浴室を含む775の部屋を備えたバッキンガム宮殿は、世界最大かつ最も複雑な現役宮殿の一つです。王室邸宅としての歴史は1761年に始まり、ジョージ3世がシャーロット王妃のための私邸として、1703年にバッキンガム公爵のために建てられた大きなタウンハウス、バッキンガムハウスを取得しました。私邸から壮大な宮殿への変容は1826年に始まり、ジョージ4世が建築家ジョン・ナッシュに、この建造物を適切な王宮として拡張し再建するよう依頼しました。ナッシュの野心的な新古典主義デザインは、バース石のファサードと壮大な中央ドームを特徴とする、ザ・マルに面した三方を囲む中庭を創造しました。ヴィクトリア女王は1837年の即位直後に、初めてバッキンガム宮殿を主要な王室邸宅としました。文化的に、バッキンガム宮殿は世界にイギリス君主制を提示する舞台です。訪問のヒント：夏季開放期間（7-9月）に国事室を見学し、4月から7月までほぼ毎日開催される衛兵交代式を観覧し、王室厩舎で金の馬車を鑑賞し、宮殿庭園を散策してください。',
        historicalInfo: 'バッキンガム宮殿は1837年以来、英国君主の公式ロンドン邸宅として使用されています。元々は1703年にバッキンガム公爵のために建てられた大きなタウンハウスでした。',
        yearBuilt: '元の建物：1703年、宮殿拡張：1826-1837年',
        architect: 'ウィリアム・ウィンド（元の建物）、ジョン・ナッシュ、エドワード・ブロア、アストン・ウェブ'
      },
      pt: {
        name: 'Palácio de Buckingham',
        narration: 'Este é o Palácio de Buckingham, a residência londrina do monarca britânico. Assista à famosa cerimônia da Troca da Guarda.',
        description: 'A residência oficial do monarca britânico',
        historicalInfo: 'O Palácio de Buckingham tem servido como residência oficial londrina dos soberanos do Reino Unido desde 1837. Originalmente era uma grande casa de cidade construída para o Duque de Buckingham em 1703.',
        yearBuilt: 'Casa original: 1703, Expansão do palácio: 1826-1837',
        architect: 'William Winde (original), John Nash, Edward Blore, Aston Webb'
      },
      ru: {
        name: 'Букингемский дворец',
        narration: 'Это Букингемский дворец, лондонская резиденция британского монарха. Посмотрите знаменитую церемонию смены караула.',
        description: 'Официальная резиденция британского монарха',
        historicalInfo: 'Букингемский дворец служит официальной лондонской резиденцией британских монархов с 1837 года. Первоначально это был большой особняк, построенный для герцога Бэкингема в 1703 году.',
        yearBuilt: 'Оригинальный дом: 1703, Расширение дворца: 1826-1837',
        architect: 'Уильям Уинд (оригинал), Джон Нэш, Эдвард Блор, Астон Уэбб'
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
      'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800',
      'https://images.unsplash.com/photo-1568868484-3c8b83b4f3bb?w=800',
      'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=800',
      'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800',
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
      'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800',
      'https://images.unsplash.com/photo-1543715960-e46a9e27bb66?w=800'
    ],
    historicalInfo: 'The London Eye was built to celebrate the millennium and opened to the public in March 2000. It was designed by architects David Marks and Julia Barfield and has become one of London\'s most iconic landmarks.',
    yearBuilt: '1999-2000',
    architect: 'David Marks and Julia Barfield',
    translations: {
      en: {
        name: 'London Eye',
        narration: 'The London Eye is a giant observation wheel offering spectacular views over the city.',
        description: 'Europe\'s tallest cantilevered observation wheel',
        detailedDescription: 'The London Eye, also known as the Millennium Wheel, stands as one of the world\'s most iconic observation wheels and London\'s most popular paid tourist attraction, welcoming over 3.5 million visitors annually to experience breathtaking 360-degree views of the British capital. Rising 135 meters (443 feet) above the South Bank of the River Thames, this engineering marvel has transformed London\'s skyline since its opening in 2000, becoming as synonymous with the city as Big Ben, Tower Bridge, and Buckingham Palace. The London Eye was conceived as part of the millennium celebrations, designed to be a temporary structure that would stand for just five years. However, its immediate popularity and iconic status led to it becoming a permanent fixture of London\'s landscape. The wheel was designed by architects David Marks and Julia Barfield, who won a competition organized by The Sunday Times and the Architecture Foundation to design a landmark to celebrate the new millennium. Their innovative design drew inspiration from the engineering principles of bicycle wheels, creating a cantilevered structure that appears to float effortlessly above the Thames. Construction of the London Eye was an engineering feat of remarkable complexity and ambition. The wheel was constructed in sections, with components manufactured across Europe and transported to London for assembly. The A-frame legs, which support the wheel\'s massive weight, were transported up the Thames on barges and lifted into position by some of Europe\'s largest floating cranes. The wheel itself was assembled horizontally on temporary platforms in the river, then slowly raised to its vertical position over the course of a week in October 1999 using a sophisticated jacking system. The process was so delicate and unprecedented that it captured worldwide attention, with thousands gathering to watch the dramatic tilting of the massive structure. The London Eye consists of 32 sealed and air-conditioned passenger capsules, representing the 32 London boroughs. Interestingly, the capsules are numbered 1 to 33, skipping number 13 for superstitious reasons. Each capsule weighs 10 tons, is built to carry 25 people, and provides unobstructed 360-degree views through its glass construction. The capsules are attached to the external circumference of the wheel and rotate in motorized fashion, maintaining a horizontal position as the wheel turns, ensuring passengers always have an upright viewing platform. A complete rotation takes approximately 30 minutes, moving at a stately pace of 0.9 kilometers per hour (0.6 mph), allowing the wheel to continue moving while passengers board and alight - though it can be stopped for disabled or elderly passengers who need more time. The wheel weighs approximately 2,100 tons, with the rim alone weighing 1,700 tons. It is supported by an A-frame on one side only, making it the world\'s tallest cantilevered observation wheel. This cantilever design, with the wheel supported from one side rather than both, creates the distinctive silhouette that has become so recognizable. The structure requires 1,700 tons of steel and took seven years from conception to completion, at a cost of £75 million. From the top of the London Eye, on a clear day, visitors can see up to 40 kilometers (25 miles) in all directions, encompassing Windsor Castle to the west and the hills of Kent to the south. The views include all of London\'s major landmarks: the Houses of Parliament and Big Ben directly across the river, St. Paul\'s Cathedral\'s distinctive dome, the Tower of London, Tower Bridge, the Shard piercing the sky, and countless other historic and modern buildings that tell the story of London\'s evolution from Roman settlement to global metropolis. The London Eye has become much more than an observation wheel - it serves as a cultural landmark and event venue. The capsules have hosted everything from weddings to business meetings, from yoga sessions to wine tastings. In 2005, one capsule was temporarily converted into a luxury apartment where two competition winners spent the night suspended 135 meters above London. The wheel has been illuminated in various colors to mark significant events: red for Chinese New Year, pink for breast cancer awareness, rainbow colors for Pride, and even the colors of national flags to welcome visiting dignitaries. The London Eye played a central role in London\'s millennium celebrations, with a spectacular fireworks display launched from the wheel itself at midnight on January 1, 2000 - though technical problems meant the wheel wasn\'t actually rotating for passengers until March 2000. Since then, it has become the focal point for London\'s New Year\'s Eve celebrations, with elaborate firework displays launched from the wheel and surrounding area, broadcast to millions worldwide. The wheel has also been featured in numerous films, television shows, and music videos, from the James Bond thriller "Spectre" to the romantic comedy "Bridget Jones\'s Diary," cementing its place in popular culture. Its distinctive circular form has become an instantly recognizable symbol of London, appearing in countless photographs, paintings, and promotional materials for the city. In 2015, the London Eye underwent a major refurbishment, with Coca-Cola becoming the title sponsor, leading to it being officially branded as the "Coca-Cola London Eye" - though most Londoners and visitors continue to call it simply "The London Eye." The refurbishment included new lighting systems using LED technology, creating more dynamic and energy-efficient illumination displays that can change color and pattern for special events. The London Eye pioneered the concept of large-scale observation wheels in major cities, inspiring similar structures worldwide, including the Singapore Flyer, the High Roller in Las Vegas, and the Dubai Eye. However, the London Eye remains unique in its cantilever design and its integration into the urban landscape, positioned to provide optimal views of one of the world\'s most historic cityscapes. The observation wheel has also contributed significantly to the regeneration of London\'s South Bank, which has transformed from an underutilized industrial area into one of London\'s most vibrant cultural quarters. The area now features theaters, galleries, restaurants, and public spaces, with the London Eye serving as the anchor attraction that draws millions of visitors who then explore the surrounding cultural offerings. During the COVID-19 pandemic, the London Eye stood silent for months, its empty capsules a poignant symbol of the tourism industry\'s challenges. However, upon reopening, it implemented new safety measures and private capsule bookings, demonstrating its adaptability and resilience. The pandemic period also saw the wheel illuminated in rainbow colors to honor NHS workers and in other meaningful displays of solidarity and hope. Today, the London Eye stands as a symbol of the turn of the millennium, a monument to engineering ingenuity, and a beloved London landmark that offers both residents and visitors a unique perspective on one of the world\'s great cities. It represents London\'s ability to embrace the new while honoring the old, to innovate while respecting tradition. From its capsules, suspended above the Thames, passengers gain not just a view of London but a new understanding of the city\'s layout, history, and evolution - a 30-minute journey that connects past, present, and future in the most literal and spectacular way possible. The London Eye reminds us that sometimes the best way to appreciate where we are is to step back, rise above, and see the bigger picture.',
        historicalInfo: 'The London Eye was built to celebrate the millennium and opened to the public in March 2000. It was designed by architects David Marks and Julia Barfield and has become one of London\'s most iconic landmarks.',
        yearBuilt: '1999-2000',
        architect: 'David Marks and Julia Barfield'
      },
      it: {
        name: 'London Eye',
        narration: 'Il London Eye è una gigantesca ruota panoramica che offre viste spettacolari sulla città.',
        description: 'La ruota panoramica a sbalzo più alta d\'Europa',
        historicalInfo: 'Il London Eye è stato costruito per celebrare il millennio e aperto al pubblico nel marzo 2000. È stato progettato dagli architetti David Marks e Julia Barfield ed è diventato uno dei monumenti più iconici di Londra.',
        yearBuilt: '1999-2000',
        architect: 'David Marks e Julia Barfield'
      },
      ko: {
        name: '런던 아이',
        narration: '런던 아이는 도시의 멋진 전망을 제공하는 거대한 관람차입니다.',
        description: '유럽에서 가장 높은 캔틸레버 관람차',
        detailedDescription: '밀레니엄 휠로도 알려진 런던 아이는 세계에서 가장 상징적인 관람차 중 하나이자 런던에서 가장 인기 있는 유료 관광 명소로, 매년 350만 명 이상의 방문객이 영국 수도의 숨막히는 360도 전망을 경험하러 옵니다. 템스강 남안 위로 135미터(443피트) 높이로 솟아 있는 이 공학적 경이로움은 2000년 개장 이래 런던의 스카이라인을 변화시켰으며, 빅벤, 타워 브리지, 버킹엄 궁전만큼이나 런던의 상징이 되었습니다. 런던 아이는 밀레니엄 축하의 일환으로 구상되었으며, 단 5년만 서 있을 임시 구조물로 설계되었습니다. 그러나 즉각적인 인기와 상징적 지위로 인해 런던 풍경의 영구적인 고정물이 되었습니다. 이 바퀴는 건축가 데이비드 마크스와 줄리아 바필드가 설계했으며, 그들은 새로운 밀레니엄을 기념할 랜드마크를 설계하기 위해 선데이 타임즈와 건축 재단이 조직한 경쟁에서 우승했습니다. 그들의 혁신적인 디자인은 자전거 바퀴의 공학 원리에서 영감을 받아, 템스강 위에 손쉽게 떠 있는 것처럼 보이는 캔틸레버 구조를 만들었습니다. 방문 팁: 맑은 날 30분 회전 중 최대 40킬로미터까지 볼 수 있으며, 일몰 무렵 방문하여 황금빛 시간대 전망을 즐기고, 특별한 경험을 위해 프라이빗 캡슐을 예약하며, 4D 시네마 경험을 체험하세요.',
        historicalInfo: '런던 아이는 밀레니엄을 기념하기 위해 건설되었으며 2000년 3월에 대중에게 개방되었습니다. 건축가 데이비드 마크스와 줄리아 바필드가 설계했으며 런던의 가장 상징적인 랜드마크 중 하나가 되었습니다.',
        yearBuilt: '1999-2000',
        architect: '데이비드 마크스와 줄리아 바필드'
      },
      es: {
        name: 'London Eye',
        narration: 'El London Eye es una noria gigante que ofrece vistas espectaculares de la ciudad.',
        description: 'La noria en voladizo más alta de Europa',
        historicalInfo: 'El London Eye fue construido para celebrar el milenio y abierto al público en marzo de 2000. Fue diseñado por los arquitectos David Marks y Julia Barfield y se ha convertido en uno de los monumentos más icónicos de Londres.',
        yearBuilt: '1999-2000',
        architect: 'David Marks y Julia Barfield'
      },
      fr: {
        name: 'London Eye',
        narration: 'Le London Eye est une grande roue offrant des vues spectaculaires sur la ville.',
        description: 'La plus haute grande roue en porte-à-faux d\'Europe',
        historicalInfo: 'Le London Eye a été construit pour célébrer le millénaire et ouvert au public en mars 2000. Il a été conçu par les architectes David Marks et Julia Barfield et est devenu l\'un des monuments les plus emblématiques de Londres.',
        yearBuilt: '1999-2000',
        architect: 'David Marks et Julia Barfield'
      },
      de: {
        name: 'London Eye',
        narration: 'Das London Eye ist ein riesiges Riesenrad, das spektakuläre Ausblicke über die Stadt bietet.',
        description: 'Das höchste freitragende Riesenrad Europas',
        historicalInfo: 'Das London Eye wurde zur Feier des Jahrtausendwechsels gebaut und im März 2000 für die Öffentlichkeit eröffnet. Es wurde von den Architekten David Marks und Julia Barfield entworfen und ist zu einem der ikonischsten Wahrzeichen Londons geworden.',
        yearBuilt: '1999-2000',
        architect: 'David Marks und Julia Barfield'
      },
      zh: {
        name: '伦敦眼',
        narration: '伦敦眼是一座巨型摩天轮，可欣赏城市壮观景色。',
        description: '欧洲最高的悬臂式摩天轮',
        detailedDescription: '伦敦眼，也称为千禧轮，是世界上最具标志性的观景轮之一，也是伦敦最受欢迎的付费旅游景点，每年欢迎超过350万游客体验英国首都令人叹为观止的360度全景。这座工程奇迹高耸于泰晤士河南岸上方135米（443英尺），自2000年开放以来改变了伦敦的天际线，与大本钟、塔桥和白金汉宫一样成为伦敦的代名词。伦敦眼作为千禧年庆祝活动的一部分而构思，设计为只矗立五年的临时结构。然而，其即时的受欢迎程度和标志性地位使其成为伦敦景观的永久性固定装置。摩天轮由建筑师大卫·马克斯和朱莉娅·巴菲尔德设计，他们赢得了由《星期日泰晤士报》和建筑基金会组织的竞赛，旨在设计一个庆祝新千年的地标。他们的创新设计从自行车轮的工程原理中汲取灵感，创造了一个看似毫不费力地漂浮在泰晤士河上的悬臂结构。伦敦眼的建设是一项复杂而雄心勃勃的工程壮举。摩天轮分段建造，组件在整个欧洲制造并运往伦敦组装。参观提示：在晴朗的日子里，30分钟的旋转可以看到最远40公里的景色，在日落时分访问以获得黄金时段的景色，为特殊体验预订私人舱，体验4D电影体验。',
        historicalInfo: '伦敦眼是为庆祝千禧年而建，于2000年3月向公众开放。它由建筑师大卫·马克斯和朱莉娅·巴菲尔德设计，已成为伦敦最具标志性的地标之一。',
        yearBuilt: '1999-2000',
        architect: '大卫·马克斯和朱莉娅·巴菲尔德'
      },
      ja: {
        name: 'ロンドン・アイ',
        narration: 'ロンドン・アイは、街の素晴らしい景色を提供する巨大な観覧車です。',
        description: 'ヨーロッパで最も高い片持ち式観覧車',
        detailedDescription: 'ミレニアム・ホイールとしても知られるロンドン・アイは、世界で最も象徴的な観覧車の一つであり、ロンドンで最も人気のある有料観光名所で、毎年350万人以上の訪問者が英国首都の息をのむような360度の景色を体験するために訪れます。テムズ川のサウスバンクの上135メートル（443フィート）にそびえ立つこの工学の驚異は、2000年の開業以来ロンドンのスカイラインを変え、ビッグ・ベン、タワーブリッジ、バッキンガム宮殿と同様にこの都市の代名詞となっています。ロンドン・アイはミレニアム祝賀の一環として構想され、わずか5年間立つ一時的な構造物として設計されました。しかし、その即座の人気と象徴的な地位により、ロンドンの景観の恒久的な固定物となりました。この観覧車は建築家デイビッド・マークスとジュリア・バーフィールドによって設計され、彼らは新しいミレニアムを祝うランドマークを設計するためにサンデー・タイムズと建築財団が主催したコンペティションで優勝しました。彼らの革新的なデザインは自転車の車輪の工学原理からインスピレーションを得て、テムズ川の上に楽々と浮かんでいるように見える片持ち式構造を創り出しました。ロンドン・アイの建設は、驚くべき複雑さと野心の工学的偉業でした。訪問のヒント：晴れた日には30分の回転中に最大40キロメートルまで見渡せます、夕暮れ時に訪れてゴールデンアワーの景色を楽しみ、特別な体験のためにプライベートカプセルを予約し、4Dシネマ体験を体験してください。',
        historicalInfo: 'ロンドン・アイはミレニアムを祝うために建設され、2000年3月に一般公開されました。建築家デイビッド・マークスとジュリア・バーフィールドによって設計され、ロンドンで最も象徴的なランドマークの1つとなりました。',
        yearBuilt: '1999-2000',
        architect: 'デイビッド・マークスとジュリア・バーフィールド'
      },
      pt: {
        name: 'London Eye',
        narration: 'O London Eye é uma roda-gigante que oferece vistas espetaculares sobre a cidade.',
        description: 'A roda-gigante em balanço mais alta da Europa',
        historicalInfo: 'O London Eye foi construído para celebrar o milênio e aberto ao público em março de 2000. Foi projetado pelos arquitetos David Marks e Julia Barfield e se tornou um dos marcos mais icônicos de Londres.',
        yearBuilt: '1999-2000',
        architect: 'David Marks e Julia Barfield'
      },
      ru: {
        name: 'Лондонский глаз',
        narration: 'Лондонский глаз - это гигантское колесо обозрения, откуда открываются захватывающие виды на город.',
        description: 'Самое высокое консольное колесо обозрения в Европе',
        historicalInfo: 'Лондонский глаз был построен в честь празднования миллениума и открыт для публики в марте 2000 года. Он был спроектирован архитекторами Дэвидом Марксом и Джулией Барфилд и стал одной из самых знаковых достопримечательностей Лондона.',
        yearBuilt: '1999-2000',
        architect: 'Дэвид Маркс и Джулия Барфилд'
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
