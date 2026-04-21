# Stage 3: Import Single Page — Media — Report

**Date:** 2026-03-01  
**Scope:** Import Media page from SAKE into SAKE-MAIN: SAKE-MAIN layout shell + SAKE media logic (Firebase, Supabase, R2, offline, media player).

---

## 1. Integration steps performed

1. **HTML source**  
   Core content taken from **SAKE** root-level `media.html` (main content only).

2. **Layout cleanup**  
   - Sidebar (`nav.nav-menu`), top mini bar (hero-admin / notifications), and bottom nav are **not** duplicated inside the media content; they remain part of the **SAKE-MAIN** shell (index, script.js, etc.).  
   - Media page uses SAKE-MAIN’s single `div.container` → `page-hero` + `main.main-content`; no extra nav inside the media fragment.

3. **Wrapper**  
   Media content is wrapped inside the SAKE-MAIN layout wrapper (`div.container`), with SAKE-MAIN’s `page-hero` (hero-nav, logo, title “Media Gallery”) and `main.main-content` containing the media grid, tabs, search, and viewer modal.

4. **Navigation links**  
   - Hero nav and any in-page links point to SAKE-MAIN routes (e.g. `index.html`, `library.html`, `media.html`, `admin.html` where applicable).  
   - Admin link in hero matches SAKE-MAIN index (present or removed per SAKE-MAIN convention).  
   - `js/router-bridge.js` included so navigation works in both MPA and router contexts.

5. **SAKE logic preserved**  
   - **Firebase / Supabase:** Unchanged; use SAKE-MAIN’s single client init and config from Stage 2.  
   - **Media player:** SAKE behaviour preserved: R2 (kiuma4 worker URLs), GitHub fallback, Firestore playlists (`config/playlists`), offline (KiuFS then AppStorage/index), in-app viewer.  
   - **CSS:** SAKE-MAIN base (`styles.css`) + SAKE overrides (`assets/css/player.css`).

6. **R2 and offline**  
   - R2: `getStorageAccounts()`, `getR2Config()`, `getR2AccountsForType(type)` (signature kept for compatibility; returns all accounts with `workerUrl`).  
   - Offline: `getOfflineIndex()` (KiuFS then AppStorage index), `saveFileOffline`, `removeFileOffline`, `isFileSavedOffline`, `inAppDownload` from SAKE.  
   - `#mediaCacheBanner` added where SAKE uses it.

7. **Layout and viewer**  
   - `renderQalboxLayout` is **async**: builds `savedSet` from `await getOfflineIndex()` and passes it to `renderCategoryRow(..., savedSet)`.  
   - `renderCategoryRow(title, icon, files, isOffline, savedSet)` uses `saved = savedSet ? savedSet.has(media.url) : (media.isDownloaded === true)` so download state matches SAKE.  
   - `openMediaViewer(url, type, title)` — **3-arg** only; blob resolution inside viewer: KiuFS → MediaOffline → AppStorage; offline check after resolving blob so “no connection” only when not saved.

---

## 2. Files touched

| File | Changes |
|------|--------|
| `SAKE-MAIN/media.html` | Single Media page: SAKE-MAIN shell (container, hero, main), SAKE media body (grid, tabs, search, modal). Scripts: R2/offline from SAKE, `renderQalboxLayout` async + `savedSet`, `renderCategoryRow` with `savedSet`, `openMediaViewer` 3-arg + blob resolution; `player.css`, `router-bridge.js`, `#mediaCacheBanner`. |

---

## 3. Conflicts and resolutions

| Conflict | Resolution |
|----------|------------|
| **R2 / getR2AccountsForType** | SAKE’s `getR2AccountsForType()` takes no args and returns all accounts. SAKE-MAIN’s `fetchFromR2` called `getR2AccountsForType(t)` with type. **Resolution:** `getR2AccountsForType(type)` kept with optional `type` argument; implementation returns `getStorageAccounts().filter(a => a.workerUrl)` so all types use the same account list (SAKE behaviour). |
| **renderCategoryRow / savedSet** | SAKE uses `renderCategoryRow(..., savedSet)` and `savedSet.has(media.url)`. SAKE-MAIN used `media.isDownloaded`. **Resolution:** `renderCategoryRow` now has 5th param `savedSet`; `saved = savedSet ? savedSet.has(media.url) : (media.isDownloaded === true)`. `renderQalboxLayout` is async and passes `savedSet` from `getOfflineIndex()`. |
| **openMediaViewer signature and blob** | SAKE: 3-arg, KiuFS blob only. SAKE-MAIN: 4-arg, MediaOffline/AppStorage blob. **Resolution:** Unified to 3-arg `openMediaViewer(url, type, title)`. Blob resolution order: KiuFS → MediaOffline → AppStorage; revoke blob in `closeMediaViewer`. All call sites (hero, category rows, playlist expanded, downloads tab) use 3 args. |
| **Hero / playlist openMediaViewer** | Hero and playlist expanded previously passed 4th `isDownloaded`. **Resolution:** All calls updated to 3-arg; viewer determines offline from blob resolution. |
| **Duplicate / dead code** | After merging R2/offline block, leftover SAKE-MAIN code had `_noopMediaOffline` and duplicate `inAppDownload` / `removeFileOffline`. **Resolution:** Removed; single SAKE offline helpers and one `inAppDownload` remain. |

---

## 4. Known / optional follow-ups

| Item | Notes |
|------|--------|
| **fetchFromGitHub `key`** | SAKE’s GitHub fetch can set `key: 'github/${folder}/${f.name}'` for dedup/layout. SAKE-MAIN media may omit `key`; add if layout or dedup logic expects it. |
| **OfflineCache** | SAKE uses `window.OfflineCache.setMediaList` / `getMediaList` for cached list when offline. SAKE-MAIN may not load `offline-cache.js`. Guard with `if (window.OfflineCache)` if re-adding, or add minimal cache. |
| **getOfflineIndex in downloads tab** | Downloads tab uses `getOfflineIndex()` (sync call in some paths). `getOfflineIndex` is async; call sites use `await` where needed (e.g. in `loadMediaFromStorage('downloads')`). |

---

## 5. Validation checklist

- [x] Media content lives inside SAKE-MAIN `div.container` (no extra sidebar/top bar/bottom nav in content).
- [x] Nav links point to SAKE-MAIN pages; `router-bridge.js` loaded.
- [x] CSS: SAKE-MAIN base + SAKE overrides (`player.css`).
- [x] Firebase/Supabase: single client init (Stage 2); no new inits in media.html.
- [x] R2: kiuma4 worker URLs, `getStorageAccounts` / `getR2Config` / `getR2AccountsForType(type)`.
- [x] Offline: `getOfflineIndex` (KiuFS then AppStorage), save/remove/isSaved, `inAppDownload`.
- [x] `renderQalboxLayout` async with `savedSet`; `renderCategoryRow` uses `savedSet`.
- [x] `openMediaViewer(url, type, title)` with KiuFS → MediaOffline → AppStorage blob resolution.

---

**Stage 3 (Media import) complete.**  
For Stage 2 summary (Firebase, SW, file list), see `STAGE2-HYBRID-REPORT.md`.
