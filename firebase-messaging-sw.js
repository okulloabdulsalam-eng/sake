/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This service worker handles background push notifications.
 * It must be placed in the root directory of your website.
 * 
 * @fileoverview
 * Service workers run in the background and can receive push notifications
 * even when the user is not actively viewing your website.
 * 
 * IMPORTANT:
 * - This file must be in the root directory (same level as index.html)
 * - HTTPS is required for service workers (except localhost)
 * - The service worker scope determines which pages it controls
 */

// Import Firebase scripts
// These are loaded from CDN in the service worker context
// Using version 12.6.0 to match your Firebase project
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js');

/**
 * Firebase Configuration
 * 
 * These values match your Firebase project credentials from fcm-config.js
 */
const firebaseConfig = {
    apiKey: "AIzaSyDOZ1UzDPXuxmGMZTxKcB7CzeWi7esB08c",
    authDomain: "kiuma-mob-app.firebaseapp.com",
    projectId: "kiuma-mob-app",
    storageBucket: "kiuma-mob-app.firebasestorage.app",
    messagingSenderId: "69327390212",
    appId: "1:69327390212:web:10a7f8b52d5ea93d549751"
};

/**
 * Initialize Firebase App
 * 
 * This initializes Firebase in the service worker context.
 * The service worker needs its own Firebase instance.
 */
try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('[Service Worker] Firebase initialized');
} catch (error) {
    console.error('[Service Worker] Firebase initialization error:', error);
}

/**
 * Initialize Firebase Messaging
 * 
 * This sets up the messaging service to receive background notifications.
 */
const messaging = firebase.messaging();

/**
 * Handle Background Messages
 * 
 * This function is called when a push notification is received
 * while the app is in the background or closed.
 * 
 * @param {Object} payload - The notification payload from FCM
 * @returns {Promise<Object>} Notification options
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Background message received:', payload);
    
    // Extract notification data from payload
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new message',
        icon: payload.notification?.icon || '/logo.png',
        image: payload.notification?.image,
        badge: payload.notification?.icon || '/logo.png',
        tag: payload.data?.tag || 'fcm-notification',
        requireInteraction: payload.data?.requireInteraction || false,
        data: {
            // Store additional data for when notification is clicked
            url: payload.data?.click_action || payload.data?.url || '/notifications.html',
            ...payload.data
        },
        // Notification actions (optional - for action buttons)
        actions: payload.data?.actions || [],
        // Sound (optional)
        sound: payload.notification?.sound || 'default',
        // Vibrate pattern (optional - for mobile devices)
        vibrate: payload.data?.vibrate || [200, 100, 200],
        // Timestamp
        timestamp: Date.now()
    };
    
    /**
     * Show the notification
     * 
     * self.registration.showNotification() displays the notification
     * to the user even when the app is in the background.
     */
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Handle Notification Click
 * 
 * This event is fired when the user clicks on a notification.
 * 
 * @param {Event} event - The notification click event
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);
    
    // Close the notification
    event.notification.close();
    
    // Get the URL from notification data
    const urlToOpen = event.notification.data?.url || '/notifications.html';
    
    /**
     * Open or focus the window
     * 
     * This will:
     * - Open a new window/tab if none exists
     * - Focus an existing window if one is already open
     */
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if there's already a window open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // If a window is open and matches our URL, focus it
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

/**
 * Handle Notification Close
 * 
 * This event is fired when the user dismisses a notification.
 * 
 * @param {Event} event - The notification close event
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', event);
    
    // You can track notification dismissals here
    // For example, send analytics data to your server
});

/**
 * Service Worker Install Event
 * 
 * This event is fired when the service worker is first installed.
 * Use this to cache resources or perform setup tasks.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

/**
 * Service Worker Activate Event
 * 
 * This event is fired when the service worker becomes active.
 * Use this to clean up old caches or perform activation tasks.
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    // Take control of all pages immediately
    event.waitUntil(clients.claim());
});

/**
 * Handle Push Events (Alternative method)
 * 
 * This is an alternative way to handle push notifications.
 * Firebase Messaging handles this automatically, but you can
 * add custom logic here if needed.
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push event received:', event);
    
    // If you want to handle push events manually instead of using
    // Firebase Messaging, you can do it here.
    // However, Firebase Messaging is recommended for FCM.
    
    // Example manual handling:
    /*
    const data = event.data.json();
    const title = data.notification?.title || 'New Notification';
    const options = {
        body: data.notification?.body || 'You have a new message',
        icon: data.notification?.icon || '/logo.png',
        data: data.data || {}
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
    */
});

/**
 * Error Handling
 * 
 * Catch and log any errors in the service worker
 */
self.addEventListener('error', (event) => {
    console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[Service Worker] Unhandled rejection:', event.reason);
});

/**
 * Best Practices:
 * 
 * 1. Always close notifications after handling clicks
 * 2. Use event.waitUntil() for async operations
 * 3. Handle errors gracefully
 * 4. Keep service worker code minimal and efficient
 * 5. Test on different browsers (Chrome, Firefox, Safari)
 * 6. Ensure HTTPS in production (required for service workers)
 * 7. Update service worker version when making changes
 */

