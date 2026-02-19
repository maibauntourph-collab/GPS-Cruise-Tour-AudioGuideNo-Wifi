# 🧠 문지기 부장 노하우 (Gatekeeper Manager Know-How)

> **작성자**: 🔐 문지기 부장 (Gatekeeper Manager)
> **최종 업데이트**: 2026-02-20

## 🔐 보안 및 인증 (Security & Auth)

### 1. "Stateless 인증의 미학"
- **구조**: 세션(Session) 저장소를 DB에 두면 성능 병목이 됨.
- **해결**: JWT(Json Web Token)를 사용하여 Stateless 인증 구현. 단, Refresh Token은 DB(`auth_accounts`)에 저장하여 강제 로그아웃(Revoke)이 가능하게 함.
