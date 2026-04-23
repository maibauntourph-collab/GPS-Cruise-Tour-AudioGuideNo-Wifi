/**
 * WeatherWidget — Open-Meteo 날씨 위젯
 *
 * 현재 날씨 + 7일 예보 가로 스크롤 카드
 * ThingsToDoSection.tsx 패턴 미러링
 */

import React, { useEffect, useState, useRef } from 'react';
import { Wind, Droplets, ChevronLeft, ChevronRight } from 'lucide-react';

const I18N: Record<string, Record<string, string>> = {
  ko: {
    sectionTitle: '🌤️ 현재 날씨',
    humidity:     '습도',
    wind:         '바람',
    offline:      '날씨 정보는 온라인에서 확인 가능합니다',
    loading:      '날씨를 불러오는 중...',
    error:        '날씨 정보를 불러올 수 없습니다',
    celsius:      '°C',
    kmh:          'km/h',
    percent:      '%',
    poweredBy:    '날씨 정보 제공',
  },
  en: {
    sectionTitle: '🌤️ Current Weather',
    humidity:     'Humidity',
    wind:         'Wind',
    offline:      'Weather info is available online',
    loading:      'Loading weather...',
    error:        'Weather unavailable',
    celsius:      '°C',
    kmh:          'km/h',
    percent:      '%',
    poweredBy:    'Weather data',
  },
};

function t(lang: string, key: string): string {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  emoji: string;
}

interface WeatherData {
  city: string;
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    emoji: string;
    description: string;
  };
  daily: DailyForecast[];
  unit: 'celsius';
}

interface Props {
  city: string;
  language?: string;
}

export default function WeatherWidget({ city, language = 'en' }: Props) {
  const lang = I18N[language] ? language : 'en';
  const [weather, setWeather]   = useState<WeatherData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cacheRef  = useRef<Map<string, WeatherData>>(new Map());

  useEffect(() => {
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online',  up);
      window.removeEventListener('offline', down);
    };
  }, []);

  useEffect(() => {
    if (!city) return;
    const key = city.toLowerCase();
    if (cacheRef.current.has(key)) {
      setWeather(cacheRef.current.get(key)!);
      setLoading(false);
      return;
    }
    if (!isOnline) { setLoading(false); return; }

    let cancelled = false;
    async function fetchWeather() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/weather/${encodeURIComponent(key)}`);
        if (!res.ok) throw new Error('fetch failed');
        const data: WeatherData = await res.json();
        if (!cancelled) {
          setWeather(data);
          cacheRef.current.set(key, data);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWeather();
    return () => { cancelled = true; };
  }, [city, isOnline]);

  if (!isOnline && !weather) {
    return (
      <div className="mt-4 mb-2 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3">
        <p className="text-[12px] text-sky-500 text-center">{t(lang, 'offline')}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 mb-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {t(lang, 'sectionTitle')}
        </h3>
        <span className="text-[9px] text-gray-300">{t(lang, 'poweredBy')}</span>
      </div>

      {loading ? (
        <SkeletonWeather />
      ) : error || !weather ? (
        <ErrorState lang={lang} />
      ) : (
        <>
          <CurrentWeatherCard weather={weather} lang={lang} />
          <div className="mt-3 relative group">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto pb-1 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
            >
              {weather.daily.map((day, idx) => (
                <DayCard key={idx} day={day} unit={t(lang, 'celsius')} />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-1.5 mt-2">
        <span className="text-[9px] text-gray-300">{t(lang, 'poweredBy')}</span>
        <span className="text-[9px] font-bold text-sky-400/70">Open-Meteo</span>
      </div>
    </div>
  );
}

function CurrentWeatherCard({ weather, lang }: { weather: WeatherData; lang: string }) {
  const { current } = weather;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 px-4 py-4 text-white shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none" role="img" aria-label={current.description}>
            {current.emoji}
          </span>
          <div>
            <p className="text-4xl font-extrabold leading-none">
              {current.temp}<span className="text-2xl font-bold">°C</span>
            </p>
            <p className="text-[13px] text-sky-100 mt-0.5">{current.description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-right">
          <div className="flex items-center justify-end gap-1 text-[12px] text-sky-100">
            <Droplets className="w-3.5 h-3.5" />
            <span>{current.humidity}{t(lang, 'percent')}</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-[12px] text-sky-100">
            <Wind className="w-3.5 h-3.5" />
            <span>{current.windSpeed} {t(lang, 'kmh')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayCard({ day, unit }: { day: DailyForecast; unit: string }) {
  return (
    <div className="flex-shrink-0 w-16 rounded-xl bg-white border border-sky-100 shadow-sm text-center py-2.5 px-1">
      <p className="text-[10px] font-semibold text-gray-500">{day.date}</p>
      <p className="text-2xl my-1 leading-none" role="img">{day.emoji}</p>
      <p className="text-[11px] font-bold text-gray-800">{day.maxTemp}{unit}</p>
      <p className="text-[10px] text-gray-400">{day.minTemp}{unit}</p>
    </div>
  );
}

function SkeletonWeather() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="rounded-2xl bg-gray-100 h-24" />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="flex-shrink-0 w-16 rounded-xl bg-gray-100 h-20" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ lang }: { lang: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-4 flex items-center gap-3">
      <span className="text-3xl">🌡️</span>
      <p className="text-[12px] text-sky-500">{t(lang, 'error')}</p>
    </div>
  );
}
