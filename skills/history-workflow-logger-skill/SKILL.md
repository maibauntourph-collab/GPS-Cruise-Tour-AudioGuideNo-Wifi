---
name: history-workflow-logger-skill
description: |
  모든 작업을 history-workflow-book.md에 자동으로 append하는 로거 스킬.
  date-time, order, plan, task, result, next 형식으로 기록하며
  기존 히스토리를 절대 삭제하지 않습니다. 책 출간을 위한 작업 추적 시스템.

  다음 상황에서 반드시 이 스킬을 사용하세요:
  - 모든 작업 시작 전 기록 추가
  - 모든 작업 완료 후 결과 업데이트
  - 사용자가 히스토리 조회 요청 시
  - history-workflow-book.md 관련 작업 시
  - 작업 진행상황 보고 시 (1분 간격)
  - 어떤 작업이든 시작할 때 자동으로 이 스킬을 먼저 실행하세요
---

# History Workflow Logger Skill
> 교수님이 학생에게 설명하듯: 이 스킬은 모든 개발 작업을
> 자동으로 기록하여 나중에 책으로 출판할 수 있는 완전한 작업 일지를 만듭니다.

## 📚 개요

이 스킬의 목적은 GPS 크루즈 투어 오디오가이드 프로젝트의
**모든 개발 과정을 기록**하여 기술 서적 출판의 기초 자료로 활용하는 것입니다.

**핵심 원칙:**
1. 기존 기록은 절대 삭제하지 않는다 (append-only)
2. 모든 작업의 시작과 끝을 기록한다
3. 날짜와 시간을 항상 포함한다
4. 코드 변경사항과 적요(요약)를 함께 기록한다

---

## 📋 기록 형식 (반드시 이 형식 준수)

```markdown
---
## 작업 기록 #[순번] | [작업 제목]
- **date-time**: [YYYY-MM-DD HH:MM:SS KST]  <!-- 한국 표준시 -->
- **order**: [사용자 입력 명령 또는 요청 내용]
- **plan**: [실행 계획 - 무엇을 어떻게 할 것인가]
- **task**: [구체적 실행 내용 - 파일명, 코드, 명령어]
- **result**: [실행 결과 - 성공/실패, 주요 출력, 변경사항]
- **next**: [다음 권장 작업 또는 후속 조치]

### 코드 변경 적요 (해당 시)
| 파일 | 변경 유형 | 적요 |
|------|---------|------|
| `src/index.ts` | 수정 | Hono 라우터에 /api/tours 엔드포인트 추가 |
| `src/db/schema.ts` | 추가 | landmarks 테이블 스키마 정의 |

### 에이전트/도구 사용 현황
- 🤖 에이전트: [사용한 에이전트명]
- ⚙️  MCP: [사용한 MCP 또는 없음]
- 🎯 스킬: [사용한 스킬 또는 없음]
- 💰 토큰: 입력 XXX | 출력 XXX | 총 XXX
---
```

---

## 🔄 자동 기록 프로세스

### 작업 시작 시 (Before)
```typescript
// 의사코드: 작업 시작 전 항상 실행
async function logWorkStart(workTitle: string, order: string, plan: string) {
  const entry = `
---
## 작업 기록 #${getNextEntryNumber()} | ${workTitle}
- **date-time**: ${getCurrentKSTDateTime()}
- **order**: ${order}
- **plan**: ${plan}
- **task**: [진행중...]
- **result**: [대기중...]
- **next**: [작업 완료 후 결정]
---
`;
  // history-workflow-book.md 파일 끝에 추가 (append)
  await appendToHistoryBook(entry);
}
```

### 작업 완료 시 (After)
```typescript
// 의사코드: 작업 완료 후 기록 업데이트
async function logWorkComplete(
  entryNumber: number,
  task: string,        // 실제 수행한 작업
  result: string,      // 결과
  next: string,        // 다음 작업
  codeChanges: CodeChange[]  // 코드 변경 목록
) {
  // 기존 항목을 찾아서 업데이트 (삭제 없이 내용만 수정)
  await updateHistoryEntry(entryNumber, { task, result, next, codeChanges });
}
```

---

## 📂 history-workflow-book.md 파일 구조

```markdown
# GPS 크루즈 투어 오디오가이드 - 개발 작업 일지
> 이 문서는 프로젝트 개발 과정을 기록하며 기술 서적 출판을 목적으로 합니다.
> 모든 기록은 자동으로 추가되며 기존 내용은 절대 삭제되지 않습니다.

## 프로젝트 정보
- **프로젝트명**: GPS Cruise Tour AudioGuide (No Wifi)
- **기술 스택**: React Native + Hono + Cloudflare Workers + NeonDB
- **시작일**: 2024-01-01
- **목표**: WiFi 없는 환경에서 GPS 기반 오디오 투어 가이드

---
## 작업 기록 #1 | 프로젝트 초기 설정
...

---
## 작업 기록 #2 | DB 스키마 설계
...
```

---

## ⏱️ 1분 진행상황 보고 형식

작업이 길어질 경우 매 1분마다 아래 형식으로 보고합니다:

```markdown
## ⏱️ 진행상황 보고 [HH:MM:SS KST]

**현재 작업**: [진행 중인 작업명]
**진행률**: [X/Y 단계] ████████░░ 80%

| 단계 | 상태 | 소요시간 |
|------|------|---------|
| ✅ DB 스키마 설계 | 완료 | 2분 |
| 🔄 API 라우터 구현 | 진행중 | 3분 |
| ⏳ 테스트 코드 작성 | 대기 | - |
| ⏳ 배포 | 대기 | - |

**예상 완료**: 약 X분 후
**토큰 누적**: 입력 XXX | 출력 XXX
```

