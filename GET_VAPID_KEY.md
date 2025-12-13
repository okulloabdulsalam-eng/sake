# How to Get Your VAPID Key

Your Firebase configuration is almost complete! You just need to get the VAPID key.

## Steps to Get VAPID Key

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: **kiuma-mob-app**

2. **Navigate to Cloud Messaging Settings**
   - Click the **gear icon** (⚙️) next to "Project Overview"
   - Select **"Project settings"**
   - Click on the **"Cloud Messaging"** tab

3. **Find Web Push Certificates Section**
   - Scroll down to **"Web Push certificates"** section
   - You'll see either:
     - An existing key (copy it)
     - Or a button **"Generate key pair"** (click it to create one)

4. **Copy the VAPID Key**
   - The key will look like: `BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy the entire key

5. **Update fcm-config.js**
   - Open `fcm-config.js`
   - Find the line: `vapidKey: "YOUR_VAPID_KEY_HERE"`
   - Replace `YOUR_VAPID_KEY_HERE` with your actual VAPID key
   - Save the file

## Example

After updating, your `fcm-config.js` should look like:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDOZ1UzDPXuxmGMZTxKcB7CzeWi7esB08c",
    authDomain: "kiuma-mob-app.firebaseapp.com",
    projectId: "kiuma-mob-app",
    storageBucket: "kiuma-mob-app.firebasestorage.app",
    messagingSenderId: "69327390212",
    appId: "1:69327390212:web:10a7f8b52d5ea93d549751",
    measurementId: "G-5CDL6J3L5B",
    vapidKey: "BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Your actual key here
};
```

## Important Notes

- ✅ The VAPID key is required for web push notifications
- ✅ It's safe to include in your frontend code (it's public)
- ✅ Each Firebase project has one VAPID key
- ✅ You can regenerate it if needed (but you'll need to update your code)

## After Getting the VAPID Key

1. Update `fcm-config.js` with the VAPID key
2. Test the integration:
   - Open `notifications.html` in your browser
   - Click "Enable Push Notifications"
   - Check browser console for FCM token
3. You're ready to send push notifications! 🎉

