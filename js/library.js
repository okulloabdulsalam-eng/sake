/**
 * Library Page Main Entry Script
 * 
 * Imports and initializes all services for the library page
 */

// Import services (they will be available on window for backward compatibility)
import { getSupabaseClient } from '../services/supabaseClient.js';
import { uploadFile } from '../services/uploadService.js';
import { fetchBooks } from '../services/libraryService.js';

// Services are already exported to window in their respective files
// This import ensures they're loaded and available

// Make sure getSupabaseClient is available globally for inline scripts
if (typeof window !== 'undefined') {
    // Ensure the function is available (it's already set in supabaseClient.js, but ensure it's there)
    if (!window.getSupabaseClient) {
        window.getSupabaseClient = getSupabaseClient;
    }
}

console.log('Library services loaded successfully');

