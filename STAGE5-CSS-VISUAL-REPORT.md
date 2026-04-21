# Stage 5 — CSS & Visual Final Validation (SAKE-FINAL)

**Date:** 2026-03-01  
**Goal:** Ensure all pages in SAKE-FINAL maintain the intended design while preserving hybrid logic.

---

## 1. Global validation summary

| Check | Result | Notes |
|-------|--------|--------|
| **Base CSS** | Pass | All main pages load `styles.css` first. |
| **SAKE overrides** | Pass | Media loads `assets/css/player.css` after base; search loads `css/search.css`. |
| **Top mini bar (Stage 4)** | Pass | `.hero-nav-title` and compact nav title styled in `styles.css`; script fills title. |
| **Sidebar & bottom nav** | Pass | `.nav-link.active`, `.nav-item.active`, hover states and colors in `styles.css`. |
| **Responsive** | Pass | Breakpoints at 360px, 428px; container and bottom nav remain functional. |
| **Stage 2 logic** | Pass | No JS/Firebase/Supabase/server/offline/router-bridge/payments/Cloudflare/Railway/functions changed. |

**Optional fix applied:** Bottom nav padding updated to include `env(safe-area-inset-bottom)` for notched devices.

---

## 2. CSS load order (by page type)

- **Standard pages:** `styles.css` → (page overrides if any) → Font Awesome (CDN + `fonts/fontawesome.min.css`). **Correct.**
- **media.html:** `styles.css` → `assets/css/player.css` → FA. **Correct.**
- **search.html:** `styles.css` → `css/search.css` → FA. **Correct.**
- **mosques.html:** `styles.css` → FA → Leaflet CSS. **Correct.**
- **quran-reader.html:** `styles.css` → FA (inline app styles in page). **Correct.**
- **payment/callback.html, payment/cancel.html:** `../styles.css` → FA. **Correct.**
- **offline.html:** `styles.css` in head; Font Awesome loaded in body (non-standard but works). **Warning:** Move FA to `<head>` for consistency.
- **media-storage/index.html:** Does not load `styles.css` (standalone app). **Note:** Intentional or add `../styles.css` if it should match main site.

---

## 3. Page-by-page design check

### 3.1 Main site pages (with hero + mini bar)

| Page | Design fidelity | Notes |
|------|-----------------|--------|
| index.html | Pass | Base first, splash + hero, mini bar, sidebar, bottom nav. Responsive. |
| about.html | Pass | Base first, hero, mini bar title, sidebar active on About. |
| activities.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| events.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| programs.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| values.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| leadership.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| contact.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| ask-question.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| join-programs.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| join-us.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| library.html | Pass | Base first, FA, PDF.js; hero, mini bar, lib-* sections; sidebar, bottom nav. |
| media.html | Pass | Base + player.css, hero, mini bar, media-* sections, viewer modal; sidebar, bottom nav. |
| media-settings.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| notifications.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| pay.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| quran.html | Pass | Base first, hero, mini bar, quran-container; sidebar, bottom nav. |
| quran-reader.html | Pass | Base first, hero, mini bar, quran-app inline styles; sidebar, bottom nav. |
| mosques.html | Pass | Base + Leaflet, hero, mini bar, tab-bar, map; sidebar, bottom nav. |
| search.html | Pass | Base + search.css, hero, mini bar, sidebar, bottom nav. |
| counselling.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| important-lessons.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| subscription-form.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |
| zakat-form.html | Pass | Base first, hero, mini bar, sidebar, bottom nav. |

### 3.2 Compact hero pages (admin, dhikr, names-of-allah)

| Page | Design fidelity | Notes |
|------|-----------------|--------|
| admin.html | Pass | Base first, hero-compact, mini bar title in compact nav, sidebar, bottom nav. |
| dhikr.html | Pass | Base first, hero-compact, mini bar title, dhikr-selector/cards. |
| names-of-allah.html | Pass | Base first, hero-compact, mini bar title, filter-tabs, name cards. |

### 3.3 Other pages

