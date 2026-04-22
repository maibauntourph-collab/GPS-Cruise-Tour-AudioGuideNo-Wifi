import { Link, useLocation, Redirect } from "wouter";

const navItems = [
  { id: "dashboard", icon: "🏠", label: "대시보드", path: "/admin/dashboard" },
  { id: "photos", icon: "🖼️", label: "사진 관리", path: "/admin/photos" },
  { id: "narration", icon: "🎙️", label: "나레이션 관리", path: "/admin/narration" },
  { id: "places", icon: "🗺️", label: "관광지 관리", path: "/admin/places" },
  { id: "aikeys", icon: "🔑", label: "AI API KEY", path: "/admin/ai-keys" },
  { id: "workflow", icon: "🧭", label: "워크플로우", path: "/admin/workflow" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // /admin 진입 시 대시보드로 리다이렉트
  if (location === "/admin" || location === "/admin/") {
    return <Redirect to="/admin/dashboard" />;
  }

  return (
    <div className="flex min-h-screen bg-[#0f1117] text-[#e2e8f0]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#13162a] border-r border-[#2d3148] flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-[#2d3148]">
          <div className="text-base font-bold text-[#e2e8f0]">🌍 GPS Tours</div>
          <div className="text-xs text-indigo-400 mt-0.5">Admin Dashboard</div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.path);
            return (
              <Link key={item.id} href={item.path}>
                <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                  border-l-2 ${isActive
                    ? "bg-indigo-500/20 border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#2d3148]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs">👤</div>
            <div>
              <div className="text-xs text-[#e2e8f0]">대표님</div>
              <div className="text-[10px] text-indigo-400">슈퍼 어드민</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
