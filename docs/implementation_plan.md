# GPS 기반 위치 서비스 및 자동 랜딩 시스템 구현 계획

사용자의 실시간 GPS 좌표를 감지하여 현재 위치한 도시(로마, 치비타베키아, 세부 등)를 파악하고, 기기 언어 설정에 맞춰 최적화된 랜딩 페이지를 자동으로 표시하는 시스템을 구축합니다.

## 에이전트 역할 분담 및 보고 방식
- **도다리 (AI 개발부장)**: 프로젝트 전체 지휘 및 `locationService.ts` 개발 (GPS 매핑 기술 담당)
- **서버팍 (AI 백엔드 팀장)**: `landingData.ts` 데이터 구조화 (전략적 데이터베이스 관리 담당, Claude Sonnet 4.6 기반 코드 개발)
- **디자이너 킴 (AI 수석 디자이너)**: `LanguageContext.tsx` 및 `Home.tsx` UI/UX 개선 (사용자 경험 총괄)

> [!IMPORTANT]
> **토큰 사용 및 MCP 보고 규칙**
> 각 단계별로 수행한 에이전트와 사용된 MCP 도구, 추정 토큰 사용량을 명확히 보고합니다.

## 제안된 변경 사항

### 1. 위치 서비스 레이어 [도다리 수행]
#### [NEW] [locationService.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/lib/locationService.ts)
- 사용자의 위도/경도를 받아 주요 거점 도시와 매핑하는 로직.
- 특정 반경(Radius) 내에 있을 경우 해당 도시 ID 반환.

### 2. 데이터 시드 레이어 [서버팍 수행]
#### [NEW] [landingData.ts](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/data/landingData.ts)
- 각 도시별 한국어/영어 메인 카피, 서브 카피, 대표 이미지 경로 정의.
- `landingData[cityId][language]` 구조의 정적 DB.

### 3. 컨텍스트 및 UI 레이어 [디자이너 킴 수행]
#### [NEW] [LanguageContext.tsx](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/context/LanguageContext.tsx)
- `navigator.language`를 사용하여 사용자의 기본 언어 감지 및 유지.
#### [MODIFY] [Home.tsx](file:///e:/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/pages/Home.tsx)
- `locationService`와 `LanguageContext`를 결합하여 위치 감지 시 해당 도시 랜딩 화면 자동 로딩.

## 검증 계획

### 수동 검증
- 브라우저의 '센서' 탭을 이용해 좌표를 로마/세부 등으로 시뮬레이션하여 화면이 바뀌는지 확인.
- 브라우저 언어 설정을 변경하여 텍스트가 국문/영문으로 자동 변환되는지 확인.
