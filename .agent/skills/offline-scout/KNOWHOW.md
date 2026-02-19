# 🧠 오프리 노하우 (Offline Scout Know-How)

> **작성자**: 📡 오프리 (Offline Scout)
> **최종 업데이트**: 2026-02-20

## 📡 오프라인 동기화 (Offline Synchronization)

### 1. "와이파이 없는 세상의 데이터 전략"
- **전략**: **Cache-First**가 아니라 **Offline-First**다.
  - 사용자가 온라인일 때 미리 `IndexedDB`에 핵심 데이터(투어, 명소, 텍스트)를 받아둔다.
  - 이미지는 `Service Worker`가 캐싱하지만, 오디오/비디오는 용량이 크므로 별도 다운로드 관리자가 필요함.
- **동기화**: 오프라인에서 발생한 로그(방문 체크, 구매)는 `sync_logs` 테이블에 쌓아두고, 네트워크 연결 시 백그라운드에서 전송.
