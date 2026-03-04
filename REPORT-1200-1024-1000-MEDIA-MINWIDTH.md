# Report: 1200, 1024, 1000, min-width, @media in SAKE-FINAL

**Scope:** SAKE-FINAL folder.  
**Searched:** `1200`, `1024`, `1000`, `min-width`, `@media`.

---

## 1. **1200**

| Location | Usage |
|----------|--------|
| **admin.html** (line 25) | `max-width: 1200px` on a container (layout cap, not a media breakpoint). |
| **check_registration_database.php** | `max-width: 1200px` (container). |
| **check_twilio_message_status.php** | `max-width: 1200px` (container). |
| **check_user_details.php** | — (uses 1000, see below). |
| **manage_user_whatsapp.php** | `max-width: 1200px` (container). |
| **media-storage/dashboard.php** | `max-width: 1200px` (container). |
| **test_notifications_db.php** | `max-width: 1200px` (container). |
| **test_send_whatsapp_notifications.php** | `max-width: 1200px` (container). |
| **view_all_sqlite_users.php** | `max-width: 1200px` (container). |

**Summary:** `1200` is used only as a **container max-width** (admin + PHP dashboards). There is **no** `@media (min-width: 1200px)` or `@media (max-width: 1200px)` in the main app CSS.

---

## 2. **1024**

| Context | Usage |
|---------|--------|
| **JavaScript (bytes/KB)** | `1024` used for byte conversion (e.g. B → KB): **media.html**, **library.html**, **admin.html** (e.g. `bytes < 1024`, `bytes / 1024`). |
| **BUILD-NATIVE-APP.md** | Icon size `1024x1024` (asset spec). |
| **cloudflare/worker.js** | `10 * 1024 * 1024 * 1024` (10 GB cap). |

**Summary:** `1024` is used for **file size / bytes**, not as a CSS breakpoint. There is **no** `@media (min-width: 1024px)` or `@media (max-width: 1024px)` in SAKE-FINAL.

---

## 3. **1000**

| Context | Usage |
|---------|--------|
| **Timeouts / milliseconds** | `1000` = 1 second in **script.js**, **media.html**, **media-settings.html**, **notifications.html**, **mosques.html**, **network-sync.js**, **firebase-auth.js**, **offline.html**, **update-navigation.js**, **cloudflare** workers, **railway-server**, **functions**, **api/pesapal.js**. |
| **Layout (container)** | **check_user_details.php**: `max-width: 1000px`. **sync_databases.php**: `max-width: 1000px`. |
| **Other** | **dhikr.html**: button `setTarget(1000)` (count target). **cloudflare/pesapal/worker.js**: test amount 1000 UGX, max amount check. **admin.html**: math (e.g. `* 1000`, `* 10000`). |

**Summary:** `1000` is used as **milliseconds**, **container max-width** in PHP, or **numeric constants** in JS/backend. There is **no** `@media (min-width: 1000px)` or `@media (max-width: 1000px)` in the main app CSS.

---

## 4. **min-width** (CSS / inline styles)

### styles.css
- `min-width: 18px` (badge/small control).
- `min-width: 0` (flex child).
- `min-width: 16px` (control).
- `min-width: calc(50% - 8px)` (grid/layout).

### HTML / inline
- **admin.html:** `min-width: 140px` (search), `min-width: 18px`, `min-width: 180px`, `min-width: 140px` (form groups), `min-width: 60px` (size column).
- **media.html:** `.media-card` `min-width: 200px` (600px+ → 220px); `.card-more-menu` `min-width: 160px`; `.playlist-folder` `min-width: 160px`.
- **library.html:** `.lib-top-card` `min-width: 140px`; `.lib-genre-item` `min-width: 72px`; `.lib-book-info` `min-width: 0`; `.card-more-menu` `min-width: 160px`; `.rl-folder` `min-width: 150px`.
- **programs.html, leadership.html, index.html:** `min-width: 0` on flex children (prevent overflow).
- **index.html:** `min-width: 44px`, `min-width: 0`, `min-width: 30px` (calendar/event layout).
- **activities.html:** `min-width: 60px` (stat boxes).
- **quran-reader.html:** `min-width: 0` (surah info); dropdown `min-width: 220px`.
- **quran.html:** `min-width: 20px`.
- **media-settings.html:** `min-width: 0` (recording details).
- **assets/css/player.css:** `min-width: 140px`.
- **css/search.css:** `min-width: 40px`, `min-width: 0`, `min-width: 38px`, etc.

**Summary:** `min-width` is used for (1) **flex/grid layout** (`min-width: 0` to allow shrinking), (2) **cards and menus** (fixed minimum widths in px), and (3) **form/control sizing**. No `min-width` in SAKE-FINAL defines a **desktop-only layout** breakpoint (e.g. no “above 1200px” layout).

---

## 5. **@media** (all breakpoints in SAKE-FINAL)

| File | Rule | Purpose |
|------|------|--------|
| **styles.css** | `@media (prefers-color-scheme: dark)` | Dark theme variables. |
| **styles.css** | `@media (max-width: 360px)` | Account tabs: smaller font/padding. |
| **styles.css** | `@media (max-width: 428px)` | Pay page: membership grid 1 col, payment cards, WhatsApp card, copy button. |
| **styles.css** | `@media (max-width: 428px)` | Floating Kizumu button: position/size, hide label. |
| **media.html** | `@media (min-width: 600px)` | Media cards: width 220px (from 200px). |
| **counselling.html** | `@media (min-width: 768px)` | Counselling page layout. |
| **quran.html** | `@media (min-width: 768px)` | Quran page layout. |
| **assets/css/player.css** | `@media (max-width: 640px)` | Player layout. |
| **css/search.css** | `@media (max-width: 768px)` | Search UI adjustments. |

**Breakpoint values used in @media (layout):**
- **360px** (max) — very small phones.
- **428px** (max) — small phones (pay + floating button).
- **600px** (min) — media cards.
- **640px** (max) — player.
- **768px** (max or min) — search, counselling, quran.

**Summary:** There are **no** `1200`, `1024`, or `1000` px values in any `@media` in SAKE-FINAL. All media queries use **360, 428, 600, 640, 768** (and `prefers-color-scheme`). The app is **mobile-first** with max-width and one min-width (600px, 768px) for slightly larger screens; no desktop-only breakpoints at 1000/1024/1200.

---

## Quick reference

| Term | In SAKE-FINAL |
|------|----------------|
| **1200** | Container `max-width` only (admin.html + PHP). No @media. |
| **1024** | Bytes/KB and 10GB cap. No @media. |
| **1000** | Timeouts (ms), PHP container width, backend numbers. No @media. |
| **min-width** | Layout (flex `min-width: 0`), cards, menus, forms. No 1000/1024/1200 breakpoints. |
| **@media** | 360, 428, 600, 640, 768 px + prefers-color-scheme. No 1000/1024/1200. |
