/**
 * Firebase Authentication Integration
 * 
 * This file handles:
 * - User login/logout with Firebase Auth
 * - Admin role checking via Firebase Custom Claims
 * - Authentication state management
 * - User session persistence
 */

// Global variables - use var to avoid redeclaration issues with other scripts
var currentUser = null;
var authInitialized = false;

/**
 * Initialize Firebase Authentication
 * 
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initializeFirebaseAuth() {
    try {
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded yet. Will retry...');
            return false;
        }
        
        // Try to initialize Firebase if not already done
        if (!firebase.apps || firebase.apps.length === 0) {
            if (typeof initializeFirebaseApp === 'function') {
                initializeFirebaseApp();
            } else if (typeof window.firebaseConfig !== 'undefined') {
                firebase.initializeApp(window.firebaseConfig);
            } else {
                console.error('Firebase not initialized. Make sure fcm-config.js is loaded first.');
                return false;
            }
        }

        // Get auth instance
        const auth = firebase.auth();
        authInitialized = true;

        // Set up auth state observer
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User signed in:', user.email);
                currentUser = user;
                
                // Check if user is admin
                await checkAdminStatus(user);
                
                // Update UI
                updateAuthUI(user);
            } else {
                console.log('User signed out');
                currentUser = null;
                localStorage.removeItem('isAdminLoggedIn');
                updateAuthUI(null);
            }
        });

        // Check if user is already signed in
        const user = auth.currentUser;
        if (user) {
            currentUser = user;
            await checkAdminStatus(user);
            updateAuthUI(user);
        }

        return true;
    } catch (error) {
        console.error('Error initializing Firebase Auth:', error);
        return false;
    }
}

/**
 * Check if user has admin role
 * 
 * @param {firebase.User} user - Firebase user object
 * @returns {Promise<boolean>} True if user is admin
 */
