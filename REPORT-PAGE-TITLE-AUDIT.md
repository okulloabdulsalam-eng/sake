# Page Title Audit Report – SAKE-FINAL

**Scope:** HTML, PHP, JS, and router/template behavior.  
**Excluded:** node_modules, vendor, external libraries.  
**Date:** 2026-03-01.

---

## 1. Summary

| Metric | Count |
|--------|--------|
| **HTML files scanned** | 35 |
| **PHP files scanned (HTML-outputting)** | 20+ |
| **JS files with title logic** | 2 (script.js, router-bridge.js) |
| **Missing `<title>` (standalone pages)** | 0 |
| **Fragment / N/A** | 1 (whatsapp-join-modal.html) |
| **Static title (no dynamic update)** | All pages use static `<title>` (acceptable) |
| **SPA/router title issues** | 1 (sticky bar not updated on in-app nav) |

---

## 2. HTML Files – `<head>` and `<title>`

All standalone HTML documents have a `<title>` in `<head>`.

| File | Line | Title | Status |
|------|------|--------|--------|
| index.html | 7 | KIUMA - Kampala International University Muslim Association | OK |
| about.html | 6 | About Us - KIUMA | OK |
| activities.html | 6 | Activities - KIUMA | OK |
| admin.html | 6 | Admin Panel - KIUMA | OK |
| ask-question.html | 6 | Ask Question - KIUMA | OK |
| contact.html | 6 | Contact Us - KIUMA | OK |
| counselling.html | 10 | Counselling - KIUMA | OK |
| dhikr.html | 6 | Dhikr Counter - KIUMA | OK |
| events.html | 6 | Events - KIUMA | OK |
| important-lessons.html | 6 | Important Lessons - KIUMA | OK |
| join-programs.html | 6 | Join Programs - KIUMA | OK |
| join-us.html | 6 | Join Us - KIUMA | OK |
| leadership.html | 6 | Leadership - KIUMA | OK |
| library.html | 6 | Library - KIUMA | OK |
| media.html | 6 | Media - KIUMA | OK |
| media-settings.html | 6 | Media & Audio Settings - KIUMA | OK |
| mosques.html | 6 | Mosques & Qibla - KIUMA | OK |
| names-of-allah.html | 6 | 99 Names of Allah - KIUMA | OK |
| notifications.html | 6 | Notifications - KIUMA | OK |
| pay.html | 6 | Payment - KIUMA | OK |
| programs.html | 6 | Programs - KIUMA | OK |
| quran-reader.html | 6 | Al Quran - KIUMA | OK |
| quran.html | 10 | Quran Study - KIUMA | OK |
| search.html | 7 | Search - KIUMA | OK |
| subscription-form.html | 6 | Subscription Form - KIUMA | OK |
| values.html | 6 | Our Values - KIUMA | OK |
| zakat-form.html | 6 | Zakat Calculation Request - KIUMA | OK |
| auth/callback.html | 6 | Set Your Password | OK |
| payment/callback.html | 6 | Payment Successful - KIUMA | OK |
| payment/cancel.html | 6 | Payment Cancelled - KIUMA | OK |
| offline.html | 7 | Offline - KIUMA | OK |
| test-account-storage.html | 6 | Account Storage Test - KIUMA | OK |
| media-storage/index.html | 6 | Upload Media - KIUMA Media Storage | OK |
| public/payment-example.html | 6 | KIUMA Payment - Pesapal | OK |
| **whatsapp-join-modal.html** | — | **No `<head>` / `<title>`** | **Fragment only (modal markup); not a standalone page. N/A.** |

**Conclusion:** No standalone HTML page is missing `<title>`.

---

## 3. PHP Files – `<title>` in HTML Output

All PHP files that output full HTML for the browser include a `<title>`.

| File | Line(s) | Title | Status |
|------|---------|--------|--------|
| api/join_us_form.php | 6 | Join KIUMA - Recruitment Form | OK |
| check_registration_database.php | 16 | Check Registration Database | OK |
| check_sqlite_users.php | 10 | (in echo) SQLite Users Check | OK |
| check_twilio_message_status.php | 20 | Check Twilio Message Status | OK |
| check_user_details.php | 16 | User Registration Details | OK |
| check_users_direct.php | 21 | (in echo) Users in Database | OK |
| cleanup_test_notifications.php | 15 | Cleanup Test Notifications | OK |
| configure_twilio_sandbox_code.php | 17 | Configure Twilio Sandbox Code | OK |
| manage_user_whatsapp.php | 20 | Manage User WhatsApp Numbers | OK |
| media-storage/authorize.php | 53, 79 | Authorization Successful / Authorization Error | OK |
| media-storage/dashboard.php | 39, 146 | Admin Login / Dashboard - Media Storage | OK |
| quick_test_whatsapp.php | 20 | Quick WhatsApp Test | OK |
| sync_databases.php | 20 | Sync Databases | OK |
| test_db.php | 9 | (in echo) KIUMA Database Test | OK |
| test_notifications_db.php | 18 | Notification Database Test - KIUMA | OK |
| test_send_whatsapp_notifications.php | 20 | Test WhatsApp Notifications | OK |
| test_whatsapp.php | 22 | WhatsApp Test - KIUMA | OK |
| test_your_twilio_number.php | 20 | Test Your Twilio Number | OK |
| view_all_sqlite_users.php | 16 | All SQLite Users | OK |
| run_whatsapp_test.php | — | CLI only (no HTML) | N/A |

