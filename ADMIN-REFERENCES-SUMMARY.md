# Admin / "Admin" References — Paths and Summary

Search scope: **SAKE-FINAL** (filename and content). Summary of what each file handles: **upload**, **delete**, **listing**, **permissions**.

---

## 1. HTML — Pages with "admin" in name or content

| Path | What it handles |
|------|------------------|
| **admin.html** | **Admin panel UI.** Password gate (`adminPasswordInput`, `attemptLogin`), then tabs: **Media** (upload area, file list, bulk delete), **Library** (upload book, list, bulk delete), **Playlists** (create/edit Firestore playlists), **Settings** (R2/GitHub tokens, admin password change), **Notifications** (list, add, delete Firestore notifications), **Mosques**, **Prayer times**, **Events**, **Announcement**, **Live tracker**, **Payments**. Uses `localStorage.isAdminLoggedIn` and Firestore/GitHub for data. **Permissions:** client-side password; Firestore writes depend on rules. **Upload:** media + library via UI. **Delete:** bulk delete media/library; delete notifications. **Listing:** admin file lists, notifications, events, trackers. |
| **media.html** | **Consumer media page.** References **admin** only via **getAdminPlaylists()** and **syncPlaylistsFromFirestore()** — reads Firestore `config/playlists` (admin-managed playlists) for display. No upload/delete; **listing** of admin playlists only. |
| **index.html** | Comment "Upcoming Events (from admin)" and "Load admin-managed data from Firestore". **Listing** of admin-managed content only; no upload/delete. |
| **library.html** | **addBook** checks **isAdminLoggedIn**; calls **showAdminLogin** if not admin. **getAdminPlaylists()** for admin-managed reading lists. **Upload:** add book (admin-only). **Listing:** merge admin playlists with library. **Permissions:** `localStorage.isAdminLoggedIn`. |
| **payment/callback.html** | Comment: "Firebase for saving payment receipt to admin" / "Save successful payment to Firestore for admin receipt book". Writes payment result for admin visibility; no upload/delete/listing of media. |
| **whatsapp-join-modal.html** | Comment: "if admin set it" / "prompt admin" for some value. No upload/delete; config hint only. |

---

## 2. JS — Scripts that manage uploads, media listing, Firebase admin

| Path | What it handles |
|------|------------------|
| **script.js** | **Sticky mini bar:** injects Admin link in bar if hero has `.hero-admin-link`. **Form submit:** sends `admin_password` in formData (e.g. for server). No direct upload/delete/listing; UI and auth hint. |
| **firebase-auth.js** | **Admin permissions (client).** **checkAdminStatus(user)** — reads Firebase ID token claims `admin === true` or `role === 'admin'`. Sets **localStorage.isAdminLoggedIn**. **isAdmin()**, **requireAdmin(callback)** for guarding actions. **showAdminLogin** redirect. No upload/delete; **permissions** only. |
| **services/githubStorageService.js** | **Upload** to GitHub repo; **delete** by path/sha. Token "set via admin panel" (localStorage). Used by admin panel for media/library sync. **Listing:** list repo contents. **Permissions:** token from admin UI. |
| **services/uploadService.js** | **Upload** and **delete** for Supabase Storage. No "admin" in logic; used by admin/other pages. **Listing:** via Supabase client elsewhere. |
| **services/supabaseAuth.js** | Auth helpers; "admin" only if mentioned in comments. |
| **services/searchService.js** | Search; "admin" only if in comments. |
| **services/prayerTimesService.js** | Prayer times; "admin" only if in comments. |
| **js/router-bridge.js** | Routing; "admin" only if href to admin.html. |
| **sw.js** | Service worker; "admin" only if in comments/strings. |
| **cloudflare/worker.js** | R2 storage API. **isAdmin(request, env):** `X-Admin-Token` header must match `env.ADMIN_TOKEN`. **requireAdmin(request, env)** throws 401 if not admin. **Upload:** PUT `/upload`, POST `/upload/init`, PUT `/upload/chunk`, POST `/upload/complete` (all admin). **Delete:** DELETE `/file/:key` (admin). **Listing:** GET `/upload/status` (list parts), GET `/storage` (usage). **Permissions:** header `X-Admin-Token`. |
| **cloudflare/pesapal/worker.js** | Payment webhook; "admin" only if in comments. |
| **cloudflare/recitation/worker.js** | Recitation; "admin" only if in comments. |
| **cloudflare/subtitles/worker.js** | Subtitles; "admin" only if in comments. |
| **cloudflare/notifications/worker.js** | Notifications; "admin" only if in comments. |

---

## 3. Server (Node) and Firebase Functions — Routes/functions with admin or media logic

| Path | What it handles |
|------|------------------|
| **server.js** | **Firebase Admin SDK** (`require('firebase-admin')`): init, messaging. **isAdminRequest(req):** checks `x-admin-key` header vs `ADMIN_API_KEY` env. **GET /api/push/tokens** — **listing** push tokens (admin). **POST /api/push/send-broadcast** — send FCM to all or by userId (admin). **POST /api/push/send-test** — send to one token (admin). **Permissions:** `x-admin-key` header. No media upload/delete; push only. |
| **functions/index.js** | **Firebase Admin:** `admin.initializeApp()`, `admin.firestore()`, `admin.auth().getUser()`, `admin.firestore.FieldValue.serverTimestamp()`. Firestore writes (payments, webhooks, verification). No "admin" role in name; **admin** = Firebase Admin SDK. Handles payment/verification data, not media upload/delete/listing. |
| **functions/barakahpush-functions.js** | **Firebase Admin:** init, Firestore, messaging. **adminSendNotification** — callable HTTPS function: **permission** = password check `data.password === 'kiuma2025'`; sends push notification ("admin" as sender type). **Upload/delete/listing:** notifications only (Firestore + FCM). |

---

## 4. Summary by concern

| Concern | Where | How |
|--------|--------|-----|
| **Upload** | admin.html (UI), library.html (add book), services/githubStorageService.js (GitHub), services/uploadService.js (Supabase), cloudflare/worker.js (R2 PUT/POST upload) | Admin UI or token; R2: `X-Admin-Token`; server push: `x-admin-key`. |
| **Delete** | admin.html (bulk media/library, delete notification), services/githubStorageService.js (GitHub), services/uploadService.js (Supabase), cloudflare/worker.js (DELETE /file/:key) | Same admin/token checks. |
| **Listing** | admin.html (media list, library list, notifications, events, trackers), media.html (getAdminPlaylists), library.html (getAdminPlaylists), server.js (GET /api/push/tokens) | Firestore, GitHub, or server DB; push tokens protected by `x-admin-key`. |
| **Permissions** | firebase-auth.js (claims admin/role, requireAdmin), admin.html (password + isAdminLoggedIn), server.js (isAdminRequest → x-admin-key), functions/barakahpush-functions.js (password for adminSendNotification), cloudflare/worker.js (X-Admin-Token) | Client: Firebase claims or localStorage; server: header; Cloudflare: env ADMIN_TOKEN. |

---

**Files with "admin" in filename:**  
`admin.html` only.

**Files with substantial admin logic (upload/delete/listing/permissions):**  
admin.html, library.html, firebase-auth.js, server.js, functions/barakahpush-functions.js, cloudflare/worker.js, services/githubStorageService.js, services/uploadService.js.  
media.html and index.html only **read** admin-managed data (playlists/events).
