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
      en: { name: 'Roscioli', narration: 'Discover Roscioli, a gourmet deli and restaurant offering exceptional Roman cuisine and an extensive wine selection.', description: 'Gourmet deli and restaurant with Italian delicacies' },
      ko: { name: '로쇼리', narration: '특별한 로마 요리와 광범위한 와인 셀렉션을 제공하는 미식 델리 겸 레스토랑 로쇼리를 발견하세요.', description: '이탈리아 별미를 제공하는 미식 델리 겸 레스토랑' },
      it: { name: 'Roscioli', narration: 'Scopri Roscioli, una gastronomia gourmet e ristorante che offre cucina romana eccezionale e un\'ampia selezione di vini.', description: 'Gastronomia gourmet e ristorante con prelibatezze italiane' }
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
      en: { name: 'La Pergola', narration: 'Experience Rome\'s only 3 Michelin star restaurant, La Pergola, offering breathtaking views and exquisite haute cuisine.', description: 'Three Michelin star fine dining with panoramic views' },
      ko: { name: '라 페르골라', narration: '로마의 유일한 미슐랭 3스타 레스토랑 라 페르골라에서 숨막히는 전망과 정교한 오뜨 퀴진을 경험하세요.', description: '파노라마 뷰를 갖춘 미슐랭 3스타 파인 다이닝' },
      it: { name: 'La Pergola', narration: 'Vivi l\'unico ristorante 3 stelle Michelin di Roma, La Pergola, che offre viste mozzafiato e alta cucina squisita.', description: 'Fine dining tre stelle Michelin con vista panoramica' }
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
      en: { name: 'Da Enzo al 29', narration: 'Enjoy authentic Trastevere dining at Da Enzo, a beloved local trattoria serving traditional Roman dishes.', description: 'Authentic Trastevere trattoria' },
      ko: { name: '다 엔조 알 29', narration: '전통 로마 요리를 제공하는 사랑받는 로컬 트라토리아 다 엔조에서 정통 트라스테베레 식사를 즐기세요.', description: '정통 트라스테베레 트라토리아' },
      it: { name: 'Da Enzo al 29', narration: 'Goditi la cucina autentica di Trastevere da Enzo, una trattoria locale amata che serve piatti romani tradizionali.', description: 'Trattoria autentica di Trastevere' }
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
      en: { name: 'Flavio al Velavevodetto', narration: 'Savor Roman classics at Flavio al Velavevodetto, famous for its traditional recipes and welcoming atmosphere.', description: 'Classic Roman cuisine in Testaccio' },
      ko: { name: '플라비오 알 벨라베보데토', narration: '전통 레시피와 환영하는 분위기로 유명한 플라비오 알 벨라베보데토에서 로마 클래식을 맛보세요.', description: '테스타치오의 클래식 로마 요리' },
      it: { name: 'Flavio al Velavevodetto', narration: 'Assapora i classici romani da Flavio al Velavevodetto, famoso per le sue ricette tradizionali e l\'atmosfera accogliente.', description: 'Cucina romana classica a Testaccio' }
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
      en: { name: 'Antico Arco', narration: 'Experience contemporary Roman cuisine at Antico Arco, a Michelin-recommended restaurant on Gianicolo Hill.', description: 'Contemporary Roman fine dining' },
      ko: { name: '안티코 아르코', narration: '자니콜로 언덕의 미슐랭 추천 레스토랑 안티코 아르코에서 현대적인 로마 요리를 경험하세요.', description: '현대적인 로마 파인 다이닝' },
      it: { name: 'Antico Arco', narration: 'Vivi la cucina romana contemporanea all\'Antico Arco, un ristorante raccomandato dalla Michelin sul Gianicolo.', description: 'Fine dining romano contemporaneo' }
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
