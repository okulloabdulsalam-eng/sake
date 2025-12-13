/**
 * Supabase Storage Helper Functions
 * 
 * Handles file uploads, downloads, and deletions from Supabase Storage
 * Replaces Firebase Storage for media files (images, videos, audio)
 */

/**
 * Get Supabase client instance
 */
function getSupabaseClient() {
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    
    if (typeof initializeSupabase === 'function') {
        window.supabaseClient = initializeSupabase();
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
    }
    
    // Try to initialize directly if config is available
    if (typeof supabase !== 'undefined' && window.supabaseConfig) {
        try {
            window.supabaseClient = supabase.createClient(
                window.supabaseConfig.supabaseUrl,
                window.supabaseConfig.supabaseAnonKey
            );
            return window.supabaseClient;
        } catch (e) {
            console.error('Error creating Supabase client:', e);
        }
    }
    
    throw new Error('Supabase not initialized. Make sure supabase-config.js is loaded and configured.');
}

// Auto-initialize Supabase client when script loads
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                getSupabaseClient();
            } catch (e) {
                console.warn('Supabase initialization deferred:', e.message);
            }
        });
    } else {
        try {
            getSupabaseClient();
        } catch (e) {
            console.warn('Supabase initialization deferred:', e.message);
        }
    }
}

/**
 * Upload file to Supabase Storage
 * 
 * @param {File} file - File object to upload
 * @param {string} folder - Folder path in storage (e.g., 'media/videos', 'media/images')
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload result with download URL and storage path
 */
async function uploadToSupabaseStorage(file, folder = 'media', onProgress = null) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomString}.${fileExtension}`;
        const filePath = `${folder}/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(window.supabaseConfig.storageBucket || 'media')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(window.supabaseConfig.storageBucket || 'media')
            .getPublicUrl(filePath);

        const downloadURL = urlData.publicUrl;

        // Simulate progress for compatibility
        if (onProgress) {
            // Since Supabase doesn't provide progress events, simulate it
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (progress >= 100) {
                    clearInterval(interval);
                    onProgress(100);
                } else {
                    onProgress(progress);
                }
            }, 100);
        }

        return {
            success: true,
            downloadURL: downloadURL,
            storagePath: filePath,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type
        };

    } catch (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return {
            success: false,
            error: error.message || 'Upload failed'
        };
    }
}

/**
 * Delete file from Supabase Storage
 * 
 * @param {string} storagePath - Path to file in Supabase Storage
 * @returns {Promise<boolean>} True if deletion successful
 */
async function deleteFromSupabaseStorage(storagePath) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        const { error } = await supabase.storage
            .from(window.supabaseConfig.storageBucket || 'media')
            .remove([storagePath]);

        if (error) {
            // If file doesn't exist, consider it a success
            if (error.message && error.message.includes('not found')) {
                return true;
            }
            throw error;
        }

        return true;

    } catch (error) {
        console.error('Error deleting from Supabase Storage:', error);
        // If file doesn't exist, consider it a success
        if (error.message && error.message.includes('not found')) {
            return true;
        }
        throw error;
    }
}

/**
 * Get public URL for a file in Supabase Storage
 * 
 * @param {string} storagePath - Path to file in Supabase Storage
 * @returns {string} Public URL
 */
function getSupabaseStorageUrl(storagePath) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        const { data } = supabase.storage
            .from(window.supabaseConfig.storageBucket || 'media')
            .getPublicUrl(storagePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error getting Supabase Storage URL:', error);
        return null;
    }
}

/**
 * Generate thumbnail for image (resize using canvas)
 * 
 * @param {File} imageFile - Image file
 * @param {number} maxWidth - Maximum width for thumbnail
 * @param {number} maxHeight - Maximum height for thumbnail
 * @returns {Promise<File>} Thumbnail file
 */
async function generateThumbnail(imageFile, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                // Create canvas and resize
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const thumbnailFile = new File([blob], `thumb_${imageFile.name}`, {
                        type: imageFile.type
                    });
                    resolve(thumbnailFile);
                }, imageFile.type);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Get file type category
 * 
 * @param {string} mimeType - MIME type
 * @returns {string} 'video', 'audio', or 'image'
 */
function getFileTypeCategory(mimeType) {
    if (mimeType.startsWith('video/')) {
        return 'video';
    } else if (mimeType.startsWith('audio/')) {
        return 'audio';
    } else if (mimeType.startsWith('image/')) {
        return 'image';
    }
    return 'unknown';
}

// Make functions globally available (with backward compatibility aliases)
if (typeof window !== 'undefined') {
    // Supabase functions
    window.uploadToSupabaseStorage = uploadToSupabaseStorage;
    window.deleteFromSupabaseStorage = deleteFromSupabaseStorage;
    window.getSupabaseStorageUrl = getSupabaseStorageUrl;
    
    // Backward compatibility - redirect Firebase Storage calls to Supabase
    window.uploadToFirebaseStorage = uploadToSupabaseStorage;
    window.deleteFromFirebaseStorage = deleteFromSupabaseStorage;
    
    // Utility functions
    window.generateThumbnail = generateThumbnail;
    window.getFileTypeCategory = getFileTypeCategory;
}

