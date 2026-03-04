/**
 * Supabase Authentication Service
 * 
 * Handles admin authentication using Supabase email/password authentication
 * This ensures auth.uid() is available for RLS policies
 */

import { getSupabaseClient } from './supabaseClient.js';

/**
 * Admin login using Supabase email/password authentication
 * @param {string} email - Admin email address
 * @param {string} password - Admin password
 * @returns {Promise<Object>} Login result with success status and user data
 */
async function adminLoginWithSupabase(email, password) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        // Validate input
        if (!email || !email.trim()) {
            return {
                success: false,
                error: 'Email is required',
                message: 'Please enter your email address'
            };
        }

        if (!password || !password.trim()) {
            return {
                success: false,
                error: 'Password is required',
                message: 'Please enter your password'
            };
        }

        // Attempt to sign in with Supabase
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (signInError) {
            console.error('[Supabase Auth] Sign in error:', signInError);
            
            // Handle specific error cases
            let errorMessage = 'Authentication failed. Please check your email and password.';
            
            if (signInError.message.includes('Invalid login credentials')) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (signInError.message.includes('Email not confirmed')) {
                errorMessage = 'Please verify your email address before logging in.';
            } else if (signInError.message.includes('Too many requests')) {
                errorMessage = 'Too many login attempts. Please try again later.';
            }

            return {
                success: false,
                error: signInError.message,
                message: errorMessage,
                code: signInError.status
            };
        }

        if (!authData || !authData.user) {
            return {
                success: false,
                error: 'No user data returned',
                message: 'Authentication failed. Please try again.'
            };
        }

        // Verify user is authenticated
        const { data: { user }, error: getUserError } = await supabase.auth.getUser();
        
        if (getUserError || !user) {
            console.error('[Supabase Auth] Get user error:', getUserError);
            return {
                success: false,
                error: getUserError?.message || 'Failed to verify authentication',
                message: 'Authentication verification failed. Please try again.'
            };
        }

        // Store admin login status
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('supabaseAuthUser', JSON.stringify({
            id: user.id,
            email: user.email,
            authenticatedAt: new Date().toISOString()
        }));

        console.log('[Supabase Auth] Admin login successful:', {
            userId: user.id,
            email: user.email
        });

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at
            },
            session: authData.session
        };

    } catch (error) {
        console.error('[Supabase Auth] Login exception:', error);
        return {
            success: false,
            error: error.message || 'Unknown error',
            message: 'An error occurred during login. Please try again.'
        };
    }
}

/**
 * Check if admin is currently authenticated with Supabase
 * Also checks for existing session and restores it if needed
 * @returns {Promise<Object>} Auth status with user data if authenticated
 */
async function checkSupabaseAuth() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.warn('[Supabase Auth] Client not available');
            return {
                authenticated: false,
                error: 'Supabase client not available'
            };
        }

        // First, check if there's an existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.warn('[Supabase Auth] Session check error:', sessionError);
        }
        
        if (session && session.user) {
            console.log('[Supabase Auth] ✅ Session found:', session.user.email);
            return {
                authenticated: true,
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    createdAt: session.user.created_at
                },
                session: session
            };
        }

        // If no session, try getUser() which might trigger session refresh
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.warn('[Supabase Auth] getUser() error:', error);
            // Check if user is logged in via localStorage (might need to sync)
            const adminStatus = localStorage.getItem('isAdminLoggedIn') === 'true';
            if (adminStatus) {
                console.warn('[Supabase Auth] ⚠️ Admin logged in via localStorage but Supabase session missing');
                console.warn('[Supabase Auth] User needs to log in again with Supabase credentials');
            }
            return {
                authenticated: false,
                error: error.message || 'Not authenticated',
                needsReauth: adminStatus // Indicates user should re-authenticate
            };
        }
        
        if (!user) {
            console.warn('[Supabase Auth] No user found');
            return {
                authenticated: false,
                error: 'Not authenticated'
            };
        }

        console.log('[Supabase Auth] ✅ User authenticated:', user.email);
        return {
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at
            }
        };
    } catch (error) {
        console.error('[Supabase Auth] Check auth error:', error);
        return {
            authenticated: false,
            error: error.message
        };
    }
}

/**
 * Admin logout from Supabase
 * @returns {Promise<Object>} Logout result
 */
async function adminLogoutFromSupabase() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            return {
                success: false,
                error: 'Supabase client not available'
            };
        }

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('[Supabase Auth] Logout error:', error);
            return {
                success: false,
                error: error.message
            };
        }

        // Clear admin login status
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('supabaseAuthUser');

        console.log('[Supabase Auth] Admin logout successful');

        return {
            success: true
        };
    } catch (error) {
        console.error('[Supabase Auth] Logout exception:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ES6 export
export { 
    adminLoginWithSupabase, 
    checkSupabaseAuth, 
    adminLogoutFromSupabase 
};

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.supabaseAuth = {
        adminLogin: adminLoginWithSupabase,
        checkAuth: checkSupabaseAuth,
        adminLogout: adminLogoutFromSupabase
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        adminLoginWithSupabase,
        checkSupabaseAuth,
        adminLogoutFromSupabase
    };
}

