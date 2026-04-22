# 🚀 NEXT STEPS: Kenneth Cruise Guide

앞으로 진행할 주요 작업(Next Steps) 및 전략입니다.

## 1. 랜드마크 데이터 완벽화 (Data Perfection)
- [ ] **나레이션 전수 보강**: `short_narrations_report.md`에 등재된 90여 개의 500자 미만 나레이션을 전문 오디오 가이드 수준(1,000자 이상)으로 일괄 보강.
- [ ] **검색 키워드(Search Keywords) 시스템 도입**: 사용자가 '인생샷', '인상파', 'Beaux-Arts' 등의 키워드로 검색했을 때 관련 명소가 즉시 노출되도록 메타데이터 구조화.
- [ ] **다국어(번역) 완벽 동기화**: 새롭게 보강된 한국어 나레이션을 기반으로 영어, 태국어, 중국어 등 최상급 번역 텍스트로 일괄 업데이트.

## 2. 사용자 경험(UX) 및 인터페이스(UI) 최적화
- [ ] **드래그 스크롤 전역 적용**: 데스크톱 사용성을 위한 'Pick & Grab' 스크롤 기능을 앱 내 모든 좌우/상하 스크롤 영역에 완벽하게 디버깅 및 포팅.
- [ ] **프리미엄 블렌딩 UI**: 국가/도시 선택 모달창과 앱 본연의 맵 인터페이스 간의 자연스러운 블렌딩(Pastel tone, Blur 효과) 마무리.
- [ ] **크루즈/AI 탭 활성화**: 하단 Floating Card의 `Cruise` 및 `AI` 탭을 활성화하여 사용자의 위치 반경 내에서 AI가 실시간으로 장소를 추천하는 로직 개발.

## 3. 수익화 및 프리미엄 비즈니스 모델 (Monetization)
- [ ] **Selective Download 모델 도입**: 사용자가 원하는 국가/도시의 개별 프리미엄 투어(Audio & Visuals)만 결제 후 오프라인 다운로드할 수 있는 상점(Shop) UI 완성.
- [ ] **결제 시스템 (Stripe 등) 연동 검증**: 'Transactions' 및 'Settlements' 데이터베이스 스키마와 결제 대행사(PG) API 연동 연계 테스트.

## 4. 인프라 및 배포 (Infrastructure & Deployment)
- [ ] **Cloudflare Workers 캐싱 최적화**: 3MB가 넘는 `landmarks.ts` 로딩 속도 향상을 위한 서비스 워커(Service Worker) 및 엣지 로케이션 캐싱 전략 고도화.
- [ ] **자동화 배치 스크립트 작성**: 향후 데이터 업데이트 시 문법 오류(Unescaped quotes 등)를 사전 차단하는 Pre-commit Hook 및 CI/CD 파이프라인 정착.
