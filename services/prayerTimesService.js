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

        // Cache the prayer times in localStorage
        try {
            localStorage.setItem('cached_prayer_times', JSON.stringify(prayers));
            console.log('[Prayer Times] Cached prayer times to localStorage');
        } catch (cacheError) {
            console.warn('[Prayer Times] Failed to cache prayer times:', cacheError);
            // Don't fail the function if caching fails
        }

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

        // STRICT AUTH CHECK: Verify user is authenticated with Supabase (REQUIRED for RLS policies)
        // This check MUST pass before any database operations
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('[Prayer Times] STRICT AUTH CHECK:', { 
            user: user ? { id: user.id, email: user.email } : null, 
            error: authError,
            timestamp: new Date().toISOString()
        });
        
        // Block saving if authentication error exists
        if (authError) {
            console.error('[Prayer Times] Authentication error:', authError);
            throw new Error('Authentication failed. Please log in again before saving prayer times.');
        }
        
        // Block saving if no user object
        if (!user) {
            console.error('[Prayer Times] No authenticated user found. User must be logged in with Supabase.');
            throw new Error('Authentication required. Please log in with your admin account before saving prayer times.');
        }
        
        // Block saving if no user ID
        if (!user.id) {
            console.error('[Prayer Times] User object exists but has no ID:', user);
            throw new Error('Invalid authentication. User ID missing. Please log in again.');
        }

        // Verify user ID is valid (strict type check)
        if (typeof user.id !== 'string' || user.id.trim() === '') {
            console.error('[Prayer Times] Invalid user ID format:', user.id);
            throw new Error('Invalid authentication. User ID is invalid. Please log in again.');
        }
        
        // Verify session is still valid (additional check)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            console.error('[Prayer Times] Session check failed:', sessionError);
            throw new Error('Session expired. Please log in again before saving prayer times.');
        }
        
        console.log('[Prayer Times] STRICT AUTH CHECK PASSED - User ID:', user.id, 'Session valid:', !!session);

        // Check admin status (additional layer of security)
        const adminStatus = localStorage.getItem('isAdminLoggedIn') === 'true';
        if (!adminStatus) {
            console.warn('[Prayer Times] Admin status check failed, but user is authenticated:', user.id);
            throw new Error('Only administrators can update prayer times. Please log in as admin.');
        }

        console.log('[Prayer Times] Authentication verified. User:', user.id, 'Email:', user.email);
        console.log('[Prayer Times] ADMIN UID CONFIRMED:', user.id, '- Proceeding with save operation');

        // Prepare data for update
        const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        // Always UPDATE existing rows instead of inserting new ones
        // Update each prayer individually
        for (const prayerName of prayerNames) {
            if (!prayers[prayerName] || !prayers[prayerName].adhan || !prayers[prayerName].iqaama) {
                throw new Error(`Missing prayer time for ${prayerName}`);
            }

            // Validate time format (HH:mm)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(prayers[prayerName].adhan) || !timeRegex.test(prayers[prayerName].iqaama)) {
                throw new Error(`Invalid time format for ${prayerName}. Use HH:mm format (e.g., 05:30)`);
            }

            // Prepare update data - only include columns that exist
            const updateData = {
                adhan_time: prayers[prayerName].adhan + ':00', // Convert to TIME format
                iqama_time: prayers[prayerName].iqaama + ':00', // Note: column name is iqama_time (single 'a')
                updated_by: updatedBy
            };

            // Check if any records exist for this prayer_name
            const { data: existingRecords, error: selectError } = await supabase
                .from('prayer_times')
                .select('id')
                .eq('prayer_name', prayerName);

            if (selectError) {
                console.error(`[Prayer Times] Select error for ${prayerName}:`, selectError);
                throw new Error(`Failed to check existing records for ${prayerName}: ${selectError.message}`);
            }

            // Always try to UPDATE existing rows first
            if (existingRecords && existingRecords.length > 0) {
                // Update ALL existing rows for this prayer_name (in case there are multiple dates)
                const { error: updateError } = await supabase
                    .from('prayer_times')
                    .update(updateData)
                    .eq('prayer_name', prayerName);
                
                if (updateError) {
                    console.error(`[Prayer Times] Update error for ${prayerName}:`, updateError);
                    throw new Error(`Failed to update prayer times for ${prayerName}: ${updateError.message}`);
                }
                
                console.log(`[Prayer Times] Updated ${existingRecords.length} existing record(s) for ${prayerName}`);
            } else {
                // Only insert if NO records exist at all (first-time setup)
                // This should rarely happen, but we handle it as a fallback
                console.warn(`[Prayer Times] No existing records found for ${prayerName}. Inserting new record.`);
                
                const insertData = {
                    prayer_name: prayerName,
                    ...updateData
                };
                
                // If table has a date column, use today's date
                // Check if date column exists by trying to insert with it
                const { error: insertError } = await supabase
                    .from('prayer_times')
                    .insert(insertData);
                
                if (insertError) {
                    // If insert fails due to missing date column, try without it
                    if (insertError.message && insertError.message.includes('date')) {
                        console.warn(`[Prayer Times] Date column may be required. Attempting insert with today's date.`);
                        const insertWithDate = {
                            ...insertData,
                            date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
                        };
                        const { error: insertWithDateError } = await supabase
                            .from('prayer_times')
                            .insert(insertWithDate);
                        
                        if (insertWithDateError) {
                            console.error(`[Prayer Times] Insert error for ${prayerName}:`, insertWithDateError);
                            throw new Error(`Failed to create prayer time record for ${prayerName}: ${insertWithDateError.message}`);
                        }
                    } else {
                        console.error(`[Prayer Times] Insert error for ${prayerName}:`, insertError);
                        throw new Error(`Failed to create prayer time record for ${prayerName}: ${insertError.message}`);
                    }
                }
                
                console.log(`[Prayer Times] Inserted new record for ${prayerName} (first-time setup)`);
            }
        }

        return true;
    } catch (error) {
        console.error('Error saving prayer times:', error);
        throw error;
    }
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

