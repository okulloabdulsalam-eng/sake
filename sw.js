// KIUMA Service Worker - Enables offline functionality
// Cache version - UPDATE THIS when you deploy changes to force refresh
const CACHE_VERSION = '2026-02-25-v3';
const CACHE_NAME = 'kiuma-cache-' + CACHE_VERSION;
const OFFLINE_URL = 'offline.html';

// Base path for GitHub Pages (empty for root, '/sake' for subdirectory)
const BASE_PATH = self.location.pathname.replace('/sw.js', '');

// Firebase Cloud Messaging (FCM) - background notifications
// Keep this inside sw.js to avoid registering a second service worker (which breaks offline caching)
try {
    importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

    const firebaseConfig = {
        apiKey: "AIzaSyDOZ1UzDPXuxmGMZTxKcB7CzeWi7esB08c",
        authDomain: "kiuma-mob-app.firebaseapp.com",
        projectId: "kiuma-mob-app",
        storageBucket: "kiuma-mob-app.firebasestorage.app",
        messagingSenderId: "69327390212",
        appId: "1:69327390212:web:bc519469946b80a7549751"
    };

    if (self.firebase && typeof self.firebase.initializeApp === 'function') {
        try {
            self.firebase.initializeApp(firebaseConfig);
        } catch (e) {
            // ignore duplicate init
        }
    }

    if (self.firebase && typeof self.firebase.messaging === 'function') {
        const messaging = self.firebase.messaging();

        messaging.onBackgroundMessage((payload) => {
            const title = payload.notification?.title || payload.data?.title || 'KIUMA Update';
            const body = payload.notification?.body || payload.data?.body || '';

            const notificationOptions = {
                body,
                icon: `${BASE_PATH}/logo.png`,
                badge: `${BASE_PATH}/logo.png`,
                tag: payload.data?.notification_id || payload.data?.tag || 'kiuma',
                data: payload.data || {}
            };

            return self.registration.showNotification(title, notificationOptions);
        });

        self.addEventListener('notificationclick', (event) => {
            event.notification.close();
            const targetUrl = `${BASE_PATH}/notifications.html`;
            event.waitUntil(
                clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                    for (const client of clientList) {
                        if (client.url && client.url.includes(BASE_PATH)) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow(targetUrl);
                    }
                })
            );
        });
    }
} catch (e) {
    // FCM scripts may fail to load (offline / blocked). Offline caching must still work.
}

