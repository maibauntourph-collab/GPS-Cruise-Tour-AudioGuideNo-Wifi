# Chapter 9: AI 에이전트 운용 가이드
> BMAD 프레임워크 기반 8인 AI 전문가 팀 운용법

---

## 9.1 BMAD 프레임워크 개요

**BMAD = Business - Marketer - Architect - Developer**

단순히 AI에게 코딩을 시키는 것이 아니라, 8명의 **전문 페르소나**를 설정하여 각자의 도메인 전문성을 최대한 활용하는 방법론입니다.

### 에이전트 조직도

```
                   ┌──────────────┐
                   │  어벤져스 팀  │ ← 총괄 조율
                   │ (Avengers)   │
                   └──────┬───────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌─────▼─────┐    ┌─────▼─────┐
    │ 도다리   │     │ 코다리부장 │    │ 마케터 송  │
    │ Architect│     │ Operations│    │ Marketing │
    └────┬────┘     └─────┬─────┘    └─────┬─────┘
         │                │                │
    ┌────┤           ┌────┤           ┌────┤
    │    │           │    │           │    │
 서버팍  쿼리      오프리  크루즈    스토리  회계
 Backend DB       Offline 네비      Content FinOps
```

### 8인 전문가 역할표

| 에이전트 | 역할 | 전문 영역 | 호출 시나리오 |
|---|---|---|---|
| **도다리** | Chief Architect | 아키텍처, 마일스톤 | 새 기능 설계, 기술 결정 |
| **서버팍** | Backend Master | Hono, API, 보안 | API 최적화, DB 연결 |
| **디자이너 킴** | Creative Director | UI/UX, 애니메이션 | 화면 디자인, 인터랙션 |
| **쿼리 마스터** | DB Expert | SQL, PostGIS | 쿼리 최적화, 스키마 설계 |
| **오토메이션 닥터** | Automation | API 연동, 크론 | 자동화, 배치 작업 |
| **마케터 송** | Growth Hacker | SEO, 콘텐츠 | 마케팅 전략, 카피 |
| **회계 매니저** | FinOps | 수익, 정산 | 수익 모델, 결제 |
| **스토리텔러 이** | Content Creator | 내레이션, 번역 | 오디오 스크립트, 카피 |

---

## 9.2 에이전트 호출 실전 예시

### 아키텍처 결정

```text
@도다리
현재 3개 지역(알래스카, 아시아, 에게해)의 랜드마크 개발이 끝났어.
유럽 8개 도시와 카리브해 5개 도시를 추가해야 해.
이 대규모 데이터 추가 작업을 병렬로 스케일링하기 위한
스프린트 마일스톤을 단계별로 나누어 기획해 줘.
각 단계에서 어떤 에이전트에게 무슨 일을 시켜야 하는지 지시서를 제공해.
```

### 백엔드 최적화

```text
@서버팍
NeonDB 연결 풀링이 Cloudflare Workers에서 제대로 작동하지 않아.
현재 server/db.ts에서 연결을 어떻게 관리하는지 분석하고,
connection pooling 최적화 방안을 코드와 함께 제안해줘.
성능 목표: 랜드마크 검색 API 응답 시간 100ms 이하
```

### DB 쿼리 최적화

```text
@쿼리마스터
NeonDB 서버리스 환경에서 Drizzle ORM으로 스키마를 구성 중이야.
City와 Landmark가 외래키로 연결되는 테이블 코드를 작성해.
다국어 지원을 위해 jsonb 타입 컬럼을 활용하고,
PostGIS로 반경 5km 내 랜드마크 검색 쿼리도 설계해줘.
```

### 내레이션 작성

```text
@스토리텔러
파리 에펠탑의 도슨트 오디오 스크립트를 작성해 줘.
1) 백과사전식이 아니라, 10년 차 가이드가 위트 있게 설명하는 톤
2) 각 설명은 3문장 이내 (TTS 처리 속도 최적화)
3) 한국어, 영어, 일본어, 중국어 4개 언어로 번역
4) JSON 포맷(narration, translations)으로 작성
```

### SEO 최적화

```text
@마케터송
React(Vite) + Hono SPA 환경에서 검색엔진 봇이 크롤링할 수 있게
SEO 전략을 짜야 해. 관광지 키워드가 구글 검색에 잘 노출되도록
<title>, <meta description>, <script type="application/ld+json">
스키마 마크업을 카테고리별로 작성해줘.
```

---

## 9.3 AI 모델 역할 분담

