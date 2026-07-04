const CACHE_NAME = 'app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install Event - cache the core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core assets during install');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error('[Service Worker] Error caching core assets:', err);
      });
    })
  );
  // Force active immediately
  self.skipWaiting();
});

// Activate Event - clean up obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - cache-first with network fallback for assets, network-first with cache fallback for HTML pages
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip dev server socket/HMR connections, API calls, and Google Maps API to avoid caching third-party or dynamic assets
  if (
    url.pathname.includes('/api/') || 
    url.hostname.includes('maps.googleapis.com') ||
    (url.hostname.includes('localhost') && url.port === '3000' && (url.pathname.includes('ws') || url.pathname.includes('vite')))
  ) {
    return;
  }

  // 1. If it's a document/page navigation request (e.g. going to /settings), use a Network First strategy
  // falling back to cached /index.html (the SPA entry point) if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[Service Worker] Navigation request failed; serving SPA fallback');
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. For static assets (CSS, JS, images, fonts), search the cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to keep the cache warm/updated for future loads
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignore background network errors
        });
        return cachedResponse;
      }

      // If not in cache, fallback to network and then cache it
      return fetch(event.request).then((networkResponse) => {
        // Cache basic dynamic assets if status is OK
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[Service Worker] Resource not available in cache offline:', event.request.url);
        throw err;
      });
    })
  );
});
