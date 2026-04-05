import { useState } from "react";
import AdminLayout from "./AdminLayout";

const AGENTS = [
  { n:"dodari", i:"🎯", r:"PM / 전체 조율", g:"Graph #3" },
  { n:"server_park", i:"🛠️", r:"백엔드 / DB", g:"API 저장" },
  { n:"designer_kim", i:"🎨", r:"UI / 사진", g:"Graph #1" },
  { n:"marketer_song", i:"📝", r:"나레이션", g:"Graph #2" },
  { n:"query_master", i:"🗄️", r:"DB 쿼리", g:"중복검사" },
  { n:"automation_doctor", i:"⚙️", r:"자동화", g:"Graph #4" },
];

const GRAPHS: Record<string, any> = {
  photo: {
    title: "Graph #1: 사진 관리",
    agent: "designer_kim",
    steps: [
      { t:"s", l:"START" },
      { t:"a" },
      { t:"n", l:"검색 노드\nGoogle Maps / Pexels\ndesigner_kim" },
      { t:"a" },
      { t:"n", l:"미리보기 노드\n6장씩 표시" },
      { t:"a" },
      { t:"h", l:"👤 Human-in-the-loop\nY / N / 소스변경" },
      { t:"a" },
      { t:"d", l:"DB 저장\nlandmarks.photos" },
      { t:"a" },
      { t:"e", l:"END" },
    ]
  },
  narration: {
    title: "Graph #2: 나레이션 생성",
    agent: "marketer_song",
    steps: [
      { t:"s", l:"START" },
      { t:"a" },
      { t:"n", l:"AI 계정 선택\nautomation_doctor" },
      { t:"a" },
      { t:"p", l:"⚡ 병렬 생성\nEN + KO + JA\nmarketer_song" },
      { t:"a" },
      { t:"h", l:"👤 Human-in-the-loop\n검토 / 수정 / 승인" },
      { t:"a" },
      { t:"n", l:"TTS 변환\nMP3 생성\nserver_park" },
      { t:"a" },
      { t:"d", l:"landmark_audio 저장\nquery_master" },
      { t:"a" },
      { t:"e", l:"END" },
    ]
  },
  recommend: {
    title: "Graph #3: AI 추천 관광지",
    agent: "dodari",
    steps: [
      { t:"s", l:"START" },
      { t:"a" },
      { t:"n", l:"AI 계정 선택\n토큰 여유 확인" },
      { t:"a" },
      { t:"p", l:"⚡ 카테고리 병렬 생성\n🗿 🍽️ 🎯 🎁 동시\ndodari" },
      { t:"a" },
      { t:"n", l:"중복 검사\nquery_master" },
      { t:"a" },
      { t:"h", l:"👤 항목별 승인\n✅ / ✏️ / ❌" },
      { t:"a" },
      { t:"d", l:"recommend_places 저장\nstatus=approved" },
      { t:"a" },
      { t:"e", l:"END" },
    ]
  },
  rotation: {
    title: "Graph #4: 키 자동 로테이션",
    agent: "automation_doctor",
    steps: [
      { t:"s", l:"AI 요청 트리거" },
      { t:"a" },
      { t:"n", l:"토큰 여유 확인\nusage vs limit\nautomation_doctor" },
      { t:"b", opts:["여유있음 → 유지", "초과 → 다음 계정"] },
      { t:"a" },
      { t:"n", l:"전환 방식 적용\nmanual / auto / round_robin" },
      { t:"a" },
      { t:"d", l:"usage_count +N\nlast_used_at 업데이트" },
      { t:"a" },
      { t:"e", l:"결과 반환" },
    ]
  },
};

function NodeBox({ step }: { step: any }) {
  if (step.t === "a") return <div className="text-center text-indigo-400 text-lg leading-none my-1">↓</div>;
  if (step.t === "b") return (
    <div className="flex gap-2 justify-center my-2">
      {step.opts.map((o: string, i: number) => (
        <div key={i} className="bg-[#1e2235] border border-dashed border-indigo-500 rounded-md px-3 py-1.5 text-[11px] text-indigo-300">{o}</div>
      ))}
    </div>
  );
  const styles: Record<string, string> = {
    s: "bg-indigo-500 text-white border-none",
    e: "bg-[#374151] text-slate-400 border-none",
    h: "bg-[#1c1917] border border-amber-600 text-amber-400",
    d: "bg-[#0c1a0e] border border-emerald-700 text-emerald-400",
    n: "bg-[#1e1b4b] border border-indigo-600 text-indigo-300",
    p: "bg-[#1e1b4b] border-2 border-indigo-500 text-violet-300",
  };
  return (
    <div className={`rounded-lg px-5 py-2.5 text-xs text-center whitespace-pre-line leading-relaxed min-w-[200px] mx-auto ${styles[step.t]}`}>
      {step.l}
    </div>
  );
}

export default function WorkflowView() {
  const [activeGraph, setActiveGraph] = useState("photo");
  const g = GRAPHS[activeGraph];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">🧭 BMAD + LangGraph 워크플로우</h1>
          <p className="text-xs text-slate-500 mt-1">에이전트 역할 × 상태 그래프 실행 구조</p>
        </div>

        {/* BMAD 팀 */}
        <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4 mb-4">
          <div className="text-sm font-semibold mb-3">🤖 BMAD 에이전트 팀</div>
          <div className="grid grid-cols-6 gap-2">
            {AGENTS.map(a => (
              <div key={a.n} className="bg-[#0f1117] rounded-lg p-2.5 text-center">
                <div className="text-xl">{a.i}</div>
                <div className="text-[10px] font-semibold mt-1">{a.n}</div>
                <div className="text-[9px] text-slate-500">{a.r}</div>
                <div className="text-[9px] text-indigo-400">{a.g}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 그래프 탭 */}
        <div className="flex gap-2 mb-4">
          {Object.entries(GRAPHS).map(([k, v]) => (
            <button key={k} onClick={() => setActiveGraph(k)}
              className={`text-xs px-3 py-1.5 rounded-md border-none ${activeGraph === k ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400 hover:bg-[#363b5e]"}`}>
              {k === "photo" ? "#1 사진" : k === "narration" ? "#2 나레이션" : k === "recommend" ? "#3 AI 추천" : "#4 키 로테이션"}
            </button>
          ))}
        </div>

        <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="text-sm font-semibold">{g.title}</div>
            <span className="text-xs bg-[#1e1b4b] text-indigo-300 px-3 py-0.5 rounded-full border border-indigo-700">주담당: {g.agent}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {g.steps.map((step: any, i: number) => <NodeBox key={i} step={step} />)}
          </div>

          {/* 범례 */}
          <div className="flex gap-5 justify-center mt-6 flex-wrap">
            {[
              { cls:"bg-[#1e1b4b] border border-indigo-600 text-indigo-300", l:"LangGraph 노드" },
              { cls:"bg-[#1c1917] border border-amber-600 text-amber-400", l:"Human-in-the-loop" },
              { cls:"bg-[#0c1a0e] border border-emerald-700 text-emerald-400", l:"DB 저장" },
              { cls:"bg-[#1e1b4b] border-2 border-indigo-500 text-violet-300", l:"병렬 실행" },
            ].map(item => (
              <div key={item.l} className="flex items-center gap-2">
                <div className={`rounded px-2 py-0.5 text-[10px] ${item.cls}`}>노드</div>
                <span className="text-xs text-slate-500">{item.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
