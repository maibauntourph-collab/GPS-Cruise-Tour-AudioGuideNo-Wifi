import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

const SOURCES = [
  { k: "google", l: "🔍 Google Maps" },
  { k: "pexels", l: "📷 Pexels" },
  { k: "upload", l: "⬆️ 직접 업로드" },
];

const PHOTO_SAMPLES = ["🏛️","🌊","🗼","🌉","🏰","🌺","🎭","⛪","🌿","🏟️","🎪","🌄"];

const safeArr = (v: any) => Array.isArray(v) ? v : [];

export default function PhotoManager() {
  const [selected, setSelected] = useState<any>(null);
  const [source, setSource] = useState("google");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDone, setSearchDone] = useState(false);
  const [chosenPhoto, setChosenPhoto] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const qc = useQueryClient();

  const { data: cities = [] } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: () => fetch("/api/cities").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  const savePhotoMutation = useMutation({
    mutationFn: async ({ id, photos }: { id: any; photos: string[] }) => {
      const res = await fetch(`/api/admin/cities/${id}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
      });
      return res.ok ? res.json() : null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/cities"] });
      showToast("✅ 사진이 저장되었습니다!");
      setSearchDone(false);
      setChosenPhoto(null);
    },
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const photoCount = (c: any) => {
    if (Array.isArray(c.photos)) return c.photos.length;
    if (Array.isArray(c.images)) return c.images.length;
    return 0;
  };

  const getStatus = (c: any) => {
    const cnt = photoCount(c);
    if (cnt >= 5) return "완료";
    if (cnt > 0) return "진행중";
    return "미완료";
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">🖼️ 사진 관리</h1>
          <p className="text-xs text-slate-500 mt-1">BMAD: designer_kim | LangGraph: Graph #1</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 목록 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            <div className="text-sm font-semibold mb-3">도시 & 장소 목록 ({cities.length})</div>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-[#1a1d2e]">
                  <tr className="text-slate-500 border-b border-[#2d3148]">
                    <th className="text-left py-2 px-1">장소</th>
                    <th className="text-center">사진수</th>
                    <th className="text-center">상태</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(cities as any[]).map((c) => {
                    const cnt = photoCount(c);
                    const status = getStatus(c);
                    return (
                      <tr key={c.id} className="border-b border-[#1a1d2e] cursor-pointer hover:bg-white/[0.02]" onClick={() => { setSelected(c); setSearchDone(false); setChosenPhoto(null); }}>
                        <td className="py-2 px-1">
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-slate-500 text-[10px]">{c.country}</div>
                        </td>
                        <td className={`text-center ${cnt === 0 ? "text-red-400" : cnt < 5 ? "text-amber-400" : "text-emerald-400"}`}>{cnt}장</td>
                        <td className="text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${status === "완료" ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/20" : status === "미완료" ? "text-red-400 border-red-900/40 bg-red-950/20" : "text-amber-400 border-amber-900/40 bg-amber-950/20"}`}>
                            {status}
                          </span>
                        </td>
                        <td><button className="text-[10px] border border-[#2d3148] rounded px-2 py-1 text-slate-400 hover:bg-[#2d3148]" onClick={(e) => { e.stopPropagation(); setSelected(c); }}>편집</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 편집 패널 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="text-5xl mb-3">🖼️</div>
                <div className="text-sm">← 왼쪽에서 도시를 선택하세요</div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-semibold">{selected.name}</div>
                    <div className="text-xs text-slate-500">{selected.country}</div>
                  </div>
                  <button className="text-xs border border-[#2d3148] rounded px-2 py-1 text-slate-400" onClick={() => { setSelected(null); setSearchDone(false); setChosenPhoto(null); }}>✕ 닫기</button>
                </div>

                {/* 현재 사진 */}
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-2">현재 사진 ({photoCount(selected)}장)</div>
                  <div className="flex gap-2 flex-wrap">
                    {photoCount(selected) === 0 && <div className="text-xs text-red-400 flex items-center">⚠️ 사진 없음</div>}
                    {Array.from({ length: photoCount(selected) }).map((_, i) => (
                      <div key={i} className="w-20 h-14 rounded-lg bg-[#2d3148] flex items-center justify-center text-xl border-2 border-transparent hover:border-indigo-500 cursor-pointer">
                        {PHOTO_SAMPLES[i % PHOTO_SAMPLES.length]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 소스 선택 */}
                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-2">사진 소스</div>
                  <div className="flex gap-2">
                    {SOURCES.map(s => (
                      <button key={s.k} onClick={() => { setSource(s.k); setSearchDone(false); setChosenPhoto(null); }}
                        className={`text-[11px] px-3 py-1.5 rounded-md transition-all ${source === s.k ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400 hover:bg-[#363b5e]"}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>

                {source !== "upload" && (
                  <div className="flex gap-2 mb-3">
                    <input className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500"
                      placeholder={`${selected.name} 검색...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && setSearchDone(true)} />
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg" onClick={() => setSearchDone(true)}>검색</button>
                  </div>
                )}

                {searchDone && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2">검색 결과 — 클릭해서 선택</div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {PHOTO_SAMPLES.slice(0, 6).map((p, i) => (
                        <div key={i} onClick={() => setChosenPhoto(i)}
                          className={`h-16 rounded-lg flex items-center justify-center text-2xl cursor-pointer border-2 transition-all ${chosenPhoto === i ? "border-emerald-400 bg-indigo-950/50" : "border-transparent bg-[#2d3148] hover:border-indigo-500"}`}>
                          {p}
                        </div>
                      ))}
                    </div>
                    {chosenPhoto !== null && (
                      <button
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 rounded-lg disabled:opacity-50"
                        disabled={savePhotoMutation.isPending}
                        onClick={() => savePhotoMutation.mutate({ id: selected.id, photos: [`photo_${chosenPhoto}`] })}>
                        {savePhotoMutation.isPending ? "저장 중..." : "✅ 선택한 사진 저장"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1a1d2e] border border-emerald-500 rounded-lg px-5 py-3 text-emerald-400 text-sm z-50">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
