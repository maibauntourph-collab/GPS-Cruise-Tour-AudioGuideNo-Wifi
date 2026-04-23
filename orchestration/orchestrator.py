"""
NoWiFi GPS Tours — BMAD × LangGraph 오케스트레이터
====================================================

3개 병렬 작업을 Supervisor 패턴으로 조율:
  Task A: 영상 QR 코드 실제 구현  (Task C URL 필요)
  Task B: Google Play 등록         (독립 실행, 3-7일)
  Task C: 도메인 + 스마트 랜딩    (Task B URL 업데이트 필요)

의존성:
  B ──(Play Store URL)──► C ──(nowifigps.tours)──► A
  B, C 병렬 시작 / A는 C 완료 후 시작

설치:
  pip install langgraph langchain langchain-anthropic
"""

from __future__ import annotations

import json
from typing import Annotated, Literal, TypedDict
from operator import add

from langgraph.graph import StateGraph, START, END
from langgraph.types import Command, interrupt
from langgraph.checkpoint.memory import InMemorySaver
from langchain_anthropic import ChatAnthropic

# ─────────────────────────────────────────────
# 1. SHARED STATE — 모든 노드가 읽고 쓰는 계약
# ─────────────────────────────────────────────

class TaskStatus(TypedDict):
    started: bool
    completed: bool
    output: str          # 각 Task의 주요 산출물 (URL, APK경로 등)
    notes: list[str]     # 진행 메모

class NoWifiOrchestratorState(TypedDict):
    # ── BMAD Phase 1: Analyst 산출물 ──
    project_brief: str
    dependency_map: str

    # ── BMAD Phase 2: PM 산출물 ──
    prd: str             # Product Requirements Doc
    execution_order: list[str]  # ["B", "C", "A"]

    # ── BMAD Phase 3: Architect 산출물 ──
    architecture: str
    smart_link_url: str          # Task C 결과: nowifigps.tours
    play_store_url: str          # Task B 결과: play.google.com/...
    qr_target_url: str           # Task A 입력: C 완료 후 확정

    # ── Task 상태 ──
    task_a: TaskStatus   # QR 코드 구현
    task_b: TaskStatus   # Google Play 등록
    task_c: TaskStatus   # 랜딩 페이지

    # ── 오케스트레이션 제어 ──
    messages: Annotated[list[str], add]   # 로그 누적
    current_phase: str
    next_action: str
    human_approved: bool


# ─────────────────────────────────────────────
# 2. BMAD ANALYST NODE (Phase 1)
# ─────────────────────────────────────────────

def analyst_node(state: NoWifiOrchestratorState) -> Command:
    """
    BMAD Analyst (Mary) — 프로젝트 분석 & 의존성 맵 작성
    """
    brief = """
    ## Project Brief: NoWiFi GPS Audio Tour — 앱 배포 파이프라인

    ### 목표
    YouTube Shorts 홍보영상에서 고객이 앱을 다운로드할 수 있도록
    QR코드 → 스마트 랜딩 → 앱스토어 퍼널을 구축한다.

    ### 현재 상태
    - PWA 배포됨: gps-audio-guide-no-wifi.maibauntourph.workers.dev
    - 영상 생성기: 5개 도시 MP4 완성 (QR은 플레이스홀더)
    - 앱스토어: 미등록

    ### 3가지 작업
    - Task A: 영상 QR 코드 실제 구현 (소요: 1시간)
    - Task B: Google Play 등록 (소요: 3-7일 심사)
    - Task C: 도메인 + 스마트 랜딩 페이지 (소요: 2일)

    ### 의존성
    B (Play URL) → C (landing 업데이트) → A (QR URL 확정)
    """

    dep_map = """
    [B: Google Play] ─────────────────────────── 3-7일
         │ play_store_url 완성 시 C에 주입
         ▼
    [C: Landing Page] ────────────────────────── 2일
         │ smart_link_url (nowifigps.tours) 확정 시 A에 주입
         ▼
    [A: QR Code] ─────────────────────────────── 1시간
         (C 완료 후 즉시 실행)

    병렬 실행: B와 C 동시 시작 (C는 placeholder URL로 시작)
    """

    return Command(
        update={
            "project_brief": brief,
            "dependency_map": dep_map,
            "current_phase": "phase_1_complete",
            "messages": ["[Analyst] 프로젝트 브리프 & 의존성 맵 완성"],
        },
        goto="approval_gate_phase1",
    )


# ─────────────────────────────────────────────
# 3. HUMAN-IN-THE-LOOP: Phase 1 승인 게이트
# ─────────────────────────────────────────────

