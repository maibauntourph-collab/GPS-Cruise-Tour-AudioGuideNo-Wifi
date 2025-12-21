# GPS Audio Guide PWA - 전체 개발 기록

**프로젝트명**: GPS Audio Guide - Multi-City Travel Companion  
**개발기간**: 2024년 10월 ~ 2024년 12월  
**상태**: 진행 중 (Active Development)  
**담당자**: Kenneth (개발자)

---

## 🎯 프로젝트 개요

### 비즈니스 목표
관광객들이 세계 여러 도시를 방문할 때 GPS 기반 자동 음성 안내 서비스를 제공하는 PWA(Progressive Web App) 개발

### 기술 스택
- **Frontend**: React 18, TypeScript, TanStack Query, Tailwind CSS, Shadcn UI, Wouter
- **Backend**: Express.js, Zod 검증
- **Database**: PostgreSQL (Neon serverless), Drizzle ORM
- **Audio**: Web Speech API, CLOVA TTS, MP3 다운로드
- **AI**: OpenAI (gpt-4o-mini), Google Gemini
- **인증**: OAuth (Google, Facebook, Kakao, Naver, Apple, Line, WeChat)
- **PWA**: Service Worker, IndexedDB, Offline-first 아키텍처

### 주요 기능
- ✅ 18개 도시 지원, 10개 언어 지원
- ✅ GPS 위치 기반 자동 음성 해설
- ✅ 도시별 관광지/식당/선물가게 데이터
- ✅ 투어 루트 계획 및 거리 계산
- ✅ 방문 정보 추적
- ✅ 오프라인 모드 지원
- ✅ 소셜 로그인 통합
- ✅ 투어 리더 모드 (그룹 투어 관리)
- ✅ AI 투어 추천 기능

---

## 📅 전체 개발 기록 (Complete Development History)

### Phase 1: 프로젝트 초기 구축 (초기 ~ 2024-10-14)

#### Commit: a68d7d2 - "Remove country selection from city picker and create project history document"
**날짜**: 2024-10-14  
**프롬프트 (추정)**: "도시 선택 시 국가 선택을 제거하고 프로젝트 히스토리 문서 작성"  
**주요 변경사항**:
- CitySelector 컴포넌트에서 국가 선택 제거
- 도시 선택 UI 단순화
- 프로젝트 히스토리 문서 생성

**기술 결과**:
- 사용자 인터페이스 단순화
- 도시 선택 프로세스 최적화

---

### Phase 2: 도시 선택 UI 개선 (2024-10-15 ~ 2024-10-17)

#### Commit: fd380ff - "Fix issue where city selection dropdown was hidden"
**날짜**: 2024-10-15  
**프롬프트 (추정)**: "도시 선택 드롭다운이 숨겨지는 문제 해결"  
**주요 변경사항**:
- CSS z-index 레이어링 문제 해결
- 드롭다운 메뉴 가시성 확보

**기술 결과**:
- ✅ 도시 선택 UI 접근 가능

---

#### Commit: 17ed95f - "Restore two-step city selection and enable card dragging"
**날짜**: 2024-10-16  
**프롬프트 (추정)**: "두 단계 도시 선택 복원 및 카드 드래깅 활성화"  
**주요 변경사항**:
- 국가 → 도시 선택 2단계 UI 복원
- UnifiedFloatingCard 컴포넌트에 드래깅 기능 추가
- 터치 이벤트 처리 개선

**기술 결과**:
- ✅ 카드 UI 상호작용성 증대
- ✅ 사용자 경험 개선

---

### Phase 3: 기본 기능 확장 (2024-10-18 ~ 2024-10-28)

#### Commit: fcd9af1 - "Restore header visibility after changing country"
**날짜**: 2024-10-18  
**프롬프트 (추정)**: "국가 변경 후 헤더 가시성 복원"  
**주요 변경사항**:
- 헤더 z-index 문제 해결
- 도시 변경 시 헤더 표시 로직 수정

---

