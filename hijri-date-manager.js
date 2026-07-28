/**
 * KIUMA Hijri Date Manager
 * - Fetches and caches Hijri date when online
 * - Always displays cached Hijri date even when offline
 * - Auto-refreshes in background using Service Worker
 */

class HijriDateManager {
    constructor() {
        this.CACHE_KEY = 'kiuma_hijri_date_cache';
        this.CACHE_TIME_KEY = 'kiuma_hijri_date_time';
        this.API_URLS = [
            'https://api.aladhan.com/v1/gToH?date=' + this.getTodayString(),
            'https://api.hijri.app/v2/convert?g=' + this.getTodayString()
        ];
        this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
        this.hijriElement = null;
    }

    getTodayString() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    /**
     * Format Hijri date as readable string
     */
    formatHijriDate(day, month, year) {
        const months = [
            'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
            'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
            'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
        ];
        
        const monthName = months[month - 1] || 'Unknown';
        return `${day} ${monthName} ${year} AH`;
    }

    /**
     * Fetch Hijri date from API
     */
    async fetchHijriDate() {
        for (const url of this.API_URLS) {
            try {
                const response = await fetch(url, { 
                    timeout: 5000,
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) continue;
                
                const data = await response.json();
                let hijri = null;

                // Try Aladhan API format
                if (data.data && data.data.hijri) {
                    hijri = data.data.hijri;
                } 
                // Try Hijri.app API format
                else if (data.data && data.data.hijri) {
                    hijri = data.data.hijri;
                }

                if (hijri && hijri.day && hijri.month && hijri.year) {
                    return {
                        day: hijri.day,
                        month: hijri.month,
                        year: hijri.year
                    };
                }
            } catch (error) {
                console.warn('Failed to fetch from API:', error);
                continue;
            }
        }
        
        return null;
    }

    /**
     * Save Hijri date to cache
     */
    saveCacheToStorage(hijri) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(hijri));
            localStorage.setItem(this.CACHE_TIME_KEY, new Date().getTime().toString());
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    /**
     * Load Hijri date from cache
     */
    loadCacheFromStorage() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            const cacheTime = localStorage.getItem(this.CACHE_TIME_KEY);
            
            if (!cached || !cacheTime) return null;

            // Check if cache is still valid
            const age = new Date().getTime() - parseInt(cacheTime);
            if (age > this.CACHE_DURATION) {
                this.clearCache();
                return null;
            }

            return JSON.parse(cached);
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
            return null;
        }
    }

    /**
     * Clear Hijri date cache
     */
    clearCache() {
        try {
            localStorage.removeItem(this.CACHE_KEY);
            localStorage.removeItem(this.CACHE_TIME_KEY);
        } catch (e) {
            console.warn('Failed to clear cache:', e);
        }
    }

    /**
     * Update the Hijri date element on page
     */
    updateHijriElement(hijri) {
        if (!this.hijriElement) {
            this.hijriElement = document.getElementById('hijriDate');
        }

        if (!this.hijriElement) return;

        if (!hijri || !hijri.day || !hijri.month || !hijri.year) {
            this.hijriElement.textContent = 'Unable to load Hijri date';
            return;
        }

        const formattedDate = this.formatHijriDate(hijri.day, hijri.month, hijri.year);
        this.hijriElement.textContent = formattedDate;
    }

    /**
     * Main initialization - tries to fetch and cache, falls back to cached if offline
     */
    async initialize() {
        // Always first try to use cached date
        let hijri = this.loadCacheFromStorage();

        if (hijri) {
            // Display cached date immediately (even if offline)
            this.updateHijriElement(hijri);
        } else {
            // No cache, show loading state
            this.updateHijriElement({ day: 'Loading', month: 1, year: 1440 });
        }

        // If online, try to fetch fresh data
        if (navigator.onLine) {
            try {
                const freshHijri = await this.fetchHijriDate();
                
                if (freshHijri) {
                    // Update cache with fresh data
                    this.saveCacheToStorage(freshHijri);
                    // Update UI with fresh data
                    this.updateHijriElement(freshHijri);
                } else {
                    // Fetch failed, keep cached data
                    if (hijri) {
                        this.updateHijriElement(hijri);
                    } else {
                        this.updateHijriElement({ day: '?', month: 1, year: 1440 });
                    }
                }
            } catch (error) {
                console.warn('Hijri date fetch error:', error);
                // Keep cached data or show error
                if (hijri) {
                    this.updateHijriElement(hijri);
                }
            }
        } else {
            // Offline - use cached data
            if (!hijri) {
                this.updateHijriElement({ day: 'Offline', month: 1, year: 1440 });
            }
        }
    }

    /**
     * Refresh Hijri date (can be called periodically)
     */
    async refresh() {
        if (!navigator.onLine) return;

        try {
            const freshHijri = await this.fetchHijriDate();
            if (freshHijri) {
                this.saveCacheToStorage(freshHijri);
                this.updateHijriElement(freshHijri);
            }
        } catch (error) {
            console.warn('Hijri date refresh error:', error);
        }
    }

    /**
     * Handle message from service worker with updated Hijri date
     */
    handleServiceWorkerMessage(data) {
        if (data && data.day && data.month && data.year) {
            this.saveCacheToStorage({
                day: data.day,
                month: data.month,
                year: data.year
            });
            this.updateHijriElement({
                day: data.day,
                month: data.month,
                year: data.year
            });
        }
    }
}

// Global instance
window.hijriDateManager = null;

/**
 * Initialize Hijri date manager when DOM is ready
 */
function initHijriDateManager() {
    if (window.hijriDateManager) return;

    window.hijriDateManager = new HijriDateManager();
    window.hijriDateManager.initialize();

    // Auto-refresh every hour
    setInterval(() => {
        if (window.hijriDateManager) {
            window.hijriDateManager.refresh();
        }
    }, 60 * 60 * 1000);

    // Refresh when coming back online
    window.addEventListener('online', () => {
        if (window.hijriDateManager) {
            window.hijriDateManager.refresh();
        }
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'HIJRI_DATE_UPDATE' && window.hijriDateManager) {
                window.hijriDateManager.handleServiceWorkerMessage(event.data.data);
            }
        });

        // Register background sync for Hijri date refresh (every 12 hours)
        navigator.serviceWorker.ready.then((registration) => {
            // Request periodic background sync if available
            if (registration.periodicSync) {
                registration.periodicSync.register('refresh-hijri-date-periodic', {
                    minInterval: 12 * 60 * 60 * 1000 // 12 hours
                }).catch(() => {
                    console.log('Periodic sync not available, will use timer instead');
                });
            }

            // Also request one-time sync when app becomes online
            if (navigator.onLine && registration.sync) {
                registration.sync.register('refresh-hijri-date').catch(() => {
                    console.log('Background sync not available');
                });
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHijriDateManager);
} else {
    initHijriDateManager();
}
