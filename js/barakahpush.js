/**
 * BarakahPush Notification System – Active
 * 
 * Main service file for BarakahPush notification management
 * Handles: fetching notifications, marking as read, badge updates
 */

// BarakahPush Notification System – Active
let cachedNotifications = [];
let unreadCount = 0;

/**
 * Fetch notifications from Supabase
 */
async function fetchBarakahPushNotifications() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) {
            console.error('[BarakahPush] Supabase client not available');
            return [];
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('[BarakahPush] No user logged in');
            return [];
        }

        // Fetch notifications for current user
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('[BarakahPush] Error fetching notifications:', error);
            return [];
        }

        cachedNotifications = notifications || [];
        updateUnreadCount();
        return cachedNotifications;
    } catch (error) {
        console.error('[BarakahPush] Error in fetchBarakahPushNotifications:', error);
        return [];
    }
}

/**
 * Update unread count
 */
function updateUnreadCount() {
    unreadCount = cachedNotifications.filter(n => !n.is_read).length;
    updateBarakahPushBadge();
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId) {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return false;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.id);

        if (error) {
            console.error('[BarakahPush] Error marking notification as read:', error);
            return false;
        }

        // Update local cache
        const notification = cachedNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.is_read = true;
        }

        updateUnreadCount();
        return true;
    } catch (error) {
        console.error('[BarakahPush] Error in markNotificationAsRead:', error);
        return false;
    }
}

/**
 * Get user notification preferences
 */
async function getUserPreferences() {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('[BarakahPush] Error fetching preferences:', error);
            return null;
        }

        // Return defaults if not found
        return preferences || {
            user_id: user.id,
            allow_email: true,
            allow_push: true
        };
    } catch (error) {
        console.error('[BarakahPush] Error in getUserPreferences:', error);
        return null;
    }
}

/**
 * Update user notification preferences
 */
async function updateUserPreferences(allowEmail, allowPush) {
    try {
        const supabase = window.getSupabaseClient();
        if (!supabase) return false;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: user.id,
                allow_email: allowEmail,
                allow_push: allowPush,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('[BarakahPush] Error updating preferences:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[BarakahPush] Error in updateUserPreferences:', error);
        return false;
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.fetchBarakahPushNotifications = fetchBarakahPushNotifications;
    window.markNotificationAsRead = markNotificationAsRead;
    window.getUserPreferences = getUserPreferences;
    window.updateUserPreferences = updateUserPreferences;
    window.updateBarakahPushBadge = updateBarakahPushBadge;
}

