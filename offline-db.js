/**
 * IndexedDB Helper for Offline Prayer Times Storage
 * Simple, readable IndexedDB wrapper for KIUMA PWA
 * 
 * Stores:
 * - Prayer times by date
 * - User location (latitude, longitude)
 * - Last sync timestamp
 */

// ============================================
// DATABASE CONFIGURATION
// ============================================

const DB_NAME = 'kiuma_prayer_times_db';
const DB_VERSION = 1;

// Object store names
const STORES = {
    PRAYER_TIMES: 'prayer_times',
    USER_LOCATION: 'user_location',
    SYNC_METADATA: 'sync_metadata'
};

// ============================================
// DATABASE INITIALIZATION
// ============================================

/**
 * Open or create the IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        // Check if IndexedDB is supported
        if (!window.indexedDB) {
            reject(new Error('IndexedDB is not supported in this browser'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        // Handle database creation/upgrade
        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create prayer_times store (date as key)
            if (!db.objectStoreNames.contains(STORES.PRAYER_TIMES)) {
                const prayerStore = db.createObjectStore(STORES.PRAYER_TIMES, { keyPath: 'date' });
                prayerStore.createIndex('date', 'date', { unique: true });
            }

            // Create user_location store (single record)
            if (!db.objectStoreNames.contains(STORES.USER_LOCATION)) {
                db.createObjectStore(STORES.USER_LOCATION, { keyPath: 'id' });
            }

            // Create sync_metadata store (single record)
            if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
                db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(new Error('Failed to open database: ' + request.error));
        };
    });
}

// ============================================
// PRAYER TIMES OPERATIONS
// ============================================

/**
 * Save prayer times for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} prayerTimes - Prayer times object
 * @param {Object} prayerTimes.fajr - { adhan: '05:30', iqaama: '05:40' }
 * @param {Object} prayerTimes.dhuhr - { adhan: '12:15', iqaama: '12:25' }
 * @param {Object} prayerTimes.asr - { adhan: '15:45', iqaama: '15:55' }
 * @param {Object} prayerTimes.maghrib - { adhan: '18:20', iqaama: '18:25' }
 * @param {Object} prayerTimes.isha - { adhan: '19:45', iqaama: '19:55' }
 * @returns {Promise<void>}
 */
async function savePrayerTimes(date, prayerTimes) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.PRAYER_TIMES], 'readwrite');
        const store = transaction.objectStore(STORES.PRAYER_TIMES);

        const data = {
            date: date,
            prayerTimes: prayerTimes,
            savedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to save prayer times: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error saving prayer times:', error);
        throw error;
    }
}

/**
 * Get prayer times for a specific date
 * @param {string} date - Date in YYYY-MM-DD format (defaults to today)
 * @returns {Promise<Object|null>} Prayer times object or null if not found
 */
async function getPrayerTimes(date = null) {
    try {
        // Default to today's date if not provided
        if (!date) {
            const today = new Date();
            date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }

        const db = await openDatabase();
        const transaction = db.transaction([STORES.PRAYER_TIMES], 'readonly');
        const store = transaction.objectStore(STORES.PRAYER_TIMES);

        return new Promise((resolve, reject) => {
            const request = store.get(date);
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.prayerTimes);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(new Error('Failed to get prayer times: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error getting prayer times:', error);
        throw error;
    }
}

/**
 * Get prayer times for multiple dates
 * @param {Array<string>} dates - Array of dates in YYYY-MM-DD format
 * @returns {Promise<Object>} Object with dates as keys and prayer times as values
 */
async function getPrayerTimesForDates(dates) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.PRAYER_TIMES], 'readonly');
        const store = transaction.objectStore(STORES.PRAYER_TIMES);

        const results = {};

        return new Promise((resolve, reject) => {
            let completed = 0;
            const total = dates.length;

            if (total === 0) {
                resolve(results);
                return;
            }

            dates.forEach(date => {
                const request = store.get(date);
                request.onsuccess = () => {
                    if (request.result) {
                        results[date] = request.result.prayerTimes;
                    }
                    completed++;
                    if (completed === total) {
                        resolve(results);
                    }
                };
                request.onerror = () => {
                    completed++;
                    if (completed === total) {
                        resolve(results);
                    }
                };
            });
        });
    } catch (error) {
        console.error('[DB] Error getting prayer times for dates:', error);
        throw error;
    }
}

/**
 * Get all stored prayer times
 * @returns {Promise<Array>} Array of prayer time records
 */
async function getAllPrayerTimes() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.PRAYER_TIMES], 'readonly');
        const store = transaction.objectStore(STORES.PRAYER_TIMES);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to get all prayer times: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error getting all prayer times:', error);
        throw error;
    }
}

