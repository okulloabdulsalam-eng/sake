/**
 * BarakahPush Notification System – Active
 * Firebase Cloud Messaging Service Worker (standalone; FCM is also inlined in sw.js)
 * Use same project as client: kiuma-mob-app. Only sw.js is registered.
 */

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

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = typeof firebase !== 'undefined' && firebase.messaging ? firebase.messaging() : null;

if (messaging) {
    messaging.onBackgroundMessage((payload) => {
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
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/notifications.html');
        })
    );
});

self.addEventListener('push', (event) => {
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
    event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
});
