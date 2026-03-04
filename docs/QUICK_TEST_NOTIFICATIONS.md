# Quick Test - Notifications System

## ⚠️ 404 Error Fix

If you're getting a 404 error, your project needs to be accessible via XAMPP.

### Option 1: Find Your XAMPP htdocs Location

1. **Check XAMPP Control Panel:**
   - Open XAMPP Control Panel
   - Click "Config" next to Apache
   - Click "httpd.conf"
   - Look for `DocumentRoot` (usually `C:\xampp\htdocs` or `D:\xampp\htdocs`)

2. **Copy your project there:**
   - Copy `kimu-mob-html` folder to that location
   - Access: `http://localhost/kimu-mob-html/test_whatsapp.php`

### Option 2: Test Directly via Notifications Page (Easier!)

**You don't need `test_whatsapp.php` - test directly from the notifications page:**

1. **Make sure your project is accessible:**
   - If you can access `http://localhost/kimu-mob-html/notifications.html`, you're good!

2. **Test Steps:**
   - Go to: `http://localhost/kimu-mob-html/notifications.html`
   - Click **"Admin Login"**
   - Enter admin password
   - Click **"Add Notification"**
   - Fill in:
     - Title: "Test Notification"
     - Message: "This is a test message"
   - Click **"Save Notification"**
   - When asked: **"Do you want to send this notification to all users via WhatsApp and Email?"**
   - Click **"OK"**

3. **Check Results:**
   - Open browser console (F12)
   - Look for success/error messages
   - Check your WhatsApp for the message

### Option 3: Test via Browser Console

If you can access `notifications.html`, open browser console (F12) and run:

```javascript
// Test sending to a specific number
fetch('/api/send_notifications_to_all.php', {
    method: 'POST',
    body: (() => {
        const formData = new FormData();
        formData.append('subject', 'Test Notification');
        formData.append('message', 'This is a test message from KIUMA');
        formData.append('admin_password', 'admin123'); // Your admin password
        return formData;
    })()
})
.then(r => r.json())
.then(data => {
    console.log('Result:', data);
    if (data.success) {
        alert(`✅ Sent to ${data.whatsappSent} users via WhatsApp!`);
    } else {
        alert('❌ Error: ' + data.message);
    }
});
```

---

## ✅ What You Need Before Testing

1. **Database Setup:**
   - Database `kiuma_main` exists
   - Table `users` has at least one user with WhatsApp number
   - Example:
   ```sql
   INSERT INTO users (firstName, lastName, whatsapp) 
   VALUES ('Test', 'User', '+256703268522');
   ```

2. **Twilio Setup:**
   - Credentials in `api/whatsapp_integration.php` are correct
   - Your number `+256703268522` is verified in Twilio Sandbox

3. **XAMPP Running:**
   - Apache server running
   - MySQL server running

---

## 🎯 Recommended: Test via Notifications Page

**This is the easiest way - no need for test_whatsapp.php!**

1. Access: `http://localhost/kimu-mob-html/notifications.html`
2. Login as admin
3. Create and send notification
4. Done! ✅

