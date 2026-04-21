# Stage 2: Hybrid Base (SAKE Core + SAKE-MAIN Shell) – Report

**Date:** 2026-03-01  
**Scope:** SAKE-MAIN kept as visual/navigation shell; backend and core logic replaced with SAKE versions.

---

## 1. Conflict report

### 1.1 Resolved

| Item | Resolution |
|------|------------|
| **Firebase project in SW** | SAKE’s `sw.js` and `firebase-messaging-sw.js` used **kiuma-2026**; client uses **kiuma-mob-app**. Replaced SW with hybrid `sw.js` and `firebase-messaging-sw.js` that use **kiuma-mob-app** so client and SW use one project. |
| **SAKE server.js duplicate block** | SAKE’s `server.js` had an orphan block (duplicate `if (err)` and `});`). SAKE-MAIN’s `server.js` was already correct; it was **not** overwritten. No change in SAKE-MAIN. |
| **Service worker registration** | Only **one** SW file is registered: `./sw.js`. `firebase-messaging-sw.js` is **not** registered; FCM is inlined in `sw.js`. No second SW scope. |
| **Multiple inits in client** | `firebase-config.js` is the single place that calls `firebase.initializeApp()` in the client. `firebase-auth.js` only calls it when `!firebase.apps.length` and uses `window.firebaseConfig`, so no double init. |

### 1.2 Known / Left as-is

| Item | Notes |
|------|--------|
| **test-account-storage.html** | Contains its own `firebase.initializeApp(config)` in test flows. Treated as a special/test page; not modified. |
| **public/payment-example.html** | Contains in-page `firebase.initializeApp(firebaseConfig)` for the example. Isolated page; not modified. |
| **Server vs Functions** | `server.js` (Node) and `functions/index.js` / `functions/barakahpush-functions.js` (Firebase Functions) each call `admin.initializeApp()`. These are **different runtimes** (Express server vs Cloud Functions); both are valid single entry points for their environment. |
| **register-service-worker.js** | Registers `./sw.js` only when no existing registration; script.js also registers `./sw.js`. Same scope and file; registrations are idempotent. |

### 1.3 Removed / Not used

- **Duplicate SW:** No HTML or script registers `firebase-messaging-sw.js`. Only `sw.js` is used.
- **SAKE’s buggy server block:** Not copied; SAKE-MAIN’s correct `server.js` was kept.

---

## 2. File replacement summary

### 2.1 Replaced (SAKE → SAKE-MAIN)

| File / folder | Action |
|---------------|--------|
| `firebase-config.js` | Copied from SAKE (unchanged; same kiuma-mob-app). |
| `firebase-auth.js` | Copied from SAKE. |
| `firebase-messaging-sw.js` | Replaced with SAKE logic; Firebase config set to **kiuma-mob-app** (aligned with client). |
| `sw.js` | Replaced with SAKE behaviour; inlined FCM config set to **kiuma-mob-app**; SAKE-MAIN’s `quran.html` and Quran cache behaviour kept (STATIC_ASSETS, keepCaches, alquran.cloud fetch). |
| `services/*` | All 7 files copied from SAKE: `uploadService.js`, `supabaseClient.js`, `supabaseAuth.js`, `searchService.js`, `prayerTimesService.js`, `libraryService.js`, `githubStorageService.js`. |
| `models/LibraryItem.js` | Copied from SAKE. |
| `api/pesapal.js` | Copied from SAKE. |
| `functions/index.js` | Copied from SAKE. |
| `functions/barakahpush-functions.js` | Copied from SAKE. |
| `supabase-config.js` | Copied from SAKE. |
| `supabase-storage.js` | Copied from SAKE. |
| `api-config.js` | Copied from SAKE. |
| `offline-db.js` | Copied from SAKE. |
| `network-sync.js` | Copied from SAKE. |
| `update-navigation.js` | Copied from SAKE. |
| `js/router-bridge.js` | Copied from SAKE. |
| `offline-db-example.js` | Copied from SAKE if present. |
| `assets/css/player.css` | Created from SAKE. |
| `assets/js/player.js` | Created from SAKE. |
| `cloudflare/` | Copied from SAKE (worker and config files only; no node_modules). |
| `railway-server/` | Copied from SAKE: `index.js`, `package.json`, `README.md`. |
| `payments/` | Copied from SAKE: `index.js`, `package.json`, `.gitignore`, `.eslintrc.js`. |

### 2.2 Not replaced (kept SAKE-MAIN)

| File / folder | Reason |
|---------------|--------|
| `server.js` | SAKE-MAIN version is correct; SAKE version had a duplicate/orphan block. |
| All HTML | Per instruction: “Do not modify HTML page structure yet.” |
| `styles.css`, `css/`, `fonts/` | Shell (SAKE-MAIN) kept. |
| `script.js` | Shell behaviour kept; only backend/core files were replaced. |

### 2.3 Single entry points

