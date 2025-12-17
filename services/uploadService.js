/**
 * Upload Service
 * 
 * Handles file uploads to Supabase Storage
 */

// BarakahPush Notification System – Active
// Use window.getSupabaseClient instead of ES6 import (supabaseClient.js is loaded as regular script)
// import { getSupabaseClient } from './supabaseClient.js';
// import { handleError } from '../utils/errorHandler.js';
// import { log } from '../utils/logger.js';

// Get Supabase client from window (works with regular script loading)
function getSupabaseClient() {
    if (typeof window !== 'undefined' && typeof window.getSupabaseClient === 'function') {
        return window.getSupabaseClient();
    }
    throw new Error('Supabase client not available');
}

// Fallback error handler
function handleError(error, context = '') {
    console.error(`[Upload Service] Error ${context}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
}

// Fallback logger
function log(message, level = 'info') {
    if (level === 'error') {
        console.error(`[Upload Service] ${message}`);
    } else {
        console.log(`[Upload Service] ${message}`);
    }
}

/**
 * Upload file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} folder - Folder path in storage (e.g., 'books', 'media/images')
 * @param {Object|Function} optionsOrProgress - Options object {contentType} or progress callback (optional)
 * @param {Function} onProgress - Progress callback (optional, if options provided)
 * @returns {Promise<Object>} Upload result with public URL
 */
async function uploadFile(file, folder = 'media', optionsOrProgress = null, onProgress = null) {
    try {
        const supabase = getSupabaseClient();
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomString}.${fileExtension}`;
        const filePath = `${folder}/${fileName}`;

        // Get storage bucket from config or use default
        const bucket = window.supabaseConfig?.storageBucket || 'media';

        // Parse options - handle both {options} and onProgress callback patterns
        let options = {
            cacheControl: '3600',
            upsert: false
        };
        let progressCallback = null;
        
        if (optionsOrProgress) {
            if (typeof optionsOrProgress === 'function') {
                // Old pattern: uploadFile(file, folder, onProgress)
                progressCallback = optionsOrProgress;
            } else if (typeof optionsOrProgress === 'object') {
                // New pattern: uploadFile(file, folder, {contentType}, onProgress)
                options = { ...options, ...optionsOrProgress };
                progressCallback = onProgress;
            }
        }

        // Upload file with options
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, options);

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            success: true,
            url: urlData.publicUrl,
            path: filePath,
            fileName: fileName,
            fileSize: file.size,
            mimeType: file.type
        };
    } catch (error) {
        log('error', 'Failed to upload file', error);
        throw handleError(error, 'Failed to upload file');
    }
}

/**
 * Delete file from Supabase Storage
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<boolean>}
 */
async function deleteFile(filePath) {
    try {
        const supabase = getSupabaseClient();
        const bucket = window.supabaseConfig?.storageBucket || 'media';

        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        log('error', 'Failed to delete file', error);
        throw handleError(error, 'Failed to delete file');
    }
}

/**
 * Get public URL for a file
 * @param {string} filePath - Path to file in storage
 * @returns {string} Public URL
 */
function getPublicUrl(filePath) {
    try {
        const supabase = getSupabaseClient();
        const bucket = window.supabaseConfig?.storageBucket || 'media';

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        log('error', 'Failed to get public URL', error);
        return '';
    }
}

// ES6 export
export { uploadFile, deleteFile, getPublicUrl };

// Also export for window/CommonJS compatibility
if (typeof window !== 'undefined') {
    window.uploadService = {
        uploadFile,
        deleteFile,
        getPublicUrl
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        uploadFile,
        deleteFile,
        getPublicUrl
    };
}

