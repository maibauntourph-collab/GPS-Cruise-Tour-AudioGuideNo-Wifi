import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

const SOURCES = [
  { k: "unsplash", l: "🔍 Unsplash" },
  { k: "loremflickr", l: "📷 LoremFlickr" },
  { k: "upload", l: "⬆️ URL 직접 입력" },
];

const safeArr = (v: any) => Array.isArray(v) ? v : [];

// 실제 작동하는 이미지 검색 URL 생성
const getSearchUrls = (query: string, source: string, count = 6): string[] =>
  Array.from({ length: count }, (_, i) => {
    const seed = Date.now() + i;
    if (source === "loremflickr") {
      return `https://loremflickr.com/400/260/${encodeURIComponent(query)}?lock=${seed}`;
    }
    // Unsplash direct CDN (source.unsplash.com deprecated → picsum + unsplash)
    return `https://picsum.photos/seed/${encodeURIComponent(query)}-${seed}/400/260`;
  });

export default function PhotoManager() {
  const [tab, setTab] = useState<"city" | "landmark">("landmark");
  const [selected, setSelected] = useState<any>(null);
  const [source, setSource] = useState("loremflickr");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDone, setSearchDone] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [chosenUrl, setChosenUrl] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" }>({ msg: "", type: "success" });
  const qc = useQueryClient();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 2500);
  };

  // 도시 목록
  const { data: cities = [] } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: () => fetch("/api/cities").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  // 랜드마크 목록
  const { data: landmarks = [], refetch: refetchLandmarks } = useQuery({
    queryKey: ["/api/admin/landmarks"],
    queryFn: () => fetch("/api/admin/landmarks").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  // 랜드마크 사진 저장
  const saveLandmarkPhotos = useMutation({
    mutationFn: async ({ id, photos }: { id: string; photos: string[] }) => {
      const res = await fetch(`/api/admin/landmarks/${id}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/landmarks"] });
      // selected 상태도 즉시 업데이트
      if (selected && data) setSelected({ ...selected, photos: data.photos ?? selected.photos });
      showToast("✅ 사진 저장 완료!");
      setSearchDone(false);
      setChosenUrl(null);
      setManualUrl("");
    },
    onError: () => showToast("❌ 저장 실패", "error"),
  });

  // 도시 사진 저장
  const saveCityPhotos = useMutation({
    mutationFn: async ({ id, photos }: { id: string; photos: string[] }) => {
      const res = await fetch(`/api/admin/cities/${id}/photos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cities"] });
      showToast("✅ 도시 사진 저장 완료!");
      setSearchDone(false);
      setChosenUrl(null);
    },
    onError: () => showToast("❌ 저장 실패", "error"),
  });

  const isSaving = saveLandmarkPhotos.isPending || saveCityPhotos.isPending;

  // 현재 선택된 아이템의 photos 배열
  const currentPhotos = (): string[] => {
    if (!selected) return [];
    if (tab === "city") {
      // 도시: landingContent.en.heroImage + photos 배열
      const heroImages: string[] = [];
      if (selected.landingContent?.en?.heroImage) heroImages.push(selected.landingContent.en.heroImage);
      return [...heroImages, ...safeArr(selected.photos)];
    }
    return safeArr(selected.photos);
  };

  const photoCount = (item: any, isCity = false) => {
    if (isCity) {
      let cnt = 0;
      if (item.landingContent?.en?.heroImage) cnt++;
      cnt += safeArr(item.photos).length;
      return cnt;
    }
    return safeArr(item.photos).length;
  };

  const getStatus = (cnt: number) => {
    if (cnt >= 3) return { label: "완료", cls: "text-emerald-400 border-emerald-900/40 bg-emerald-950/20" };
    if (cnt > 0) return { label: "진행중", cls: "text-amber-400 border-amber-900/40 bg-amber-950/20" };
    return { label: "미완료", cls: "text-red-400 border-red-900/40 bg-red-950/20" };
  };

  const handleSearch = () => {
    const q = searchQuery.trim() || selected?.name || "";
    if (!q) return;
    setSearchResults(getSearchUrls(q, source));
    setSearchDone(true);
    setChosenUrl(null);
  };

  const addPhoto = (url: string) => {
    if (!selected || !url) return;
    const existing = safeArr(selected.photos);
    if (existing.includes(url)) { showToast("이미 추가된 사진입니다", "error"); return; }
    const updated = [...existing, url];
    if (tab === "landmark") {
      saveLandmarkPhotos.mutate({ id: selected.id, photos: updated });
    } else {
      saveCityPhotos.mutate({ id: selected.id, photos: updated });
    }
  };

  const removePhoto = (url: string) => {
    if (!selected) return;
    const updated = safeArr(selected.photos).filter((p: string) => p !== url);
    if (tab === "landmark") {
      saveLandmarkPhotos.mutate({ id: selected.id, photos: updated });
    } else {
      saveCityPhotos.mutate({ id: selected.id, photos: updated });
    }
  };

  const movePhoto = (url: string, dir: -1 | 1) => {
    if (!selected) return;
    const photos = [...safeArr(selected.photos)];
    const idx = photos.indexOf(url);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= photos.length) return;
    [photos[idx], photos[newIdx]] = [photos[newIdx], photos[idx]];
    if (tab === "landmark") {
      saveLandmarkPhotos.mutate({ id: selected.id, photos });
    } else {
      saveCityPhotos.mutate({ id: selected.id, photos });
    }
  };

  const handleSelectItem = (item: any) => {
    setSelected(item);
    setSearchDone(false);
    setChosenUrl(null);
    setSearchQuery(item.name || "");
    setManualUrl("");
  };

  // 목록: 사진 적은 순 정렬
  const sortedLandmarks = [...(landmarks as any[])].sort((a, b) => photoCount(a) - photoCount(b));
  const sortedCities = [...(cities as any[])].sort((a, b) => photoCount(a, true) - photoCount(b, true));

  const listItems = tab === "city" ? sortedCities : sortedLandmarks;
  const totalComplete = listItems.filter(i => photoCount(i, tab === "city") >= 3).length;
  const totalIncomplete = listItems.length - totalComplete;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">🖼️ 사진 관리</h1>
            <p className="text-xs text-slate-500 mt-1">BMAD: designer_kim | LangGraph: Graph #1</p>
          </div>
          <div className="flex gap-3 text-xs items-center">
            <span className="text-emerald-400">✅ 완료 {totalComplete}</span>
            <span className="text-red-400">❌ 미완료 {totalIncomplete}</span>
            <span className="text-slate-400">총 {listItems.length}개</span>
          </div>
        </div>

        {/* 탭: 도시 / 랜드마크 */}
        <div className="flex gap-2 mb-4">
          {(["landmark", "city"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelected(null); setSearchDone(false); }}
              className={`text-xs px-4 py-1.5 rounded-md border-none font-medium ${tab === t ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400 hover:bg-[#363b5e]"}`}>
              {t === "city" ? "🌍 도시 사진" : "🗿 랜드마크 사진"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 목록 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            <div className="text-sm font-semibold mb-3">
              {tab === "city" ? "도시 목록" : "랜드마크 목록"} ({listItems.length})
            </div>
            <div className="overflow-auto max-h-[580px]">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-[#1a1d2e] z-10">
                  <tr className="text-slate-500 border-b border-[#2d3148]">
                    <th className="text-left py-2 px-1">이름</th>
                    <th className="text-center">사진</th>
                    <th className="text-center">상태</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {listItems.map((item: any) => {
                    const cnt = photoCount(item, tab === "city");
                    const { label, cls } = getStatus(cnt);
                    const isActive = selected?.id === item.id;
                    return (
                      <tr key={item.id}
                        className={`border-b border-[#13162a] cursor-pointer transition-colors ${isActive ? "bg-indigo-500/10" : "hover:bg-white/[0.03]"}`}
                        onClick={() => handleSelectItem(item)}>
                        <td className="py-2 px-1">
                          <div className="font-medium flex items-center gap-1.5">
                            {/* 대표 이미지 미리보기 */}
                            {tab === "city" && item.landingContent?.en?.heroImage ? (
                              <img src={item.landingContent.en.heroImage} alt="" className="w-8 h-6 rounded object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : tab === "landmark" && safeArr(item.photos)[0] ? (
                              <img src={safeArr(item.photos)[0]} alt="" className="w-8 h-6 rounded object-cover flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <div className="w-8 h-6 rounded bg-[#2d3148] flex-shrink-0 flex items-center justify-center text-[9px] text-slate-600">No</div>
                            )}
                            <div>
                              <div className="truncate max-w-[140px]">{item.name}</div>
                              <div className="text-slate-500 text-[10px]">{item.country || item.cityId}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`text-center font-bold ${cnt === 0 ? "text-red-400" : cnt < 3 ? "text-amber-400" : "text-emerald-400"}`}>{cnt}</td>
                        <td className="text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${cls}`}>{label}</span>
                        </td>
                        <td className="pr-1">
                          <button className="text-[10px] border border-[#2d3148] rounded px-2 py-0.5 text-slate-400 hover:bg-[#2d3148]"
                            onClick={e => { e.stopPropagation(); handleSelectItem(item); }}>편집</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 편집 패널 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4 overflow-auto max-h-[680px]">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="text-5xl mb-3">🖼️</div>
                <div className="text-sm">← 왼쪽에서 선택하세요</div>
              </div>
            ) : (
              <>
                {/* 헤더 */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {tab === "city" && selected.landingContent?.en?.heroImage && (
                      <img src={selected.landingContent.en.heroImage} alt="" className="w-14 h-10 rounded-lg object-cover border border-[#2d3148]" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    <div>
                      <div className="text-sm font-semibold">{selected.name}</div>
                      <div className="text-xs text-slate-500">{selected.country || selected.cityId} · 사진 {currentPhotos().length}장</div>
                    </div>
                  </div>
                  <button className="text-xs border border-[#2d3148] rounded px-2 py-1 text-slate-400 hover:bg-[#2d3148]"
                    onClick={() => { setSelected(null); setSearchDone(false); }}>✕</button>
                </div>

                {/* 현재 사진 CRUD */}
                <div className="mb-5">
                  <div className="text-xs text-slate-400 mb-2 font-medium">📸 현재 사진 ({currentPhotos().length}장)</div>
                  {currentPhotos().length === 0 ? (
                    <div className="border border-dashed border-[#2d3148] rounded-lg p-4 text-center text-xs text-slate-500">
                      사진 없음 — 아래에서 추가하세요
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {currentPhotos().map((url, i) => {
                        const isHero = tab === "city" && i === 0 && selected.landingContent?.en?.heroImage === url;
                        const isInPhotosArr = safeArr(selected.photos).includes(url);
                        return (
                          <div key={i} className="relative group rounded-lg overflow-hidden border border-[#2d3148] bg-[#0f1117]">
                            <img
                              src={url}
                              alt={`photo-${i}`}
                              className="w-full h-24 object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).src = `https://loremflickr.com/200/96/${encodeURIComponent(selected.name)}?lock=${i}`;
                              }}
                            />
                            {/* 오버레이 */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              {isInPhotosArr && (
                                <>
                                  <button onClick={() => movePhoto(url, -1)} disabled={safeArr(selected.photos).indexOf(url) === 0}
                                    className="w-6 h-6 bg-[#1a1d2e] rounded text-white text-xs disabled:opacity-30 hover:bg-indigo-600">◀</button>
                                  <button onClick={() => movePhoto(url, 1)} disabled={safeArr(selected.photos).indexOf(url) === safeArr(selected.photos).length - 1}
                                    className="w-6 h-6 bg-[#1a1d2e] rounded text-white text-xs disabled:opacity-30 hover:bg-indigo-600">▶</button>
                                  <button onClick={() => removePhoto(url)}
                                    className="w-6 h-6 bg-red-600 rounded text-white text-xs hover:bg-red-700">✕</button>
                                </>
                              )}
                            </div>
                            {/* 배지 */}
                            <div className="absolute top-1 left-1 flex gap-1">
                              {isHero && <span className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded">대표</span>}
                              <span className="text-[9px] bg-black/50 text-white px-1 py-0.5 rounded">#{i + 1}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 사진 추가 섹션 */}
                <div className="border-t border-[#2d3148] pt-4">
                  <div className="text-xs text-slate-400 mb-3 font-medium">➕ 사진 추가</div>

                  {/* 소스 탭 */}
                  <div className="flex gap-1.5 mb-3">
                    {SOURCES.map(s => (
                      <button key={s.k} onClick={() => { setSource(s.k); setSearchDone(false); setChosenUrl(null); }}
                        className={`text-[11px] px-3 py-1.5 rounded-md transition-all ${source === s.k ? "bg-indigo-500 text-white" : "bg-[#2d3148] text-slate-400 hover:bg-[#363b5e]"}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>

                  {/* URL 직접 입력 */}
                  {source === "upload" && (
                    <div className="mb-3">
                      <input
                        className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500 mb-2"
                        placeholder="https://images.unsplash.com/..."
                        value={manualUrl}
                        onChange={e => setManualUrl(e.target.value)}
                      />
                      {manualUrl && (
                        <div className="mb-2">
                          <img src={manualUrl} alt="preview" className="w-full h-28 object-cover rounded-lg border border-[#2d3148]"
                            onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x112?text=Invalid+URL"; }} />
                        </div>
                      )}
                      <button
                        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs py-2 rounded-lg"
                        disabled={!manualUrl || isSaving}
                        onClick={() => addPhoto(manualUrl)}>
                        {isSaving ? "⏳ 저장 중..." : "✅ 이 URL로 추가"}
                      </button>
                    </div>
                  )}

                  {/* 검색 */}
                  {source !== "upload" && (
                    <>
                      <div className="flex gap-2 mb-3">
                        <input
                          className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-3 py-2 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500"
                          placeholder={`검색어 (예: ${selected.name})`}
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSearch()}
                        />
                        <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-medium"
                          onClick={handleSearch}>검색</button>
                      </div>

                      {searchDone && (
                        <>
                          <div className="text-xs text-slate-400 mb-2">클릭하여 선택 후 추가</div>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {searchResults.map((url, i) => (
                              <div key={i} onClick={() => setChosenUrl(url)}
                                className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all h-20 ${chosenUrl === url ? "border-emerald-400 ring-1 ring-emerald-400" : "border-transparent hover:border-indigo-500"}`}>
                                <img
                                  src={url}
                                  alt={`r-${i}`}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    // fallback to another service
                                    (e.target as HTMLImageElement).src = `https://loremflickr.com/160/80/${encodeURIComponent(searchQuery || selected.name)}?lock=${i + 100}`;
                                  }}
                                />
                                {chosenUrl === url && (
                                  <div className="absolute inset-0 bg-emerald-400/30 flex items-center justify-center">
                                    <span className="text-emerald-300 text-2xl">✓</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button className="text-xs border border-[#2d3148] text-slate-400 px-3 py-2 rounded-lg hover:bg-[#2d3148] flex-1"
                              onClick={handleSearch}>🔄 다시 검색</button>
                            {chosenUrl && (
                              <button
                                className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs py-2 rounded-lg font-medium"
                                disabled={isSaving}
                                onClick={() => addPhoto(chosenUrl)}>
                                {isSaving ? "⏳ 저장 중..." : "✅ 선택한 사진 추가"}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 토스트 */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 rounded-lg px-5 py-3 text-sm z-50 shadow-xl border ${
          toast.type === "error"
            ? "bg-[#1a1d2e] border-red-500 text-red-400"
            : "bg-[#1a1d2e] border-emerald-500 text-emerald-400"
        }`}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  );
}
