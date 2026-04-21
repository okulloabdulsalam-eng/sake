/**
 * KIUMA App Storage — Persistent file storage using IndexedDB
 * Files saved here persist like WhatsApp app files — available offline.
 * Browser won't auto-clear when storage is marked persistent.
 */

(function() {
    'use strict';

    const DB_NAME = 'kiuma-app-files';
    const DB_VERSION = 1;
    const FILES_STORE = 'files';
    const META_STORE = 'meta';

    let _db = null;

    // Open or create the IndexedDB database
    function openDb() {
        return new Promise(function(resolve, reject) {
            if (_db) { resolve(_db); return; }
            if (!window.indexedDB) { reject(new Error('IndexedDB not supported')); return; }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function(e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(FILES_STORE)) {
                    db.createObjectStore(FILES_STORE); // key = url
                }
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE); // key = url
                }
            };
            req.onsuccess = function(e) { _db = e.target.result; resolve(_db); };
            req.onerror = function(e) { reject(e.target.error); };
        });
    }

    // Request persistent storage so browser never auto-clears our files
    async function requestPersistentStorage() {
        try {
            if (navigator.storage && navigator.storage.persist) {
                const granted = await navigator.storage.persist();
                console.log('[AppStorage] Persistent storage ' + (granted ? 'granted' : 'denied'));
                return granted;
            }
        } catch(e) { console.warn('[AppStorage] Persistent storage request failed:', e); }
        return false;
    }

    // Save a file blob + metadata to IndexedDB
    async function saveFile(url, blob, meta) {
        const db = await openDb();
        return new Promise(function(resolve, reject) {
            const tx = db.transaction([FILES_STORE, META_STORE], 'readwrite');
            tx.objectStore(FILES_STORE).put(blob, url);
            tx.objectStore(META_STORE).put({
                url: url,
                name: meta.name || '',
                type: meta.type || '',
                category: meta.category || '',
                title: meta.title || '',
                author: meta.author || '',
                size: meta.size || blob.size || 0,
                contentType: meta.contentType || blob.type || 'application/octet-stream',
                savedAt: Date.now()
            }, url);
            tx.oncomplete = function() { resolve(true); };
            tx.onerror = function(e) { reject(e.target.error); };
        });
    }

    // Get a file blob from IndexedDB
    async function getFile(url) {
        const db = await openDb();
        return new Promise(function(resolve, reject) {
            const tx = db.transaction(FILES_STORE, 'readonly');
            const req = tx.objectStore(FILES_STORE).get(url);
            req.onsuccess = function() { resolve(req.result || null); };
            req.onerror = function() { resolve(null); };
        });
    }

    // Get file metadata
    async function getFileMeta(url) {
        const db = await openDb();
        return new Promise(function(resolve, reject) {
            const tx = db.transaction(META_STORE, 'readonly');
            const req = tx.objectStore(META_STORE).get(url);
            req.onsuccess = function() { resolve(req.result || null); };
            req.onerror = function() { resolve(null); };
        });
    }

    // Check if file exists
    async function hasFile(url) {
        const meta = await getFileMeta(url);
        return !!meta;
    }

    // Remove a file
    async function removeFile(url) {
        const db = await openDb();
        return new Promise(function(resolve, reject) {
            const tx = db.transaction([FILES_STORE, META_STORE], 'readwrite');
            tx.objectStore(FILES_STORE).delete(url);
            tx.objectStore(META_STORE).delete(url);
            tx.oncomplete = function() { resolve(true); };
            tx.onerror = function() { resolve(false); };
        });
    }

    // Get all file metadata (index of all saved files)
    async function getAllMeta() {
        const db = await openDb();
        return new Promise(function(resolve, reject) {
            const tx = db.transaction(META_STORE, 'readonly');
            const req = tx.objectStore(META_STORE).getAll();
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { resolve([]); };
        });
    }

    // Get storage usage stats
    async function getStorageStats() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const est = await navigator.storage.estimate();
                return {
                    used: est.usage || 0,
                    quota: est.quota || 0,
                    persistent: (await navigator.storage.persisted()) || false
                };
            }
        } catch(e) {}
        return { used: 0, quota: 0, persistent: false };
    }

    // Download a file from URL with progress, save to IndexedDB
    async function downloadAndSave(url, meta, onProgress) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Download failed: ' + response.status);

            const cl = response.headers.get('Content-Length');
            const total = cl ? parseInt(cl, 10) : (meta.size || 0);
            const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
            let blob;

            // Stream with progress if supported
            if (response.body && typeof response.body.getReader === 'function') {
                try {
                    const reader = response.body.getReader();
                    const chunks = [];
                    let loaded = 0;
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        chunks.push(value);
                        loaded += value.length;
                        if (onProgress) {
                            if (total > 0) {
                                onProgress(Math.min(Math.round((loaded / total) * 100), 99), loaded, total);
                            } else {
                                onProgress(-1, loaded, 0);
                            }
                        }
                    }
                    blob = new Blob(chunks, { type: contentType });
                } catch(streamErr) {
                    blob = await response.blob();
                }
            } else {
                blob = await response.blob();
            }

            if (onProgress) onProgress(100, blob.size, blob.size);

            // Save to IndexedDB (persistent)
            meta.contentType = contentType;
            meta.size = meta.size || blob.size;
            await saveFile(url, blob, meta);

            // Also keep a lightweight localStorage index for quick sync checks
            _updateLocalIndex(url, meta);

            return true;
        } catch(e) {
            console.error('[AppStorage] Download error:', e);
            return false;
        }
    }

    // Remove file and update local index
    async function removeAndCleanup(url) {
        await removeFile(url);
        _removeFromLocalIndex(url);
        return true;
    }

    // Get a blob URL for offline playback
    async function getOfflineUrl(url) {
        const blob = await getFile(url);
        if (!blob) return null;
        return URL.createObjectURL(blob);
    }

    // Quick sync check using localStorage index (no async needed)
    function isFileSaved(url) {
        try {
            const idx = JSON.parse(localStorage.getItem('kiuma-app-files-index') || '[]');
            return idx.some(function(f) { return f.url === url; });
        } catch(e) { return false; }
    }

    function getLocalIndex() {
        try { return JSON.parse(localStorage.getItem('kiuma-app-files-index') || '[]'); } catch(e) { return []; }
    }

    function _updateLocalIndex(url, meta) {
        var idx = getLocalIndex();
        var existing = idx.findIndex(function(f) { return f.url === url; });
        var entry = { url: url, name: meta.name || '', type: meta.type || '', category: meta.category || '', title: meta.title || '', author: meta.author || '', size: meta.size || 0, savedAt: Date.now() };
        if (existing >= 0) idx[existing] = entry; else idx.push(entry);
        localStorage.setItem('kiuma-app-files-index', JSON.stringify(idx));
    }

    function _removeFromLocalIndex(url) {
        var idx = getLocalIndex().filter(function(f) { return f.url !== url; });
        localStorage.setItem('kiuma-app-files-index', JSON.stringify(idx));
    }

    // Migrate existing Cache API files to IndexedDB (one-time)
    async function migrateFromCacheAPI(cacheName, indexKey) {
        try {
            const migrated = localStorage.getItem('kiuma-migrated-' + cacheName);
            if (migrated === 'done') return;

            const idx = JSON.parse(localStorage.getItem(indexKey) || '[]');
            if (idx.length === 0) { localStorage.setItem('kiuma-migrated-' + cacheName, 'done'); return; }

            const cache = await caches.open(cacheName);
            let count = 0;
            for (const item of idx) {
                try {
                    const resp = await cache.match(item.url);
                    if (resp) {
                        const blob = await resp.blob();
                        await saveFile(item.url, blob, item);
                        _updateLocalIndex(item.url, item);
                        count++;
                    }
                } catch(e) { /* skip failed items */ }
            }
            if (count > 0) console.log('[AppStorage] Migrated ' + count + ' files from ' + cacheName);
            localStorage.setItem('kiuma-migrated-' + cacheName, 'done');
        } catch(e) { console.warn('[AppStorage] Migration error:', e); }
    }

    // Initialize: request persistent storage + open DB
    async function init() {
        try {
            await openDb();
            await requestPersistentStorage();
            // Migrate old Cache API files
            migrateFromCacheAPI('kiuma-offline-media', 'kiuma-offline-media-index');
            migrateFromCacheAPI('kiuma-offline-library', 'kiuma-offline-library-index');
        } catch(e) { console.warn('[AppStorage] Init error:', e); }
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API
    window.AppStorage = {
        downloadAndSave: downloadAndSave,
        removeFile: removeAndCleanup,
        getFile: getFile,
        getFileMeta: getFileMeta,
        hasFile: hasFile,
        getAllMeta: getAllMeta,
        getOfflineUrl: getOfflineUrl,
        isFileSaved: isFileSaved,
        getLocalIndex: getLocalIndex,
        getStorageStats: getStorageStats,
        requestPersistentStorage: requestPersistentStorage
    };
})();
