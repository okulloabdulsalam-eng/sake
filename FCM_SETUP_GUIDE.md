# Firebase Cloud Messaging (FCM) - Complete Setup Guide

This guide will walk you through setting up Firebase Cloud Messaging (FCM) for push notifications on your KIUMA website.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Enable Cloud Messaging API](#enable-cloud-messaging-api)
4. [Generate VAPID Keys](#generate-vapid-keys)
5. [Configure Frontend Files](#configure-frontend-files)
6. [Configure Server Files](#configure-server-files)
7. [Integrate into HTML](#integrate-into-html)
8. [Testing](#testing)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- ✅ A Google account
- ✅ A web server with HTTPS (required for service workers)
- ✅ Node.js installed (for server-side sending)
- ✅ Basic knowledge of JavaScript

**Important:** FCM requires HTTPS in production. Localhost is allowed for development, but production must use HTTPS.

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter project name: `KIUMA` (or your preferred name)
4. Click **"Continue"**
5. (Optional) Enable Google Analytics, then click **"Continue"**
6. Click **"Create project"**
7. Wait for project creation, then click **"Continue"**

### 1.2 Register Web App

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Register app nickname: `KIUMA Web App`
3. (Optional) Check "Also set up Firebase Hosting"
4. Click **"Register app"**
5. **Copy the Firebase configuration object** - you'll need this later

The configuration looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## Step 2: Enable Cloud Messaging API

### 2.1 Enable Cloud Messaging API

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click **"Cloud Messaging"** tab
3. Under **"Cloud Messaging API (Legacy)"**, click **"Enable"**
4. Wait for API to be enabled

### 2.2 Get Sender ID

1. In the same **Cloud Messaging** tab
2. Find **"Sender ID"** - this is a numeric ID (e.g., `123456789012`)
3. **Copy this Sender ID** - you'll need it for configuration

---

## Step 3: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for web push notifications.

### 3.1 Generate VAPID Key Pair

1. In Firebase Console, go to **Project Settings** > **Cloud Messaging** tab
2. Scroll to **"Web Push certificates"** section
3. Click **"Generate key pair"** (if no key exists)
4. **Copy the generated key** - this is your VAPID key
   - Format: `BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. Save this key securely

**Note:** If you already have a VAPID key, you can use it. Otherwise, Firebase will generate one for you.

---

## Step 4: Configure Frontend Files

### 4.1 Update `fcm-config.js`

1. Open `fcm-config.js` in your project
2. Replace all placeholder values with your Firebase project values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",                    // From Step 1.2
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",  // From Step 1.2
    projectId: "YOUR_PROJECT_ID",                    // From Step 1.2
    storageBucket: "YOUR_PROJECT_ID.appspot.com",   // From Step 1.2
    messagingSenderId: "YOUR_SENDER_ID_HERE",        // From Step 2.2
    appId: "YOUR_APP_ID_HERE",                       // From Step 1.2
    vapidKey: "YOUR_VAPID_KEY_HERE"                  // From Step 3.1
};
```

**Example:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz",
    authDomain: "kiuma-app.firebaseapp.com",
    projectId: "kiuma-app",
    storageBucket: "kiuma-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456",
    vapidKey: "BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
};
```

### 4.2 Verify Service Worker Location

Ensure `firebase-messaging-sw.js` is in the **root directory** of your website (same level as `index.html`).

The service worker must be accessible at: `https://yourdomain.com/firebase-messaging-sw.js`

---

## Step 5: Configure Server Files

### 5.1 Install Firebase Admin SDK

In your project directory, run:

```bash
npm install firebase-admin
```

### 5.2 Get Service Account Key

1. In Firebase Console, go to **Project Settings** > **Service Accounts** tab
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the confirmation dialog
4. A JSON file will download - this is your service account key
5. **Rename the file** to `serviceAccountKey.json`
6. **Move it** to the `server/` directory
7. **IMPORTANT:** Add `server/serviceAccountKey.json` to `.gitignore` to keep it secure

### 5.3 Update `.gitignore`

Add these lines to your `.gitignore`:

```
# Firebase service account key (contains sensitive credentials)
server/serviceAccountKey.json

# Firebase config (if you want to keep it private)
fcm-config.js
```

### 5.4 Alternative: Use Environment Variables (Production)

For production, use environment variables instead of the JSON file:

1. Extract values from `serviceAccountKey.json`
2. Set environment variables:
   ```bash
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_PRIVATE_KEY_ID="your-private-key-id"
   export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
   export FIREBASE_CLIENT_ID="your-client-id"
   export FIREBASE_CLIENT_X509_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/..."
   ```

3. Update `server/send-notification.js` to use environment variables (see comments in file)

---

## Step 6: Integrate into HTML

### 6.1 Add Firebase SDK Scripts

Add these scripts to your HTML files (before closing `</head>` tag):

```html
<!-- Firebase SDK v9+ -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"></script>

<!-- Firebase Configuration -->
<script src="fcm-config.js"></script>

<!-- FCM Initialization -->
<script src="fcm-init.js"></script>
```

### 6.2 Add Permission Request Button (Optional)

Add a button to request notification permission. Example:

```html
<button onclick="requestNotificationPermission()" class="btn btn-primary">
    <i class="fas fa-bell"></i> Enable Push Notifications
</button>
```

### 6.3 Example: Update `index.html`

Add the scripts before `</head>`:

```html
<head>
    <!-- ... existing head content ... -->
    
    <!-- Firebase Cloud Messaging -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"></script>
    <script src="fcm-config.js"></script>
    <script src="fcm-init.js"></script>
</head>
```

---

## Step 7: Testing

### 7.1 Test Frontend Initialization

1. Open your website in a browser (Chrome recommended)
2. Open browser console (F12)
3. Check for:
   - ✅ "Firebase app initialized"
   - ✅ "FCM initialized successfully"
   - ✅ "Service Worker registered"

### 7.2 Test Permission Request

1. Click the "Enable Push Notifications" button
2. Browser should show permission prompt
3. Click "Allow"
4. Check console for:
   - ✅ "Notification permission granted"
   - ✅ "FCM Token: [your-token]"

### 7.3 Test Token Retrieval

1. After granting permission, check console for FCM token
2. Copy the token
3. You can also call `getFCMToken()` in console to get the token

### 7.4 Test Server-Side Sending

Create a test script `server/test-send.js`:

```javascript
const { sendNotificationToDevice } = require('./send-notification');

async function test() {
    const token = 'YOUR_FCM_TOKEN_HERE'; // Get from browser console
    
    const result = await sendNotificationToDevice(
        token,
        {
            title: 'Test Notification',
            body: 'This is a test notification from FCM!',
            icon: '/logo.png'
        },
        {
            click_action: '/notifications.html',
            type: 'test'
        }
    );
    
    console.log('Result:', result);
}

test();
```

Run:
```bash
node server/test-send.js
```

### 7.5 Test Foreground Notifications

1. Keep your website open in the foreground
2. Send a test notification
3. You should see:
   - Browser notification popup
   - In-app notification banner (if implemented)

### 7.6 Test Background Notifications

1. Send a notification
2. Minimize or switch to another tab
3. You should receive a browser notification
4. Click the notification - it should open your website

---

## Step 8: Production Deployment

### 8.1 HTTPS Requirement

**FCM requires HTTPS in production.** Service workers only work over HTTPS (except localhost).

Options:
- Use a hosting service with HTTPS (Firebase Hosting, Netlify, Vercel, etc.)
- Use a reverse proxy (Nginx, Apache) with SSL certificate
- Use Cloudflare for free SSL

### 8.2 Update Service Worker

Ensure `firebase-messaging-sw.js` is accessible at:
```
https://yourdomain.com/firebase-messaging-sw.js
```

### 8.3 Environment Variables

For production, use environment variables instead of hardcoded values:

1. Set environment variables on your server
2. Update `fcm-config.js` to read from environment (or use a build process)
3. Never commit sensitive keys to Git

### 8.4 Database Integration

Store FCM tokens in your database:

1. Create an API endpoint to save tokens (e.g., `/api/save-fcm-token`)
2. Update `fcm-init.js` to send tokens to your server
3. Store tokens with user IDs for targeted notifications

Example database schema:
```sql
CREATE TABLE fcm_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255) UNIQUE,
    device_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
);
```

---

## Step 9: Troubleshooting

### Problem: "Firebase SDK not loaded"

**Solution:**
- Check that Firebase scripts are loaded before `fcm-init.js`
- Verify script URLs are correct
- Check browser console for 404 errors

### Problem: "Service Worker registration failed"

**Solution:**
- Ensure you're using HTTPS (or localhost)
- Check that `firebase-messaging-sw.js` is in root directory
- Verify file is accessible (try opening URL directly)
- Check browser console for specific error

### Problem: "Notification permission denied"

**Solution:**
- User must manually enable in browser settings
- Chrome: Settings > Privacy and security > Site settings > Notifications
- Clear site data and try again

### Problem: "Invalid FCM token"

**Solution:**
- Token may have expired or been unregistered
- Request a new token: `getFCMToken()`
- Remove old tokens from database

### Problem: "Firebase configuration invalid"

**Solution:**
- Verify all values in `fcm-config.js` are replaced
- Check for typos in configuration values
- Ensure VAPID key is correct

### Problem: "Notifications not showing"

**Solution:**
- Check browser notification settings
- Verify service worker is active (Chrome DevTools > Application > Service Workers)
- Check console for errors
- Test with a simple notification first

### Problem: "Service account key not found"

**Solution:**
- Ensure `serviceAccountKey.json` is in `server/` directory
- Check file permissions
- Verify JSON file is valid

---

## Quick Reference

### Configuration Values Location

| Value | Where to Find |
|-------|---------------|
| `apiKey` | Firebase Console > Project Settings > General > Your apps > Web app |
| `authDomain` | Same as above |
| `projectId` | Same as above |
| `storageBucket` | Same as above |
| `messagingSenderId` | Firebase Console > Project Settings > Cloud Messaging |
| `appId` | Firebase Console > Project Settings > General > Your apps > Web app |
| `vapidKey` | Firebase Console > Project Settings > Cloud Messaging > Web Push certificates |
| Service Account Key | Firebase Console > Project Settings > Service Accounts > Generate new private key |

### File Structure

```
your-project/
├── fcm-config.js              # Firebase configuration
├── fcm-init.js                # FCM initialization
├── firebase-messaging-sw.js   # Service worker (must be in root)
├── index.html                 # Your HTML files
├── server/
│   ├── send-notification.js  # Server-side notification sender
│   └── serviceAccountKey.json # Service account key (keep secure!)
└── package.json               # Node.js dependencies
```

### Common Functions

```javascript
// Request notification permission
await requestNotificationPermission();

// Get FCM token
const token = await getFCMToken();

// Initialize FCM
await initializeFCM();
```

---

## Security Best Practices

1. ✅ **Never commit** `serviceAccountKey.json` to Git
2. ✅ **Never commit** `fcm-config.js` if it contains real values (use `.gitignore`)
3. ✅ **Use environment variables** in production
4. ✅ **Restrict API keys** in Firebase Console (if possible)
5. ✅ **Validate tokens** before storing in database
6. ✅ **Clean up invalid tokens** regularly
7. ✅ **Use HTTPS** in production
8. ✅ **Implement rate limiting** for token registration

---

## Support

For issues or questions:

1. Check [Firebase Documentation](https://firebase.google.com/docs/cloud-messaging)
2. Check browser console for errors
3. Verify all configuration values are correct
4. Test with a simple notification first

---

## Next Steps

After setup is complete:

1. ✅ Integrate token storage in your database
2. ✅ Create API endpoints for sending notifications
3. ✅ Add notification preferences for users
4. ✅ Implement notification history
5. ✅ Add analytics for notification delivery

---

**Congratulations!** You've successfully set up Firebase Cloud Messaging for push notifications! 🎉

