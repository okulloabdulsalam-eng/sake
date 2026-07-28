// KIUMA Service Worker - Enables offline functionality (SAKE core, single project)
// Cache version - UPDATE THIS when you deploy changes to force refresh
const CACHE_VERSION = '2026-04-21-offline-prefetch-all-pages';
const CACHE_NAME = 'kiuma-cache-' + CACHE_VERSION;
const OFFLINE_URL = 'offline.html';

// Base path for GitHub Pages (empty for root, '/sake' for subdirectory)
const BASE_PATH = self.location.pathname.replace('/sw.js', '');

function isBlockedPrayerReminder(pushKind, title, body) {
    const normalizedKind = String(pushKind || '').toLowerCase();
    if (normalizedKind !== 'prayer') {
        return false;
    }

    const combinedText = `${title || ''} ${body || ''}`.toLowerCase();
    return combinedText.includes('salat soon') ||
        combinedText.includes('iqaama') ||
        combinedText.includes('in jamaah today') ||
        combinedText.includes('prayer reminder') ||
        combinedText.includes('in 5 minutes');
}

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
            const pushKind = (payload.data?.category || payload.data?.type || '').toLowerCase();
            const title = payload.notification?.title || payload.data?.title || 'KIUMA Update';
            const body = payload.notification?.body || payload.data?.body || '';
            if (isBlockedPrayerReminder(pushKind, title, body)) {
                return;
            }
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
    './admin.html',
    './activities.html',
    './ask-question.html',
    './broadcast.html',
    './contact.html',
    './counselling.html',
    './deploy-worker.html',
    './events.html',
    './did-you-know.html',
    './donate.html',
    './important-lessons.html',
    './join-programs.html',
    './join-us.html',
    './leadership.html',
    './library.html',
    './live-streaming.html',
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
    './test-account-storage.html',
    './values.html',
    './whatsapp-join-modal.html',
    './zakat-form.html',
    './offline.html',
    './manifest.json',
    './logo.png',
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
    './script.min.js',
    './js/register-service-worker.js',
    './js/app-bridge.js',
    './js/router-bridge.js',
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

const SAME_ORIGIN_REFRESH_URLS = Array.from(new Set(
    STATIC_ASSETS.filter(url => !/^https?:/i.test(url))
));

function getAbsoluteUrl(url) {
    return new URL(url, self.registration.scope).toString();
}

async function refreshCachedUrls(urls = SAME_ORIGIN_REFRESH_URLS) {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(urls.map(async (url) => {
        const request = new Request(getAbsoluteUrl(url), { cache: 'no-cache' });
        const response = await fetch(request);
        if (response && response.ok) {
            await cache.put(request, response.clone());
        }
    }));
}

async function findCachedHtmlResponse(request) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    const candidates = [request.url, requestUrl.origin + pathname];

    if (pathname === '/' || pathname === '') {
        candidates.push(getAbsoluteUrl('./index.html'));
    }

    if (!pathname.endsWith('.html')) {
        const trimmed = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        if (trimmed) {
            candidates.push(requestUrl.origin + trimmed + '.html');
        }
    }

    for (const candidate of candidates) {
        const cached = await caches.match(candidate, { ignoreSearch: true });
        if (cached) {
            return cached;
        }
    }

    return null;
}

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
            .then(() => {
                return refreshCachedUrls();
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
            (async () => {
                const cachedResponse = await findCachedHtmlResponse(request);
                const networkResponsePromise = fetch(request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                        }
                        return networkResponse;
                    })
                    .catch(() => null);

                if (cachedResponse) {
                    event.waitUntil(networkResponsePromise);
                    return cachedResponse;
                }

                const networkResponse = await networkResponsePromise;
                if (networkResponse) {
                    return networkResponse;
                }

                const cachedIndex = await caches.match(getAbsoluteUrl('./index.html'));
                if (cachedIndex) {
                    return cachedIndex;
                }

                const cachedOffline = await caches.match(getAbsoluteUrl('./offline.html'));
                if (cachedOffline) {
                    return cachedOffline;
                }

                return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head><body><p>Offline</p></body></html>', {
                    status: 503,
                    headers: { 'Content-Type': 'text/html' }
                });
            })()
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
        event.waitUntil(refreshCachedUrls(Array.isArray(event.data.urls) ? event.data.urls : SAME_ORIGIN_REFRESH_URLS));
    }
    if (event.data && event.data.type === 'REFRESH_OFFLINE_CACHE') {
        event.waitUntil(refreshCachedUrls());
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
            const pushKind = (data.category || data.type || '').toLowerCase();
            const pushTitle = data.title || notificationData.title;
            const pushBody = data.message || data.body || notificationData.body;
            if (isBlockedPrayerReminder(pushKind, pushTitle, pushBody)) return;

            notificationData = {
                title: pushTitle,
                body: pushBody,
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

// Background sync for Hijri date refresh
self.addEventListener('sync', (event) => {
    if (event.tag === 'refresh-hijri-date') {
        event.waitUntil(
            refreshHijriDateInBackground()
        );
    }
});

// Periodic background sync for Hijri date (every 12 hours)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'refresh-hijri-date-periodic') {
        event.waitUntil(
            refreshHijriDateInBackground()
        );
    }
});

async function refreshHijriDateInBackground() {
    try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const apis = [
            `https://api.aladhan.com/v1/gToH?date=${dateStr}`,
            `https://api.hijri.app/v2/convert?g=${dateStr}`
        ];

        for (const url of apis) {
            try {
                const response = await fetch(url);
                if (!response.ok) continue;
                
                const data = await response.json();
                let hijri = null;

                if (data.data && data.data.hijri) {
                    hijri = data.data.hijri;
                }

                if (hijri && hijri.day && hijri.month && hijri.year) {
                    // Save to cache that can be accessed by hijri-date-manager.js
                    const cache = await caches.open(CACHE_NAME);
                    const cacheData = {
                        day: hijri.day,
                        month: hijri.month,
                        year: hijri.year,
                        timestamp: Date.now()
                    };
                    
                    // Store in IndexedDB or via postMessage to clients
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'HIJRI_DATE_UPDATE',
                            data: cacheData
                        });
                    });
                    
                    return;
                }
            } catch (error) {
                console.warn('[ServiceWorker] Hijri API error:', error);
                continue;
            }
        }
    } catch (error) {
        console.warn('[ServiceWorker] Background Hijri refresh failed:', error);
    }
}

console.log('[ServiceWorker] Service Worker loaded');