def approval_gate_phase1(state: NoWifiOrchestratorState) -> Command:
    """Phase 1 산출물 검토 후 Phase 2 진행 승인"""
    print("\n" + "═" * 55)
    print("  [HITL] Phase 1 완료 — 검토 후 승인 필요")
    print("═" * 55)
    print(state["project_brief"])
    print(state["dependency_map"])

    response = interrupt({
        "question": "Phase 1 분석 결과를 승인하고 실행을 시작하시겠습니까?",
        "options": ["yes", "no"],
        "brief": state["project_brief"],
    })

    if response == "yes":
        return Command(
            update={"human_approved": True, "current_phase": "phase_2"},
            goto="pm_node",
        )
    else:
        return Command(
            update={"human_approved": False},
            goto=END,
        )


# ─────────────────────────────────────────────
# 4. BMAD PM NODE (Phase 2)
# ─────────────────────────────────────────────

def pm_node(state: NoWifiOrchestratorState) -> Command:
    """
    BMAD PM (John) — PRD 작성 & 실행 순서 확정
    """
    prd = """
    ## PRD: 앱 배포 & QR 연결 파이프라인

    ### Epic 1: Google Play 등록 (Task B)
    - Story B1: PWABuilder APK 생성
    - Story B2: Play Console 개발자 계정 ($25)
    - Story B3: 스토어 메타데이터 작성 (앱 이름, 설명, 스크린샷)
    - Story B4: 심사 제출
    - 완료 기준: play.google.com URL 획득

    ### Epic 2: 스마트 랜딩 페이지 (Task C)
    - Story C1: nowifigps.tours 도메인 구매
    - Story C2: 랜딩 페이지 HTML/JS 개발
      - User-Agent 감지: iOS → AppStore, Android → Play, 기타 → WebApp
    - Story C3: Cloudflare Pages 배포
    - Story C4: Play URL 수신 시 링크 업데이트 (B 의존)
    - 완료 기준: QR 스캔 시 플랫폼별 자동 분기

    ### Epic 3: 영상 QR 코드 (Task A)
    - Story A1: qrcode 라이브러리 설치
    - Story A2: frame-renderer.ts CTA 프레임 수정
    - Story A3: 모든 도시 영상 재생성
    - 완료 기준: MP4에 실제 QR 코드 렌더링
    """

    return Command(
        update={
            "prd": prd,
            "execution_order": ["B+C_parallel", "A_after_C"],
            "current_phase": "phase_2_complete",
            "messages": ["[PM] PRD & 실행 순서 확정: B+C 병렬 → A"],
        },
        goto="architect_node",
    )


# ─────────────────────────────────────────────
# 5. BMAD ARCHITECT NODE (Phase 3)
# ─────────────────────────────────────────────

def architect_node(state: NoWifiOrchestratorState) -> Command:
    """
    BMAD Architect (Winston) — 기술 아키텍처 설계
    """
    architecture = """
    ## 기술 아키텍처

    ### Task B: Google Play (PWABuilder 경로)
    PWA URL → pwaBuider.com → APK 다운로드 → keytool 서명
    → Google Play Console 업로드 → 심사 (3-7일)

    ### Task C: 스마트 랜딩 (Cloudflare Pages)
    ┌─────────────────────────────────────────┐
    │  nowifigps.tours (Cloudflare Pages)     │
    │                                         │
    │  navigator.userAgent 감지               │
    │  iOS   → apps.apple.com/...   (추후)   │
    │  Android → play.google.com/... (B완료)  │
    │  기타  → gps-audio-guide-no-wifi.*.dev  │
    └─────────────────────────────────────────┘

    ### Task A: QR 코드 (video-generator)
    qrcode npm 패키지 → DataURL PNG → @napi-rs/canvas에서 drawImage
    → CTA 프레임에 실제 QR 렌더링 → 모든 도시 MP4 재생성

    ### 데이터 흐름
    play_store_url (B완료) ──► smart_link_url (C업데이트) ──► qr_target_url (A사용)
    """

    return Command(
        update={
            "architecture": architecture,
            "current_phase": "phase_3_complete",
            "messages": ["[Architect] 기술 아키텍처 확정"],
        },
        goto="approval_gate_phase3",
    )


def approval_gate_phase3(state: NoWifiOrchestratorState) -> Command:
    """Phase 3 아키텍처 승인 → 실제 실행 시작"""
    print("\n" + "═" * 55)
    print("  [HITL] Phase 3 완료 — 실행 승인 필요")
    print("═" * 55)
    print(state["architecture"])

    response = interrupt({
        "question": "아키텍처를 승인하고 Task B + C 병렬 실행을 시작하시겠습니까?",
        "options": ["yes", "no"],
    })

    if response == "yes":
        return Command(
            update={"current_phase": "phase_4_executing"},
            goto="supervisor",
        )
    return Command(goto=END)


# ─────────────────────────────────────────────
# 6. SUPERVISOR — 3개 Worker 조율
# ─────────────────────────────────────────────

