export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

import { Landmark } from '@shared/schema';

export function checkProximity(
  lat: number,
  lng: number,
  landmarks: Landmark[],
  spokenLandmarks: Set<string>,
  threshold: number = 30
): { landmark: Landmark; distance: number } | null {
  let nearest: { landmark: Landmark; distance: number } | null = null;
  let minDistance = Infinity;

  for (const landmark of landmarks) {
    if (spokenLandmarks.has(landmark.id)) continue;

    const distance = calculateDistance(lat, lng, landmark.lat, landmark.lng);
    if (distance <= threshold && distance < minDistance) {
      minDistance = distance;
      nearest = { landmark, distance };
    }
  }

  return nearest;
}
