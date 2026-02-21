# Firebase to Supabase Refactoring Plan

## Overview
This document outlines the complete refactoring plan to remove all Firebase services EXCEPT Firebase Authentication, and migrate everything to Supabase.

---

## 1. FILES TO DELETE

### Firebase Services (Non-Auth)
- ✅ `firebase-storage.js` - Firebase Storage (replaced by Supabase)
- ✅ `firebase-messaging-sw.js` - FCM Service Worker
- ✅ `fcm-init.js` - FCM Initialization
- ✅ `test-fcm-setup.html` - FCM Test Page

### Documentation (Outdated)
- `FIRESTORE_STORAGE_SETUP.md` - Firestore setup (no longer needed)
- `FIREBASE_MIGRATION_SUMMARY.md` - Old migration docs
- `REALTIME_SYNC_IMPLEMENTATION.md` - Firestore real-time (replaced by Supabase)

---

## 2. FILES TO CREATE

### Architecture Files
- ✅ `models/LibraryItem.js` - Library item model
- ✅ `services/supabaseClient.js` - Single Supabase instance
- ⏳ `services/libraryService.js` - Library CRUD operations
- ⏳ `services/uploadService.js` - File upload service
- ⏳ `utils/errorHandler.js` - Error handling utilities
- ⏳ `utils/logger.js` - Logging utilities

---

## 3. FILES TO MODIFY

### Remove Firestore
- `media.html` - Remove Firestore listener and save/delete operations
- `notifications.html` - Remove Firestore listener and save/delete operations
- `script.js` - Remove Firestore badge update
- `library.html` - Already uses Supabase, but refactor to use new architecture

### Remove Firebase Storage
- `media.html` - Already uses Supabase Storage ✅
- `library.html` - Already uses Supabase Storage ✅

### Remove FCM
- `fcm-config.js` - Remove FCM config, keep only Auth config
- Remove FCM script tags from HTML files

### Update Config
- `fcm-config.js` → Rename to `firebase-auth-config.js` (optional)
- Keep only Auth-related configuration

---

## 4. FILES TO KEEP (UNTOUCHED)

### Firebase Authentication
- ✅ `firebase-auth.js` - **KEEP UNTOUCHED**
- ✅ `fcm-config.js` - **KEEP** (but remove FCM parts, keep Auth)
- ✅ `join-us.html` - **KEEP UNTOUCHED** (login/signup)
- ✅ `update-navigation.js` - **KEEP UNTOUCHED** (uses Auth)

---

## 5. IMPLEMENTATION STEPS

### Step 1: Create Architecture ✅
- [x] Create `models/LibraryItem.js`
- [x] Create `services/supabaseClient.js`
- [ ] Create `services/libraryService.js`
- [ ] Create `services/uploadService.js`
- [ ] Create `utils/errorHandler.js`
- [ ] Create `utils/logger.js`

### Step 2: Remove Firestore
- [ ] Remove Firestore from `media.html`
- [ ] Remove Firestore from `notifications.html`
- [ ] Remove Firestore from `script.js`
- [ ] Remove Firestore script tags from HTML files

### Step 3: Remove FCM
- [ ] Delete `firebase-messaging-sw.js`
- [ ] Delete `fcm-init.js`
- [ ] Delete `test-fcm-setup.html`
- [ ] Remove FCM script tags from HTML files
- [ ] Update `fcm-config.js` to remove FCM config

### Step 4: Remove Firebase Storage
- [ ] Delete `firebase-storage.js`
- [ ] Verify all files use Supabase Storage

### Step 5: Refactor Library Page
- [ ] Update `library.html` to use new architecture
- [ ] Add UI states (loading, empty, error, success)
- [ ] Add search functionality
- [ ] Add pagination/lazy loading
- [ ] Improve error handling

### Step 6: Testing
- [ ] Test Firebase Auth still works
- [ ] Test Library page loads books
- [ ] Test media uploads work
- [ ] Test notifications work (without Firestore)
- [ ] Verify no Firestore/FCM errors in console

---

## 6. BACKEND CONSIDERATIONS

### Firebase Functions
- `functions/index.js` - Uses Firestore for payments
- **Decision**: Keep Firestore in backend for payments (not frontend)
- Frontend will NOT access Firestore directly

### PHP APIs
- `api/get_media.php` - Already uses database ✅
- `api/get_notifications.php` - Already uses database ✅
- `api/get_books.php` - Already uses Supabase ✅

---

## 7. MIGRATION SUMMARY

### What's Removed
- ❌ Firestore (frontend)
- ❌ Firebase Storage
- ❌ Firebase Cloud Messaging (FCM)
- ❌ Firebase Analytics
- ❌ Firebase Performance

### What's Kept
- ✅ Firebase Authentication
- ✅ User login/signup
- ✅ Session management
- ✅ Auth guards

### What's Added
- ✅ Supabase Database (for books, media metadata)
- ✅ Supabase Storage (for file uploads)
- ✅ Clean architecture (models, services, utils)
- ✅ Better error handling
- ✅ Improved Library page UX

---

## 8. VERIFICATION CHECKLIST

After refactoring, verify:

- [ ] Firebase Auth login works
- [ ] Firebase Auth signup works
- [ ] Firebase Auth logout works
- [ ] Navigation updates correctly (Join → Account)
- [ ] Library page loads books from Supabase
- [ ] Library page search works
- [ ] Library page filters work
- [ ] Media uploads to Supabase Storage
- [ ] Notifications load from database (not Firestore)
- [ ] No Firestore errors in console
- [ ] No FCM errors in console
- [ ] No Firebase Storage errors in console
- [ ] All pages load without errors

---

**Status**: Planning Complete, Ready for Implementation
**Next Step**: Create remaining architecture files

