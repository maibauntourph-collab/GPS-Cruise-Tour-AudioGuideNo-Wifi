# UI 흐름 최적화 (StartupDialog -> Magic Landing) 구현 계획

이 계획은 사용자가 앱에 접속했을 때 초기 설정(`StartupDialog`)을 마친 후, GPS 기반의 도시 환영 다이얼로그(`Magic Landing`)가 자연스럽고 정확한 순서로 나타나도록 보장합니다.

## 🎯 목표
1.  **순차적 노출 보장**: `StartupDialog`가 완전히 닫히기 전에는 `Magic Landing`이 나타나지 않도록 `Home.tsx`의 로직을 견고하게 만듭니다.
2.  **UX 감동 극대화**: 다이얼로그 전환 시 발생하는 깜빡임이나 급격한 변화를 방지하고 감성적인 인터랙션을 추가합니다.
3.  **예외 처리**: GPS 권한 거부나 위치 인식 지연 시에도 사용자에게 자연스러운 기본 화면을 제공합니다.

## 🛠️ 주요 변경 사항

### 1. [디버그 닥터] 로직 정밀 진단 및 수정 (Bug Doctor)
- `Home.tsx` 내의 `useEffect` 훅에서 `showStartupDialog` 상태값을 더 엄격하게 체크하도록 수정합니다.
- 상태 변화 시 발생할 수 있는 레이스 컨디션(Race Condition)을 방지하기 위한 안전장치를 추가합니다.
- F12 콘솔 로그를 통해 각 단계의 전환이 정확히 발생하는지 고유 태깅 로그를 남깁니다.

### 2. [디자이너 킴] 전환 UX 고도화 (Designer Kim)
- `StartupDialog`가 닫힐 때와 `Magic Landing`이 열릴 때 사이의 아주 짧은 간극을 부드러운 페이드 효과나 스켈레톤 UI로 채워 심리적 안정감을 줍니다.
- 다이얼로그 간의 레이어(Z-index) 충돌 여부를 재점검합니다.

## ✅ 검증 계획
- `StartupDialog`에서 '시작하기' 클릭 후 즉시 도시 랜딩 다이얼로그가 뜨는지 확인합니다.
- 만약 아직 도시 지역(Radius) 밖이라면 랜딩 다이얼로그가 뜨지 않고 정상 홈 화면이 나오는지 확인합니다.
- 콘솔 로그를 통해 `[Bug Doctor] UI Sequence Start -> Startup Closed -> Landing Triggered` 순서가 일치하는지 검증합니다.
