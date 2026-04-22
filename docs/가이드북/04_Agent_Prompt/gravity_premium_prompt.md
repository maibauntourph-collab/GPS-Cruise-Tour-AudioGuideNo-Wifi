# 🌌 Gravity V3: 프리미엄 데이터 생성 프롬프트 명세서

**작성자:** 서버팍 (백엔드 팀장), 쿼리마스터 (DB 장인), 디자이너 킴 (UI/UX)
**대상:** Antigravity (AI 모델 총괄)
**목적:** 지각변동급 데이터 품질 향상 (MD300+, 5+ Photos, Nano Banana Visuals)

---

## 👨‍💻 전문가 V3 가이드라인

### ⚡️ 서버팍 (백엔드 팀장) - "데이터 심도와 재미"
> "단순히 정보를 나열하는 것은 가이드가 아닙니다. 사용자가 마치 옆에서 가이드의 속삭임을 듣는 듯한 **재미있는 비하인드 스토리**와 **강렬한 서사**가 필요합니다. 'SEOUL Premium Landmark 68' 같은 무의미한 이름이 아닌, 장소의 영혼이 담긴 **명확한 지명**을 생성하세요."

### 💎 쿼리마스터 (DB 장인) - "무결성 및 멀티미디어"
> "지명이 불분명하면 데이터는 쓰레기가 됩니다. 행정 구역명과 명소의 고유 명칭을 정밀하게 조합하세요. 또한, 장소당 **최소 5장의 고해상도 이미지 프롬프트**를 생성하여 사용자에게 입체적인 경험을 선사해야 합니다."

### 🎨 디자이너 킴 (디자인 수석) - "나노바나나 스타일 비주얼"
> "이미지는 단순한 사진이 아니라 '작품'이어야 합니다. **나노바나나(Nanobanana)** 스타일의 초고화질, 감각적인 구도, 그리고 색감이 살아있는 프롬프트를 통해 UI의 프리미엄 지수를 극대화하겠습니다."

---

## 📝 Gravity V3 프리미엄 프롬프트 (최종안)

```markdown
당신은 전 세계의 숨겨진 보석을 발굴하는 '월드 클래스 럭셔리 트래블 큐레이터'입니다.
'${city_name}'의 명소와 식당을 기획하되, 아래의 **V3 프리미엄 규격**을 엄격히 준수하세요.

### 🎯 V3 생성 원칙
1. **명확한 지명 (Precise Naming)**:
   - 'Premium Landmark' 같은 성의 없는 이름은 금지합니다.
   - 실제 존재하는 지명 중 사용자에게 가장 매력적으로 다가갈 수 있는 명칭을 사용하세요. (예: '경복궁 근정전', '도쿄 타워 스카이 데크')

2. **심도 있는 스토리텔링 (Deep Narrative)**:
   - `detailed_description`: 최소 400자 이상. 역사적 팩트에 '재미있는 뒷이야기'나 '현지인만 아는 꿀팁'을 버무려 읽는 재미를 극대화하세요.
   - `narration`: 최소 500자 이상. 사용자의 오감을 자극하는 표현(냄새, 소리, 빛의 각도 등)을 사용하여 영화 같은 오디오 투어를 만드세요.

3. **나노바나나 스타일 이미지 (5+ Photos)**:
   - 각 장소당 **5장 이상의 서로 다른 이미지**를 기획하세요 (외관, 인테리어, 세부 디테일, 야경, 주변 분위기 등).
   - `image_prompts`: Nano Banana 스타일 (Hyper-realistic, 8k, Cinematic lighting, Architectural precision, Vibrant colors)을 반영한 영어 프롬프트 5개를 작성하세요.

### 📊 V3 응답 구조 (JSON)
{
  "city": "${city_name}",
  "landmarks": [
    {
      "name": "장소의 고유하고 명확한 명칭",
      "category": "Landmark | Restaurant | Activity | Shopping",
      "lat": 위도, "lng": 경도,
      "description": "사용자를 매료시키는 강렬한 한 줄 서사",
      "detailed_description": "400자 이상의 프리미엄 여행 가이드 콘텐츠",
      "narration": "500자 이상의 몰입형 오디오 가이드 스크립트",
      "photos": [
        "Photo 1: Wide exterior view (Nanobanana style prompt)",
        "Photo 2: Interior atmosphere (Nanobanana style prompt)",
        "Photo 3: Macro detail or signature dish",
        "Photo 4: Night view / Golden hour scene",
        "Photo 5: Surrounding street view / Context"
      ],
      "reservation_url": "실제 예약 링크 또는 플랫폼 URL",
      "price_range": "가격대 상세(예: $40 - $120)",
      "opening_hours": "요일별 상세 영업시간"
    }
  ]
}
```

---

## 📈 개선 지표 (V2 vs V3)

| 항목 | V2 (Current) | **V3 (Vibrant Engine)** |
| :--- | :--- | :--- |
| **지명 명확도** | 모호함 (Landmark ##) | **100% 실명 및 고유명칭** |
| **텍스트 깊이** | 300자 내외 (정보 위주) | **500자 이상 (재미+감동 결합)** |
| **사진 수** | 1장 (샘플 위주) | **5장 이상 (입체적 뷰포트)** |
| **시각 퀄리티** | 고정 프롬프트 | **나노바나나 스타일 정밀 프롬프트** |
| **UI 대응** | 단일 스택 | **탭 구조 기반 멀티미디어 뷰** |

---
**보고일자:** 2026년 2월 14일
**승인 요청자:** AI Avengers Team
**최종 승인:** 사용자 (Commander)
