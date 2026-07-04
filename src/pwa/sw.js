/* global self, caches */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Self-claim and skip waiting
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Clean up outdated caches
cleanupOutdatedCaches();

// Precache all Vite build assets
precacheAndRoute(self.__WB_MANIFEST || []);

// 1. Navigation Route - Offline fallback page
const offlineFallbackHandler = async (params) => {
  try {
    const networkStrategy = new NetworkFirst({
      cacheName: 'bwm-navigation-v1',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [200],
        }),
      ],
    });
    return await networkStrategy.handle(params);
  } catch (error) {
    const cache = await caches.open('workbox-precache');
    const cachedResponse = await cache.match('/offline.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    return Response.error();
  }
};
registerRoute(new NavigationRoute(offlineFallbackHandler));

// 2. Local site images - Cache-first (80 entries, 30 days)
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/images/sites/'),
  new CacheFirst({
    cacheName: 'bwm-site-images-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// 3. /data/sites.json - Network-first (1 entry, 7 days)
registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname === '/data/sites.json',
  new NetworkFirst({
    cacheName: 'bwm-site-data-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 1,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// 4. CARTO map tiles - Cache-first (120 entries, 7 days)
registerRoute(
  ({ url }) => url.hostname.endsWith('basemaps.cartocdn.com'),
  new CacheFirst({
    cacheName: 'bwm-map-tiles-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// 5. Local fonts/audio - Cache-first (bwm-static-v1)
registerRoute(
  ({ url }) => url.origin === self.location.origin && (url.pathname.startsWith('/audio/') || url.pathname.includes('/fonts/')),
  new CacheFirst({
    cacheName: 'bwm-static-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// 6. Network-only: API, non-GET methods, and third-party translation/maps
registerRoute(
  ({ request, url }) => {
    const isApi = url.pathname.startsWith('/api/');
    const isNonGet = request.method !== 'GET';
    const isExternalService = url.hostname.includes('translate.google.com') ||
                             url.hostname.includes('translate.googleapis.com') ||
                             url.hostname.includes('translate-pa.googleapis.com') ||
                             url.hostname.includes('maps.google.com') ||
                             url.hostname.includes('google.com');
    return isApi || isNonGet || isExternalService;
  },
  new NetworkOnly()
);

// Global check: Enforce fetch logic to never cache API or non-GET requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    return;
  }
});

// Update listener for prompt-based updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
