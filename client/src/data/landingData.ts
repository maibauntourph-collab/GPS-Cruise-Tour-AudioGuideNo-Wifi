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
            title: "🕰️ 2,000년의 시간이 말을 거는 곳, 로마",
            subTitle: "돌벽 하나에도 황제의 숨결이 깃든 로마, 교수님의 흥미진진한 이야기와 함께 2,000년 전으로 무선 여행을 떠나볼까요?",
            heroImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200"
        },
        en: {
            title: "Rome: Where Stones Whisper History",
            subTitle: "Step into the Echoes of Emperors. Let our professor guide you through 2,000 years of Roman secrets, all without needing a single byte of Wi-Fi.",
            heroImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200"
        }
    },
    civitavecchia: {
        ko: {
            title: "⚓ 로마로 향하는 설레는 첫 관문, 치비타베키아",
            subTitle: "크루즈에서 내리는 순간, 이탈리아의 햇살이 당신을 반깁니다. 로마로 향하는 가장 지혜롭고 편안한 길을 안내해 드릴게요.",
            heroImage: "https://images.unsplash.com/photo-1624835848527-0c7da796a5af?w=1200"
        },
        en: {
            title: "Civitavecchia: Your Gateway to Roman Sunlight",
            subTitle: "Step off the deck and into an Italian dream. We provide the most intelligent and comfortable path from the port to the heart of the Eternal City.",
            heroImage: "https://images.unsplash.com/photo-1624835848527-0c7da796a5af?w=1200"
        }
    },
    cebu: {
        ko: {
            title: "🌴 에메랄드빛 전설이 흐르는 섬, 세부",
            subTitle: "마젤란의 십자가부터 반짝이는 파도 아래 숨은 전설까지! 세부의 진짜 매력은 바다보다 더 깊은 이야기에 숨어있답니다.",
            heroImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200"
        },
        en: {
            title: "Cebu: Emerald Waves and Hidden Legends",
            subTitle: "From Magellan's Cross to the secrets beneath the surf. Discover the true soul of Cebu through stories deeper than the ocean itself.",
            heroImage: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200"
        }
    }
};
