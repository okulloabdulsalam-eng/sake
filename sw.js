/**
 * Service Worker for KIUMA PWA
 * Production-safe service worker with cache-first for static assets
 * and network-first for API/data requests
 * 
 * NOTE: This is a PWA caching service worker, NOT for push notifications.
 * OLD NOTIFICATION SYSTEM REMOVED: Firebase Cloud Messaging (FCM) service worker
 * (firebase-messaging-sw.js) has been completely removed. All FCM push notification
 * logic, handlers, and related code have been deleted. Notification system now uses
 * BarakahPush instead.
 * 
 * Version: 1.0.0
 * Last Updated: 2024
 */

// ============================================
// CONFIGURATION
// ============================================

// Cache version - increment this to force cache update
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `kiuma-cache-${CACHE_VERSION}`;

// Static assets to cache on install (cache-first strategy)
const STATIC_ASSETS = [
  // Core HTML pages
  '/',
  '/index.html',
  '/about.html',
  '/values.html',
  '/programs.html',
  '/activities.html',
  '/events.html',
  '/leadership.html',
  '/contact.html',
  '/library.html',
  '/media.html',
  '/ask-question.html',
  '/join-programs.html',
  '/notifications.html',
  '/pay.html',
  '/join-us.html',
  '/whatsapp-join-modal.html',
  
  // Core assets
  '/styles.css',
  '/script.js',
  '/api-config.js',
  '/manifest.json',
  '/logo.png',
  
  // Offline fallback
  '/offline.html'
];

// External resources to cache (CDN, fonts, etc.)
const EXTERNAL_RESOURCES = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// API endpoints that should use network-first strategy
const API_PATTERNS = [
  /^\/api\//,  // All /api/* endpoints
  /^https:\/\/api\.aladhan\.com\//,  // Aladhan API
  /^https:\/\/.*\/api\//  // Any external API
];

// ============================================
// INSTALL EVENT - Cache static assets
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, version:', CACHE_VERSION);
  
  // Wait until all static assets are cached
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache static assets
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
          .catch((error) => {
            console.warn('[SW] Some static assets failed to cache:', error);
            // Continue even if some assets fail
            return Promise.resolve();
          });
      })
      .then(() => {
        // Cache external resources
        return caches.open(CACHE_NAME).then((cache) => {
          return Promise.allSettled(
            EXTERNAL_RESOURCES.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch(err => {
                  console.warn(`[SW] Failed to cache external resource ${url}:`, err);
                })
            )
          );
        });
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// ============================================
// ACTIVATE EVENT - Clean up old caches
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker, version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Delete all caches that don't match current version
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// ============================================
// FETCH EVENT - Request handling strategy
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Determine strategy based on request type
  if (isAPIRequest(request.url)) {
    // Network-first strategy for API requests
    event.respondWith(networkFirstStrategy(request));
  } else {
    // Cache-first strategy for static assets
    event.respondWith(cacheFirstStrategy(request));
  }
});

// ============================================
// STRATEGY FUNCTIONS
// ============================================

/**
 * Cache-first strategy: Check cache first, fallback to network
 * Used for static assets (HTML, CSS, JS, images)
 */
async function cacheFirstStrategy(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }
    
    // Cache miss - fetch from network
    console.log('[SW] Cache miss, fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Clone response because response body can only be read once
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    
    // If it's a navigation request and we're offline, show offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Return a basic error response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Network-first strategy: Try network first, fallback to cache
 * Used for API requests and dynamic data
 */
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response and return it
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Clone response because response body can only be read once
      cache.put(request, networkResponse.clone());
      console.log('[SW] Network response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', request.url, error);
    
    // Network failed - try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    
    // Both network and cache failed
    console.error('[SW] Both network and cache failed:', request.url);
    
    // Return a JSON error response for API requests
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Offline - Data not available',
        offline: true
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For other requests, return generic error
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a request is an API request
 */
function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url));
}

// ============================================
// MESSAGE HANDLER - For cache updates
// ============================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // Manually trigger cache update
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
    );
  }
});

// ============================================
// ERROR HANDLING
// ============================================

self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

