/**
 * Tour progress storage utilities
 * Exported from StartupDialog for backward compatibility
 */

export interface SavedTourData {
  cityId: string;
  cityName: string;
  tourStops: string[];
  savedAt: string;
}

export function getSavedTourData(): SavedTourData | null {
  const data = localStorage.getItem('saved-tour-progress');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