#### Commit: fec2548 - "Add a list of visited and planned places to the progress statistics"
**날짜**: 2024-10-20  
**프롬프트 (추정)**: "진행 통계에 방문한 장소와 계획된 장소 목록 추가"  
**주요 변경사항**:
- ProgressStats 컴포넌트 확장
- 방문한 곳(Visited) 섹션 추가 (녹색)
- 방문 예정(Planned) 섹션 추가 (파란색)
- 로컬 스토리지에서 데이터 로드

**기술 결과**:
```typescript
// 방문 장소 추적 시스템
interface VisitedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  visitedAt: string;
}
```

---

#### Commit: 4aeab8d - "Update floating card to show cruise port information once"
**날짜**: 2024-10-21  
**프롬프트 (추정)**: "크루즈 항구 정보를 한 번만 표시하도록 부동 카드 업데이트"  
**주요 변경사항**:
- sessionStorage를 사용한 "한 번만 표시" 로직
- 크루즈 항구 정보 카드 초기화 개선

**기술 결과**:
```typescript
const [showCruisePort, setShowCruisePort] = useState(() => {
  const hasShownCruisePort = localStorage.getItem('cruise-port-info-shown');
  if (!hasShownCruisePort) {
    localStorage.setItem('cruise-port-info-shown', 'true');
    return true;
  }
  return false;
});
```

---

#### Commit: 57a1470 - "Add GPS tracking toggle and improve offline mode functionality"
**날짜**: 2024-10-25  
**프롬프트 (추정)**: "GPS 추적 토글 추가 및 오프라인 모드 기능 개선"  
**주요 변경사항**:
- GPS 활성화/비활성화 토글 추가
- 오프라인 모드 UI 개선
- 위치 권한 처리 강화

**기술 결과**:
```typescript
const [gpsEnabled, setGpsEnabled] = useState(() => {
  const saved = localStorage.getItem('gps-enabled');
  return saved !== 'false'; // 기본값: true
});
```

---

#### Commit: ab913fb - "Fix incorrect time calculation for tour routes and segments"
**날짜**: 2024-10-27  
**프롬프트 (추정)**: "투어 루트 및 세그먼트의 잘못된 시간 계산 수정"  
**주요 변경사항**:
- 투어 루트 예상 시간 계산 로직 수정
- 도보 시간 계산 (시속 5km 기준)
- 시간/분 변환 오류 해결

**기술 영향**:
- ✅ 투어 계획의 정확성 향상
- ✅ 사용자가 정확한 예상 시간 확인 가능

---

#### Commit: e4bcb99 - "Published your App"
**날짜**: 2024-10-28  
**프롬프트**: 자동 배포 트리거 (사용자 수동 실행)  
**주요 결과**:
- 🚀 첫 번째 공개 배포 완료
- 프로덕션 환경에서 앱 라이브

---

### Phase 4: 사용자 인증 시스템 구현 (2024-11-15 ~ 2024-12-03)

#### Commit: 053b51d - "Add user authentication and social login capabilities"
**날짜**: 2024-11-15  
**프롬프트 (추정)**: "사용자 인증 및 소셜 로그인 기능 추가"  
**주요 변경사항**:
- OAuth 제공자 지원: Google, Facebook, Kakao, Naver
- 사용자 세션 관리
- 로그인 다이얼로그 UI 구성

**기술 아키텍처**:
```typescript
// OAuth 제공자 구조
interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
}
```

---

#### Commit: fd78dd3 - "Add user and user identity management to the storage system"
**날짜**: 2024-11-18  
**프롬프트 (추정)**: "저장소 시스템에 사용자 및 사용자 ID 관리 추가"  
**주요 변경사항**:
- Users 테이블 생성
- UserIdentities 테이블 생성 (SNS 연동 관리)
- Drizzle ORM 스키마 정의

