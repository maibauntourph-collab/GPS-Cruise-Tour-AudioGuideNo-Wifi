import React, { useState, useEffect } from 'react';

interface CruiseItinerary {
  id: string;
  shipName: string;
  departureDate: string;
  returnDate: string;
}

const STORAGE_KEY = 'myCruiseItineraries';

function loadItineraries(): CruiseItinerary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CruiseItinerary[];
  } catch { return []; }
}

function calcDaysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

type WidgetState =
  | { kind: 'none' }
  | { kind: 'today'; shipName: string }
  | { kind: 'sailing'; shipName: string }
  | { kind: 'countdown'; days: number; shipName: string };

function getWidgetState(itineraries: CruiseItinerary[]): WidgetState {
  if (itineraries.length === 0) return { kind: 'none' };
  const sorted = [...itineraries].sort(
    (a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
  );
  for (const cruise of sorted) {
    const daysUntilDeparture = calcDaysUntil(cruise.departureDate);
    const daysUntilReturn = calcDaysUntil(cruise.returnDate);
    if (daysUntilDeparture === 0) return { kind: 'today', shipName: cruise.shipName };
    if (daysUntilDeparture < 0 && daysUntilReturn >= 0) return { kind: 'sailing', shipName: cruise.shipName };
    if (daysUntilDeparture > 0) return { kind: 'countdown', days: daysUntilDeparture, shipName: cruise.shipName };
  }
  return { kind: 'none' };
}

export default function CountdownWidget() {
  const [state, setState] = useState<WidgetState>({ kind: 'none' });

  useEffect(() => {
    const itineraries = loadItineraries();
    setState(getWidgetState(itineraries));
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const timer = setTimeout(() => setState(getWidgetState(loadItineraries())), msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  if (state.kind === 'none') {
    return (
      <a href="/my-cruise" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-md transition">
        <span>🚢</span>
        <span>크루즈 일정 등록 →</span>
      </a>
    );
  }

  if (state.kind === 'today') {
    return (
      <a href="/my-cruise" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2.5 rounded-2xl shadow-md transition">
        <span className="text-lg">🎉</span>
        <div className="text-left leading-tight">
          <p className="text-xs font-medium opacity-90">{state.shipName}</p>
          <p className="text-sm font-extrabold tracking-tight">오늘 출항!</p>
        </div>
      </a>
    );
  }

  if (state.kind === 'sailing') {
    return (
      <a href="/my-cruise" className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2.5 rounded-2xl shadow-md transition">
        <span className="text-lg animate-pulse">⚓</span>
        <div className="text-left leading-tight">
          <p className="text-xs font-medium opacity-90">{state.shipName}</p>
          <p className="text-sm font-extrabold tracking-tight">항해 중</p>
        </div>
      </a>
    );
  }

  return (
    <a href="/my-cruise" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-4 py-2.5 rounded-2xl shadow-md transition">
      <span className="text-lg">🚢</span>
      <div className="text-left leading-tight">
        <p className="text-xs font-medium opacity-80 truncate max-w-[120px]">{state.shipName}</p>
        <p className="text-sm font-extrabold tracking-tight">D-<span className="text-base">{state.days}</span></p>
      </div>
    </a>
  );
}
