# Claude 기본 롤 — NoWiFi GPS Audio Tour 프로젝트

## 작업 마무리 규칙 (필수)

**모든 작업 세션이 끝날 때마다 반드시 아래 2가지를 실행한다:**

### 1. 작업완료.md 업데이트
- 파일 위치: `작업완료.md` (프로젝트 루트)
- 완료된 작업을 날짜(`YYYY-MM-DD`) 섹션 아래에 추가
- 생성/수정된 파일 목록, 주요 변경사항 포함
- 기존 내용은 절대 삭제하지 않음 (항상 맨 위에 추가)

### 2. 진행사항.md 업데이트
- 파일 위치: `진행사항.md` (프로젝트 루트)
- 오늘 한 작업 요약 추가
- 앞으로 해야 할 사항 (`[ ]` 체크리스트 형식) 업데이트
- 완료된 항목은 `[x]`로 표시

---

## 프로젝트 개요

- **서비스:** 크루즈 기항지 GPS 오디오 가이드 (WiFi 불필요)
- **배포:** Cloudflare Workers
- **URL:** `https://gps-audio-guide-no-wifi.maibauntourph.workers.dev`
- **스택:** React + Hono + Cloudflare Workers + D1/R2

## 주요 디렉토리

```
client/          React 프론트엔드
server/          Hono 백엔드 (Cloudflare Workers)
video-generator/ Canvas+FFmpeg 영상 자동 생성기
orchestration/   BMAD × LangGraph 파이프라인
docs/            개발 가이드북 v2 (CH01-CH15)
작업완료.md      완료된 작업 히스토리
진행사항.md      진행 중 & 예정 사항
```

## 응답 언어

한국어로 응답한다.
