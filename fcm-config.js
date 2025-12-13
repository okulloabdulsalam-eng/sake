/**
 * Firebase Cloud Messaging (FCM) Configuration
 * 
 * IMPORTANT: Replace these values with your Firebase project credentials
 * Get these from: Firebase Console > Project Settings > General > Your apps > Web app
 * 
 * @fileoverview
 * This file contains all Firebase configuration values needed for FCM.
 * Keep this file secure and never commit it to public repositories.
 * Use environment variables in production.
 */

// Firebase Configuration Object
// Your Firebase project credentials
const firebaseConfig = {
    // Your Firebase project's API Key
    apiKey: "AIzaSyDOZ1UzDPXuxmGMZTxKcB7CzeWi7esB08c",
    
    // Your Firebase project's Auth Domain
    authDomain: "kiuma-mob-app.firebaseapp.com",
    
    // Your Firebase project ID
    projectId: "kiuma-mob-app",
    
    // Your Firebase Storage Bucket
    storageBucket: "kiuma-mob-app.firebasestorage.app",
    
    // Your Firebase Messaging Sender ID
    messagingSenderId: "69327390212",
    
    // Your Firebase App ID
    appId: "1:69327390212:web:10a7f8b52d5ea93d549751",
    
    // Measurement ID (for Analytics - optional)
    measurementId: "G-5CDL6J3L5B",
    
    // VAPID Key (Web Push Key) - REQUIRED for FCM
    // Get this from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
    // If you don't have one, click "Generate key pair" in Firebase Console
    // Format: "BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    vapidKey: "ocNXqAVLS_FglgCge2uMD7K1Jyozz24xoDXX2198yDo"
};

/**
 * Export configuration for use in other files
 * In a module environment, you would use: export default firebaseConfig;
 * For now, we'll make it globally available
 */
if (typeof window !== 'undefined') {
    window.firebaseConfig = firebaseConfig;
}

// For Node.js environments (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}

/**
 * Configuration Validation
 * 
 * This function checks if all required configuration values are set.
 * Call this before initializing Firebase to ensure proper setup.
 * 
 * @returns {Object} Validation result with isValid flag and missing fields
 */
function validateFirebaseConfig() {
    const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId',
        'vapidKey'
    ];
    
    const missingFields = [];
    const placeholderPattern = /YOUR_.*_HERE/i;
    
    requiredFields.forEach(field => {
        const value = firebaseConfig[field];
        if (!value || placeholderPattern.test(value)) {
            missingFields.push(field);
        }
    });
    
    return {
        isValid: missingFields.length === 0,
        missingFields: missingFields,
        message: missingFields.length === 0 
            ? 'Firebase configuration is valid' 
            : `Missing or placeholder values: ${missingFields.join(', ')}`
    };
}

// Make validation function globally available
if (typeof window !== 'undefined') {
    window.validateFirebaseConfig = validateFirebaseConfig;
}

