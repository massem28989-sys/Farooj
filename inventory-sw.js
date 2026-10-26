// Service worker لتطبيق الفروع — النسخة دي بتجيب صفحة التطبيق من السيرفر الأول دايمًا (network-first)
// عشان أي تحديث تنزّله على GitHub يوصل الفروع على طول. لو مفيش نت، بتفتح آخر نسخة محفوظة.
// غيّر الرقم ده بس لو حبيت تمسح الكاش القديم كله عند الفروع.
const CACHE = 'farooj-branches-2026-10-26';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Google Script والخطوط وغيرهم بيروحوا للنت عادي

  // صفحة التطبيق نفسها: من السيرفر الأول، والكاش احتياطي لو النت قاطع
  if (req.mode === 'navigate' || req.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./')))
    );
    return;
  }

  // الصور والأيقونات والـ manifest: من الكاش لو موجودة، وبتتحدث في الخلفية
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
        .catch(() => hit);
      return hit || net;
    })
  );
});
