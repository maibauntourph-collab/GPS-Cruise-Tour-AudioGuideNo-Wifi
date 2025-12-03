import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/leaflet-custom.css";

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: any;
    __REACT_INSTANCE_SET__: boolean;
    __REACT_ROOT__: ReactDOM.Root | null;
  }
}

if (typeof window !== 'undefined') {
  if (!window.__REACT_INSTANCE_SET__) {
    window.React = React;
    window.ReactDOM = ReactDOM;
    window.__REACT_INSTANCE_SET__ = true;
  }
  
  const isDev = import.meta.env.DEV || window.location.hostname.includes('.replit.dev');
  if (isDev && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
    
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes('gps-audio-guide')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  if (!window.__REACT_ROOT__) {
    window.__REACT_ROOT__ = ReactDOM.createRoot(rootElement);
  }
  window.__REACT_ROOT__.render(<App />);
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
