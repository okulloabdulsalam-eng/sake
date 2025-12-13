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
 * Initialize Supabase Client
 * Make sure to include Supabase JS library:
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */
function initializeSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase JS library not loaded. Include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return null;
    }
    
    if (!window.supabaseConfig.supabaseUrl || window.supabaseConfig.supabaseUrl === 'YOUR_SUPABASE_URL') {
        console.error('Supabase URL not configured. Update supabase-config.js');
        return null;
    }
    
    if (!window.supabaseConfig.supabaseAnonKey || window.supabaseConfig.supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Supabase Anon Key not configured. Update supabase-config.js');
        return null;
    }
    
    return supabase.createClient(
        window.supabaseConfig.supabaseUrl,
        window.supabaseConfig.supabaseAnonKey
    );
}

// Make initialization function globally available
if (typeof window !== 'undefined') {
    window.initializeSupabase = initializeSupabase;
}

