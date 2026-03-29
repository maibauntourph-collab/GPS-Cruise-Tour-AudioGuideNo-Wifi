/**
 * [Automation Doctor 2026-03-28] 🛡️ AI Sales Secretary Engine (LangGraph Modern v0.2)
 * 
 * 영업 사원들을 위한 '인공지능 비서' 엔진입니다.
 * 랑그래프(LangGraph)의 최신 Annotation 시스템을 사용하여 상담 데이터를 분석합니다.
 */
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { db } from "../../db";
import { leads, appointments } from "../../../shared/schema";
import { eq, and } from "drizzle-orm";

// 1. 상태(State) 정의: Annotation 시스템 사용 (Type-safe & Reducer 지원)
const CRMStateAnnotation = Annotation.Root({
    leadId: Annotation<string>(),
    agentId: Annotation<string>(),
    rawText: Annotation<string>(),
    analysis: Annotation<any>(),
    documentation: Annotation<any>(),
    nextSteps: Annotation<string[]>({
        reducer: (a, b) => (a || []).concat(b || []),
        default: () => [],
    }),
});

type CRMState = typeof CRMStateAnnotation.State;

// 2. 노드(Node) 구현
const analystNode = async (state: CRMState) => {
    console.log(`[Analyst] ${state.leadId} 고객 상담 분석 중...`);

    // 시뮬레이션: 실제로는 ChatOpenAI 등을 호출
    const analysis = {
        need: "상조 포인트 연동 및 오디오 가이드 도입",
        level: "L2 Potential",
        urgency: "High"
    };

    return { analysis };
};

const secretaryNode = async (state: CRMState) => {
    console.log("[Secretary] 문서화 및 알림 생성 중...");

    const report = `### [AI 미팅 리포트]\n- 필요사항: ${state.analysis?.need}\n- 단계: ${state.analysis?.level}`;
    const slack = `🚨 신규 문의 분석 완료: ${state.leadId}`;

    return {
        documentation: { notionReport: report, slackMessage: slack }
    };
};

const schedulerNode = async (state: CRMState) => {
    console.log("[Scheduler] 일정 확인 중...");
    return {
        nextSteps: ["수요일 오전 10시 미팅 희망"]
    };
};

// 3. 그래프 구성
const workflow = new StateGraph(CRMStateAnnotation)
    .addNode("analyst", analystNode)
    .addNode("secretary", secretaryNode)
    .addNode("scheduler", schedulerNode)
    .addEdge(START, "analyst")
    .addEdge("analyst", "secretary")
    .addEdge("secretary", "scheduler")
    .addEdge("scheduler", END);

export const salesSecretary = workflow.compile();

/**
 * [Automation Doctor] 실행 함수
 */
export async function runSalesAutomation(leadId: string, agentId: string, text: string) {
    try {
        const result = await salesSecretary.invoke({
            leadId,
            agentId,
            rawText: text,
            nextSteps: []
        });

        // 최종 결과 DB 업데이트 (kakaoSyncData 필드)
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
    } catch (error) {
        console.error("LangGraph Engine Error:", error);
        throw error;
    }
}
