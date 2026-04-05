import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

const SOURCES = [
  { k: "google", l: "🔍 Google / Unsplash" },
  { k: "pexels", l: "📷 Pexels" },
  { k: "upload", l: "⬆️ 직접 업로드" },
];

const safeArr = (v: any) => Array.isArray(v) ? v : [];

// Unsplash source URL (무료, API 키 불필요)
const getUnsplashUrl = (query: string, sig: number) =>
  `https://source.unsplash.com/400x300/?${encodeURIComponent(query)}&sig=${sig}`;

export default function PhotoManager() {
  const [selected, setSelected] = useState<any>(null);
  const [source, setSource] = useState("google");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDone, setSearchDone] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [chosenUrl, setChosenUrl] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const qc = useQueryClient();

  // 랜드마크 전체 목록 (photos 필드 있음)
  const { data: landmarks = [] } = useQuery({
    queryKey: ["/api/admin/landmarks"],
    queryFn: () => fetch("/api/admin/landmarks").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  const savePhotoMutation = useMutation({
    mutationFn: async ({ id, photos }: { id: any; photos: string[] }) => {
      const res = await fetch(`/api/admin/landmarks/${id}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
      });
      return res.ok ? res.json() : null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/landmarks"] });
      showToast("✅ 사진이 저장되었습니다!");
      setSearchDone(false);
      setChosenUrl(null);
    },
    onError: () => showToast("❌ 저장 실패. 다시 시도해주세요."),
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const photoCount = (lm: any) => safeArr(lm.photos).length;

  const getStatus = (lm: any) => {
    const cnt = photoCount(lm);
    if (cnt >= 3) return "완료";
    if (cnt > 0) return "진행중";
    return "미완료";
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const q = `${searchQuery} ${selected?.name || ""}`.trim();
    const urls = Array.from({ length: 6 }, (_, i) => getUnsplashUrl(q, i + Date.now()));
    setSearchResults(urls);
    setSearchDone(true);
    setChosenUrl(null);
  };

  const handleSave = () => {
    if (!chosenUrl || !selected) return;
    const currentPhotos = safeArr(selected.photos);
    savePhotoMutation.mutate({ id: selected.id, photos: [...currentPhotos, chosenUrl] });
  };

  const handleRemovePhoto = (url: string) => {
    if (!selected) return;
    const updated = safeArr(selected.photos).filter((p: string) => p !== url);
    savePhotoMutation.mutate({ id: selected.id, photos: updated });
  };

  // 랜드마크를 cityId 기준 그룹핑 후 사진 미완료 순으로 정렬
  const sortedLandmarks = [...(landmarks as any[])].sort((a, b) => {
    const diff = photoCount(a) - photoCount(b);
    if (diff !== 0) return diff;
    return (a.cityId || "").localeCompare(b.cityId || "");
  });

  const completedCount = (landmarks as any[]).filter(l => photoCount(l) >= 3).length;
  const incompleteCount = landmarks.length - completedCount;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold">🖼️ 사진 관리</h1>
              <p className="text-xs text-slate-500 mt-1">BMAD: designer_kim | LangGraph: Graph #1</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-400">✅ 완료 {completedCount}</span>
              <span className="text-red-400">❌ 미완료 {incompleteCount}</span>
              <span className="text-slate-400">총 {landmarks.length}개</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 랜드마크 목록 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            <div className="text-sm font-semibold mb-3">랜드마크 목록</div>
            <div className="overflow-auto max-h-[580px]">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-[#1a1d2e] z-10">
                  <tr className="text-slate-500 border-b border-[#2d3148]">
                    <th className="text-left py-2 px-1">장소</th>
                    <th className="text-center">사진수</th>
                    <th className="text-center">상태</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLandmarks.map((lm) => {
                    const cnt = photoCount(lm);
                    const status = getStatus(lm);
                    const isSelected = selected?.id === lm.id;
                    return (
                      <tr
                        key={lm.id}
                        className={`border-b border-[#1a1d2e] cursor-pointer transition-colors ${isSelected ? "bg-indigo-500/10" : "hover:bg-white/[0.02]"}`}
                        onClick={() => { setSelected(lm); setSearchDone(false); setChosenUrl(null); setSearchQuery(""); }}
                      >
                        <td className="py-2 px-1">
                          <div className="font-medium">{lm.name}</div>
                          <div className="text-slate-500 text-[10px]">{lm.cityId}</div>
                        </td>
                        <td className={`text-center font-medium ${cnt === 0 ? "text-red-400" : cnt < 3 ? "text-amber-400" : "text-emerald-400"}`}>
                          {cnt}장
                        </td>
                        <td className="text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            status === "완료" ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/20" :
                            status === "미완료" ? "text-red-400 border-red-900/40 bg-red-950/20" :
                            "text-amber-400 border-amber-900/40 bg-amber-950/20"}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="text-[10px] border border-[#2d3148] rounded px-2 py-1 text-slate-400 hover:bg-[#2d3148]"
                            onClick={e => { e.stopPropagation(); setSelected(lm); setSearchDone(false); setChosenUrl(null); setSearchQuery(""); }}
                          >편집</button>
                        </td>
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
                <div className="text-sm">← 왼쪽에서 장소를 선택하세요</div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm font-semibold">{selected.name}</div>
                    <div className="text-xs text-slate-500">{selected.cityId}</div>
                  </div>
                  <button className="text-xs border border-[#2d3148] rounded px-2 py-1 text-slate-400 hover:bg-[#2d3148]"
                    onClick={() => { setSelected(null); setSearchDone(false); setChosenUrl(null); }}>✕ 닫기</button>
                </div>

                {/* 현재 사진 */}
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-2">현재 사진 ({photoCount(selected)}장)</div>
                  {photoCount(selected) === 0 ? (
                    <div className="text-xs text-red-400">⚠️ 사진 없음 — 아래에서 검색해 추가하세요</div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {safeArr(selected.photos).map((url: string, i: number) => (
                        <div key={i} className="relative group">
                          <img
                            src={url}
                            alt={`photo-${i}`}
                            className="w-20 h-14 rounded-lg object-cover border-2 border-transparent group-hover:border-indigo-500"
                            onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x56?text=No+Image"; }}
                          />
                          <button
                            onClick={() => handleRemovePhoto(url)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white hidden group-hover:flex items-center justify-center"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 소스 선택 */}
                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-2">사진 소스</div>
                  <div className="flex gap-2">
                    {SOURCES.map(s => (
                      <button key={s.k}
                        onClick={() => { setSource(s.k); setSearchDone(false); setChosenUrl(null); setSearchQuery(""); }}
                        className={`text-[11px] px-3 py-1.5 rounded-md transition-all ${source === s.k ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400 hover:bg-[#363b5e]"}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 검색창 (upload 아닐 때) */}
                {source !== "upload" && (
                  <div className="flex gap-2 mb-3">
                    <input
                      className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500"
                      placeholder={`${selected.name} 키워드로 검색...`}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                    />
                    <button
                      className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg"
                      onClick={handleSearch}
                    >검색</button>
                  </div>
                )}

                {/* 직접 업로드 UI */}
                {source === "upload" && (
                  <div className="border-2 border-dashed border-[#2d3148] rounded-lg p-6 text-center mb-3">
                    <div className="text-2xl mb-2">📁</div>
                    <div className="text-xs text-slate-400">이미지 파일을 드래그하거나</div>
                    <button className="mt-2 text-xs bg-[#2d3148] hover:bg-[#363b5e] text-slate-300 px-3 py-1.5 rounded-lg">
                      파일 선택
                    </button>
                  </div>
                )}

                {/* 검색 결과 */}
                {searchDone && searchResults.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2">검색 결과 — 클릭해서 선택</div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {searchResults.map((url, i) => (
                        <div
                          key={i}
                          onClick={() => setChosenUrl(url)}
                          className={`relative h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${chosenUrl === url ? "border-emerald-400" : "border-transparent hover:border-indigo-500"}`}
                        >
                          <img
                            src={url}
                            alt={`result-${i}`}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/120x80?text=No+Image"; }}
                          />
                          {chosenUrl === url && (
                            <div className="absolute inset-0 bg-emerald-400/20 flex items-center justify-center">
                              <span className="text-emerald-400 text-xl">✓</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {chosenUrl && (
                      <button
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm py-2 rounded-lg"
                        disabled={savePhotoMutation.isPending}
                        onClick={handleSave}
                      >
                        {savePhotoMutation.isPending ? "⏳ 저장 중..." : "✅ 선택한 사진 추가"}
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
        <div className="fixed bottom-6 right-6 bg-[#1a1d2e] border border-emerald-500 rounded-lg px-5 py-3 text-emerald-400 text-sm z-50 shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