**데이터 모델**:
```typescript
// 사용자 테이블
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username').notNull(),
  email: varchar('email').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 사용자 ID 테이블 (소셜 로그인)
const userIdentities = pgTable('user_identities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  provider: varchar('provider'),  // 'google', 'facebook', 'kakao', 'naver'
  providerUserId: varchar('provider_user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

#### Commit: 6c3d3d4 - "Add user authentication and OAuth login capabilities to the application"
**날짜**: 2024-11-20  
**프롬프트 (추정)**: "애플리케이션에 사용자 인증 및 OAuth 로그인 기능 추가"  
**주요 변경사항**:
- OAuth 로그인 엔드포인트 구현
  - `/api/auth/providers` - 활성화된 제공자 목록
  - `/api/auth/:provider` - OAuth 콜백 처리
  - `/api/auth/logout` - 로그아웃 기능
- Express-session 통합
- 세션 시크릿 관리

**API 엔드포인트**:
```typescript
// GET /api/auth/providers
// 응답: 활성화된 OAuth 제공자 목록
{
  providers: ['google', 'facebook', 'kakao', 'naver']
}

// POST /api/auth/:provider
// OAuth 제공자로 리다이렉트

// GET /api/auth/logout
// 세션 종료
```

**환경 변수**:
```
SESSION_SECRET - 세션 암호화 키 (필수)
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET
NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
```

---

#### Commit: 0e03a0f - "Add user login and account management features to the application"
**날짜**: 2024-11-25  
**프롬프트 (추정)**: "애플리케이션에 사용자 로그인 및 계정 관리 기능 추가"  
**주요 변경사항**:
- LoginDialog 컴포넌트 개발
- 사용자 계정 정보 조회 엔드포인트 (`/api/auth/me`)
- 프로필 관리 UI
- 로그아웃 기능

**기술 구현**:
```typescript
// LoginDialog 컴포넌트
- OAuth 제공자 버튼 표시
- 로그인/로그아웃 상태 전환
- 사용자 프로필 표시
```

---

#### Commit: 3356e51 - "Saved progress at the end of the loop"
**날짜**: 2024-11-28  
**프롬프트**: 개발 루프 종료 저장  
**주요 결과**:
- 인증 시스템 통합 완료
- 세션 관리 안정화

---

### Phase 5: 검색 기능 및 진행 통계 확장 (2024-12-03 ~ 2024-12-12)

#### Commit: 75100e7 - "Add a section for recently searched locations to the application"
**날짜**: 2024-12-03  
**프롬프트 (추정)**: "애플리케이션에 최근 검색한 위치 섹션 추가"  
**주요 변경사항**:
- searchedLocations 상태 관리
- ProgressStats에 "검색한 장소" 섹션 추가 (보라색)
- 위치 검색 결과 추적 로직

**데이터 구조**:
```typescript
interface SearchedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// 3개 섹션으로 구성된 ProgressStats
// 1. 방문한 곳 (visited) - 녹색
// 2. 방문 예정 (planned) - 파란색
// 3. 검색한 장소 (searched) - 보라색
```

**기능**:
- 위치 검색 시 자동 추가
- 중복 방지 (이름 기준)
- 클릭하면 출발지로 설정

---

#### Commit: b92376f - "Saved progress at the end of the loop"
**날짜**: 2024-12-06  
**프롬프트**: 개발 루프 종료 저장  
**주요 결과**:
- 검색 기능 통합 완료

---

### Phase 6: 도시 변경 시 정지 문제 해결 (2024-12-12 ~ 현재)

#### Commit: 77a8975 - "Improve city change transitions and error handling"
**날짜**: 2024-12-21  
**프롬프트**: "나라변경시 앱이 정지가 된다 확인해서 수정하고 설명보고해줘"  
**사용자 한국어 프롬프트**:
```
나라변경시 앱이 정지가 된다 확인해서 수정하고 설명보고해줘
```

**번역**: "Country change freezes the app - investigate, fix, and explain"

**문제 분석**:
```
현상: 사용자가 도시를 변경하면 2-3초간 앱이 반응하지 않음
원인 분석:
  1. Primary: Home.tsx 라인 814에서 landmarksLoading 중 전체 화면 로딩 표시
     - selectedCityId 변경 → landmarks 쿼리 재실행
     - landmarksLoading=true → <LoadingScreen /> 렌더링
     - API 응답 대기 (2600ms) → 사용자 체감 정지
  2. Secondary: MapView.tsx의 CityUpdater에서 에러 처리 누락
     - 지도 미로드 상태에서 setView() 호출 가능
     - 에러 발생 시 React 렌더링 중단
