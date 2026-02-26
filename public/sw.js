const CACHE_NAME = 'workout-tracker-v2';
const GIPHY_ORIGIN = 'https://api.giphy.com';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for Giphy API
  if (url.origin === GIPHY_ORIGIN) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ data: null }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Cache-first for same-origin assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (request.method === 'GET' && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        }).catch(() => {
          // Navigation fallback: serve whatever is cached for the app root
          if (request.mode === 'navigate') {
            return caches.match(self.registration.scope) ||
                   caches.match(self.registration.scope + 'index.html');
          }
        });
      })
    );
  }
});
