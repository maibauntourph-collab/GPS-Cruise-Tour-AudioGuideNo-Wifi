# 어드민 사이트 및 백엔드 디버깅 계획 (어벤져스)

이 계획은 초기 진단 중 발견된 몇 가지 중요한 문제를 해결합니다:
1. **방대한 하드코딩 저장소**: `storage.ts` 파일이 8,000라인 이상의 데이터를 포함하여 1.1MB에 달함.
2. **하이브리드 저장소 위험**: 핵심 데이터는 `MemStorage`에, 세션 기반 데이터는 `db` (Drizzle)에 혼용되어 관리됨.
3. **어드민 API 보안**: 주요 `/api/admin` 경로에 대한 인증 및 권한 부여 검증 필요.

## 사용자 검토 필요 사항

> [!IMPORTANT]
> **기술 부채 경고**: 현재 시스템은 8,000라인의 하드코딩된 데이터 파일(`storage.ts`)을 사용하고 있습니다. 기능상 문제는 없으나, 이는 개발 속도를 늦추고 메모리 부족 위험을 증가시킵니다. 현재는 이 구조 내에서 버그를 수정할 계획이지만, 향후 이 데이터를 적절한 데이터베이스로 이전할 것을 권장합니다.

## 제안된 변경 사항

### 백엔드 복구 (AI 어벤져스)

#### [수정] [storage.ts](file:///Users/kwangseobpark/skills-gps/skills-nowifigps.tours/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/server/storage.ts)
- **쿼리 마스터 오딧**: ID 충돌 및 중복 데이터 확인.
- **서버 박 점검**: `MemStorage` 메서드가 DB 장애 시 폴백(fallback)을 적절히 처리하는지 확인.
- **오토메이션 닥터**: 성능 저하 시 8,000라인의 데이터를 모듈화하는 방법 연구.

#### [수정] [routes.ts](file:///Users/kwangseobpark/skills-gps/skills-nowifigps.tours/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/server/routes.ts)
- `admin` 권한이 있는 사용자만 `/api/admin/*` 경로에 접근할 수 있도록 검증.
- 가져오기/내보내기(import/export) 및 오디오 생성 엔드포인트의 잠재적 로직 오류 수정.

### 어드민 UI 폴리싱

#### [수정] [Admin.tsx](file:///Users/kwangseobpark/skills-gps/skills-nowifigps.tours/GPS-Cruise-Tour-AudioGuideNo-Wifi-1/client/src/pages/Admin.tsx)
- CRUD 작업이 백엔드 상태를 올바르게 반영하도록 보장.
- 대규모 데이터 가져오기 시의 오류 처리 개선.

## 검증 계획

### 자동화 테스트
- `npm run test` (가능한 경우)
- `/api/admin/stats`가 일관된 데이터를 반환하는지 확인.

### 수동 검증
1. 관리자로 로그인.
2. 도시 및 명소 생성/업데이트 테스트.
3. 서버 재시작 후 데이터 보존 여부 확인 (하드코딩된 항목은 초기화될 수 있으나 DB 항목은 보존되어야 함).
4. 내보내기(Export)를 실행하고 JSON 구조 검증.