**Conclusion:** No HTML-outputting PHP file is missing a title.

---

## 4. JavaScript – `document.title` and Router

### 4.1 Where `document.title` is used

| File | Line | Usage |
|------|------|--------|
| **js/router-bridge.js** | 44–45 | In `replaceContainer(html)`: parses fetched HTML, sets `document.title = doc.querySelector('title').textContent` when doing in-app navigation. |
| **script.js** | 481 | Fallback for hero nav title: `(document.title \|\| 'KIUMA').replace(...)` when no h1/hero-page-title. |

### 4.2 Router (SPA-like) behavior

- **router-bridge.js**:
  - Same-origin `.html` links can load via **fetch** and replace `.container` content (in-app navigation).
  - **FULL_LOAD_PAGES** (e.g. media.html, pay.html, admin.html, …) always do a **full page load** (`location.href`), so the new document’s `<title>` is used.
  - For non–full-load pages, **replaceContainer** runs and **updates `document.title`** from the fetched document’s `<title>` (line 45).
  - **popstate** (back/forward) also uses **replaceContainer**, so `document.title` is updated on history navigation as well.

So: **Browser tab title is updated on both in-app navigation and full load.** No route is left without a title update when the content changes.

### 4.3 Issue: Sticky mini bar shows previous page title after in-app navigation

| File | Line | Issue type | Suggested fix |
|------|------|------------|----------------|
| script.js | 486–504 | **document.title not reflected in UI** | Sticky mini bar (`.sticky-mini-bar .smb-title`) is built once on init from `.hero-page-title` / `heroNavPageTitle` / `'KIUMA'`. On in-app navigation, only `.container` and `document.title` change; the bar is outside the container and is **not** updated. So the **browser tab** title is correct, but the **sticky bar** can show the previous page name. | Listen for `kiuma-page-changed` (already fired by router-bridge after navigation). In the handler, set `.sticky-mini-bar .smb-title` from `document.title` or from the new container’s `.hero-page-title`. |

---

## 5. Templates / Dynamic Rendering

- **HTML pages:** Static `<title>` per file; no server-side template engine found. Acceptable.
- **PHP pages:** Title is fixed in each file (or in one of two branches, e.g. media-storage/authorize.php). No dynamic title by route/content.
- **Service worker (sw.js):** Contains inline HTML strings with `<title>Admin</title>` for offline/redirect; not a user-facing document. OK.

No missing or incorrect dynamic titles identified beyond the sticky bar UI sync above.

---

## 6. Structured Issue List

| # | File path | Line (approx) | Issue type | Suggested fix |
|---|-----------|----------------|------------|----------------|
| 1 | script.js | 486–504 | Sticky bar title not updated on SPA navigation | On `kiuma-page-changed`, update `.sticky-mini-bar .smb-title` from `document.title` or `.container .hero-page-title`. |

**No:** Missing `<title>` in any standalone HTML or HTML-outputting PHP.  
**No:** Routes or navigations where `document.title` is never set (router-bridge sets it on replace; full load uses the new document’s title).

---

## 7. SPA / JS Routing Highlight

- **Router:** `js/router-bridge.js` (in-app navigation for same-origin `.html` links).
- **Title handling:** `document.title` is set in **replaceContainer** from the fetched page’s `<title>`. So **tab title is correct** after navigation.
- **Full-load pages** (e.g. media, pay, admin, subscription-form, zakat-form, etc.) always do a full reload; their `<title>` is used normally.
- **Only UI gap:** The sticky mini bar title is not refreshed on in-app navigation (see §4.3 and §6).

---

## 8. Files with Missing or Wrong Titles

- **Missing `<title>`:** None (whatsapp-join-modal.html is a fragment, not a document).
- **Wrong / stale title:** Only the **sticky mini bar text** can be stale after in-app navigation; the **browser tab title** is correct.

---

## 9. Totals

| Item | Count |
|------|--------|
| Total HTML files scanned | 35 |
| Total PHP files with HTML output checked | 20 |
| Total issues (missing `<title>` or document.title never set) | 0 |
| Total UI sync issues (sticky bar) | 1 |
| **Total issues to fix** | **1** (optional UX improvement) |

---

**End of report.**
