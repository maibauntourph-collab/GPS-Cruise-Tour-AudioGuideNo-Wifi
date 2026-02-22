import { type Landmark } from "@shared/schema";

/**
 * [Query Master] NeonDB에서 추출된 하드코드 데이터
 * 오프라인 상태에서도 끊김 없는 오디오 가이드를 위해 정적으로 관리합니다.
 * server/data/landmarks.ts의 최신 데이터를 기반으로 업데이트되었습니다.
 */
export const HARDCODED_LANDMARKS: Landmark[] = [
    {
        id: "rome/borghese-gallery",
        cityId: "rome",
        name: "Borghese Gallery and Park",
        lat: 41.9142,
        lng: 12.4921,
        radius: 100,
        category: "Landmark",
        narration: "Welcome to the Borghese Gallery, home to one of the world's most incredible art collections.",
        description: "A world-renowned art museum housed in a 17th-century villa with magnificent gardens.",
        detailedDescription: "The Borghese Gallery (Galleria Borghese) is an art gallery in Rome, Italy, housed in the former Villa Borghese Pinciana. It holds a substantial part of the Borghese collection of paintings, sculpture and antiquities, begun by Cardinal Scipione Borghese, the nephew of Pope Paul V. You can find masterpieces by Bernini, Caravaggio, and Canova. The surrounding park, Villa Borghese, is the third largest public park in Rome.",
        photos: [
            "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1533118320494-0ba6518a452a?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1582260656094-be99da3da198?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1594911776510-435ed73a5a75?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "보르게세 미술관 및 공원",
                description: "17세기 빌라에 자리 잡은 세계적인 미술관과 드넓은 정원",
                detailedDescription: "보르게세 미술관은 벨레트리 출신의 보르게세 가문이 수집한 방대한 예술품을 전시하고 있는 로마의 대표적인 미술관입니다. 추기경 시피오네 보르게세의 개인 수집품으로 시작된 이 컬렉션은 베르니니의 '아폴론과 다프네', '페르세포네의 납치'와 같은 역동적인 조각상은 물론, 카라바조와 라파엘로의 걸작들을 포함하고 있습니다. 미술관을 둘러싼 보르게세 공원은 로마에서 세 번째로 큰 공공 공원으로, 산책과 휴식을 즐기기에 최적인 명소입니다.",
                narration: "세계에서 가장 놀라운 예술 컬렉션 중 하나인 보르게세 미술관에 오신 것을 환영합니다. 베르니니의 조각과 카라바조의 회화를 만끽해보세요."
            }
        }
    },
    {
        id: "rome/aroma-restaurant",
        cityId: "rome",
        name: "Aroma Restaurant",
        lat: 41.8906,
        lng: 12.4938,
        radius: 50,
        category: "Restaurant",
        narration: "Aroma offers the ultimate Roman dining experience with an unparalleled view of the Colosseum.",
        description: "Michelin-starred rooftop dining with a breathtaking view of the Colosseum.",
        detailedDescription: "Perched on the top floor of Palazzo Manfredi, Aroma provides a front-row seat to the ancient Colosseum. Chef Giuseppe Di Iorio presents a menu that balances classic Roman flavors with modern culinary techniques. It's widely considered one of the most romantic dining spots in the world.",
        photos: [
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1502301103665-0b95cc738def?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/flagged/photo-1557007525-27a92289658e?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1520209759809-a9bcb6cb3241?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "아로마 레스토랑",
                description: "콜로세움이 한눈에 들어오는 미슐랭 스타 루프탑 레스토랑",
                detailedDescription: "팔라초 만프레디 호텔 최상층에 위치한 아로마는 콜로세움을 가장 가까이서 감상하며 식사할 수 있는 최고의 공간입니다. 셰프 주세페 디 이오리오는 고전적인 로마 요리에 현대적인 감각을 더한 코스 요리를 선보입니다. 세계에서 가장 낭만적인 식당 중 하나로 꼽히며, 특별한 날을 기념하기에 더할 나위 없는 장소입니다.",
                narration: "콜로세움의 비현실적인 전망과 함께하는 아로마 레스토랑에 오신 것을 환영합니다. 로마 최고의 미식 경험을 즐겨보세요."
            }
        }
    },
    {
        id: 'colosseum',
        cityId: 'rome',
        name: 'Colosseum',
        lat: 41.890251,
        lng: 12.492373,
        radius: 70,
        narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
        description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
        category: 'Ancient Rome',
        detailedDescription: 'The Colosseum, also known as the Flavian Amphitheatre, stands as one of the greatest architectural achievements of ancient Rome and remains the largest amphitheater ever constructed.',
        photos: [
            'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=80',
            '/images/landmarks/colosseum.png'
        ],
        translations: {
            ko: {
                name: '콜로세움',
                narration: '로마의 상징인 콜로세움에 오신 것을 환영합니다. 이 고대 원형 경기장은 한때 검투사 경기와 공개 행사를 개최했습니다.',
                description: '역사상 가장 큰 원형 경기장이자 유네스코 세계문화유산',
                detailedDescription: '플라비우스 원형극장으로도 알려진 콜로세움은 고대 로마의 가장 위대한 건축적 성취 중 하나로 남아있으며, 지금까지 건설된 가장 큰 원형 경기장입니다.'
            }
        }
    }
];
