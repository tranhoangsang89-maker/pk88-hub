// PK88 PWA Service Worker - v2 (Auto-clean old cache)
const CACHE_NAME = 'pk88-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Đối với navigation (tải trang HTML), luôn luôn ưu tiên lấy mạng mới nhất
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network first fallback to cache
  event.respondWith(
    fetch(event.request).then((response) => {
      return response;
    }).catch(() => caches.match(event.request))
  );
});
