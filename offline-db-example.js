/**
 * IndexedDB Usage Examples for Prayer Times
 * 
 * This file shows how to use the offline-db.js helper functions
 * in your application code.
 */

// ============================================
// EXAMPLE 1: Save Prayer Times for Today
// ============================================

async function exampleSavePrayerTimes() {
    const today = window.PrayerTimesDB.getTodayDate(); // e.g., "2024-01-15"
    
    const prayerTimes = {
        fajr: { adhan: '05:30', iqaama: '05:40' },
        dhuhr: { adhan: '12:15', iqaama: '12:25' },
        asr: { adhan: '15:45', iqaama: '15:55' },
        maghrib: { adhan: '18:20', iqaama: '18:25' },
        isha: { adhan: '19:45', iqaama: '19:55' }
    };
    
    try {
        await window.PrayerTimesDB.savePrayerTimes(today, prayerTimes);
        console.log('Prayer times saved for', today);
    } catch (error) {
        console.error('Failed to save prayer times:', error);
    }
}

// ============================================
// EXAMPLE 2: Get Prayer Times for Today
// ============================================

async function exampleGetPrayerTimes() {
    try {
        // Get today's prayer times
        const prayers = await window.PrayerTimesDB.getPrayerTimes();
        
        if (prayers) {
            console.log('Today\'s prayer times:', prayers);
            console.log('Fajr Adhan:', prayers.fajr.adhan);
            console.log('Dhuhr Iqaama:', prayers.dhuhr.iqaama);
        } else {
            console.log('No prayer times found for today');
        }
    } catch (error) {
        console.error('Failed to get prayer times:', error);
    }
}

// ============================================
// EXAMPLE 3: Get Prayer Times for Specific Date
// ============================================

async function exampleGetPrayerTimesForDate() {
    const date = '2024-01-20'; // YYYY-MM-DD format
    
    try {
        const prayers = await window.PrayerTimesDB.getPrayerTimes(date);
        
        if (prayers) {
            console.log(`Prayer times for ${date}:`, prayers);
        } else {
            console.log(`No prayer times found for ${date}`);
        }
    } catch (error) {
        console.error('Failed to get prayer times:', error);
    }
}

// ============================================
// EXAMPLE 4: Save User Location
// ============================================

async function exampleSaveLocation() {
    // Kampala, Uganda coordinates
    const latitude = 0.3476;
    const longitude = 32.5825;
    const locationName = 'Kampala, Uganda';
    
    try {
        await window.PrayerTimesDB.saveUserLocation(latitude, longitude, locationName);
        console.log('Location saved:', locationName);
    } catch (error) {
        console.error('Failed to save location:', error);
    }
}

// ============================================
// EXAMPLE 5: Get User Location
// ============================================

async function exampleGetLocation() {
    try {
        const location = await window.PrayerTimesDB.getUserLocation();
        
        if (location) {
            console.log('User location:', location);
            console.log('Latitude:', location.latitude);
            console.log('Longitude:', location.longitude);
            console.log('Location name:', location.locationName);
        } else {
            console.log('No location stored');
        }
    } catch (error) {
        console.error('Failed to get location:', error);
    }
}

// ============================================
// EXAMPLE 6: Save Sync Timestamp
// ============================================

async function exampleSaveSyncTimestamp() {
    try {
        await window.PrayerTimesDB.saveLastSyncTimestamp('prayer_times');
        console.log('Sync timestamp saved');
    } catch (error) {
        console.error('Failed to save sync timestamp:', error);
    }
}

// ============================================
// EXAMPLE 7: Check if Sync is Needed
// ============================================

async function exampleCheckSyncNeeded() {
    try {
        // Check if sync is needed (default: 24 hours)
        const syncNeeded = await window.PrayerTimesDB.isSyncNeeded();
        
        if (syncNeeded) {
            console.log('Sync is needed - last sync was more than 24 hours ago');
            // Perform sync here
        } else {
            console.log('Sync not needed - recently synced');
        }
        
        // Custom max age (e.g., 1 hour = 3600000 ms)
        const syncNeeded1Hour = await window.PrayerTimesDB.isSyncNeeded(3600000);
        console.log('Sync needed (1 hour check):', syncNeeded1Hour);
        
    } catch (error) {
        console.error('Failed to check sync status:', error);
    }
}

