# Gemini 사진 리뉴얼 및 모델 문서 고도화 계획

## 개요
기존 DALL-E 기반의 사진 리뉴얼 기능이 한도 초과(400 Billing limit)로 실패함에 따라, 이를 Gemini API(구체적으로는 이미지 생성 지원 모델)로 전환하여 재구현합니다. 또한 `gemini_models_debug.json` 파일에 학생들도 이해하기 쉬운 상세한 한글 적요를 추가하여 교육적 가치를 높입니다.

## 주요 변경 사항

### 1. 모델 문서 고도화 (`gemini_models_debug.json`)
- 모든 주요 Gemini 모델에 `notes_ko` 필드를 추가하여 한글 설명을 보강합니다.
- 교수님이 학생에게 설명하는 친절한 톤을 유지합니다.

### 2. 사진 리뉴얼 기능 Gemini 전환 (`server/scripts/enhance-photos.ts`)
- `OpenAI` 의존성을 제거하고 `@google/generative-ai`를 도입합니다.
- `gemini-2.0-flash-exp-image-generation` 또는 가용한 이미지 생성 모델을 사용하도록 로직을 수정합니다.
- Gemini의 응답 형식에 맞춰 이미지 다운로드 및 저장 로직을 조정합니다.

## 작업 순서
1. `gemini_models_debug.json` 나머지 모델들에 대한 한글 적요 추가.
2. `server/scripts/enhance-photos.ts` 파일을 복사하여 `server/scripts/enhance-photos-gemini-20260221.ts` 생성 및 수정.
3. 새 스크립트 실행 및 결과 확인.
4. `task.md` 업데이트.

## 검증 계획
- `npm run build`를 통해 코드 무결성 확인.
- 스크립트 실행 로그를 통해 이미지 생성 및 DB 업데이트 여부 확인.
