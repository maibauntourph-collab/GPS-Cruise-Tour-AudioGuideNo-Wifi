import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/leaflet-custom.css";

// Fix HMR React instance issues by ensuring single React instance globally
if (typeof window !== 'undefined') {
  // Prevent React instance duplication
  if (!(window as any).__REACT_INSTANCE_SET__) {
    (window as any).React = React;
    (window as any).ReactDOM = ReactDOM;
    (window as any).__REACT_INSTANCE_SET__ = true;
  }
  
  // Clean up service workers and caches in development mode
  const isDev = import.meta.env.DEV || window.location.hostname.includes('.replit.dev');
  if (isDev && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('[Main] Unregistered service worker for HMR compatibility');
      });
    });
    
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('gps-audio-guide')) {
            caches.delete(cacheName);
            console.log('[Main] Cleared cache:', cacheName);
          }
        });
      });
    }
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('[Main] Root element not found');
}
