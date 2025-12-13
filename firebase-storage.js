/**
 * Firebase Storage Helper Functions
 * 
 * Handles file uploads, downloads, and deletions from Firebase Storage
 */

/**
 * Upload file to Firebase Storage
 * 
 * @param {File} file - File object to upload
 * @param {string} folder - Folder path in storage (e.g., 'media/videos', 'media/images')
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} Upload result with download URL and storage path
 */
async function uploadToFirebaseStorage(file, folder = 'media', onProgress = null) {
    try {
        // Check if Firebase is initialized
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            throw new Error('Firebase not initialized. Make sure Firebase SDK is loaded.');
        }

        // Get storage reference
        const storage = firebase.storage();
        const storageRef = storage.ref();

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomString}.${fileExtension}`;
        const filePath = `${folder}/${fileName}`;
        
        // Create reference to file location
        const fileRef = storageRef.child(filePath);

        // Upload file
        const uploadTask = fileRef.put(file);

        // Monitor upload progress
        if (onProgress) {
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    throw error;
                }
            );
        }

        // Wait for upload to complete
        const snapshot = await uploadTask;
        
        // Get download URL
        const downloadURL = await snapshot.ref.getDownloadURL();

        return {
            success: true,
            downloadURL: downloadURL,
            storagePath: filePath,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type
        };

    } catch (error) {
        console.error('Error uploading to Firebase Storage:', error);
        return {
            success: false,
            error: error.message || 'Upload failed'
        };
    }
}

/**
 * Delete file from Firebase Storage
 * 
 * @param {string} storagePath - Path to file in Firebase Storage
 * @returns {Promise<boolean>} True if deletion successful
 */
async function deleteFromFirebaseStorage(storagePath) {
    try {
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            throw new Error('Firebase not initialized');
        }

        const storage = firebase.storage();
        const storageRef = storage.ref();
        const fileRef = storageRef.child(storagePath);

        await fileRef.delete();
        return true;

    } catch (error) {
        console.error('Error deleting from Firebase Storage:', error);
        // If file doesn't exist, consider it a success
        if (error.code === 'storage/object-not-found') {
            return true;
        }
        throw error;
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

// Make functions globally available
if (typeof window !== 'undefined') {
    window.uploadToFirebaseStorage = uploadToFirebaseStorage;
    window.deleteFromFirebaseStorage = deleteFromFirebaseStorage;
    window.generateThumbnail = generateThumbnail;
    window.getFileTypeCategory = getFileTypeCategory;
}

