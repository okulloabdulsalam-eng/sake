/**
 * Supabase Configuration
 * 
 * Storage ONLY configuration for images, videos, and audio files
 * 
 * Get these values from your Supabase project:
 * 1. Go to https://app.supabase.com
 * 2. Select your project
 * 3. Go to Settings > API
 * 4. Copy the URL and anon/public key
 */

// Supabase Configuration
window.supabaseConfig = {
    // Your Supabase Project URL
    supabaseUrl: 'https://msojoykzcgpkikbxjgxs.supabase.co',
    
    // Your Supabase Anon/Public Key (safe to expose in client-side code)
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zb2pveWt6Y2dwa2lrYnhqZ3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDQ3NDcsImV4cCI6MjA4MTIyMDc0N30.3DEREUsVS_gojRl_OIWo4K8bu2H_XHjjQ_F5v2JZz1Y',
    
    // Storage bucket name
    storageBucket: 'media', // Default bucket name for media files
};

/**
 * DEPRECATED: Use getSupabaseClient() from services/supabaseClient.js instead
 * 
 * This function is kept for backward compatibility only.
 * All new code should import getSupabaseClient from services/supabaseClient.js
 * 
 * @deprecated Use getSupabaseClient() from services/supabaseClient.js
 */
function initializeSupabase() {
    console.warn('[Supabase Config] initializeSupabase() is deprecated. Use getSupabaseClient() from services/supabaseClient.js instead.');
    
    // Try to use the singleton client if available
    if (typeof window.getSupabaseClient === 'function') {
        try {
            return window.getSupabaseClient();
        } catch (error) {
            console.error('[Supabase Config] Error getting singleton client:', error);
            return null;
        }
    }
    
    console.error('[Supabase Config] getSupabaseClient not available. Make sure services/supabaseClient.js is loaded.');
    return null;
}

// Make initialization function globally available (for backward compatibility)
if (typeof window !== 'undefined') {
    window.initializeSupabase = initializeSupabase;
}

