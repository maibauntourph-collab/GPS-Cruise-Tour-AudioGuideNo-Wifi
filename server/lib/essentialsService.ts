/**
 * Cruise Essentials Service — OpenStreetMap Overpass API (무료)
 *
 * 크루즈 기항지 주변 ATM, 약국, 병원, 경찰서 등 필수 시설 검색
 * API: https://overpass-api.de
 */

export type EssentialCategory = 'atm' | 'pharmacy' | 'hospital' | 'police' | 'wifi' | 'info' | 'toilet';

export interface Essential {
  id: string;
  name: string;
  category: EssentialCategory;
  emoji: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  distance?: number;
  googleMapsUrl: string;
}

const CITY_COORDS: Record<string, { lat: number; lon: number; radius: number }> = {
  rome:       { lat: 41.9028,  lon: 12.4964,   radius: 2000 },
  barcelona:  { lat: 41.3851,  lon: 2.1734,    radius: 2000 },
  naples:     { lat: 40.8518,  lon: 14.2681,   radius: 2000 },
  athens:     { lat: 37.9838,  lon: 23.7275,   radius: 2000 },
  venice:     { lat: 45.4408,  lon: 12.3155,   radius: 1000 },
  lisbon:     { lat: 38.7169,  lon: -9.1399,   radius: 2000 },
  dubrovnik:  { lat: 42.6507,  lon: 18.0944,   radius: 1000 },
  santorini:  { lat: 36.3932,  lon: 25.4615,   radius: 2000 },
  amsterdam:  { lat: 52.3676,  lon: 4.9041,    radius: 2000 },
  juneau:     { lat: 58.3005,  lon: -134.4197, radius: 2000 },
  singapore:  { lat: 1.3521,   lon: 103.8198,  radius: 3000 },
  tokyo:      { lat: 35.6762,  lon: 139.6503,  radius: 3000 },
  cozumel:    { lat: 20.5083,  lon: -86.9458,  radius: 2000 },
  nassau:     { lat: 25.0343,  lon: -77.3963,  radius: 2000 },
};

const CATEGORY_EMOJI: Record<EssentialCategory, string> = {
  atm: '💰', pharmacy: '💊', hospital: '🏥', police: '🚔',
  wifi: '📶', info: 'ℹ️', toilet: '🚻',
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function resolveCategory(tags: Record<string, string>): EssentialCategory | null {
  if (tags.amenity === 'atm' || tags.amenity === 'bank') return 'atm';
  if (tags.amenity === 'pharmacy')                        return 'pharmacy';
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic') return 'hospital';
  if (tags.amenity === 'police')                          return 'police';
  if (tags.amenity === 'toilets')                         return 'toilet';
  if (tags.tourism === 'information')                     return 'info';
  return null;
}

function buildOverpassQuery(lat: number, lon: number, radius: number): string {
  const around = `(around:${radius},${lat},${lon})`;
  return `[out:json][timeout:25];(node[amenity=atm]${around};node[amenity=bank][atm=yes]${around};node[amenity=pharmacy]${around};node[amenity=hospital]${around};node[amenity=clinic]${around};node[amenity=police]${around};node[amenity=toilets]${around};node[tourism=information]${around};);out body 100;`;
}

interface OverpassElement {
  id: number; lat: number; lon: number; tags?: Record<string, string>;
}

function parseOverpassResult(elements: OverpassElement[], cityLat: number, cityLon: number): Essential[] {
  const seen = new Set<string>();
  const results: Essential[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const category = resolveCategory(tags);
    if (!category) continue;
    const name = tags['name:en'] || tags.name || tags['name:ko'] || (category.charAt(0).toUpperCase() + category.slice(1));
    const key = `${category}:${el.lat.toFixed(4)}:${el.lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const address = [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']].filter(Boolean).join(' ');
    results.push({
      id: String(el.id), name, category, emoji: CATEGORY_EMOJI[category],
      lat: el.lat, lon: el.lon,
      address: address || undefined,
      phone: tags.phone || tags['contact:phone'] || undefined,
      distance: haversineDistance(cityLat, cityLon, el.lat, el.lon),
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&center=${el.lat},${el.lon}`,
    });
  }
  return results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

