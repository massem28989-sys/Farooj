const CACHE_NAME = 'inventory-cache-v2';
const APP_SHELL = [
  './index.html',
  './inventory-manifest.json',
  './inventory-icon-192.png',
  './inventory-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first لملف الصفحة نفسها بس (الشكل العام)، وأي حاجة تانية (زي طلبات قاعدة البيانات أو مكتبات خارجية) تتجاهل وتروح للنت مباشرة
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAppShellRequest = url.origin === self.location.origin;
  if (!isAppShellRequest || event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
