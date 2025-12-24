import { type Landmark } from "@shared/schema";

export const RESTAURANTS: Landmark[] = [
  // Rome restaurants (6)
  {
    id: 'rome_restaurant_armando_al_pantheon',
    cityId: 'rome',
    name: 'Armando al Pantheon',
    lat: 41.8986,
    lng: 12.4769,
    radius: 40,
    narration: 'Experience authentic Roman cuisine at Armando al Pantheon, a family-run trattoria serving traditional dishes since 1961.',
    description: 'Historic family trattoria near the Pantheon',
    category: 'Restaurant',
    detailedDescription: 'Located just steps from the Pantheon, Armando al Pantheon is a beloved Roman institution that has been serving authentic Roman cuisine since 1961. This family-run trattoria is famous for its classic dishes like cacio e pepe, carbonara, and amatriciana, all prepared according to traditional recipes passed down through generations. The intimate dining room features checkered tablecloths and walls adorned with photos of celebrity guests. The menu changes daily based on seasonal ingredients from local markets. Reservations are essential as this small trattoria fills up quickly with both locals and food enthusiasts who appreciate genuine Roman cooking.',
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800'
    ],
    historicalInfo: 'Founded in 1961 by Armando Gargioli, this restaurant has become a landmark of Roman culinary tradition.',
    yearBuilt: '1961',
    architect: 'Gargioli family',
    openingHours: 'Tue-Sat: 12:30-15:00, 19:30-23:00 | Closed Sun-Mon',
    priceRange: '€€€ (€40-60 per person)',
    cuisine: 'Traditional Roman',
    reservationUrl: 'https://www.thefork.com/restaurant/armando-al-pantheon-r44759',
    phoneNumber: '+39 06 6880 3034',
    menuHighlights: ['Cacio e Pepe', 'Carbonara', 'Amatriciana', 'Carciofi alla Romana', 'Saltimbocca'],
    translations: {
      en: {
        name: 'Armando al Pantheon',
        narration: 'Experience authentic Roman cuisine at Armando al Pantheon, a family-run trattoria serving traditional dishes since 1961.',
        description: 'Historic family trattoria near the Pantheon',
        detailedDescription: 'Located just steps from the Pantheon, Armando al Pantheon is a beloved Roman institution that has been serving authentic Roman cuisine since 1961. This family-run trattoria is famous for its classic dishes like cacio e pepe, carbonara, and amatriciana, all prepared according to traditional recipes passed down through generations. The intimate dining room features checkered tablecloths and walls adorned with photos of celebrity guests. The menu changes daily based on seasonal ingredients from local markets. Reservations are essential as this small trattoria fills up quickly with both locals and food enthusiasts who appreciate genuine Roman cooking.',
        historicalInfo: 'Founded in 1961 by Armando Gargioli, this restaurant has become a landmark of Roman culinary tradition.',
        yearBuilt: '1961',
        architect: 'Gargioli family'
      },
      ko: {
        name: '아르만도 알 판테온',
        narration: '1961년부터 전통 요리를 제공하는 가족 운영 트라토리아, 아르만도 알 판테온에서 정통 로마 요리를 경험하세요.',
        description: '판테온 근처의 역사적인 가족 트라토리아',
        detailedDescription: '판테온에서 몇 걸음 떨어진 곳에 위치한 아르만도 알 판테온은 1961년부터 정통 로마 요리를 제공해온 사랑받는 로마 명소입니다. 이 가족 운영 트라토리아는 카치오 에 페페, 카르보나라, 아마트리치아나와 같은 클래식 요리로 유명하며, 모두 대대로 전해 내려온 전통 레시피에 따라 준비됩니다. 아늑한 식당에는 체크무늬 테이블보와 유명인 손님들의 사진이 장식된 벽이 있습니다. 메뉴는 현지 시장의 제철 재료를 기반으로 매일 바뀝니다. 이 작은 트라토리아는 진정한 로마 요리를 감상하는 현지인과 음식 애호가들로 빠르게 채워지므로 예약이 필수입니다.',
        historicalInfo: '1961년 아르만도 가르지올리가 설립한 이 레스토랑은 로마 요리 전통의 랜드마크가 되었습니다.',
        yearBuilt: '1961년',
        architect: '가르지올리 가족'
      },
      it: {
        name: 'Armando al Pantheon',
        narration: 'Vivi la cucina romana autentica da Armando al Pantheon, una trattoria a conduzione familiare che serve piatti tradizionali dal 1961.',
        description: 'Storica trattoria familiare vicino al Pantheon',
        detailedDescription: 'Situata a pochi passi dal Pantheon, Armando al Pantheon è un\'istituzione romana amata che serve cucina romana autentica dal 1961. Questa trattoria a conduzione familiare è famosa per i suoi piatti classici come cacio e pepe, carbonara e amatriciana, tutti preparati secondo ricette tradizionali tramandate di generazione in generazione. La sala da pranzo intima presenta tovaglie a quadretti e pareti adornate con foto di ospiti famosi. Il menu cambia quotidianamente in base agli ingredienti stagionali dei mercati locali. Le prenotazioni sono essenziali poiché questa piccola trattoria si riempie rapidamente sia con i locali che con gli appassionati di cibo che apprezzano la vera cucina romana.',
        historicalInfo: 'Fondata nel 1961 da Armando Gargioli, questo ristorante è diventato un punto di riferimento della tradizione culinaria romana.',
        yearBuilt: '1961',
        architect: 'Famiglia Gargioli'
      },
      es: {
        name: 'Armando al Pantheon',
        narration: 'Experimenta la auténtica cocina romana en Armando al Pantheon, una trattoria familiar que sirve platos tradicionales desde 1961.',
        description: 'Histórica trattoria familiar cerca del Panteón',
        detailedDescription: 'Ubicada a pocos pasos del Panteón, Armando al Pantheon es una querida institución romana que sirve auténtica cocina romana desde 1961. Esta trattoria familiar es famosa por sus platos clásicos como cacio e pepe, carbonara y amatriciana, todos preparados según recetas tradicionales transmitidas de generación en generación. El íntimo comedor presenta manteles a cuadros y paredes adornadas con fotos de invitados célebres. El menú cambia diariamente según los ingredientes de temporada de los mercados locales. Las reservas son esenciales ya que esta pequeña trattoria se llena rápidamente con locales y entusiastas de la comida que aprecian la verdadera cocina romana.'
      },
      fr: {
        name: 'Armando al Pantheon',
        narration: 'Découvrez la cuisine romaine authentique chez Armando al Pantheon, une trattoria familiale servant des plats traditionnels depuis 1961.',
        description: 'Trattoria familiale historique près du Panthéon',
        detailedDescription: 'Située à quelques pas du Panthéon, Armando al Pantheon est une institution romaine bien-aimée servant une cuisine romaine authentique depuis 1961. Cette trattoria familiale est célèbre pour ses plats classiques comme le cacio e pepe, la carbonara et l\'amatriciana, tous préparés selon des recettes traditionnelles transmises de génération en génération. La salle à manger intime présente des nappes à carreaux et des murs ornés de photos de célébrités. Le menu change quotidiennement en fonction des ingrédients de saison des marchés locaux. Les réservations sont essentielles car cette petite trattoria se remplit rapidement avec des locaux et des passionnés de cuisine qui apprécient la vraie cuisine romaine.'
      },
      de: {
        name: 'Armando al Pantheon',
        narration: 'Erleben Sie authentische römische Küche im Armando al Pantheon, einer familiengeführten Trattoria, die seit 1961 traditionelle Gerichte serviert.',
        description: 'Historische Familientrattoria nahe dem Pantheon',
        detailedDescription: 'Nur wenige Schritte vom Pantheon entfernt liegt Armando al Pantheon, eine beliebte römische Institution, die seit 1961 authentische römische Küche serviert. Diese familiengeführte Trattoria ist berühmt für ihre klassischen Gerichte wie Cacio e Pepe, Carbonara und Amatriciana, alle nach traditionellen Rezepten zubereitet, die von Generation zu Generation weitergegeben wurden. Der intime Speisesaal präsentiert karierte Tischdecken und mit Prominentenfotos geschmückte Wände. Die Speisekarte wechselt täglich basierend auf saisonalen Zutaten von lokalen Märkten. Reservierungen sind unerlässlich, da diese kleine Trattoria schnell von Einheimischen und Feinschmeckern gefüllt wird, die echte römische Küche schätzen.'
      },
      zh: {
        name: 'Armando al Pantheon',
        narration: '在Armando al Pantheon体验正宗的罗马美食，这是一家自1961年以来提供传统菜肴的家族经营餐厅。',
        description: '万神殿附近的历史悠久的家族餐厅',
        detailedDescription: '位于万神殿几步之遥的Armando al Pantheon是一家深受喜爱的罗马餐厅，自1961年以来一直提供正宗的罗马美食。这家家族经营的餐厅以其经典菜肴而闻名，如cacio e pepe、carbonara和amatriciana，所有菜肴都按照代代相传的传统食谱制作。温馨的用餐室配有格子桌布，墙上装饰着名人宾客的照片。菜单根据当地市场的时令食材每日更换。由于这家小餐厅很快就会被当地人和美食爱好者填满，预订是必不可少的。'
      },
      ja: {
        name: 'Armando al Pantheon',
        narration: '1961年から伝統料理を提供している家族経営のトラットリア、Armando al Pantheonで本格的なローマ料理をお楽しみください。',
        description: 'パンテオン近くの歴史ある家族経営トラットリア',
        detailedDescription: 'パンテオンからわずか数歩のところにあるArmando al Pantheonは、1961年から本格的なローマ料理を提供している愛されるローマの名店です。この家族経営のトラットリアは、カチョ・エ・ペペ、カルボナーラ、アマトリチャーナなどのクラシックな料理で有名で、すべて何世代にもわたって受け継がれてきた伝統的なレシピで調理されています。親密なダイニングルームには、チェック柄のテーブルクロスと著名なゲストの写真で飾られた壁があります。メニューは地元市場の旬の食材に基づいて毎日変わります。この小さなトラットリアは、本物のローマ料理を高く評価する地元の人々や美食家ですぐにいっぱいになるため、予約は必須です。'
      },
      pt: {
        name: 'Armando al Pantheon',
        narration: 'Experimente a autêntica cozinha romana no Armando al Pantheon, uma trattoria familiar que serve pratos tradicionais desde 1961.',
        description: 'Histórica trattoria familiar perto do Panteão',
        detailedDescription: 'Localizada a poucos passos do Panteão, Armando al Pantheon é uma querida instituição romana que serve autêntica cozinha romana desde 1961. Esta trattoria familiar é famosa por seus pratos clássicos como cacio e pepe, carbonara e amatriciana, todos preparados de acordo com receitas tradicionais passadas de geração em geração. A sala de jantar íntima apresenta toalhas de mesa xadrez e paredes adornadas com fotos de convidados célebres. O menu muda diariamente com base em ingredientes sazonais dos mercados locais. As reservas são essenciais, pois esta pequena trattoria se enche rapidamente com locais e entusiastas da gastronomia que apreciam a verdadeira cozinha romana.'
      },
      ru: {
        name: 'Armando al Pantheon',
        narration: 'Насладитесь подлинной римской кухней в Armando al Pantheon — семейной траттории, которая подает традиционные блюда с 1961 года.',
        description: 'Историческая семейная траттория рядом с Пантеоном',
        detailedDescription: 'Расположенный в нескольких шагах от Пантеона, Armando al Pantheon — это любимое римское заведение, которое подает аутентичную римскую кухню с 1961 года. Эта семейная траттория славится своими классическими блюдами, такими как качо э пепе, карбонара и аматричиана, приготовленными по традиционным рецептам, передаваемым из поколения в поколение. Уютный обеденный зал украшен клетчатыми скатертями и фотографиями знаменитых гостей на стенах. Меню меняется ежедневно в зависимости от сезонных ингредиентов с местных рынков. Бронирование необходимо, так как эта маленькая траттория быстро заполняется местными жителями и гурманами, ценящими настоящую римскую кухню.'
      }
    }
  },
  {
    id: 'rome_restaurant_roscioli',
    cityId: 'rome',
    name: 'Roscioli',
    lat: 41.8947,
    lng: 12.4720,
    radius: 40,
    narration: 'Discover Roscioli, a gourmet deli and restaurant offering exceptional Roman cuisine and an extensive wine selection.',
    description: 'Gourmet deli and restaurant with Italian delicacies',
    category: 'Restaurant',
    detailedDescription: 'Roscioli combines a gourmet deli with a sophisticated restaurant in the heart of Rome. Known for its exceptional selection of Italian cheeses, cured meats, and wines, this establishment offers a unique dining experience. The restaurant menu features creative takes on traditional Roman dishes using the finest ingredients. The wine list is extensive with over 300 labels. The intimate dining room creates a warm atmosphere perfect for food lovers seeking authentic Italian flavors.',
    photos: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      'https://images.unsplash.com/photo-1587899897387-091ebd01a6b2?w=800'
    ],
    openingHours: 'Mon-Sat: 12:30-16:00, 19:00-midnight | Closed Sun',
    priceRange: '€€€€ (€60-90 per person)',
    cuisine: 'Contemporary Roman',
    reservationUrl: 'https://www.thefork.com/restaurant/roscioli-r44801',
    phoneNumber: '+39 06 687 5287',
    menuHighlights: ['Burrata', 'Truffle Pasta', 'Aged Prosciutto', 'Cheese Selection', 'Tiramisu'],
    translations: {
      en: { name: 'Roscioli', narration: 'Discover Roscioli, a gourmet deli and restaurant offering exceptional Roman cuisine and an extensive wine selection.', description: 'Gourmet deli and restaurant with Italian delicacies', detailedDescription: 'Roscioli combines a gourmet deli with a sophisticated restaurant in the heart of Rome. Known for its exceptional selection of Italian cheeses, cured meats, and wines, this establishment offers a unique dining experience. The restaurant menu features creative takes on traditional Roman dishes using the finest ingredients. The wine list is extensive with over 300 labels. The intimate dining room creates a warm atmosphere perfect for food lovers seeking authentic Italian flavors.' },
      ko: { name: '로쇼리', narration: '특별한 로마 요리와 광범위한 와인 셀렉션을 제공하는 미식 델리 겸 레스토랑 로쇼리를 발견하세요.', description: '이탈리아 별미를 제공하는 미식 델리 겸 레스토랑', detailedDescription: '로쇼리는 로마의 중심부에서 고급 델리와 세련된 레스토랑을 결합합니다. 이탈리아 치즈, 절인 고기, 와인의 뛰어난 선택으로 유명한 이 곳은 독특한 다이닝 경험을 제공합니다. 레스토랑 메뉴는 최고급 재료를 사용하여 전통적인 로마 요리에 창의적인 변화를 제공합니다. 와인 리스트는 300개 이상의 라벨로 광범위합니다. 친밀한 식당은 정통 이탈리아 맛을 찾는 음식 애호가에게 완벽한 따뜻한 분위기를 조성합니다.' },
      it: { name: 'Roscioli', narration: 'Scopri Roscioli, una gastronomia gourmet e ristorante che offre cucina romana eccezionale e un\'ampia selezione di vini.', description: 'Gastronomia gourmet e ristorante con prelibatezze italiane', detailedDescription: 'Roscioli combina una gastronomia gourmet con un ristorante sofisticato nel cuore di Roma. Noto per la sua eccezionale selezione di formaggi italiani, salumi e vini, questo locale offre un\'esperienza culinaria unica. Il menu del ristorante propone interpretazioni creative dei piatti tradizionali romani utilizzando i migliori ingredienti. La lista dei vini è ampia con oltre 300 etichette. La sala da pranzo intima crea un\'atmosfera calda perfetta per gli amanti del cibo alla ricerca di sapori italiani autentici.' },
      es: { name: 'Roscioli', narration: 'Descubre Roscioli, un deli gourmet y restaurante que ofrece excepcional cocina romana y una extensa selección de vinos.', description: 'Deli gourmet y restaurante con delicias italianas', detailedDescription: 'Roscioli combina un deli gourmet con un sofisticado restaurante en el corazón de Roma. Conocido por su excepcional selección de quesos italianos, embutidos y vinos, este establecimiento ofrece una experiencia gastronómica única. El menú del restaurante presenta versiones creativas de platos romanos tradicionales utilizando los mejores ingredientes. La carta de vinos es extensa con más de 300 etiquetas. El íntimo comedor crea una atmósfera cálida perfecta para los amantes de la comida que buscan auténticos sabores italianos.' },
      fr: { name: 'Roscioli', narration: 'Découvrez Roscioli, une épicerie fine et restaurant offrant une cuisine romaine exceptionnelle et une vaste sélection de vins.', description: 'Épicerie fine et restaurant avec délices italiennes', detailedDescription: 'Roscioli combine une épicerie fine avec un restaurant sophistiqué au cœur de Rome. Réputé pour sa sélection exceptionnelle de fromages italiens, charcuteries et vins, cet établissement offre une expérience culinaire unique. Le menu du restaurant propose des interprétations créatives de plats romains traditionnels utilisant les meilleurs ingrédients. La carte des vins est vaste avec plus de 300 références. La salle à manger intime crée une atmosphère chaleureuse parfaite pour les amateurs de cuisine à la recherche de saveurs italiennes authentiques.' },
      de: { name: 'Roscioli', narration: 'Entdecken Sie Roscioli, ein Gourmet-Delikatessenladen und Restaurant, das außergewöhnliche römische Küche und eine umfangreiche Weinauswahl bietet.', description: 'Gourmet-Delikatessen und Restaurant mit italienischen Köstlichkeiten', detailedDescription: 'Roscioli vereint ein Gourmet-Delikatessengeschäft mit einem anspruchsvollen Restaurant im Herzen Roms. Bekannt für seine außergewöhnliche Auswahl an italienischen Käsesorten, Aufschnitt und Weinen, bietet dieses Lokal ein einzigartiges kulinarisches Erlebnis. Die Speisekarte des Restaurants bietet kreative Interpretationen traditioneller römischer Gerichte mit den besten Zutaten. Die Weinkarte ist umfangreich mit über 300 Etiketten. Der intime Speisesaal schafft eine warme Atmosphäre, perfekt für Feinschmecker auf der Suche nach authentischen italienischen Aromen.' },
      zh: { name: 'Roscioli', narration: '探索Roscioli，一家提供出色罗马美食和丰富葡萄酒选择的美食熟食店和餐厅。', description: '提供意大利美味的美食熟食店和餐厅', detailedDescription: 'Roscioli将美食熟食店与精致餐厅结合在罗马市中心。以其出色的意大利奶酪、腌肉和葡萄酒选择而闻名，这家餐厅提供独特的用餐体验。餐厅菜单使用最优质的食材，对传统罗马菜肴进行创意诠释。葡萄酒单非常丰富，拥有超过300个品牌。亲密的用餐室营造出温馨的氛围，非常适合寻求正宗意大利风味的美食爱好者。' },
      ja: { name: 'Roscioli', narration: '卓越したローマ料理と豊富なワインセレクションを提供するグルメデリ兼レストラン、Roscioliをご発見ください。', description: 'イタリアの珍味を提供するグルメデリ兼レストラン', detailedDescription: 'Roscioliはローマの中心部でグルメデリと洗練されたレストランを組み合わせています。イタリアンチーズ、生ハム、ワインの卓越したセレクションで知られるこの店は、ユニークなダイニング体験を提供します。レストランのメニューは、最高級の食材を使用して伝統的なローマ料理に創造的なアレンジを加えています。ワインリストは300以上のラベルと豊富です。親密なダイニングルームは、本格的なイタリアの味を求める食通に最適な温かい雰囲気を作り出しています。' },
      pt: { name: 'Roscioli', narration: 'Descubra o Roscioli, um deli gourmet e restaurante que oferece excepcional cozinha romana e uma extensa seleção de vinhos.', description: 'Deli gourmet e restaurante com delícias italianas', detailedDescription: 'Roscioli combina um deli gourmet com um restaurante sofisticado no coração de Roma. Conhecido por sua excepcional seleção de queijos italianos, embutidos e vinhos, este estabelecimento oferece uma experiência gastronômica única. O menu do restaurante apresenta versões criativas de pratos romanos tradicionais usando os melhores ingredientes. A carta de vinhos é extensa com mais de 300 rótulos. A sala de jantar íntima cria uma atmosfera acolhedora perfeita para amantes da gastronomia em busca de sabores italianos autênticos.' },
      ru: { name: 'Roscioli', narration: 'Откройте для себя Roscioli — гастрономический деликатесный магазин и ресторан, предлагающий исключительную римскую кухню и обширный выбор вин.', description: 'Гурманский деликатесный магазин и ресторан с итальянскими деликатесами', detailedDescription: 'Roscioli сочетает в себе гастрономический деликатесный магазин и изысканный ресторан в самом сердце Рима. Известный своим исключительным выбором итальянских сыров, мясных деликатесов и вин, это заведение предлагает уникальный гастрономический опыт. В меню ресторана представлены творческие интерпретации традиционных римских блюд с использованием лучших ингредиентов. Винная карта обширна и насчитывает более 300 наименований. Уютный обеденный зал создает теплую атмосферу, идеально подходящую для гурманов, ищущих подлинные итальянские вкусы.' }
    }
  },
  {
    id: 'rome_restaurant_la_pergola',
    cityId: 'rome',
    name: 'La Pergola',
    lat: 41.9171,
    lng: 12.4507,
    radius: 40,
    narration: 'Experience Rome\'s only 3 Michelin star restaurant, La Pergola, offering breathtaking views and exquisite haute cuisine.',
    description: 'Three Michelin star fine dining with panoramic views',
    category: 'Restaurant',
    detailedDescription: 'Perched atop the Rome Cavalieri Hotel, La Pergola is Rome\'s only three-Michelin-starred restaurant. Chef Heinz Beck creates innovative Mediterranean cuisine that combines traditional Italian ingredients with modern techniques. The dining room offers spectacular panoramic views of Rome. The wine cellar houses over 60,000 bottles. Service is impeccable and the tasting menus are works of culinary art. Reservations required weeks in advance.',
    photos: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=800'
    ],
    openingHours: 'Tue-Sat: 19:30-22:30 | Closed Sun-Mon',
    priceRange: '€€€€€ (€200+ per person)',
    cuisine: 'Fine Dining Mediterranean',
    reservationUrl: 'https://www.romecavalieri.com/dining/la-pergola/',
    phoneNumber: '+39 06 3509 2152',
    menuHighlights: ['Fagottelli', 'Red Shrimp', 'Lamb', 'Chocolate Souffle'],
    translations: {
      en: { name: 'La Pergola', narration: 'Experience Rome\'s only 3 Michelin star restaurant, La Pergola, offering breathtaking views and exquisite haute cuisine.', description: 'Three Michelin star fine dining with panoramic views', detailedDescription: 'Perched atop the Rome Cavalieri Hotel, La Pergola is Rome\'s only three-Michelin-starred restaurant. Chef Heinz Beck creates innovative Mediterranean cuisine that combines traditional Italian ingredients with modern techniques. The dining room offers spectacular panoramic views of Rome. The wine cellar houses over 60,000 bottles. Service is impeccable and the tasting menus are works of culinary art. Reservations required weeks in advance.' },
      ko: { name: '라 페르골라', narration: '로마의 유일한 미슐랭 3스타 레스토랑 라 페르골라에서 숨막히는 전망과 정교한 오뜨 퀴진을 경험하세요.', description: '파노라마 뷰를 갖춘 미슐랭 3스타 파인 다이닝', detailedDescription: '로마 카발리에리 호텔 꼭대기에 위치한 라 페르골라는 로마의 유일한 미슐랭 3스타 레스토랑입니다. 하인츠 벡 셰프는 전통 이탈리아 식재료와 현대적 기법을 결합한 혁신적인 지중해 요리를 선보입니다. 식당에서는 로마의 장관적인 파노라마 전망을 제공합니다. 와인 셀러에는 60,000병 이상의 와인이 보관되어 있습니다. 서비스는 완벽하며 테이스팅 메뉴는 요리 예술 작품입니다. 예약은 몇 주 전에 필요합니다.' },
      it: { name: 'La Pergola', narration: 'Vivi l\'unico ristorante 3 stelle Michelin di Roma, La Pergola, che offre viste mozzafiato e alta cucina squisita.', description: 'Fine dining tre stelle Michelin con vista panoramica', detailedDescription: 'Situato in cima al Rome Cavalieri Hotel, La Pergola è l\'unico ristorante tre stelle Michelin di Roma. Lo chef Heinz Beck crea una cucina mediterranea innovativa che combina ingredienti tradizionali italiani con tecniche moderne. La sala da pranzo offre viste panoramiche spettacolari su Roma. La cantina ospita oltre 60.000 bottiglie. Il servizio è impeccabile e i menu degustazione sono opere d\'arte culinaria. Prenotazioni necessarie con settimane di anticipo.' },
      es: { name: 'La Pergola', narration: 'Experimente el único restaurante de 3 estrellas Michelin de Roma, La Pergola, que ofrece vistas impresionantes y exquisita alta cocina.', description: 'Alta cocina con tres estrellas Michelin y vistas panorámicas', detailedDescription: 'Situado en lo alto del hotel Rome Cavalieri, La Pergola es el único restaurante con tres estrellas Michelin de Roma. El chef Heinz Beck crea cocina mediterránea innovadora que combina ingredientes tradicionales italianos con técnicas modernas. El comedor ofrece espectaculares vistas panorámicas de Roma. La bodega alberga más de 60,000 botellas. El servicio es impecable y los menús de degustación son obras de arte culinario. Se requieren reservas con semanas de anticipación.' },
      fr: { name: 'La Pergola', narration: 'Découvrez le seul restaurant 3 étoiles Michelin de Rome, La Pergola, offrant des vues à couper le souffle et une haute cuisine exquise.', description: 'Gastronomie trois étoiles Michelin avec vue panoramique', detailedDescription: 'Perché au sommet de l\'hôtel Rome Cavalieri, La Pergola est le seul restaurant trois étoiles Michelin de Rome. Le chef Heinz Beck crée une cuisine méditerranéenne innovante qui combine des ingrédients italiens traditionnels avec des techniques modernes. La salle à manger offre des vues panoramiques spectaculaires sur Rome. La cave abrite plus de 60 000 bouteilles. Le service est impeccable et les menus dégustation sont des œuvres d\'art culinaire. Réservations nécessaires plusieurs semaines à l\'avance.' },
      de: { name: 'La Pergola', narration: 'Erleben Sie Roms einziges 3-Sterne-Michelin-Restaurant La Pergola mit atemberaubenden Ausblicken und exquisiter Haute Cuisine.', description: 'Drei-Sterne-Michelin Fine Dining mit Panoramablick', detailedDescription: 'Auf dem Dach des Rome Cavalieri Hotels gelegen, ist La Pergola das einzige Drei-Sterne-Michelin-Restaurant Roms. Küchenchef Heinz Beck kreiert innovative mediterrane Küche, die traditionelle italienische Zutaten mit modernen Techniken verbindet. Der Speisesaal bietet spektakuläre Panoramablicke auf Rom. Der Weinkeller beherbergt über 60.000 Flaschen. Der Service ist makellos und die Degustationsmenüs sind kulinarische Kunstwerke. Reservierungen müssen Wochen im Voraus erfolgen.' },
      zh: { name: 'La Pergola', narration: '体验罗马唯一的米其林三星餐厅La Pergola，享受令人叹为观止的景色和精致的高级料理。', description: '拥有全景视野的米其林三星精致餐厅', detailedDescription: 'La Pergola位于罗马骑士酒店的顶层，是罗马唯一的米其林三星餐厅。主厨Heinz Beck创造了创新的地中海美食，将传统意大利食材与现代技术相结合。餐厅提供壮观的罗马全景。酒窖收藏超过60,000瓶葡萄酒。服务无可挑剔，品鉴菜单是烹饪艺术品。需提前数周预订。' },
      ja: { name: 'La Pergola', narration: 'ローマ唯一のミシュラン三つ星レストラン、La Pergolaで息を呑むような景色と絶品のオートキュイジーヌをご体験ください。', description: 'パノラマビューを備えたミシュラン三つ星ファインダイニング', detailedDescription: 'ローマ・カヴァリエリ・ホテルの最上階に位置するLa Pergolaは、ローマ唯一のミシュラン三つ星レストランです。シェフのハインツ・ベックは、伝統的なイタリア食材と現代的な技法を組み合わせた革新的な地中海料理を創り出しています。ダイニングルームからはローマの壮大なパノラマビューが楽しめます。ワインセラーには60,000本以上のボトルが収蔵されています。サービスは完璧で、テイスティングメニューは料理芸術の作品です。予約は数週間前に必要です。' },
      pt: { name: 'La Pergola', narration: 'Experimente o único restaurante 3 estrelas Michelin de Roma, La Pergola, oferecendo vistas deslumbrantes e requintada alta cozinha.', description: 'Alta gastronomia três estrelas Michelin com vista panorâmica', detailedDescription: 'Situado no topo do hotel Rome Cavalieri, La Pergola é o único restaurante três estrelas Michelin de Roma. O chef Heinz Beck cria uma cozinha mediterrânea inovadora que combina ingredientes tradicionais italianos com técnicas modernas. A sala de jantar oferece espetaculares vistas panorâmicas de Roma. A adega abriga mais de 60.000 garrafas. O serviço é impecável e os menus de degustação são obras de arte culinária. Reservas necessárias com semanas de antecedência.' },
      ru: { name: 'La Pergola', narration: 'Посетите единственный трёхзвездочный ресторан Мишлен в Риме — La Pergola, предлагающий захватывающие виды и изысканную высокую кухню.', description: 'Трёхзвездочный ресторан Мишлен с панорамными видами', detailedDescription: 'Расположенный на крыше отеля Rome Cavalieri, La Pergola — единственный трёхзвездочный ресторан Мишлен в Риме. Шеф-повар Хайнц Бек создает инновационную средиземноморскую кухню, сочетающую традиционные итальянские ингредиенты с современными техниками. Обеденный зал предлагает впечатляющие панорамные виды на Рим. Винный погреб вмещает более 60 000 бутылок. Обслуживание безупречное, а дегустационные меню — произведения кулинарного искусства. Бронирование необходимо за несколько недель.' }
    }
  },
  {
    id: 'rome_restaurant_da_enzo',
    cityId: 'rome',
    name: 'Da Enzo al 29',
    lat: 41.8868,
    lng: 12.4689,
    radius: 40,
    narration: 'Enjoy authentic Trastevere dining at Da Enzo, a beloved local trattoria serving traditional Roman dishes.',
    description: 'Authentic Trastevere trattoria',
    category: 'Restaurant',
    detailedDescription: 'Da Enzo al 29 is a small, family-run trattoria in the heart of Trastevere that embodies authentic Roman cooking. The menu features daily specials based on market-fresh ingredients. Known for generous portions and warm hospitality, this no-frills eatery is popular with locals and informed tourists alike. The cozy interior with wooden tables and the friendly atmosphere make it feel like dining at a Roman friend\'s home.',
    photos: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
    ],
    openingHours: 'Mon-Sat: 12:30-15:00, 19:30-23:00 | Closed Sun',
    priceRange: '€€ (€25-40 per person)',
    cuisine: 'Traditional Roman',
    reservationUrl: 'https://www.thefork.com/restaurant/da-enzo-29-r43287',
    phoneNumber: '+39 06 581 2260',
    menuHighlights: ['Carciofi alla Giudia', 'Rigatoni Pajata', 'Abbacchio', 'Puntarelle'],
    translations: {
      en: { name: 'Da Enzo al 29', narration: 'Enjoy authentic Trastevere dining at Da Enzo, a beloved local trattoria serving traditional Roman dishes.', description: 'Authentic Trastevere trattoria', detailedDescription: 'Da Enzo al 29 is a small, family-run trattoria in the heart of Trastevere that embodies authentic Roman cooking. The menu features daily specials based on market-fresh ingredients. Known for generous portions and warm hospitality, this no-frills eatery is popular with locals and informed tourists alike. The cozy interior with wooden tables and the friendly atmosphere make it feel like dining at a Roman friend\'s home.' },
      ko: { name: '다 엔조 알 29', narration: '전통 로마 요리를 제공하는 사랑받는 로컬 트라토리아 다 엔조에서 정통 트라스테베레 식사를 즐기세요.', description: '정통 트라스테베레 트라토리아', detailedDescription: '다 엔조 알 29는 트라스테베레 중심부에 위치한 작은 가족 운영 트라토리아로 정통 로마 요리를 구현합니다. 메뉴는 신선한 시장 재료를 기반으로 한 매일의 특선 요리를 선보입니다. 푸짐한 양과 따뜻한 환대로 유명한 이 소박한 식당은 현지인과 정보력 있는 관광객 모두에게 인기가 있습니다. 나무 테이블이 있는 아늑한 인테리어와 친근한 분위기는 로마 친구 집에서 식사하는 것 같은 느낌을 줍니다.' },
      it: { name: 'Da Enzo al 29', narration: 'Goditi la cucina autentica di Trastevere da Enzo, una trattoria locale amata che serve piatti romani tradizionali.', description: 'Trattoria autentica di Trastevere', detailedDescription: 'Da Enzo al 29 è una piccola trattoria a conduzione familiare nel cuore di Trastevere che incarna la cucina romana autentica. Il menu presenta specialità giornaliere basate su ingredienti freschi di mercato. Conosciuto per porzioni generose e calorosa ospitalità, questo locale senza fronzoli è popolare sia tra i locali che tra i turisti informati. L\'interno accogliente con tavoli in legno e l\'atmosfera amichevole fanno sentire come se si cenasse a casa di un amico romano.' },
      es: { name: 'Da Enzo al 29', narration: 'Disfruta de la auténtica cocina de Trastevere en Da Enzo, una querida trattoria local que sirve platos romanos tradicionales.', description: 'Auténtica trattoria de Trastevere', detailedDescription: 'Da Enzo al 29 es una pequeña trattoria familiar en el corazón de Trastevere que encarna la cocina romana auténtica. El menú presenta especialidades diarias basadas en ingredientes frescos del mercado. Conocido por sus porciones generosas y cálida hospitalidad, este local sin pretensiones es popular entre locales y turistas informados. El acogedor interior con mesas de madera y el ambiente amigable hacen que se sienta como cenar en casa de un amigo romano.' },
      fr: { name: 'Da Enzo al 29', narration: 'Savourez une cuisine authentique du Trastevere chez Da Enzo, une trattoria locale appréciée servant des plats romains traditionnels.', description: 'Trattoria authentique du Trastevere', detailedDescription: 'Da Enzo al 29 est une petite trattoria familiale au cœur du Trastevere qui incarne la cuisine romaine authentique. Le menu propose des spécialités quotidiennes basées sur des ingrédients frais du marché. Connu pour ses portions généreuses et son accueil chaleureux, ce restaurant sans chichis est apprécié des locaux et des touristes avertis. L\'intérieur confortable avec ses tables en bois et l\'atmosphère conviviale donnent l\'impression de dîner chez un ami romain.' },
      de: { name: 'Da Enzo al 29', narration: 'Genießen Sie authentische Trastevere-Küche bei Da Enzo, einer beliebten lokalen Trattoria, die traditionelle römische Gerichte serviert.', description: 'Authentische Trastevere-Trattoria', detailedDescription: 'Da Enzo al 29 ist eine kleine, familiengeführte Trattoria im Herzen von Trastevere, die authentische römische Küche verkörpert. Die Speisekarte bietet täglich wechselnde Spezialitäten auf Basis marktfrischer Zutaten. Bekannt für großzügige Portionen und herzliche Gastfreundschaft, ist dieses schnörkellose Lokal bei Einheimischen und informierten Touristen gleichermaßen beliebt. Das gemütliche Interieur mit Holztischen und die freundliche Atmosphäre vermitteln das Gefühl, bei einem römischen Freund zu speisen.' },
      zh: { name: 'Da Enzo al 29', narration: '在Da Enzo享受正宗的特拉斯提弗列美食，这是一家深受喜爱的当地餐厅，提供传统罗马菜肴。', description: '正宗的特拉斯提弗列餐厅', detailedDescription: 'Da Enzo al 29是一家位于特拉斯提弗列中心的小型家庭经营餐厅，体现了正宗的罗马烹饪。菜单以每日市场新鲜食材为基础推出特色菜。以慷慨的份量和热情的款待而闻名，这家朴实无华的餐厅深受当地人和知情游客的喜爱。木桌的舒适内饰和友好的氛围让人感觉像是在罗马朋友家用餐。' },
      ja: { name: 'Da Enzo al 29', narration: '伝統的なローマ料理を提供する地元で愛されるトラットリア、Da Enzoで本格的なトラステヴェレの食事をお楽しみください。', description: '本格的なトラステヴェレのトラットリア', detailedDescription: 'Da Enzo al 29は、トラステヴェレの中心部にある小さな家族経営のトラットリアで、本格的なローマ料理を体現しています。メニューは市場から仕入れた新鮮な食材に基づく日替わりスペシャルを提供しています。惜しみないポーションと温かいおもてなしで知られるこの飾らない食堂は、地元の人々と情報通の観光客の両方に人気があります。木製テーブルのある居心地の良い内装と親しみやすい雰囲気は、ローマの友人の家で食事をしているような気分にさせてくれます。' },
      pt: { name: 'Da Enzo al 29', narration: 'Desfrute de autêntica cozinha do Trastevere no Da Enzo, uma querida trattoria local que serve pratos romanos tradicionais.', description: 'Autêntica trattoria do Trastevere', detailedDescription: 'Da Enzo al 29 é uma pequena trattoria familiar no coração do Trastevere que incorpora a autêntica cozinha romana. O menu apresenta especialidades diárias baseadas em ingredientes frescos do mercado. Conhecido por porções generosas e hospitalidade calorosa, este restaurante despretensioso é popular entre locais e turistas informados. O interior aconchegante com mesas de madeira e a atmosfera amigável fazem você se sentir como se estivesse jantando na casa de um amigo romano.' },
      ru: { name: 'Da Enzo al 29', narration: 'Насладитесь аутентичной кухней Трастевере в Da Enzo — любимой местной траттории, подающей традиционные римские блюда.', description: 'Аутентичная траттория Трастевере', detailedDescription: 'Da Enzo al 29 — это небольшая семейная траттория в самом сердце Трастевере, воплощающая подлинную римскую кухню. В меню представлены ежедневные блюда из свежих рыночных продуктов. Известный щедрыми порциями и теплым гостеприимством, этот непритязательный ресторанчик популярен как среди местных жителей, так и среди осведомленных туристов. Уютный интерьер с деревянными столами и дружелюбная атмосфера создают ощущение, что вы обедаете у римского друга дома.' }
    }
  },
  {
    id: 'rome_restaurant_flavio_al_velavevodetto',
    cityId: 'rome',
    name: 'Flavio al Velavevodetto',
    lat: 41.8813,
    lng: 12.4767,
    radius: 40,
    narration: 'Savor Roman classics at Flavio al Velavevodetto, famous for its traditional recipes and welcoming atmosphere.',
    description: 'Classic Roman cuisine in Testaccio',
    category: 'Restaurant',
    detailedDescription: 'Located in the historic Testaccio neighborhood, Flavio al Velavevodetto is renowned for its authentic Roman cuisine. The restaurant specializes in offal dishes and traditional pastas, prepared with recipes passed down through generations. The casual, bustling atmosphere attracts both locals and visitors seeking genuine Roman flavors. The portions are generous and the prices are reasonable for the quality offered.',
    photos: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800'
    ],
    openingHours: 'Mon-Sat: 12:30-15:00, 19:30-23:00 | Closed Sun',
    priceRange: '€€ (€30-45 per person)',
    cuisine: 'Traditional Roman',
    reservationUrl: 'https://www.thefork.com/restaurant/flavio-al-velavevodetto-r43289',
    phoneNumber: '+39 06 574 4194',
    menuHighlights: ['Rigatoni con la Pajata', 'Coda alla Vaccinara', 'Trippa', 'Supplì'],
    translations: {
      en: { name: 'Flavio al Velavevodetto', narration: 'Savor Roman classics at Flavio al Velavevodetto, famous for its traditional recipes and welcoming atmosphere.', description: 'Classic Roman cuisine in Testaccio', detailedDescription: 'Located in the historic Testaccio neighborhood, Flavio al Velavevodetto is renowned for its authentic Roman cuisine. The restaurant specializes in offal dishes and traditional pastas, prepared with recipes passed down through generations. The casual, bustling atmosphere attracts both locals and visitors seeking genuine Roman flavors. The portions are generous and the prices are reasonable for the quality offered.' },
      ko: { name: '플라비오 알 벨라베보데토', narration: '전통 레시피와 환영하는 분위기로 유명한 플라비오 알 벨라베보데토에서 로마 클래식을 맛보세요.', description: '테스타치오의 클래식 로마 요리', detailedDescription: '역사적인 테스타치오 지역에 위치한 플라비오 알 벨라베보데토는 정통 로마 요리로 유명합니다. 이 레스토랑은 대대로 전해 내려온 레시피로 준비된 내장 요리와 전통 파스타를 전문으로 합니다. 캐주얼하고 활기찬 분위기는 진정한 로마 맛을 찾는 현지인과 방문객 모두를 끌어들입니다. 양은 푸짐하고 제공되는 품질에 비해 가격도 합리적입니다.' },
      it: { name: 'Flavio al Velavevodetto', narration: 'Assapora i classici romani da Flavio al Velavevodetto, famoso per le sue ricette tradizionali e l\'atmosfera accogliente.', description: 'Cucina romana classica a Testaccio', detailedDescription: 'Situato nel storico quartiere di Testaccio, Flavio al Velavevodetto è rinomato per la sua autentica cucina romana. Il ristorante è specializzato in piatti a base di frattaglie e paste tradizionali, preparati con ricette tramandate di generazione in generazione. L\'atmosfera informale e vivace attrae sia i locali che i visitatori alla ricerca di autentici sapori romani. Le porzioni sono generose e i prezzi sono ragionevoli per la qualità offerta.' },
      es: { name: 'Flavio al Velavevodetto', narration: 'Saborea los clásicos romanos en Flavio al Velavevodetto, famoso por sus recetas tradicionales y ambiente acogedor.', description: 'Cocina romana clásica en Testaccio', detailedDescription: 'Ubicado en el histórico barrio de Testaccio, Flavio al Velavevodetto es reconocido por su auténtica cocina romana. El restaurante se especializa en platos de casquería y pastas tradicionales, preparados con recetas transmitidas de generación en generación. El ambiente casual y animado atrae tanto a locales como a visitantes que buscan auténticos sabores romanos. Las porciones son generosas y los precios son razonables para la calidad ofrecida.' },
      fr: { name: 'Flavio al Velavevodetto', narration: 'Savourez les classiques romains chez Flavio al Velavevodetto, célèbre pour ses recettes traditionnelles et son atmosphère accueillante.', description: 'Cuisine romaine classique à Testaccio', detailedDescription: 'Situé dans le quartier historique de Testaccio, Flavio al Velavevodetto est réputé pour sa cuisine romaine authentique. Le restaurant est spécialisé dans les plats d\'abats et les pâtes traditionnelles, préparés selon des recettes transmises de génération en génération. L\'atmosphère décontractée et animée attire aussi bien les locaux que les visiteurs à la recherche de saveurs romaines authentiques. Les portions sont généreuses et les prix raisonnables pour la qualité proposée.' },
      de: { name: 'Flavio al Velavevodetto', narration: 'Genießen Sie römische Klassiker bei Flavio al Velavevodetto, berühmt für seine traditionellen Rezepte und einladende Atmosphäre.', description: 'Klassische römische Küche in Testaccio', detailedDescription: 'Im historischen Viertel Testaccio gelegen, ist Flavio al Velavevodetto für seine authentische römische Küche bekannt. Das Restaurant ist auf Innereien-Gerichte und traditionelle Pasta spezialisiert, die nach Generationen überlieferten Rezepten zubereitet werden. Die lockere, belebte Atmosphäre zieht sowohl Einheimische als auch Besucher an, die echte römische Aromen suchen. Die Portionen sind großzügig und die Preise für die gebotene Qualität angemessen.' },
      zh: { name: 'Flavio al Velavevodetto', narration: '在Flavio al Velavevodetto品尝罗马经典美食，这里以传统食谱和温馨氛围而闻名。', description: '泰斯塔奇奥的经典罗马美食', detailedDescription: '位于历史悠久的泰斯塔奇奥社区，Flavio al Velavevodetto以其正宗的罗马美食而闻名。餐厅专门供应内脏菜肴和传统意面，采用代代相传的食谱制作。休闲热闹的氛围吸引了寻求正宗罗马风味的当地人和游客。份量慷慨，价格对于所提供的品质来说非常合理。' },
      ja: { name: 'Flavio al Velavevodetto', narration: '伝統的なレシピと温かい雰囲気で有名なFlavio al Velavevodettoでローマの定番料理をお楽しみください。', description: 'テスタッチョのクラシックなローマ料理', detailedDescription: '歴史あるテスタッチョ地区に位置するFlavio al Velavevodettoは、本格的なローマ料理で有名です。レストランは代々受け継がれてきたレシピで調理された内臓料理と伝統的なパスタを専門としています。カジュアルで活気のある雰囲気は、本物のローマの味を求める地元の人々と観光客の両方を惹きつけます。ポーションは惜しみなく、提供される品質に対して価格も手頃です。' },
      pt: { name: 'Flavio al Velavevodetto', narration: 'Saboreie os clássicos romanos no Flavio al Velavevodetto, famoso por suas receitas tradicionais e atmosfera acolhedora.', description: 'Cozinha romana clássica em Testaccio', detailedDescription: 'Localizado no histórico bairro de Testaccio, Flavio al Velavevodetto é reconhecido por sua autêntica cozinha romana. O restaurante é especializado em pratos de miúdos e massas tradicionais, preparados com receitas passadas de geração em geração. A atmosfera casual e movimentada atrai tanto locais quanto visitantes em busca de sabores romanos genuínos. As porções são generosas e os preços são razoáveis pela qualidade oferecida.' },
      ru: { name: 'Flavio al Velavevodetto', narration: 'Насладитесь римской классикой в Flavio al Velavevodetto, известном своими традиционными рецептами и гостеприимной атмосферой.', description: 'Классическая римская кухня в Тестаччо', detailedDescription: 'Расположенный в историческом районе Тестаччо, Flavio al Velavevodetto славится своей аутентичной римской кухней. Ресторан специализируется на блюдах из субпродуктов и традиционных пастах, приготовленных по рецептам, передаваемым из поколения в поколение. Непринужденная оживленная атмосфера привлекает как местных жителей, так и гостей, ищущих подлинные римские вкусы. Порции щедрые, а цены разумные для предлагаемого качества.' }
    }
  },
  {
    id: 'rome_restaurant_antico_arco',
    cityId: 'rome',
    name: 'Antico Arco',
    lat: 41.8853,
    lng: 12.4623,
    radius: 40,
    narration: 'Experience contemporary Roman cuisine at Antico Arco, a Michelin-recommended restaurant on Gianicolo Hill.',
    description: 'Contemporary Roman fine dining',
    category: 'Restaurant',
    detailedDescription: 'Antico Arco offers a refined take on Roman cuisine in an elegant setting on Gianicolo Hill. The menu combines traditional ingredients with innovative techniques, earning the restaurant a Michelin Bib Gourmand. The wine list features excellent Italian and international selections. The modern interior and attentive service create a sophisticated dining experience while maintaining a welcoming Roman warmth.',
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'
    ],
    openingHours: 'Tue-Sun: 19:30-23:30 | Closed Mon',
    priceRange: '€€€ (€50-75 per person)',
    cuisine: 'Contemporary Roman',
    reservationUrl: 'https://www.thefork.com/restaurant/antico-arco-r43290',
    phoneNumber: '+39 06 581 5274',
    menuHighlights: ['Artichoke Millefeuille', 'Lamb Scottadito', 'Maritozzo', 'Seasonal Risotto'],
    translations: {
      en: { name: 'Antico Arco', narration: 'Experience contemporary Roman cuisine at Antico Arco, a Michelin-recommended restaurant on Gianicolo Hill.', description: 'Contemporary Roman fine dining', detailedDescription: 'Antico Arco offers a refined take on Roman cuisine in an elegant setting on Gianicolo Hill. The menu combines traditional ingredients with innovative techniques, earning the restaurant a Michelin Bib Gourmand. The wine list features excellent Italian and international selections. The modern interior and attentive service create a sophisticated dining experience while maintaining a welcoming Roman warmth.' },
      ko: { name: '안티코 아르코', narration: '자니콜로 언덕의 미슐랭 추천 레스토랑 안티코 아르코에서 현대적인 로마 요리를 경험하세요.', description: '현대적인 로마 파인 다이닝', detailedDescription: '안티코 아르코는 자니콜로 언덕의 우아한 환경에서 로마 요리에 대한 세련된 해석을 제공합니다. 메뉴는 전통 재료와 혁신적인 기법을 결합하여 미슐랭 빕 구르망을 획득했습니다. 와인 리스트에는 우수한 이탈리아 및 국제 셀렉션이 있습니다. 현대적인 인테리어와 세심한 서비스는 로마의 따뜻한 환대를 유지하면서 세련된 다이닝 경험을 선사합니다.' },
      it: { name: 'Antico Arco', narration: 'Vivi la cucina romana contemporanea all\'Antico Arco, un ristorante raccomandato dalla Michelin sul Gianicolo.', description: 'Fine dining romano contemporaneo', detailedDescription: 'Antico Arco offre un\'interpretazione raffinata della cucina romana in un ambiente elegante sul Gianicolo. Il menu combina ingredienti tradizionali con tecniche innovative, guadagnando al ristorante un Bib Gourmand Michelin. La carta dei vini presenta eccellenti selezioni italiane e internazionali. L\'interno moderno e il servizio attento creano un\'esperienza culinaria sofisticata mantenendo un calore romano accogliente.' },
      es: { name: 'Antico Arco', narration: 'Experimente la cocina romana contemporánea en Antico Arco, un restaurante recomendado por Michelin en la colina del Gianicolo.', description: 'Alta cocina romana contemporánea', detailedDescription: 'Antico Arco ofrece una interpretación refinada de la cocina romana en un elegante entorno en la colina del Gianicolo. El menú combina ingredientes tradicionales con técnicas innovadoras, ganando el restaurante un Bib Gourmand de Michelin. La carta de vinos presenta excelentes selecciones italianas e internacionales. El interior moderno y el servicio atento crean una experiencia gastronómica sofisticada mientras mantienen una cálida hospitalidad romana.' },
      fr: { name: 'Antico Arco', narration: 'Découvrez la cuisine romaine contemporaine à l\'Antico Arco, un restaurant recommandé par le Michelin sur la colline du Janicule.', description: 'Gastronomie romaine contemporaine', detailedDescription: 'Antico Arco propose une interprétation raffinée de la cuisine romaine dans un cadre élégant sur la colline du Janicule. Le menu combine des ingrédients traditionnels avec des techniques innovantes, permettant au restaurant d\'obtenir un Bib Gourmand Michelin. La carte des vins présente d\'excellentes sélections italiennes et internationales. L\'intérieur moderne et le service attentif créent une expérience culinaire sophistiquée tout en préservant la chaleur romaine accueillante.' },
      de: { name: 'Antico Arco', narration: 'Erleben Sie zeitgenössische römische Küche im Antico Arco, einem Michelin-empfohlenen Restaurant auf dem Gianicolo-Hügel.', description: 'Zeitgenössisches römisches Fine Dining', detailedDescription: 'Antico Arco bietet eine raffinierte Interpretation der römischen Küche in einem eleganten Ambiente auf dem Gianicolo-Hügel. Die Speisekarte kombiniert traditionelle Zutaten mit innovativen Techniken und hat dem Restaurant einen Michelin Bib Gourmand eingebracht. Die Weinkarte präsentiert ausgezeichnete italienische und internationale Auswahl. Das moderne Interieur und der aufmerksame Service schaffen ein gehobenes kulinarisches Erlebnis bei gleichzeitiger Bewahrung römischer Gastfreundschaft.' },
      zh: { name: 'Antico Arco', narration: '在贾尼科洛山上的米其林推荐餐厅Antico Arco体验现代罗马美食。', description: '现代罗马精致餐饮', detailedDescription: 'Antico Arco在贾尼科洛山的优雅环境中提供对罗马美食的精致诠释。菜单将传统食材与创新技术相结合，为餐厅赢得了米其林必比登推荐。酒单精选优秀的意大利和国际葡萄酒。现代的室内设计和周到的服务创造了精致的用餐体验，同时保持了罗马式的热情好客。' },
      ja: { name: 'Antico Arco', narration: 'ジャニコロの丘にあるミシュラン推奨レストラン、Antico Arcoで現代的なローマ料理をご体験ください。', description: '現代的なローマのファインダイニング', detailedDescription: 'Antico Arcoは、ジャニコロの丘のエレガントな環境でローマ料理の洗練された解釈を提供します。メニューは伝統的な食材と革新的な技法を組み合わせ、ミシュランのビブグルマンを獲得しています。ワインリストには優れたイタリアワインと国際的なセレクションが揃っています。モダンな内装と行き届いたサービスは、ローマの温かいおもてなしを保ちながら、洗練されたダイニング体験を創り出しています。' },
      pt: { name: 'Antico Arco', narration: 'Experimente a cozinha romana contemporânea no Antico Arco, um restaurante recomendado pelo Michelin na colina do Gianicolo.', description: 'Alta gastronomia romana contemporânea', detailedDescription: 'Antico Arco oferece uma interpretação refinada da cozinha romana em um ambiente elegante na colina do Gianicolo. O menu combina ingredientes tradicionais com técnicas inovadoras, conquistando para o restaurante um Bib Gourmand Michelin. A carta de vinhos apresenta excelentes seleções italianas e internacionais. O interior moderno e o serviço atencioso criam uma experiência gastronômica sofisticada enquanto mantêm o calor romano acolhedor.' },
      ru: { name: 'Antico Arco', narration: 'Откройте современную римскую кухню в Antico Arco — ресторане, рекомендованном Мишлен, на холме Джаниколо.', description: 'Современная римская высокая кухня', detailedDescription: 'Antico Arco предлагает изысканную интерпретацию римской кухни в элегантной обстановке на холме Джаниколо. Меню сочетает традиционные ингредиенты с инновационными техниками, благодаря чему ресторан получил рекомендацию Мишлен Bib Gourmand. Винная карта представляет превосходный выбор итальянских и международных вин. Современный интерьер и внимательное обслуживание создают изысканный гастрономический опыт, сохраняя при этом римское гостеприимство.' }
    }
  },

  // Paris restaurants (5)
  {
    id: 'paris_restaurant_le_comptoir',
    cityId: 'paris',
    name: 'Le Comptoir du Relais',
    lat: 48.8517,
    lng: 2.3358,
    radius: 40,
    narration: 'Taste classic French bistro cuisine at Le Comptoir, Yves Camdeborde\'s legendary Saint-Germain restaurant.',
    description: 'Classic French bistro by renowned chef',
    category: 'Restaurant',
    detailedDescription: 'Le Comptoir du Relais is chef Yves Camdeborde\'s iconic bistro in Saint-Germain-des-Prés. This intimate space serves market-driven French classics with a modern twist. The no-reservation lunch service and tasting menu dinners attract food lovers from around the world. The atmosphere is quintessentially Parisian with red leather banquettes and bustling energy.',
    photos: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800'
    ],
    openingHours: 'Daily: 12:00-15:00, 19:00-23:00',
    priceRange: '€€€ (€45-70 per person)',
    cuisine: 'French Bistro',
    reservationUrl: 'https://www.thefork.com/restaurant/le-comptoir-du-relais-r45201',
    phoneNumber: '+33 1 44 27 07 97',
    menuHighlights: ['Foie Gras Terrine', 'Beef Bourguignon', 'Crème Brûlée', 'Duck Confit'],
    translations: {
      en: { name: 'Le Comptoir du Relais', narration: 'Taste classic French bistro cuisine at Le Comptoir, Yves Camdeborde\'s legendary Saint-Germain restaurant.', description: 'Classic French bistro by renowned chef' },
      ko: { name: '르 꽁투아르 뒤 를레', narration: '이브 캄드보르드의 전설적인 생제르맹 레스토랑 르 꽁투아르에서 클래식 프렌치 비스트로 요리를 맛보세요.', description: '유명 셰프의 클래식 프렌치 비스트로' },
      it: { name: 'Le Comptoir du Relais', narration: 'Assaggia la cucina classica bistrot francese a Le Comptoir, il leggendario ristorante di Yves Camdeborde a Saint-Germain.', description: 'Bistrot francese classico di chef rinomato' }
    }
  },
  {
    id: 'paris_restaurant_septime',
    cityId: 'paris',
    name: 'Septime',
    lat: 48.8532,
    lng: 2.3764,
    radius: 40,
    narration: 'Discover Septime, one of Paris\'s hottest restaurants serving innovative seasonal cuisine in a relaxed setting.',
    description: 'Innovative seasonal French cuisine',
    category: 'Restaurant',
    detailedDescription: 'Septime is a Michelin-starred restaurant that has become a pilgrimage site for food enthusiasts. Chef Bertrand Grébaut creates inventive dishes using seasonal, locally-sourced ingredients. The minimalist dining room and open kitchen create an unpretentious atmosphere. The natural wine list is exceptional. Reservations are notoriously difficult to secure but worth the effort.',
    photos: [
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800'
    ],
    openingHours: 'Mon-Fri: 12:00-14:00, 19:30-22:00 | Closed Sat-Sun',
    priceRange: '€€€€ (€80-120 per person)',
    cuisine: 'Contemporary French',
    reservationUrl: 'https://www.septime-charonne.fr/',
    phoneNumber: '+33 1 43 67 38 29',
    menuHighlights: ['Seasonal Tasting Menu', 'Natural Wines', 'Artisan Bread'],
    translations: {
      en: { name: 'Septime', narration: 'Discover Septime, one of Paris\'s hottest restaurants serving innovative seasonal cuisine in a relaxed setting.', description: 'Innovative seasonal French cuisine' },
      ko: { name: '셉팀', narration: '편안한 분위기에서 혁신적인 계절 요리를 제공하는 파리에서 가장 핫한 레스토랑 중 하나인 셉팀을 발견하세요.', description: '혁신적인 계절 프렌치 요리' },
      it: { name: 'Septime', narration: 'Scopri Septime, uno dei ristoranti più in voga di Parigi che serve cucina stagionale innovativa in un ambiente rilassato.', description: 'Cucina francese stagionale innovativa' }
    }
  },
  {
    id: 'paris_restaurant_lami_jean',
    cityId: 'paris',
    name: 'L\'Ami Jean',
    lat: 48.8579,
    lng: 2.3072,
    radius: 40,
    narration: 'Enjoy hearty Basque-French cuisine at L\'Ami Jean, known for generous portions and convivial atmosphere.',
    description: 'Basque-French bistro near Eiffel Tower',
    category: 'Restaurant',
    detailedDescription: 'L\'Ami Jean brings the flavors of France\'s Basque region to Paris. Chef Stéphane Jégo creates robust, flavorful dishes meant for sharing. The restaurant is famous for its rice pudding and generous portions. The lively, packed dining room creates an energetic atmosphere. Located near the Eiffel Tower, it\'s a favorite among both locals and visitors seeking authentic French cuisine.',
    photos: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'
    ],
    openingHours: 'Tue-Sat: 12:00-14:00, 19:00-23:00 | Closed Sun-Mon',
    priceRange: '€€€ (€50-75 per person)',
    cuisine: 'Basque-French',
    reservationUrl: 'https://www.thefork.com/restaurant/l-ami-jean-r45203',
    phoneNumber: '+33 1 47 05 86 89',
    menuHighlights: ['Rice Pudding', 'Basque Pork', 'Seafood Platters', 'Duck Breast'],
    translations: {
      en: { name: 'L\'Ami Jean', narration: 'Enjoy hearty Basque-French cuisine at L\'Ami Jean, known for generous portions and convivial atmosphere.', description: 'Basque-French bistro near Eiffel Tower' },
      ko: { name: '라미 장', narration: '푸짐한 양과 즐거운 분위기로 유명한 라미 장에서 진한 바스크-프렌치 요리를 즐기세요.', description: '에펠탑 근처 바스크-프렌치 비스트로' },
      it: { name: 'L\'Ami Jean', narration: 'Goditi la sostanziosa cucina basco-francese a L\'Ami Jean, nota per porzioni generose e atmosfera conviviale.', description: 'Bistrot basco-francese vicino alla Tour Eiffel' }
    }
  },
  {
    id: 'paris_restaurant_chez_janou',
    cityId: 'paris',
    name: 'Chez Janou',
    lat: 48.8554,
    lng: 2.3639,
    radius: 40,
    narration: 'Experience Provençal flavors at Chez Janou, a charming bistro in the Marais with a famous chocolate mousse.',
    description: 'Provençal bistro in the Marais',
    category: 'Restaurant',
    detailedDescription: 'Chez Janou brings the sunshine of Provence to Paris\'s Marais district. The menu features Mediterranean-inspired dishes with fresh herbs and olive oil. The restaurant is famous for its unlimited chocolate mousse served from a large communal bowl. The charming terrace and colorful interior create a relaxed, friendly atmosphere perfect for leisurely meals.',
    photos: [
      'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800'
    ],
    openingHours: 'Daily: 12:00-15:00, 19:00-midnight',
    priceRange: '€€ (€35-55 per person)',
    cuisine: 'Provençal',
    reservationUrl: 'https://www.thefork.com/restaurant/chez-janou-r45204',
    phoneNumber: '+33 1 42 72 28 41',
    menuHighlights: ['Unlimited Chocolate Mousse', 'Bouillabaisse', 'Ratatouille', 'Lamb Provençal'],
    translations: {
      en: { name: 'Chez Janou', narration: 'Experience Provençal flavors at Chez Janou, a charming bistro in the Marais with a famous chocolate mousse.', description: 'Provençal bistro in the Marais' },
      ko: { name: '셰 자누', narration: '유명한 초콜릿 무스가 있는 마레 지구의 매력적인 비스트로 셰 자누에서 프로방스 풍미를 경험하세요.', description: '마레의 프로방스 비스트로' },
      it: { name: 'Chez Janou', narration: 'Vivi i sapori provenzali da Chez Janou, un bistrot affascinante nel Marais con una famosa mousse al cioccolato.', description: 'Bistrot provenzale nel Marais' }
    }
  },
  {
    id: 'paris_restaurant_pink_mamma',
    cityId: 'paris',
    name: 'Pink Mamma',
    lat: 48.8814,
    lng: 2.3407,
    radius: 40,
    narration: 'Indulge in Italian-French fusion at Pink Mamma, a trendy multi-floor restaurant in Pigalle.',
    description: 'Trendy Italian-French fusion restaurant',
    category: 'Restaurant',
    detailedDescription: 'Pink Mamma is a vibrant, Instagram-worthy restaurant spread across four floors in Pigalle. The menu features Italian classics with a French twist, from pizzas to pasta to fresh seafood. The lush plant-filled interior and rooftop terrace create a unique dining atmosphere. The restaurant is part of the Big Mamma group known for quality Italian cuisine and lively ambiance.',
    photos: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800'
    ],
    openingHours: 'Daily: 12:00-14:30, 19:00-midnight',
    priceRange: '€€ (€30-50 per person)',
    cuisine: 'Italian-French',
    reservationUrl: 'https://www.thefork.com/restaurant/pink-mamma-r45205',
    phoneNumber: '+33 1 42 21 20 00',
    menuHighlights: ['Burrata', 'Truffle Pizza', 'Fresh Pasta', 'Tiramisu'],
    translations: {
      en: { name: 'Pink Mamma', narration: 'Indulge in Italian-French fusion at Pink Mamma, a trendy multi-floor restaurant in Pigalle.', description: 'Trendy Italian-French fusion restaurant' },
      ko: { name: '핑크 맘마', narration: '피갈 지구의 트렌디한 다층 레스토랑 핑크 맘마에서 이탈리안-프렌치 퓨전을 즐기세요.', description: '트렌디한 이탈리안-프렌치 퓨전 레스토랑' },
      it: { name: 'Pink Mamma', narration: 'Concediti la fusione italo-francese da Pink Mamma, un ristorante trendy su più piani a Pigalle.', description: 'Ristorante fusion italo-francese trendy' }
    }
  },

  // London restaurants (5)
  {
    id: 'london_restaurant_dishoom',
    cityId: 'london',
    name: 'Dishoom',
    lat: 51.5142,
    lng: -0.1239,
    radius: 40,
    narration: 'Experience Bombay-style cuisine at Dishoom, London\'s beloved Indian restaurant chain.',
    description: 'Bombay-style Indian cuisine',
    category: 'Restaurant',
    detailedDescription: 'Dishoom recreates the Irani cafés of 1960s Bombay in the heart of London. The menu features Indian breakfast classics, street food favorites, and signature dishes like house black daal. The stylish Art Deco-inspired interior and warm hospitality create an inviting atmosphere. Multiple locations across London make it accessible, though queues are common during peak hours.',
    photos: [
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'
    ],
    openingHours: 'Mon-Thu: 8:00-23:00, Fri: 8:00-midnight, Sat: 9:00-midnight, Sun: 9:00-23:00',
    priceRange: '££ (£25-40 per person)',
    cuisine: 'Indian',
    reservationUrl: 'https://www.dishoom.com/covent-garden/',
    phoneNumber: '+44 20 7420 9320',
    menuHighlights: ['Bacon Naan Roll', 'House Black Daal', 'Chicken Ruby', 'Chai'],
    translations: {
      en: { name: 'Dishoom', narration: 'Experience Bombay-style cuisine at Dishoom, London\'s beloved Indian restaurant chain.', description: 'Bombay-style Indian cuisine' },
      ko: { name: '디숌', narration: '런던에서 사랑받는 인도 레스토랑 체인 디숌에서 봄베이 스타일 요리를 경험하세요.', description: '봄베이 스타일 인도 요리' },
      it: { name: 'Dishoom', narration: 'Vivi la cucina in stile Bombay da Dishoom, l\'amata catena di ristoranti indiani di Londra.', description: 'Cucina indiana in stile Bombay' }
    }
  },
  {
    id: 'london_restaurant_the_ledbury',
    cityId: 'london',
    name: 'The Ledbury',
    lat: 51.5104,
    lng: -0.1977,
    radius: 40,
    narration: 'Dine at The Ledbury, a two-Michelin-starred restaurant offering exceptional modern European cuisine.',
    description: 'Two Michelin star fine dining',
    category: 'Restaurant',
    detailedDescription: 'The Ledbury is one of London\'s most celebrated restaurants, holding two Michelin stars. Chef Brett Graham creates sophisticated dishes that showcase British ingredients with global influences. The tasting menus are meticulously crafted works of culinary art. The elegant Notting Hill location and professional service create a memorable fine dining experience.',
    photos: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'
    ],
    openingHours: 'Wed-Sat: 12:00-14:00, 18:30-21:30 | Closed Sun-Tue',
    priceRange: '££££ (£150-200 per person)',
    cuisine: 'Modern European',
    reservationUrl: 'https://www.theledbury.com/',
    phoneNumber: '+44 20 7792 9090',
    menuHighlights: ['Flame-Grilled Mackerel', 'Berkshire Deer', 'Tasting Menu'],
    translations: {
      en: { name: 'The Ledbury', narration: 'Dine at The Ledbury, a two-Michelin-starred restaurant offering exceptional modern European cuisine.', description: 'Two Michelin star fine dining' },
      ko: { name: '더 레드버리', narration: '뛰어난 모던 유러피언 요리를 제공하는 미슐랭 2스타 레스토랑 더 레드버리에서 식사하세요.', description: '미슐랭 2스타 파인 다이닝' },
      it: { name: 'The Ledbury', narration: 'Cena a The Ledbury, un ristorante due stelle Michelin che offre eccezionale cucina europea moderna.', description: 'Fine dining due stelle Michelin' }
    }
  },
  {
    id: 'london_restaurant_st_john',
    cityId: 'london',
    name: 'St. JOHN',
    lat: 51.5204,
    lng: -0.1025,
    radius: 40,
    narration: 'Discover British nose-to-tail dining at St. JOHN, a pioneering restaurant in Smithfield.',
    description: 'Nose-to-tail British cuisine',
    category: 'Restaurant',
    detailedDescription: 'St. JOHN pioneered the nose-to-tail dining movement in London. Chef Fergus Henderson celebrates British ingredients and traditional cooking methods, utilizing the whole animal. The stark white dining room and simple presentation let the flavors speak for themselves. The restaurant has influenced a generation of chefs and remains a must-visit for food enthusiasts.',
    photos: [
      'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=800'
    ],
    openingHours: 'Mon-Fri: 12:00-15:00, 18:00-22:00, Sat: 12:00-16:00, 18:00-22:00, Sun: 12:00-16:00',
    priceRange: '£££ (£50-80 per person)',
    cuisine: 'British',
    reservationUrl: 'https://www.thefork.com/restaurant/st-john-r46301',
    phoneNumber: '+44 20 7251 0848',
    menuHighlights: ['Bone Marrow & Parsley Salad', 'Roast Bone Marrow', 'Eccles Cake'],
    translations: {
      en: { name: 'St. JOHN', narration: 'Discover British nose-to-tail dining at St. JOHN, a pioneering restaurant in Smithfield.', description: 'Nose-to-tail British cuisine' },
      ko: { name: '세인트 존', narration: '스미스필드의 선구적인 레스토랑 세인트 존에서 영국식 코투테일 다이닝을 발견하세요.', description: '노즈투테일 영국 요리' },
      it: { name: 'St. JOHN', narration: 'Scopri la cucina britannica nose-to-tail a St. JOHN, un ristorante pionieristico a Smithfield.', description: 'Cucina britannica nose-to-tail' }
    }
  },
  {
    id: 'london_restaurant_padella',
    cityId: 'london',
    name: 'Padella',
    lat: 51.5056,
    lng: -0.0911,
    radius: 40,
    narration: 'Enjoy fresh handmade pasta at Padella, Borough Market\'s popular Italian eatery.',
    description: 'Fresh pasta near Borough Market',
    category: 'Restaurant',
    detailedDescription: 'Padella serves exceptional fresh pasta at remarkably reasonable prices near Borough Market. The open kitchen allows diners to watch skilled chefs roll and shape pasta throughout the day. The menu changes regularly based on seasonal ingredients. The no-reservation policy means queues are common, but the turnover is quick and the wait worthwhile.',
    photos: [
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800'
    ],
    openingHours: 'Mon-Sat: 12:00-16:00, 17:00-22:00, Sun: 12:00-16:00, 17:00-21:00',
    priceRange: '££ (£20-35 per person)',
    cuisine: 'Italian',
    reservationUrl: 'https://www.padella.co/',
    phoneNumber: '+44 20 7357 8167',
    menuHighlights: ['Pici Cacio e Pepe', 'Pappardelle Beef Shin Ragu', 'Burrata'],
    translations: {
      en: { name: 'Padella', narration: 'Enjoy fresh handmade pasta at Padella, Borough Market\'s popular Italian eatery.', description: 'Fresh pasta near Borough Market' },
      ko: { name: '파델라', narration: '보로 마켓의 인기 이탈리안 식당 파델라에서 신선한 수제 파스타를 즐기세요.', description: '보로 마켓 근처 신선한 파스타' },
      it: { name: 'Padella', narration: 'Goditi la pasta fresca fatta a mano da Padella, la popolare trattoria italiana del Borough Market.', description: 'Pasta fresca vicino al Borough Market' }
    }
  },
  {
    id: 'london_restaurant_hawksmoor',
    cityId: 'london',
    name: 'Hawksmoor Seven Dials',
    lat: 51.5141,
    lng: -0.1269,
    radius: 40,
    narration: 'Savor Britain\'s best steaks at Hawksmoor, renowned for its ethically-sourced beef and cocktails.',
    description: 'British steakhouse with cocktails',
    category: 'Restaurant',
    detailedDescription: 'Hawksmoor is widely considered one of London\'s best steakhouses. The restaurant serves ethically-sourced British beef, dry-aged and cooked to perfection. Beyond steaks, the seafood and sides are exceptional. The cocktail bar is equally famous, with classic and creative drinks. The Art Deco-inspired dining room creates an elegant yet relaxed atmosphere.',
    photos: [
      'https://images.unsplash.com/photo-1558030006-450675393462?w=800'
    ],
    openingHours: 'Mon-Sat: 12:00-15:00, 17:00-22:30, Sun: 12:00-21:00',
    priceRange: '£££ (£60-90 per person)',
    cuisine: 'British Steakhouse',
    reservationUrl: 'https://www.thefork.com/restaurant/hawksmoor-seven-dials-r46303',
    phoneNumber: '+44 20 7856 2154',
    menuHighlights: ['Porterhouse Steak', 'Bone-in Ribeye', 'Triple Cooked Chips', 'Salted Caramel Rolos'],
    translations: {
      en: { name: 'Hawksmoor Seven Dials', narration: 'Savor Britain\'s best steaks at Hawksmoor, renowned for its ethically-sourced beef and cocktails.', description: 'British steakhouse with cocktails' },
      ko: { name: '호크스무어 세븐 다이얼스', narration: '윤리적으로 조달된 소고기와 칵테일로 유명한 호크스무어에서 영국 최고의 스테이크를 맛보세요.', description: '칵테일이 있는 영국 스테이크하우스' },
      it: { name: 'Hawksmoor Seven Dials', narration: 'Assapora le migliori bistecche britanniche da Hawksmoor, rinomato per la carne di manzo di provenienza etica e i cocktail.', description: 'Steakhouse britannica con cocktail' }
    }
  }
];