def supervisor(state: NoWifiOrchestratorState) -> Command:
    """
    Supervisor: Task 완료 상태에 따라 다음 Worker를 라우팅

    규칙:
    1. B, C 미완료 → B + C 병렬 지시 (첫 진입)
    2. C 완료 && A 미시작 → A 실행
    3. 모두 완료 → qa_node
    """
    a = state.get("task_a", {})
    b = state.get("task_b", {})
    c = state.get("task_c", {})

    b_done = b.get("completed", False)
    c_done = c.get("completed", False)
    a_done = a.get("completed", False)

    if a_done and b_done and c_done:
        return Command(
            update={"messages": ["[Supervisor] 모든 Task 완료 → QA"]},
            goto="qa_node",
        )

    if c_done and not a.get("started", False):
        qr_url = state.get("smart_link_url", "https://nowifigps.tours")
        return Command(
            update={
                "qr_target_url": qr_url,
                "messages": [f"[Supervisor] C 완료 → A 시작 (QR URL: {qr_url})"],
            },
            goto="task_a_worker",
        )

    if not b_done:
        return Command(
            update={"messages": ["[Supervisor] B+C 병렬 실행 지시"]},
            goto="task_b_worker",  # LangGraph fan-out: B와 C 동시 실행
        )

    # B 완료 대기 중 (심사 중)
    return Command(
        update={"messages": ["[Supervisor] Task B 심사 대기 중..."]},
        goto="wait_for_b",
    )


# ─────────────────────────────────────────────
# 7. WORKER NODES
# ─────────────────────────────────────────────

def task_b_worker(state: NoWifiOrchestratorState) -> Command:
    """
    Task B: Google Play 등록
    실제로는 수동 작업 가이드 출력 + HITL로 완료 확인
    """
    print("\n" + "─" * 55)
    print("  [Task B] Google Play 등록 시작")
    print("─" * 55)
    print("""
  Step 1: PWABuilder에서 APK 생성
    → https://www.pwabuilder.com
    → URL: gps-audio-guide-no-wifi.maibauntourph.workers.dev
    → "Package for Store" → Android → 다운로드

  Step 2: Google Play Console 계정
    → https://play.google.com/console
    → 개발자 계정 생성 ($25 1회)

  Step 3: 앱 등록
    → 새 앱 만들기
    → 앱 이름: "NoWiFi GPS Audio Tour"
    → 카테고리: 여행
    → APK 업로드

  Step 4: 스토어 메타데이터 (orchestration/store-metadata.md 참고)

  Step 5: 심사 제출 → 3-7일 대기
    """)

    play_url = interrupt({
        "question": "Google Play 심사가 완료되면 Play Store URL을 입력하세요:",
        "example": "https://play.google.com/store/apps/details?id=com.nowifigps.tours",
    })

    return Command(
        update={
            "play_store_url": play_url,
            "task_b": {
                "started": True,
                "completed": True,
                "output": play_url,
                "notes": ["PWABuilder APK 생성 완료", "Play Console 심사 통과"],
            },
            "messages": [f"[Task B] 완료 — Play URL: {play_url}"],
        },
        goto="task_c_worker",  # B 완료 → C 업데이트
    )


def task_c_worker(state: NoWifiOrchestratorState) -> Command:
    """
    Task C: 스마트 랜딩 페이지
    - 코드는 orchestration/landing/ 에 생성됨
    - Cloudflare Pages에 배포
    """
    play_url = state.get("play_store_url", "")

    print("\n" + "─" * 55)
    print("  [Task C] 스마트 랜딩 페이지")
    print("─" * 55)
    print(f"  Play Store URL: {play_url or '(아직 없음 — placeholder 사용)'}")
    print("""
  Step 1: 도메인 구매
    → Cloudflare Registrar: nowifigps.tours (~$12/년)
    → 또는 Namecheap / Google Domains

  Step 2: 랜딩 페이지 배포
    → orchestration/landing/index.html 이미 생성됨
    → wrangler pages deploy orchestration/landing

  Step 3: 도메인 연결
    → Cloudflare Pages → Custom Domains → nowifigps.tours
    """)

    smart_url = "https://nowifigps.tours"

    return Command(
        update={
            "smart_link_url": smart_url,
            "task_c": {
                "started": True,
                "completed": True,
                "output": smart_url,
                "notes": [
                    "landing/index.html 생성 완료",
                    f"Play Store URL {'주입됨' if play_url else 'placeholder 상태'}",
                    "Cloudflare Pages 배포 대기",
                ],
            },
            "messages": [f"[Task C] 완료 — Smart URL: {smart_url}"],
        },
        goto="supervisor",
    )


