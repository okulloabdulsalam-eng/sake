// KIUMA Service Worker - Enables offline functionality
const CACHE_NAME = 'kiuma-cache-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/activities.html',
    '/ask-question.html',
    '/contact.html',
    '/counselling.html',
    '/events.html',
    '/important-lessons.html',
    '/join-programs.html',
    '/join-us.html',
    '/leadership.html',
    '/library.html',
    '/media-settings.html',
    '/media.html',
    '/notifications.html',
    '/pay.html',
    '/programs.html',
    '/quran.html',
    '/search.html',
    '/subscription-form.html',
    '/values.html',
    '/zakat-form.html',
    '/offline.html',
    '/styles.css',
    '/css/search.css',
    '/script.js',
    '/js/search.js',
    '/js/search-data.js',
    '/firebase-config.js',
    '/update-navigation.js',
    '/offline-db.js',
    // External resources (CDN) - will be cached on first load
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                // Cache files one by one to handle failures gracefully
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => 
                        cache.add(url).catch(err => {
                            console.warn(`[ServiceWorker] Failed to cache: ${url}`, err);
                        })
                    )
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Install complete');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Chrome extension requests and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip Firebase/API requests - always go to network
    if (url.hostname.includes('firebaseio.com') || 
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('aladhan.com') ||
        url.pathname.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    event.waitUntil(updateCache(request));
                    return cachedResponse;
                }

                // Not in cache - fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Cache the new response for future use
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('[ServiceWorker] Fetch failed, serving offline page:', error);
                        
                        // For navigation requests, show offline page
                        if (request.mode === 'navigate') {
                            return caches.match(OFFLINE_URL);
                        }
                        
                        // For other requests, return a simple error response
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, networkResponse);
        }
    } catch (error) {
        // Network request failed, that's okay - we have the cached version
    }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(event.data.urls);
                })
        );
    }
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Sync any pending data when connection is restored
    console.log('[ServiceWorker] Syncing data...');
    // This can be extended to sync form submissions, etc.
}

console.log('[ServiceWorker] Service Worker loaded');
