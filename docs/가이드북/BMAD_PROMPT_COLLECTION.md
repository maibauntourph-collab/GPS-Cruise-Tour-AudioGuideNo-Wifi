# 🤖 BMAD 방법론 기반 AI 에이전트 프롬프트 컬렉션
> **NoWiFi GPS Tours** 개발과 비즈니스 운영을 위해 60일간 입증된 실전 프롬프트 모음입니다.

이 문서는 8인의 AI 전문가 체제(BMAD)에 따라 4가지 메인 카테고리로 분류된 프롬프트 라이브러리입니다. 각 역할에 맞는 에이전트에게 그대로 복사하여 사용할 수 있도록 최적화되었습니다.

---

## 💼 1. BUSINESS (수익 모델 & 기획)
비즈니스 로직, 수익화 파이프라인, 서비스 방향성을 결정할 때 사용합니다.

### 💰 회계 매니저 (FinOps)
> 📎 참조 파일: `docs/agent_prompt_accountingmanager.md`, `docs/revenue_model_simulation.md`
**프롬프트: [수익 시뮬레이션 및 데이터 구조 기획]**
```text
@회계매니저
우리의 NoWiFi GPS Tours 서비스에 대해 Freemium 모델 장벽을 설계하려고 해.
isPremium=false 유저가 투어를 시작한 지 50초가 지난 후 오디오를 중단시키는 로직의 재무적 기댓값을 시뮬레이션해 줘.
또한 GetYourGuide와 Viator 어필리에이트 코드를 어느 지점에 노출해야 CTR(클릭률)이 가장 높을지, 예상 월수익 파이프라인 구조와 함께 보고서로 작성해.
```

### 🎖️ 도다리 (Chief Architect - 기획 파트)
> 📎 참조 파일: `docs/agent_prompt_dodari.md`, `docs/PROJECT_OVERVIEW.md`
**프롬프트: [새로운 마일스톤 기획]**
```text
@도다리
현재 3개 지역(알래스카, 아시아, 에게해)의 랜드마크 개발이 끝났어. 
앞으로 유럽 저활성 8개 도시(암스테르담, 부다페스트 등)와 카리브해 5개 도시를 추가해야 해. 
이 대규모 데이터 추가 작업을 병렬로 스케일링하기 위한 '스프린트 마일스톤' 단계들을 1단계부터 단계별로 나누어 기획해 줘. 
각 단계에서 내가 어떤 에이전트에게 어떤 일을 시켜야 하는지 지시서를 제공해.
```

---

## 📢 2. MARKETER (마케팅 & 배포 & 콘텐츠)
콘텐츠, 다국어 번역, SEO 최적화, SNS 바이럴 구조를 잡을 때 사용합니다.

### 📢 마케터 송 (Growth Hacker)
> 📎 참조 파일: `docs/agent_prompt_marketersong.md`, `docs/MARKETING_PLAN.md`
**프롬프트: [글로벌 SEO 최적화 메타 데이터 생성]**
```text
@마케터송
우리의 React(Vite) + Hono SPA 환경에서 검색엔진 봇이 랜드마크 정보를 크롤링할 수 있게 SEO 전략을 짜야 해. 
'코수멜 찬카나브 해변', '스톡홀름 노벨 박물관' 같은 관광지 키워드가 구글 북미와 유럽 검색결과(SERP)에 잘 노출될 수 있도록,
<title>, <meta description>, <script type="application/ld+json"> 구조의 스키마 마크업을 각 카테고리별로 작성해 줘.
```

### 📝 스토리텔러 이 (Content Creator)
> 📎 참조 파일: `docs/agent_prompt_storytellerlee.md`, `docs/마케팅전략_및_내레이션샘플.md`
**프롬프트: [내레이션 및 다국어 스크립트 작성]**
```text
@스토리텔러
새로 추가할 파리(Paris)의 에펠탑과 루브르 박물관에 대한 도슨트 오디오 스크립트를 작성해 줘. 
1) 무미건조한 백과사전식이 아니라, 10년 차 베테랑 가이드가 위트 있게 설명하듯 팁과 유머를 섞어줘.
2) 각 설명은 3문장을 넘지 않게 해줘 (TTS 처리 속도 최적화).
3) 해당 문구를 한국어, 영어, 일본어, 중국어로 번역하여 JSON 포맷(`narration`, `translations`)에 맞춰 작성해.
```

---

## 🏛️ 3. ARCHITECT (아키텍처 & 워크플로우 통제)
파일 구조, DB 스키마 설계, 배포 환경 인프라를 결정할 때 사용합니다.