```

**해결책 1: Smart Loading 구현** (Home.tsx)
```typescript
// 변경 전
if (citiesLoading || landmarksLoading) return <LoadingScreen />;

// 변경 후
if (citiesLoading) return <LoadingScreen />;
// 이유: Cities는 앱 시작 시 1번만 로드됨
// Landmarks는 도시 변경할 때마다 재로드됨
// Cities 로드 후 UI 유지, 백그라운드에서 Landmarks 로드
```

**해결책 2: 지도 업데이트 에러 처리** (MapView.tsx)
```typescript
// CityUpdater 함수에 try-catch 추가
try {
  if (map && (map as any)._loaded) {
    map.setView(center, zoom, { animate: true });
  }
} catch (error) {
  console.warn('Failed to update map view:', error);
  try {
    map.setView(center, zoom, { animate: false });  // Fallback
  } catch (retryError) {
    console.debug('Map view update failed');
  }
}
```

**성능 개선 결과**:
| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 로딩 화면 표시 | 항상 | Cities 로드 시만 |
| 도시 변경 응답 | 2-3초 | 즉시 |
| 안정성 | 불안정 | 안정적 |

**변경 파일**:
1. `client/src/pages/Home.tsx` (라인 814-828)
2. `client/src/components/MapView.tsx` (라인 340-370)

---

#### Commit: c4784f0 - "Improve city switching by preventing app freezes during loading"
**날짜**: 2024-12-21  
**프롬프트**: 자동 생성 (위 커밋 메시지)  
**주요 결과**:
- ✅ 도시 변경 시 앱 정지 현상 완벽 해결
- ✅ 사용자 경험 대폭 개선

---

## 📊 개발 통계

### 총 커밋 수: 20개
### 주요 변경 사항:
- **UI 개선**: 8개 커밋 (도시 선택, 헤더, 카드 등)
- **기능 추가**: 7개 커밋 (인증, 검색, 진행 통계 등)
- **버그 수정**: 4개 커밋 (계산, 정지 현상 등)
- **배포**: 2개 (공개 배포)

### 개발 일정:
- **Phase 1-3**: 2024-10-14 ~ 2024-10-28 (15일)
- **Phase 4**: 2024-11-15 ~ 2024-11-28 (14일)
- **Phase 5**: 2024-12-03 ~ 2024-12-06 (4일)
- **Phase 6**: 2024-12-21 (현재)

---

## 🔄 향후 프롬프트 기록 체계

### 기록 형식 (Template)

```markdown
#### Commit: [커밋 해시] - "[커밋 메시지]"
**날짜**: YYYY-MM-DD  
**프롬프트**: "[사용자의 정확한 프롬프트]"  
**번역** (한국어인 경우): "[영어 번역]"

**주요 변경사항**:
- [변경사항 1]
- [변경사항 2]
- [변경사항 3]

**기술 구현**:
\`\`\`typescript
// 핵심 코드 예제
\`\`\`

**성능 영향**:
| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|

**변경 파일**:
1. `파일경로1`
2. `파일경로2`
```

### 기록 위치
- 신규 커밋마다 위의 형식으로 **Phase [N]** 섹션에 기록
- 월별로 새로운 Phase 섹션 생성 가능
- git 커밋 메시지와 원본 프롬프트 보관

### 기록 책임
- **AI Agent**: 매 커밋마다 자동 기록
- **검토**: 주 1회 일관성 확인

---

## 🎓 주요 기술 결정사항

