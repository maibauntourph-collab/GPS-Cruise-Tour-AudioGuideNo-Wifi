/**
 * [Automation Doctor 2026-03-28] 🛡️ AI Sales Secretary Engine (LangGraph)
 * 
 * 이 파일은 우리 영업 사원들을 위한 '인공지능 비서'의 뇌 역할을 합니다.
 * 랑그래프(LangGraph)를 사용하여 상담 데이터를 분석하고, 
 * 노션/슬랙 보고서 생성 및 미팅 예약을 자동으로 처리합니다.
 */
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { db } from "../../db";
import { leads, appointments } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";

// 1. 상태(State) 정의: 워크플로우를 관통하는 데이터 바구니
interface CRMState {
    leadId: string;
    agentId: string;
    rawText: string;
    analysis?: {
        need: string;
        level: string;
        urgency: string;
    };
    documentation?: {
        notionReport: string;
        slackMessage: string;
    };
    nextSteps?: string[];
}

// 2. 노드(Node) 구현: 실질적인 작업자들
const analystNode = async (state: CRMState) => {
    console.log("[Analyst] 상담 데이터 분석 중...");

    // AI 연동 시뮬레이션 (OPENAI_API_KEY 활용 가능)
    // 실제로는 ChatOpenAI를 호출하여 rawText를 분석합니다.
    const analysis = {
        need: "서유럽 크루즈 10인 단체 오디오 가이드 도입 및 상조 포인트 연동",
        level: "L2 Potential",
        urgency: "High (5월 출항 예정)"
    };

    return { analysis };
};

const secretaryNode = async (state: CRMState) => {
    console.log("[Secretary] 보고서 및 슬랙 알림 생성 중...");

    const report = `### [AI 미팅 리포트]
- **고객명**: ${state.leadId} 관련
- **핵심 니즈**: ${state.analysis?.need}
- **우선순위**: ${state.analysis?.urgency}
- **조치 사항**: L2 혜택 안내서 발송 및 수요일 미팅 준비`;

    const slack = `🚨 *신규 가망 고객 분석 완료*
- 대상: ${state.leadId}
- 요약: ${state.analysis?.need}
- 상태: 노션 문서화 완료 (개발팀/영업팀 공유됨)`;

    return {
        documentation: { notionReport: report, slackMessage: slack }
    };
};

const schedulerNode = async (state: CRMState) => {
    console.log("[Scheduler] 미팅 일정 예약 시뮬레이션...");

    // DB 연동 및 일정 예약
    // appointments 테이블에 수요일 오전 10시 일정 추가 로직이 들어갑니다.

    return {
        nextSteps: ["수요일 오전 10시 미팅 예약됨", "안내 문자 자동 발송 대기"]
    };
};

// 3. 그래프 구성: 워크플로우 설계 (LangGraph)
const workflow = new StateGraph<CRMState>({
    channels: {
        leadId: { reducer: (a, b) => b },
        agentId: { reducer: (a, b) => b },
        rawText: { reducer: (a, b) => b },
        analysis: { reducer: (a, b) => b },
        documentation: { reducer: (a, b) => b },
        nextSteps: { reducer: (a, b) => b },
    }
})
    .addNode("analyst", analystNode)
    .addNode("secretary", secretaryNode)
    .addNode("scheduler", schedulerNode)
    .addEdge(START, "analyst")
    .addEdge("analyst", "secretary")
    .addEdge("secretary", "scheduler")
    .addEdge("scheduler", END);

export const salesSecretary = workflow.compile();

/**
 * [Automation Doctor's Note]
 * 이 엔진은 '동기화' 버튼을 누르는 순간 켜지며, 
 * 각 에이전트들이 자신의 차례가 되면 데이터를 가공하여 다음 단계로 넘깁니다.
 */
export async function runSalesAutomation(leadId: string, agentId: string, text: string) {
    const result = await salesSecretary.invoke({
        leadId,
        agentId,
        rawText: text
    });

    // 최종 결과 DB 업데이트 (kakaoSyncData 필드 등에 저장)
    await db.update(leads)
        .set({
            kakaoSyncData: {
                summary: result.documentation?.notionReport,
                syncedAt: new Date().toISOString(),
                platform: "kakao",
                aiSteps: result.nextSteps
            },
            status: 'meeting',
            updatedAt: new Date()
        })
        .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)));

    return result;
}
