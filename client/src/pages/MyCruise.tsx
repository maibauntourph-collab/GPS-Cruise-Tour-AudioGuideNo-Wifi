import React, { useState, useEffect } from 'react';

interface PortDay {
  date: string;
  portName: string;
  cityKey: string;
  notes?: string;
}

interface CruiseItinerary {
  id: string;
  shipName: string;
  departureDate: string;
  returnDate: string;
  ports: PortDay[];
  createdAt: string;
}

const STORAGE_KEY = 'myCruiseItineraries';

const PORT_OPTIONS: { label: string; cityKey: string }[] = [
  { label: 'Rome (Civitavecchia)', cityKey: 'rome' },
  { label: 'Barcelona', cityKey: 'barcelona' },
  { label: 'Naples', cityKey: 'naples' },
  { label: 'Athens (Piraeus)', cityKey: 'athens' },
  { label: 'Venice', cityKey: 'venice' },
  { label: 'Lisbon', cityKey: 'lisbon' },
  { label: 'Dubrovnik', cityKey: 'dubrovnik' },
  { label: 'Santorini', cityKey: 'santorini' },
  { label: 'Amsterdam', cityKey: 'amsterdam' },
  { label: 'Stockholm', cityKey: 'stockholm' },
  { label: 'Copenhagen', cityKey: 'copenhagen' },
  { label: 'Cozumel', cityKey: 'cozumel' },
  { label: 'Nassau', cityKey: 'nassau' },
  { label: 'Juneau', cityKey: 'juneau' },
  { label: 'Ketchikan', cityKey: 'ketchikan' },
  { label: 'Singapore', cityKey: 'singapore' },
  { label: 'Tokyo', cityKey: 'tokyo' },
  { label: 'Sea Day (항해일)', cityKey: '' },
];

function loadItineraries(): CruiseItinerary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CruiseItinerary[];
  } catch { return []; }
}

