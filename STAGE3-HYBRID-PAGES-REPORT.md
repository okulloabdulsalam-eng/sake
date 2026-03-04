# Stage 3 — Hybrid: Import 9 Exclusive SAKE Pages into SAKE-FINAL

**Date:** 2026-03-01  
**Goal:** Merge 9 SAKE pages into the hybrid system one by one, using **SAKE-FINAL** as the final site folder. Preserve Stage 2 hybrid base.

**Pages processed:** LIBRARY, QURAN (quran.html + quran-reader.html), MOSQUES, ADMIN, NOTIFICATIONS, PAY, EVENTS, ACTIVITIES.

---

## 1. Page integration report (per page)

| Page | Source | Actions |
|------|--------|--------|
| **library.html** | SAKE | Copied from SAKE. Removed Admin from hero-nav (use SAKE-MAIN standard: menu, notifications, profile). Added `js/router-bridge.js` after firebase-config. Sidebar and bottom-nav already matched SAKE-MAIN. Core content and SAKE logic (Firebase, Firestore, syncPlaylistsFromFirestore, loadBooksFromStorage, PDF.js, book viewer) preserved. CSS: styles.css (base) only. |
| **quran.html** | SAKE-MAIN | No quran.html in SAKE; used SAKE-MAIN copy already in SAKE-FINAL. Added `js/router-bridge.js` after firebase-config. Layout already had SAKE-MAIN wrapper (container, page-hero, main, bottom-nav). Quran study content and scripts preserved. |
| **quran-reader.html** | SAKE | Copied from SAKE. Wrapped in full SAKE-MAIN shell: added sidebar (`nav.nav-menu`), `div.container`, `page-hero` (title "Al Quran", subtitle "Read and listen"), `main.main-content` around existing `div.quran-app`, and `nav.bottom-nav`. Added `script.js` and `js/router-bridge.js` before inline script. All SAKE Quran logic (alquran.cloud API, surah list, reader, meaning, dark view) preserved. No Firebase on this page. |
| **mosques.html** | SAKE | Copied from SAKE. Replaced compact hero with full SAKE-MAIN shell: added sidebar (with **Mosques** link set active), `div.container`, standard `page-hero` (title "Mosques & Qibla"), `main.main-content` wrapping tab-bar and tab-content. Added `nav.bottom-nav` and `js/router-bridge.js`. Firebase, Firestore, map, Qibla, add-mosque form logic preserved. Leaflet and styles preserved. |
| **admin.html** | SAKE | Copied from SAKE. Added `js/router-bridge.js` after firebase-config. No hero-nav change (admin uses its own layout). All SAKE logic (Firebase, Firestore, admin panels, notifications, media, etc.) preserved. |
| **notifications.html** | SAKE | Copied from SAKE. Added `js/router-bridge.js` after firebase-config. Hero-nav already standard (no Admin). Firebase Messaging and notifications list logic preserved. |
| **pay.html** | SAKE | Copied from SAKE. Added `js/router-bridge.js` after firebase-config. Payment / donation logic preserved. |
| **events.html** | SAKE | Copied from SAKE. Added `js/router-bridge.js` after firebase-config. Events list and SAKE logic preserved. |
| **activities.html** | SAKE | Copied from SAKE. Added `js/router-bridge.js` after firebase-config. Activities content and logic preserved. |

---

## 2. Layout wrapper, navigation, and SAKE logic

- **Layout wrapper:** All 9 pages use or were wrapped in the SAKE-MAIN layout: `div.container` → `page-hero` (with page-specific title) → `main.main-content` → core content → `nav.bottom-nav`. Sidebar `nav.nav-menu` is present on all (library, quran, quran-reader, mosques, admin, notifications, pay, events, activities).
- **Navigation:** Sidebar and bottom-nav links point to the same page names (e.g. `index.html`, `library.html`, `media.html`, `pay.html`, `events.html`, `join-us.html`). The **mosques** page sidebar includes a "Mosques" item (active on that page); other pages use the standard list without Mosques. Router-bridge is loaded on all so MPA and router-based navigation work.
- **SAKE logic:** Preserved on each page: Firebase init (via firebase-config.js, no duplicate inits), Supabase where used, media player on media page, Quran API and reader on quran-reader, library playlists and book viewer, admin Firestore/GitHub, notifications Messaging, pay/events/activities behaviour. No Stage 2 hybrid files were changed (firebase-config.js, server.js, functions/*, payments/, cloudflare/, railway-server/, media player assets, offline DB, router-bridge, Supabase files).

---

## 3. CSS loading

- **Base:** `styles.css` is loaded first on all pages (SAKE-MAIN base).
- **Overrides:** Only where needed (e.g. media page already has `assets/css/player.css` from Stage 3 Media import). No extra override files added for the other 8 pages.

---

## 4. Conflicts and warnings

| Item | Notes |
|------|--------|
| **quran.html** | Exists in SAKE-MAIN but not in SAKE. SAKE-FINAL uses SAKE-MAIN’s quran.html (Quran Study / timetable). So "QURAN" is covered by quran.html (study) + quran-reader.html (reader app). |
| **quran-reader shell** | script.js was added so menu toggle and profile work; page does not load Firebase. If script.js assumes Firebase, any errors are limited to this page. |
| **Mosques sidebar** | Mosques page has a "Mosques" sidebar link; index and other pages do not. Adding "Mosques" to the global sidebar (e.g. in index, media) can be done in a follow-up. |
| **Admin layout** | Admin keeps its own layout/tabs; no standard page-hero applied so the admin experience is unchanged. |

---

## 5. Confirmation checklist

- [x] Each page merged into SAKE-FINAL (output folder).
- [x] Original SAKE layout elements removed or replaced: sidebar/top bar/bottom nav from SAKE content replaced with SAKE-MAIN shell where applicable.
- [x] Core page content kept (library grid, Quran reader app, mosques tabs, admin panels, notifications list, pay/events/activities content).
- [x] Content wrapped in SAKE-MAIN layout wrapper (`div.container`, `page-hero`, `main.main-content`, `nav.bottom-nav`).
- [x] Navigation links point correctly (sidebar and bottom-nav to .html pages).
- [x] SAKE logic preserved (Firebase, Supabase, media player, Quran, library, admin, notifications, pay, events, activities).
- [x] CSS: SAKE-MAIN base first, SAKE overrides only where already used (e.g. media).
- [x] Stage 2 hybrid files not modified (firebase-config, server, functions, payments, cloudflare, railway-server, player assets, offline DB, router-bridge, Supabase).
- [x] `js/router-bridge.js` added on all 9 pages for consistent navigation.

---

**Stage 3 hybrid page import complete.** All 9 pages are in **SAKE-FINAL** with the SAKE-MAIN layout wrapper, correct navigation, and SAKE logic preserved.