// ============================================
// USER LOCATION OPERATIONS
// ============================================

/**
 * Save user location
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} locationName - Optional location name (e.g., "Kampala, Uganda")
 * @returns {Promise<void>}
 */
async function saveUserLocation(latitude, longitude, locationName = null) {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.USER_LOCATION], 'readwrite');
        const store = transaction.objectStore(STORES.USER_LOCATION);

        const data = {
            id: 'current_location',
            latitude: latitude,
            longitude: longitude,
            locationName: locationName,
            savedAt: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to save location: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error saving location:', error);
        throw error;
    }
}

/**
 * Get user location
 * @returns {Promise<Object|null>} Location object or null if not found
 */
async function getUserLocation() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.USER_LOCATION], 'readonly');
        const store = transaction.objectStore(STORES.USER_LOCATION);

        return new Promise((resolve, reject) => {
            const request = store.get('current_location');
            request.onsuccess = () => {
                if (request.result) {
                    resolve({
                        latitude: request.result.latitude,
                        longitude: request.result.longitude,
                        locationName: request.result.locationName
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(new Error('Failed to get location: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error getting location:', error);
        throw error;
    }
}

// ============================================
// SYNC METADATA OPERATIONS
// ============================================

/**
 * Save last sync timestamp
 * @param {string} syncType - Type of sync (e.g., 'prayer_times', 'all')
 * @returns {Promise<void>}
 */
async function saveLastSyncTimestamp(syncType = 'prayer_times') {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.SYNC_METADATA], 'readwrite');
        const store = transaction.objectStore(STORES.SYNC_METADATA);

        const data = {
            id: 'last_sync',
            syncType: syncType,
            timestamp: new Date().toISOString(),
            timestampMs: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to save sync timestamp: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error saving sync timestamp:', error);
        throw error;
    }
}

/**
 * Get last sync timestamp
 * @returns {Promise<Object|null>} Sync metadata object or null if not found
 */
async function getLastSyncTimestamp() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction([STORES.SYNC_METADATA], 'readonly');
        const store = transaction.objectStore(STORES.SYNC_METADATA);

        return new Promise((resolve, reject) => {
            const request = store.get('last_sync');
            request.onsuccess = () => {
                if (request.result) {
                    resolve({
                        timestamp: request.result.timestamp,
                        timestampMs: request.result.timestampMs,
                        syncType: request.result.syncType
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(new Error('Failed to get sync timestamp: ' + request.error));
        });
    } catch (error) {
        console.error('[DB] Error getting sync timestamp:', error);
        throw error;
    }
}

/**
 * Check if sync is needed (based on time since last sync)
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @returns {Promise<boolean>} True if sync is needed
 */
async function isSyncNeeded(maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
        const lastSync = await getLastSyncTimestamp();
        
        if (!lastSync) {
            return true; // Never synced, need to sync
        }

        const ageMs = Date.now() - lastSync.timestampMs;
        return ageMs > maxAgeMs;
    } catch (error) {
        console.error('[DB] Error checking sync status:', error);
        return true; // On error, assume sync is needed
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format date to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
function getTodayDate() {
    return formatDate(new Date());
}

/**
 * Clear all data from database (use with caution)
 * @returns {Promise<void>}
 */
async function clearAllData() {
    try {
        const db = await openDatabase();
        
        // Clear prayer times
        const prayerTransaction = db.transaction([STORES.PRAYER_TIMES], 'readwrite');
        await new Promise((resolve, reject) => {
            const request = prayerTransaction.objectStore(STORES.PRAYER_TIMES).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Clear location
        const locationTransaction = db.transaction([STORES.USER_LOCATION], 'readwrite');
        await new Promise((resolve, reject) => {
            const request = locationTransaction.objectStore(STORES.USER_LOCATION).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Clear sync metadata
        const syncTransaction = db.transaction([STORES.SYNC_METADATA], 'readwrite');
        await new Promise((resolve, reject) => {
            const request = syncTransaction.objectStore(STORES.SYNC_METADATA).clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        console.log('[DB] All data cleared');
    } catch (error) {
        console.error('[DB] Error clearing data:', error);
        throw error;
    }
}

// ============================================
// EXPORT FUNCTIONS (for use in other files)
// ============================================

// Make functions available globally
window.PrayerTimesDB = {
    // Prayer times
    savePrayerTimes,
    getPrayerTimes,
    getPrayerTimesForDates,
    getAllPrayerTimes,
    
    // Location
    saveUserLocation,
    getUserLocation,
    
    // Sync
    saveLastSyncTimestamp,
    getLastSyncTimestamp,
    isSyncNeeded,
    
    // Utilities
    formatDate,
    getTodayDate,
    clearAllData
};