- **Client Firebase:** `firebase-config.js` (one `firebase.initializeApp()` in page context).  
- **Service worker:** `sw.js` only (one registration, one scope).  
- **Node server:** `server.js` (one Express app).  
- **Firebase Functions:** `functions/index.js` and `functions/barakahpush-functions.js` (each used as entry in their own runtime).

---

## 3. Firebase initialization validation

### 3.1 Client (browser)

| Location | Role | Single init? |
|----------|------|----------------|
| `firebase-config.js` | Sets `firebaseConfig`, calls `firebase.initializeApp(firebaseConfig)` when `firebase` exists and `!firebase.apps.length`. Sets `window.firebaseAuth`, `window.firebaseDb`, `window.firebaseConfig`. | Yes – this is the only unconditional client init. |
| `firebase-auth.js` | Calls `firebase.initializeApp(window.firebaseConfig)` only when `!firebase.apps || firebase.apps.length === 0`. | Yes – no second init if config already ran. |

**Result:** Only **one** effective `firebase.initializeApp()` in the client (from `firebase-config.js`). Load order in HTML: Firebase SDK scripts → `firebase-config.js` → `script.js` (and optionally `update-navigation.js` / `firebase-auth.js`). No duplicate client init in normal pages.

### 3.2 Service worker

| Location | Role | Single init? |
|----------|------|----------------|
| `sw.js` | Inlined FCM block: `self.firebase.initializeApp(firebaseConfig)` with **kiuma-mob-app** config. | Yes – only SW that runs. |
| `firebase-messaging-sw.js` | Contains `firebase.initializeApp(firebaseConfig)` but is **not** registered. | N/A – not used. |

**Result:** Only **one** service worker is registered (`./sw.js`). Only one Firebase init in the worker context.

### 3.3 Node / Firebase backend

| Location | Role |
|----------|------|
| `server.js` | `admin.initializeApp()` (once per process) via env credentials. |
| `functions/index.js` | `admin.initializeApp()` for Cloud Functions. |
| `functions/barakahpush-functions.js` | `admin.initializeApp()` when `!admin.apps.length`. |

**Result:** One init per runtime (Express server vs Functions). No conflict.

### 3.4 Project alignment

- **Client:** kiuma-mob-app (`firebase-config.js`).  
- **SW:** kiuma-mob-app (inlined in `sw.js`).  
- **firebase-messaging-sw.js:** kiuma-mob-app (file not registered).  
- **Server/Functions:** Use env/service account; can target same or different project.

---

## 4. Service worker validation

### 4.1 Registration

| Source | Registers | Scope |
|--------|-----------|--------|
| `script.js` | `navigator.serviceWorker.register('./sw.js')` on load. | Same origin, root scope. |
| `js/register-service-worker.js` | `navigator.serviceWorker.register('./sw.js')` only if no existing registration for `./sw.js`. | Same. |

**Result:** Only **one** SW file (`./sw.js`) and one scope. No registration of `firebase-messaging-sw.js` anywhere.

### 4.2 SW behaviour (sw.js)

- **Cache version:** `2026-03-01-hybrid-v1`; cache name `kiuma-cache-*`.
- **Firebase in SW:** Single project **kiuma-mob-app**; FCM inlined; `self.firebase.initializeApp` once in try block.
- **Static assets:** Includes `quran.html`, `quran-reader.html`, and SAKE-MAIN shell pages.
- **Caches kept on activate:** `CACHE_NAME`, `CACHE_NAME + '-quran'`, `CACHE_NAME + '-github'`, `kiuma-offline-media`, `kiuma-offline-library`.
- **Fetch:** HTML network-first; assets stale-while-revalidate; Quran API and GitHub raw network-first with cache fallback; admin.html special handling; no caching of Firebase/Firestore.
- **Messages:** `SKIP_WAITING`, `CACHE_URLS`, `GET_VERSION` handled.

### 4.3 No duplicate SW

- Only `sw.js` is registered.
- `firebase-messaging-sw.js` is present for reference/backup only and is not registered.

---

## 5. Summary

- **Shell:** SAKE-MAIN layout (e.g. `div.container`), sidebar (`nav.nav-menu`), bottom nav (`nav.bottom-nav`), and page links unchanged.  
- **Core/backend:** Replaced with SAKE versions for firebase-config, firebase-auth, firebase-messaging-sw, sw, services, models, api (pesapal), functions, cloudflare, railway-server, payments, Supabase-related files, router-bridge, offline DB, network-sync, update-navigation, and media player assets.  
- **Conflicts:** Addressed by aligning SW and firebase-messaging-sw to kiuma-mob-app and not overwriting SAKE-MAIN’s correct server.js.  
- **Firebase:** One client init (firebase-config.js); one SW init (inside sw.js); one server entry (server.js); Functions use their own admin init.  
- **Service worker:** Single registration for `./sw.js`; no duplicate SW.  
- **HTML:** Unchanged; no new duplicate script tags introduced.
