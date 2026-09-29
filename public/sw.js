/* global self, caches */
const CACHE_VERSION = 'bwm-kul-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/pwa/icon-192.png',
  '/images/pwa/icon-512.png',
];

async function precacheShell() {
  const cache = await caches.open(CACHE_VERSION);
  await cache.addAll(APP_SHELL);

  try {
    const response = await fetch('/index.html');
    const html = await response.text();
    const assetPaths = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"'?#]+[^"']*)["']/g)]
      .map((match) => match[1]);

    if (assetPaths.length) {
      await cache.addAll([...new Set(assetPaths)]);
    }
  } catch {
    // Runtime caching still captures same-origin assets after the worker takes control.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    precacheShell().then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
