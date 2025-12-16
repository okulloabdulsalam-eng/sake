/**
 * Prayer Times Service
 * 
 * Fetches prayer times from Supabase database (admin-defined only)
 * NO automatic calculations - displays times exactly as stored
 */

import { getSupabaseClient } from './supabaseClient.js';

/**
 * Get prayer times from Supabase (all records, no date filter)
 * @returns {Promise<Object|null>} Prayer times object or null if not found
 */
async function getPrayerTimes() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('[Prayer Times] Supabase client not available');
            throw new Error('Supabase client not available');
        }

        console.log('[Prayer Times] Fetching from Supabase...');
        console.log('[Prayer Times] Supabase URL:', window.supabaseConfig?.supabaseUrl);
        console.log('[Prayer Times] Using anon key:', window.supabaseConfig?.supabaseAnonKey ? 'Present' : 'Missing');

        // Fetch ALL prayer times from database (NO filters)
        // Use exact query: select('*').order('id')
        // NO date filters, NO prayer_name filters - fetch everything
        const { data, error } = await supabase
            .from('prayer_times')
            .select('*')
            .order('id', { ascending: true });

        // Log the raw response
        console.log('[Prayer Times] Raw Supabase response:', { data, error });

        if (error) {
            console.error('[Prayer Times] Supabase query error:', error);
            console.error('[Prayer Times] Error code:', error.code);
            console.error('[Prayer Times] Error message:', error.message);
            console.error('[Prayer Times] Error details:', error.details);
            console.error('[Prayer Times] Error hint:', error.hint);
            return null;
        }

        // Log actual data returned
        console.log('[Prayer Times] Data returned from Supabase:', data);
        console.log('[Prayer Times] Data length:', data ? data.length : 0);

        // If no data, return null
        if (!data || data.length === 0) {
            console.warn('[Prayer Times] No data returned from Supabase - table may be empty');
            return null;
        }

        // Log first row structure for debugging
        if (data.length > 0) {
            console.log('[Prayer Times] Sample row structure:', data[0]);
            console.log('[Prayer Times] Available fields:', Object.keys(data[0]));
        }

        // Convert database format to display format
        // Database: { prayer_name: 'fajr', adhan_time: '05:30:00', iqaama_time: '05:40:00' }
        // Display: { fajr: { adhan: '05:30', iqaama: '05:40' } }
        // Since we order by id ascending, later rows (higher id) will overwrite earlier ones
        // This ensures we use the most recent entry for each prayer_name
        const prayers = {};
        
        data.forEach(row => {
            const prayerName = row.prayer_name;
            
            // Handle different possible field names
            const adhanTimeRaw = row.adhan_time || row.adhanTime || row.adhan;
            const iqaamaTimeRaw = row.iqaama_time || row.iqaamaTime || row.iqaama || row.iqama_time || row.iqama;
            
            if (!adhanTimeRaw || !iqaamaTimeRaw) {
                console.warn('[Prayer Times] Missing time fields in row:', row);
                return;
            }
            
            // Extract HH:mm from TIME format (HH:mm:ss) or use as-is if already HH:mm
            const adhanTime = typeof adhanTimeRaw === 'string' && adhanTimeRaw.length > 5 
                ? adhanTimeRaw.substring(0, 5) 
                : adhanTimeRaw;
            const iqaamaTime = typeof iqaamaTimeRaw === 'string' && iqaamaTimeRaw.length > 5 
                ? iqaamaTimeRaw.substring(0, 5) 
                : iqaamaTimeRaw;
            
            prayers[prayerName] = {
                adhan: adhanTime,
                iqaama: iqaamaTime
            };
        });

        console.log('[Prayer Times] Converted prayers object:', prayers);
        console.log('[Prayer Times] Prayer count:', Object.keys(prayers).length);

        return prayers;
    } catch (error) {
        console.error('[Prayer Times] Exception in getPrayerTimes:', error);
        console.error('[Prayer Times] Error stack:', error.stack);
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

