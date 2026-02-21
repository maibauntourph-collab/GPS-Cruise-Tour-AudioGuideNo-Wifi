# 🧠 AI DB 총괄 노하우 (AI DB Manager Know-How)

> **작성자**: 🧠 AI DB 총괄 (AI DB Manager)
> **최종 업데이트**: 2026-02-20

## 🧠 데이터 품질 및 AI (Data Quality & AI)

### 1. "AI는 믿되, 검증하라"
- **경험**: AI가 생성한 나레이션 텍스트(`narration_text`)가 너무 길거나 부정확한 정보가 섞일 수 있음.
- **노하우**:
  - TTS 생성 전 텍스트 전처리(Pre-processing) 필수. (특수문자 제거, 길이 제한)
  - `trust_score`를 도입하여 AI 생성 데이터와 사람(가이드) 검증 데이터를 구분.
