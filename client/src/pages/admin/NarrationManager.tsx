import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";

const LANGS = ["EN", "KO", "JA", "ZH"];
const VOICE_OPTIONS = ["alloy", "echo", "fable", "nova", "onyx", "shimmer"];
const STYLE_OPTIONS = ["투어 가이드", "역사 해설", "캐주얼"];
const AI_OPTIONS = ["Claude (활성)", "Gemini", "ChatGPT"];
const safeArr = (v: any) => Array.isArray(v) ? v : [];

export default function NarrationManager() {
  const [selected, setSelected] = useState<any>(null);
  const [langTab, setLangTab] = useState("EN");
  const [generating, setGenerating] = useState(false);
  const [genDone, setGenDone] = useState(false);
  const [ttsConverting, setTtsConverting] = useState(false);
  const [voice, setVoice] = useState("nova");
  const [speed, setSpeed] = useState("1.0x");
  const [aiModel, setAiModel] = useState(AI_OPTIONS[0]);
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [genLangs, setGenLangs] = useState<string[]>(["EN", "KO"]);
  const [toast, setToast] = useState("");
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [narrationText, setNarrationText] = useState("");

  const { data: landmarks = [] } = useQuery({
    queryKey: ["/api/admin/landmarks"],
    queryFn: () => fetch("/api/admin/landmarks").then(r => r.ok ? r.json() : []).then(safeArr).catch(() => []),
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const getNarrationText = (lm: any, lang: string) => {
    const l = lang.toLowerCase();
    // 1순위: narrationI18n JSON 컬럼
    if (lm.narrationI18n?.[l]) return lm.narrationI18n[l];
    // 2순위: translations 컬럼 하위호환
    if (lm.translations?.[l]?.narration) return lm.translations[l].narration;
    // 3순위: 기본 narration (영어)
    if (l === 'en') return lm.narration || '';
    return '';
  };

  const hasNarration = (lm: any, lang: string) => !!getNarrationText(lm, lang);
  const hasAudio = (lm: any) => !!(lm.landmarkAudio?.length > 0 || lm.audioUrl);

  const statusBadge = (ok: boolean) => ok
    ? <span className="text-emerald-400">✅</span>
    : <span className="text-red-400">❌</span>;

  const completed = landmarks.filter((l: any) => hasNarration(l, "en")).length;
  const incomplete = landmarks.length - completed;

  const handleSelectLandmark = (lm: any) => {
    setSelected(lm);
    setGenDone(false);
    setAudioPreviewUrl(null);
    setNarrationText(getNarrationText(lm, langTab));
  };

  const handleLangTab = (l: string) => {
    setLangTab(l);
    if (selected) setNarrationText(getNarrationText(selected, l));
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const resp = await fetch("/api/admin/generate-narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landmarkId: selected.id,
          landmarkName: selected.name,
          languages: genLangs.map(l => l.toLowerCase()),
          style,
          aiModel,
        }),
      });
      if (resp.ok) {
        const result = await resp.json();
        setGenDone(true);
        showToast(`🤖 AI 나레이션 생성 완료! (${genLangs.join(", ")})`);
        // 생성된 텍스트를 textarea에 반영
        if (result.narrations?.[langTab.toLowerCase()]) {
          setNarrationText(result.narrations[langTab.toLowerCase()]);
        }
      } else {
        const err = await resp.json().catch(() => ({}));
        showToast(`❌ 생성 실패: ${err.error || resp.statusText}`);
      }
    } catch (e: any) {
      showToast(`❌ 오류: ${e.message}`);
    }
    setGenerating(false);
  };

  const handleTtsConvert = async () => {
    if (!selected || !narrationText) return;
    setTtsConverting(true);
    try {
      const lang = langTab.toLowerCase();
      const resp = await fetch("/api/tts/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: narrationText,
          voice,
          language: lang,
          landmarkId: selected.id,
        }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        showToast("🎵 TTS 변환 완료! ▶️ 미리듣기 가능");
      } else {
        const err = await resp.json().catch(() => ({}));
        showToast(`❌ TTS 실패: ${err.error || resp.statusText}`);
      }
    } catch (e: any) {
      showToast(`❌ TTS 오류: ${e.message}`);
    }
    setTtsConverting(false);
  };

  const handlePreview = () => {
    if (!audioPreviewUrl) return;
    if (audioRef.current) {
      if (audioRef.current.paused) audioRef.current.play();
      else audioRef.current.pause();
    } else {
      const a = new Audio(audioPreviewUrl);
      audioRef.current = a;
      a.play();
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold">🎙️ 나레이션 관리</h1>
          <p className="text-xs text-slate-500 mt-1">TTS 나레이션 — AI 생성 + OpenAI TTS 변환 + 오디오 미리듣기</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { l: "전체", v: landmarks.length, c: "text-indigo-400" },
            { l: "완료", v: completed, c: "text-emerald-400" },
            { l: "미완료", v: incomplete, c: "text-red-400" },
            { l: "번역 필요", v: Math.max(0, completed - landmarks.filter((l: any) => hasNarration(l, "ko")).length), c: "text-amber-400" },
          ].map(s => (
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
              <div className="text-sm font-semibold">장소 목록 ({landmarks.length})</div>
              <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg">🤖 미완료 일괄 생성</button>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-[#1a1d2e]">
                  <tr className="text-slate-500 border-b border-[#2d3148]">
                    <th className="text-left py-2">장소</th>
                    <th className="text-center">EN</th>
                    <th className="text-center">KO</th>
                    <th className="text-center">오디오</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(landmarks as any[]).map(l => (
                    <tr
                      key={l.id}
                      className={`border-b border-[#1a1d2e] cursor-pointer transition-colors ${selected?.id === l.id ? "bg-indigo-500/10" : "hover:bg-white/[0.02]"}`}
                      onClick={() => handleSelectLandmark(l)}
                    >
                      <td className="py-2">
                        <div className="font-medium">{l.name}</div>
                        <div className="text-slate-500 text-[10px]">{l.cityId || l.city}</div>
                      </td>
                      <td className="text-center">{statusBadge(hasNarration(l, "en"))}</td>
                      <td className="text-center">{statusBadge(hasNarration(l, "ko"))}</td>
                      <td className="text-center">{hasAudio(l) ? "✅" : "❌"}</td>
                      <td><button className="text-[10px] border border-[#2d3148] rounded px-2 py-1 text-slate-400">편집</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <div className="text-xs text-slate-500">{selected.cityId || selected.city}</div>
                  </div>
                  <button className="text-xs border border-[#2d3148] rounded px-2 py-1 text-slate-400" onClick={() => setSelected(null)}>✕</button>
                </div>

                {/* 언어 탭 */}
                <div className="flex gap-1.5 mb-3">
                  {LANGS.map(l => (
                    <button key={l} onClick={() => handleLangTab(l)}
                      className={`text-xs px-3 py-1 rounded-md border transition-all ${langTab === l ? "bg-indigo-500 border-indigo-500 text-white" : "border-[#2d3148] text-slate-400 bg-transparent"}`}>
                      {l}
                    </button>
                  ))}
                </div>

                <div className="mb-3">
                  <div className="text-xs text-slate-400 mb-1">📝 나레이션 텍스트 (TTS용)</div>
                  <textarea
                    className="w-full bg-[#0f1117] border border-[#2d3148] rounded-lg p-2.5 text-xs text-[#e2e8f0] outline-none focus:border-indigo-500 resize-none h-28"
                    value={narrationText}
                    onChange={e => setNarrationText(e.target.value)}
                    placeholder={`${langTab} 나레이션 없음 — AI로 생성하세요`}
                  />
                </div>

                {/* AI 생성 */}
                <div className="bg-[#0f1117] rounded-lg p-3 mb-3">
                  <div className="text-xs text-slate-400 mb-2">🤖 AI 자동 생성</div>
                  <div className="flex gap-2 mb-2">
                    <select
                      className="flex-1 bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none"
                      value={aiModel}
                      onChange={e => setAiModel(e.target.value)}
                    >
                      {AI_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <select
                      className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none"
                      value={style}
                      onChange={e => setStyle(e.target.value)}
                    >
                      {STYLE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    {["EN", "KO", "JA"].map(l => (
                      <label key={l} className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genLangs.includes(l)}
                          onChange={e => setGenLangs(prev => e.target.checked ? [...prev, l] : prev.filter(x => x !== l))}
                          className="accent-indigo-500"
                        /> {l}
                      </label>
                    ))}
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="ml-auto text-xs bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
                    >
                      {generating ? "⏳ 생성중..." : "🚀 생성"}
                    </button>
                  </div>
                  {genDone && <div className="mt-2 text-xs text-emerald-400">✅ 생성 완료!</div>}
                </div>

                {/* TTS */}
                <div className="bg-[#0f1117] rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-2">🔊 TTS 변환 (OpenAI)</div>
                  <div className="flex gap-2 items-center">
                    <select
                      className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none"
                      value={voice}
                      onChange={e => setVoice(e.target.value)}
                    >
                      {VOICE_OPTIONS.map(v => <option key={v}>{v}</option>)}
                    </select>
                    <select
                      className="bg-[#0f1117] border border-[#2d3148] rounded-lg px-2 py-1.5 text-xs text-[#e2e8f0] outline-none"
                      value={speed}
                      onChange={e => setSpeed(e.target.value)}
                    >
                      {["0.9x", "1.0x", "1.1x", "1.2x"].map(s => <option key={s}>{s}</option>)}
                    </select>
                    {audioPreviewUrl && (
                      <button
                        onClick={handlePreview}
                        className="text-xs border border-emerald-500 text-emerald-400 rounded-lg px-2 py-1.5 hover:bg-emerald-500/10"
                      >▶️ 듣기</button>
                    )}
                    <button
                      onClick={handleTtsConvert}
                      disabled={ttsConverting || !narrationText}
                      className="text-xs bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
                    >
                      {ttsConverting ? "⏳ 변환중..." : "변환"}
                    </button>
                  </div>
                  {audioPreviewUrl && (
                    <div className="mt-2 text-xs text-emerald-400">🎵 오디오 준비 완료 — ▶️ 버튼으로 미리듣기</div>
                  )}
                </div>
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
