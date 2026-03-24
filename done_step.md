# 🎓 Kenneth Cruise Guide: 학습 및 관리용 완료 보고서 (done_step.md)

이 문서는 프로젝트의 주요 마일스톤 달성 내역과 기술적 교훈을 정리한 '학습용 가이드'입니다. 학생과 관리자 모두가 시스템의 발전 과정을 이해할 수 있도록 구성되었습니다.

---

## 📅 프로젝트 주요 성과 (Milestones)

### 1. [데이터] 랜드마크 검색 키워드 시스템 도입 (2026-03-24)
- **적요**: 사용자가 다양한 검색어(태그)로 명소를 찾을 수 있도록 메타데이터 구조를 확장했습니다.
- **수정 파일**:
  - `shared/schema.ts`: `searchKeywords` 필드 추가 (Zod & Drizzle)
  - `server/data/landmarks.ts`: 전체 348개 명소에 카테고리 기반 자동 키워드 주입
- **학습 포인트**: 3MB가 넘는 대형 플랫파일을 직접 수정하지 않고, **Node.js 자동화 스크립트**를 작성하여 데이터 오염 없이 안전하게 대량의 데이터를 가공하는 법을 실습했습니다.

### 2. [UI/UX] 데스크톱 드래그 스크롤 (Pick & Grab) 구현
- **적요**: 모바일 앱과 같은 부드러운 사용성을 데스크톱 브라우저에서도 제공하기 위해 마우스 드래그 기반 스크롤을 도입했습니다.
- **수정 파일**:
  - `client/src/hooks/useDragScroll.ts`: 재사용 가능한 커스텀 훅 제작
  - `LandmarkList.tsx`, `UnifiedFloatingCard.tsx`: 스크롤 컨테이너에 적용
- **학습 포인트**: `mousedown`, `mousemove`, `mouseup` 이벤트를 조합하여 브라우저 기본 스크롤 동작을 우회하고 사용자 경험을 극대화하는 프론트엔드 최적화 기술을 익혔습니다.

### 3. [인프라] 생산 안정성 및 보안 강화 (CSP & Syntax Fix)
- **적요**: 배포 시 발생하는 빌드 에러와 보안 정책(CSP) 위반 문제를 해결하여 서비스 안정성을 확보했습니다.
- **수정 파일**:
  - `server/app.ts`: Content Security Policy 설정 최적화 (Leaflet, Unsplash 허용)
  - `scripts/fix_unescaped_quotes.cjs`: JSON 문법 오류 자동 교정
- **학습 포인트**: 실제 운영 환경(Cloudflare)에서 외부 리소스(지도, 이미지)를 안전하게 불러오는 보안 설정법과 CI/CD 파이프라인에서의 데이터 검증 중요성을 학습했습니다.

---

## 🛠️ 기술 스택 요약 (Tech Stack)
- **Frontend**: React, Lucide Icons, Vanilla CSS (Premium Design)
- **Backend**: Hono (Cloudflare Workers), Neon DB (PostgreSQL)
- **ORM**: Drizzle ORM
- **Automation**: Node.js Custom Batch Scripts

## 💡 코드 주석 및 적요 규칙
- 모든 주요 로직에는 `[Designer Kim]`, `[Bug Doctor]`, `[Marketer Song]` 등 **에이전트별 적요**를 남겨 관리 효율성을 높였습니다.
- 학생들의 이해를 돕기 위해 복잡한 스키마 정의 시 상단에 **[학습 가이드]** 주석을 추가했습니다.

---
**마지막 업데이트**: 2026-03-24 20:50 (Antigravity Agent)
