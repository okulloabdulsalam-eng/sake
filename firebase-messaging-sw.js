/**
 * BarakahPush Notification System – Active
 * Firebase Cloud Messaging Service Worker
 * 
 * Handles background push notifications for WebView and mobile browsers
 * Uses Firebase v9 compat syntax for compatibility
 */

// BarakahPush Notification System – Active
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js');

// Firebase configuration (must match fcm-config.js)
const firebaseConfig = {
    apiKey: "AIzaSyDOZ1UzDPXuxmGMZTxKcB7CzeWi7esB08c",
    authDomain: "kiuma-mob-app.firebaseapp.com",
    projectId: "kiuma-mob-app",
    storageBucket: "kiuma-mob-app.firebasestorage.app",
    messagingSenderId: "69327390212",
    appId: "1:69327390212:web:10a7f8b52d5ea93d549751"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages (when app is closed)
messaging.onBackgroundMessage((payload) => {
    console.log('[BarakahPush SW] Background message received:', payload);
    
    const notificationTitle = payload.data?.title || 'New Notification';
    const notificationOptions = {
        body: payload.data?.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: payload.data?.notification_id || 'barakahpush',
        data: payload.data || {},
        requireInteraction: false,
        silent: false
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[BarakahPush SW] Notification clicked:', event);
    
    event.notification.close();

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if app is already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if app is not open
            if (clients.openWindow) {
                return clients.openWindow('/notifications.html');
            }
        })
    );
});

// Handle push events (for WebView compatibility)
self.addEventListener('push', (event) => {
    console.log('[BarakahPush SW] Push event received:', event);
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Notification', body: 'You have a new notification' };
        }
    }

    const notificationTitle = data.title || 'New Notification';
    const notificationOptions = {
        body: data.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: data.notification_id || 'barakahpush',
        data: data,
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
    );
});

