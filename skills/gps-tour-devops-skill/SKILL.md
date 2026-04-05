---
name: gps-tour-devops-skill
description: |
  GPS 크루즈 투어 오디오가이드 프로젝트의 개발 워크플로우 자동화 스킬.
  단축 명령어(dev, dep, add, com, rem, pus)를 인식하고 즉시 실행하며,
  모든 작업을 history-workflow-book.md에 자동 기록합니다.

  다음 상황에서 반드시 이 스킬을 사용하세요:
  - 사용자가 "dev", "dep", "add", "com", "rem", "pus" 중 하나만 입력할 때
  - npm run dev / npm run build / npm run deploy 실행 요청
  - git 관련 작업 (add, commit, push, remote) 요청
  - 배포 작업 (Cloudflare Workers, Vercel) 요청
  - 10분마다 자동 git push 작업
---

# GPS Tour DevOps Skill
> 교수님이 학생에게 설명하듯: 이 스킬은 개발 단축 명령어를 자동으로 처리하고
> 모든 작업 히스토리를 기록하는 워크플로우 자동화 도구입니다.

## 📋 단축 명령어 매핑표

| 명령어 | 실행 명령 | 설명 |
|--------|---------|------|
| `dev`  | `npm run dev` | 개발 서버 시작 + 웹앱 즉시 실행 |
| `dep`  | `npm run build && npm run deploy` | 빌드 후 배포 (Cloudflare Workers) |
| `add`  | `git add .` | 모든 변경사항 스테이징 |
| `com`  | `git commit -m "..."` | 커밋 메시지 입력 대기 후 커밋 |
| `rem`  | `git remote -v` | 원격 저장소 목록 확인 |
| `pus`  | `git add . && git commit -m "..." && git push origin main` | 전체 push 플로우 |
| `@에이` | 추천 에이전트/프롬프트/MCP/스킬 표시 | AI 추천 시스템 |

---

## 🚀 명령어 실행 프로세스

### STEP 1: 명령어 감지
사용자 입력이 위 단축 명령어 중 하나와 정확히 일치하는지 확인합니다.
대소문자 구분 없이 감지합니다 (DEV, Dev, dev 모두 동일 처리).

### STEP 2: 실행 전 history-workflow-book.md 업데이트
**반드시** 명령 실행 전에 아래 형식으로 기록을 추가합니다:

```markdown
---
## 작업 기록 #[순번]
- **date-time**: [YYYY-MM-DD HH:MM:SS KST]
- **order**: [명령어]
- **plan**: [실행 예정 작업]
- **task**: [구체적 명령]
- **result**: [진행중...]
- **next**: [다음 예정 작업]
---
```

### STEP 3: 명령 실행

#### `dev` 명령 실행 로직
```bash
# 개발 서버 시작 - 프로젝트 루트에서 실행
npm run dev

# 실행 후: 브라우저 또는 웹앱 URL을 사용자에게 안내
# 예: http://localhost:5173 또는 http://localhost:3000
```

#### `dep` 명령 실행 로직
```bash
# 1단계: 프로덕션 빌드 생성
npm run build

# 2단계: Cloudflare Workers로 배포
npm run deploy
# 또는 wrangler deploy (wrangler.toml 설정 기반)
```

#### `add` 명령 실행 로직
```bash
# 현재 디렉토리의 모든 변경사항을 스테이징 영역에 추가
git add .

# 스테이징된 파일 목록을 사용자에게 표시
git status --short
```

#### `com` 명령 실행 로직
```bash
# 1단계: 현재 스테이징 상태 확인
git status

# 2단계: 사용자에게 커밋 메시지 입력 요청
# "커밋 메시지를 입력해 주세요:" 라고 대기

# 3단계: 입력받은 메시지로 커밋
git commit -m "[사용자 입력 메시지]"
```

#### `rem` 명령 실행 로직
```bash
# 원격 저장소 URL 및 이름 확인
git remote -v
```

#### `pus` 명령 실행 로직
```bash
# 원스톱 push 플로우 - 스테이징 → 커밋 → 푸시
git add .

# 자동 커밋 메시지 생성 (날짜+시간 기반)
COMMIT_MSG="auto: update $(date '+%Y-%m-%d %H:%M')"
git commit -m "$COMMIT_MSG"

# main 브랜치로 푸시
git push origin main
```

### STEP 4: 결과 기록
명령 실행 완료 후 history-workflow-book.md의 해당 기록을 업데이트합니다:
- `result`: 실행 결과 (성공/실패, 출력 내용 요약)
- `next`: 다음 권장 작업

---

## 📅 10분 자동 Git Push 스케줄

10분마다 자동으로 아래 작업을 수행합니다:
```bash
# 변경사항 확인
git status --short

# 변경사항이 있으면 자동 커밋 및 푸시
git add .
git commit -m "auto-save: $(date '+%Y-%m-%d %H:%M KST')"
git push origin main
```

이 스킬은 `schedule` 스킬과 연동하여 cron 작업으로 등록할 수 있습니다.

---

## 🔧 에러 처리

### 자주 발생하는 에러와 해결책

**에러**: `npm run dev` 포트 충돌
```bash
# 해결: 기존 프로세스 종료
npx kill-port 5173
npx kill-port 3000
npm run dev
```

**에러**: git push 인증 실패
```bash
# 해결: SSH 키 또는 토큰 확인
git remote set-url origin https://[TOKEN]@github.com/[user]/[repo].git
```

**에러**: `npm run build` 실패
```bash
# TypeScript 에러 확인
npx tsc --noEmit 2>&1 | head -20
# 빌드 로그 확인
cat build.log | tail -30
```

---

## 📊 토큰 사용량 보고 형식

명령 실행 후 반드시 아래 형식으로 보고합니다:
```
🤖 에이전트: gps-tour-devops-skill
💰 토큰 사용: 입력 XXX | 출력 XXX | 총 XXX
⚙️  MCP 사용: [사용한 MCP 목록 또는 없음]
⏱️  실행 시간: X.Xs
```

---

## 🎯 @에이 명령 처리

`@에이` 입력 시 다음을 표시합니다:

### 추천 에이전트
현재 작업 컨텍스트에 따라 적합한 에이전트를 추천합니다:
- **server_park**: 백엔드 API, DB 작업 → claude-sonnet-4-6 사용
- **dodari**: 전체 프로젝트 조율 및 기획
- **designer_kim**: UI/UX, React Native 화면 설계
- **marketer_song**: SEO, 마케팅 전략

### 추천 프롬프트 (프로그래밍 언어 중심)
```
// TypeScript + Hono 패턴
"Hono를 사용하여 /api/tours 엔드포인트를 생성하고
NeonDB에 연결하는 TypeScript 코드를 작성해줘.
Cloudflare Workers 환경에서 동작하도록 최적화해줘."

// React Native + API 연동
"React Native에서 Hono API를 fetch()로 호출하는
커스텀 훅 useTours()를 TypeScript로 작성해줘.
에러 처리와 로딩 상태를 포함해줘."
```

### 추천 MCP
- `mcp__f4d5c65c__deploy_to_vercel`: 배포 자동화
- `mcp__f4d5c65c__get_runtime_logs`: 런타임 에러 모니터링
