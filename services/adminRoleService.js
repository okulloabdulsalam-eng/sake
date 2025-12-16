/**
 * Admin Role Service
 * 
 * Checks user role from Supabase profiles table
 * Uses Supabase Auth to verify admin status
 */

import { getSupabaseClient } from './supabaseClient.js';

/**
 * Get current user's role from profiles table
 * @returns {Promise<string|null>} 'admin', 'user', or null if not authenticated
 */
export async function getUserRole() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('[Admin Role] Supabase client not available');
            return null;
        }

        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session || !session.user) {
            console.log('[Admin Role] No authenticated session');
            return null;
        }

        // Get user role from profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (error) {
            // If profile doesn't exist, create it with default 'user' role
            if (error.code === 'PGRST116') {
                console.log('[Admin Role] Profile not found, creating default profile');
                try {
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert({
                            id: session.user.id,
                            email: session.user.email,
                            role: 'user'
                        });

                    if (insertError) {
                        console.error('[Admin Role] Error creating profile:', insertError);
                        return 'user'; // Default to user if creation fails
                    }
                    return 'user';
                } catch (createError) {
                    console.error('[Admin Role] Error creating profile:', createError);
                    return 'user';
                }
            }
            console.error('[Admin Role] Error fetching role:', error);
            return null;
        }

        return data?.role || 'user';
    } catch (error) {
        console.error('[Admin Role] Error getting user role:', error);
        return null;
    }
}

/**
 * Check if current user is admin
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isAdmin() {
    const role = await getUserRole();
    return role === 'admin';
}

/**
 * Check if user is authenticated (has valid session)
 * @returns {Promise<boolean>} True if user is authenticated
 */
export async function isAuthenticated() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return false;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        return !error && !!session && !!session.user;
    } catch (error) {
        console.error('[Admin Role] Error checking authentication:', error);
        return false;
    }
}

// Export to window for backward compatibility
if (typeof window !== 'undefined') {
    window.getUserRole = getUserRole;
    window.isAdmin = isAdmin;
    window.isAuthenticated = isAuthenticated;
}

