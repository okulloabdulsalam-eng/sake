# FCM Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create/Select your project
3. Add Web App (click `</>` icon)
4. Copy the config values

### Step 2: Configure Files

**Update `fcm-config.js`:**
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "123456789012",
    appId: "YOUR_APP_ID",
    vapidKey: "YOUR_VAPID_KEY"  // Get from Cloud Messaging > Web Push certificates
};
```

**Get VAPID Key:**
- Firebase Console > Project Settings > Cloud Messaging
- Scroll to "Web Push certificates"
- Click "Generate key pair" (if needed)
- Copy the key

### Step 3: Install Dependencies

```bash
npm install firebase-admin
```

### Step 4: Get Service Account Key

1. Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save as `server/serviceAccountKey.json`
4. **Add to `.gitignore`!**

### Step 5: Test

1. Open `notifications.html` in browser
2. Click "Enable Push Notifications"
3. Allow permission
4. Check console for FCM token

### Step 6: Send Test Notification

Create `server/test.js`:
```javascript
const { sendNotificationToDevice } = require('./send-notification');

sendNotificationToDevice(
    'YOUR_FCM_TOKEN',  // Get from browser console
    {
        title: 'Test',
        body: 'Hello from FCM!',
        icon: '/logo.png'
    },
    {
        click_action: '/notifications.html'
    }
).then(result => console.log(result));
```

Run: `node server/test.js`

## 📋 File Checklist

- [x] `fcm-config.js` - Configured with Firebase values
- [x] `fcm-init.js` - Loaded in HTML
- [x] `firebase-messaging-sw.js` - In root directory
- [x] `server/send-notification.js` - Server file ready
- [x] `server/serviceAccountKey.json` - Downloaded and secured
- [x] Firebase scripts added to HTML
- [x] Button added to request permissions

## 🔍 Common Issues

**"Firebase SDK not loaded"**
→ Check script tags are before `fcm-init.js`

**"Service Worker registration failed"**
→ Need HTTPS (or localhost)

**"Invalid token"**
→ Request new token: `getFCMToken()`

**"Permission denied"**
→ User must enable in browser settings

## 📚 Full Documentation

See `FCM_SETUP_GUIDE.md` for complete instructions.