---

## 🔧 history-workflow-book.md 관리 함수

```typescript
// scripts/history-logger.ts - 히스토리 로거 유틸리티
// 학생 설명: 이 파일이 히스토리 기록을 관리하는 핵심 유틸리티입니다

import * as fs from 'fs';
import * as path from 'path';

const HISTORY_FILE = path.join(process.cwd(), 'history-workflow-book.md');

/**
 * 한국 표준시(KST)로 현재 날짜+시간 반환
 * UTC+9 적용
 */
function getCurrentKSTDateTime(): string {
  const now = new Date();
  // toLocaleString으로 한국 시간대 적용
  return now.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\. /g, '-').replace('.', '');
}

/**
 * 히스토리 파일에서 다음 항목 번호 계산
 * 기존 파일의 마지막 #번호 + 1
 */
function getNextEntryNumber(): number {
  if (!fs.existsSync(HISTORY_FILE)) return 1;

  const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
  const matches = content.match(/## 작업 기록 #(\d+)/g);

  if (!matches || matches.length === 0) return 1;

  // 가장 큰 번호 찾기
  const numbers = matches.map(m => parseInt(m.match(/\d+/)![0]));
  return Math.max(...numbers) + 1;
}

/**
 * history-workflow-book.md에 새 항목 추가
 * 중요: 기존 내용은 절대 덮어쓰지 않고 끝에 추가(append)만 합니다
 *
 * @param entry - 추가할 마크다운 텍스트
 */
export function appendToHistory(entry: string): void {
  // 파일이 없으면 헤더와 함께 생성
  if (!fs.existsSync(HISTORY_FILE)) {
    const header = `# GPS 크루즈 투어 오디오가이드 - 개발 작업 일지
> 이 문서는 프로젝트 개발 과정을 기록합니다.
> **규칙**: 기존 내용은 절대 삭제하지 않음 (append-only)

`;
    fs.writeFileSync(HISTORY_FILE, header, 'utf-8');
  }

  // 파일 끝에 새 항목 추가
  // 'a' 플래그 = append 모드 (기존 내용 유지)
  fs.appendFileSync(HISTORY_FILE, '\n' + entry, 'utf-8');
}

/**
 * 작업 시작 기록
 */
export function logStart(title: string, order: string, plan: string): number {
  const entryNum = getNextEntryNumber();
  const entry = `
---
## 작업 기록 #${entryNum} | ${title}
- **date-time**: ${getCurrentKSTDateTime()}
- **order**: ${order}
- **plan**: ${plan}
- **task**: [진행중...]
- **result**: [진행중...]
- **next**: [작업 완료 후 결정]
`;
  appendToHistory(entry);
  return entryNum;
}

/**
 * 작업 완료 기록 업데이트
 * 주의: 이 함수는 해당 항목의 task/result/next 부분만 업데이트합니다
 */
export function logComplete(
  entryNum: number,
  task: string,
  result: string,
  next: string
): void {
  const content = fs.readFileSync(HISTORY_FILE, 'utf-8');

  // 해당 항목 번호의 [진행중...] 텍스트를 실제 내용으로 교체
  const updatedContent = content
    .replace(
      new RegExp(`(## 작업 기록 #${entryNum}[\\s\\S]*?- \\*\\*task\\*\\*: )\\[진행중\\.\\.\\.\\]`),
      `$1${task}`
    )
    .replace(
      new RegExp(`(## 작업 기록 #${entryNum}[\\s\\S]*?- \\*\\*result\\*\\*: )\\[진행중\\.\\.\\.\\]`),
      `$1${result}`
    )
    .replace(
      new RegExp(`(## 작업 기록 #${entryNum}[\\s\\S]*?- \\*\\*next\\*\\*: )\\[작업 완료 후 결정\\]`),
      `$1${next}`
    );

  // 업데이트된 내용 저장
  fs.writeFileSync(HISTORY_FILE, updatedContent, 'utf-8');
}
```

---

## 📊 히스토리 통계 조회

```typescript
/**
 * 히스토리 통계 요약 생성
 * 얼마나 많은 작업을 했는지 한눈에 확인
 */
export function getHistoryStats(): string {
  if (!fs.existsSync(HISTORY_FILE)) {
    return '히스토리 파일이 아직 없습니다.';
  }

  const content = fs.readFileSync(HISTORY_FILE, 'utf-8');
  const entries = content.match(/## 작업 기록 #\d+/g) || [];

  return `
📚 히스토리 통계
- 총 작업 기록: ${entries.length}개
- 파일 크기: ${(fs.statSync(HISTORY_FILE).size / 1024).toFixed(1)} KB
- 마지막 수정: ${fs.statSync(HISTORY_FILE).mtime.toLocaleString('ko-KR')}
`;
}
```

---

## 🎯 자동 트리거 조건

이 스킬은 다음 상황에서 **자동으로** 활성화됩니다:

1. **모든 작업 시작 전**: 어떤 코드 수정이나 명령 실행 전 기록
2. **단축 명령어 실행 시**: dev, dep, add, com, rem, pus
3. **에이전트 작업 완료 시**: server_park, dodari 등의 작업 결과 기록
4. **에러 발생 시**: 에러 내용과 해결 방법 기록
5. **MCP 도구 사용 시**: 어떤 MCP를 사용했는지 기록
