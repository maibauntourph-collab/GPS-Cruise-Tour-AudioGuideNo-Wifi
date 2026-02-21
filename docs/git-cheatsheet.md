# Git 주요 명령어 치트시트 (Git Cheatsheet)

Git은 효율적인 코드 버전 관리를 위한 분산 버전 관리 시스템입니다. 자주 사용하는 주요 명령어들을 정리하였습니다.

---

## 1. 시작하기 (Setup & Init)
새로운 저장소를 설정하거나 사용자 정보를 구성합니다.

- `git init`: 현재 디렉토리를 로컬 Git 저장소로 초기화합니다.
- `git clone <url>`: 원격 저장소를 로컬로 복제합니다.
- `git config --global user.name "Your Name"`: Git에서 사용할 사용자 이름을 설정합니다.
- `git config --global user.email "email@example.com"`: Git에서 사용할 이메일 주소를 설정합니다.

---

## 2. 변경사항 저장하기 (Basic Workflow)
파일을 수정하고 저장소에 기록하는 과정입니다.

- `git status`: 현재 파일의 상태(수정됨, 스테이징됨 등)를 확인합니다.
- `git add <file>`: 특정 파일을 스테이징 영역(Staging Area)에 추가합니다.
- `git add .`: 모든 변경된 파일을 스테이징 영역에 추가합니다.
- `git commit -m "commit message"`: 변경사항을 로컬 저장소에 기록(커밋)합니다.
- `git commit --amend`: 마지막 커밋 메시지를 수정하거나 파일을 추가합니다.

---

## 3. 기록 확인 및 취소 (Inspection & Undo)
커밋 내역을 확인하거나 실수를 되돌립니다.

- `git log`: 커밋 내역을 확인합니다.
- `git diff`: 스테이징되지 않은 변경사항을 비교합니다.
- `git reset HEAD <file>`: 스테이징된 파일을 취소(Unstage)합니다.
- `git checkout -- <file>`: 수정한 파일을 마지막 커밋 상태로 되돌립니다.
- `git revert <commit_id>`: 특정 커밋의 내용을 취소하는 새로운 커밋을 생성합니다.

---

## 4. 브랜치 작업 (Branching)
독립적인 작업 환경을 고립시켜 작업합니다.

- `git branch`: 브랜치 목록을 확인합니다.
- `git branch <branch_name>`: 새로운 브랜치를 생성합니다.
- `git checkout <branch_name>`: 다른 브랜치로 전환합니다.
- `git checkout -b <branch_name>`: 새 브랜치를 생성함과 동시에 전환합니다.
- `git merge <branch_name>`: 현재 브랜치에 다른 브랜치를 병합합니다.
- `git branch -d <branch_name>`: 브랜치를 삭제합니다.

---

## 5. 원격 저장소와 상호작용 (Remote Sync)
원격 서버(GitHub 등)와 데이터를 주고받습니다.

- `git remote add origin <url>`: 원격 저장소를 연결합니다.
- `git remote -v`: 연결된 원격 저장소 목록을 확인합니다.
- `git push origin <branch_name>`: 로컬 커밋을 원격 저장소로 보냅니다.
- `git pull origin <branch_name>`: 원격 저장소의 최신 내용을 가져오고 현재 브랜치에 병합합니다.
- `git fetch origin`: 원격 저장소의 변경사항만 가져오고 병합은 하지 않습니다.

---

## 6. 임시 저장 (Stashing)
작업 중인 내용을 잠시 보관합니다.

- `git stash`: 현재의 변경사항을 임시로 저장하고 워킹 디렉토리를 깨끗하게 만듭니다.
- `git stash list`: 임시 저장된 목록을 확인합니다.
- `git stash pop`: 가장 최근에 저장한 내용을 복원하고 목록에서 삭제합니다.
- `git stash apply`: 저장된 내용을 복원하되 목록에는 남겨둡니다.

---

## 유용한 팁
- `.gitignore`: Git이 추적하지 않아야 할 파일이나 폴더를 명시하는 설정 파일입니다.
- `git log --oneline --graph --all`: 커밋 내역을 한 줄씩 그래프 형태로 예쁘게 보여줍니다.
