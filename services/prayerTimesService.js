/**
 * Prayer Times Service
 * 
 * Fetches prayer times from Supabase database (admin-defined only)
 * NO automatic calculations - displays times exactly as stored
 */

import { getSupabaseClient } from './supabaseClient.js';

/**
 * Get today's prayer times from Supabase
 * @returns {Promise<Object|null>} Prayer times object or null if not found
 */
async function getPrayerTimes() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        // Get today's date in YYYY-MM-DD format (no timezone conversion)
        const today = getTodayDateString();

        // Fetch prayer times for today from database
        const { data, error } = await supabase
            .from('prayer_times')
            .select('*')
            .eq('date', today)
            .order('prayer_name', { ascending: true });

        if (error) {
            console.error('Error fetching prayer times:', error);
            return null;
        }

        // If no data, return null
        if (!data || data.length === 0) {
            return null;
        }

        // Convert database format to display format
        // Database: { prayer_name: 'fajr', adhan_time: '05:30:00', iqaama_time: '05:40:00' }
        // Display: { fajr: { adhan: '05:30', iqaama: '05:40' } }
        const prayers = {};
        data.forEach(row => {
            const prayerName = row.prayer_name;
            // Extract HH:mm from TIME format (HH:mm:ss)
            const adhanTime = row.adhan_time.substring(0, 5); // '05:30:00' -> '05:30'
            const iqaamaTime = row.iqaama_time.substring(0, 5); // '05:40:00' -> '05:40'
            
            prayers[prayerName] = {
                adhan: adhanTime,
                iqaama: iqaamaTime
            };
        });

        return prayers;
    } catch (error) {
        console.error('Error in getPrayerTimes:', error);
        return null;
    }
}

/**
 * Save prayer times to Supabase (admin only)
 * @param {Object} prayers - Prayer times object
 * @param {string} updatedBy - Admin username
 * @returns {Promise<boolean>} Success status
 */
async function savePrayerTimes(prayers, updatedBy = 'admin') {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        // Check admin status
        const adminStatus = localStorage.getItem('isAdminLoggedIn') === 'true';
        if (!adminStatus) {
            throw new Error('Only admins can update prayer times');
        }

        // Get today's date
        const today = getTodayDateString();

        // Prepare data for insert/update
        const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const records = prayerNames.map(prayerName => {
            if (!prayers[prayerName] || !prayers[prayerName].adhan || !prayers[prayerName].iqaama) {
                throw new Error(`Missing prayer time for ${prayerName}`);
            }

            // Validate time format (HH:mm)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(prayers[prayerName].adhan) || !timeRegex.test(prayers[prayerName].iqaama)) {
                throw new Error(`Invalid time format for ${prayerName}. Use HH:mm format (e.g., 05:30)`);
            }

            return {
                prayer_name: prayerName,
                adhan_time: prayers[prayerName].adhan + ':00', // Convert to TIME format
                iqaama_time: prayers[prayerName].iqaama + ':00',
                date: today,
                updated_by: updatedBy
            };
        });

        // Delete existing records for today (upsert pattern)
        await supabase
            .from('prayer_times')
            .delete()
            .eq('date', today);

        // Insert new records
        const { error } = await supabase
            .from('prayer_times')
            .insert(records);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('Error saving prayer times:', error);
        throw error;
    }
}

/**
 * Get today's date as YYYY-MM-DD string (no timezone conversion)
 * Uses local date only - no automatic adjustments
 */
function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ES6 export
export { getPrayerTimes, savePrayerTimes };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.prayerTimesService = {
        getPrayerTimes,
        savePrayerTimes
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getPrayerTimes,
        savePrayerTimes
    };
}

