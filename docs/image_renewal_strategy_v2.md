# 🖼️ 이미지 전면 리뉴얼 프로젝트 계획서 (V2)

본 문서는 Neon DB의 모든 랜드마크(345개)를 대상으로, 각 명소당 5장 이상의 고유한 시각적 컨셉을 가진 이미지 생성 프롬프트를 보강하고 리뉴얼하는 계획을 담고 있습니다.

## 1. 프로젝트 목표
- **대상**: Neon DB 내 345개 모든 랜드마크 (현재 163개만 일부 프롬프트 보유)
- **목표**: 랜드마크당 **5개 이상의 서로 다른 컨셉**의 프롬프트 생성 (총 1,725개 이상의 프롬프트)
- **핵심 가치**: 사용자에게 다양한 시각적 경험(낮, 밤, 예술적 화풍, 드론샷 등) 제공

## 2. 어벤져스 팀 (Dream Team) 구성

| 역할 | 담당 에이전트 | 주요 임무 |
| :--- | :--- | :--- |
| **총괄 지휘 (Commander)** | **Dodari (AI 개발부장)** | 전체 일정 및 품질 관리, 시퀀스 정합성 보장 |
| **비주얼 디자이너 (Lead)** | **Designer Kim (AI 수석 디자이너)** | 5가지 시각적 컨셉 정의 (Artistic, Cinematic, Macro, etc.) |
| **자동화 전문가 (Automator)** | **Automation Doctor (업무자동화 대가)** | 1,725+개 프롬프트 대량 생성 스크립트 설계 및 프롬프트 엔지니어링 |
| **데이터 마스터 (DB Master)** | **Query Master (AI 데이터베이스 장인)** | Neon DB 연동 및 대량 데이터 업로드/검증 |

### 활용 예정 MCP 및 기술
- **context7 MCP**: 최신 이미지 생성 프롬프트 트렌드 및 기판 기술 리서치
- **generate_image Tool**: 시각적 컨셉 검증을 위한 샘플 이미지 프리뷰 생성

---

## 3. 추천 프롬프트 제안 (추천 에이전트: Automation Doctor)

> [!TIP]
> **추천 수행 프롬프트**:
> "Neon DB의 모든 랜드마크 리스트를 추출하고, Designer Kim이 정의한 5가지 컨셉(Cinematic, Watercolor, Night View, Aerial, Vintage)에 맞추어 각 랜드마크별 최적화된 DALL-E 3용 프롬프트를 대량 생성해줘. 생성된 결과는 `docs/full_image_prompts.md`에 정리하고, 나중에 `enhance-photos.ts`에서 바로 읽어 쓸 수 있도록 JSON 구조를 제안해줘."

---

## 4. 상세 수행 프로세스 (5개 컨셉 예시)

각 랜드마크마다 아래와 같은 5가지 테마를 기본으로 프롬프트를 구성합니다:
1.  **Concept A (현장감)**: 광각 렌즈로 찍은 실사풍의 고화질 사진 (Daylight)
2.  **Concept B (로맨틱 밤)**: 야경과 조명이 어우러진 시네마틱한 분위기 (Night/Sunset)
3.  **Concept C (예술적 화풍)**: 수채화 또는 미니멀한 일러스트 느낌 (Artistic)
4.  **Concept D (역동적 시점)**: 드론 또는 높은 곳에서 내려다본 뷰 (Aerial View)
5.  **Concept E (디테일/질감)**: 특정 건축 디테일이나 질감을 강조한 매크로 뷰 (Texture/Macro)

---

## 5. 단계별 마일스톤
1.  **Phase 1**: Neon DB 전수 조사 및 미보유 182개 랜드마크 식별 [Query Master]
2.  **Phase 2**: 5대 비주얼 컨셉 가이드라인 확정 [Designer Kim]
3.  **Phase 3**: LLM 기반 1,725개 프롬프트 자동 생성 및 검토 [Automation Doctor]
4.  **Phase 4**: DB 반영 스크립트(`update-prompts.ts`) 작성 및 실행 [Server Park / Automation Doctor]

---

**위의 팀 구성과 전략에 대해 승인해주시면, Phase 1(데이터 전수 조사)부터 즉시 착수하겠습니다.**
