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

    // Production mode - register service worker
    if ('serviceWorker' in navigator && shouldEnableServiceWorker) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('[SW] Service worker registered:', reg);
          setRegistration(reg);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] Update available');
                  setIsUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service worker registration failed:', error);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          // Prevent infinite loop by not reloading automatically
          // Instead, we just let the user know via the update prompt
          console.log('[SW] Controller changed, update ready');
          // window.location.reload(); 
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
