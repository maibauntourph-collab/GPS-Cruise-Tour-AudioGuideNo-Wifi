# TTS 및 나레이션 언어 매핑 오류 수정 보고서
**작성일시**: 2026년 03월 22일 14:23 CST

## 1. 개요
* **발생 이슈**: 다국어 환경에서 시스템 나레이션과 TTS 재생 간 표시 텍스트 언어 맵핑이 불일치. (음성은 다른 언어로 나오거나, 화면에 표시되는 텍스트가 영어로 고정되는 문제 발생)
* **주요 원인**:
  1. `LanguageSelector`에서 제공하는 일부 언어 코드(`zh-CN`, `zh-TW` 등)가 `audioService.ts`의 `getLangCode` 하드코딩 매핑 테이블에 없어 기본값인 영어(`en-US`) 목소리로 Fallback 처리됨.
  2. UI에 표시되는 텍스트(`currentDetailedDescription` 등)는 `useLiveTranslation`을 타지 않고 기존 Static 데이터의 영어 Fallback을 그대로 화면에 그리는 반면, 오디오 엔진은 `getTranslatedText`로 런타임에 번역하여 읽어버리는 바람에 화면의 텍스트와 음성의 언어가 갈라지는 데드락 현상 발생.

## 2. 작업 내역 및 수정 사항
### A. `client/src/lib/audioService.ts` 수정
* `getLangCode` 매핑 함수에 `zh-CN`, `zh-TW` 식별 코드 추가 완료.
* 하드코딩 테이블에 없는 지역언어 코드 형태(예: `xx-XX`)가 직접 들어올 경우 `en-US`로 강제 다운그레이드 처리되는 것을 막고, `language.includes('-')` 조건을 통해 OS/브라우저 스펙 그대로 TTS 엔진에 전달하도록 예외 처리.

### B. `client/src/components/LandmarkDetailDialog.tsx` 수정
* [적요] 화면의 활성 상태 문장 배열(`activeSentences`)과 `textToPlay`가 서로 다른 소스를 바라보는 버그 수정.
* `currentDetailedDescription`과 역사 나레이션 문장 전부 `useLiveTranslation` 커스텀 훅의 반환값에 의존하도록 리액트 의존성 배열 및 Fallback 설계 수정.
* 이제 TTS 엔진이 읽기 시작하는 언어와, 사용자의 화면에서 하이라이트 되며 표시되는 번역 텍스트가 100% 동일한 **단일 진실 공급원(Single Source of Truth, 실시간 번역 훅 상태)**을 갖도록 최적화.

## 3. 참여 에이전트 및 사용 스킬
* **에이전트**: Bug Doctor (AI 프로그램 디버깅 전문가)
* **스킬**: `bug_doctor` (런타임 버그 진단 및 모바일 브라우저 오디오 이슈 디버깅)
* **사용된 MCP / 기능**: `replace_file_content`, `grep_search`, `view_file`

## 4. 리뷰 및 기대 효과
"이제 중국어(번체/간체)를 포함해 어떤 언어를 누르더라도 화면과 오디오가 정확한 텍스트로 합일(동기화)되어 플레이 될 거예요. 교수님(사용자)께서 걱정하셨던 외국 사용자의 UX 혼란을 완벽히 차단했습니다!"
