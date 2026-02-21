---
description: 에이전트 스킬 업데이트 후 문서 동기화 워크플로우
---

에이전트의 스킬(`.agent/skills/*/PROMPT.md`)이 변경되었을 때, 이를 공개 문서 폴더(`./docs/agent_prompt_*.md`)와 최신 상태로 유지하기 위한 절차입니다.

1. 에이전트 스킬 파일(`PROMPT.md` 또는 `SKILL.md`)을 수정합니다.
2. 수정이 완료되면 아래 명령어를 실행하여 공개 문서를 동기화합니다.

// turbo
```powershell
powershell.exe -ExecutionPolicy Bypass -File "e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\scripts\sync-agent-prompts.ps1"
```

3. `git add .`, `git commit -m "[Agent] Update skill and sync docs"`, `git push origin main`을 수행하여 변경 사항을 서버에 반영합니다.
