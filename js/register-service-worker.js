// Minimal SW registration helper.
// Some pages include this file directly; keep it safe and idempotent.

(function () {
    try {
        if (!('serviceWorker' in navigator)) return;

        // If script.js already registered, avoid re-registering.
        // Registering twice is generally safe, but this reduces noise.
        navigator.serviceWorker.getRegistration('./sw.js').then(function (existing) {
            if (existing) return;
            navigator.serviceWorker.register('./sw.js').catch(function () { /* silent */ });
        }).catch(function () {
            // Fallback: try register anyway
            navigator.serviceWorker.register('./sw.js').catch(function () { /* silent */ });
        });
    } catch (e) {
        // Silent by design
    }
})();
