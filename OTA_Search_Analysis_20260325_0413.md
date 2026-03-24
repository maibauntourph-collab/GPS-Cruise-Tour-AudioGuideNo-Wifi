# 📊 OTA 플랫폼 지명 검색 누락 원인 분석 및 솔루션 리포트
**작성일시:** 2026-03-25 04:16
**담당 에이전트:** @Server_Park (DB/검색 최적화) & @Marketer_Song (마케팅/키워드)

---

## 1. 현상 분석 (Problem Definition)
앱 내 크루즈/명소 데이터가 마이리얼트립(MyRealTrip), 클룩(Klook), 트립닷컴 등 주요 외부 OTA 플랫폼의 검색 엔진에서 제대로 노출되지 않거나, 특정한 "세부 지명(Sub-location)"이나 "현지어 발음"으로 검색했을 때 결과에서 누락되는 현상이 발생.

## 2. 원인 분석 (Root Causes)

### A. 메타데이터 및 키워드 매핑 부족 (@Marketer_Song 분석)
- **현지어/동의어 매핑 부재:** 한국인이 자주 검색하는 고유 명칭(예: "콜로세움", "로마 원형경기장")과 실제 DB의 명칭("Colosseum") 간의 괴리.
- **다국어 검색 필드 누락:** 기존 구조에서는 메인 `name` 필드 위주로 검색되어 확장 키워드(`searchKeywords`)가 OTA 플랫폼의 메타 태그로 전달되지 않음.

### B. 검색 엔진(DB) 쿼리 한계 (@Server_Park 분석)
- **단순 LIKE 검색의 한계:** SQL의 `LIKE '%검색어%'` 방식은 오타 처리(Typo Tolerance)나 형태소 분석이 불가능함.
- **NeonDB Full-Text Search (FTS) 미활용:** PostgreSQL이 제공하는 강력한 텍스트 검색 기능(`tsvector`)이나, ElasticSearch 같은 전문 검색/추천 계층이 없음.

---

## 3. 해결 솔루션 (Solutions & Architecture)

### 🚀 솔루션 1: `searchKeywords` 다국어 배열 동기화 (Immediate Fix)
- **작업 내용:** `landmarks` 테이블에 방금 추가된 `searchKeywords: jsonb` (또는 `tags`) 컬럼에, 각 플랫폼(Klook, 가이드라이브 등)에서 자주 검색되는 **"OTA 향 유입 키워드"**를 AI로 자동 생성하여 배열로 저장합니다. 
- **API 연동:** `/api/landmarks/search` 엔드포인트에서 `name` 뿐만 아니라 `searchKeywords` 배열 내부 값도 함께 검색(`@>`)되도록 쿼리를 수정합니다.

### 🚀 솔루션 2: NeonDB(PostgreSQL) Full-Text Search 도입 (Mid-term)
- **작업 내용:** 별도의 ElasticSearch 서버를 두기 전, 비용 효율적인 솔루션으로 NeonDB의 내장 기능인 `GIN 인덱스`와 `to_tsvector`를 활용합니다.
- **효과:** 언어별 형태소 분석을 지원하여 "로마" 검색 시 "로마의", "로마에서" 등 파생어도 검색 가능해집니다.

### 🚀 솔루션 3: React Native 클라이언트 - Hono 백엔드 최적화 (Frontend)
- **디바운싱(Debouncing):** RN 앱에서 검색어 입력 시, 불필요한 API 호출을 막아 트래픽을 아낍니다.
- **자동 완성 및 하이라이팅:** Hono API 응답에 앞서 제안된 키워드를 즉각적으로 보여줍니다.

---

## 4. 제안하는 다음 단계 (Next Steps)

1. **[추천]** `landmarks` 스키마 쿼리 수정: "키워드 배열(`searchKeywords`) 기반 검색 API" 추가.
2. **[추천]** @Automation_Doctor를 통한 각 명소별 "OTA 유입용 핵심 검색어 10개" 자동 추출 배치 실행.

> 교수님, 당장 NeonDB 쿼리를 개선하여 React Native 앱의 검색 API(`/api/search`)를 똑똑하게 수정하는 1번 작업을 먼저 시작할까요?
