# GPS 오디오 가이드 - 프로젝트 개요

## 서론

이 프로젝트는 관광객의 도시 탐험 경험을 향상시키기 위해 설계된 React 기반 GPS 오디오 가이드 애플리케이션입니다. 랜드마크와 체험 활동을 위한 자동 오디오 내레이션, 대화형 지도, 턴바이턴 내비게이션, 다국어 지원 및 진행 상황 추적 기능을 제공합니다. PWA(Progressive Web App) 기술을 통해 강력한 오프라인 기능을 보장하며, 전 세계 다양한 도시에서 원활하고 몰입감 있는 여행 동반자 경험을 제공하는 것을 목표로 합니다. 우리의 비전은 세계 최고의 디지털 여행 가이드가 되는 것입니다.

## 사용자 선호 사항

- 상세한 설명 제공 선호.
- 반복적이고 점진적인 개발 지향.
- 주요 변경 사항 발생 전 반드시 확인 및 승인 요청.
- 쉽고 명확한 언어 사용 선호.

## 시스템 아키텍처

애플리케이션은 React 프론트엔드와 Express.js 백엔드로 구성되며, RESTful API를 통해 통신합니다.

**UI/UX 디자인 결정:**
- **디자인 시스템:** 명소(Landmarks), 활동(Activities), 레스토랑, 기념품점, 크루즈 항구 등 카테고리별로 색상을 구분하여 사용.
- **시각 요소:** 글래스모픽(glass-morphic) 플로팅 패널, 커스텀 마커, 사용자 위치 표시를 위한 펄스 애니메이션 적용.
- **타이포그래피:** Playfair Display (세리프) 및 Inter (산세리프) 폰트 사용.
- **반응형 디자인:** 모바일 우선(Mobile-first) 접근 방식 적용.
- **PWA 통합:** 오프라인 기능을 위한 매니페스트(manifest) 및 서비스 워커(service worker) 포함, 네트워크 상태 표시 및 설치 유도 기능 제공.

**기술 구현 및 주요 기능:**
- **대화형 지도 및 내비게이션:** React-Leaflet 및 Leaflet Routing Machine을 사용하여 지도 표시, GPS 추적, 턴바이턴 경로 안내 구현.
- **오디오 내레이션:** Web Speech API를 활용하여 랜드마크 반경 내 진입 시 자동 언어 인식 오디오 가이드 제공. 재생 속도 조절 및 상태 유지 기능 포함.
- **언어별 TTS 음성 선택:** 카드 기반 UI를 통해 사용자별 선호 TTS 음성 선택 및 언어별 자동 적용 기능.
- **다도시 및 다국어 지원:** 도시 및 언어 선택기를 통해 10개 언어별 콘텐츠를 동적으로 로딩.
- **명소 및 활동 상세 정보:** 풍부한 텍스트 정보, 사진 갤러리, 역사적 배경, 임베디드 지도를 포함한 상세 모달 제공.
- **방문 기록 추적:** 세션별 진행 상황을 PostgreSQL(Drizzle ORM 활용)에 저장하고 진행률 바로 시각화.
- **오프라인 기능:** 서비스 워커를 통한 정적 자산, 도시 데이터, 지도 타일 캐싱. IndexedDB를 활용하여 클라이언트 측 데이터 저장 및 오프라인 패키지 API를 통한 데이터 동기화.
- **콘텐츠 필터링:** 필터 버튼을 통해 지도 및 목록에서 특정 카테고리(명소, 활동 등) 표시 여부 토글.
- **투어 경로 계획:** 사용자가 마커를 추가하여 커스텀 투어 경로를 생성하고, 총 거리 및 예상 소요 시간을 점선 폴리라인으로 시각화.
- **티켓 및 투어 예약:** GetYourGuide, Viator, Klook 등 주요 예약 플랫폼 링크를 안전하게 동적 생성.
- **메신저 스타일 플로팅 카드:** 드래그, 크기 조절, 최소화가 가능한 UI 카드로 터치 이벤트 지원 및 선호도 저장.
- **크루즈 항구 교통 정보:** 크루즈 항구가 있는 도시의 경우, 예약 링크 및 차량 공유 앱 연동을 포함한 상세 교통 정보 제공.
- **AI 투어 추천:** OpenAI gpt-4o-mini를 통합하여 지리적 근접성과 다양성을 고려한 지능적 여행 일정 추천.
- **투어 리더 모드:** 일정 관리(CRUD), 멤버 관리, 엑셀 가져오기/내보내기, Web Share API를 이용한 진행 보고서 공유 기능을 갖춘 전용 인터페이스 제공.
- **명소 등록 (가이드 및 투어 리더):** 가이드(/guide) 및 투어 리더(/tour-leader) 뷰에서 새로운 명소, 활동 등을 직접 추가 가능. 한국어 UI의 shared LandmarkFormDialog 컴포넌트 사용. 데이터는 PostgreSQL에 저장되며 실시간으로 반영됨.

## API 엔드포인트

- `/api/cities`, `/api/landmarks`, `/api/visited`
- `/api/offline-package`, `/api/ai/recommend-tour`
- `/api/tour-leader/schedules`, `/api/tour-leader/members` (가져오기/내보내기 포함)
- `/api/auth/providers`, `/api/auth/me`, `/api/auth/:provider`, `/api/auth/:provider/callback`, `/api/auth/logout`

## 시스템 설계 선택 사항

- **프론트엔드 프레임워크:** React 18 (TypeScript), TanStack React Query, Tailwind CSS, Shadcn UI, Wouter(라우팅).
- **코드 분할(Code Splitting):** React.lazy()를 사용한 경로 기반 코드 분할. 주요 페이지(Home, Admin, Guide, TourLeader)를 지연 로딩하여 초기 번들 크기 최적화.
- **백엔드 프레임워크:** Express.js (Zod 검증 활용).
- **데이터베이스:** PostgreSQL (Neon serverless) + Drizzle ORM.
- **데이터 저장:** 영구 데이터는 PostgreSQL에, 동적 콘텐츠는 인메모리 저장소에 보관하는 하이브리드 방식.
- **세션 관리:** express-session을 통한 사용자 인증, LocalStorage를 통한 세션 ID 및 설정 저장.
- **소셜 로그인:** Google, Facebook, Kakao, Naver 지원. 사용자 테이블과 연동된 SNS 계정 정보를 user_identities 테이블에 관리.

## 배포 안전 가이드

**중요: 배포 시 데이터베이스 데이터는 자동으로 보존됩니다.**

- **데이터 아키텍처:** 하드코딩된 기본 데이터(storage.ts)와 관리자가 추가한 DB 데이터가 병합되어 작동합니다.
- **보호 메커니즘:** `npm run db:push`는 데이터 삭제 없이 스키마만 동기화하며, 중복 ID 발생 시 Admin API에서 오류를 반환하여 데이터 덮어쓰기를 방지합니다.

## 외부 의존성

- **지도:** React-Leaflet, Leaflet, OpenStreetMap, Leaflet Routing Machine, Google Maps.
- **데이터베이스:** PostgreSQL, Drizzle ORM.
- **라이브러리:** React, TypeScript, TanStack React Query, Tailwind CSS, Shadcn UI, Wouter, Express.js, Zod.
- **AI:** OpenAI (gpt-4o-mini).
- **브라우저 API:** Web Speech API, Geolocation, Service Worker, LocalStorage, IndexedDB.
- **플랫폼:** GetYourGuide, Viator, Klook, Uber, Bolt.
