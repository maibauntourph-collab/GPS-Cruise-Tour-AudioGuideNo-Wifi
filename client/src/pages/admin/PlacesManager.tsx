import { useState } from "react";
import AdminLayout from "./AdminLayout";

const CATS = ["전체","🗿 랜드마크","🍽️ 레스토랑","🎯 액티비티","🎁 기념품점","🤖 AI 추천"];

const LANDMARKS = [
  { id:1, city:"Rome", name:"Colosseum", category:"landmark", recommend:5 },
  { id:2, city:"Rome", name:"Ristorante Aroma", category:"restaurant", recommend:3 },
  { id:3, city:"Rome", name:"Gladiator Tour", category:"activity", recommend:0 },
  { id:4, city:"Venice", name:"St. Mark's Basilica", category:"landmark", recommend:4 },
  { id:5, city:"Paris", name:"Eiffel Tower", category:"landmark", recommend:7 },
  { id:6, city:"Tokyo", name:"Senso-ji Temple", category:"landmark", recommend:0 },
];

const RECOMMENDS = [
  { id:1, source:"Colosseum", place:"Roman Forum", category:"landmark", distance:"도보 5분", ai:"Claude #1", status:"approved" },
  { id:2, source:"Colosseum", place:"Ristorante Aroma", category:"restaurant", distance:"도보 3분", ai:"Gemini #1", status:"approved" },
  { id:3, source:"Colosseum", place:"Gladiator Tour", category:"activity", distance:"현장", ai:"Claude #1", status:"approved" },
  { id:4, source:"Colosseum", place:"Colosseum Gift Shop", category:"giftshop", distance:"현장", ai:"GPT #1", status:"pending" },
  { id:5, source:"St. Mark's", place:"Doge Palace", category:"landmark", distance:"도보 2분", ai:"Gemini #1", status:"pending" },
  { id:6, source:"Eiffel Tower", place:"Café de Paris", category:"restaurant", distance:"도보 5분", ai:"Claude #1", status:"rejected" },
];

const CATEGORY_EMOJI: Record<string, string> = { landmark:"🗿", restaurant:"🍽️", activity:"🎯", giftshop:"🎁" };
const CATEGORY_LABEL: Record<string, string> = { landmark:"랜드마크", restaurant:"레스토랑", activity:"액티비티", giftshop:"기념품점" };

export default function PlacesManager() {
  const [catTab, setCatTab] = useState("전체");
  const [recFilter, setRecFilter] = useState("전체");
  const [recommends, setRecommends] = useState(RECOMMENDS);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleApprove = (id: number) => {
    setRecommends(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    showToast("✅ 승인되었습니다!");
  };
  const handleReject = (id: number) => {
    setRecommends(prev => prev.map(r => r.id === id ? { ...r, status: "rejected" } : r));
    showToast("❌ 거절되었습니다.");
  };

  const filtered = recommends.filter(r => recFilter === "전체" || r.status === recFilter);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">🗺️ 관광지 관리</h1>
          <p className="text-xs text-slate-500 mt-1">BMAD: query_master + dodari | LangGraph: Graph #3</p>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {CATS.map(c => (
            <button key={c} onClick={() => setCatTab(c)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all border-none ${catTab === c ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400 hover:bg-[#363b5e]"}`}>
              {c}
            </button>
          ))}
        </div>

        {catTab !== "🤖 AI 추천" ? (
          <>
            <div className="flex justify-between mb-3">
              <input className="w-64 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500" placeholder="🔍 도시 / 장소 검색..." />
              <div className="flex gap-2">
                <button className="text-xs border border-[#2d3148] text-slate-400 px-3 py-1.5 rounded-lg hover:bg-[#2d3148]">+ 새 장소 추가</button>
                <button className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600">🤖 AI 일괄 추천 생성</button>
              </div>
            </div>
            <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-[#2d3148]">
                    {["국가/도시","장소명","카테고리","GPS","추천수","액션"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LANDMARKS.map(l => (
                    <tr key={l.id} className="border-b border-[#1a1d2e] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-slate-500">{l.city}</td>
                      <td className="px-4 py-2.5 font-medium">{l.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] bg-[#1e2235] px-2 py-0.5 rounded">
                          {CATEGORY_EMOJI[l.category]} {CATEGORY_LABEL[l.category]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">41.89, 12.49</td>
                      <td className={`px-4 py-2.5 ${l.recommend > 0 ? "text-emerald-400" : "text-red-400"}`}>{l.recommend}개</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5">
                          {["편집","🖼️사진","🤖추천"].map(a => (
                            <button key={a} className="text-[10px] border border-[#2d3148] rounded px-2 py-0.5 text-slate-400 hover:bg-[#2d3148]">{a}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between mb-3 items-center">
              <div className="flex gap-2">
                {["전체","pending","approved","rejected"].map(f => (
                  <button key={f} onClick={() => setRecFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-md border-none ${recFilter === f ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400"}`}>
                    {f === "전체" ? "전체" : f === "pending" ? "⏳ 대기" : f === "approved" ? "✅ 승인" : "❌ 거절"}
                    ({recommends.filter(r => f === "전체" || r.status === f).length})
                  </button>
                ))}
              </div>
              <button className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg">🤖 새 AI 추천 생성</button>
            </div>
            <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-500 border-b border-[#2d3148]">
                    {["기준 장소","추천 장소","카테고리","거리","AI","상태","액션"].map(h => (
                      <th key={h} className="text-left px-4 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-[#1a1d2e] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-slate-500">{r.source}</td>
                      <td className="px-4 py-2.5 font-medium">{r.place}</td>
                      <td className="px-4 py-2.5">{CATEGORY_EMOJI[r.category]}</td>
                      <td className="px-4 py-2.5 text-slate-500">{r.distance}</td>
                      <td className="px-4 py-2.5 text-indigo-400">{r.ai}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          r.status === "approved" ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/20" :
                          r.status === "pending" ? "text-amber-400 border-amber-900/40 bg-amber-950/20" :
                          "text-red-400 border-red-900/40 bg-red-950/20"}`}>
                          {r.status === "approved" ? "✅ 승인" : r.status === "pending" ? "⏳ 대기" : "❌ 거절"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleApprove(r.id)} className="text-[10px] text-emerald-400 border border-emerald-900/40 bg-emerald-950/20 rounded px-2 py-0.5">승인</button>
                            <button onClick={() => handleReject(r.id)} className="text-[10px] text-red-400 border border-red-900/40 bg-red-950/20 rounded px-2 py-0.5">거절</button>
                          </div>
                        )}
                        {r.status !== "pending" && <button className="text-[10px] border border-[#2d3148] rounded px-2 py-0.5 text-slate-400">수정</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {toast && <div className="fixed bottom-6 right-6 bg-[#1a1d2e] border border-emerald-500 rounded-lg px-5 py-3 text-emerald-400 text-sm z-50">{toast}</div>}
    </AdminLayout>
  );
}
