/**
 * Navigation Update Script
 * Updates "Join" links to "Account" when user is logged in
 */

function updateNavigationLinks() {
    const isLoggedIn = checkIfLoggedIn();
    const linkText = isLoggedIn ? 'Account' : 'Join';
    const linkIcon = isLoggedIn ? 'fa-user-circle' : 'fa-user-plus';
    const linkTitle = isLoggedIn ? 'My Account' : 'Join Us';

    // Update all navigation links
    document.querySelectorAll('a[href="join-us.html"]').forEach(link => {
        // Update icon
        const icon = link.querySelector('i');
        if (icon) {
            icon.className = `fas ${linkIcon}`;
        }
        
        // Update text
        const text = link.querySelector('span');
        if (text) {
            text.textContent = linkText;
        }
        
        // Update title attribute
        link.title = linkTitle;
    });

    // Update sidebar navigation
    const sidebarLink = document.querySelector('.nav-list a[href="join-us.html"]');
    if (sidebarLink) {
        const sidebarIcon = sidebarLink.querySelector('i');
        if (sidebarIcon) {
            sidebarIcon.className = `fas ${linkIcon}`;
        }
        const sidebarText = sidebarLink.textContent.trim();
        if (sidebarText.includes('Join')) {
            sidebarLink.innerHTML = `<i class="fas ${linkIcon}"></i> ${linkTitle}`;
        }
    }
}

function checkIfLoggedIn() {
    // Check Firebase Auth
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user) return true;
    }
    
    // Check localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user && (user.email || user.uid);
        } catch (e) {
            return false;
        }
    }
    
    return false;
}

// Update navigation on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(updateNavigationLinks, 500);
    });
} else {
    setTimeout(updateNavigationLinks, 500);
}

// Update navigation when auth state changes
if (typeof window !== 'undefined') {
    window.updateNavigationLinks = updateNavigationLinks;
    
    // Listen for auth state changes
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(() => {
            updateNavigationLinks();
        });
    }
}

