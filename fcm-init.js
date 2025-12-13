/**
 * Firebase Cloud Messaging (FCM) Initialization
 * 
 * This file handles:
 * - Firebase app initialization
 * - FCM token retrieval and management
 * - Notification permission requests
 * - Foreground message handling
 * - Error handling and user feedback
 * 
 * @fileoverview
 * Production-ready FCM integration with comprehensive error handling,
 * token management, and user-friendly permission requests.
 */

// Global variables to store Firebase and messaging instances
let messaging = null;
let fcmToken = null;
let isInitialized = false;

/**
 * Initialize Firebase App and Messaging
 * 
 * This function:
 * 1. Validates Firebase configuration
 * 2. Initializes Firebase app
 * 3. Sets up messaging service
 * 4. Handles service worker registration
 * 
 * @returns {Promise<boolean>} True if initialization successful, false otherwise
 */
async function initializeFCM() {
    try {
        // Check if Firebase is already initialized
        if (isInitialized && messaging) {
            console.log('FCM already initialized');
            return true;
        }

        // Validate configuration first
        if (typeof validateFirebaseConfig === 'function') {
            const validation = validateFirebaseConfig();
            if (!validation.isValid) {
                console.error('Firebase configuration invalid:', validation.message);
                showError('Firebase configuration is incomplete. Please check fcm-config.js');
                return false;
            }
        }

        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined' || !firebase.apps) {
            console.error('Firebase SDK not loaded. Make sure firebase-app.js and firebase-messaging.js are included.');
            showError('Firebase SDK not loaded. Please check your script tags.');
            return false;
        }

        // Check if configuration exists
        if (typeof firebaseConfig === 'undefined') {
            console.error('Firebase configuration not found. Make sure fcm-config.js is loaded.');
            showError('Firebase configuration not found.');
            return false;
        }

        // Initialize Firebase App
        // Only initialize if no apps exist (prevents re-initialization errors)
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('Firebase app initialized');
        } else {
            app = firebase.app();
            console.log('Using existing Firebase app');
        }

        // Get messaging service
        // This requires the service worker to be registered
        if ('serviceWorker' in navigator) {
            // Register service worker first
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                });
                console.log('Service Worker registered:', registration.scope);
            } catch (swError) {
                console.error('Service Worker registration failed:', swError);
                showError('Service Worker registration failed. HTTPS is required for push notifications.');
                return false;
            }

            // Initialize messaging
            messaging = firebase.messaging();
            
            // Set up foreground message handler
            messaging.onMessage((payload) => {
                console.log('Foreground message received:', payload);
                handleForegroundMessage(payload);
            });

            isInitialized = true;
            console.log('FCM initialized successfully');
            return true;
        } else {
            console.error('Service Workers not supported in this browser');
            showError('Push notifications are not supported in this browser.');
            return false;
        }

    } catch (error) {
        console.error('FCM initialization error:', error);
        showError(`Failed to initialize Firebase: ${error.message}`);
        return false;
    }
}

/**
 * Request Notification Permission
 * 
 * This function:
 * 1. Checks current permission status
 * 2. Requests permission if not granted
 * 3. Handles permission denial gracefully
 * 
 * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
 */
async function requestNotificationPermission() {
    try {
        // Check if Notification API is supported
        if (!('Notification' in window)) {
            console.error('Notifications not supported in this browser');
            showError('Notifications are not supported in this browser.');
            return 'unsupported';
        }

        // Check current permission status
        let permission = Notification.permission;
        console.log('Current notification permission:', permission);

        // If already granted, return immediately
        if (permission === 'granted') {
            console.log('Notification permission already granted');
            showSuccess('Notification permission already granted!');
            return 'granted';
        }

        // If denied, inform user they need to change it in browser settings
        if (permission === 'denied') {
            console.log('Notification permission denied');
            showError('Notification permission was denied. Please enable it in your browser settings.');
            return 'denied';
        }

        // Request permission
        console.log('Requesting notification permission...');
        permission = await Notification.requestPermission();
        console.log('Permission result:', permission);

        if (permission === 'granted') {
            showSuccess('Notification permission granted!');
            // Automatically get token after permission is granted
            await getFCMToken();
            return 'granted';
        } else {
            showError('Notification permission denied. You won\'t receive push notifications.');
            return 'denied';
        }

    } catch (error) {
        console.error('Error requesting notification permission:', error);
        showError(`Failed to request permission: ${error.message}`);
        return 'error';
    }
}

/**
 * Get FCM Registration Token
 * 
 * This function:
 * 1. Retrieves the FCM token for the current device
 * 2. Handles token refresh
 * 3. Stores token for server use
 * 
 * @returns {Promise<string|null>} FCM token or null if failed
 */
