import { type Landmark } from "@shared/schema";

export const RESTAURANTS: Landmark[] = [
  // Rome restaurants (10)
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
