/**
 * Service Worker - Offline caching and functionality
 */

const CACHE_NAME = 'solo-leveling-v1';
const STATIC_CACHE_NAME = 'solo-leveling-static-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './js/database.js',
    './js/utils.js',
    './js/gameEngine.js',
    './js/dataCollection.js',
    './js/aiQuestGenerator.js',
    './js/materialRewards.js',
    './js/reportSystem.js',
    './js/backgroundQuestGenerator.js',
    './js/questSystem.js',
    './js/skillSystem.js',
    './js/aiAssistant.js',
    './js/notifications.js',
    './js/prayerTimes.js',
    './js/main.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching static files');
            return cache.addAll(STATIC_FILES.map(url => {
                try {
                    return new Request(url, { mode: 'no-cors' });
                } catch (e) {
                    return url;
                }
            })).catch(err => {
                console.log('[ServiceWorker] Cache addAll error:', err);
                // Continue even if some files fail to cache
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.startsWith('https://fonts.googleapis.com') &&
        !event.request.url.startsWith('https://fonts.gstatic.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached version or fetch from network
            if (response) {
                return response;
            }

            return fetch(event.request).then((response) => {
                // Don't cache if not a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Cache the fetched resource
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // If fetch fails and it's a navigation request, return cached index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

// Sync data function
async function syncData() {
    // This would sync data with server when online
    console.log('[ServiceWorker] Syncing data...');
    // Implementation would depend on your backend API
}

