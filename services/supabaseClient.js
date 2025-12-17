/**
 * Supabase Client Service - TRUE SINGLETON
 * 
 * This is the ONLY place where supabase.createClient() should be called.
 * All other files must import getSupabaseClient() from this module.
 * 
 * SINGLETON PATTERN: Only one client instance exists across the entire application
 */

let supabaseClientInstance = null;

/**
 * Get or create Supabase client instance (Singleton Pattern)
 * Ensures only ONE client instance exists across the entire application
 * THIS IS THE ONLY PLACE WHERE supabase.createClient() IS CALLED
 * 
 * @returns {Object} Supabase client instance
 */
function getSupabaseClient() {
    // Return existing instance if already created (synchronous)
    if (supabaseClientInstance) {
        return supabaseClientInstance;
    }

    // Check if Supabase SDK is loaded - fail silently for BarakahPush
    if (typeof supabase === 'undefined') {
        console.warn('[Supabase Client] Supabase JS library not loaded');
        return null;
    }

    // Check if config is available - fail silently
    if (!window.supabaseConfig) {
        console.warn('[Supabase Client] Supabase configuration not found');
        return null;
    }

    const config = window.supabaseConfig;

    if (!config.supabaseUrl || config.supabaseUrl === 'YOUR_SUPABASE_URL') {
        console.warn('[Supabase Client] Supabase URL not configured');
        return null;
    }

    if (!config.supabaseAnonKey || config.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('[Supabase Client] Supabase Anon Key not configured');
        return null;
    }

    // Create client instance - THIS IS THE ONLY createClient() CALL IN THE ENTIRE CODEBASE
    try {
        supabaseClientInstance = supabase.createClient(
            config.supabaseUrl,
            config.supabaseAnonKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    storage: window.localStorage, // Explicitly use localStorage for session persistence
                    storageKey: 'sb-auth-token' // Default storage key
                }
            }
        );
        
        // Check if there's an existing session on initialization
        supabaseClientInstance.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('[Supabase Client] ✅ Session restored on initialization:', session.user?.email);
            } else {
                console.log('[Supabase Client] No existing session found');
            }
        }).catch(err => {
            console.warn('[Supabase Client] Error checking session on init:', err);
        });
        
        console.log('[Supabase Client] ✅ Singleton client initialized - THIS IS THE ONLY createClient() CALL');
        return supabaseClientInstance;
    } catch (error) {
        console.warn('[Supabase Client] ❌ Error creating client (failing silently):', error);
        return null; // Fail silently instead of throwing
    }
}

/**
 * Reset client instance (useful for testing or re-initialization)
 */
function resetSupabaseClient() {
    supabaseClientInstance = null;
    console.log('[Supabase Client] Client instance reset');
}

// ES6 export (only if module environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabaseClient,
        resetSupabaseClient
    };
}

// Also export for window/CommonJS compatibility
// BarakahPush Notification System – Active
// Ensure Supabase client is globally available BEFORE barakahpush-init.js loads
if (typeof window !== 'undefined') {
    // Store original function before creating wrapper (prevent infinite recursion)
    const originalGetSupabaseClient = getSupabaseClient;
    
    // Create wrapper that never throws
    window.getSupabaseClient = function() {
        try {
            return originalGetSupabaseClient();
        } catch (error) {
            console.warn('[Supabase Client] Error getting client (returning null):', error);
            return null;
        }
    };
    window.resetSupabaseClient = resetSupabaseClient;
    
    // Try to initialize immediately if config is available
    if (window.supabaseConfig && typeof supabase !== 'undefined') {
        try {
            originalGetSupabaseClient(); // Pre-initialize using original function
        } catch (err) {
            // Silently fail - will be initialized when needed
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabaseClient,
        resetSupabaseClient
    };
}
