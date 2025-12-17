/**
 * Firebase Configuration - Authentication & BarakahPush Notifications
 * 
 * IMPORTANT: Replace these values with your Firebase project credentials
 * Get these from: Firebase Console > Project Settings > General > Your apps > Web app
 * 
 * @fileoverview
 * This file contains Firebase configuration for:
 * - Authentication (Firebase Auth)
 * - BarakahPush Notification System (FCM with DATA messages only)
 * 
 * BarakahPush Notification System – Active
 * Uses FCM DATA messages only (WebView-safe, handled at app level)
 * 
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
    
    // Your Firebase Storage Bucket (NOTE: Not used - we use Supabase for storage)
    // Kept for Firebase initialization compatibility
    storageBucket: "kiuma-mob-app.firebasestorage.app",
    
    // Your Firebase App ID
    appId: "1:69327390212:web:10a7f8b52d5ea93d549751",
    
    // BarakahPush Notification System – FCM Configuration
    // Get messagingSenderId from: Firebase Console > Project Settings > Cloud Messaging
    messagingSenderId: "69327390212",
    
    // Get VAPID key from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
    // Generate key pair if not exists, then copy the key
    vapidKey: "YOUR_VAPID_KEY_HERE" // TODO: Replace with your actual VAPID key
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
        'appId'
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

/**
 * Initialize Firebase App
 * This must be called before using any Firebase services
 */
function initializeFirebaseApp() {
    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded yet');
            return false;
        }
        
        // Check if already initialized
        if (firebase.apps && firebase.apps.length > 0) {
            console.log('Firebase already initialized');
            return true;
        }
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        return false;
    }
}

// Auto-initialize Firebase when script loads
if (typeof window !== 'undefined' && typeof firebase !== 'undefined') {
    initializeFirebaseApp();
}

// Make initialization function globally available
if (typeof window !== 'undefined') {
    window.initializeFirebaseApp = initializeFirebaseApp;
}

