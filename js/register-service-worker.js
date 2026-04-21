// Minimal SW registration helper.
// Some pages include this file directly; keep it safe and idempotent.

(function () {
    try {
        if (!('serviceWorker' in navigator)) return;

        function requestOfflineCacheRefresh(registration) {
            try {
                var target = (registration && (registration.active || registration.waiting || registration.installing)) || navigator.serviceWorker.controller;
                if (target) {
                    target.postMessage({ type: 'REFRESH_OFFLINE_CACHE' });
                }
            } catch (e) {
            }
        }

        // If script.js already registered, avoid re-registering.
        // Registering twice is generally safe, but this reduces noise.
        navigator.serviceWorker.getRegistration('./sw.js').then(function (existing) {
            if (existing) {
                requestOfflineCacheRefresh(existing);
                return;
            }
            navigator.serviceWorker.register('./sw.js').then(function (registration) {
                requestOfflineCacheRefresh(registration);
            }).catch(function () { /* silent */ });
        }).catch(function () {
            // Fallback: try register anyway
            navigator.serviceWorker.register('./sw.js').then(function (registration) {
                requestOfflineCacheRefresh(registration);
            }).catch(function () { /* silent */ });
        });

        window.addEventListener('online', function () {
            navigator.serviceWorker.getRegistration('./sw.js').then(function (registration) {
                if (registration) requestOfflineCacheRefresh(registration);
            }).catch(function () { /* silent */ });
        });
    } catch (e) {
        // Silent by design
    }
})();