| Page | Design fidelity | Notes |
|------|-----------------|--------|
| offline.html | Pass (minor) | Base first; no sidebar/bottom nav by design. FA in body → move to head optional. |
| test-account-storage.html | Pass | Uses base; test UI. |
| whatsapp-join-modal.html | Pass | Modal-focused; uses base if loaded in context. |
| payment/callback.html | Pass | ../styles.css first; payment flow layout. |
| payment/cancel.html | Pass | ../styles.css first; payment flow layout. |
| media-storage/index.html | Note | Does not load main styles.css; standalone. Add ../styles.css if design should match site. |

---

## 4. Component-level checks

### 4.1 Top mini bar (Stage 4)

- **Colors / font / spacing:** `.hero-nav` and `.hero-nav .hero-nav-title` use SAKE-MAIN vars (white on gradient). Font 16px, bold, center, ellipsis. **Match.**
- **Dynamic page title:** `#heroNavPageTitle` filled by `script.js` from `.hero-page-title` or `.hero-compact-title h1` or fallback. **Works.**
- **Buttons:** Menu toggle, notifications (+ badge), profile avatar (or back + actions on compact) present and styled in `styles.css`. **Correct.**

### 4.2 Sidebar and bottom navigation

- **Colors / hover:** `.nav-link`, `.nav-link:hover`, `.nav-link.active` (lighter-green, primary-green). `.nav-item`, `.nav-item:hover`, `.nav-item.active` with top bar accent. **Consistent.**
- **Icons:** Font Awesome loaded (CDN + local fallback) on all main pages. **Correct.**
- **Active page:** Sidebar uses `.nav-link.active` per page; bottom nav active set by `update-navigation.js` (unchanged). **Correct.**

### 4.3 Page content

- **Hero:** `.page-hero`, `.hero-logo-row`, `.hero-title-area`, `.hero-page-title`, `.hero-subtitle`, `.hero-accent-line` in `styles.css`. **Consistent.**
- **Cards / sections:** Library (lib-*), media (media-*), events, pay, etc. use vars (--card-bg, --primary-green, --radius-*). **Consistent.**
- **Player:** `assets/css/player.css` on media page; player controls and variables (--player-*) applied. **Correct.**
- **Forms / tables / lists:** Use base vars; responsive rules at 428px where needed. **OK.**

### 4.4 Responsive layout

- **Mobile / tablet / desktop:** `.container` max-width 100%; breakpoints at 360px and 428px; bottom nav and mini bar remain usable. **Functional.**
- **Mini bar and bottom nav:** Fixed/sticky behavior and z-index preserved; safe-area-inset-bottom added for bottom nav. **OK.**

---

## 5. Conflicts and missing overrides

| Item | Status | Action |
|------|--------|--------|
| media-storage/index.html | No base styles | Optional: add `<link href="../styles.css" rel="stylesheet">` if it should match main site. |
| offline.html Font Awesome in body | Minor | Optional: move FA links to `<head>`. |
| Library/Quran/events/notifications/pay/admin | No extra override files | Uses base `styles.css` + inline/page-specific styles. **No conflict.** |

---

## 6. Optional automated fix applied

- **styles.css:** `.bottom-nav` padding updated to `padding: 8px 0 calc(12px + env(safe-area-inset-bottom, 0px));` so bottom nav clears device safe area (e.g. notched phones). No JS or hybrid logic changed.

---

## 7. Confirmation

- [x] All main pages load SAKE-MAIN base CSS (`styles.css`) first.
- [x] SAKE overrides applied where needed (player.css for media, search.css for search).
- [x] Top mini bar: colors, font, spacing, dynamic title, buttons match SAKE design.
- [x] Sidebar and bottom nav: consistent colors, hover, active, icons.
- [x] Page content: hero, cards, media, player, forms use design tokens and responsive rules.
- [x] Responsive: mobile/tablet/desktop; mini bar and bottom nav functional.
- [x] No Stage 2 hybrid logic altered (Firebase, Supabase, offline DB, router-bridge, payments, Cloudflare, Railway, functions intact).

**Stage 5 CSS & visual validation complete.** Design fidelity is maintained across SAKE-FINAL; optional fixes documented above.
