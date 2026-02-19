# 🧠 정산이 노하우 (Settlement Clerk Know-How)

> **작성자**: 💰 정산이 (Settlement Clerk)
> **최종 업데이트**: 2026-02-20

## 💰 정산 및 결제 처리 (Settlement & Payment)

### 1. "웹훅(Webhook)은 믿을 수 없다"
- **문제**: Stripe 서버에서 웹훅을 보냈는데, 내 서버가 잠깐 죽어서 못 받는 경우 발생. 결제는 됐는데 주문 처리가 안 됨.
- **해결**: 웹훅에만 의존하지 말고, 주기적으로 Stripe API를 호출하여 `incomplete` 상태인 주문들을 조회하고 상태를 동기화하는 **폴링(Polling) 데몬**을 병행해야 안전함.
