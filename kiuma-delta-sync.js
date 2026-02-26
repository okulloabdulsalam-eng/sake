/**
 * KIUMA Delta Sync Engine
 * - App open  → load local IDB data instantly (no network wait)
 * - If online → fetch only records changed since last sync (delta)
 * - Update IDB silently, never block UI
 * - Version check via version.json → silent SW cache refresh
 */
(function () {
    'use strict';

    // ── Config ─────────────────────────────────────────────────────

    const BASE_URL = (function () {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1' || !h) {
            return 'https://okulloabdulsalam-eng.github.io/sake';
        }
        return window.location.origin +
               window.location.pathname.replace(/\/[^/]*$/, '');
    })();

    const SYNC_INTERVAL_MS = 5 * 60 * 1000;   // 5 min periodic
    const MIN_SYNC_GAP_MS  = 60 * 1000;        // ignore triggers closer than 1 min

    // Supabase table → IDB content-type mapping
    const SUPABASE_TABLES = [
        { table: 'notifications', type: 'notifications', idField: 'id' },
        { table: 'books',         type: 'books',         idField: 'id' },
        { table: 'media',         type: 'media',         idField: 'id' },
        { table: 'events',        type: 'events',        idField: 'id' }
    ];

    // ── State ──────────────────────────────────────────────────────

    let _isSyncing = false;
    let _isOnline  = navigator.onLine;
    let _lastSync  = 0;
    let _timer     = null;

    // ── Helpers ────────────────────────────────────────────────────

    function idbReady()      { return !!window.KiuIDB; }
    function supabaseReady() {
        return typeof window.getSupabaseClient === 'function' && !!window.getSupabaseClient();
    }

    function getSupabase() {
        if (typeof window.getSupabaseClient === 'function') return window.getSupabaseClient();
        return null;
    }

    function now() { return Date.now(); }

    // ── Version / SW update check ──────────────────────────────────

    async function checkVersion() {
        try {
            const res = await fetch(BASE_URL + '/version.json', { cache: 'no-store' });
            if (!res.ok) return;
            const data  = await res.json();
            const remote = String(data.version || data.build || '');
            const local  = localStorage.getItem('kiuma_cached_version') || '';
            if (remote && remote !== local) {
                localStorage.setItem('kiuma_cached_version', remote);
                // Ask SW to silently refresh its caches
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type:    'CHECK_UPDATE',
                        version: remote
                    });
                }
            }
        } catch (_) { /* offline */ }
    }

    // ── Supabase delta sync ────────────────────────────────────────

    async function syncTable(client, entry) {
        if (!idbReady()) return { skipped: true };
        try {
            const since = await window.KiuIDB.getLastSync(entry.type);

            let query = client.from(entry.table).select('*').order('updated_at', { ascending: false });

            // Only fetch records updated after last sync (delta)
            if (since) {
                const iso = new Date(since).toISOString();
                query = query.gt('updated_at', iso);
            }

            const { data, error } = await query;
            if (error) return { success: false, error: error.message };

            const records = data || [];
            if (records.length > 0) {
                await window.KiuIDB.putContentBatch(entry.type, records, entry.idField);
            }

            await window.KiuIDB.setLastSync(entry.type, now());
            return { success: true, count: records.length, delta: !!since };

        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    // ── Drain offline queue ────────────────────────────────────────

    async function drainQueue() {
        if (!idbReady()) return;
        const queued = await window.KiuIDB.getAllQueued();
        if (queued.length === 0) return;

        const client = getSupabase();
        for (const item of queued) {
            try {
                if (item.action === 'insert' && client) {
                    await client.from(item.payload.table).insert(item.payload.data);
                    await window.KiuIDB.dequeue(item.qid);
                } else if (item.action === 'update' && client) {
                    await client.from(item.payload.table)
                        .update(item.payload.data)
                        .eq('id', item.payload.id);
                    await window.KiuIDB.dequeue(item.qid);
                }
            } catch (_) {
                // Leave in queue, retry next sync
            }
        }
    }

    // ── Main sync ──────────────────────────────────────────────────

    async function performDeltaSync(force) {
        if (_isSyncing) return;
        if (!_isOnline)  return;
        if (!force && (now() - _lastSync) < MIN_SYNC_GAP_MS) return;

        _isSyncing = true;
        _lastSync  = now();

        try {
            // Version check first (non-blocking)
            checkVersion();

            // Drain any queued offline mutations
            await drainQueue();

            // Sync all Supabase tables in parallel
            if (supabaseReady()) {
                const client = getSupabase();
                await Promise.allSettled(
                    SUPABASE_TABLES.map(function (entry) {
                        return syncTable(client, entry);
                    })
                );
            }
        } catch (_) {
            // Silent — never surface errors to UI
        } finally {
            _isSyncing = false;
        }
    }

    // ── Load-local-first helper ────────────────────────────────────
    // Pages call this to get cached data immediately, then sync in background

    async function getLocal(contentType) {
        if (!idbReady()) return [];
        return window.KiuIDB.getAllContent(contentType);
    }

    async function getLocalOne(contentType, id) {
        if (!idbReady()) return null;
        return window.KiuIDB.getContent(contentType, id);
    }

    // ── Network listeners ──────────────────────────────────────────

    window.addEventListener('online', function () {
        _isOnline = true;
        setTimeout(function () { performDeltaSync(false); }, 1000);
    });

    window.addEventListener('offline', function () { _isOnline = false; });

    // ── Init ───────────────────────────────────────────────────────

    function init() {
        _isOnline = navigator.onLine;

        // Initial sync shortly after page load (non-blocking)
        if (_isOnline) {
            setTimeout(function () { performDeltaSync(true); }, 2500);
        }

        // Periodic sync
        _timer = setInterval(function () {
            if (_isOnline && !_isSyncing) performDeltaSync(false);
        }, SYNC_INTERVAL_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ── Public API ─────────────────────────────────────────────────

    window.KiuSync = {
        sync:         function (force) { return performDeltaSync(!!force); },
        getLocal:     getLocal,
        getLocalOne:  getLocalOne,
        checkVersion: checkVersion,
        isOnline:     function () { return _isOnline; },
        isSyncing:    function () { return _isSyncing; }
    };
})();
