import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

const CATS = ["전체","🗿 랜드마크","🍽️ 레스토랑","🎯 액티비티","🎁 기념품점","🤖 AI 추천"];
const CATEGORY_EMOJI: Record<string, string> = { landmark:"🗿", restaurant:"🍽️", activity:"🎯", giftshop:"🎁", attraction:"🗿" };
const CATEGORY_LABEL: Record<string, string> = { landmark:"랜드마크", restaurant:"레스토랑", activity:"액티비티", giftshop:"기념품점", attraction:"랜드마크" };
const safeArr = (v: any) => Array.isArray(v) ? v : [];

export default function PlacesManager() {
  const [catTab, setCatTab] = useState("전체");
  const [recFilter, setRecFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const qc = useQueryClient();

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const { data: landmarks = [] } = useQuery({
    queryKey: ["/api/admin/landmarks"],
    queryFn: () => fetch("/api/admin/landmarks").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  const { data: recommends = [] } = useQuery({
    queryKey: ["/api/admin/recommend-places"],
    queryFn: () => fetch("/api/admin/recommend-places").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/recommend-places/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.ok ? res.json() : null;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/recommend-places"] });
      showToast(vars.status === "approved" ? "✅ 승인되었습니다!" : "❌ 거절되었습니다.");
    },
  });

  const filteredLandmarks = (landmarks as any[]).filter(l => {
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.cityId?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (catTab === "전체") return true;
    if (catTab === "🗿 랜드마크") return l.category === "landmark" || l.category === "attraction";
    if (catTab === "🍽️ 레스토랑") return l.category === "restaurant";
    if (catTab === "🎯 액티비티") return l.category === "activity";
    if (catTab === "🎁 기념품점") return l.category === "giftshop";
    return true;
  });

  const filteredRecs = (recommends as any[]).filter(r => recFilter === "전체" || r.status === recFilter);

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
              <input
                className="w-64 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500"
                placeholder="🔍 도시 / 장소 검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-500">{filteredLandmarks.length}개</span>
                <button className="text-xs border border-[#2d3148] text-slate-400 px-3 py-1.5 rounded-lg hover:bg-[#2d3148]">+ 새 장소 추가</button>
                <button className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600">🤖 AI 일괄 추천 생성</button>
              </div>
            </div>
            <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl overflow-hidden">
              <div className="overflow-auto max-h-[550px]">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#1a1d2e]">
                    <tr className="text-slate-500 border-b border-[#2d3148]">
                      {["도시","장소명","카테고리","GPS","액션"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLandmarks.map((l: any) => (
                      <tr key={l.id} className="border-b border-[#1a1d2e] hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-slate-500">{l.cityId || l.city}</td>
                        <td className="px-4 py-2.5 font-medium">{l.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] bg-[#1e2235] px-2 py-0.5 rounded">
                            {CATEGORY_EMOJI[l.category] || "📍"} {CATEGORY_LABEL[l.category] || l.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-[10px]">
                          {l.latitude && l.longitude ? `${Number(l.latitude).toFixed(4)}, ${Number(l.longitude).toFixed(4)}` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            {["편집","🖼️사진","🤖추천"].map(a => (
                              <button key={a} className="text-[10px] border border-[#2d3148] rounded px-2 py-0.5 text-slate-400 hover:bg-[#2d3148]">{a}</button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredLandmarks.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">검색 결과 없음</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                    ({(recommends as any[]).filter(r => f === "전체" || r.status === f).length})
                  </button>
                ))}
              </div>
              <button className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg">🤖 새 AI 추천 생성</button>
            </div>

            {recommends.length === 0 ? (
              <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-12 text-center">
                <div className="text-4xl mb-3">🤖</div>
                <div className="text-sm text-slate-400">AI 추천 데이터가 없습니다</div>
                <div className="text-xs text-slate-500 mt-1">"새 AI 추천 생성" 버튼을 눌러 시작하세요</div>
              </div>
            ) : (
              <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-[#2d3148]">
                      {["기준 장소","추천 장소","카테고리","상태","액션"].map(h => (
                        <th key={h} className="text-left px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecs.map((r: any) => (
                      <tr key={r.id} className="border-b border-[#1a1d2e] hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-slate-500">{r.sourceId}</td>
                        <td className="px-4 py-2.5 font-medium">{r.placeName}</td>
                        <td className="px-4 py-2.5">{CATEGORY_EMOJI[r.category] || "📍"}</td>
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
                              <button onClick={() => approveMutation.mutate({ id: r.id, status: "approved" })} className="text-[10px] text-emerald-400 border border-emerald-900/40 bg-emerald-950/20 rounded px-2 py-0.5">승인</button>
                              <button onClick={() => approveMutation.mutate({ id: r.id, status: "rejected" })} className="text-[10px] text-red-400 border border-red-900/40 bg-red-950/20 rounded px-2 py-0.5">거절</button>
                            </div>
                          )}
                          {r.status !== "pending" && <button className="text-[10px] border border-[#2d3148] rounded px-2 py-0.5 text-slate-400">수정</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      {toast && <div className="fixed bottom-6 right-6 bg-[#1a1d2e] border border-emerald-500 rounded-lg px-5 py-3 text-emerald-400 text-sm z-50">{toast}</div>}
    </AdminLayout>
  );
}
