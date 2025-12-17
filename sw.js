const CACHE_NAME = 'sololedger-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './icon.svg',
  './manifest.json'
];

// Install event: Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network first, fall back to cache for external resources
// Stale-while-revalidate strategy could be used, but Network First ensures latest API logic
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests or requests to other origins that we don't want to strictly cache logic for (like API calls if we had a backend)
  // However, for CDN libraries (esm.sh, tailwind), we want to try cache first or stale-while-revalidate if possible.
  // For simplicity and reliability in this dev environment:
  
  const url = new URL(event.request.url);

  // Cache strategy for external libraries (CDN)
  if (url.hostname === 'cdn.tailwindcss.com' || url.hostname === 'esm.sh') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Don't cache bad responses
          if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default strategy for local files: Network First, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});