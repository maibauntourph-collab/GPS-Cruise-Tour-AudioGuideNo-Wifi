import { useState } from "react";
import AdminLayout from "./AdminLayout";

const AI_ACCOUNTS = [
  { id:1, engine:"claude", emoji:"🟣", name:"Claude", accounts:[
    { id:1, email:"jitne@gmail.com", model:"claude-3-5-sonnet", status:"active", usage:12400, limit:30000, memo:"메인 계정" },
    { id:2, email:"work@company.com", model:"claude-3-haiku", status:"standby", usage:800, limit:30000, memo:"보조 계정" },
    { id:3, email:"team@gps.tours", model:"claude-3-5-sonnet", status:"standby", usage:0, limit:30000, memo:"팀 전용" },
  ]},
  { id:2, engine:"gemini", emoji:"🔵", name:"Gemini", accounts:[
    { id:1, email:"personal@gmail.com", model:"gemini-2.0-flash", status:"active", usage:8920, limit:10000, memo:"개인 계정" },
    { id:2, email:"business@gmail.com", model:"gemini-1.5-pro", status:"standby", usage:1200, limit:10000, memo:"비즈니스" },
  ]},
  { id:3, engine:"chatgpt", emoji:"🟢", name:"ChatGPT", accounts:[
    { id:1, email:"main@email.com", model:"gpt-4o-mini", status:"active", usage:5100, limit:20000, memo:"메인" },
    { id:2, email:"sub@email.com", model:"gpt-4o", status:"standby", usage:300, limit:20000, memo:"고성능용" },
  ]},
];

