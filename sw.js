// KIUMA Service Worker - Enables offline functionality (SAKE core, single project)
// Cache version - UPDATE THIS when you deploy changes to force refresh
const CACHE_VERSION = '2026-03-29-quran-maintenance-notice';
const CACHE_NAME = 'kiuma-cache-' + CACHE_VERSION;
const OFFLINE_URL = 'offline.html';

// Base path for GitHub Pages (empty for root, '/sake' for subdirectory)
const BASE_PATH = self.location.pathname.replace('/sw.js', '');

// Firebase Cloud Messaging (FCM) - same project as client (kiuma-mob-app) for single init
try {
    importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

    const firebaseConfig = {
        apiKey: "AIzaSyCo8sbfn_Wj2z4el0jarq5An3r-P5sAWxA",
        authDomain: "kiuma-mob-app.firebaseapp.com",
        projectId: "kiuma-mob-app",
        storageBucket: "kiuma-mob-app.firebasestorage.app",
        messagingSenderId: "69327390212",
        appId: "1:69327390212:web:8c63fa000f62477f549751",
        measurementId: "G-VZYMWTC3NR"
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
            const imageUrl = payload.notification?.image || payload.data?.image || '';

            const notificationOptions = {
                body,
                icon: `${BASE_PATH}/logo.png`,
                badge: `${BASE_PATH}/logo.png`,
                tag: payload.data?.notification_id || payload.data?.tag || 'kiuma',
                data: payload.data || {},
                requireInteraction: true,
                vibrate: [200, 100, 200]
            };
            if (imageUrl) {
                notificationOptions.image = imageUrl;
            }

            return self.registration.showNotification(title, notificationOptions);
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
    './styles.min.css',
    './fonts/fontawesome.min.css',
    './fonts/webfonts/fa-brands-400.woff2',
    './fonts/webfonts/fa-regular-400.woff2',
    './fonts/webfonts/fa-solid-900.woff2',
    './fonts/webfonts/fa-brands-400.ttf',
    './fonts/webfonts/fa-regular-400.ttf',
    './fonts/webfonts/fa-solid-900.ttf',
    './css/search.css',
    './css/fonts-quran.css',
    './fonts/amiri/amiri-arabic-400-normal.woff2',
    './fonts/amiri/amiri-arabic-700-normal.woff2',
    './fonts/poppins/poppins-latin-300-normal.woff2',
    './fonts/poppins/poppins-latin-400-normal.woff2',
    './fonts/poppins/poppins-latin-500-normal.woff2',
    './fonts/poppins/poppins-latin-600-normal.woff2',
    './fonts/poppins/poppins-latin-700-normal.woff2',
    './script.js',
    './js/register-service-worker.js',
    './js/search.js',
    './js/search-data.js',
    './js/quran-reader-main.js',
    './js/quran-maintenance.js',
    './firebase-config.js',
    './update-navigation.js',
    './offline-db.js',
    './media-offline.js',
    './app-storage.js',
    './assets/css/player.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
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

    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    if (url.protocol === 'blob:') return;
    const path = url.pathname.toLowerCase();
    const mediaExt = /\.(mp4|webm|ogg|mov|avi|mp3|wav|flac|aac|m4a)(\?|$)/i;
    // Allow PDFs to be cached for offline viewing, but exclude other media
    if (mediaExt.test(path) || path.includes('/file/')) return;

    // Quran word-by-word JSON proxy (same cache bucket as alquran)
    if (url.hostname.includes('kiuma-quran') && path.includes('/verses/')) {
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

    if (url.hostname.includes('workers.dev')) return;

    if (url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('firestore.googleapis.com') ||
        url.pathname.includes('/api/')) {
        return;
    }

    // Cache Quran API and audio responses for offline (network-first, fallback to cache)
    if (url.hostname.includes('api.alquran.cloud') || url.hostname.includes('cdn.alquran.cloud') || url.hostname.includes('cdn.islamic.network') || url.hostname.includes('api.quran.com')) {
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

    if (url.hostname.includes('googleapis.com') || url.hostname.includes('aladhan.com')) return;

    const isHTMLRequest = request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('/');

    if (isHTMLRequest) {
        const isAdmin = path.includes('admin.html');
        if (isAdmin) {
            event.respondWith(
                fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) return networkResponse;
                        return new Response(
                            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admin</title><meta http-equiv="refresh" content="0;url=index.html"></head><body><p>Admin page has been removed. <a href="index.html">Go to Home</a>.</p></body></html>',
                            { status: 404, headers: { 'Content-Type': 'text/html' } }
                        );
                    })
                    .catch(() => {
                        return new Response(
                            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admin</title><meta http-equiv="refresh" content="0;url=index.html"></head><body><p>Admin page has been removed. <a href="index.html">Go to Home</a>.</p></body></html>',
                            { status: 404, headers: { 'Content-Type': 'text/html' } }
                        );
                    })
            );
            return;
        }
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() =>
                    caches.match(request).then((cachedResponse) =>
                        cachedResponse || caches.match('./offline.html')
                    )
                )
        );
    } else {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    const fetchPromise = fetch(request)
                        .then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                const responseClone = networkResponse.clone();
                                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                            }
                            return networkResponse;
                        })
                        .catch(() => null);
                    return cachedResponse || fetchPromise || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                })
        );
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(event.data.urls)));
    }
    if (event.data && event.data.type === 'GET_VERSION' && event.ports[0]) {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') event.waitUntil(Promise.resolve().then(() => console.log('[ServiceWorker] Syncing data...')));
});

self.addEventListener('push', (event) => {
    let notificationData = {
        title: 'KIUMA Update',
        body: 'You have a new notification',
        icon: `${BASE_PATH}/logo.png`,
        badge: `${BASE_PATH}/logo.png`,
        tag: 'kiuma-notification',
        data: { url: `${BASE_PATH}/notifications.html` }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            // Skip FCM-originated pushes (handled by onBackgroundMessage above)
            if (data && (data.firebase_messaging_msg_data || data.notification || data.from === '69327390212')) return;

            notificationData = {
                title: data.title || notificationData.title,
                body: data.message || data.body || notificationData.body,
                icon: data.icon || `${BASE_PATH}/logo.png`,
                badge: `${BASE_PATH}/logo.png`,
                tag: data.id || 'kiuma-notification-' + Date.now(),
                data: { url: data.url || `${BASE_PATH}/notifications.html`, notificationId: data.id },
                vibrate: [200, 100, 200],
                requireInteraction: true
            };
            if (data.image) {
                notificationData.image = data.image;
            }
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
            image: notificationData.image,
            vibrate: notificationData.vibrate,
            requireInteraction: notificationData.requireInteraction
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || `${BASE_PATH}/notifications.html`;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const existing = clientList.find(c => c.url && c.url.includes('notifications.html'));
            if (existing) {
                return existing.focus();
            }
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(urlToOpen);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});

console.log('[ServiceWorker] Service Worker loaded');
