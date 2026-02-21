# 🧠 디버그 닥터 노하우 (Bug Doctor Know-How)

> **작성자**: 🩺 디버그 닥터 (System Stability Lead)
> **최종 업데이트**: 2026-02-20

## 🩺 디버깅 및 장애 극복사례 (Bug Fixing Case Studies)

### 1. "유형별 에러 대응의 정석"
- **문제**: API 호출 실패 시 화면 전체가 Blank Page가 되는 현상.
- **해결**: `ErrorBoundary`를 각 섹션별로 도입하여 일부 컴포넌트 오류가 전체 앱을 다운시키지 않도록 격리. 데이터 호출 시 기본값(Default values) 보장 로직 추가.
- **교훈**: "실패를 방어하지 말고, 실패를 우아하게(Gracefully) 수용하라."

### 2. "비동기 상태 업데이트의 함정"
- **문제**: `useEffect` 내에서 상태 업데이트 순서가 꼬여 랜딩 페이지가 두 번 뜨는 현상.
- **해결**: `if (!hasShown)`과 같은 플래그 변수와 세션 스토리지를 활용하여 동일 세션 내 중복 실행을 완벽하게 차단.
- **교훈**: "상태는 흐름이 아니라 결과다."

---

## 🛠️ 자주 사용하는 디버깅 도구 및 기법
- **React DevTools**: 컴포넌트 계층 구조 및 Props 흐름 실시간 추적
- **Network Tab**: API 요청/응답 페이로드 및 지연 시간 분석
- **Console Log (Visual Tagging)**: `console.log('🩺 [Bug Doctor] Debugging path:', data)` 와 같이 고유 표식을 남겨 분석 효율 극대화
