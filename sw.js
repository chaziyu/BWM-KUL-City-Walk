const CACHE_NAME = 'bwm-kul-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/config.js',
    '/data.json',
    '/manifest.json',
    '/images/icon-192.png',
    '/images/cream-paper.png',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    // 'https://cdn.tailwindcss.com', // REMOVED: Causes CORS error and breaks SW install
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
];

// 1. Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 3. Fetch Event: Network First with Cache Fallback (Safe Strategy)
// OR Cache First (Fast Strategy). Let's use Stale-While-Revalidate for best of both worlds.
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests like Google Maps or Analytics if needed, or cache them too.
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response immediately if available
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Update cache with new response
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            });

            // If we have a cached response, return it, but still fetch in background to update (Stale-While-Revalidate)
            // Ideally, we just return cache if found.
            return cachedResponse || fetchPromise;
        })
    );
});