| AI 모델 | 강점 | 주요 용도 |
|---|---|---|
| **Claude** | 논리적 사고, 아키텍처 설계, 긴 코드 | 시스템 설계, 코드 리팩토링, 복잡한 버그 분석 |
| **Gemini** | Google 생태계, 멀티모달, 실시간 | Maps 연동, 이미지 분석, 실시간 데이터 처리 |
| **ChatGPT** | 크리에이티브, UX, 다양한 톤 | 내레이션 작성, 마케팅 카피, UX 개선 아이디어 |

### 실전 사용 패턴

```
아키텍처 결정 → Claude에게 @도다리 프롬프트
지도 데이터 연동 → Gemini에게 Google Maps API 통합
랜드마크 내레이션 → ChatGPT에게 @스토리텔러 프롬프트
버그 분석 → Claude에게 코드와 에러 로그 전달
```

---

## 9.4 14단계 BMAD 워크플로우

`docs/step-*.md` 파일 기반의 체계적 개발 프로세스:

### 메인 워크플로우 (step-01 ~ step-14)

| 단계 | 파일 | 역할 |
|---|---|---|
| **01** | step-01-init.md | 세션 초기화, 컨텍스트 로딩 |
| **02** | step-02-plan.md | 기술 사양서 대비 목표 정의 |
| **03** | step-03-implement.md | 실제 코드 작성 (서버팍 + 디자이너 킴) |
| **04** | step-04-review.md | 코드 리뷰 + 아키텍처 검증 |
| **05** | step-05-patterns.md | 디자인 패턴 적용 확인 |
| **06** | step-06-design-system.md | UI 디자인 시스템 일관성 |
| **07-14** | step-07~14-*.md | 도메인별 세부 검증 |

### 검증 워크플로우 (step-v-01 ~ step-v-13)

| 단계 | 검증 내용 |
|---|---|
| v-01 | 문서 발견 및 초기 설정 |
| v-03 | 밀도 검증 (코드 품질) |
| v-05 | 측정 가능성 검증 |
| v-06 | 추적 가능성 검증 |
| v-07 | 구현 누수 검증 |
| v-11 | 전체적 품질 검증 |
| v-13 | 최종 보고서 |

---

## 9.5 실전 팁

### 최고 품질 답변을 얻는 방법

1. **에이전트 전문성을 명시적으로 호출**
   ```
   ❌ "이 API를 최적화해줘"
   ✅ "@서버팍 이 API의 응답 시간이 500ms인데, 100ms 이하로 최적화해줘.
       현재 코드는 server/routes.ts의 getLandmarks 함수야."
   ```

2. **현재 코드와 파일 경로를 함께 제공**
   ```
   ✅ "@쿼리마스터 shared/schema.ts의 landmarks 테이블에서
       cityId별로 그룹핑하는 쿼리를 최적화해줘.
       현재 쿼리: SELECT * FROM landmarks WHERE city_id = $1"
   ```

3. **큰 작업은 에이전트별로 분할하여 병렬 처리**
   ```
   Step 1: @도다리 → 전체 아키텍처 설계
   Step 2 (병렬):
     - @서버팍 → API 구현
     - @디자이너킴 → UI 컴포넌트
     - @쿼리마스터 → DB 스키마
   Step 3: @도다리 → 통합 검증
   ```

4. **에이전트 간 핸드오프 명시**
   ```
   "@서버팍이 설계한 API 스펙을 바탕으로,
    @디자이너킴 프론트엔드 컴포넌트를 만들어줘.
    API 응답 형식은 다음과 같아: { landmarks: [...] }"
   ```

---

## 9.6 에이전트 프롬프트 파일 위치

```
docs/
├── agent_prompts_master.md          # 전체 에이전트 빠른 참조
├── agent_prompt_dodari.md           # 도다리 (Chief Architect)
├── agent_prompt_serverpark.md       # 서버팍 (Backend)
├── agent_prompt_designerkim.md      # 디자이너 킴 (UI/UX)
├── agent_prompt_querymaster.md      # 쿼리 마스터 (DB)
├── agent_prompt_automationdoctor.md # 오토메이션 닥터 (Automation)
├── agent_prompt_marketersong.md     # 마케터 송 (Marketing)
├── agent_prompt_accountingmanager.md # 회계 매니저 (FinOps)
├── agent_prompt_storytellerlee.md   # 스토리텔러 이 (Content)
├── agent_prompt_bug_doctor.md       # 디버그 닥터 (QA)
├── agent_prompt_offline-scout.md    # 오프리 (Offline)
├── agent_prompt_cruise-navigator.md # 크루즈 네비게이터
└── agent_prompt_gatekeeper-manager.md # 문지기 부장 (Security)
```

---

> **가이드북 목차로 돌아가기:** [INDEX.md](./INDEX.md)