// 도시별 최소 fallback 데이터
const FALLBACK_DATA: Record<string, Essential[]> = {
  rome: [
    { id: 'fb-rome-atm-1', name: 'UniCredit ATM', category: 'atm', emoji: '💰', lat: 41.9027, lon: 12.4963, distance: 15, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=UniCredit+ATM+Rome' },
    { id: 'fb-rome-atm-2', name: 'Intesa Sanpaolo ATM', category: 'atm', emoji: '💰', lat: 41.9035, lon: 12.4970, distance: 120, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Intesa+ATM+Rome' },
    { id: 'fb-rome-pharm-1', name: 'Farmacia Vaticana', category: 'pharmacy', emoji: '💊', lat: 41.9022, lon: 12.4539, distance: 450, address: 'Via della Conciliazione', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Farmacia+Vaticana+Rome' },
  ],
  barcelona: [
    { id: 'fb-bcn-atm-1', name: 'La Caixa ATM', category: 'atm', emoji: '💰', lat: 41.3850, lon: 2.1733, distance: 20, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=La+Caixa+ATM+Barcelona' },
    { id: 'fb-bcn-atm-2', name: 'Sabadell ATM', category: 'atm', emoji: '💰', lat: 41.3860, lon: 2.1745, distance: 160, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sabadell+ATM+Barcelona' },
    { id: 'fb-bcn-pharm-1', name: 'Farmàcia Clapés', category: 'pharmacy', emoji: '💊', lat: 41.3826, lon: 2.1769, distance: 480, address: 'La Rambla 98, Barcelona', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Farmacia+Clapes+Barcelona' },
  ],
  athens: [
    { id: 'fb-athens-atm-1', name: 'Alpha Bank ATM', category: 'atm', emoji: '💰', lat: 37.9837, lon: 23.7274, distance: 12, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Alpha+Bank+ATM+Athens' },
    { id: 'fb-athens-atm-2', name: 'Eurobank ATM', category: 'atm', emoji: '💰', lat: 37.9845, lon: 23.7282, distance: 140, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Eurobank+ATM+Athens' },
    { id: 'fb-athens-pharm-1', name: 'Φαρμακείο Σύνταγμα', category: 'pharmacy', emoji: '💊', lat: 37.9755, lon: 23.7348, distance: 900, address: 'Syntagma Square', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Pharmacy+Syntagma+Athens' },
  ],
  amsterdam: [
    { id: 'fb-ams-atm-1', name: 'ABN AMRO ATM', category: 'atm', emoji: '💰', lat: 52.3675, lon: 4.9040, distance: 22, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=ABN+AMRO+ATM+Amsterdam' },
    { id: 'fb-ams-atm-2', name: 'ING Bank ATM', category: 'atm', emoji: '💰', lat: 52.3685, lon: 4.9052, distance: 180, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=ING+ATM+Amsterdam' },
    { id: 'fb-ams-pharm-1', name: 'Dam Apotheek', category: 'pharmacy', emoji: '💊', lat: 52.3729, lon: 4.8936, distance: 800, address: 'Dam Square', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dam+Apotheek+Amsterdam' },
  ],
  singapore: [
    { id: 'fb-sgp-atm-1', name: 'DBS ATM', category: 'atm', emoji: '💰', lat: 1.3520, lon: 103.8197, distance: 30, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=DBS+ATM+Singapore' },
    { id: 'fb-sgp-atm-2', name: 'OCBC ATM', category: 'atm', emoji: '💰', lat: 1.3532, lon: 103.8210, distance: 200, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=OCBC+ATM+Singapore' },
    { id: 'fb-sgp-pharm-1', name: 'Guardian Pharmacy', category: 'pharmacy', emoji: '💊', lat: 1.3508, lon: 103.8185, distance: 350, address: 'Orchard Rd', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Guardian+Pharmacy+Singapore' },
  ],
  tokyo: [
    { id: 'fb-tky-atm-1', name: '7-Eleven ATM', category: 'atm', emoji: '💰', lat: 35.6761, lon: 139.6502, distance: 40, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=7-Eleven+ATM+Tokyo' },
    { id: 'fb-tky-atm-2', name: 'Japan Post ATM', category: 'atm', emoji: '💰', lat: 35.6775, lon: 139.6518, distance: 250, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Japan+Post+ATM+Tokyo' },
    { id: 'fb-tky-pharm-1', name: 'Matsumoto Kiyoshi', category: 'pharmacy', emoji: '💊', lat: 35.6748, lon: 139.6488, distance: 380, address: 'Shibuya', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Matsumoto+Kiyoshi+Tokyo' },
  ],
  juneau: [
    { id: 'fb-jun-atm-1', name: 'Wells Fargo ATM', category: 'atm', emoji: '💰', lat: 58.3004, lon: -134.4198, distance: 18, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Wells+Fargo+ATM+Juneau' },
    { id: 'fb-jun-atm-2', name: 'First National Bank ATM', category: 'atm', emoji: '💰', lat: 58.3012, lon: -134.4185, distance: 200, googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=First+National+ATM+Juneau' },
    { id: 'fb-jun-pharm-1', name: 'Juneau Pharmacy', category: 'pharmacy', emoji: '💊', lat: 58.2996, lon: -134.4210, distance: 150, address: 'Franklin St', googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Pharmacy+Juneau+AK' },
  ],
};

export async function getEssentialsByCity(city: string): Promise<Essential[]> {
  const cityKey = city.toLowerCase().trim();
  const coords = CITY_COORDS[cityKey];
  if (!coords) {
    console.warn(`[essentialsService] Unknown city: ${city}`);
    return [];
  }

  const query = buildOverpassQuery(coords.lat, coords.lon, coords.radius);

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);

    const data = await response.json() as { elements: OverpassElement[] };
    if (!data.elements?.length) return FALLBACK_DATA[cityKey] ?? [];

    const parsed = parseOverpassResult(data.elements, coords.lat, coords.lon);
    if (parsed.length < 3) {
      const fallback = FALLBACK_DATA[cityKey] ?? [];
      const merged = [...parsed];
      for (const fb of fallback) {
        if (!merged.find((e) => e.category === fb.category && Math.abs(e.lat - fb.lat) < 0.001)) {
          merged.push(fb);
        }
      }
      return merged.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return parsed;
  } catch (err) {
    console.error(`[essentialsService] Failed for ${city}:`, err);
    return FALLBACK_DATA[cityKey] ?? [];
  }
}
