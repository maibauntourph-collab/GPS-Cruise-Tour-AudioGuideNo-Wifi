import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

const LANGS = ["EN", "KO", "JA", "ZH"];

const DUMMY_LANDMARKS = [
  { id:1, city:"Rome", name:"Colosseum", category:"landmark", narrationStatus:{EN:true,KO:true,JA:false,ZH:false}, hasAudio:true },
  { id:2, city:"Rome", name:"Ristorante Aroma", category:"restaurant", narrationStatus:{EN:true,KO:false,JA:false,ZH:false}, hasAudio:false },
  { id:3, city:"Rome", name:"Gladiator Tour", category:"activity", narrationStatus:{EN:true,KO:false,JA:false,ZH:false}, hasAudio:false },
  { id:4, city:"Venice", name:"St. Mark's Basilica", category:"landmark", narrationStatus:{EN:true,KO:true,JA:true,ZH:false}, hasAudio:true },
  { id:5, city:"Paris", name:"Eiffel Tower", category:"landmark", narrationStatus:{EN:true,KO:true,JA:false,ZH:false}, hasAudio:true },
  { id:6, city:"Tokyo", name:"Senso-ji Temple", category:"landmark", narrationStatus:{EN:false,KO:false,JA:false,ZH:false}, hasAudio:false },
];

export default function NarrationManager() {
  const [selected, setSelected] = useState<any>(null);
  const [langTab, setLangTab] = useState("EN");
  const [generating, setGenerating] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenDone(true); showToast("🤖 AI 나레이션 생성 완료!"); }, 1800);
  };

  const statusBadge = (ok: boolean) => ok
    ? <span className="text-emerald-400">✅</span>
    : <span className="text-red-400">❌</span>;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">🎙️ 나레이션 관리</h1>
          <p className="text-xs text-slate-500 mt-1">BMAD: marketer_song | LangGraph: Graph #2 (병렬 생성)</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[{l:"전체",v:248,c:"text-indigo-400"},{l:"완료",v:89,c:"text-emerald-400"},{l:"미완료",v:159,c:"text-red-400"},{l:"번역 필요",v:12,c:"text-amber-400"}].map(s=>(
            <div key={s.l} className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-slate-500">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 목록 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-semibold">장소 목록</div>
              <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg">🤖 미완료 일괄 생성</button>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-[#2d3148]">
                  <th className="text-left py-2">장소</th>
                  <th className="text-center">EN</th><th className="text-center">KO</th><th className="text-center">오디오</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {DUMMY_LANDMARKS.map(l => (
                  <tr key={l.id} className="border-b border-[#1a1d2e] cursor-pointer hover:bg-white/[0.02]" onClick={() => { setSelected(l); setGenDone(false); }}>
                    <td className="py-2">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-slate-500 text-[10px]">{l.city}</div>
                    </td>
                    <td className="text-center">{statusBadge(l.narrationStatus.EN)}</td>
                    <td className="text-center">{statusBadge(l.narrationStatus.KO)}</td>
                    <td className="text-center">{l.hasAudio ? "✅" : "❌"}</td>
                    <td><button className="text-[10px] border border-[#2d3148] rounded px-2 py-1 text-slate-400">편집</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 편집 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="text-5xl mb-3">🎙️</div>
                <div className="text-sm">← 장소를 선택하세요</div>
              </div>
            ) : (
              <>
                <div className="flex justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold">{selected.name}</div>
                    <div className="text-xs text-slate-500">{selected.city}</div>
                  </div>
                  <button className="text-xs border border-[#2d3148] rounded px-2 py-1 text-slate-400" onClick={() => setSelected(null)}>✕</button>
                </div>

                {/* 언어 탭 */}
                <div className="flex gap-1.5 mb-3">
                  {LANGS.map(l => (
                    <button key={l} onClick={() => setLangTab(l)}
                      className={`text-xs px-3 py-1 rounded-md border transition-all ${langTab === l ? "bg-indigo-500 border-indigo-500 text-white" : "border-[#2d3148] text-slate-400 bg-transparent"}`}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-1">📝 나레이션 텍스트 (TTS용)</div>
                  <textarea className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg p-2.5 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500 resize-none h-24"
                    defaultValue={langTab === "EN" ? `Welcome to ${selected.name}. This remarkable landmark...` : langTab === "KO" ? `${selected.name}에 오신 것을 환영합니다...` : ""}
                    placeholder={`${langTab} 나레이션 없음 — AI로 생성하세요`} />
                </div>

                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-1">📄 짧은 설명 (앱 카드용)</div>
                  <input className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500"
                    placeholder="80자 이내 짧은 설명" />
                </div>

                {/* AI 생성 */}
                <div className="bg-[#0f1117] rounded-lg p-3 mb-3">
                  <div className="text-xs text-slate-400 mb-2">🤖 AI 자동 생성</div>
                  <div className="flex gap-2 mb-2">
                    <select className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none">
                      <option>🟣 Claude (활성)</option>
                      <option>🔵 Gemini</option>
                      <option>🟢 ChatGPT</option>
                    </select>
                    <select className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none">
                      <option>투어 가이드</option>
                      <option>역사 해설</option>
                      <option>캐주얼</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    {["EN","KO","JA"].map(l => (
                      <label key={l} className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="checkbox" defaultChecked={l !== "JA"} className="accent-indigo-500" /> {l}
                      </label>
                    ))}
                    <button onClick={handleGenerate} className="ml-auto text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg">
                      {generating ? "⏳ 생성중..." : "🚀 생성"}
                    </button>
                  </div>
                  {genDone && <div className="mt-2 text-xs text-emerald-400">✅ 생성 완료!</div>}
                </div>

                {/* TTS */}
                <div className="bg-[#0f1117] rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-2">🔊 TTS 변환</div>
                  <div className="flex gap-2 items-center">
                    <select className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none">
                      <option>Alloy</option><option>Nova</option><option>Echo</option>
                    </select>
                    <select className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none">
                      <option>1.0x</option><option>0.9x</option><option>1.1x</option>
                    </select>
                    <button className="text-xs border border-[#2d3148] rounded-lg px-2 py-1.5 text-slate-400 hover:bg-[#2d3148]">▶️ 미리듣기</button>
                    <button onClick={() => showToast("🎵 TTS 변환 완료!")} className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg">변환</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 right-6 bg-[#1a1d2e] border border-emerald-500 rounded-lg px-5 py-3 text-emerald-400 text-sm z-50">{toast}</div>}
    </AdminLayout>
  );
}
