import { useEffect, useState } from 'react';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('.replit.dev');

export function useServiceWorker() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // In development mode, unregister all service workers and clear caches to prevent HMR issues
    if (isDevelopment && 'serviceWorker' in navigator) {
      console.log('[SW] Development mode detected - cleaning up service workers and caches');
      
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
      
      return; // Don't register service worker in development
    }

    // Production mode - register service worker
    if ('serviceWorker' in navigator && !isDevelopment) {
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
          window.location.reload();
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