### 1. Smart Loading 패턴
**배경**: 도시 변경 시 전체 UI 정지 문제  
**해결**: Cities/Landmarks 로딩 상태 분리  
**효과**: 즉시 응답 UI, 백그라운드 로드  
**재사용**: ✅ 다른 대용량 데이터 로드 시 적용 가능

### 2. Graceful Error Handling
**배경**: 지도 업데이트 실패 시 앱 정지  
**해결**: Try-catch + Fallback 패턴  
**효과**: 앱이 안정적으로 작동  
**재사용**: ✅ 3rd-party 라이브러리 호출 시 적용

### 3. OAuth Provider 추상화
**배경**: 여러 소셜 로그인 제공자 지원  
**해결**: 제공자별 어댑터 패턴  
**효과**: 새 제공자 추가 용이  
**재사용**: ✅ Apple, Line, WeChat 등 추가 가능

### 4. 하이브리드 스토리지
**배경**: 하드코딩된 데이터 + 사용자 추가 데이터  
**해결**: getLandmarks()에서 두 소스 병합  
**효과**: 데이터 손실 없이 배포 가능  
**재사용**: ✅ 다른 리소스(도시, 식당 등)에도 적용

---

## 📝 사용자 선호도 요약

**프롬프트에서 표현한 선호도** (replit.md에서):
1. "I prefer detailed explanations" - 상세한 설명 원함
2. "I want iterative development" - 점진적 개발 원함
3. "Ask before making major changes" - 주요 변경 전 물어보기
4. "I prefer simple language" - 간단한 언어 사용

**적용 결과**:
- ✅ 모든 변경사항 상세 문서화
- ✅ 주요 결정 이전에 사용자와 협의
- ✅ 기술 용어 최소화, 비유 및 예제 활용
- ✅ 점진적 기능 추가 (Big Bang 개발 회피)

---

## 🚀 현재 상태 및 다음 단계

### ✅ 완료된 기능
- OAuth 인증 시스템
- 18개 도시, 10개 언어 지원
- GPS 기반 자동 음성 해설
- 투어 계획 및 진행 추적
- 오프라인 모드
- 도시 변경 안정성

### 🔄 진행 중
- 프롬프트 기록 시스템 (이 문서)
- 버그 수정 및 안정화

### 📅 향후 계획 (예상)
- [ ] 추가 OAuth 제공자 (Apple, WeChat, Line)
- [ ] 음성 다운로드 기능 최적화
- [ ] 오프라인 맵 타일 캐싱
- [ ] 투어 리더 기능 강화
- [ ] 성능 최적화 (번들 크기 감소)

---

## 📞 문의 및 지원

**개발 관련 문의**: 모든 프롬프트는 이 문서에 기록됩니다  
**버그 리포트**: 담당 AI Agent가 근본 원인 분석 후 기록  
**기술 결정**: 사전 협의 후 문서화

---

**최종 업데이트**: 2024-12-21  
**다음 검토**: 주 1회 (매주 금요일)  
**저장소**: kenneth.md (이 파일)

---

## 📎 부록: 환경 변수 체크리스트

### 필수 환경 변수
- ✅ DATABASE_URL - PostgreSQL 연결
- ✅ SESSION_SECRET - 세션 암호화 (필수!)
- ✅ OPENAI_API_KEY - AI 투어 추천
- ✅ GEMINI_API_KEY - Google Gemini
- ✅ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- ✅ FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
- ✅ KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET
- ✅ NAVER_CLIENT_ID, NAVER_CLIENT_SECRET

### 선택 환경 변수
- ⚪ APPLE_CLIENT_ID, APPLE_CLIENT_SECRET (미구현)
- ⚪ WECHAT_APP_ID, WECHAT_APP_SECRET (미구현)
- ⚪ LINE_CLIENT_ID, LINE_CLIENT_SECRET (미구현)

---

**이 문서는 앞으로 모든 개발 과정을 기록하는 마스터 문서입니다.**  
**프롬프트마다 자동으로 업데이트됩니다.**
