const CACHE_VERSION = 'gps-audio-guide-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MAP_TILES_CACHE = `${CACHE_VERSION}-map-tiles`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.jpg',
  '/icon-512.jpg'
];

const MAP_TILE_ORIGINS = [
  'https://tile.openstreetmap.org',
  'https://a.tile.openstreetmap.org',
  'https://b.tile.openstreetmap.org',
  'https://c.tile.openstreetmap.org'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('gps-audio-guide-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== MAP_TILES_CACHE && name !== API_CACHE)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (MAP_TILE_ORIGINS.some(origin => request.url.startsWith(origin))) {
    event.respondWith(handleMapTileRequest(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  event.respondWith(handleDynamicRequest(request));
});

async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Static request failed:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

async function handleMapTileRequest(request) {
  try {
    const cache = await caches.open(MAP_TILES_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] Map tile request failed:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    return new Response('Map tile unavailable', { 
      status: 503,
      statusText: 'Service Unavailable' 
    });
  }
}

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/visited') && request.method === 'POST') {
    return fetch(request);
  }

  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[Service Worker] API request failed, trying cache:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      console.log('[Service Worker] Serving cached API response');
      return cached;
    }
    
    if (url.pathname.includes('/cities')) {
      return new Response(JSON.stringify([
        { id: 'rome', name: 'Rome', country: 'Italy' },
        { id: 'paris', name: 'Paris', country: 'France' },
        { id: 'london', name: 'London', country: 'United Kingdom' }
      ]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
