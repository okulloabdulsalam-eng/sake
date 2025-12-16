/**
 * Supabase Client Service
 * 
 * Single instance Supabase client for the entire application
 */

let supabaseClientInstance = null;

/**
 * Get or create Supabase client instance
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
    if (supabaseClientInstance) {
        return supabaseClientInstance;
    }

    // Check if Supabase SDK is loaded
    if (typeof supabase === 'undefined') {
        throw new Error('Supabase JS library not loaded. Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    }

    // Check if config is available
    if (!window.supabaseConfig) {
        throw new Error('Supabase configuration not found. Make sure supabase-config.js is loaded.');
    }

    const config = window.supabaseConfig;

    if (!config.supabaseUrl || config.supabaseUrl === 'YOUR_SUPABASE_URL') {
        throw new Error('Supabase URL not configured. Update supabase-config.js');
    }

    if (!config.supabaseAnonKey || config.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
        throw new Error('Supabase Anon Key not configured. Update supabase-config.js');
    }

    // Create client instance
    try {
        supabaseClientInstance = supabase.createClient(
            config.supabaseUrl,
            config.supabaseAnonKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
        return supabaseClientInstance;
    } catch (error) {
        console.error('Error creating Supabase client:', error);
        throw new Error('Failed to initialize Supabase client: ' + error.message);
    }
}

/**
 * Reset client instance (useful for testing or re-initialization)
 */
function resetSupabaseClient() {
    supabaseClientInstance = null;
}

// ES6 export
export { getSupabaseClient, resetSupabaseClient };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.getSupabaseClient = getSupabaseClient;
    window.resetSupabaseClient = resetSupabaseClient;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabaseClient,
        resetSupabaseClient
    };
}

