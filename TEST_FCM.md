# Testing FCM Integration

## Quick Test

1. **Open the test page:**
   - Open `test-fcm-setup.html` in your browser
   - Or open `notifications.html` and click "Enable Push Notifications"

2. **Check browser console:**
   - Press F12 to open Developer Tools
   - Look for FCM initialization messages
   - Check for any errors

3. **Verify configuration:**
   - The test page will automatically check your configuration
   - Look for any red error messages
   - Fix any missing values

## Step-by-Step Testing

### Step 1: Configuration Check
- Open `test-fcm-setup.html`
- Click "Check Configuration"
- Verify all fields show ✅ (green)
- If VAPID key shows ❌, you need to add it (see GET_VAPID_KEY.md)

### Step 2: Test Initialization
- Click "Test Initialization"
- Should see: "✅ FCM initialized successfully!"
- If error, check browser console for details

### Step 3: Request Permission
- Click "Request Permission"
- Browser will show permission prompt
- Click "Allow"
- Should see: "✅ Notification permission granted!"

### Step 4: Get FCM Token
- Click "Get FCM Token"
- Token will appear in the display box
- Copy the token for server-side testing

## Common Issues

### "VAPID key missing"
**Solution:** Get VAPID key from Firebase Console (see GET_VAPID_KEY.md)

### "Service Worker registration failed"
**Solution:** 
- Ensure you're using HTTPS (or localhost)
- Check that `firebase-messaging-sw.js` is in root directory
- Verify file is accessible

### "Permission denied"
**Solution:**
- User must manually enable in browser settings
- Chrome: Settings > Privacy > Site Settings > Notifications
- Clear site data and try again

### "Firebase SDK not loaded"
**Solution:**
- Check internet connection
- Verify script tags are correct in HTML
- Check browser console for 404 errors

## Testing Server-Side Sending

After getting your FCM token:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get service account key:**
   - Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save as `server/serviceAccountKey.json`

3. **Create test script:**
   ```javascript
   const { sendNotificationToDevice } = require('./server/send-notification');
   
   sendNotificationToDevice(
       'YOUR_FCM_TOKEN_HERE', // From browser
       {
           title: 'Test Notification',
           body: 'Hello from FCM!',
           icon: '/logo.png'
       },
       {
           click_action: '/notifications.html'
       }
   ).then(result => console.log(result));
   ```

4. **Run test:**
   ```bash
   node test-send.js
   ```

## Success Indicators

✅ Configuration check passes  
✅ FCM initializes without errors  
✅ Permission granted  
✅ FCM token retrieved  
✅ Service worker registered  
✅ Test notification received  

## Next Steps

Once testing passes:
1. Store FCM tokens in your database
2. Create API endpoint to save tokens
3. Integrate with your notification system
4. Test sending notifications from server

