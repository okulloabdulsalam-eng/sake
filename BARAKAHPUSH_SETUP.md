# BarakahPush Notification System – Active

## Setup Instructions

### 1. Firebase Configuration

Update `fcm-config.js` with your VAPID key:

1. Go to Firebase Console > Project Settings > Cloud Messaging
2. Scroll to "Web Push certificates"
3. Generate key pair if not exists
4. Copy the key and paste it in `fcm-config.js`:
   ```javascript
   vapidKey: "YOUR_ACTUAL_VAPID_KEY_HERE"
   ```

### 2. Database Setup

Run the SQL schema in Supabase:

1. Go to Supabase Dashboard > SQL Editor
2. Run `database/barakahpush_schema.sql`
3. This creates:
   - `notifications` table
   - `user_tokens` table
   - `user_preferences` table
   - RLS policies

### 3. Firebase Cloud Functions

Deploy the Cloud Functions:

```bash
cd functions
npm install
firebase deploy --only functions
```

Functions deployed:
- `sendHijriNotifications` - Scheduled Hijri calendar notifications
- `sendPrayerReminders` - Scheduled gender-based prayer reminders
- `adminSendNotification` - Admin manual notification sender

### 4. Update HTML Pages

All HTML pages need these scripts in `<head>`:

```html
<!-- BarakahPush Notification System – Active -->
<script src="https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.6.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="services/supabaseClient.js"></script>
<script src="fcm-config.js"></script>
<script src="firebase-auth.js"></script>
<script src="js/barakahpush-init.js"></script>
<script src="js/barakahpush.js"></script>
```

### 5. Verify Badge Updates

The notification bell badge should:
- Appear on all pages in the header
- Update in real-time when notifications arrive
- Show unread count

### 6. Test Admin Panel

1. Go to `/notifications.html`
2. Click "Admin" button
3. Enter password: `kiuma2025`
4. Click "Send Notification"
5. Fill in title, message
6. Check/uncheck "Send Email" and "Send Push"
7. Click "Send Notification"

### 7. Scheduled Notifications

Automatic notifications:
- **Hijri White Days**: Days 10, 11, 12 at 8 AM, 12 PM, 10 PM
- **Prayer Reminders (MALE)**: 8 AM (Fajr), 9 PM (Isha)

These run via Firebase Cloud Functions scheduled triggers.

## Features

✅ FCM DATA messages only (WebView-safe)
✅ App-level notification handling
✅ Secure token storage per user
✅ Auto-update token on reinstall/refresh
✅ Real-time badge updates
✅ Offline notification caching
✅ Admin panel with password protection
✅ Scheduled notifications (Hijri, gender-based)
✅ Email support (when enabled)

## Notes

- Notifications appear in app + phone notification bar
- Works in WebView apps
- No console errors
- No impact on library or media features

