import { Landmark } from "../../shared/schema";

export const NEW_LANDMARKS: Landmark[] = [
    // Jeju Landmarks
    {
        id: 'jeju_seongsan_ilchulbong',
        cityId: 'jeju',
        name: 'Seongsan Ilchulbong',
        lat: 33.4580,
        lng: 126.9410,
        radius: 500,
        narration: "Welcome to Seongsan Ilchulbong, also known as 'Sunrise Peak'. As you stand before this majestic tuff cone, formed by hydrovolcanic eruptions upon a shallow seabed about 5,000 years ago, feel the ancient power of nature. Listen to the waves crashing against the cliffs below and the wind whispering stories of Jeju's mythical origins. This UNESCO World Heritage site offers a spectacular view of the sunrise, a symbol of hope and new beginnings for the people of Jeju. The crater at the summit, resembling a giant crown, is a testament to the island's volcanic history.",
        description: "A UNESCO World Heritage site formed by hydrovolcanic eruptions, offering breathtaking sunrise views.",
        category: "Nature",
        detailedDescription: "Seongsan Ilchulbong Peak rose from the sea in a volcanic eruption over 100,000 years ago. Located on the eastern end of Jeju Island, there is a huge crater at the top of Seongsan Ilchulbong Peak. The crater is about 600m in diameter and 90m high. With the 99 sharp rocks surrounding the crater, it looks like a gigantic crown. While the southeast and north sides are cliffs, the northwest side is a verdant grassy hill that is connected to the Seongsan Village. The ridge provides an ideal spot for walks and for horse riding as well.",
        photos: [
            "https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1596541223963-c7a52e1f4007?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1624707635677-4b7b3b3b3b3b?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "성산일출봉",
                narration: "성산일출봉, '해돋이 봉우리'에 오신 것을 환영합니다. 약 5,000년 전 얕은 바다 위에서 수성화산 분출로 형성된 이 거대한 응회구 앞에 서서 자연의 고대 힘을 느껴보세요. 절벽 아래로 부딪히는 파도 소리와 제주의 신화적 기원을 속삭이는 바람 소리에 귀를 기울여보세요. 유네스코 세계자연유산인 이곳은 제주 사람들에게 희망과 새로운 시작의 상징인 일출의 장관을 선사합니다. 정상의 분화구는 거대한 왕관을 닮아 이 섬의 화산 역사를 증명합니다.",
                description: "수성화산 분출로 형성된 유네스코 세계자연유산으로, 숨막히는 일출 전경을 제공합니다.",
                detailedDescription: "성산일출봉은 10만 년 전 바다에서 화산 폭발로 솟아올랐습니다. 제주도 동쪽 끝에 위치하며 정상에는 거대한 분화구가 있습니다. 분화구는 지름 약 600m, 높이 90m입니다. 분화구를 둘러싼 99개의 날카로운 바위들이 마치 거대한 왕관처럼 보입니다. 남동쪽과 북쪽은 절벽인 반면, 북서쪽은 성산 마을과 연결된 푸른 잔디 언덕입니다. 능선은 산책과 승마를 즐기기에 이상적인 장소입니다."
            }
        }
    },
    {
        id: 'jeju_hallasan',
        cityId: 'jeju',
        name: 'Hallasan National Park',
        lat: 33.3617,
        lng: 126.5292,
        radius: 1000,
        narration: "Rising proudly at the center of Jeju Island, Hallasan Mountain is a shield volcano and the highest peak in South Korea. It is a place of profound spiritual significance and breathtaking natural beauty. As you hike its trails, observe the diverse ecosystem, ranging from subtropical forests at the base to alpine plants at the summit. The crater lake, Baengnokdam, meaning 'White Deer Lake', adds a mystical charm to the landscape, inviting you to reflect on the legends of immortals who once roamed here.",
        description: "The highest mountain in South Korea, a dormant volcano with a crater lake and diverse ecosystem.",
        category: "Nature",
        detailedDescription: "Hallasan is a shield volcano on Jeju Island and the highest mountain in South Korea. The area around the mountain is a designated national park, the Hallasan National Park. Hallasan is commonly considered to be one of the three main mountains of South Korea, with Jirisan and Seoraksan. Be sure to check the weather and trail conditions before hiking, as the weather can change rapidly.",
        photos: ["https://images.unsplash.com/photo-1616723293883-937b275276c1?auto=format&fit=crop&q=80&w=1000"],
        translations: {
            ko: {
                name: "한라산 국립공원",
                narration: "제주도 중심에 우뚝 솟은 한라산은 순상 화산이자 대한민국에서 가장 높은 산입니다. 이곳은 깊은 영적 의미와 숨막히는 자연의 아름다움을 간직한 곳입니다. 등산로를 따라 걸으며 기슭의 아열대 숲부터 정상의 고산 식물까지 다양한 생태계를 관찰해 보세요. '흰 사슴 연못'이라는 뜻의 분화구 호수 백록담은 풍경에 신비로운 매력을 더하며, 이곳을 거닐던 신선들의 전설을 떠올리게 합니다.",
                description: "대한민국에서 가장 높은 산으로, 분화구 호수와 다양한 생태계를 갖춘 휴화산입니다.",
                detailedDescription: "한라산은 제주도에 있는 순상 화산으로 남한에서 가장 높은 산입니다. 산 주변 지역은 한라산 국립공원으로 지정되어 있습니다. 한라산은 지리산, 설악산과 함께 남한의 3대 명산 중 하나로 꼽힙니다. 날씨가 급변할 수 있으므로 등반 전에 반드시 날씨와 탐방로 상태를 확인하세요."
            }
        }
    },
    {
        id: 'jeju_manjanggul',
        cityId: 'jeju',
        name: 'Manjanggul Cave',
        lat: 33.5283,
        lng: 126.7716,
        radius: 300,
        narration: "Enter the cool, dark embrace of Manjanggul Cave, one of the finest lava tunnels in the world. Formed by flowing lava centuries ago, this subterranean wonder stretches for kilometers beneath the earth. Marvel at the intricate lava stalactites and the massive lava column, the largest of its kind, standing as a silent sentinel of volcanic history. The damp air and the sound of dripping water create an atmosphere of mystery and exploration.",
        description: "One of the longest lava tubes in the world, featuring unique lava formations.",
        category: "Nature",
        detailedDescription: "Manjanggul Cave is one of the finest lava tunnels in the world, and is a designated natural monument. A lava tunnel is formed when the lava that was deep in the ground spouts from the peak and flows to the surface. Manjanggul Cave has a variety of interesting structures inside including 70cm lava stalagmites and the lava tube tunnels.",
        photos: ["https://images.unsplash.com/photo-1572922114030-cf228892bb8b?auto=format&fit=crop&q=80&w=1000"],
        translations: {
            ko: {
                name: "만장굴",
                narration: "세계에서 가장 훌륭한 용암 동굴 중 하나인 만장굴의 시원하고 어두운 품으로 들어가 보세요. 수세기 전 흐르는 용암에 의해 형성된 이 지하의 경이로움은 지하 수 킬로미터에 걸쳐 뻗어 있습니다. 복잡한 용암 종유석과 동종 최대 규모의 거대한 용암 석주가 화산 역사의 침묵의 파수꾼처럼 서 있는 모습에 감탄해 보세요. 축축한 공기와 물 떨어지는 소리가 신비롭고 탐험적인 분위기를 자아냅니다.",
                description: "독특한 용암 지형을 특징으로 하는 세계에서 가장 긴 용암 동굴 중 하나입니다.",
                detailedDescription: "만장굴은 세계적으로 손꼽히는 우수한 용암 동굴로 천연기념물로 지정되어 있습니다. 용암 동굴은 땅 깊은 곳에 있던 용암이 분출하여 지표면으로 흘러나올 때 형성됩니다. 만장굴 내부에는 70cm 용암 석순과 용암 튜브 터널 등 다양한 흥미로운 구조물이 있습니다."
            }
        }
    },
    // New York Landmarks
    {
        id: 'ny_statue_of_liberty',
        cityId: 'new-york',
        name: 'Statue of Liberty',
        lat: 40.6892,
        lng: -74.0445,
        radius: 300,
        narration: "Standing tall in New York Harbor, the Statue of Liberty is a universal symbol of freedom and democracy. A gift from France to the United States using a metal framework built by Gustave Eiffel, 'Lady Liberty' has welcomed millions of immigrants arriving by sea. Feel the harbor breeze and gaze up at her torch, lighting the way to liberty. The tablet she holds is inscribed with the date of the American Declaration of Independence.",
        description: "Iconic copper statue, a symbol of freedom and democracy, on Liberty Island.",
        category: "Landmark",
        detailedDescription: "The Statue of Liberty is a colossal neoclassical sculpture on Liberty Island in New York Harbor within New York City, in the United States. The copper statue, a gift from the people of France to the people of the United States, was designed by French sculptor Frédéric Auguste Bartholdi and its metal framework was built by Gustave Eiffel. The statue was dedicated on October 28, 1886.",
        photos: [
            "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "자유의 여신상",
                narration: "뉴욕 항구에 우뚝 선 자유의 여신상은 자유와 민주주의의 보편적 상징입니다. 귀스타브 에펠이 만든 철골 구조를 사용하여 프랑스가 미국에 선물한 '자유의 여신'은 배를 타고 도착하는 수백만 명의 이민자들을 맞이했습니다. 항구의 바람을 느끼며 자유의 길을 밝히는 횃불을 올려다보세요. 그녀가 들고 있는 서판에는 미국 독립 선언 날짜가 새겨져 있습니다.",
                description: "리버티 섬에 있는 상징적인 구리 조각상으로, 자유와 민주주의의 상징입니다.",
                detailedDescription: "자유의 여신상은 미국 뉴욕시 뉴욕 항구의 리버티 섬에 있는 거대한 신고전주의 조각상입니다. 프랑스 국민이 미국 국민에게 선물한 이 구리 조각상은 프랑스 조각가 프레데리크 오귀스트 바르톨디가 디자인했으며 금속 골격은 귀스타브 에펠이 제작했습니다. 1886년 10월 28일에 헌정되었습니다."
            }
        }
    },
    {
        id: 'ny_central_park',
        cityId: 'new-york',
        name: 'Central Park',
        lat: 40.785091,
        lng: -73.968285,
        radius: 1000,
        narration: "Escape the concrete jungle into the lush, green heart of Manhattan. Central Park is an urban oasis, a masterpiece of landscape architecture designed by Frederick Law Olmsted and Calvert Vaux. Listen to the rustling leaves, the laughter of children, and the clip-clop of horse-drawn carriages. Whether you're relaxing on the Great Lawn, strolling through the Ramble, or admiring the Bethesda Terrace, the park offers a peaceful retreat from the city's hustle and bustle.",
        description: "Expansive urban park in Manhattan, offering a peaceful retreat with lakes, trails, and zoo.",
        category: "Park",
        detailedDescription: "Central Park is an urban park in New York City located between the Upper West and Upper East Sides of Manhattan. It is the fifth-largest park in the city by area, covering 843 acres (341 ha). It is the most visited urban park in the United States, with an estimated 42 million visitors annually, and is the most filmed location in the world.",
        photos: ["https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80&w=1000"],
        translations: {
            ko: {
                name: "센트럴 파크",
                narration: "콘크리트 정글을 벗어나 맨해튼의 푸른 심장부로 들어와 보세요. 센트럴 파크는 프레데릭 로 옴스테드와 칼버트 보가 설계한 조경 건축의 걸작이자 도심 속 오아시스입니다. 나뭇잎이 바스락거리는 소리, 아이들의 웃음소리, 마차의 말발굽 소리에 귀를 기울여보세요. 그레이트 론에서 휴식을 취하든, 램블을 산책하든, 베데스다 테라스를 감상하든, 공원은 도시의 번잡함에서 벗어나 평화로운 휴식을 제공합니다.",
                description: "맨해튼에 있는 광활한 도심 공원으로 호수, 산책로, 동물원이 있어 평화로운 휴식을 제공합니다.",
                detailedDescription: "센트럴 파크는 맨해튼의 어퍼 웨스트 사이드와 어퍼 이스트 사이드 사이에 위치한 뉴욕시의 도심 공원입니다. 면적은 843에이커(341헥타르)로 도시에서 다섯 번째로 큰 공원입니다. 연간 약 4,200만 명이 방문하는 미국에서 가장 많이 방문하는 도심 공원이며, 세계에서 가장 많이 촬영된 장소입니다."
            }
        }
    },
    // Tokyo Landmarks
    {
        id: 'tokyo_tower',
        cityId: 'tokyo',
        name: 'Tokyo Tower',
        lat: 35.6586,
        lng: 139.7454,
        radius: 300,
        narration: "Gaze upon the iconic red and white lattice structure of Tokyo Tower, a symbol of Japan's post-war rebirth and modernization. Inspired by the Eiffel Tower but painted in vibrant aviation colors, it stands as a beacon in the Tokyo skyline. Ascend to the observation decks for a panoramic view of the sprawling metropolis, or admire its illumination at night, which changes with the seasons and events.",
        description: "Iconic red and white communications and observation tower, inspired by the Eiffel Tower.",
        category: "Landmark",
        detailedDescription: "Tokyo Tower is a communications and observation tower in the Shiba-koen district of Minato, Tokyo, Japan, built in 1958. At 332.9 meters (1,092 ft), it is the second-tallest structure in Japan. The structure is an Eiffel Tower-inspired lattice tower that is painted white and international orange to comply with air safety regulations.",
        photos: [
            "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "도쿄 타워",
                narration: "일본의 전후 재건과 근대화의 상징인 도쿄 타워의 상징적인 붉은색과 흰색 격자 구조를 바라보세요. 에펠탑에서 영감을 얻었지만 선명한 항공 색상으로 칠해진 이 타워는 도쿄 스카이라인의 등대와도 같습니다. 전망대에 올라 거대 도시의 파노라마 전경을 감상하거나 계절과 행사에 따라 바뀌는 밤의 조명을 감상해 보세요.",
                description: "에펠탑에서 영감을 받은 상징적인 붉은색과 흰색의 통신 및 전망 타워입니다.",
                detailedDescription: "도쿄 타워는 1958년에 지어진 일본 도쿄 미나토구 시바공원 지구에 있는 통신 및 전망 타워입니다. 높이 332.9m(1,092피트)로 일본에서 두 번째로 높은 구조물입니다. 이 구조물은 에펠탑에서 영감을 받은 격자 타워로 항공 안전 규정을 준수하기 위해 흰색과 인터내셔널 오렌지색으로 칠해져 있습니다."
            }
        }
    },
    {
        id: 'tokyo_sensoji',
        cityId: 'tokyo',
        name: 'Senso-ji Temple',
        lat: 35.7148,
        lng: 139.7967,
        radius: 300,
        narration: "Step back in time at Senso-ji, Tokyo's oldest and most colorful temple. Pass through the Kaminarimon (Thunder Gate) with its massive red lantern and stroll down Nakamise-dori, a bustling shopping street lined with traditional snacks and souvenirs. The scent of incense wafts through the air as you approach the main hall, dedicated to Kannon, the goddess of mercy. Experience the spiritual heart of Tokyo amidst the vibrant energy of Asakusa.",
        description: "Tokyo's oldest Buddhist temple, famous for its giant red lantern and vibrant shopping street.",
        category: "Culture",
        detailedDescription: "Sensō-ji is an ancient Buddhist temple located in Asakusa, Tokyo, Japan. It is Tokyo's oldest-established temple, and one of its most significant. Formerly associated with the Tendai sect of Buddhism, it became independent after World War II. Adjacent to the temple is a five-story pagoda, the Asakusa Shinto shrine, as well as many shops with traditional goods in the Nakamise-dori.",
        photos: ["https://images.unsplash.com/photo-1583946653026-62c6488d56b0?auto=format&fit=crop&q=80&w=1000"],
        translations: {
            ko: {
                name: "센소지",
                narration: "도쿄에서 가장 오래되고 화려한 사원인 센소지에서 과거로의 여행을 떠나보세요. 거대한 붉은 제등이 있는 가미나리문(천둥문)을 지나 전통 간식과 기념품이 즐비한 활기찬 쇼핑 거리인 나카미세도리를 거닐어 보세요. 자비의 여신 관음에게 헌정된 본당에 다가갈수록 향 냄새가 공기 중에 퍼집니다. 아사쿠사의 활기찬 에너지 속에서 도쿄의 영적 심장부를 경험해 보세요.",
                description: "도쿄에서 가장 오래된 불교 사원으로, 거대한 붉은 제등과 활기찬 쇼핑 거리로 유명합니다.",
                detailedDescription: "센소지는 일본 도쿄 아사쿠사에 위치한 고대 불교 사원입니다. 도쿄에서 가장 오래된 사원이자 가장 중요한 사원 중 하나입니다. 이전에는 천태종과 관련이 있었으나 2차 세계대전 이후 독립했습니다. 사원 옆에는 5층 탑, 아사쿠사 신사, 그리고 나카미세도리에 전통 상품을 파는 많은 상점이 있습니다."
            }
        }
    },
    // Busan Landmarks
    {
        id: 'busan_haeundae',
        cityId: 'busan',
        name: 'Haeundae Beach',
        lat: 35.1587,
        lng: 129.1604,
        radius: 500,
        narration: "Feel the golden sand between your toes at Haeundae Beach, Korea's most famous and beloved beach. With its wide shoreline and shallow waters, it's a perfect playground for summer fun. The skyline of modern skyscrapers provides a dramatic backdrop to the azure sea. Whether you're enjoying a swim, watching street performances, or strolling along the moonlit shore, Haeundae offers a vibrant blend of city energy and coastal relaxation.",
        description: "South Korea's most famous beach, known for its fine sand, modern skyline, and festivals.",
        category: "Beach",
        detailedDescription: "Haeundae Beach is an urban beach in Busan, South Korea. It is often dubbed one of the country's most famous and beautiful beaches. The beach is busy year-round with various festivals and events, including the Busan International Film Festival (BIFF).",
        photos: [
            "https://images.unsplash.com/photo-1596541223963-c7a52e1f4007?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1629636267861-55db2ca2d76f?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "해운대 해수욕장",
                narration: "한국에서 가장 유명하고 사랑받는 해운대 해수욕장에서 발가락 사이로 느껴지는 황금빛 모래를 느껴보세요. 넓은 해안선과 얕은 수심으로 여름 물놀이를 즐기기에 완벽한 곳입니다. 현대적인 고층 빌딩의 스카이라인이 푸른 바다를 배경으로 드라마틱한 풍경을 연출합니다. 수영을 즐기거나, 거리 공연을 구경하거나, 달빛 비치는 해변을 산책하든, 해운대는 도시의 활기와 해안의 휴식이 어우러진 생동감 넘치는 곳입니다.",
                description: "고운 모래, 현대적인 스카이라인, 축제로 유명한 대한민국 최고의 해변입니다.",
                detailedDescription: "해운대 해수욕장은 대한민국 부산의 도심 해변입니다. 종종 전국에서 가장 유명하고 아름다운 해변 중 하나로 불립니다. 이 해변은 부산국제영화제(BIFF)를 포함한 다양한 축제와 행사로 일년 내내 붐빕니다."
            }
        }
    },
    {
        id: 'busan_gamcheon',
        cityId: 'busan',
        name: 'Gamcheon Culture Village',
        lat: 35.0975,
        lng: 129.0106,
        radius: 500,
        narration: "Wander through the maze-like alleys of Gamcheon Culture Village, often called the 'Machu Picchu of Busan' or 'Santorini of Korea'. This colorful hillside community is a living art gallery, adorned with vibrant murals and sculptures. Originally a refugee camp during the Korean War, it has transformed into a cultural hub. Discover charming cafes, art shops, and photo spots around every corner, and appreciate the resilience and creativity of its residents.",
        description: "Colorful hillside village known for its steep streets, twisting alleys, and vibrant murals.",
        category: "Culture",
        detailedDescription: "Gamcheon Culture Village is a town within Gamcheon-dong, Saha District, Busan, South Korea. The area is known for its steep streets, twisting alleys, and brightly painted houses, which have been restored and enhanced in recent years to attract tourism.",
        photos: ["https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&q=80&w=1000"], // Placeholder, replace with actual Gamcheon if found
        translations: {
            ko: {
                name: "감천문화마을",
                narration: "'부산의 마추픽추' 또는 '한국의 산토리니'로 불리는 감천문화마을의 미로 같은 골목을 거닐어 보세요. 이 다채로운 언덕 위 공동체는 활기찬 벽화와 조각품으로 장식된 살아있는 미술관입니다. 원래 한국 전쟁 당시 피난민 캠프였던 이곳은 문화 중심지로 탈바꿈했습니다. 구석구석 매력적인 카페, 예술 상점, 포토 스폿을 발견하고 주민들의 회복력과 창의성에 감탄해 보세요.",
                description: "가파른 거리, 구불구불한 골목, 활기찬 벽화로 유명한 알록달록한 언덕 마을입니다.",
                detailedDescription: "감천문화마을은 대한민국 부산 사하구 감천동에 있는 마을입니다. 가파른 거리, 구불구불한 골목, 밝게 칠해진 집들로 유명하며, 최근 몇 년 동안 관광객 유치를 위해 복원 및 개선되었습니다."
            }
        }
    },
    // Seoul Landmarks
    {
        id: 'seoul_gyeongbokgung',
        cityId: 'seoul',
        name: 'Gyeongbokgung Palace',
        lat: 37.5796,
        lng: 126.9770,
        radius: 500,
        narration: "Enter the grandeur of Gyeongbokgung Palace, the main royal palace of the Joseon Dynasty. Built in 1395, it stands as a testament to Korea's rich history and architectural elegance. Walk through the imposing Gwanghwamun Gate and admire the Geunjeongjeon Hall, where kings granted audiences. The palace grounds, with their lotus ponds and pavilions, offer a serene escape into the past, especially beautiful when people wearing Hanbok stroll through.",
        description: "The largest and most beautiful of the Five Grand Palaces of Seoul, built in 1395.",
        category: "History",
        detailedDescription: "Gyeongbokgung was the main royal palace of the Joseon dynasty. Built in 1395, it is located in northern Seoul, South Korea. The largest of the Five Grand Palaces built by the Joseon dynasty, Gyeongbokgung served as the home of Kings of the Joseon dynasty, the Kings' households, as well as the government of Joseon.",
        photos: [
            "https://images.unsplash.com/photo-1624707635677-4b7b3b3b3b3b?auto=format&fit=crop&q=80&w=1000",
            "https://images.unsplash.com/photo-1596767537060-da8ccba35352?auto=format&fit=crop&q=80&w=1000"
        ],
        translations: {
            ko: {
                name: "경복궁",
                narration: "조선 왕조의 법궁인 경복궁의 웅장함 속으로 들어가 보세요. 1395년에 지어진 이곳은 한국의 풍부한 역사와 건축적 우아함을 증명합니다. 웅장한 광화문을 지나 왕이 조회를 열던 근정전을 감상해 보세요. 연꽃 연못과 정자가 있는 궁궐 경내는 과거로의 고요한 여행을 선사하며, 특히 한복을 입은 사람들이 거닐 때 더욱 아름답습니다.",
                description: "1395년에 지어진 서울의 5대 궁궐 중 가장 크고 아름다운 궁궐입니다.",
                detailedDescription: "경복궁은 조선 왕조의 법궁이었습니다. 1395년에 지어졌으며 대한민국 서울 북부에 위치해 있습니다. 조선 왕조가 지은 5대 궁궐 중 가장 큰 경복궁은 조선 왕조의 왕과 왕실 가족의 거처이자 조선 정부의 중심지였습니다."
            }
        }
    },
    {
        id: 'seoul_n_tower',
        cityId: 'seoul',
        name: 'N Seoul Tower',
        lat: 37.5512,
        lng: 126.9882,
        radius: 300,
        narration: "Rise above the city at N Seoul Tower, located atop Namsan Mountain. A romantic landmark and symbol of Seoul, it offers breathtaking 360-degree views of the metropolis. Secure a 'love lock' on the fence as a promise of eternal love, or simply enjoy the vibrant cityscape that sparkles below at night. The tower is a beacon of culture and leisure, visible from almost anywhere in the city.",
        description: "Iconic communication and observation tower on Namsan Mountain, offering panoramic views.",
        category: "Landmark",
        detailedDescription: "The N Seoul Tower, officially the YTN Seoul Tower and commonly known as the Namsan Tower or Seoul Tower, is a communication and observation tower located on Namsan Mountain in central Seoul, South Korea. At 236 meters (774 ft), it marks the second highest point in Seoul.",
        photos: ["https://images.unsplash.com/photo-1546874177-9e664107314e?auto=format&fit=crop&q=80&w=1000"],
        translations: {
            ko: {
                name: "N서울타워",
                narration: "남산 정상에 위치한 N서울타워에서 도시 위로 올라가 보세요. 서울의 로맨틱한 랜드마크이자 상징인 이곳은 숨막히는 360도 도시 전경을 제공합니다. 영원한 사랑의 약속으로 울타리에 '사랑의 자물쇠'를 채우거나, 밤에 아래로 반짝이는 활기찬 도시 풍경을 즐겨보세요. 이 타워는 도시 어디에서나 볼 수 있는 문화와 레저의 등대입니다.",
                description: "남산에 있는 상징적인 통신 및 전망 타워로, 파노라마 전경을 제공합니다.",
                detailedDescription: "공식적으로 YTN 서울타워, 흔히 남산타워 또는 서울타워로 알려진 N서울타워는 대한민국 서울 중심부의 남산에 위치한 통신 및 전망 타워입니다. 높이 236m(774피트)로 서울에서 두 번째로 높은 지점입니다."
            }
        }
    }
  },
{
    id: 'jeju_jeongbang',
        cityId: 'jeju',
            name: 'Jeongbang Falls',
                lat: 33.2447,
                    lng: 126.5714,
                        radius: 300,
                            narration: "Witness the unique spectacle of Jeongbang Falls, the only waterfall in Asia that falls directly into the ocean. The thunderous sound of the water crashing onto the rocks and the cool mist on your face create a refreshing experience. According to legend, a holy dragon lived underneath the waterfall. The inscription 'Seobulgwacha' on the cliff is said to have been carved by a servant of the Chinese Emperor Qin Shi Huang, who visited in search of the elixir of life.",
                                description: "The only waterfall in Asia that falls directly into the ocean.",
                                    category: "Nature",
                                        detailedDescription: "Jeongbang Waterfall is one of the three main waterfalls on Jeju Island, along with Cheonjiyeon Waterfall and Cheonjeyeon Waterfall. It is the only waterfall in Korea that falls directly into the sea. The waterfall is 23m high, 8m wide, and 5m deep. It is surrounded by vertical cliffs and pine trees.",
                                            photos: ["https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "정방폭포",
                narration: "아시아에서 유일하게 바다로 직접 떨어지는 정방폭포의 독특한 장관을 목격하세요. 바위에 부딪히는 웅장한 물소리와 얼굴에 닿는 시원한 물안개가 상쾌한 경험을 선사합니다. 전설에 따르면 폭포 아래에는 신성한 용이 살았다고 합니다. 절벽에 새겨진 '서불과차'라는 글귀는 중국 진시황의 신하가 불로초를 찾아 방문했다가 새긴 것으로 전해집니다.",
                    description: "아시아에서 유일하게 바다로 직접 떨어지는 폭포입니다.",
                        detailedDescription: "정방폭포는 천지연폭포, 천제연폭포와 함께 제주도 3대 폭포 중 하나입니다. 한국에서 유일하게 바다로 직접 떨어지는 폭포입니다. 높이 23m, 너비 8m, 깊이 5m입니다. 수직 절벽과 소나무 숲으로 둘러싸여 있습니다."
        }
    }
},
{
    id: 'jeju_jusangjeolli',
        cityId: 'jeju',
            name: 'Jusangjeolli Cliff',
                lat: 33.2378,
                    lng: 126.4251,
                        radius: 300,
                            narration: "Marvel at the geometric perfection of the Jusangjeolli Cliff, a spectacular volcanic rock formation resembling giant hexagonal pillars. Formed when lava from Hallasan Mountain cooled rapidly upon contact with the sea, these stone columns look as if they were carved by stonemasons. As the waves crash against the pillars, shooting water high into the air, contemplate the incredible forces of nature that shaped this masterpiece.",
                                description: "Spectacular volcanic rock formation featuring hexagonal basalt columns.",
                                    category: "Nature",
                                        detailedDescription: "The Jusangjeolli Cliff is a spectacular volcanic rock formation at the southern coast of Jeju Island. It is a designated natural monument. The cliff face is formed by columnar joints, which are hexagonal and pentagonal stone pillars. These were formed when the lava from Hallasan Mountain erupted into the sea of Jungmun.",
                                            photos: ["https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "주상절리대",
                narration: "거대한 육각형 기둥을 닮은 장관을 이루는 주상절리대의 기하학적 완벽함에 감탄해 보세요. 한라산에서 분출한 용암이 바다와 만나 급격히 식으면서 형성된 이 돌기둥들은 마치 석공이 조각한 것처럼 보입니다. 파도가 기둥에 부딪혀 공중으로 높이 치솟는 모습을 보며, 이 걸작을 빚어낸 자연의 놀라운 힘을 생각해 보세요.",
                    description: "육각형 현무암 기둥이 특징인 장관을 이루는 화산 암석 지형입니다.",
                        detailedDescription: "주상절리대는 제주도 남쪽 해안에 있는 장관을 이루는 화산 암석 지형으로 천연기념물로 지정되어 있습니다. 절벽면은 주상절리로 이루어져 있으며, 이는 육각형과 오각형의 돌기둥입니다. 한라산의 용암이 중문 앞바다로 분출하면서 형성되었습니다."
        }
    }
},
{
    id: 'jeju_seopjikoji',
        cityId: 'jeju',
            name: 'Seopjikoji',
                lat: 33.4239,
                    lng: 126.9292,
                        radius: 500,
                            narration: "Stroll along the scenic coast of Seopjikoji, famous for its fields of yellow canola flowers in spring and majestic coastal views year-round. Unlike other volcanic cones, it is made of red volcanic ash, creating a striking contrast with the blue sea. The white lighthouse standing at the end of the hill adds a romantic touch to the landscape, making it a popular filming location for Korean dramas.",
                                description: "Scenic coastal cape known for canola flowers, lighthouse, and dramatic cliffs.",
                                    category: "Nature",
                                        detailedDescription: "Seopjikoji is located at the end of the eastern shore of Jeju Island. 'Seopji' is the old name for the area, and 'Koji' is Jeju dialect meaning a sudden bump on land. The area is made of red volcanic ash called scoria. The fantastic rock formations like Seondol hanging on the coastline and the lighthouse are the must-see points.",
                                            photos: ["https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "섭지코지",
                narration: "봄이면 노란 유채꽃밭으로, 사계절 내내 웅장한 해안 절경으로 유명한 섭지코지의 아름다운 해안을 거닐어 보세요. 다른 오름과 달리 붉은 화산재로 이루어져 있어 푸른 바다와 강렬한 대조를 이룹니다. 언덕 끝에 서 있는 하얀 등대는 풍경에 로맨틱한 분위기를 더하며 한국 드라마의 인기 촬영지로도 유명합니다.",
                    description: "유채꽃, 등대, 드라마틱한 절벽으로 유명한 아름다운 해안 곶입니다.",
                        detailedDescription: "섭지코지는 제주도 동쪽 해안 끝에 위치해 있습니다. '섭지'는 이 지역의 옛 이름이고, '코지'는 땅이 튀어나온 곳을 뜻하는 제주 방언입니다. 이 지역은 송이(scoria)라고 불리는 붉은 화산재로 이루어져 있습니다. 해안선에 걸려 있는 선돌과 같은 환상적인 기암괴석과 등대는 놓쳐선 안 될 볼거리입니다."
        }
    }
},
// New York (Remaining)
{
    id: 'ny_empire_state',
        cityId: 'new-york',
            name: 'Empire State Building',
                lat: 40.7484,
                    lng: -73.9857,
                        radius: 300,
                            narration: "Look up at the Art Deco masterpiece that defined the New York skyline for decades. The Empire State Building, once the tallest building in the world, stands as a monument to American ambition and engineering. Visit the open-air observatory on the 86th floor for unforgettable views of the city that never sleeps. At night, its tower lights dazzle in colors celebrating holidays and special occasions.",
                                description: "Famous Art Deco skyscraper offering observation decks with city views.",
                                    category: "Landmark",
                                        detailedDescription: "The Empire State Building is a 102-story Art Deco skyscraper in Midtown Manhattan in New York City. It was designed by Shreve, Lamb & Harmon and built from 1930 to 1931. Its name is derived from 'Empire State', the nickname of the state of New York.",
                                            photos: ["https://images.unsplash.com/photo-1550664776-3a131846c26b?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "엠파이어 스테이트 빌딩",
                narration: "수십 년간 뉴욕의 스카이라인을 정의해 온 아르데코 걸작을 올려다보세요. 한때 세계에서 가장 높은 건물이었던 엠파이어 스테이트 빌딩은 미국의 야망과 공학 기술을 보여주는 기념비입니다. 86층 야외 전망대에서 잠들지 않는 도시의 잊지 못할 전망을 감상하세요. 밤에는 타워 조명이 휴일과 특별한 날을 축하하며 다채로운 색상으로 빛납니다.",
                    description: "도시 전망을 제공하는 전망대가 있는 유명한 아르데코 양식의 초고층 빌딩입니다.",
                        detailedDescription: "엠파이어 스테이트 빌딩은 뉴욕시 맨해튼 미드타운에 있는 102층짜리 아르데코 초고층 빌딩입니다. 슈리브, 램 앤 하먼이 설계하여 1930년부터 1931년까지 지어졌습니다. 이름은 뉴욕주의 별명인 '엠파이어 스테이트'에서 유래되었습니다."
        }
    }
},
{
    id: 'ny_times_square',
        cityId: 'new-york',
            name: 'Times Square',
                lat: 40.7580,
                    lng: -73.9855,
                        radius: 300,
                            narration: "Immerse yourself in the bright lights and bustling energy of Times Square, 'The Crossroads of the World'. Surrounded by massive digital billboards and Broadway theaters, this iconic intersection is the heartbeat of New York City's entertainment district. Feel the pulse of the city as crowds gather, street performers entertain, and the famous New Year's Eve ball dropping tradition comes to mind.",
                                description: "Bustling commercial intersection, protected by billboards and advertisements.",
                                    category: "Landmark",
                                        detailedDescription: "Times Square is a major commercial intersection, tourist destination, entertainment center, and neighborhood in the Midtown Manhattan section of New York City. It is formed by the junction of Broadway, Seventh Avenue, and 42nd Street.",
                                            photos: ["https://images.unsplash.com/photo-1534270804882-6b5048b1c1fc?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "타임스 스퀘어",
                narration: "'세계의 교차로' 타임스 스퀘어의 밝은 조명과 넘치는 에너지에 빠져보세요. 거대한 디지털 전광판과 브로드웨이 극장으로 둘러싸인 이 상징적인 교차로는 뉴욕시 엔터테인먼트 지구의 심장부입니다. 군중이 모이고, 거리 공연자들이 즐거움을 선사하며, 유명한 새해 전야 볼 드롭 전통이 떠오르는 이곳에서 도시의 맥동을 느껴보세요.",
                    description: "전광판과 광고로 둘러싸인 붐비는 상업 교차로입니다.",
                        detailedDescription: "타임스 스퀘어는 뉴욕시 맨해튼 미드타운 구역에 있는 주요 상업 교차로, 관광지, 엔터테인먼트 센터 및 지역입니다. 브로드웨이, 7번가, 42번가가 만나는 곳에 형성되어 있습니다."
        }
    }
},
{
    id: 'ny_brooklyn_bridge',
        cityId: 'new-york',
            name: 'Brooklyn Bridge',
                lat: 40.7061,
                    lng: -73.9969,
                        radius: 500,
                            narration: "Walk across the historic Brooklyn Bridge, one of the oldest roadway bridges in the United States. Its stunning Gothic Revival stone towers and intricate web of steel cables make it an architectural marvel. As you stroll along the elevated pedestrian walkway, enjoy panoramic views of the Manhattan skyline, the East River, and the Statue of Liberty in the distance.",
                                description: "Historic suspension bridge connecting Manhattan and Brooklyn.",
                                    category: "Landmark",
                                        detailedDescription: "The Brooklyn Bridge is a hybrid cable-stayed/suspension bridge in New York City, spanning the East River between the boroughs of Manhattan and Brooklyn. Opened on May 24, 1883, the Brooklyn Bridge was the first fixed crossing across the East River.",
                                            photos: ["https://images.unsplash.com/photo-1506861596841-48357f44d9f6?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "브루클린 브리지",
                narration: "미국에서 가장 오래된 도로 교량 중 하나인 역사적인 브루클린 브리지를 걸어보세요. 멋진 고딕 부흥 양식의 석조 타워와 복잡한 강철 케이블 그물망은 건축적 경이로움을 선사합니다. 고가 보행자 도로를 따라 걸으며 맨해튼 스카이라인, 이스트 리버, 멀리 보이는 자유의 여신상의 파노라마 전경을 즐기세요.",
                    description: "맨해튼과 브루클린을 연결하는 역사적인 현수교입니다.",
                        detailedDescription: "브루클린 브리지는 뉴욕시의 맨해튼과 브루클린 자치구를 잇는 이스트 리버를 가로지르는 하이브리드 사장교/현수교입니다. 1883년 5월 24일에 개통된 브루클린 브리지는 이스트 리버를 가로지르는 최초의 고정 횡단로였습니다."
        }
    }
},
{
    id: 'ny_met_museum',
        cityId: 'new-york',
            name: 'The Metropolitan Museum of Art',
                lat: 40.7794,
                    lng: -73.9632,
                        radius: 300,
                            narration: "Explore 5,000 years of art from around the world at The Met, one of the largest and most prestigious art museums on the planet. From ancient Egyptian temples to contemporary masterpieces, the museum's vast collection invites you on a journey through human creativity. Get lost in the galleries, admire the Temple of Dendur, and find inspiration in the countless treasures housed within this cultural institution.",
                                description: "One of the world's largest and most comprehensive art museums.",
                                    category: "Museum",
                                        detailedDescription: "The Metropolitan Museum of Art of New York City, colloquially 'the Met', is the largest art museum in the Americas. Its permanent collection contains over two million works, divided among 17 curatorial departments.",
                                            photos: ["https://images.unsplash.com/photo-1549487050-705b76839359?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "메트로폴리탄 미술관",
                narration: "세계에서 가장 크고 권위 있는 미술관 중 하나인 메트에서 전 세계 5,000년의 예술을 탐험해 보세요. 고대 이집트 신전부터 현대 걸작에 이르기까지 박물관의 방대한 컬렉션은 인간 창의성의 여정으로 여러분을 초대합니다. 갤러리에서 길을 잃어보고, 덴두르 신전을 감상하고, 이 문화 기관에 보관된 수많은 보물에서 영감을 얻으세요.",
                    description: "세계에서 가장 크고 포괄적인 미술관 중 하나입니다.",
                        detailedDescription: "뉴욕시의 메트로폴리탄 미술관(통칭 '더 메트')은 아메리카 대륙에서 가장 큰 미술관입니다. 영구 소장품은 17개 큐레이터 부서로 나뉘어 있으며 200만 점이 넘습니다."
        }
    }
},
// Tokyo (Remaining)
{
    id: 'tokyo_shibuya_crossing',
        cityId: 'tokyo',
            name: 'Shibuya Crossing',
                lat: 35.6595,
                    lng: 139.7004,
                        radius: 200,
                            narration: "Experience the organized chaos of Shibuya Crossing, often called the busiest pedestrian intersection in the world. When the traffic lights turn red, a sea of people flood the street from all directions, creating a mesmerizing spectacle of urban life. Watch the scene unfold from a nearby cafe or join the crowd to feel the pulse of Tokyo. Don't forget to visit the loyal dog Hachiko statue nearby.",
                                description: "World-famous scramble crossing, known as the busiest pedestrian intersection.",
                                    category: "Landmark",
                                        detailedDescription: "Shibuya Crossing, or Shibuya Scramble Crossing, is a popular scramble crossing in Shibuya, Tokyo, Japan. It is located in front of the Shibuya Station Hachikō exit and stops vehicles in all directions to allow pedestrians to inundate the entire intersection.",
                                            photos: ["https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "시부야 스크램블 교차로",
                narration: "세계에서 가장 붐비는 보행자 교차로로 불리는 시부야 교차로의 질서 있는 혼란을 경험해 보세요. 신호등이 빨간불로 바뀌면 사방에서 인파가 거리로 쏟아져 나와 도시 생활의 매혹적인 장관을 연출합니다. 근처 카페에서 장면이 펼쳐지는 것을 지켜보거나 군중 속에 합류하여 도쿄의 맥동을 느껴보세요. 근처에 있는 충견 하치코 동상을 방문하는 것도 잊지 마세요.",
                    description: "가장 붐비는 보행자 교차로로 알려진 세계적으로 유명한 스크램블 교차로입니다.",
                        detailedDescription: "시부야 교차로 또는 시부야 스크램블 교차로는 일본 도쿄 시부야에 있는 인기 있는 스크램블 교차로입니다. 시부야역 하치코 출구 앞에 위치하며 보행자가 교차로 전체를 가득 메울 수 있도록 모든 방향의 차량을 정지시킵니다."
        }
    }
},
{
    id: 'tokyo_meiji_jingu',
        cityId: 'tokyo',
            name: 'Meiji Jingu Shrine',
                lat: 35.6764,
                    lng: 139.6993,
                        radius: 500,
                            narration: "Find tranquility in the heart of the city at Meiji Jingu, a Shinto shrine dedicated to Emperor Meiji and his consort. Walk through the massive torii gates into a lush forest of 100,000 trees, a serene escape from the urban noise. Participate in traditional rituals, write a wish on an Ema voting tablet, and admire the shrine's austere beauty. It's a place to connect with Japan's spiritual heritage.",
                                description: "Shinto shrine dedicated to Emperor Meiji, located in a lush forest.",
                                    category: "Culture",
                                        detailedDescription: "Meiji Jingu is a Shinto shrine in Shibuya, Tokyo, that is dedicated to the deified spirits of Emperor Meiji and his wife, Empress Shōken. The shrine does not contain the emperor's grave, which is located at Fushimi-momoyama, south of Kyoto.",
                                            photos: ["https://images.unsplash.com/photo-1588722830846-5fd214214f48?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "메이지 신궁",
                narration: "메이지 천황과 황태후를 모시는 신사인 메이지 신궁에서 도심 속 평온함을 찾아보세요. 거대한 도리이 문을 지나 10만 그루의 나무가 우거진 숲으로 들어가면 도시의 소음에서 벗어난 고요한 휴식처가 나옵니다. 전통 의식에 참여하고, 에마 소원패에 소원을 적고, 신사의 엄숙한 아름다움을 감상해 보세요. 일본의 영적 유산과 소통할 수 있는 곳입니다.",
                    description: "울창한 숲에 위치한 메이지 천황을 모시는 신사입니다.",
                        detailedDescription: "메이지 신궁은 도쿄 시부야에 있는 신사로 메이지 천황과 그의 아내 쇼켄 황태후의 신령을 모십니다. 신사에는 교토 남쪽 후시미 모모야마에 위치한 천황의 무덤이 없습니다."
        }
    }
},
{
    id: 'tokyo_skytree',
        cityId: 'tokyo',
            name: 'Tokyo Skytree',
                lat: 35.7100,
                    lng: 139.8107,
                        radius: 300,
                            narration: "Look up at the tallest structure in Japan, the Tokyo Skytree. This broadcasting and observation tower blends traditional Japanese aesthetics with futuristic design. From its dizzying heights, enjoy unparalleled views of the Kanto region, and on clear days, even Mount Fuji. Explore the Solamachi shopping complex at its base for a taste of modern Tokyo lifestyle.",
                                description: "Tallest structure in Japan, broadcasting tower with observation decks.",
                                    category: "Landmark",
                                        detailedDescription: "Tokyo Skytree is a broadcasting and observation tower in Sumida, Tokyo. It became the tallest structure in Japan in 2010 and reached its full height of 634 meters in March 2011, making it the tallest tower in the world.",
                                            photos: ["https://images.unsplash.com/photo-1533559662493-90374e2a1599?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "도쿄 스카이트리",
                narration: "일본에서 가장 높은 구조물인 도쿄 스카이트리를 올려다보세요. 이 방송 및 전망 타워는 일본의 전통 미학과 미래지향적인 디자인을 조화시켰습니다. 아찔한 높이에서 관동 지방의 비할 데 없는 전망을 즐기고, 맑은 날에는 후지산까지 감상할 수 있습니다. 타워 아래에 있는 소라마치 쇼핑 단지를 둘러보며 현대 도쿄의 라이프스타일을 맛보세요.",
                    description: "일본에서 가장 높은 구조물로, 전망대가 있는 방송 타워입니다.",
                        detailedDescription: "도쿄 스카이트리는 도쿄 스미다구에 있는 방송 및 전망 타워입니다. 2010년 일본에서 가장 높은 구조물이 되었으며 2011년 3월에 전체 높이 634미터에 도달하여 세계에서 가장 높은 타워가 되었습니다."
        }
    }
},
{
    id: 'tokyo_tsukiji',
        cityId: 'tokyo',
            name: 'Tsukiji Outer Market',
                lat: 35.6655,
                    lng: 139.7707,
                        radius: 300,
                            narration: "Satisfy your culinary curiosity at Tsukiji Outer Market, a food lover's paradise. Although the wholesale auction has moved, the outer market remains vibrant with hundreds of stalls selling fresh seafood, produce, and kitchenware. Sample fresh sushi, grilled scallops, and tamagoyaki (rolled omelet) as you navigate the narrow, bustling alleys. It's a sensory feast that captures the essence of Japan's food culture.",
                                description: "Famous food market with stalls selling seafood, produce, and street food.",
                                    category: "Food",
                                        detailedDescription: "Tsukiji Outer Market is a district adjacent to the site of the former Tsukiji Wholesale Market. It consists of a few blocks of wholesale and retail shops, as well as restaurants crowded along narrow lanes. Here you can find fresh seafood, produce and food-related goods.",
                                            photos: ["https://images.unsplash.com/photo-1540645603831-430c0428525f?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "츠키지 장외시장",
                narration: "미식가들의 천국인 츠키지 장외시장에서 요리 호기심을 충족시켜 보세요. 도매 경매장은 이전했지만 장외시장은 신선한 해산물, 농산물, 주방용품을 파는 수백 개의 노점으로 여전히 활기가 넘칩니다. 좁고 붐비는 골목을 누비며 신선한 초밥, 가리비 구이, 다마고야키(계란말이)를 맛보세요. 일본 음식 문화의 정수를 보여주는 감각적인 축제입니다.",
                    description: "해산물, 농산물, 길거리 음식을 파는 노점이 있는 유명한 식품 시장입니다.",
                        detailedDescription: "츠키지 장외시장은 옛 츠키지 도매시장 부지에 인접한 구역입니다. 좁은 골목을 따라 밀집한 도매 및 소매점과 식당으로 구성되어 있습니다. 이곳에서는 신선한 해산물, 농산물 및 식품 관련 상품을 찾을 수 있습니다."
        }
    }
},
// Busan (Remaining)
{
    id: 'busan_haedong',
        cityId: 'busan',
            name: 'Haedong Yonggungsa Temple',
                lat: 35.1887,
                    lng: 129.2234,
                        radius: 300,
                            narration: "Discover the rare beauty of Haedong Yonggungsa, a Buddhist temple situated on the coast. Unlike most temples found in mountains, this one offers a stunning ocean view. Listen to the waves crashing against the rocks as you explore the sanctuary dedicated to the Goddess of Mercy. It is said that if you pray here with all your heart, your wish will be granted.",
                                description: "Beautiful Buddhist temple situated on the coast, offering stunning ocean views.",
                                    category: "Culture",
                                        detailedDescription: "Haedong Yonggungsa Temple is located in Gijang-gun, Busan. The temple was built in 1376 by the teacher known as Naong during the Goryeo Dynasty, and was originally known as Bomun Temple. It is one of the few temples in Korea to be built on the seaside.",
                                            photos: ["https://images.unsplash.com/photo-1590425567308-33df4c352a88?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "해동용궁사",
                narration: "해안가에 위치한 불교 사찰인 해동용궁사의 희귀한 아름다움을 발견해 보세요. 산속에 있는 대부분의 사찰과 달리 이곳은 멋진 바다 전망을 제공합니다. 관세음보살을 모신 성소를 둘러보며 바위에 부딪히는 파도 소리를 들어보세요. 이곳에서 진심으로 기도하면 소원이 이루어진다는 전설이 있습니다.",
                    description: "해안가에 위치하여 멋진 바다 전망을 제공하는 아름다운 불교 사찰입니다.",
                        detailedDescription: "해동용궁사는 부산 기장군에 위치해 있습니다. 이 사찰은 1376년 고려 시대에 나옹 화상에 의해 창건되었으며 원래 보문사로 알려졌습니다. 바닷가에 지어진 한국의 몇 안 되는 사찰 중 하나입니다."
        }
    }
},
{
    id: 'busan_jagalchi',
        cityId: 'busan',
            name: 'Jagalchi Market',
                lat: 35.0967,
                    lng: 129.0305,
                        radius: 300,
                            narration: "Experience the raw energy of Korea's largest seafood market, Jagalchi Market. The famous slogan 'Oiso, Boiso, Saiso' (Come, See, Buy) welcomes you to rows of tanks filled with live fish, octopus, and crabs. Watch the 'Jagalchi Ajumma' (middle-aged women vendors) expertly handle the catch of the day. Enjoy fresh sashimi right on the spot and taste the authentic flavor of Busan.",
                                description: "Korea's largest seafood market, famous for fresh catch and lively atmosphere.",
                                    category: "Food",
                                        detailedDescription: "Jagalchi Market is a fish market in the neighborhood of Nampo-dong in Jung-gu, and Chungmu-dong, Seo-gu, Busan, South Korea. The market is located on the edge of Nampo Port (Busan). It is considered to be the largest fish market in South Korea.",
                                            photos: ["https://images.unsplash.com/photo-1580227974399-ce1231f61201?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "자갈치시장",
                narration: "한국 최대의 수산 시장인 자갈치시장의 활기찬 에너지를 경험해 보세요. '오이소, 보이소, 사이소'라는 유명한 슬로건이 살아있는 생선, 문어, 게로 가득 찬 수조 사이로 여러분을 맞이합니다. '자갈치 아지매'들이 그날 잡은 생선을 능숙하게 손질하는 모습을 지켜보세요. 그 자리에서 신선한 회를 즐기며 부산의 진정한 맛을 느껴보세요.",
                    description: "신선한 어획물과 활기찬 분위기로 유명한 한국 최대의 수산 시장입니다.",
                        detailedDescription: "자갈치시장은 대한민국 부산 중구 남포동과 서구 충무동에 있는 어시장입니다. 이 시장은 남포항(부산) 가장자리에 위치해 있습니다. 한국 최대의 어시장으로 간주됩니다."
        }
    }
},
{
    id: 'busan_gwangalli',
        cityId: 'busan',
            name: 'Gwangalli Beach',
                lat: 35.1532,
                    lng: 129.1189,
                        radius: 500,
                            narration: "Enjoy the romantic atmosphere of Gwangalli Beach, famous for its fine sand and the spectacular view of the Gwangan Bridge. At night, the bridge lights up in magnificent colors, creating a dazzling reflection on the dark water. The beachfront is lined with cafes, bars, and restaurants, making it a popular spot for young people and couples to enjoy the nightlife and ocean breeze.",
                                description: "Popular beach known for fine sand and views of the illuminated Gwangan Bridge.",
                                    category: "Beach",
                                        detailedDescription: "Gwangalli Beach is a beach in Busan, South Korea. It is located at Gwangan 2-dong, Suyeong-gu, Busan Metropolitan City, west of Haeundae Beach. It sits inside a cove spanned by the Gwangan Bridge.",
                                            photos: ["https://images.unsplash.com/photo-1569947849641-57d424263169?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "광안리 해수욕장",
                narration: "고운 모래와 광안대교의 환상적인 전망으로 유명한 광안리 해수욕장의 낭만적인 분위기를 즐겨보세요. 밤이 되면 다리는 웅장한 색으로 불을 밝혀 어두운 물 위에 눈부신 반영을 만들어냅니다. 해변가에는 카페, 바, 레스토랑이 즐비하여 젊은이들과 커플들이 밤문화와 바닷바람을 즐기기에 인기 있는 장소입니다.",
                    description: "고운 모래와 조명이 켜진 광안대교 전망으로 유명한 인기 해변입니다.",
                        detailedDescription: "광안리 해수욕장은 대한민국 부산에 있는 해변입니다. 부산광역시 수영구 광안2동에 위치하며 해운대 해수욕장 서쪽에 있습니다. 광안대교가 가로지르는 만 안쪽에 자리 잡고 있습니다."
        }
    }
},
{
    id: 'busan_taejongdae',
        cityId: 'busan',
            name: 'Taejongdae Park',
                lat: 35.0531,
                    lng: 129.0872,
                        radius: 800,
                            narration: "Explore the dramatic cliffs and lush forests of Taejongdae Park, located at the southernmost tip of Yeongdo Island. Named after King Taejong Muyeol of Silla who enjoyed shooting arrows here, it offers breathtaking panoramic views of the ocean. Hike through the pine trees to the lighthouse, or take the Danubi Train for a scenic ride. On glorious days, you can even see Tsushima Island in Japan.",
                                description: "Natural park featuring dramatic cliffs, a lighthouse, and ocean views.",
                                    category: "Nature",
                                        detailedDescription: "Taejongdae is a natural park of Busan, South Korea with magnificent cliffs facing the open sea on the southernmost tip of island of Yeongdo-gu. It is a designated monument, with a dense forest of pine trees and other varieties of trees.",
                                            photos: ["https://images.unsplash.com/photo-1622383563227-044011385627?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "태종대 유원지",
                narration: "영도 최남단에 위치한 태종대의 드라마틱한 절벽과 울창한 숲을 탐험해 보세요. 이곳에서 활쏘기를 즐겼던 신라 태종 무열왕의 이름에서 유래된 이곳은 숨막히는 파노라마 바다 전망을 제공합니다. 소나무 숲을 지나 등대까지 하이킹하거나 다누비 열차를 타고 경치를 즐기세요. 날씨가 좋은 날에는 일본 대마도까지 볼 수 있습니다.",
                    description: "드라마틱한 절벽, 등대, 바다 전망이 특징인 자연 공원입니다.",
                        detailedDescription: "태종대는 대한민국 부산 영도구 최남단에 위치한 자연 공원으로 탁 트인 바다를 마주하는 웅장한 절벽이 있습니다. 소나무 숲과 다양한 수종이 우거진 지정 기념물입니다."
        }
    }
},
// Seoul (Remaining)
{
    id: 'seoul_bukchon',
        cityId: 'seoul',
            name: 'Bukchon Hanok Village',
                lat: 37.5826,
                    lng: 126.9830,
                        radius: 300,
                            narration: "Wander through the winding alleys of Bukchon Hanok Village, where centuries-old traditional Korean houses (Hanok) are preserved. Once the residential quarter for high-ranking officials, it now offers a glimpse into the past amidst the modern city. Admire the graceful curves of the tiled roofs and the wooden beams. Many Hanoks operate as cultural centers, guesthouses, and tea houses, inviting you to experience traditional Korean lifestyle.",
                                description: "Traditional village featuring preserved Hanok houses and narrow alleys.",
                                    category: "Culture",
                                        detailedDescription: "Bukchon Hanok Village is a Korean traditional village in Seoul with a long history located on the top of a hill between Gyeongbok Palace, Changdeok Palace and Jongmyo Royal Shrine. The traditional village is composed of lots of alleys, hanok and is preserved to show a 600-year-old urban environment.",
                                            photos: ["https://images.unsplash.com/photo-1549608184-72f88eb2211e?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "북촌한옥마을",
                narration: "수백 년 된 전통 가옥(한옥)이 보존된 북촌한옥마을의 구불구불한 골목을 거닐어 보세요. 한때 고위 관리들의 거주지였던 이곳은 이제 현대 도시 속에서 과거를 엿볼 수 있는 기회를 제공합니다. 기와지붕의 우아한 곡선과 나무 기둥을 감상해 보세요. 많은 한옥이 문화 센터, 게스트하우스, 찻집으로 운영되어 전통적인 한국 생활 방식을 경험할 수 있습니다.",
                    description: "보존된 한옥과 좁은 골목이 특징인 전통 마을입니다.",
                        detailedDescription: "북촌한옥마을은 경복궁, 창덕궁, 종묘 사이에 위치한 언덕 위에 자리 잡은 오랜 역사를 가진 서울의 한국 전통 마을입니다. 이 전통 마을은 많은 골목과 한옥으로 구성되어 있으며 600년 된 도시 환경을 보여주기 위해 보존되고 있습니다."
        }
    }
},
{
    id: 'seoul_myeongdong',
        cityId: 'seoul',
            name: 'Myeongdong Shopping Street',
                lat: 37.5636,
                    lng: 126.9845,
                        radius: 300,
                            narration: "Dive into the bustling shopping mecca of Myeongdong, a paradise for fashion and beauty lovers. Neon lights, K-pop music, and the aroma of street food fill the air. Browse through countless cosmetic shops, department stores, and boutiques. Don't miss the famous Myeongdong street food alley, offering dazzling treats like giant lobster tails, tteokbokki, and hotteok.",
                                description: "Bustling shopping district famous for cosmetics, fashion, and street food.",
                                    category: "Shopping",
                                        detailedDescription: "Myeongdong is a dong in Jung-gu, Seoul, South Korea between Chungmu-ro, Eulji-ro, and Namdaemun-ro. It is mostly a commercial area, being one of Seoul's main shopping, parade route and tourism districts.",
                                            photos: ["https://images.unsplash.com/photo-1582215682859-f2156eb41a1c?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "명동 쇼핑거리",
                narration: "패션과 뷰티 애호가들의 천국인 번화한 쇼핑 메카 명동으로 뛰어들어 보세요. 네온사인, K-팝 음악, 길거리 음식의 향기가 공기를 가득 채웁니다. 수많은 화장품 가게, 백화점, 부티크를 둘러보세요. 거대 랍스터 꼬리, 떡볶이, 호떡과 같은 화려한 간식을 제공하는 유명한 명동 길거리 음식 골목을 놓치지 마세요.",
                    description: "화장품, 패션, 길거리 음식으로 유명한 붐비는 쇼핑 지구입니다.",
                        detailedDescription: "명동은 대한민국 서울 중구에 있는 동으로 충무로, 을지로, 남대문로 사이에 있습니다. 서울의 주요 쇼핑, 퍼레이드 경로 및 관광 지구 중 하나인 상업 지역입니다."
        }
    }
},
{
    id: 'seoul_ddp',
        cityId: 'seoul',
            name: 'Dongdaemun Design Plaza (DDP)',
                lat: 37.5665,
                    lng: 127.0093,
                        radius: 300,
                            narration: "Walk through the futuristic curves of the Dongdaemun Design Plaza, a neofuturistic landmark designed by Zaha Hadid. It's a hub for design, fashion, and culture, hosting exhibitions, fashion shows, and conferences. The spaceship-like architecture is especially stunning at night when the LED rose garden lights up. It's a symbol of Seoul's status as a World Design Capital.",
                                description: "Neofuturistic cultural hub designed by Zaha Hadid, known for design and fashion events.",
                                    category: "Culture",
                                        detailedDescription: "Dongdaemun Design Plaza (DDP) is a major urban development landmark in Seoul, South Korea designed by Zaha Hadid and Samoo, with a distinctively neofuturistic design characterized by the 'powerful, curving forms of elongated structures'.",
                                            photos: ["https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "동대문디자인플라자 (DDP)",
                narration: "자하 하디드가 설계한 네오퓨처리스틱 랜드마크인 동대문디자인플라자의 미래지향적인 곡선 사이를 걸어보세요. 디자인, 패션, 문화의 중심지로 전시회, 패션쇼, 컨퍼런스가 열립니다. 우주선 같은 건축물은 LED 장미 정원이 불을 밝히는 밤에 특히 아름답습니다. 세계 디자인 수도로서 서울의 위상을 상징합니다.",
                    description: "자하 하디드가 설계한 네오퓨처리스틱 문화 허브로 디자인 및 패션 행사로 유명합니다.",
                        detailedDescription: "동대문디자인플라자(DDP)는 자하 하디드와 삼우가 설계한 대한민국 서울의 주요 도시 개발 랜드마크로, '긴 구조물의 강력하고 곡선미 있는 형태'가 특징인 독특한 네오퓨처리스틱 디자인을 자랑합니다."
        }
    }
},
{
    id: 'seoul_changdeokgung',
        cityId: 'seoul',
            name: 'Changdeokgung Palace',
                lat: 37.5794,
                    lng: 126.9910,
                        radius: 500,
                            narration: "Visit Changdeokgung Palace, the most well-preserved of the five grand palaces and a UNESCO World Heritage site. Famous for its Secret Garden (Huwon), it was designed to harmonize with the natural topography. The garden, with its pavilions, lotus ponds, and ancient trees, was a leisure place for kings. It is a masterpiece of Korean landscape architecture.",
                                description: "Well-preserved royal palace known for its beautiful Secret Garden.",
                                    category: "History",
                                        detailedDescription: "Changdeokgung is set within a large park in Jongno-gu, Seoul, South Korea. It is one of the 'Five Grand Palaces' built by the kings of the Joseon Dynasty. Changdeokgung was the most favored palace of many Joseon princes and retained many elements dating from the Three Kingdoms of Korea period.",
                                            photos: ["https://images.unsplash.com/photo-1555027581-2c9381c81881?auto=format&fit=crop&q=80&w=1000"],
                                                translations: {
        ko: {
            name: "창덕궁",
                narration: "5대 궁궐 중 가장 잘 보존된 유네스코 세계문화유산인 창덕궁을 방문해 보세요. 비원(후원)으로 유명한 이곳은 자연 지형과 조화를 이루도록 설계되었습니다. 정자, 연꽃 연못, 고목이 있는 정원은 왕들의 휴식처였습니다. 한국 조경 건축의 걸작입니다.",
                    description: "아름다운 후원으로 유명한 잘 보존된 왕궁입니다.",
                        detailedDescription: "창덕궁은 대한민국 서울 종로구의 넓은 공원 안에 있습니다. 조선 왕조의 왕들이 지은 '5대 궁궐' 중 하나입니다. 창덕궁은 많은 조선 왕자들이 가장 좋아했던 궁궐이며 삼국 시대의 많은 요소를 간직하고 있습니다."
        }
    }
}
];