// Files to cache for offline use (relative paths for GitHub Pages compatibility)
const STATIC_ASSETS = [
    './',
    './index.html',
    './about.html',
    './activities.html',
    './ask-question.html',
    './contact.html',
    './counselling.html',
    './events.html',
    './important-lessons.html',
    './join-programs.html',
    './join-us.html',
    './leadership.html',
    './library.html',
    './media-settings.html',
    './media.html',
    './notifications.html',
    './pay.html',
    './programs.html',
    './quran.html',
    './quran-reader.html',
    './mosques.html',
    './dhikr.html',
    './names-of-allah.html',
    './search.html',
    './subscription-form.html',
    './values.html',
    './zakat-form.html',
    './offline.html',
    './styles.css',
    './fonts/fontawesome.min.css',
    './fonts/quran/KFGQPC-Uthmanic-Script-HAFS.woff2',
    './fonts/webfonts/fa-brands-400.woff2',
    './fonts/webfonts/fa-regular-400.woff2',
    './fonts/webfonts/fa-solid-900.woff2',
    './fonts/webfonts/fa-brands-400.ttf',
    './fonts/webfonts/fa-regular-400.ttf',
    './fonts/webfonts/fa-solid-900.ttf',
    './css/search.css',
    './script.js',
    './js/register-service-worker.js',
    './js/search.js',
    './js/search-data.js',
    './firebase-config.js',
    './update-navigation.js',
    './offline-db.js',
    './kiuma-idb.js',
    './kiuma-filesystem.js',
    './kiuma-delta-sync.js',
    // Firebase SDK — pre-cached so every page works offline
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js',
    // Supabase SDK — used by search.html
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    // Font CDN
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

// Activate event - clean up old caches (keep quran and github data caches)
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    const keepCaches = [CACHE_NAME, CACHE_NAME + '-quran', CACHE_NAME + '-github', 'kiuma-offline-media', 'kiuma-offline-library'];
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (!keepCaches.includes(cacheName)) {
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

// Fetch event - Network-first for HTML, stale-while-revalidate for assets
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

    // Skip Firebase/Firestore requests - always go to network
    if (url.hostname.includes('firebaseio.com') || 
        url.hostname.includes('firestore.googleapis.com') ||
        url.pathname.includes('/api/')) {
        return;
    }

    // Cache Quran API responses for offline (network-first, fallback to cache)
    if (url.hostname.includes('api.alquran.cloud') || url.hostname.includes('cdn.alquran.cloud')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME + '-quran').then(c => c.put(request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request).then(r => r || new Response('{"error":"offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } })))
        );
        return;
    }

    // Cache GitHub raw content (prayer times, events, announcements, tafsir) — network-first
    if (url.hostname === 'raw.githubusercontent.com') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME + '-github').then(c => c.put(request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request).then(r => r || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } })))
        );
        return;
    }

    // Skip googleapis API endpoints (auth, Firestore data) — network only
    // But allow fonts.googleapis.com to be served from cache
    if (url.hostname.includes('aladhan.com')) return;
    if (url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts.')) return;

    // Check if this is an HTML page request (navigation or .html file)
    const isHTMLRequest = request.mode === 'navigate' || 
                          url.pathname.endsWith('.html') || 
                          url.pathname.endsWith('/');

    if (isHTMLRequest) {
        // Network-first strategy for HTML - always try to get fresh content
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    // Got fresh content - cache it and return
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone);
                            });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Network failed - try cache
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // No cache - show offline page
                            return caches.match('./offline.html');
                        });
                })
        );
    } else {
        // Stale-while-revalidate for assets (CSS, JS, images)
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    // Update cache in background
                    const fetchPromise = fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseClone);
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(() => null);

                    // Return cached version immediately, or wait for network
                    return cachedResponse || fetchPromise || new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                })
        );
    }
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

    // Return current cache version so the app can detect updates
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }

    // KiuSync detected a new app version — refresh caches silently
    if (event.data && event.data.type === 'CHECK_UPDATE') {
        event.waitUntil(syncData());
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
    // Check version.json — if updated, silently refresh all static caches
    try {
        const res = await fetch('./version.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data          = await res.json();
        const remoteVersion = String(data.version || data.build || '');
        const localVersion  = await _getCachedVersion();

        if (remoteVersion && remoteVersion !== localVersion) {
            await _refreshStaticCache();
            await _setCachedVersion(remoteVersion);
        }
    } catch (_) { /* offline */ }
}

async function _getCachedVersion() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const res   = await cache.match('__sw_version__');
        return res ? await res.text() : null;
    } catch (_) { return null; }
}

async function _setCachedVersion(version) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put('__sw_version__', new Response(version, {
            headers: { 'Content-Type': 'text/plain' }
        }));
    } catch (_) {}
}

async function _refreshStaticCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        await Promise.allSettled(
            STATIC_ASSETS.map(function (url) {
                return fetch(url, { cache: 'no-store' })
                    .then(function (r) {
                        if (r && r.status === 200) return cache.put(url, r);
                    })
                    .catch(function () {});
            })
        );
    } catch (_) {}
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push received:', event);
    
    let notificationData = {
        title: 'KIUMA Update',
        body: 'You have a new notification',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'kiuma-notification',
        data: { url: '/notifications.html' }
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.message || data.body || notificationData.body,
                icon: data.icon || '/logo.png',
                badge: '/logo.png',
                tag: data.id || 'kiuma-notification-' + Date.now(),
                data: { 
                    url: data.url || '/notifications.html',
                    notificationId: data.id
                },
                vibrate: [200, 100, 200],
                requireInteraction: true
            };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            vibrate: notificationData.vibrate,
            requireInteraction: notificationData.requireInteraction
        })
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked:', event.notification.tag);
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/notifications.html';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Open new window if not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

console.log('[ServiceWorker] Service Worker loaded');
