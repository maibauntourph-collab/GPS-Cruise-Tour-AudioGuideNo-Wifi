const CACHE_VERSION = 'gps-audio-guide-v5-fresh';
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
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then(async (cache) => {
        console.log('[Service Worker] Pre-caching API data');
        const cities = ['rome', 'paris', 'london'];
        
        try {
          await cache.add('/api/cities');
          
          for (const cityId of cities) {
            try {
              await cache.add(`/api/landmarks?cityId=${cityId}`);
              console.log(`[Service Worker] Cached landmarks for ${cityId}`);
            } catch (err) {
              console.warn(`[Service Worker] Failed to cache ${cityId}:`, err.message);
            }
          }
        } catch (err) {
          console.warn('[Service Worker] Failed to pre-cache API data:', err.message);
        }
      })
    ]).then(() => self.skipWaiting())
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
  const url = new URL(request.url);
  
  // NEVER cache JavaScript/TypeScript files - they need HMR to work properly
  const isJavaScriptFile = url.pathname.endsWith('.js') || 
                           url.pathname.endsWith('.jsx') || 
                           url.pathname.endsWith('.ts') || 
                           url.pathname.endsWith('.tsx') ||
                           url.pathname.includes('/src/') ||
                           url.pathname.includes('/@vite/') ||
                           url.pathname.includes('/@fs/') ||
                           url.pathname.includes('/node_modules/');
  
  if (isJavaScriptFile) {
    // Always fetch fresh for JS files - no caching!
    return fetch(request);
  }
  
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
    console.log('[Service Worker] Error:', error.message);
    const cached = await caches.match(request);
    
    if (cached) {
      console.log('[Service Worker] Serving cached API response');
      return cached;
    }
    
    console.log('[Service Worker] No cache found, using fallback data');
    
    if (url.pathname.includes('/cities')) {
      return new Response(JSON.stringify([
        { id: 'rome', name: 'Rome', country: 'Italy', lat: 41.8902, lng: 12.4922, zoom: 13 },
        { id: 'paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, zoom: 13 },
        { id: 'london', name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, zoom: 13 }
      ]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname.includes('/landmarks')) {
      const searchParams = new URLSearchParams(url.search);
      const cityId = searchParams.get('cityId') || 'rome';
      
      const fallbackLandmarks = {
        rome: [
          { id: 'colosseum', cityId: 'rome', name: 'Colosseum', lat: 41.8902, lng: 12.4922, radius: 70, category: 'Historical', description: 'The largest amphitheater ever built', narration: 'You are near the Colosseum, the largest amphitheater ever built.' },
          { id: 'roman-forum', cityId: 'rome', name: 'Roman Forum', lat: 41.8925, lng: 12.4853, radius: 60, category: 'Historical', description: 'The center of ancient Roman public life', narration: 'You are near the Roman Forum.' },
          { id: 'trevi-fountain', cityId: 'rome', name: 'Trevi Fountain', lat: 41.9009, lng: 12.4833, radius: 50, category: 'Monument', description: 'A stunning 18th-century Baroque fountain', narration: 'You are near the Trevi Fountain.' },
          { id: 'pantheon', cityId: 'rome', name: 'Pantheon', lat: 41.8986, lng: 12.4768, radius: 50, category: 'Historical', description: 'A former Roman temple, now a church', narration: 'You are near the Pantheon.' },
          { id: 'spanish-steps', cityId: 'rome', name: 'Spanish Steps', lat: 41.9059, lng: 12.4823, radius: 50, category: 'Monument', description: 'A monumental stairway of 135 steps', narration: 'You are near the Spanish Steps.' }
        ],
        paris: [
          { id: 'eiffel-tower', cityId: 'paris', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, radius: 70, category: 'Monument', description: 'The iconic iron lattice tower', narration: 'You are near the Eiffel Tower.' },
          { id: 'louvre', cityId: 'paris', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, radius: 60, category: 'Museum', description: 'The world\'s largest art museum', narration: 'You are near the Louvre Museum.' },
          { id: 'notre-dame', cityId: 'paris', name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499, radius: 50, category: 'Historical', description: 'A medieval Catholic cathedral', narration: 'You are near Notre-Dame Cathedral.' },
          { id: 'arc-de-triomphe', cityId: 'paris', name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950, radius: 50, category: 'Monument', description: 'A monumental arch', narration: 'You are near the Arc de Triomphe.' }
        ],
        london: [
          { id: 'big-ben', cityId: 'london', name: 'Big Ben', lat: 51.5007, lng: -0.1246, radius: 50, category: 'Monument', description: 'The iconic clock tower', narration: 'You are near Big Ben.' },
          { id: 'tower-bridge', cityId: 'london', name: 'Tower Bridge', lat: 51.5055, lng: -0.0754, radius: 60, category: 'Historical', description: 'A combined bascule and suspension bridge', narration: 'You are near Tower Bridge.' },
          { id: 'buckingham-palace', cityId: 'london', name: 'Buckingham Palace', lat: 51.5014, lng: -0.1419, radius: 70, category: 'Historical', description: 'The official residence of the British monarch', narration: 'You are near Buckingham Palace.' },
          { id: 'london-eye', cityId: 'london', name: 'London Eye', lat: 51.5033, lng: -0.1196, radius: 50, category: 'Monument', description: 'A giant Ferris wheel', narration: 'You are near the London Eye.' }
        ]
      };
      
      const landmarks = fallbackLandmarks[cityId] || fallbackLandmarks.rome;
      
      return new Response(JSON.stringify(landmarks), {
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
