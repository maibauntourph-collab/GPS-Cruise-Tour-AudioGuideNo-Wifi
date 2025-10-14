/**
 * Device Performance Detection Utilities
 * Detects low-end devices to apply performance optimizations
 */

export interface DeviceCapabilities {
  isLowEnd: boolean;
  memory?: number; // GB
  cores?: number;
  connectionType?: string;
  isMobile: boolean;
}

/**
 * Detects if the device is low-end based on hardware capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check device memory (in GB)
  const memory = (navigator as any).deviceMemory;
  
  // Check CPU cores
  const cores = navigator.hardwareConcurrency;
  
  // Check network connection type
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionType = connection?.effectiveType;
  
  // Determine if device is low-end
  // Low-end criteria:
  // - Memory <= 2GB OR
  // - CPU cores <= 2 OR
  // - Slow connection (2g or slow-2g)
  const isLowEnd = (
    (memory !== undefined && memory <= 2) ||
    (cores !== undefined && cores <= 2) ||
    (connectionType === '2g' || connectionType === 'slow-2g')
  );
  
  return {
    isLowEnd,
    memory,
    cores,
    connectionType,
    isMobile
  };
}

/**
 * Get optimized image quality based on device capabilities
 */
export function getOptimizedImageQuality(isLowEnd: boolean, isMobile: boolean): number {
  if (isLowEnd) return 50; // Low quality for low-end devices
  if (isMobile) return 75; // Medium quality for mobile
  return 90; // High quality for desktop
}

/**
 * Get maximum number of map markers to render based on device capabilities
 */
export function getMaxMarkersToRender(isLowEnd: boolean): number {
  if (isLowEnd) return 20; // Limit markers on low-end devices
  return 100; // Show all markers on high-end devices
}

/**
 * Check if animations should be reduced
 */
export function shouldReduceAnimations(isLowEnd: boolean): boolean {
  // Also check user's system preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return isLowEnd || prefersReducedMotion;
}

/**
 * Get map tile quality based on device capabilities
 */
export function getMapTileQuality(isLowEnd: boolean): string {
  // Return different tile server or quality parameter
  if (isLowEnd) {
    return 'low'; // Lower quality tiles
  }
  return 'high'; // Standard quality tiles
}
