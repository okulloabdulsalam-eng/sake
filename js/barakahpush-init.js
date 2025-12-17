/**
 * BarakahPush Notification System – Active
 * 
 * Firebase Cloud Messaging (FCM) initialization with DATA messages only
 * WebView-safe: Notifications handled at app level, not browser push
 * 
 * Features:
 * - FCM token management (store, update, retrieve)
 * - DATA message handling (app-level notifications)
 * - Auto-update token on reinstall/refresh
 * - Secure token storage per user account
 */

// BarakahPush Notification System – Active
let messaging = null;
let currentFCMToken = null;

/**
 * Initialize BarakahPush FCM
 * Must be called after Firebase app initialization
 */
async function initializeBarakahPush() {
    try {
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined') {
            console.error('[BarakahPush] Firebase SDK not loaded');
            return false;
        }

        // Check if Firebase app is initialized
        if (!firebase.apps || firebase.apps.length === 0) {
            console.error('[BarakahPush] Firebase app not initialized. Call initializeFirebaseApp() first');
            return false;
        }

        // Check if messaging is available
        if (typeof firebase.messaging === 'undefined') {
            console.error('[BarakahPush] Firebase Messaging SDK not loaded. Include firebase-messaging-compat.js');
            return false;
        }

        // Get messaging instance
        messaging = firebase.messaging();

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('[BarakahPush] Notification permission not granted:', permission);
            return false;
        }

        // Get FCM token
        await getFCMToken();

        // Set up message handler for DATA messages (app-level)
        messaging.onMessage((payload) => {
            console.log('[BarakahPush] Message received:', payload);
            handleBarakahPushMessage(payload);
        });

        console.log('[BarakahPush] ✅ Initialized successfully');
        return true;
    } catch (error) {
        console.error('[BarakahPush] ❌ Initialization error:', error);
        return false;
    }
}

/**
 * Get FCM token and store it
 */
async function getFCMToken() {
    try {
        if (!messaging) {
            console.error('[BarakahPush] Messaging not initialized');
            return null;
        }

        // Get current token
        const token = await messaging.getToken({
            vapidKey: window.firebaseConfig?.vapidKey
        });

        if (!token) {
            console.warn('[BarakahPush] No FCM token available');
            return null;
        }

        currentFCMToken = token;
        console.log('[BarakahPush] FCM Token:', token);

        // Store token in Supabase
        await storeFCMToken(token);

        // Set up token refresh handler
        messaging.onTokenRefresh(async () => {
            console.log('[BarakahPush] Token refreshed');
            const newToken = await messaging.getToken({
                vapidKey: window.firebaseConfig?.vapidKey
            });
            if (newToken) {
                currentFCMToken = newToken;
                await storeFCMToken(newToken);
            }
        });

        return token;
    } catch (error) {
        console.error('[BarakahPush] Error getting FCM token:', error);
        return null;
    }
}

/**
 * Store FCM token in Supabase
 */
async function storeFCMToken(token) {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) {
            console.error('[BarakahPush] Supabase client not available');
            return false;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('[BarakahPush] No user logged in, token stored locally only');
            // Store in localStorage for later
            localStorage.setItem('barakahpush_token', token);
            localStorage.setItem('barakahpush_token_platform', navigator.userAgent);
            return false;
        }

        // Detect platform
        const platform = /Android/i.test(navigator.userAgent) ? 'android' : 
                        /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : 'web';

        // Upsert token (update if exists, insert if new)
        const { error } = await supabase
            .from('user_tokens')
            .upsert({
                user_id: user.id,
                fcm_token: token,
                platform: platform,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('[BarakahPush] Error storing token:', error);
            return false;
        }

        console.log('[BarakahPush] ✅ Token stored successfully');
        return true;
    } catch (error) {
        console.error('[BarakahPush] Error in storeFCMToken:', error);
        return false;
    }
}

/**
 * Handle incoming FCM DATA message (app-level notification)
 */
function handleBarakahPushMessage(payload) {
    try {
        console.log('[BarakahPush] Handling message:', payload);

        // Extract notification data
        const data = payload.data || {};
        const notificationId = data.notification_id;
        const title = data.title || 'New Notification';
        const body = data.body || '';
        const type = data.type || 'general';

        // Show in-app notification
        showBarakahPushNotification(title, body, type);

        // Update badge count
        updateBarakahPushBadge();

        // Store notification locally for offline access
        storeNotificationLocally({
            id: notificationId || Date.now().toString(),
            title: title,
            body: body,
            type: type,
            created_at: new Date().toISOString(),
            is_read: false
        });
    } catch (error) {
        console.error('[BarakahPush] Error handling message:', error);
    }
}

/**
 * Show in-app notification (WebView-safe)
 */
function showBarakahPushNotification(title, body, type = 'general') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'barakahpush-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: start;">
            <i class="fas fa-bell" style="color: #4CAF50; font-size: 20px; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <div style="font-weight: 600; color: #212121; margin-bottom: 4px;">${sanitizeHTML(title)}</div>
                <div style="font-size: 14px; color: #757575;">${sanitizeHTML(body)}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; padding: 4px;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Update badge count
 */
async function updateBarakahPushBadge() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get unread count from Supabase
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('id')
            .eq('is_read', false);

        if (error) {
            console.error('[BarakahPush] Error fetching unread count:', error);
            return;
        }

        const unreadCount = notifications?.length || 0;

        // Update all badge elements
        document.querySelectorAll('.notifications-btn .badge').forEach(badge => {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'inline' : 'none';
        });
    } catch (error) {
        console.error('[BarakahPush] Error updating badge:', error);
    }
}

/**
 * Store notification locally for offline access
 */
function storeNotificationLocally(notification) {
    try {
        const stored = JSON.parse(localStorage.getItem('barakahpush_notifications') || '[]');
        stored.unshift(notification);
        // Keep only last 100 notifications
        if (stored.length > 100) {
            stored.splice(100);
        }
        localStorage.setItem('barakahpush_notifications', JSON.stringify(stored));
    } catch (error) {
        console.error('[BarakahPush] Error storing notification locally:', error);
    }
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.initializeBarakahPush = initializeBarakahPush;
    window.getFCMToken = getFCMToken;
    window.updateBarakahPushBadge = updateBarakahPushBadge;
}

