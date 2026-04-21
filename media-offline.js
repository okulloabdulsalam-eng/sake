/**
 * Offline-first media: IndexedDB mediaAppDB
 * Stores: media (metadata list), downloads (blobs by id)
 * Do not cache large media in SW; all downloaded files go here.
 */
(function () {
    'use strict';

    const DB_NAME = 'mediaAppDB';
    const DB_VERSION = 1;
    const MEDIA_STORE = 'media';
    const DOWNLOADS_STORE = 'downloads';

    let _db = null;

    function openDB() {
        return new Promise((resolve, reject) => {
            if (_db) {
                resolve(_db);
                return;
            }
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function (e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(MEDIA_STORE)) {
                    db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(DOWNLOADS_STORE)) {
                    db.createObjectStore(DOWNLOADS_STORE, { keyPath: 'id' });
                }
            };
            req.onsuccess = function (e) {
                _db = e.target.result;
                resolve(_db);
            };
            req.onerror = function (e) {
                reject(e.target.error);
            };
        });
    }

    /**
     * Generate a stable id from url for use as keyPath
     */
    function idFromUrl(url) {
        if (!url) return 'unknown';
        try {
            return url.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 200) || 'item';
        } catch (e) {
            return 'item_' + Math.random().toString(36).slice(2);
        }
    }

    /**
     * Save full media list (when online). Each item: id, title, type, thumbnail, url, isDownloaded
     */
    async function setMediaList(items) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            const store = tx.objectStore(MEDIA_STORE);
            store.clear();
            const toPut = (items || []).map((item) => {
                const id = item.id || idFromUrl(item.url);
                return {
                    id,
                    title: item.title || item.name || 'Untitled',
                    type: item.type || 'other',
                    thumbnail: item.thumbnail || '',
                    url: item.url || '',
                    isDownloaded: item.isDownloaded === true,
                    name: item.name,
                    author: item.author,
                    size: item.size,
                    playlist: item.playlist
                };
            });
            toPut.forEach((item) => store.put(item));
            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Get media list (for offline display)
     */
    async function getMediaList() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readonly');
            const req = tx.objectStore(MEDIA_STORE).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Mark a media item as downloaded (update isDownloaded in media store)
     */
    async function setMediaDownloaded(url, isDownloaded) {
        const id = idFromUrl(url);
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            const store = tx.objectStore(MEDIA_STORE);
            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const item = getReq.result;
                if (item) {
                    item.isDownloaded = !!isDownloaded;
                    store.put(item);
                }
                resolve();
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    /**
     * Save downloaded blob to downloads store. id = url (or idFromUrl(url))
     */
    async function saveDownload(url, blob, meta) {
        const id = idFromUrl(url);
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DOWNLOADS_STORE, 'readwrite');
            tx.objectStore(DOWNLOADS_STORE).put({
                id,
                url,
                blob,
                type: meta && meta.type ? meta.type : (blob && blob.type ? blob.type : ''),
                title: meta && meta.title ? meta.title : '',
                name: meta && meta.name ? meta.name : '',
                savedAt: Date.now()
            });
            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => {
                if (e.target.error && e.target.error.name === 'QuotaExceededError') {
                    reject(new Error('Storage quota exceeded. Free some space and try again.'));
                } else {
                    reject(e.target.error);
                }
            };
        });
    }

    /**
     * Get blob for a downloaded item (for offline playback)
     */
    async function getDownloadBlob(url) {
        const id = idFromUrl(url);
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DOWNLOADS_STORE, 'readonly');
            const req = tx.objectStore(DOWNLOADS_STORE).get(id);
            req.onsuccess = () => {
                const rec = req.result;
                resolve(rec && rec.blob ? rec.blob : null);
            };
            req.onerror = () => reject(req.error);
        });
    }

    /**
     * Create object URL for offline playback. Caller must revoke when done.
     */
    async function getBlobUrl(url) {
        const blob = await getDownloadBlob(url);
        if (!blob) return null;
        return URL.createObjectURL(blob);
    }

    /**
     * Check if url is in downloads store
     */
    async function hasDownload(url) {
        const id = idFromUrl(url);
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DOWNLOADS_STORE, 'readonly');
            const req = tx.objectStore(DOWNLOADS_STORE).get(id);
            req.onsuccess = () => resolve(!!req.result);
            req.onerror = () => resolve(false);
        });
    }

    /**
     * Remove download and set isDownloaded false in media store
     */
    async function removeDownload(url) {
        const id = idFromUrl(url);
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([DOWNLOADS_STORE, MEDIA_STORE], 'readwrite');
            tx.objectStore(DOWNLOADS_STORE).delete(id);
            const mediaStore = tx.objectStore(MEDIA_STORE);
            const getReq = mediaStore.get(id);
            getReq.onsuccess = () => {
                const item = getReq.result;
                if (item) {
                    item.isDownloaded = false;
                    mediaStore.put(item);
                }
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    /**
     * Get all downloaded items for Downloads page (metadata + id for blob lookup)
     */
    async function getDownloadedList() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(DOWNLOADS_STORE, 'readonly');
            const req = tx.objectStore(DOWNLOADS_STORE).getAll();
            req.onsuccess = () => {
                const rows = req.result || [];
                resolve(rows.map((r) => ({
                    id: r.id,
                    url: r.url,
                    type: r.type || 'other',
                    title: r.title || r.name || 'Untitled',
                    name: r.name,
                    savedAt: r.savedAt
                })));
            };
            req.onerror = () => reject(req.error);
        });
    }

    window.MediaOffline = {
        openDB,
        setMediaList,
        getMediaList,
        setMediaDownloaded,
        saveDownload,
        getDownloadBlob,
        getBlobUrl,
        hasDownload,
        removeDownload,
        getDownloadedList,
        idFromUrl
    };
})();
