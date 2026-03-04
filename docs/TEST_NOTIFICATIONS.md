# How to Test Notifications System

## 📋 Prerequisites

Before testing, ensure you have:

1. ✅ **Database Setup**
   - Database `kiuma_main` exists in XAMPP
   - Tables `users` and `notifications` exist
   - At least one user with WhatsApp number in database

2. ✅ **Twilio Setup**
   - Twilio Account SID and Auth Token configured in `api/whatsapp_integration.php`
   - WhatsApp Sandbox joined with your test number
   - Test number verified in Twilio Console

3. ✅ **XAMPP Running**
   - Apache server running
   - MySQL server running
   - Project accessible at `http://localhost/kimu-mob-html/`

---

## 🧪 Testing Methods

### Method 1: Test via Notifications Page (Recommended)

**Step 1: Open Notifications Page**
1. Navigate to: `http://localhost/kimu-mob-html/notifications.html`
2. Click **"Admin Login"** button
3. Enter admin password (default: `admin123` or check `config/database.php`)

**Step 2: Create a Test Notification**
1. Click **"Add Notification"** button
2. Fill in:
   - **Title**: "Test Notification"
   - **Message**: "This is a test message from KIUMA"
   - **Icon**: (optional)
3. Click **"Save Notification"**
4. When prompted: **"Do you want to send this notification to all users via WhatsApp and Email?"**
   - Click **"OK"** to send

**Step 3: Check Results**
- Open browser console (F12) to see logs
- Check if WhatsApp messages were sent
- Check database `notifications` table for sent status

---

### Method 2: Test WhatsApp Directly (Quick Test)

**Step 1: Create Test File**

Create a file `test_whatsapp.php` in your project root:

```php
<?php
require_once __DIR__ . '/api/whatsapp_integration.php';

// Test number (must be verified in Twilio sandbox)
$testNumber = '+256703268522'; // Change to your verified number

echo "Testing WhatsApp sending to: $testNumber\n";
echo "---\n";

$result = sendWhatsApp($testNumber, 'Test message from KIUMA notification system. If you receive this, WhatsApp integration is working!');

if ($result['success']) {
    echo "✅ SUCCESS!\n";
    echo "Message: " . $result['message'] . "\n";
    echo "SID: " . ($result['data']['sid'] ?? 'N/A') . "\n";
} else {
    echo "❌ FAILED!\n";
    echo "Error: " . $result['message'] . "\n";
    if (isset($result['data'])) {
        echo "Details: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "\n";
    }
}
?>
```

**Step 2: Run Test**
1. Open browser: `http://localhost/kimu-mob-html/test_whatsapp.php`
2. Check output for success/failure
3. Check your WhatsApp for the test message

---

### Method 3: Test via API Endpoint

**Step 1: Use Browser Console or Postman**

Open browser console on `notifications.html` and run:

```javascript
// Test sending to all users
const formData = new FormData();
formData.append('subject', 'Test Notification');
formData.append('message', 'This is a test message from KIUMA notification system');
formData.append('admin_password', 'admin123'); // Your admin password

fetch('/api/send_notifications_to_all.php', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Result:', data);
    if (data.success) {
        console.log(`✅ Sent to ${data.whatsappSent} users via WhatsApp`);
        console.log(`✅ Sent to ${data.emailSent} users via Email`);
        if (data.whatsappFailed > 0) {
            console.warn(`⚠️ ${data.whatsappFailed} WhatsApp messages failed`);
        }
    } else {
        console.error('❌ Error:', data.message);
    }
})
.catch(error => console.error('Error:', error));
```

---

## 🔍 What to Check

### 1. Database Check

**Check if users exist:**
```sql
SELECT id, firstName, lastName, whatsapp, email 
FROM users 
WHERE whatsapp IS NOT NULL OR email IS NOT NULL;
```

**Check notifications:**
```sql
SELECT id, title, message, sent_to_whatsapp, sent_to_email, created_date 
FROM notifications 
ORDER BY created_date DESC 
LIMIT 5;
```

### 2. Twilio Console Check

1. Go to: https://console.twilio.com/
2. Navigate to **Messaging > Logs**
3. Check for sent messages
4. Look for any error messages

### 3. Browser Console

Open browser console (F12) and check for:
- ✅ Success messages
- ❌ Error messages
- 📊 API response data

---

## 🐛 Troubleshooting

### Issue: "WhatsApp credentials not configured"

**Solution:**
1. Open `api/whatsapp_integration.php`
2. Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
3. Make sure there are no extra spaces

### Issue: "Failed to send WhatsApp message"

**Possible Causes:**
1. **Number not verified in Twilio Sandbox**
   - Go to Twilio Console > Messaging > Try it out > Send a WhatsApp message
   - Join sandbox with your number
   - Send "join [code]" to +14155238886

2. **Wrong number format**
   - Must include country code: `+256703268522`
   - No spaces or dashes

3. **Twilio Sandbox limitations**
   - Can only send to verified numbers
   - For production, need approved WhatsApp Business account

### Issue: "Unauthorized. Admin password required"

**Solution:**
1. Check admin password in `config/database.php` (look for `ADMIN_PASSWORD`)
2. Or check `api/library_media_config.php`
3. Use correct password when prompted

### Issue: "No users found in database"

**Solution:**
1. Add test users to database:
```sql
INSERT INTO users (firstName, lastName, whatsapp, email) 
VALUES ('Test', 'User', '+256703268522', 'test@example.com');
```

2. Make sure users have WhatsApp or Email filled in

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ **Test message received** on WhatsApp
2. ✅ **Console shows**: `WhatsApp message sent successfully via Twilio`
3. ✅ **Database shows**: `sent_to_whatsapp = TRUE` in notifications table
4. ✅ **Twilio Console shows**: Message in logs with status "delivered"

---

## 📝 Test Checklist

- [ ] Database `kiuma_main` exists and has tables
- [ ] At least one user with WhatsApp number in database
- [ ] Twilio credentials configured in `api/whatsapp_integration.php`
- [ ] Test number verified in Twilio Sandbox
- [ ] XAMPP Apache and MySQL running
- [ ] Can access `notifications.html` page
- [ ] Admin login works
- [ ] Can create notification
- [ ] Can send notification to all users
- [ ] WhatsApp message received
- [ ] Database updated with sent status

---

## 🚀 Next Steps After Testing

Once testing is successful:

1. **Add more users** to database
2. **Configure email sending** (currently just prepared, not sent)
3. **Set up production Twilio** (if needed for non-sandbox numbers)
4. **Monitor Twilio usage** to avoid exceeding free tier limits

---

## 📞 Need Help?

Check these files:
- `api/whatsapp_integration.php` - WhatsApp sending logic
- `api/send_notifications_to_all.php` - Bulk sending endpoint
- `TWILIO_SANDBOX_EXPLANATION.md` - Twilio setup details
- `WHATSAPP_SETUP_GUIDE.md` - Complete WhatsApp setup guide