async function checkAdminStatus(user) {
    try {
        if (!user) return false;

        // Get ID token to check custom claims
        const idTokenResult = await user.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true || idTokenResult.claims.role === 'admin';
        
        if (isAdmin) {
            localStorage.setItem('isAdminLoggedIn', 'true');
            if (typeof window.checkAdminStatus === 'function') {
                window.checkAdminStatus();
            }
        } else {
            localStorage.removeItem('isAdminLoggedIn');
        }
        
        return isAdmin;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Sign in with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object or error
 */
async function signInWithEmail(email, password) {
    try {
        const auth = firebase.auth();
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Sync to localStorage for unified login state
        const userData = {
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            firstName: (currentUser.displayName || currentUser.email?.split('@')[0] || 'User').split(' ')[0],
            email: currentUser.email,
            uid: currentUser.uid,
            createdAt: currentUser.metadata?.creationTime || new Date().toISOString()
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Check admin status
        const isAdmin = await checkAdminStatus(currentUser);
        
        // Trigger UI update across all systems
        if (typeof updateUserDisplay === 'function') updateUserDisplay();
        if (typeof window.updateUserDisplay === 'function') window.updateUserDisplay();
        
        return {
            success: true,
            user: currentUser,
            isAdmin: isAdmin
        };
    } catch (error) {
        console.error('Sign in error:', error);
        return {
            success: false,
            error: error.code,
            message: getAuthErrorMessage(error)
        };
    }
}

/**
 * Sign up new user with email and password
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional)
 * @returns {Promise<Object>} User object or error
 */
async function signUpWithEmail(email, password, displayName = '') {
    try {
        const auth = firebase.auth();
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Update display name if provided
        if (displayName) {
            await currentUser.updateProfile({
                displayName: displayName
            });
        }
        
        // Sync to localStorage for unified login state
        const userData = {
            name: displayName || currentUser.email?.split('@')[0] || 'User',
            firstName: (displayName || currentUser.email?.split('@')[0] || 'User').split(' ')[0],
            email: currentUser.email,
            uid: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Trigger UI update across all systems
        if (typeof updateUserDisplay === 'function') updateUserDisplay();
        if (typeof window.updateUserDisplay === 'function') window.updateUserDisplay();
        
        return {
            success: true,
            user: currentUser
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: error.code,
            message: getAuthErrorMessage(error)
        };
    }
}

/**
 * Sign out current user
 * 
 * @returns {Promise<void>}
 */
async function signOut() {
    try {
        const auth = firebase.auth();
        await auth.signOut();
        currentUser = null;
        
        // Clear all login state from localStorage
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('userData');
        
        updateAuthUI(null);
        
        // Trigger UI update across all systems
        if (typeof updateUserDisplay === 'function') updateUserDisplay();
        if (typeof window.updateUserDisplay === 'function') window.updateUserDisplay();
        
        // Reload page to reset state
        window.location.reload();
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Get current user
 * 
 * @returns {firebase.User|null} Current user or null
 */
function getCurrentUser() {
    return currentUser || firebase.auth().currentUser;
}

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} True if user is authenticated
 */
function isAuthenticated() {
    return getCurrentUser() !== null;
}

/**
 * Check if current user is admin
 * 
 * @returns {Promise<boolean>} True if user is admin
 */
async function isAdmin() {
    const user = getCurrentUser();
    if (!user) return false;
    return await checkAdminStatus(user);
}

/**
 * Get user-friendly error message
 * 
 * @param {Error} error - Firebase auth error
 * @returns {string} User-friendly error message
 */
function getAuthErrorMessage(error) {
    const errorMessages = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled.',
        'auth/requires-recent-login': 'Please sign out and sign in again to perform this action.'
    };
    
    return errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
}

/**
 * Update UI based on auth state
 * 
 * @param {firebase.User|null} user - Current user or null
 */
function updateAuthUI(user) {
    // Update any UI elements that depend on auth state
    const isLoggedIn = user !== null;
    
    // Update any buttons or links that should show/hide based on auth
    const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
    logoutButtons.forEach(btn => {
        if (btn) btn.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    const loginButtons = document.querySelectorAll('.login-btn, [data-action="login"]');
    loginButtons.forEach(btn => {
        if (btn) btn.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    // Update user display if element exists
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && user) {
        userDisplay.textContent = user.displayName || user.email || 'User';
    }
    
    // Update account icon state
    const accountIcon = document.getElementById('accountIcon');
    const accountIconBtn = document.getElementById('accountIconBtn');
    if (accountIcon) {
        accountIcon.className = isLoggedIn ? 'fas fa-user-circle logged-in' : 'fas fa-user-circle';
    }
    if (accountIconBtn) {
        if (isLoggedIn) {
            accountIconBtn.classList.add('logged-in');
            accountIconBtn.title = 'Account';
        } else {
            accountIconBtn.classList.remove('logged-in');
            accountIconBtn.title = 'Login / Create Account';
        }
    }
    
    // Sync localStorage if user is logged in
    if (user) {
        const existingData = localStorage.getItem('userData');
        if (!existingData) {
            const userData = {
                name: user.displayName || user.email?.split('@')[0] || 'User',
                firstName: (user.displayName || user.email?.split('@')[0] || 'User').split(' ')[0],
                email: user.email,
                uid: user.uid,
                createdAt: user.metadata?.creationTime || new Date().toISOString()
            };
            localStorage.setItem('userData', JSON.stringify(userData));
        }
    }
    
    // Trigger script.js updateUserDisplay if available
    if (typeof window.loadUserData === 'function') {
        window.loadUserData();
    }
}

/**
 * Require authentication - redirect if not authenticated
 * 
 * @param {Function} callback - Function to call if authenticated
 */
async function requireAuth(callback) {
    const user = getCurrentUser();
    if (!user) {
        // Show login modal or redirect
        if (typeof window.showAdminLogin === 'function') {
            window.showAdminLogin();
        } else {
            alert('Please sign in to continue.');
        }
        return;
    }
    
    if (callback) {
        callback(user);
    }
}

/**
 * Require admin - check if user is admin
 * 
 * @param {Function} callback - Function to call if admin
 */
async function requireAdmin(callback) {
    const user = getCurrentUser();
    if (!user) {
        if (typeof window.showAdminLogin === 'function') {
            window.showAdminLogin();
        } else {
            alert('Please sign in to continue.');
        }
        return;
    }
    
    const adminStatus = await isAdmin();
    if (!adminStatus) {
        alert('You must be an administrator to perform this action.');
        return;
    }
    
    if (callback) {
        callback(user);
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    // Wait for Firebase to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeFirebaseAuth, 1000);
        });
    } else {
        setTimeout(initializeFirebaseAuth, 1000);
    }
    
    // Make functions globally available
    window.initializeFirebaseAuth = initializeFirebaseAuth;
    window.signInWithEmail = signInWithEmail;
    window.signUpWithEmail = signUpWithEmail;
    window.signOut = signOut;
    window.getCurrentUser = getCurrentUser;
    window.isAuthenticated = isAuthenticated;
    window.isAdmin = isAdmin;
    window.requireAuth = requireAuth;
    window.requireAdmin = requireAdmin;
    window.checkAdminStatus = checkAdminStatus;
}

