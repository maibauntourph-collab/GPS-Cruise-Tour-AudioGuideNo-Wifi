# GPS Audio Guide PWA - 개발 작업 내역서

**프로젝트명**: GPS Audio Guide - Multi-City Travel Companion  
**작업 기간**: 2024년 12월 21일  
**담당자**: Kenneth

---

## 완료된 작업 목록

### 1. 경로 저장 기능 (Route Saving Feature)

#### 1.1 데이터베이스 스키마 설계 및 구현
- **savedRoutes 테이블**: 사용자 저장 경로 정보
  - UUID 기반 ID
  - 사용자 ID / 세션 ID 지원 (로그인/비로그인 모두 지원)
  - 제목, 설명, 국가 코드, 도시 ID
  - 정류장 배열 (JSON)
  - 총 거리 (미터), 총 소요 시간 (분)
  - 커버 사진 URL
  - 생성/수정 일시
  
- **routePhotos 테이블**: 경로 사진 정보
  - UUID 기반 ID
  - 경로 ID 참조 (외래키)
  - 저장소 URL
  - GPS 좌표 (위도/경도)
  - 촬영 일시
  - 소스 (업로드/촬영)
  - 메타데이터 (JSON)

#### 1.2 스토리지 인터페이스 확장
- `createSavedRoute()`: 새 경로 저장
- `getSavedRoutes()`: 사용자/세션별 경로 목록 조회
- `getSavedRouteById()`: 특정 경로 조회
- `updateSavedRoute()`: 경로 수정
- `deleteSavedRoute()`: 경로 삭제
- `addRoutePhoto()`: 경로에 사진 추가
- `getRoutePhotos()`: 경로 사진 목록 조회
- `deleteRoutePhoto()`: 사진 삭제

#### 1.3 API 엔드포인트 구현
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/routes` | 저장된 경로 목록 조회 (세션/국가 필터) |
| POST | `/api/routes` | 새 경로 저장 |
| GET | `/api/routes/:id` | 특정 경로 조회 |
| PUT | `/api/routes/:id` | 경로 수정 |
| DELETE | `/api/routes/:id` | 경로 삭제 |
| POST | `/api/routes/:id/photos` | 사진 업로드 |
| GET | `/api/routes/:id/photos` | 경로 사진 목록 |
| DELETE | `/api/routes/:id/photos/:photoId` | 사진 삭제 |

#### 1.4 프론트엔드 컴포넌트
- **UnifiedFloatingCard**: 투어 경로 섹션에 저장/MyRoutes 아이콘 추가
- **SaveRouteDialog**: 경로 저장 다이얼로그 (제목, 설명 입력)
- **MyRoutes 페이지** (`/my-routes`): 저장된 경로 관리
  - 경로 카드 목록 표시
  - 국가별 분류
  - 삭제 기능 (확인 다이얼로그)
  - 빈 상태 UI

#### 1.5 보안 개선
- 세션 ID 기반 데이터 분리
- 사용자별 데이터 격리 (다른 사용자 경로 접근 불가)
- API 요청 시 세션 ID 필수 검증

---

## 작업 통계

| 항목 | 수량 |
|------|------|
| 신규 데이터베이스 테이블 | 2개 |
| 스토리지 메서드 | 8개 |
| API 엔드포인트 | 8개 |
| 신규 컴포넌트 | 2개 |
| 수정된 파일 | 7개 |

---

## 수정된 파일 목록

1. `shared/schema.ts` - 데이터베이스 스키마 추가
2. `server/storage.ts` - 스토리지 인터페이스 확장
3. `server/routes.ts` - API 엔드포인트 추가
4. `client/src/components/UnifiedFloatingCard.tsx` - UI 아이콘 추가
5. `client/src/components/SaveRouteDialog.tsx` - 신규 컴포넌트
6. `client/src/pages/MyRoutes.tsx` - 신규 페이지
7. `client/src/pages/Home.tsx` - 다이얼로그 연동
8. `client/src/App.tsx` - 라우트 등록
9. `kenneth.md` - 개발 기록 업데이트

---

## 향후 작업 (미완료)

- [ ] 사진 업로드 시 GPS EXIF 데이터 추출
- [ ] 경로 불러오기 기능 (저장된 경로를 지도에 표시)
- [ ] 경로 공유 기능
- [ ] 경로 내보내기 (GPX/KML 형식)

---

**작성일**: 2024년 12월 21일  
**문서 버전**: 1.0
