# 시스템 가용 모델 현황 보고서 (AVAILABLE MODELS)

본 문서는 현재 프로젝트에서 가동 중인 AI 모델, 데이터베이스 모델, 그리고 전문가 에이전트 모델의 현황을 정리한 보고서입니다.

---

## 🤖 1. LLM 인터페이스 가용 모델 (최신 도구 기준)
현재 인터페이스에서 직접 선택하여 사용할 수 있는 모델 목록입니다.

| 모델 계열 | 세부 모델명 | 특징 |
| :--- | :--- | :--- |
| **Gemini** | **Gemini 3 Pro (High)** | 최고 성능의 지능형 모델 |
| | **Gemini 3 Pro (Low)** | 효율적인 처리를 위한 범용 모델 |
| | **Gemini 3 Flash** | 빠른 응답 속도 최적화 모델 |
| **Claude** | **Claude Sonnet 4.5** | 정교한 코딩 및 텍스트 생성 |
| | **Claude Sonnet 4.5 (Thinking)** | 깊이 있는 추론이 필요한 태스크용 |
| | **Claude Opus 4.5 (Thinking)** | 최상위 추론 성능 모델 |
| | **Claude Opus 4.6 (Thinking)** | 차세대 고성능 추론 모델 |
| **Open Source** | **GPT-OSS 120B (Medium)** | 대규모 오픈소스 기반 강력한 성능 |

---

## ⚙️ 2. 시스템 내부 연동 모델
프로젝트 소스 코드(`mass_generate_landmarks.ts`, `automationService.ts`) 내에서 자동화 로직으로 가동 중인 모델입니다.

| 모델명 | 주요 역할 | 활용 분야 |
| :--- | :--- | :--- |
| **Gemini 2.0 / 3 Flash** | 고속 고품질 콘텐츠 생성 | 프리미엄 랜드마크 데이터, 오디오 가이드 스크립트 |
| **OpenAI GPT** | 마케팅 엔진 | `automationService.ts` 기반 SNS/블로그 마케팅 콘텐츠 생성 |
| **Image Generation AI** | 실질적 지명 이미지 구현 | `generate_image`를 통한 8k 극사실주의 비주얼 생성 |

---

## 📊 2. 데이터베이스 모델 (Neon DB)
Drizzle ORM을 통해 구조화된 관계형 데이터 모델들입니다.

### 핵심 엔티티 그룹
1. **위치 및 콘텐츠 모델**:
   - `cities`: 도시 정보 및 크루즈 항구 데이터.
   - `landmarks`: 명소, 식당, 쇼핑, 액티비티 통합 데이터.
   - `landmark_audio`: 다국어 MP3 오디오 가이드 메타데이터.
   - `landmark_guides`: 크리에이터별 특화된 해설 데이터.

2. **사용자 및 권한 모델**:
   - `users`: 관리자, 크리에이터, 일반 사용자의 프로필 및 역할 서비스.
   - `user_identities`: 소셜 로그인(Google, Kakao 등) 연동 데이터.

3. **회계 및 수익 모델 (Premium)**:
   - `transactions`: 결제 트랜잭션 및 PG사 연동 데이터.
   - `creator_earnings`: 크리에이터 수익 정산 지갑.
   - `settlements`: 월별 정산 확정 데이터.

4. **마케팅 및 루트 모델**:
   - `marketing_contents`: AI 생성 마케팅 자산 보관.
   - `saved_routes`: 사용자별 맞춤형 투어 경로 및 사진.

---

## 👥 3. 전문가 에이전트 모델 (AI 어벤져스)
특정 도메인의 전문 지식을 갖추고 협업하는 지능형 에이전트 페르소나들입니다.

- **🛠️ 서버 박 (Server Park)**: 백엔드 아키텍처 및 서버리스 최적화 팀장.
- **🔍 쿼리 마스터 (Query Master)**: 데이터베이스 무결성 및 SQL 최적화 장인.
- **⚡ 오토메이션 닥터 (Automation Doctor)**: AI 콘텐츠 파이프라인 및 워크플로우 자동화 전문가.
- **🎨 디자이너 김 (Designer Kim)**: 프리미엄 UI/UX 및 실질적 이미지 디렉팅 수석 디자이너.
- **📈 마케터 쏭 (Marketer Song)**: 글로벌 SEO 및 SNS 마케팅 전략 천재.
- **📖 스토리텔러 이 (Story Teller Lee)**: 몰입형 내러티브 및 사용자 감동 설계 마스터.
- **💰 회계 매니저 (Accounting Manager)**: 결제 보안 및 정산 회계 총괄 매니저.

---

## 📌 특이 사항
- **실질적 이미지 반영**: 모든 AI 생성 이미지 및 디자인은 지명의 실재감을 극대화하는 방향으로 큐레이션됩니다.
- **네온(Neon) 데이터베이스 준수**: 모든 데이터 모델은 Neon DB의 서버리스 환경에 최적화되어 설계되었습니다.
- **지속적 모델 확장**: 신규 도시(뉴욕, 도쿄 등) 확장을 위해 Gemini 모델 기반의 `mass_generate_landmarks.ts`가 지속 가동 중입니다.

---
**최종 업데이트**: 2026-02-17 19:54
**보고 주체**: Antigravity AI 어벤져스 팀
