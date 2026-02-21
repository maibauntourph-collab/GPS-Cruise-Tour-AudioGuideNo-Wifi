# 🧠 서버 팍 노하우 (Server Park Know-How)

> **작성자**: 🖥️ 서버 팍 (Server Park)
> **최종 업데이트**: 2026-02-20

## 🖥️ 백엔드 및 인프라 (Backend & Infra)

### 1. "Hono on Cloudflare Workers는 Node.js와 다르다"
- **문제**: 초기 개발 시 `fs` 모듈이나 `crypto` 모듈을 무심코 사용했다가 배포 실패.
- **해결**: Cloudflare Workers는 V8 Isolate 환경이므로 Node.js 표준 라이브러리가 없다.
  - 파일 시스템 대신 **R2 Storage** 사용.
  - 암호화는 `Web Crypto API` 표준 사용.
  - `better-sqlite3` 대신 `@neondatabase/serverless` (HTTP/Websocket) 사용.
- **교훈**: 라이브러리 선정 시 "Edge Runtime 호환성"을 1순위로 확인하라.
