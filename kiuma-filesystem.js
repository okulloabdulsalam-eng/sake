/**
 * KIUMA Filesystem — Persistent native file storage bridge
 * Native (Capacitor): writes to Directory.Data via @capacitor/filesystem
 * Web fallback:       writes blobs to IndexedDB via AppStorage
 *
 * Public API mirrors AppStorage so existing call sites can use KiuFS directly.
 * Files are indexed in KiuIDB.downloads so they survive app restarts.
 */
(function () {
    'use strict';

    // ── Platform detection ─────────────────────────────────────────

    function isNative() {
        return !!(
            window.Capacitor &&
            typeof window.Capacitor.isNativePlatform === 'function' &&
            window.Capacitor.isNativePlatform()
        );
    }

    function getFS() {
        return window.Capacitor &&
               window.Capacitor.Plugins &&
               window.Capacitor.Plugins.Filesystem || null;
    }

    // Directory.Data constant string value used by Capacitor
    const DATA_DIR = 'DATA';
    const BASE_FOLDER = 'kiuma';

    // ── Filename helpers ───────────────────────────────────────────

    function urlToFilename(url) {
        return url.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-200);
    }

    function filePath(url) {
        return BASE_FOLDER + '/' + urlToFilename(url);
    }

    // ── Base64 utilities ───────────────────────────────────────────

    function _bufToB64(buffer) {
        let bin = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }

    function _b64ToBytes(b64) {
        const bin   = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }

    // ── Native (Capacitor Filesystem) ─────────────────────────────

    async function _nativeSave(url, blob, meta) {
        const FS = getFS();
        if (!FS) return false;
        try {
            const b64 = _bufToB64(await blob.arrayBuffer());
            await FS.writeFile({ path: filePath(url), data: b64, directory: DATA_DIR, recursive: true });
            if (window.KiuIDB) {
                await window.KiuIDB.putDownload(Object.assign({}, meta, {
                    url:       url,
                    localPath: filePath(url),
                    savedAt:   Date.now()
                }));
            }
            return true;
        } catch (e) {
            console.error('[KiuFS] native write failed:', e);
            return false;
        }
    }

    async function _nativeRead(url) {
        const FS = getFS();
        if (!FS) return null;
        try {
            const res = await FS.readFile({ path: filePath(url), directory: DATA_DIR });
            if (!res || !res.data) return null;
            return new Blob([_b64ToBytes(res.data)]);
        } catch (e) { return null; }
    }

    async function _nativeDelete(url) {
        const FS = getFS();
        if (!FS) return false;
        try {
            await FS.deleteFile({ path: filePath(url), directory: DATA_DIR });
        } catch (e) { /* ignore — file may not exist */ }
        if (window.KiuIDB) await window.KiuIDB.removeDownload(url);
        return true;
    }

    // ── Web fallback (AppStorage / IndexedDB) ──────────────────────

    async function _webSave(url, blob, meta) {
        try {
            if (window.AppStorage) {
                // Reuse AppStorage.saveFile internals by injecting via its open DB
                await window.AppStorage.downloadAndSave(url, meta, null);
            }
        } catch (e) { /* non-fatal */ }
        if (window.KiuIDB) {
            await window.KiuIDB.putDownload(Object.assign({}, meta, {
                url:     url,
                savedAt: Date.now()
            }));
        }
        return true;
    }

    // ── Streaming download helper ──────────────────────────────────

    async function _fetchBlob(url, meta, onProgress) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);

        const cl          = response.headers.get('Content-Length');
        const total       = cl ? parseInt(cl, 10) : (meta.size || 0);
        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        let   blob;

        if (response.body && typeof response.body.getReader === 'function') {
            try {
                const reader = response.body.getReader();
                const chunks = [];
                let loaded   = 0;
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    loaded += value.length;
                    if (onProgress) {
                        onProgress(
                            total > 0 ? Math.min(Math.round((loaded / total) * 100), 99) : -1,
                            loaded, total
                        );
                    }
                }
                blob = new Blob(chunks, { type: contentType });
            } catch (_) { blob = await response.blob(); }
        } else {
            blob = await response.blob();
        }

        return { blob, contentType };
    }

    // ── Public API ─────────────────────────────────────────────────

    async function downloadAndSave(url, meta, onProgress) {
        if (await hasFile(url)) {
            if (onProgress) onProgress(100, 0, 0);
            return true;
        }
        try {
            const { blob, contentType } = await _fetchBlob(url, meta, onProgress);
            if (onProgress) onProgress(100, blob.size, blob.size);

            const fullMeta = Object.assign({}, meta, {
                url:         url,
                contentType: contentType,
                size:        meta.size || blob.size
            });

            return isNative()
                ? _nativeSave(url, blob, fullMeta)
                : _webSave(url, blob, fullMeta);
        } catch (e) {
            console.error('[KiuFS] downloadAndSave error:', e);
            return false;
        }
    }

    async function hasFile(url) {
        if (window.KiuIDB)    return window.KiuIDB.hasDownload(url);
        if (window.AppStorage) return window.AppStorage.hasFile(url);
        return false;
    }

    async function getOfflineUrl(url) {
        if (isNative()) {
            const blob = await _nativeRead(url);
            if (blob) return URL.createObjectURL(blob);
        }
        if (window.AppStorage) return window.AppStorage.getOfflineUrl(url);
        return null;
    }

    async function removeFile(url) {
        if (isNative()) await _nativeDelete(url);
        if (window.AppStorage) await window.AppStorage.removeFile(url);
        if (window.KiuIDB)    await window.KiuIDB.removeDownload(url);
        return true;
    }

    async function getAllDownloads(category) {
        if (window.KiuIDB) return window.KiuIDB.getAllDownloads(category);
        if (window.AppStorage) {
            const all = window.AppStorage.getLocalIndex();
            return category ? all.filter(function (f) { return f.category === category; }) : all;
        }
        return [];
    }

    // ── Init: ensure native folder exists ─────────────────────────

    async function init() {
        if (!isNative()) return;
        const FS = getFS();
        if (!FS) return;
        try {
            await FS.mkdir({ path: BASE_FOLDER, directory: DATA_DIR, recursive: true });
        } catch (_) { /* already exists */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.KiuFS = {
        downloadAndSave: downloadAndSave,
        hasFile:         hasFile,
        getOfflineUrl:   getOfflineUrl,
        removeFile:      removeFile,
        getAllDownloads:  getAllDownloads,
        isNative:        isNative
    };
})();
