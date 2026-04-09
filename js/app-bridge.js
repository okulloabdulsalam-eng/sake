/**
 * KiumaBridge - in-app bridge for KIUMA APK wrapper.
 * Communicates with the parent Capacitor shell (www/index.html) via postMessage.
 * Provides: isInApp(), saveFileToDevice(), saveToPublicDownloads(),
 *           startMediaSession(), stopMediaSession(), deleteFile()
 */
(function() {
    'use strict';
    // Only activate inside an iframe (APK WebView loads sake in an iframe)
    if (window === window.parent) return;

    var _pendingRequests = {};
    var _reqId = 0;

    // Save real window.open BEFORE any override for fallback use
    var _realWindowOpen = window.open;

    function sendToParent(type, data) {
        return new Promise(function(resolve, reject) {
            var id = 'kb_' + (++_reqId) + '_' + Date.now();
            _pendingRequests[id] = { resolve: resolve, reject: reject };
            var msg = Object.assign({}, data || {});
            msg.type = type;
            msg.requestId = id;
            try {
                window.parent.postMessage(msg, '*');
            } catch (e) {
                delete _pendingRequests[id];
                reject(e);
                return;
            }
            // Timeout after 120s for large downloads
            setTimeout(function() {
                if (_pendingRequests[id]) {
                    delete _pendingRequests[id];
                    resolve(false); // don't reject, just return false
                }
            }, 120000);
        });
    }

    // Listen for responses from parent
    window.addEventListener('message', function(e) {
        var d = e.data;
        if (!d || d.type !== 'BRIDGE_RESPONSE') return;
        var pending = _pendingRequests[d.requestId];
        if (!pending) return;
        delete _pendingRequests[d.requestId];
        if (d.success) {
            pending.resolve(d.data !== undefined ? d.data : true);
        } else {
            pending.resolve(false);
        }
    });

    window.KiumaBridge = {
        isInApp: function() {
            return true;
        },

        /**
         * Download a file to the app-private directory (android/data/com.kiuma.app/).
         * @param {string} url - File URL
         * @param {string} filename - Target filename
         * @param {string} mimeType - MIME type
         * @param {object} [options] - Optional (ignored, for compat)
         * @returns {Promise<boolean>}
         */
        saveFileToDevice: function(url, filename, mimeType, options) {
            return sendToParent('BACKGROUND_DOWNLOAD', {
                url: url,
                filename: filename,
                mimeType: mimeType || 'application/octet-stream',
                title: filename
            }).then(function(r) { return r !== false; }).catch(function() { return false; });
        },

        /**
         * Save/export a file to public Downloads folder so user can access it outside the app.
         * @param {string} url - File URL
         * @param {string} filename - Target filename
         * @param {string} mimeType - MIME type
         * @returns {Promise<boolean>}
         */
        saveToPublicDownloads: function(url, filename, mimeType) {
            return sendToParent('SAVE_TO_PUBLIC_DOWNLOADS', {
                url: url,
                filename: filename,
                mimeType: mimeType || 'application/octet-stream',
                title: filename
            }).then(function(r) { return r !== false; }).catch(function() { return false; });
        },

        /**
         * Start background media playback session (keeps audio/video playing when app is minimized).
         * @param {string} title - Title shown in the notification
         */
        startMediaSession: function(title) {
            return sendToParent('START_MEDIA_SESSION', { title: title || 'KIUMA Media' });
        },

        /**
         * Stop the background media playback session.
         */
        stopMediaSession: function() {
            return sendToParent('STOP_MEDIA_SESSION', {});
        }
    };

    // Also expose as KiumaApp for legacy compat
    window.KiumaApp = window.KiumaBridge;

    // Intercept external link clicks and open them via the native bridge
    // This handles wa.me, tel:, mailto:, and any non-sake links
    function isExternalUrl(href) {
        if (!href) return false;
        if (/^(tel:|mailto:|sms:|whatsapp:|intent:|market:|geo:)/i.test(href)) return true;
        if (/wa\.me|chat\.whatsapp\.com|t\.me|youtube\.com|youtu\.be|play\.google\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|drive\.google\.com|docs\.google\.com|maps\.google\.com|linkedin\.com|tiktok\.com|snapchat\.com|pinterest\.com|reddit\.com|github\.com|medium\.com/i.test(href)) return true;
        try {
            var u = new URL(href, location.href);
            var own = location.hostname;
            if (u.hostname && u.hostname !== own && u.hostname !== 'okulloabdulsalam-eng.github.io') return true;
        } catch(e) {}
        return false;
    }

    // Try to open an external URL using multiple methods for robustness
    function openExternalUrl(href) {
        console.log('[KiumaBridge] Opening external URL:', href);
        // Method 1: Direct native JS interface (works from iframe, no postMessage needed)
        if (window.KiumaNative && window.KiumaNative.openExternal) {
            try {
                window.KiumaNative.openExternal(href);
                console.log('[KiumaBridge] Opened via KiumaNative');
                return;
            } catch(e) {
                console.warn('[KiumaBridge] KiumaNative failed:', e);
            }
        }
        // Method 2: Send to parent bridge (native Intent via Capacitor plugin)
        sendToParent('OPEN_EXTERNAL', { url: href });
        // Method 3: Fallback after 600ms - try real window.open if bridge didn't handle it
        setTimeout(function() {
            try {
                _realWindowOpen.call(window, href, '_system');
            } catch(ex) {
                try { _realWindowOpen.call(window, href, '_blank'); } catch(ex2) {}
            }
        }, 600);
    }

    document.addEventListener('click', function(e) {
        var link = e.target.closest ? e.target.closest('a[href]') : null;
        if (!link) {
            // Walk up for older browsers
            var el = e.target;
            while (el && el !== document) {
                if (el.tagName === 'A' && el.href) { link = el; break; }
                el = el.parentElement;
            }
        }
        if (!link || !link.href) return;
        var href = link.href;
        if (isExternalUrl(href)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            openExternalUrl(href);
            return false;
        }
    }, true);

    // Override window.open to catch target="_blank" links that bypass the click handler
    window.open = function(url, target, features) {
        if (url && isExternalUrl(url)) {
            openExternalUrl(url);
            return null;
        }
        return _realWindowOpen.call(window, url, target, features);
    };

    console.log('[KiumaBridge] App bridge initialized (in-app mode)');
})();