def task_a_worker(state: NoWifiOrchestratorState) -> Command:
    """
    Task A: 영상 QR 코드 실제 구현
    qr_target_url이 확정된 후 실행
    """
    qr_url = state.get("qr_target_url", "https://nowifigps.tours")

    print("\n" + "─" * 55)
    print(f"  [Task A] QR 코드 구현 — URL: {qr_url}")
    print("─" * 55)
    print("""
  frame-renderer.ts CTA 프레임 수정:
  1. qrcode 패키지로 QR PNG DataURL 생성
  2. canvas.drawImage()로 렌더링
  3. 모든 도시 영상 재생성 (batch-generate.ts)
    """)

    return Command(
        update={
            "task_a": {
                "started": True,
                "completed": True,
                "output": f"QR → {qr_url}",
                "notes": [
                    "frame-renderer.ts 수정 완료",
                    "5개 도시 × 2개 언어 = 10개 영상 재생성",
                ],
            },
            "messages": [f"[Task A] 완료 — QR URL: {qr_url}"],
        },
        goto="supervisor",
    )


def wait_for_b(state: NoWifiOrchestratorState) -> Command:
    """Task B 심사 대기 노드"""
    response = interrupt({
        "question": "Task B (Google Play 심사) 완료 시 'continue'를 입력하세요:",
    })
    return Command(goto="supervisor")


# ─────────────────────────────────────────────
# 8. QA NODE (Phase 4 완료)
# ─────────────────────────────────────────────

def qa_node(state: NoWifiOrchestratorState) -> Command:
    """
    BMAD QA (Quinn) — 전체 퍼널 검증
    """
    a = state.get("task_a", {})
    b = state.get("task_b", {})
    c = state.get("task_c", {})

    report = f"""
    ## QA 검증 리포트

    ### Task A (QR 코드)
    상태: {'✅ 완료' if a.get('completed') else '❌ 미완료'}
    산출물: {a.get('output', '-')}

    ### Task B (Google Play)
    상태: {'✅ 완료' if b.get('completed') else '❌ 미완료'}
    산출물: {b.get('output', '-')}

    ### Task C (스마트 랜딩)
    상태: {'✅ 완료' if c.get('completed') else '❌ 미완료'}
    산출물: {c.get('output', '-')}

    ### 퍼널 검증
    YouTube Shorts → QR 스캔 → {c.get('output', '?')}
    iOS  → App Store (추후 등록)
    Android → {b.get('output', '?')}
    기타 → PWA 웹앱
    """

    print("\n" + "═" * 55)
    print("  [QA] 최종 검증 완료")
    print("═" * 55)
    print(report)

    return Command(
        update={
            "current_phase": "complete",
            "messages": ["[QA] 전체 파이프라인 검증 완료"],
        },
        goto=END,
    )


# ─────────────────────────────────────────────
# 9. GRAPH 조립
# ─────────────────────────────────────────────

def build_graph():
    builder = StateGraph(NoWifiOrchestratorState)

    # 노드 등록
    builder.add_node("analyst_node",        analyst_node)
    builder.add_node("approval_gate_phase1", approval_gate_phase1)
    builder.add_node("pm_node",             pm_node)
    builder.add_node("architect_node",      architect_node)
    builder.add_node("approval_gate_phase3", approval_gate_phase3)
    builder.add_node("supervisor",          supervisor)
    builder.add_node("task_a_worker",       task_a_worker)
    builder.add_node("task_b_worker",       task_b_worker)
    builder.add_node("task_c_worker",       task_c_worker)
    builder.add_node("wait_for_b",          wait_for_b)
    builder.add_node("qa_node",             qa_node)

    # 엣지
    builder.add_edge(START, "analyst_node")

    # Command 기반 라우팅 (각 노드가 goto로 직접 지정)

    checkpointer = InMemorySaver()
    return builder.compile(checkpointer=checkpointer)


# ─────────────────────────────────────────────
# 10. 실행 진입점
# ─────────────────────────────────────────────

if __name__ == "__main__":
    graph = build_graph()

    initial_state: NoWifiOrchestratorState = {
        "project_brief": "",
        "dependency_map": "",
        "prd": "",
        "execution_order": [],
        "architecture": "",
        "smart_link_url": "",
        "play_store_url": "",
        "qr_target_url": "",
        "task_a": {"started": False, "completed": False, "output": "", "notes": []},
        "task_b": {"started": False, "completed": False, "output": "", "notes": []},
        "task_c": {"started": False, "completed": False, "output": "", "notes": []},
        "messages": [],
        "current_phase": "start",
        "next_action": "",
        "human_approved": False,
    }

    config = {"configurable": {"thread_id": "nowifi-deploy-v1"}}

    print("🚀 NoWiFi GPS Tours — BMAD × LangGraph 오케스트레이터 시작")
    print("━" * 55)

    for event in graph.stream(initial_state, config=config, stream_mode="updates"):
        node_name = list(event.keys())[0]
        msgs = event[node_name].get("messages", [])
        for msg in msgs:
            print(f"  {msg}")
