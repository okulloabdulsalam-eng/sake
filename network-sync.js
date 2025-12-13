/**
 * Network Sync Manager
 * Handles automatic data synchronization when online/offline
 * Non-blocking, updates UI in place
 */

// ============================================
// SYNC MANAGER STATE
// ============================================

const SyncManager = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    syncQueue: [],
    
    // Callbacks for UI updates
    onSyncStart: null,
    onSyncComplete: null,
    onSyncError: null,
    onStatusChange: null
};

// ============================================
// SYNC FUNCTIONS FOR DIFFERENT DATA TYPES
// ============================================

/**
 * Sync prayer times from API
 */
async function syncPrayerTimes() {
    if (!window.PrayerTimesDB) {
        return { success: false, reason: 'IndexedDB not available' };
    }
    
    try {
        // Check if sync is needed
        const syncNeeded = await window.PrayerTimesDB.isSyncNeeded(24 * 60 * 60 * 1000);
        if (!syncNeeded) {
            return { success: true, skipped: true, reason: 'Recently synced' };
        }
        
        const API_BASE_URL = window.API_BASE_URL || '/api';
        const today = window.PrayerTimesDB.getTodayDate();
        
        // Try to fetch from API
        // Note: Uncomment when API endpoint is ready
        /*
        const response = await fetch(`${API_BASE_URL}/get_prayer_times.php?date=${today}`, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.prayerTimes) {
                await window.PrayerTimesDB.savePrayerTimes(today, data.prayerTimes);
                await window.PrayerTimesDB.saveLastSyncTimestamp('prayer_times');
                
                // Update UI if on current date
                const currentDate = window.PrayerTimesDB.getTodayDate();
                if (today === currentDate && typeof updatePrayerTimesDisplay === 'function') {
                    updatePrayerTimesDisplay(data.prayerTimes);
                    if (typeof updateNextPrayer === 'function') {
                        updateNextPrayer(data.prayerTimes);
                    }
                }
                
                return { success: true, data: data.prayerTimes };
            }
        }
        */
        
        // For now, just update timestamp
        await window.PrayerTimesDB.saveLastSyncTimestamp('prayer_times');
        return { success: true, skipped: true, reason: 'API not configured' };
        
    } catch (error) {
        console.error('[Sync] Prayer times sync error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync notifications from API
 */
async function syncNotifications() {
    try {
        const API_BASE_URL = window.API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/get_notifications.php`, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.notifications) {
                // Store in localStorage for now (can be migrated to IndexedDB later)
                const notificationsData = data.notifications.map(notif => ({
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    type: notif.type,
                    icon: notif.type === 'white_days' ? 'fas fa-moon' : 
                          notif.type === 'fasting' ? 'fas fa-calendar-check' : 'fas fa-bell',
                    date: notif.created_date,
                    isRead: notif.is_read === 1
                }));
                
                localStorage.setItem('notificationsData', JSON.stringify(notificationsData));
                
                // Update UI if on notifications page
                if (typeof loadNotificationsFromStorage === 'function') {
                    loadNotificationsFromStorage();
                }
                
                return { success: true, count: data.notifications.length };
            }
        }
        
        return { success: false, reason: 'Invalid response' };
        
    } catch (error) {
        console.error('[Sync] Notifications sync error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync books from API
 */
async function syncBooks() {
    try {
        const API_BASE_URL = window.API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/get_books.php`, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.books) {
                // Store in localStorage for offline access
                localStorage.setItem('cachedBooks', JSON.stringify(data.books));
                localStorage.setItem('cachedBooksTimestamp', Date.now().toString());
                
                // Update UI if on library page
                if (typeof loadBooksFromStorage === 'function') {
                    loadBooksFromStorage();
                }
                
                return { success: true, count: data.books.length };
            }
        }
        
        return { success: false, reason: 'Invalid response' };
        
    } catch (error) {
        console.error('[Sync] Books sync error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync media from API
 */
async function syncMedia() {
    try {
        const API_BASE_URL = window.API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE_URL}/get_media.php`, {
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.media) {
                // Store in localStorage for offline access
                localStorage.setItem('cachedMedia', JSON.stringify(data.media));
                localStorage.setItem('cachedMediaTimestamp', Date.now().toString());
                
                // Update UI if on media page
                if (typeof loadMediaFromStorage === 'function') {
                    loadMediaFromStorage();
                }
                
                return { success: true, count: data.media.length };
            }
        }
        
        return { success: false, reason: 'Invalid response' };
        
    } catch (error) {
        console.error('[Sync] Media sync error:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// MAIN SYNC FUNCTION
// ============================================

/**
 * Perform full data sync (non-blocking)
 */
async function performSync() {
    if (SyncManager.isSyncing) {
        console.log('[Sync] Sync already in progress');
        return;
    }
    
    if (!SyncManager.isOnline) {
        console.log('[Sync] Offline - skipping sync');
        return;
    }
    
    SyncManager.isSyncing = true;
    SyncManager.lastSyncTime = Date.now();
    
    // Notify UI that sync started
    if (SyncManager.onSyncStart) {
        SyncManager.onSyncStart();
    }
    updateSyncIndicator('syncing');
    
    try {
        // Sync all data types in parallel (non-blocking)
        const results = await Promise.allSettled([
            syncPrayerTimes(),
            syncNotifications(),
            syncBooks(),
            syncMedia()
        ]);
        
        // Process results
        const summary = {
            prayerTimes: results[0].status === 'fulfilled' ? results[0].value : { success: false },
            notifications: results[1].status === 'fulfilled' ? results[1].value : { success: false },
            books: results[2].status === 'fulfilled' ? results[2].value : { success: false },
            media: results[3].status === 'fulfilled' ? results[3].value : { success: false }
        };
        
        const successCount = Object.values(summary).filter(r => r.success).length;
        const totalCount = Object.keys(summary).length;
        
        console.log(`[Sync] Complete: ${successCount}/${totalCount} successful`);
        
        // Notify UI that sync completed
        if (SyncManager.onSyncComplete) {
            SyncManager.onSyncComplete(summary);
        }
        updateSyncIndicator('online');
        
        return summary;
        
    } catch (error) {
        console.error('[Sync] Sync error:', error);
        
        if (SyncManager.onSyncError) {
            SyncManager.onSyncError(error);
        }
        updateSyncIndicator('error');
        
        return { success: false, error: error.message };
        
    } finally {
        SyncManager.isSyncing = false;
    }
}

// ============================================
// NETWORK DETECTION
// ============================================

/**
 * Handle online event
 */
function handleOnline() {
    console.log('[Sync] Network online');
    SyncManager.isOnline = true;
    updateSyncIndicator('online');
    
    if (SyncManager.onStatusChange) {
        SyncManager.onStatusChange(true);
    }
    
    // Perform sync automatically when coming online
    // Small delay to ensure network is stable
    setTimeout(() => {
        performSync();
    }, 1000);
}

/**
 * Handle offline event
 */
function handleOffline() {
    console.log('[Sync] Network offline');
    SyncManager.isOnline = false;
    updateSyncIndicator('offline');
    
    if (SyncManager.onStatusChange) {
        SyncManager.onStatusChange(false);
    }
}

// ============================================
// SYNC INDICATOR UI
// ============================================

/**
 * Update sync status indicator in UI
 */
function updateSyncIndicator(status) {
    let indicator = document.getElementById('syncIndicator');
    
    if (!indicator) {
        // Create indicator if it doesn't exist
        indicator = document.createElement('div');
        indicator.id = 'syncIndicator';
        indicator.className = 'sync-indicator';
        document.body.appendChild(indicator);
    }
    
    // Update status
    indicator.className = `sync-indicator sync-${status}`;
    indicator.setAttribute('data-status', status);
    
    // Update tooltip
    const statusText = {
        'online': 'Online',
        'offline': 'Offline',
        'syncing': 'Syncing...',
        'error': 'Sync error'
    };
    indicator.title = statusText[status] || 'Unknown';
}

/**
 * Initialize sync manager
 */
function initSyncManager() {
    // Set initial status
    SyncManager.isOnline = navigator.onLine;
    updateSyncIndicator(SyncManager.isOnline ? 'online' : 'offline');
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Perform initial sync if online
    if (SyncManager.isOnline) {
        // Delay initial sync to let page load first
        setTimeout(() => {
            performSync();
        }, 2000);
    }
    
    // Periodic sync when online (every 5 minutes)
    setInterval(() => {
        if (SyncManager.isOnline && !SyncManager.isSyncing) {
            performSync();
        }
    }, 5 * 60 * 1000);
    
    console.log('[Sync] Sync manager initialized');
}

// ============================================
// EXPORT
// ============================================

// Make sync manager available globally
window.SyncManager = SyncManager;
window.performSync = performSync;
window.initSyncManager = initSyncManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSyncManager);
} else {
    initSyncManager();
}