async function getFCMToken() {
    try {
        // Ensure FCM is initialized
        if (!isInitialized || !messaging) {
            console.log('FCM not initialized, initializing now...');
            const initialized = await initializeFCM();
            if (!initialized) {
                return null;
            }
        }

        // Check permission first
        if (Notification.permission !== 'granted') {
            console.log('Notification permission not granted');
            showError('Please grant notification permission first.');
            return null;
        }

        // Get token
        console.log('Getting FCM token...');
        fcmToken = await messaging.getToken({
            vapidKey: firebaseConfig.vapidKey
        });

        if (fcmToken) {
            console.log('FCM Token:', fcmToken);
            displayToken(fcmToken);
            
            // Store token in localStorage for persistence
            localStorage.setItem('fcmToken', fcmToken);
            
            // Send token to server (optional - implement your endpoint)
            await sendTokenToServer(fcmToken);
            
            // Set up token refresh handler
            messaging.onTokenRefresh(async () => {
                console.log('FCM token refreshed');
                const newToken = await messaging.getToken({ vapidKey: firebaseConfig.vapidKey });
                fcmToken = newToken;
                localStorage.setItem('fcmToken', newToken);
                displayToken(newToken);
                await sendTokenToServer(newToken);
            });

            return fcmToken;
        } else {
            console.error('No FCM token available');
            showError('Failed to get FCM token. Please check your configuration.');
            return null;
        }

    } catch (error) {
        console.error('Error getting FCM token:', error);
        
        // Provide helpful error messages
        if (error.code === 'messaging/permission-blocked') {
            showError('Notification permission is blocked. Please enable it in browser settings.');
        } else if (error.code === 'messaging/unsupported-browser') {
            showError('This browser does not support push notifications.');
        } else {
            showError(`Failed to get FCM token: ${error.message}`);
        }
        
        return null;
    }
}

/**
 * Send Token to Server
 * 
 * This function sends the FCM token to your backend server
 * so you can send push notifications to this device.
 * 
 * @param {string} token - FCM registration token
 * @returns {Promise<void>}
 */
async function sendTokenToServer(token) {
    try {
        // TODO: Implement your API endpoint to save the token
        // Example:
        /*
        const response = await fetch('/api/save-fcm-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                userId: getCurrentUserId(), // Implement this function
                deviceInfo: navigator.userAgent
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to save token to server');
        }
        */
        
        console.log('Token should be sent to server:', token);
        // For now, just log it - implement your server endpoint
        
    } catch (error) {
        console.error('Error sending token to server:', error);
        // Don't show error to user - this is a background operation
    }
}

/**
 * Handle Foreground Messages
 * 
 * This function displays notifications when the app is in the foreground.
 * Background notifications are handled by the service worker.
 * 
 * @param {Object} payload - FCM message payload
 */
function handleForegroundMessage(payload) {
    console.log('Handling foreground message:', payload);
    
    // Extract notification data
    const notification = payload.notification || {};
    const data = payload.data || {};
    
    const title = notification.title || 'New Notification';
    const body = notification.body || 'You have a new message';
    const icon = notification.icon || '/logo.png';
    const image = notification.image;
    const clickAction = data.click_action || data.url || '/notifications.html';
    
    // Show browser notification
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: icon,
            image: image,
            badge: icon,
            tag: data.tag || 'fcm-notification',
            requireInteraction: false,
            data: {
                url: clickAction
            }
        });
        
        // Handle notification click
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            if (clickAction) {
                window.location.href = clickAction;
            }
            notification.close();
        };
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
    
    // Also show in-app notification (optional)
    showInAppNotification(title, body, clickAction);
}

/**
 * Show In-App Notification
 * 
 * Displays a notification banner in the app UI
 * 
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} url - URL to navigate to on click
 */
function showInAppNotification(title, body, url) {
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = 'fcm-in-app-notification';
    notificationEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 350px;
        cursor: pointer;
        animation: slideIn 0.3s ease-out;
    `;
    
    notificationEl.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.9;">${body}</div>
    `;
    
    // Add click handler
    if (url) {
        notificationEl.onclick = () => {
            window.location.href = url;
        };
    }
    
    // Add to page
    document.body.appendChild(notificationEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notificationEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notificationEl.remove();
        }, 300);
    }, 5000);
}

/**
 * Display FCM Token
 * 
 * Shows the FCM token in the UI (for debugging/admin purposes)
 * 
 * @param {string} token - FCM token to display
 */
function displayToken(token) {
    // Find or create token display element
    let tokenDisplay = document.getElementById('fcm-token-display');
    if (!tokenDisplay) {
        tokenDisplay = document.createElement('div');
        tokenDisplay.id = 'fcm-token-display';
        tokenDisplay.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 400px;
            font-size: 12px;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(tokenDisplay);
    }
    
    tokenDisplay.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">FCM Token:</div>
        <div style="word-break: break-all; margin-bottom: 8px;">${token}</div>
        <button onclick="copyFCMToken()" style="padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Copy Token
        </button>
        <button onclick="document.getElementById('fcm-token-display').style.display='none'" style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 5px;">
            Close
        </button>
    `;
    tokenDisplay.style.display = 'block';
}

/**
 * Copy FCM Token to Clipboard
 */
function copyFCMToken() {
    if (fcmToken) {
        navigator.clipboard.writeText(fcmToken).then(() => {
            showSuccess('Token copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy token:', err);
            showError('Failed to copy token');
        });
    }
}

/**
 * Show Success Message
 * 
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
    console.log('Success:', message);
    // You can integrate with your existing notification system
    // For now, using alert as fallback
    if (typeof showNotification === 'function') {
        showNotification(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Show Error Message
 * 
 * @param {string} message - Error message to display
 */
function showError(message) {
    console.error('Error:', message);
    // You can integrate with your existing notification system
    // For now, using alert as fallback
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        alert(message);
    }
}

/**
 * Initialize FCM on Page Load
 * 
 * Automatically initializes FCM when the page loads
 * This is called automatically when the script is loaded
 */
async function initFCMOnLoad() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await initializeFCM();
        });
    } else {
        await initializeFCM();
    }
}

// Auto-initialize when script loads
initFCMOnLoad();

// Make functions globally available
if (typeof window !== 'undefined') {
    window.initializeFCM = initializeFCM;
    window.requestNotificationPermission = requestNotificationPermission;
    window.getFCMToken = getFCMToken;
    window.copyFCMToken = copyFCMToken;
}

