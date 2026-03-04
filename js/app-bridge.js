/**
 * KiumaBridge — in-app bridge for KIUMA APK wrapper.
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

    console.log('[KiumaBridge] App bridge initialized (in-app mode)');
})();