// ============================================
// EXAMPLE 8: Offline-First Pattern
// ============================================

async function exampleOfflineFirst() {
    try {
        // 1. Try to get from IndexedDB first (works offline)
        let prayers = await window.PrayerTimesDB.getPrayerTimes();
        
        // 2. If not found, use defaults
        if (!prayers) {
            prayers = {
                fajr: { adhan: '05:30', iqaama: '05:40' },
                dhuhr: { adhan: '12:15', iqaama: '12:25' },
                asr: { adhan: '15:45', iqaama: '15:55' },
                maghrib: { adhan: '18:20', iqaama: '18:25' },
                isha: { adhan: '19:45', iqaama: '19:55' }
            };
        }
        
        // 3. Display prayer times (works offline)
        displayPrayerTimes(prayers);
        
        // 4. If online, sync in background
        if (navigator.onLine) {
            syncFromAPI();
        }
        
    } catch (error) {
        console.error('Error in offline-first pattern:', error);
    }
}

async function syncFromAPI() {
    try {
        // Check if sync is needed
        const syncNeeded = await window.PrayerTimesDB.isSyncNeeded();
        if (!syncNeeded) {
            return; // Already synced recently
        }
        
        // Fetch from API
        const response = await fetch('/api/get_prayer_times.php');
        const data = await response.json();
        
        if (data.success && data.prayerTimes) {
            // Save to IndexedDB
            const today = window.PrayerTimesDB.getTodayDate();
            await window.PrayerTimesDB.savePrayerTimes(today, data.prayerTimes);
            await window.PrayerTimesDB.saveLastSyncTimestamp('prayer_times');
            
            // Update display
            displayPrayerTimes(data.prayerTimes);
        }
    } catch (error) {
        console.error('API sync failed:', error);
        // Continue using cached data
    }
}

function displayPrayerTimes(prayers) {
    // Update UI with prayer times
    console.log('Displaying prayer times:', prayers);
}

// ============================================
// EXAMPLE 9: Get Prayer Times for Multiple Dates
// ============================================

async function exampleGetMultipleDates() {
    const dates = [
        '2024-01-15',
        '2024-01-16',
        '2024-01-17'
    ];
    
    try {
        const allPrayers = await window.PrayerTimesDB.getPrayerTimesForDates(dates);
        
        dates.forEach(date => {
            if (allPrayers[date]) {
                console.log(`Prayer times for ${date}:`, allPrayers[date]);
            } else {
                console.log(`No prayer times found for ${date}`);
            }
        });
    } catch (error) {
        console.error('Failed to get prayer times for dates:', error);
    }
}

// ============================================
// EXAMPLE 10: Get All Stored Prayer Times
// ============================================

async function exampleGetAllPrayerTimes() {
    try {
        const allPrayers = await window.PrayerTimesDB.getAllPrayerTimes();
        
        console.log(`Total prayer time records: ${allPrayers.length}`);
        
        allPrayers.forEach(record => {
            console.log(`Date: ${record.date}, Saved at: ${record.savedAt}`);
            console.log('Prayer times:', record.prayerTimes);
        });
    } catch (error) {
        console.error('Failed to get all prayer times:', error);
    }
}

// ============================================
// EXAMPLE 11: Listen for Online/Offline Events
// ============================================

// Add this to your main script
window.addEventListener('online', async () => {
    console.log('Back online - syncing prayer times...');
    
    try {
        const syncNeeded = await window.PrayerTimesDB.isSyncNeeded();
        if (syncNeeded) {
            await syncFromAPI();
        }
    } catch (error) {
        console.error('Error syncing after coming online:', error);
    }
});

window.addEventListener('offline', () => {
    console.log('Gone offline - using cached prayer times');
    // Prayer times will automatically load from IndexedDB
});

