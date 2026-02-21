# 🧠 오토메이션 박사 노하우 (Automation Doctor Know-How)

> **작성자**: 🤖 오토메이션 박사 (Dr. Automation)
> **최종 업데이트**: 2026-02-20

## 🤖 AI 자동화 및 API 연동 (AI Automation)

### 1. "JSON 모드의 배신"
- **문제**: 프롬프트에 "JSON으로 줘"라고만 하면 가끔 Markdown 코드 블록(```json ... ```)을 포함해서 파싱 에러 발생.
- **해결**: OpenAI API의 경우 `response_format: { type: "json_object" }`를 명시적으로 사용하고, 프롬프트에도 "Do not include markdown formatting"을 추가.
- **교훈**: "AI에게 형식은 부탁하는 게 아니라 강제하는 것이다."

### 2. "비동기 작업의 타임아웃"
- **문제**: 긴 텍스트의 TTS 생성 요청이 Cloudflare Workers의 실행 시간 제한(CPU time limit)을 초과함.
- **해결**: 작업을 큐(Queue)에 넣고 비동기로 처리하거나, 텍스트를 문장 단위로 쪼개서 병렬 요청.