function saveItineraries(list: CruiseItinerary[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function calcDaysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateId(): string {
  return `cruise_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const emptyPort = (): PortDay => ({ date: '', portName: PORT_OPTIONS[0].label, cityKey: PORT_OPTIONS[0].cityKey, notes: '' });

export default function MyCruise() {
  const [itineraries, setItineraries] = useState<CruiseItinerary[]>([]);
  const [shareMsg, setShareMsg] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shipName, setShipName] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [ports, setPorts] = useState<PortDay[]>([emptyPort()]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => { setItineraries(loadItineraries()); }, []);

  const upcomingCruise = itineraries
    .filter((c) => calcDaysUntil(c.departureDate) >= 0)
    .sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];

  const daysUntil = upcomingCruise ? calcDaysUntil(upcomingCruise.departureDate) : null;

  const handlePortChange = (index: number, field: keyof PortDay, value: string) => {
    setPorts((prev) => {
      const next = [...prev];
      if (field === 'portName') {
        const found = PORT_OPTIONS.find((p) => p.label === value);
        next[index] = { ...next[index], portName: value, cityKey: found ? found.cityKey : '' };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!shipName.trim()) { setFormError('선명을 입력해주세요.'); return; }
    if (!departureDate) { setFormError('출발일을 선택해주세요.'); return; }
    if (!returnDate) { setFormError('귀항일을 선택해주세요.'); return; }
    if (new Date(returnDate) <= new Date(departureDate)) { setFormError('귀항일은 출발일 이후여야 합니다.'); return; }
    if (ports.some((p) => !p.date)) { setFormError('모든 기항지의 날짜를 입력해주세요.'); return; }

    const newItinerary: CruiseItinerary = {
      id: generateId(), shipName: shipName.trim(), departureDate, returnDate,
      ports: ports.map((p) => ({ ...p, notes: p.notes || '' })),
      createdAt: new Date().toISOString(),
    };
    const updated = [...itineraries, newItinerary];
    setItineraries(updated); saveItineraries(updated);
    setShipName(''); setDepartureDate(''); setReturnDate(''); setPorts([emptyPort()]);
    setFormSuccess('크루즈 일정이 등록되었습니다!');
  };

  const deleteItinerary = (id: string) => {
    const updated = itineraries.filter((c) => c.id !== id);
    setItineraries(updated); saveItineraries(updated);
    if (expandedId === id) setExpandedId(null);
  };

  const handleShare = async (cruise: CruiseItinerary) => {
    const text = `🚢 ${cruise.shipName}\n출발: ${formatDate(cruise.departureDate)}\n귀항: ${formatDate(cruise.returnDate)}\n기항지: ${cruise.ports.map((p) => p.portName).join(', ')}`;
    if (navigator.share) {
      try { await navigator.share({ title: '내 크루즈 일정', text }); setShareMsg('공유 완료!'); }
      catch { setShareMsg('공유가 취소되었습니다.'); }
    } else {
      try { await navigator.clipboard.writeText(text); setShareMsg('클립보드에 복사되었습니다!'); }
      catch { setShareMsg('복사에 실패했습니다.'); }
    }
    setTimeout(() => setShareMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-gradient-to-r from-blue-700 to-violet-700 text-white py-10 px-4 text-center shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight mb-1">내 크루즈 일정</h1>
        <p className="text-blue-100 text-sm">My Cruise Planner</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-8">
        {/* 카운트다운 */}
        <section>
          <div className="bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl text-center">
            {upcomingCruise ? (
              <>
                <p className="text-blue-200 text-sm mb-1 font-medium uppercase tracking-widest">다음 크루즈까지</p>
                <div className="text-7xl font-extrabold tracking-tight my-2">
                  {daysUntil === 0 ? '출항!' : `D-${daysUntil}`}
                </div>
                <p className="text-blue-100 text-base mt-1">
                  🚢 {upcomingCruise.shipName} · {formatDate(upcomingCruise.departureDate)} 출발
                </p>
              </>
            ) : (
              <>
                <p className="text-blue-200 text-sm mb-2">등록된 크루즈 일정이 없습니다</p>
                <div className="text-5xl font-extrabold my-2">— —</div>
                <p className="text-blue-100 text-sm">아래에서 일정을 등록해보세요</p>
              </>
            )}
          </div>
        </section>

        {/* 등록된 크루즈 */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">등록된 크루즈</h2>
          {itineraries.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow border border-gray-100">
              <span className="text-4xl">🚢</span>
              <p className="mt-3 text-sm">아직 등록된 크루즈가 없습니다.<br />아래 폼으로 첫 번째 일정을 추가해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {itineraries.map((cruise) => {
                const days = calcDaysUntil(cruise.departureDate);
                const isSailing = days < 0 && calcDaysUntil(cruise.returnDate) >= 0;
                const isExpanded = expandedId === cruise.id;
                return (
                  <div key={cruise.id} className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-800 text-lg leading-tight">🚢 {cruise.shipName}</p>
                          <p className="text-sm text-gray-500 mt-1">{formatDate(cruise.departureDate)} → {formatDate(cruise.returnDate)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">기항지 {cruise.ports.length}곳</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${isSailing ? 'bg-green-100 text-green-700' : days === 0 ? 'bg-yellow-100 text-yellow-700' : days > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {isSailing ? '항해 중' : days === 0 ? '오늘 출항!' : days > 0 ? `D-${days}` : '완료'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => setExpandedId(isExpanded ? null : cruise.id)} className="flex-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1.5 rounded-xl transition">
                          {isExpanded ? '접기' : '일정 보기'}
                        </button>
                        <button onClick={() => handleShare(cruise)} className="text-sm bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium px-4 py-1.5 rounded-xl transition">공유</button>
                        <button onClick={() => deleteItinerary(cruise.id)} className="text-sm bg-red-50 hover:bg-red-100 text-red-500 font-medium px-4 py-1.5 rounded-xl transition">삭제</button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-5 pb-5 pt-3 bg-slate-50">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">기항지 일정</p>
                        <ul className="space-y-2">
                          {cruise.ports.map((port, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <span className="text-blue-400 font-bold text-xs mt-0.5 w-4 shrink-0">{i + 1}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{port.portName || 'Sea Day'}</p>
                                <p className="text-xs text-gray-400">{formatDate(port.date)}</p>
                                {port.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{port.notes}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {shareMsg && <div className="mt-3 text-center text-sm text-violet-700 bg-violet-50 rounded-xl py-2 px-4 font-medium">{shareMsg}</div>}
        </section>

        {/* 등록 폼 */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3">새 크루즈 등록</h2>
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">선명 (Ship Name) <span className="text-red-400">*</span></label>
                <input type="text" value={shipName} onChange={(e) => setShipName(e.target.value)} placeholder="예: MSC Seashore, Royal Caribbean Symphony..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">출발일 <span className="text-red-400">*</span></label>
                  <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">귀항일 <span className="text-red-400">*</span></label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">기항지 추가</label>
                  <button type="button" onClick={() => setPorts((p) => [...p, emptyPort()])} className="text-xs text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition">+ 기항지 추가</button>
                </div>
                <div className="space-y-3">
                  {ports.map((port, index) => (
                    <div key={index} className="border border-gray-100 rounded-xl p-3 bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-500 w-5">{index + 1}</span>
                        <select value={port.portName} onChange={(e) => handlePortChange(index, 'portName', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                          {PORT_OPTIONS.map((opt) => <option key={opt.label} value={opt.label}>{opt.label}</option>)}
                        </select>
                        {ports.length > 1 && <button type="button" onClick={() => setPorts((p) => p.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>}
                      </div>
                      <div className="flex gap-2 pl-7">
                        <input type="date" value={port.date} onChange={(e) => handlePortChange(index, 'date', e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                        <input type="text" value={port.notes || ''} onChange={(e) => handlePortChange(index, 'notes', e.target.value)} placeholder="메모 (선택)" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {formError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{formError}</p>}
              {formSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2 font-medium">{formSuccess}</p>}
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold py-3 rounded-2xl shadow-md transition text-sm">
                크루즈 일정 저장
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
