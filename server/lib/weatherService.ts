/**
 * Weather Service — Open-Meteo API (무료, API 키 불필요)
 *
 * 크루즈 기항지의 현재 날씨와 7일 예보를 제공하는 서비스
 * API Docs: https://open-meteo.com/en/docs
 */

const CITY_COORDS: Record<string, [number, number]> = {
  rome:         [41.9028,  12.4964],
  barcelona:    [41.3851,   2.1734],
  naples:       [40.8518,  14.2681],
  athens:       [37.9838,  23.7275],
  venice:       [45.4408,  12.3155],
  lisbon:       [38.7169,  -9.1399],
  dubrovnik:    [42.6507,  18.0944],
  santorini:    [36.3932,  25.4615],
  amsterdam:    [52.3676,   4.9041],
  stockholm:    [59.3293,  18.0686],
  copenhagen:   [55.6761,  12.5683],
  cozumel:      [20.5083, -86.9458],
  nassau:       [25.0343, -77.3963],
  juneau:       [58.3005, -134.4197],
  ketchikan:    [55.3422, -131.6461],
  singapore:    [ 1.3521, 103.8198],
  tokyo:        [35.6762, 139.6503],
  miami:        [25.7617, -80.1918],
  new_york:     [40.7128, -74.0060],
};

function decodeWeatherCode(code: number): { emoji: string; description: string } {
  if (code === 0)                return { emoji: '☀️',  description: 'Clear sky' };
  if (code === 1)                return { emoji: '🌤️', description: 'Mainly clear' };
  if (code === 2)                return { emoji: '🌥️', description: 'Partly cloudy' };
  if (code === 3)                return { emoji: '☁️',  description: 'Overcast' };
  if (code === 45 || code === 48) return { emoji: '🌫️', description: 'Fog' };
  if (code >= 51 && code <= 55)  return { emoji: '🌦️', description: 'Drizzle' };
  if (code >= 61 && code <= 65)  return { emoji: '🌧️', description: 'Rain' };
  if (code >= 71 && code <= 75)  return { emoji: '❄️',  description: 'Snow' };
  if (code >= 80 && code <= 82)  return { emoji: '🌧️', description: 'Rain showers' };
  if (code === 95)               return { emoji: '⛈️', description: 'Thunderstorm' };
  if (code === 99)               return { emoji: '⛈️', description: 'Heavy thunderstorm' };
  return { emoji: '🌡️', description: 'Unknown' };
}

function toDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(`${dateStr}T00:00:00Z`);
  return days[d.getUTCDay()];
}

export interface WeatherData {
  city: string;
  current: {
    temp: number;
    feelsLike?: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    emoji: string;
    description: string;
  };
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    emoji: string;
  }>;
  unit: 'celsius';
}

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

export async function getWeatherByCity(city: string): Promise<WeatherData> {
  const normalized = city.toLowerCase().replace(/\s+/g, '_');
  const coords = CITY_COORDS[normalized];
  if (!coords) throw new Error(`[WeatherService] 지원하지 않는 도시: ${city}`);

  const [lat, lon] = coords;
  const params = new URLSearchParams({
    latitude:      String(lat),
    longitude:     String(lon),
    current:       'temperature_2m,weathercode,windspeed_10m,relative_humidity_2m',
    daily:         'weathercode,temperature_2m_max,temperature_2m_min',
    timezone:      'auto',
    forecast_days: '7',
  });

  const response = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`[WeatherService] Open-Meteo 오류 ${response.status}: ${errText}`);
  }

  const raw = await response.json() as any;
  const cur     = raw.current || {};
  const curCode = cur.weathercode ?? 0;
  const curDec  = decodeWeatherCode(curCode);

  const current: WeatherData['current'] = {
    temp:        Math.round(cur.temperature_2m       ?? 0),
    humidity:    Math.round(cur.relative_humidity_2m ?? 0),
    windSpeed:   Math.round(cur.windspeed_10m        ?? 0),
    weatherCode: curCode,
    emoji:       curDec.emoji,
    description: curDec.description,
  };

  const d      = raw.daily || {};
  const dates:    string[] = d.time                ?? [];
  const maxTemps: number[] = d.temperature_2m_max  ?? [];
  const minTemps: number[] = d.temperature_2m_min  ?? [];
  const codes:    number[] = d.weathercode          ?? [];

  const daily: WeatherData['daily'] = dates.map((ds: string, i: number) => {
    const wc  = codes[i] ?? 0;
    const dec = decodeWeatherCode(wc);
    return {
      date:    toDayLabel(ds),
      maxTemp: Math.round(maxTemps[i] ?? 0),
      minTemp: Math.round(minTemps[i] ?? 0),
      weatherCode: wc,
      emoji: dec.emoji,
    };
  });

  return { city: normalized, current, daily, unit: 'celsius' };
}

export function getSupportedCities(): string[] {
  return Object.keys(CITY_COORDS);
}
