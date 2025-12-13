# FCM Server Directory

This directory contains server-side files for sending Firebase Cloud Messaging (FCM) push notifications.

## Files

### `send-notification.js`
Main server-side script for sending push notifications using Firebase Admin SDK.

**Functions:**
- `sendNotificationToDevice(token, notification, data, options)` - Send to single device
- `sendNotificationToMultipleDevices(tokens, notification, data, options)` - Send to multiple devices
- `sendNotificationToTopic(topic, notification, data)` - Send to topic subscribers

### `serviceAccountKey.json`
**⚠️ DO NOT COMMIT THIS FILE TO GIT!**

This file contains your Firebase service account credentials. It should be:
- Downloaded from Firebase Console > Project Settings > Service Accounts
- Placed in this directory
- Added to `.gitignore`
- Kept secure and never shared

### `serviceAccountKey.example.json`
Example template showing the structure of the service account key file.

## Setup

1. Download service account key from Firebase Console
2. Save as `serviceAccountKey.json` in this directory
3. Install dependencies: `npm install firebase-admin`
4. Use the functions in `send-notification.js`

## Usage Example

```javascript
const { sendNotificationToDevice } = require('./send-notification');

// Send to single device
await sendNotificationToDevice(
    'fcm-token-here',
    {
        title: 'New Event',
        body: 'Check out our upcoming event!',
        icon: '/logo.png'
    },
    {
        click_action: '/events.html',
        eventId: '123'
    }
);
```

## Security

- Never commit `serviceAccountKey.json` to version control
- Use environment variables in production
- Restrict API access in Firebase Console
- Rotate keys periodically

