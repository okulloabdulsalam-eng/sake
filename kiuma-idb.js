/**
 * KIUMA Unified IndexedDB — All content stored locally
 * Single DB, multiple stores, versioned for delta sync.
 * Covers: content records, file download index, sync state, offline queue.
 */
(function () {
    'use strict';

    const DB_NAME    = 'kiuma-offline-v1';
    const DB_VERSION = 1;

    const STORES = {
        CONTENT   : 'content',    // all fetched content records (type::id key)
        DOWNLOADS : 'downloads',  // downloaded file metadata index (url key)
        SYNC_STATE: 'sync_state', // last-sync timestamps per content type
        QUEUE     : 'queue'       // pending offline mutations
    };

    let _db = null;

    function openDb() {
        return new Promise(function (resolve, reject) {
            if (_db) { resolve(_db); return; }
            if (!window.indexedDB) { reject(new Error('IndexedDB not supported')); return; }

            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = function (e) {
                const db = e.target.result;

                if (!db.objectStoreNames.contains(STORES.CONTENT)) {
                    const cs = db.createObjectStore(STORES.CONTENT, { keyPath: '_key' });
                    cs.createIndex('type',      'type',      { unique: false });
                    cs.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.DOWNLOADS)) {
                    const ds = db.createObjectStore(STORES.DOWNLOADS, { keyPath: 'url' });
                    ds.createIndex('category', 'category', { unique: false });
                    ds.createIndex('savedAt',  'savedAt',  { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.SYNC_STATE)) {
                    db.createObjectStore(STORES.SYNC_STATE, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(STORES.QUEUE)) {
                    const qs = db.createObjectStore(STORES.QUEUE, { autoIncrement: true, keyPath: 'qid' });
                    qs.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };

            req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
            req.onerror   = function (e) { reject(e.target.error); };
        });
    }

    // ── Content Store ──────────────────────────────────────────────

    function _contentKey(type, id) { return type + '::' + String(id); }

    async function putContent(type, id, data) {
        const db = await openDb();
        return new Promise(function (resolve, reject) {
            const tx     = db.transaction(STORES.CONTENT, 'readwrite');
            const record = Object.assign({}, data, {
                _key:      _contentKey(type, id),
                type:      type,
                _id:       id,
                _cachedAt: Date.now()
            });
            const req = tx.objectStore(STORES.CONTENT).put(record);
            req.onsuccess = function () { resolve(true); };
            req.onerror   = function () { reject(req.error); };
        });
    }

    async function putContentBatch(type, records, idField) {
        if (!records || records.length === 0) return 0;
        const db = await openDb();
        return new Promise(function (resolve, reject) {
            const tx    = db.transaction(STORES.CONTENT, 'readwrite');
            const store = tx.objectStore(STORES.CONTENT);
            records.forEach(function (r) {
                const id = r[idField || 'id'] || r.id;
                store.put(Object.assign({}, r, {
                    _key:      _contentKey(type, id),
                    type:      type,
                    _id:       id,
                    _cachedAt: Date.now()
                }));
            });
            tx.oncomplete = function () { resolve(records.length); };
            tx.onerror    = function () { reject(tx.error); };
        });
    }

    async function getContent(type, id) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.CONTENT, 'readonly');
            const req = tx.objectStore(STORES.CONTENT).get(_contentKey(type, id));
            req.onsuccess = function () { resolve(req.result || null); };
            req.onerror   = function () { resolve(null); };
        });
    }

    async function getAllContent(type) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.CONTENT, 'readonly');
            const req = tx.objectStore(STORES.CONTENT).index('type').getAll(type);
            req.onsuccess = function () { resolve(req.result || []); };
            req.onerror   = function () { resolve([]); };
        });
    }

    async function deleteContent(type, id) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.CONTENT, 'readwrite');
            const req = tx.objectStore(STORES.CONTENT).delete(_contentKey(type, id));
            req.onsuccess = function () { resolve(true); };
            req.onerror   = function () { resolve(false); };
        });
    }

    // ── Downloads Index ────────────────────────────────────────────

    async function putDownload(meta) {
        const db = await openDb();
        return new Promise(function (resolve, reject) {
            const tx  = db.transaction(STORES.DOWNLOADS, 'readwrite');
            const req = tx.objectStore(STORES.DOWNLOADS).put(
                Object.assign({}, meta, { savedAt: meta.savedAt || Date.now() })
            );
            req.onsuccess = function () { resolve(true); };
            req.onerror   = function () { reject(req.error); };
        });
    }

    async function getDownload(url) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.DOWNLOADS, 'readonly');
            const req = tx.objectStore(STORES.DOWNLOADS).get(url);
            req.onsuccess = function () { resolve(req.result || null); };
            req.onerror   = function () { resolve(null); };
        });
    }

    async function hasDownload(url) { return !!(await getDownload(url)); }

    async function getAllDownloads(category) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx = db.transaction(STORES.DOWNLOADS, 'readonly');
            const req = category
                ? tx.objectStore(STORES.DOWNLOADS).index('category').getAll(category)
                : tx.objectStore(STORES.DOWNLOADS).getAll();
            req.onsuccess = function () { resolve(req.result || []); };
            req.onerror   = function () { resolve([]); };
        });
    }

    async function removeDownload(url) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.DOWNLOADS, 'readwrite');
            const req = tx.objectStore(STORES.DOWNLOADS).delete(url);
            req.onsuccess = function () { resolve(true); };
            req.onerror   = function () { resolve(false); };
        });
    }

    // ── Sync State ─────────────────────────────────────────────────

    async function getSyncState(key) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.SYNC_STATE, 'readonly');
            const req = tx.objectStore(STORES.SYNC_STATE).get(key);
            req.onsuccess = function () { resolve(req.result || null); };
            req.onerror   = function () { resolve(null); };
        });
    }

    async function setSyncState(key, data) {
        const db = await openDb();
        return new Promise(function (resolve, reject) {
            const tx  = db.transaction(STORES.SYNC_STATE, 'readwrite');
            const req = tx.objectStore(STORES.SYNC_STATE).put(Object.assign({ key: key }, data));
            req.onsuccess = function () { resolve(true); };
            req.onerror   = function () { reject(req.error); };
        });
    }

    async function getLastSync(contentType) {
        const s = await getSyncState('last_sync_' + contentType);
        return s ? s.timestamp : null;
    }

    async function setLastSync(contentType, timestamp) {
        return setSyncState('last_sync_' + contentType, { timestamp: timestamp || Date.now() });
    }

    // ── Offline Queue ──────────────────────────────────────────────

    async function enqueue(action, payload) {
        const db = await openDb();
        return new Promise(function (resolve, reject) {
            const tx  = db.transaction(STORES.QUEUE, 'readwrite');
            const req = tx.objectStore(STORES.QUEUE).add({
                action:    action,
                payload:   payload,
                createdAt: Date.now(),
                retries:   0
            });
            req.onsuccess = function () { resolve(req.result); };
            req.onerror   = function () { reject(req.error); };
        });
    }

    async function dequeue(qid) {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx = db.transaction(STORES.QUEUE, 'readwrite');
            tx.objectStore(STORES.QUEUE).delete(qid);
            tx.oncomplete = function () { resolve(true); };
        });
    }

    async function getAllQueued() {
        const db = await openDb();
        return new Promise(function (resolve) {
            const tx  = db.transaction(STORES.QUEUE, 'readonly');
            const req = tx.objectStore(STORES.QUEUE).getAll();
            req.onsuccess = function () { resolve(req.result || []); };
            req.onerror   = function () { resolve([]); };
        });
    }

    // ── Init ───────────────────────────────────────────────────────

    function init() {
        openDb().catch(function (e) { console.warn('[KiuIDB] Init error:', e); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ── Public API ─────────────────────────────────────────────────

    window.KiuIDB = {
        putContent:      putContent,
        putContentBatch: putContentBatch,
        getContent:      getContent,
        getAllContent:   getAllContent,
        deleteContent:   deleteContent,

        putDownload:    putDownload,
        getDownload:    getDownload,
        hasDownload:    hasDownload,
        getAllDownloads: getAllDownloads,
        removeDownload: removeDownload,

        getLastSync:   getLastSync,
        setLastSync:   setLastSync,
        getSyncState:  getSyncState,
        setSyncState:  setSyncState,

        enqueue:      enqueue,
        dequeue:      dequeue,
        getAllQueued:  getAllQueued
    };
})();