### 🎖️ 도다리 (Chief Architect - 아키텍처 파트)
> 📎 참조 파일: `docs/agent_prompt_dodari.md`, `docs/TECHNICAL_SPEC.md`
**프롬프트: [오프라인 우선 데이터 아키텍처 설계]**
```text
@도다리
이 프로젝트는 "인터넷이 터지지 않는 바다 위나 항구"를 상정해야 해.
IndexedDB를 사용하여 랜드마크 데이터(위치, 텍스트, 이미지 URL, TS 오디오 파일 경로)를 로컬 디바이스에 캐싱하는 아날로그적 전략과,
PWA Service Worker의 오프라인 모드를 통합한 최적의 데이터 아키텍처 다이어그램을 설계하고 필요한 라이브러리 조합을 추천해.
```

### 🗳️ 쿼리 마스터 (DB Expert)
> 📎 참조 파일: `docs/agent_prompt_querymaster.md`, `shared/schema.ts`
**프롬프트: [PostgreSQL Drizzle ORM 무결성 설계]**
```text
@쿼리마스터
NeonDB 서버리스 환경을 사용 중이며 Drizzle ORM으로 스키마를 구성하고 있어.
공통된 `City`와 그 하위의 다수 `Landmark`가 외래키로 연결되는 스키마 테이블 코드를 작성해.
주의할 점: 다국어 지원 텍스트 컬럼(jsonb 타입)을 활용하여 구조를 가볍게 하고, RLS(Row Level Security) 관점의 보안을 고려해.
```

---

## 💻 4. DEVELOPER (코딩 & 구현 & 트러블슈팅)
실제 코드 블록 작성, 단위 테스트, 심각한 버그 해결 시 사용합니다.

### ⚙️ 서버팍 (Backend Master)
> 📎 참조 파일: `docs/agent_prompt_serverpark.md`, `server/routes.ts`
**프롬프트: [TTS API 직렬화 연동 및 백엔드 로직]**
```text
@서버팍
Hono 기반의 Cloudflare Workers 백엔드 서버에서 CLOVA Voice / OpenAI TTS API를 프록시로 호출하려 해. 
프론트엔드에서 언어 코드(lang: 'ko', 'en', 'zh', 'ja')를 보내주면, 각 언어에 맞는 성별(gender: 'F', 'M')과 스피커 목소리를 안전하게 매핑하여 바이너리 데이터를 응답하는 API 엔드포인트를 구현해. 
API 키 노출을 막는 보안 로직과 에러 핸들링 미들웨어를 반드시 포함해.
```

### 🎨 디자이너 킴 (Creative Director)
> 📎 참조 파일: `docs/agent_prompt_designerkim.md`, `docs/design_guidelines.md`
**프롬프트: [프리미엄 UI/UX 컴포넌트 마크업]**
```text
@디자이너킴
사용자가 하단 시티 탭(CitySelectTab)을 스와이프업 했을 때 펼쳐지는 '랜드마크 썸네일 리스트' 컴포넌트를 코딩해 줘.
- TailwindCSS와 Shadcn UI를 사용해.
- 단순 스크롤이 아니라, 부드러운 Glassmorphism(글래스모피즘) 효과의 불투명한 배경을 적용해.
- 이미지 로딩 지연 시 들어갈 스켈레톤 UI와, hover 시 이미지 크기가 미세하게 커지는 럭셔리한 마이크로 애니메이션을 삽입해.
```

### 🩺 오토메이션/디버그 닥터 (Troubleshooter)
> 📎 참조 파일: `docs/agent_prompt_automationdoctor.md`, `docs/agent_prompt_bug_doctor.md`, `docs/2026-02-22_0640_whitescreen_fix.md`
**프롬프트: [긴급 장애 해결 및 캐시 파괴]**
```text
@디버그닥터
[긴급] PWA 메인 화면에서 하얀 화면만 뜨는 화이트스크린 에러가 발생했어.
터미널 에러 로그를 첨부할 테니 원인을 즉시 파악해 줘. Workbox 캐싱 우선순위에서 `CacheFirst`와 `NetworkFirst`가 라우팅 패스워드와 충돌하는 것 같은데, 
Service Worker 파일을 어떻게 수정해야 캐시 레이어 충돌 문제를 풀 수 있는지 코드 패치를 제공해.
```

---
*Tip: 각 프롬프트를 사용할 때는 `@에이전트이름`을 붙임으로써 LLM 모델의 가중치를 특정 도메인 페르소나에 집중(Zero-in)시킬 수 있습니다.*
