const APP_CACHE = 'mama-wrap-cache-2026-07-18-delivery-toggle-1';
const CORE_ASSETS = [
  './',
  './index.html',
  './tracking.html',
  './style.css',
  './manifest.json'
];

try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (e) {
  // Push SDK is optional; the ordering app must still work if it cannot load.
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => Promise.all(
        CORE_ASSETS.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
        )
      ))
      .catch(() => undefined)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== APP_CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(response => {
          const copy = response.clone();
          caches.open(APP_CACHE).then(cache => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(req)
      .then(response => {
        const copy = response.clone();
        caches.open(APP_CACHE).then(cache => cache.put(req, copy));
        return response;
      })
      .catch(() => caches.match(req))
  );
});
