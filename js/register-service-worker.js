/**
 * Service Worker Registration - AUTOMATIC INSTALLATION
 * Registers the PWA service worker immediately for offline functionality
 * Automatically downloads and caches assets without user interaction
 */

(function() {
    'use strict';

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.log('[SW] Service workers are not supported in this browser');
        return;
    }

    // Register service worker IMMEDIATELY (don't wait for page load)
    // This ensures automatic download and installation
    registerServiceWorker();
    
    // Also register on page load as backup
    if (document.readyState === 'loading') {
        window.addEventListener('load', registerServiceWorker);
    }

    /**
     * Register the service worker - AUTOMATIC INSTALLATION
     */
    async function registerServiceWorker() {
        try {
            // Check if already registered
            const existingRegistration = await navigator.serviceWorker.getRegistration();
            if (existingRegistration && existingRegistration.active) {
                console.log('[SW] Service worker already registered and active');
                return existingRegistration;
            }

            // Register service worker immediately (automatic download)
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none' // Always check for updates
            });

            console.log('[SW] Service worker registered successfully:', registration.scope);
            
            // Wait for service worker to be ready and active
            if (registration.installing) {
                console.log('[SW] Service worker installing...');
                registration.installing.addEventListener('statechange', function() {
                    if (this.state === 'activated') {
                        console.log('[SW] Service worker activated - assets cached automatically!');
                    }
                });
            } else if (registration.waiting) {
                console.log('[SW] Service worker waiting, activating...');
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else if (registration.active) {
                console.log('[SW] Service worker already active - assets available offline!');
            }

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        console.log('[SW] New service worker available');
                        // Optionally show update notification to user
                        showUpdateNotification();
                    }
                });
            });

            // Handle service worker updates automatically
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                console.log('[SW] New service worker activated, reloading page...');
                // Auto-reload to use new service worker
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            });

            // Force immediate activation (automatic download)
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            return registration;

        } catch (error) {
            console.error('[SW] Service worker registration failed:', error);
        }
    }

    /**
     * Automatic PWA Install Prompt Handler
     */
    let deferredPrompt;
    let installButton;

    // Listen for beforeinstallprompt event (automatic install prompt)
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        console.log('[PWA] Install prompt available - ready for automatic installation');
        
        // Automatically show install prompt after a short delay
        setTimeout(() => {
            showInstallPrompt();
        }, 2000); // Show after 2 seconds
    });

    /**
     * Show install prompt automatically
     */
    async function showInstallPrompt() {
        if (!deferredPrompt) {
            return;
        }

        try {
            // Show the install prompt
            deferredPrompt.prompt();
            console.log('[PWA] Showing install prompt automatically');
            
            // Wait for user response
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] User response:', outcome);
            
            if (outcome === 'accepted') {
                console.log('[PWA] User accepted the install prompt');
            } else {
                console.log('[PWA] User dismissed the install prompt');
            }
            
            // Clear the deferredPrompt
            deferredPrompt = null;
        } catch (error) {
            console.error('[PWA] Error showing install prompt:', error);
        }
    }

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed successfully!');
        deferredPrompt = null;
    });

    /**
     * Show update notification (optional)
     */
    function showUpdateNotification() {
        // You can add a UI notification here if needed
        // For now, we'll just log it
        console.log('[SW] New version available. Refresh to update.');
    }

    /**
     * Unregister service worker (for testing/debugging)
     */
    window.unregisterServiceWorker = async function() {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.unregister();
                console.log('[SW] Service worker unregistered');
            }
        } catch (error) {
            console.error('[SW] Failed to unregister service worker:', error);
        }
    };

})();

