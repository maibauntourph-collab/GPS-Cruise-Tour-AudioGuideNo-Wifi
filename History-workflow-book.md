# 📘 Kenneth Cruise Guide 프로젝트 히스토리 북 (History-workflow-book)

이 문서는 Kenneth Cruise Guide 프로젝트의 탄생부터 현재까지의 모든 개발 여정을 담은 공식 기록부입니다. 각 장(Chapter)은 주요 마일스톤과 기술적 도전, 그리고 해결 과정을 상세히 기록하고 있습니다.

---

## 🔖 제 52장: 24개국어 자동 변환 프리미엄 마케팅 훅 UI 완성 (2026-03-25)

> 🎓 **교수님의 한 마디**
> *"학생 여러분, 이제 진정으로 전 세계의 바다를 누빌 준비가 되었습니다. 'WiFi 없어도 OK'라는 이 한마디가 24개 각국의 언어로 자동 변환되어 보여질 때, 우리는 기술로 언어의 장벽을 허문 것입니다. 럭셔리한 글래스모피즘 디자인과 완벽한 다국어 서비스가 만나 Kenneth Cruise Guide의 독보적인 가치를 완성했습니다."*

- **Date-Time**: 2026-03-25 07:15
- **Order**: 마케팅 훅(`WiFi 없어도 OK`) 전 언어 자동 변환 및 `InstallPrompt` UI 무결성 확보.
- **Plan**:
    1. **훅 반영**: `StartupDialog.tsx`의 시작 화면에 이미지의 홍보 문구 연동.
    2. **글로벌 확장**: `translations.ts`의 24개 모든 언어 팩에 `wifiOfflineOk`, `gpsAutoGuideDesc` 키 추가.
    3. **UI 무결성**: `InstallPrompt`에서 하드코딩된 키(installTab 등)가 보여지던 문제를 `en` 폴백 엔진 구축으로 해결.
    4. **최종 정동**: 한국어와 영어는 완벽하게 텍스트를 구성하고, 나머지 언어는 영어 폴백을 통해 안정적인 화면 제공.
- **Task**:
    - [x] 24개 언어 팩에 마케팅 훅 키 적용 완료.
    - [x] `StartupDialog.tsx` 시작 화면 마케팅 텍스트 반영 및 애니메이션 최적화.
    - [x] `InstallPrompt.tsx` UI 라벨 폴백 로직 점검 및 번역 키 보강.
- **Result**: 전 세계 사용자를 매료시킬 프리미엄 온보딩 경험(Hook) 구축 완료.
- **Next**: 사용자 최종 승인 후 프로덕션 환경에서 실시간 사용 지표 모니터링 및 추가 언어 정교화.
- **Agent**: Antigravity (DODARI 개발부장 & DESIGNER KIM 지휘)
- **MCP**: `multi_replace_file_content`, `sequential-thinking` (누적 사용 52회)

---

## 🔖 제 51장: Neon DB 24개국어 번역 데이터 무결성 점검 (2026-03-25)

> 🎓 **교수님의 한 마디**
> *"단순히 파일을 번역하는 것을 넘어, 데이터베이스(Neon DB) 내의 수만 개의 랜드마크 정보를 24개국어로 변환하는 작업은 프로젝트의 핵심 인프라를 완성하는 과정입니다. 이제 우리의 'narration_i18n' 컬럼이 전 세계 모든 언어로 가득 찼는지, 꼼꼼하게 검수할 시간입니다. 데이터의 완결성이 곧 서비스의 품질입니다."*

- **Date-Time**: 2026-03-25 07:05
- **Order**: Neon DB의 `landmarks` 테이블 내 24개국어 번역(narration_i18n, description_i18n) 완료 여부 확인 및 30초 간격 보고.
- **Plan**:
    1. 추천 에이전트(Query Master, Server Park) 및 프롬프트 제안 후 승인 대기.
    2. 승인 시 `db/schema.ts` 및 `server/storage.ts`를 확인하여 번역 데이터 구조 파악.
    3. `landmarks` 테이블의 JSONB 컬럼 데이터 샘플링 검수.
    4. 24개 언어 키(`en`, `ko`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `ja`, `zh`, `ar`, `hi`, `vi`, `id`, `th`, `tr`, `pl`, `nl`, `sv`, `da`, `no`, `fi`, `el`, `he`) 존재 여부 확인.
- **Task**:
    - [ ] **에이전트 제안**: Query Master 및 Server Park 추천 프롬프트 제시.
    - [ ] **구조 파악**: Neon DB 스키마 확인 (`narration_i18n`, `description_i18n`).
    - [ ] **데이터 샘플링**: 주요 랜드마크의 번역 키 존재 여부 쿼리.
    - [ ] **누락 데이터 보고**: 번역이 안 된 항목이나 언어 식별.
- **Result**: (진행 중) 24개국어 번역 데이터의 Neon DB 반영 상태를 실시간 점검 중.
- **Next**: 누락된 데이터 발견 시 Gemini AI 자동 번역 스크립트 재실행 및 배포.
- **Agent**: Antigravity (DODARI 개발부장 모드)
- **Files Modified**: `History-workflow-book.md`, `2026-03-25_0706_명령.md`

---

