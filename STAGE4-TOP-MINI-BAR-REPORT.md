# Stage 4 — Top Mini Bar Integration (SAKE-FINAL)

**Date:** 2026-03-01  
**Goal:** Update the top mini bar on all pages in SAKE-FINAL using SAKE design, with page name shown in the bar and static features preserved.

---

## 1. Changes made

### 1.1 SAKE-style mini bar

- **hero-nav (standard pages):** Left: menu toggle (sidebar). Center: **page title** (new `span.hero-nav-title#heroNavPageTitle`). Right: notifications button + badge, profile avatar (`toggleAccountModal()`).
- **hero-compact-nav (compact pages):** Left: back button. Center: **page title** (same `span#heroNavPageTitle`). Right: actions (e.g. logout, sound, search).
- **Dynamic page name:** On `DOMContentLoaded`, `script.js` fills `#heroNavPageTitle` from:
  - `.hero-page-title` (main hero title), or
  - `.hero-compact-title h1`, or
  - first `h1` in main/page-content, or
  - `document.title` (with " - KIUMA" stripped).

### 1.2 CSS (styles.css)

- **.hero-nav .hero-nav-title:** flex:1, center text, white, 16px, bold, ellipsis for long titles, z-index 3.
- **.page-hero-compact .hero-compact-nav .hero-nav-title:** Same look for compact bar (flex:1, margin, white, 16px, bold, ellipsis, center).

### 1.3 Script (script.js)

- **initHeroNavPageTitle:** Runs on `DOMContentLoaded`; sets `#heroNavPageTitle` from the sources above. No change to Stage 2 shared files (firebase-config.js, server.js, functions/*, etc.).

---

## 2. Page-by-page confirmation

| Page | Mini bar type | Title span added | Notifications + profile | Menu toggle / back | Notes |
|------|----------------|------------------|--------------------------|---------------------|-------|
| index.html | hero-nav | ✓ | ✓ | ✓ menu | Title from "Assalaam Alaikum" |
| about.html | hero-nav | ✓ | ✓ | ✓ menu | |
| activities.html | hero-nav | ✓ | ✓ | ✓ menu | |
| admin.html | hero-compact-nav | ✓ | — | back + logout | Title from "Admin Panel" |
| ask-question.html | hero-nav | ✓ | ✓ | ✓ menu | |
| contact.html | hero-nav | ✓ | ✓ | ✓ menu | |
| counselling.html | hero-nav | ✓ | ✓ | ✓ menu | |
| dhikr.html | hero-compact-nav | ✓ | — | back + sound | Title from "Dhikr" |
| events.html | hero-nav | ✓ | ✓ | ✓ menu | |
| important-lessons.html | hero-nav | ✓ | ✓ | ✓ menu | |
| join-programs.html | hero-nav | ✓ | ✓ | ✓ menu | |
| join-us.html | hero-nav | ✓ | ✓ | ✓ menu | |
| leadership.html | hero-nav | ✓ | ✓ | ✓ menu | |
| library.html | hero-nav | ✓ | ✓ | ✓ menu | |
| media.html | hero-nav | ✓ | ✓ | ✓ menu | |
| media-settings.html | hero-nav | ✓ | ✓ | ✓ menu | |
| mosques.html | hero-nav | ✓ | ✓ | ✓ menu | |
| names-of-allah.html | hero-compact-nav | ✓ | — | back + search | Title from "99 Names of Allah" |
| notifications.html | hero-nav | ✓ | ✓ | ✓ menu | |
| pay.html | hero-nav | ✓ | ✓ | ✓ menu | |
| programs.html | hero-nav | ✓ | ✓ | ✓ menu | |
| quran.html | hero-nav | ✓ | ✓ | ✓ menu | |
| quran-reader.html | hero-nav | ✓ | ✓ | ✓ menu | |
| search.html | hero-nav | ✓ | ✓ | ✓ menu | |
| subscription-form.html | hero-nav | ✓ | ✓ | ✓ menu | |
| values.html | hero-nav | ✓ | ✓ | ✓ menu | |
| zakat-form.html | hero-nav | ✓ | ✓ | ✓ menu | |

**Skipped (no top mini bar in layout):** offline.html, test-account-storage.html, whatsapp-join-modal.html.

---

## 3. Layout and features

- **Sidebar:** Unchanged (`nav.nav-menu`).
- **Container:** Unchanged (`div.container`).
- **Main content:** Unchanged (`main.main-content`).
- **Bottom nav:** Unchanged where present (`nav.bottom-nav`).
- **Static features:** Notifications button + badge, profile avatar + `toggleAccountModal()`, menu toggle (or back + actions on compact pages) kept on all updated pages.
- **Scripts:** `script.js` and `js/router-bridge.js` already loaded where needed; no new shared files modified (Stage 2 files untouched).

---

## 4. Conflicts and warnings

| Item | Notes |
|------|--------|
| **Compact pages** | admin, dhikr, names-of-allah use hero-compact-nav (back button, no notifications in bar). Title still shown in bar; notifications/profile remain in sidebar or elsewhere. |
| **Pages without hero** | offline.html, test-account-storage.html, whatsapp-join-modal.html have no hero/mini bar; no change. |
| **script.js load order** | initHeroNavPageTitle runs on DOMContentLoaded; pages that load script.js get the dynamic title. Compact pages that load script.js will fill the title from `.hero-compact-title h1`. |

---

## 5. Confirmation checklist

- [x] Existing top mini bar replaced with SAKE-style bar (title in bar, same controls).
- [x] Page name shown in mini bar via `#heroNavPageTitle`, filled from page title/h1.
- [x] Notifications button + badge, profile avatar + toggleAccountModal(), menu toggle (or back + actions) preserved.
- [x] Sidebar, container, main, bottom nav unchanged.
- [x] CSS for mini bar in styles.css; script in script.js; no Stage 2 shared files modified.
- [x] All pages with hero-nav or hero-compact-nav updated (27 pages); 3 without mini bar skipped.

---

**Stage 4 top mini bar integration complete.** Page name is shown in the bar and SAKE static features are preserved across SAKE-FINAL.
