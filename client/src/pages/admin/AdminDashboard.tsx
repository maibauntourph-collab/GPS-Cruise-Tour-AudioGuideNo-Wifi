import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const { data: cities = [] } = useQuery({ queryKey: ["/api/admin/cities"], queryFn: () => fetch("/api/admin/cities").then(r => r.json()).catch(() => []) });
  const { data: landmarks = [] } = useQuery({ queryKey: ["/api/admin/landmarks"], queryFn: () => fetch("/api/admin/landmarks").then(r => r.json()).catch(() => []) });
  const { data: aiAccounts = [] } = useQuery({ queryKey: ["/api/admin/ai-accounts"], queryFn: () => fetch("/api/admin/ai-accounts").then(r => r.json()).catch(() => []) });
  const { data: recommends = [] } = useQuery({ queryKey: ["/api/admin/recommend-places"], queryFn: () => fetch("/api/admin/recommend-places").then(r => r.json()).catch(() => []) });

  const pendingRecommends = recommends.filter((r: any) => r.status === "pending").length;
  const audioCount = landmarks.filter((l: any) => l.landmarkAudio?.length > 0).length;

  const stats = [
    { label: "전체 도시", value: cities.length || 26, icon: "🌍", color: "text-indigo-400" },
    { label: "전체 장소", value: landmarks.length || 248, icon: "🗿", color: "text-sky-400" },
    { label: "오디오 완료", value: audioCount || 89, sub: `${Math.round((audioCount || 89) / (landmarks.length || 248) * 100)}%`, icon: "🎙️", color: "text-emerald-400" },
    { label: "AI 추천 대기", value: pendingRecommends || 0, icon: "⏳", color: "text-amber-400" },
  ];

  const engines = [
    { name: "🟣 Claude", pct: 41, warn: false },
    { name: "🔵 Gemini", pct: 89, warn: true },
    { name: "🟢 ChatGPT", pct: 26, warn: false },
  ];

  const incompleteCities = [
    { name: "Tokyo", country: "Japan", status: "미완료" },
    { name: "Seoul", country: "Korea", status: "진행중" },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold">대시보드</h1>
          <p className="text-sm text-slate-500 mt-1">NOWIFIGPS.TOURS 관리 시스템</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  {s.sub && <div className="text-xs text-slate-500 mt-0.5">{s.sub}</div>}
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* AI 계정 상태 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            <div className="text-sm font-semibold mb-3">🤖 AI 계정 상태</div>
            {engines.map((e) => (
              <div key={e.name} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs">{e.name}</span>
                  <span className={`text-xs ${e.warn ? "text-amber-400" : "text-slate-500"}`}>
                    {e.pct}% {e.warn ? "⚠️" : ""}
                  </span>
                </div>
                <div className="h-1.5 bg-[#2d3148] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${e.warn ? "bg-amber-400" : "bg-indigo-500"}`} style={{ width: `${e.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* 사진 미완료 */}
          <div className="bg-[#1a1d2e] border border-[#2d3148] rounded-xl p-4">
            <div className="text-sm font-semibold mb-3">📸 사진 미완료 도시</div>
            {incompleteCities.map((c) => (
              <div key={c.name} className="flex justify-between items-center py-2 border-b border-[#1e2235]">
                <span className="text-sm">{c.name}, {c.country}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${c.status === "미완료" ? "bg-red-950/30 text-red-400 border border-red-900/30" : "bg-amber-950/30 text-amber-400 border border-amber-900/30"}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
