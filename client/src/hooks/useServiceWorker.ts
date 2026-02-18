import { useEffect, useState } from 'react';

// Check if we're in development mode
// Note: .replit.app is production (deployed), .replit.dev is development preview
// We want service worker enabled for .replit.app (published apps) but not for local dev
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';
const isReplitDevPreview = window.location.hostname.includes('.replit.dev');
const isVercel = window.location.hostname.includes('.vercel.app');

// Enable service worker in production, on replit.app, or on vercel.app
const shouldEnableServiceWorker = !isDevelopment && !isReplitDevPreview;

export function useServiceWorker() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // In development mode or Replit dev preview, unregister service workers to prevent HMR issues
    if (!shouldEnableServiceWorker && 'serviceWorker' in navigator) {
      console.log('[SW] Development/preview mode detected - cleaning up service workers and caches');
      console.log('[SW] Hostname:', window.location.hostname);

      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('[SW] Unregistered service worker:', registration.scope);
        });
      });

      // Clear all caches
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName);
            console.log('[SW] Deleted cache:', cacheName);
          });
        });
      }

      return; // Don't register service worker in development/preview
    }

    // Production mode - wait for service worker to be ready (registered by pwa.ts)
    if ('serviceWorker' in navigator && shouldEnableServiceWorker) {
      navigator.serviceWorker.ready.then((reg) => {
        console.log('[SW] Service worker ready:', reg);
        setRegistration(reg);

        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000); // Check every hour
      });

      // Listen for controller change (meaning a new SW has taken over)
      // This happens after skipWaiting() is called
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          // We don't auto-reload here to avoid loops, just log it
          console.log('[SW] Controller changed - update completed');
        }
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    isUpdateAvailable,
    updateServiceWorker,
    registration
  };
}
