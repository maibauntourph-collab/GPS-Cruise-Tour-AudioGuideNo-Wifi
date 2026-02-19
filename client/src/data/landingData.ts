/**
 * [서버팍 팀장의 데이터 설계 노트: '글로벌 랜딩 전략']
 * "사용자의 첫 인상은 데이터의 정확도에서 결정됩니다. 
 * 다국어 대응은 단순한 번역이 아니라 각 문화권에 맞는 정서적 접근이어야 하죠."
 */

export interface LandingContent {
    title: string;
    subTitle: string;
    heroImage: string;
}

export interface CityLandingData {
    [language: string]: LandingContent;
}

export interface GlobalLandingData {
    [cityId: string]: CityLandingData;
}

// [적요] 주요 도시별 랜딩 페이지 데이터베이스 (Magic Prompt 요구사항 반영)
export const LANDING_DATA: GlobalLandingData = {
    rome: {
        ko: {
            title: "영원한 도시, 로마에 오신 것을 환영합니다",
            subTitle: "인터넷 없이도 즐기는 로마의 역사와 예술 가이드",
            heroImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200"
        },
        en: {
            title: "Welcome to the Eternal City, Rome",
            subTitle: "Your Offline Guide to Rome's History and Art",
            heroImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200"
        }
    },
    civitavecchia: {
        ko: {
            title: "치비타베키아: 로마로 가는 관문",
            subTitle: "항구 도시의 매력과 편안한 여행의 시작",
            heroImage: "https://images.unsplash.com/photo-1624835848527-0c7da796a5af?w=1200"
        },
        en: {
            title: "Civitavecchia: Gateway to Rome",
            subTitle: "Charming Port City and Your Journey's Start",
            heroImage: "https://images.unsplash.com/photo-1624835848527-0c7da796a5af?w=1200"
        }
    },
    cebu: {
        ko: {
            title: "에메랄드빛 낙원, 세부",
            subTitle: "해변과 역사적 유산이 공존하는 아름다운 섬",
            heroImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200"
        },
        en: {
            title: "Paradise Found: Cebu City",
            subTitle: "Beautiful Island of Beaches and Heritage Sites",
            heroImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200"
        }
    }
};