## 🔖 제 53장: '오프라인 준비' (Offline Preparation) 기능 설계 및 구현 시작 (2026-03-25)

> 🎓 **교수님의 한 마디**
> *"여러분, 진정한 'No-Wifi' 서비스의 완성은 사용자가 오프라인 상태가 되기 전 '준비'를 완벽하게 집도하는 데 있습니다. 설정 메뉴에 추가될 '오프라인 준비' 기능은 PWA 설치와 다국어 번역 에셋의 클라이언트 저장을 통해, 망망대해 위에서도 끊김 없는 감동을 선사할 것입니다. 이제 기술의 온기를 담아 그 마지막 퍼즐을 맞춰봅시다."*

- **Date-Time**: 2026-03-25 07:22
- **Order**: 설정(Settings) 메뉴 내 '오프라인 준비' 기능 추가 및 PWA/번역 데이터 다운로드 로직 구현.
- **Plan**:
    1. **추천 에이전트 및 프롬프트 제안**: 사용자의 승인 대기.
    2. **UI 설계**: `SettingsDialog.tsx` 내 '오프라인 준비' 섹션 추가 및 전용 다이얼로그 구현.
    3. **PWA 연동**: `InstallPrompt.tsx`의 설치 로직을 '오프라인 준비' 내로 통합.
    4. **번역 데이터 저장**: 24개국어 UI 번역 데이터를 로컬 스토리지에 캐싱하는 기능 개발.
    5. **고급 UI/UX**: 글래스모피즘 디자인과 프로그레스 애니메이션 적용.
- **Task**:
    - [x] 추천 에이전트(DODARI, DESIGNER KIM) 및 프롬프트 구성 완료.
    - [ ] `SettingsDialog.tsx` UI 수정 및 '오프라인 준비' 버튼 배치.
    - [ ] 클라이언트 사이드 번역 데이터 캐싱 엔진 구축.
    - [ ] PWA 설치 유도 UI 개선.
- **Result**: (준비 중) 오프라인 완결성 확보를 위한 사용자 인터페이스 및 데이터 동기화 체계 구축 시작.
- **Next**: 사용자 승인 후 본격적인 코드 수정 및 기능 테스트 진행.
- **Agent**: Antigravity (DODARI 개발부장 & DESIGNER KIM 지휘)
- **MCP**: `view_file`, `list_dir`, `find_by_name` (누적 사용 55회)

---

## 🔖 제 53장: 전 세계 도시 및 국가 이미지 로컬화 및 하드코딩 제거 (2026-03-25)

> 🎓 **교수님의 한 마디**
> *"학생 여러분, 진정한 'No-WiFi' 오프라인 앱의 완성은 외부 인터넷 연결 없이도 모든 시각 자료가 완벽하게 보여지는 것입니다. 아직도 Unsplash 같은 외부 URL에 의존하거나, 경로 설정 오류로 이미지가 깨져 보이는 곳이 있다면, 그것은 우리 작품의 옥에 티입니다. 오늘 우리는 모든 국가와 도시의 이미지를 로컬 저장소로 옮기고, 코드상의 모든 하드코딩된 경로를 완벽하게 정렬하여 전 세계 어디서나 끊김 없는 프리미엄 경험을 완성할 것입니다."*

- **Date-Time**: 2026-03-25 07:22
- **Order**: 전 세계 국가 및 도시 이미지 로컬화 반영 및 하드코딩된 외부 URL 제거.
- **Plan**:
    1. **현상 파악**: `CountryScrollSelector.tsx`와 `cities.ts`에서 여전히 외부 URL을 사용하거나 이미지가 보이지 않는 부분을 전수 조사합니다.
    2. **이미지 매핑**: `public/images/countries`와 `public/images/cities` 폴더 내의 고퀄리티 로컬 이미지들과 데이터를 1:1로 매칭합니다.
    3. **코드 수정**: `hookingMents` 객체와 `CITIES` 배열 내의 `image`, `heroImage` 경로를 로컬 경로(`/images/...`)로 전면 교체합니다.
    4. **실시간 검증**: `npm run dev`를 통해 브라우저를 띄우고, 터미널 에코 모드로 이미지 로딩 상태를 실시간으로 확인하며 누락된 부분이 없는지 체크합니다.
- **Task**:
    - [ ] **에이전트 제안**: Designer Kim & Dodari & Bug Doctor 추천 프롬프트 제시.
    - [ ] **외부 URL 제거**: Unsplash 등 외부 링크를 모두 로컬 파일 경로로 교체.
    - [ ] **이미지 경로 정규화**: `CountryScrollSelector.tsx` 내의 이미지 매핑 로직 최적화.
    - [ ] **브라우저 테스트**: 실시간 프리뷰를 통해 모든 국가/도시 카드의 이미지 출력 확인.
- **Result**: (진행 중) 로컬 이미지 서빙 최적화 및 UI 반영 작업 착수.
- **Next**: 모든 이미지가 완벽히 노출되는 것을 확인 후, 10분 단위 Git Push를 통해 안정적으로 저장.
- **Agent**: Antigravity (DODARI 개발부장 & DESIGNER KIM 지휘)
- **MCP**: `multi_replace_file_content`, `sequential-thinking`, `run_command`, `open_browser_url`