export default function AIKeyManager() {
  const [engineIdx, setEngineIdx] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [switchMode, setSwitchMode] = useState("auto");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const cur = AI_ACCOUNTS[engineIdx];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">🔑 AI API KEY & 토큰 관리</h1>
          <p className="text-xs text-slate-500 mt-1">BMAD: automation_doctor | LangGraph: Graph #4 (로테이션)</p>
        </div>

        {/* 엔진 카드 */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[...AI_ACCOUNTS, { id:99, emoji:"➕", name:"새 AI 추가", accounts:[] }].map((a, i) => {
            const active = a.accounts.find((ac: any) => ac.status === "active");
            const pct = active ? Math.round(active.usage / active.limit * 100) : 0;
            return (
              <div key={a.id} onClick={() => i < 3 && setEngineIdx(i)}
                className={`bg-[#1a1d2e] border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5 ${engineIdx === i && i < 3 ? "border-indigo-500" : "border-[#2d3148]"}`}>
                <div className="text-2xl mb-1">{a.emoji}</div>
                <div className="text-sm font-semibold">{a.name}</div>
                {a.accounts.length > 0 && (
                  <>
                    <div className="text-xs text-slate-500">{a.accounts.length}개 계정</div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-500">사용량</span>
                        <span className={pct > 80 ? "text-amber-400" : "text-emerald-400"}>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2d3148] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct > 80 ? "bg-amber-400" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </>
                )}
                {a.id === 99 && <div className="text-xs text-indigo-400 mt-1">OpenAI 호환 추가</div>}
              </div>
            );
          })}
        </div>

        {/* 계정 목록 */}
        <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-lg">{cur.emoji}</span>
              <span className="text-sm font-semibold ml-2">{cur.name} 계정 관리</span>
              <span className="text-xs text-slate-500 ml-2">{cur.accounts.length}개 / 최대 10</span>
            </div>
            <button onClick={() => setShowAdd(true)} className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg">+ 새 계정 추가</button>
          </div>

          {/* 전환 방식 */}
          <div className="bg-[#0f1117] rounded-lg px-4 py-3 mb-4 flex gap-5 items-center flex-wrap">
            <span className="text-xs text-slate-400">전환 방식:</span>
            {[["manual","수동"],["auto","자동 (한도 초과 시)"],["round_robin","라운드 로빈"]].map(([v,l]) => (
              <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" name="switch" checked={switchMode === v} onChange={() => setSwitchMode(v)} className="accent-indigo-500" />
                {l}
              </label>
            ))}
          </div>

          {cur.accounts.map((ac: any, idx: number) => {
            const pct = Math.round(ac.usage / ac.limit * 100);
            return (
              <div key={ac.id} className="border border-[#2d3148] rounded-xl p-4 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500">#{idx+1}</span>
                    <span className="text-sm font-medium">{ac.email}</span>
                    <span className="text-[10px] bg-[#1e2235] text-slate-400 px-2 py-0.5 rounded">{ac.model}</span>
                    <span className="text-xs text-slate-500">{ac.memo}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded border ${ac.status === "active" ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/20" : "text-slate-400 border-[#2d3148]"}`}>
                    {ac.status === "active" ? "✅ 활성" : "⏸️ 대기"}
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{ac.usage.toLocaleString()} / {ac.limit.toLocaleString()} 토큰</span>
                      <span className={pct > 80 ? "text-amber-400" : "text-emerald-400"}>{pct}% {pct > 80 ? "⚠️" : ""}</span>
                    </div>
                    <div className="h-1.5 bg-[#2d3148] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 80 ? "bg-amber-400" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => showToast("🔄 연결 테스트 성공!")} className="text-[11px] border border-[#2d3148] text-slate-400 px-2.5 py-1 rounded-lg hover:bg-[#2d3148]">테스트</button>
                    <button className="text-[11px] border border-[#2d3148] text-slate-400 px-2.5 py-1 rounded-lg hover:bg-[#2d3148]">수정</button>
                    {ac.status === "standby" && <button onClick={() => showToast("▶️ 활성화 완료!")} className="text-[11px] text-emerald-400 border border-emerald-900/40 bg-emerald-950/20 px-2.5 py-1 rounded-lg">활성화</button>}
                    {ac.status === "active" && <button className="text-[11px] text-slate-400 border border-[#2d3148] px-2.5 py-1 rounded-lg hover:bg-[#2d3148]">비활성화</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 토큰 요약 */}
        <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4 mt-4">
          <div className="text-sm font-semibold mb-3">📊 이달 토큰 사용 현황</div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-[#2d3148]">
                {["AI 엔진","계정","이달 사용","이달 한도","상태"].map(h => (
                  <th key={h} className="text-left px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AI_ACCOUNTS.map(a => {
                const total = a.accounts.reduce((s, ac) => s + ac.usage, 0);
                const limit = a.accounts.reduce((s, ac) => s + ac.limit, 0);
                const pct = Math.round(total / limit * 100);
                return (
                  <tr key={a.id} className="border-b border-[#1a1d2e] hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5">{a.emoji} {a.name}</td>
                    <td className="px-3 py-2.5 text-slate-500">{a.accounts.length}개</td>
                    <td className="px-3 py-2.5">{total.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-slate-500">{limit.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#2d3148] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct > 80 ? "bg-amber-400" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] ${pct > 80 ? "text-amber-400" : "text-emerald-400"}`}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가 모달 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-6 w-[440px]" onClick={e => e.stopPropagation()}>
            <div className="text-base font-semibold mb-4">➕ {cur.name} 새 계정 추가</div>
            {[["📧 이메일 (메모용)","business2@gmail.com"],["🔑 API Key","AIzaSy________________"],["📊 월 한도 (토큰)","10000"],["📝 메모","팀 전용 계정"]].map(([label,ph]) => (
              <div key={label} className="mb-3">
                <div className="text-xs text-slate-400 mb-1">{label}</div>
                <input className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500" placeholder={ph} />
              </div>
            ))}
            <div className="mb-4">
              <div className="text-xs text-slate-400 mb-1">🤖 모델 선택</div>
              <select className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none">
                <option>gemini-2.0-flash (빠름)</option>
                <option>gemini-1.5-pro (고성능)</option>
                <option>gemini-1.5-flash (균형)</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="text-xs border border-[#2d3148] text-slate-400 px-3 py-2 rounded-lg hover:bg-[#2d3148]">취소</button>
              <button onClick={() => showToast("🔄 연결 테스트 성공!")} className="text-xs border border-[#2d3148] text-slate-400 px-3 py-2 rounded-lg hover:bg-[#2d3148]">연결 테스트</button>
              <button onClick={() => { setShowAdd(false); showToast("✅ 계정 추가 완료!"); }} className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg">저장</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 right-6 bg-[#1a1d2e] border border-emerald-500 rounded-lg px-5 py-3 text-emerald-400 text-sm z-50">{toast}</div>}
    </AdminLayout>
  );
}
