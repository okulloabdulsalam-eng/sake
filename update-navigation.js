/**
 * Unified Navigation Update System
 * 
 * This is the CENTRAL system for updating navigation based on authentication state.
 * All other scripts should use this system to ensure consistency.
 * 
 * Features:
 * - Checks multiple authentication sources (Firebase Auth, localStorage)
 * - Updates bottom navigation, sidebar navigation, and account icons
 * - Stable and reliable - won't revert unexpectedly
 * - Integrated with all login systems
 */

// Global flag to prevent multiple simultaneous updates
let isUpdatingNavigation = false;
let lastAuthState = null;

/**
 * Check if user is logged in by checking all available sources
 * @returns {boolean} True if user is logged in
 */
function checkIfLoggedIn() {
    // Priority 1: Check Firebase Auth (most reliable)
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
            const auth = firebase.auth();
            const user = auth.currentUser;
            if (user && user.uid) {
                return true;
            }
        } catch (e) {
            console.warn('Error checking Firebase Auth:', e);
        }
    }
    
    // Priority 2: Check getCurrentUser function (from firebase-auth.js)
    if (typeof getCurrentUser === 'function') {
        try {
            const user = getCurrentUser();
            if (user && user.uid) {
                return true;
            }
        } catch (e) {
            console.warn('Error checking getCurrentUser:', e);
        }
    }
    
    // Priority 3: Check localStorage userData
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            if (user && (user.email || user.uid)) {
                // Verify it's valid data
                return !!(user.email || user.uid);
            }
        }
    } catch (e) {
        console.warn('Error checking localStorage:', e);
    }
    
    return false;
}

/**
 * Update all navigation elements based on authentication state
 * This is the MAIN function that should be called from everywhere
 */
function updateNavigationLinks() {
    // Prevent multiple simultaneous updates
    if (isUpdatingNavigation) {
        return;
    }
    
    isUpdatingNavigation = true;
    
    try {
        const isLoggedIn = checkIfLoggedIn();
        
        // Only update if state actually changed (optimization)
        if (lastAuthState === isLoggedIn) {
            isUpdatingNavigation = false;
            return;
        }
        
        lastAuthState = isLoggedIn;
        
        // Determine what to show
        const linkText = isLoggedIn ? 'Account' : 'Join';
        const linkIcon = isLoggedIn ? 'fa-user-circle' : 'fa-user-plus';
        const linkTitle = isLoggedIn ? 'My Account' : 'Join Us';
        
        // Update bottom navigation links (all pages)
        document.querySelectorAll('.bottom-nav a[href="join-us.html"]').forEach(link => {
            // Update icon
            const icon = link.querySelector('i');
            if (icon) {
                icon.className = `fas ${linkIcon}`;
            }
            
            // Update text span
            const textSpan = link.querySelector('span');
            if (textSpan) {
                textSpan.textContent = linkText;
            } else {
                // If no span, update the link text directly
                const textNode = Array.from(link.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                );
                if (textNode) {
                    textNode.textContent = linkText;
                }
            }
            
            // Update title attribute
            link.title = linkTitle;
            
            // Update specific IDs if they exist
            if (link.id === 'accountNavItem') {
                const navText = document.getElementById('accountNavText');
                if (navText) {
                    navText.textContent = linkText;
                }
            }
        });
        
        // Update sidebar navigation (hamburger menu)
        const sidebarLink = document.querySelector('.nav-list a[href="join-us.html"]');
        if (sidebarLink) {
            const sidebarIcon = sidebarLink.querySelector('i');
            if (sidebarIcon) {
                sidebarIcon.className = `fas ${linkIcon}`;
            }
            
            // Update sidebar text - be careful not to break the structure
            const sidebarText = sidebarLink.textContent.trim();
            if (sidebarText.includes('Join') || sidebarText.includes('Account') || sidebarText.includes('My Account')) {
                // Replace the text while keeping the icon
                const iconHTML = sidebarIcon ? sidebarIcon.outerHTML : '';
                sidebarLink.innerHTML = `${iconHTML} ${linkTitle}`;
            }
        }
        
        // Update account icon in header (if exists)
        const accountIcon = document.getElementById('accountIcon');
        const accountIconBtn = document.getElementById('accountIconBtn');
        
        if (accountIcon) {
            if (isLoggedIn) {
                accountIcon.className = 'fas fa-user-circle logged-in';
            } else {
                accountIcon.className = 'fas fa-user-circle';
            }
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
        
        // Dispatch custom event for other scripts that might need to react
        const event = new CustomEvent('navigationUpdated', { 
            detail: { isLoggedIn: isLoggedIn } 
        });
        window.dispatchEvent(event);
        
    } catch (error) {
        console.error('Error updating navigation:', error);
    } finally {
        isUpdatingNavigation = false;
    }
}

/**
 * Force update navigation (bypasses state check)
 * Use this when you know the state has changed externally
 */
function forceUpdateNavigation() {
    lastAuthState = null;
    updateNavigationLinks();
}

// Initialize on page load
function initializeNavigation() {
    // Update immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Small delay to ensure other scripts have initialized
            setTimeout(updateNavigationLinks, 100);
        });
    } else {
        // DOM already loaded
        setTimeout(updateNavigationLinks, 100);
    }
    
    // Also update after a longer delay to catch late-loading auth systems
    setTimeout(updateNavigationLinks, 500);
    setTimeout(updateNavigationLinks, 1000);
}

// Set up Firebase Auth listener
function setupAuthListener() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        try {
            const auth = firebase.auth();
            auth.onAuthStateChanged((user) => {
                // Force update when auth state changes
                forceUpdateNavigation();
            });
        } catch (e) {
            console.warn('Could not set up Firebase auth listener:', e);
        }
    }
}

// Make functions globally accessible
if (typeof window !== 'undefined') {
    window.updateNavigationLinks = updateNavigationLinks;
    window.forceUpdateNavigation = forceUpdateNavigation;
    window.checkIfLoggedIn = checkIfLoggedIn;
}

// Initialize
initializeNavigation();
setupAuthListener();

// Also listen for storage changes (in case userData is updated elsewhere)
window.addEventListener('storage', (e) => {
    if (e.key === 'userData') {
        forceUpdateNavigation();
    }
});

// Listen for custom events from other scripts
window.addEventListener('userLoggedIn', forceUpdateNavigation);
window.addEventListener('userLoggedOut', forceUpdateNavigation);
window.addEventListener('authStateChanged', forceUpdateNavigation);
