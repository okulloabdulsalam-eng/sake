# WhatsApp Integration Setup Guide

This guide will help you set up WhatsApp messaging for automatic notifications.

## Overview

The system supports two WhatsApp services:
1. **Twilio WhatsApp API** (Recommended for quick setup)
2. **Meta WhatsApp Business API** (Official, more complex)

---

## Option 1: Twilio WhatsApp API (Recommended)

### Step 1: Create Twilio Account

1. Go to: https://www.twilio.com/
2. Sign up for a free account
3. Verify your email and phone number

### Step 2: Get Twilio Credentials

1. Log in to Twilio Console
2. Go to **Dashboard**
3. Copy your:
   - **Account SID**
   - **Auth Token**

### Step 3: Enable WhatsApp Sandbox

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to join the sandbox
3. Send the join code to the Twilio WhatsApp number
4. Your WhatsApp number is now connected

### Step 4: Configure in Code

Edit `api/whatsapp_integration.php`:

```php
define('WHATSAPP_SERVICE', 'twilio');
define('TWILIO_ACCOUNT_SID', 'your_account_sid_here');
define('TWILIO_AUTH_TOKEN', 'your_auth_token_here');
define('TWILIO_WHATSAPP_NUMBER', '+14155238886'); // Default sandbox number
```

### Step 5: Test

1. Use the test function in `whatsapp_integration.php`
2. Or send a notification through the admin panel

### Pricing

- **Sandbox**: Free (limited to pre-approved numbers)
- **Production**: Pay-per-message pricing
- Check: https://www.twilio.com/whatsapp/pricing

---

## Option 2: Meta WhatsApp Business API

### Step 1: Create Meta Business Account

1. Go to: https://business.facebook.com/
2. Create a Business Account
3. Verify your business

### Step 2: Set Up WhatsApp Business Account

1. Go to: https://business.facebook.com/settings/whatsapp-business-accounts
2. Create a WhatsApp Business Account
3. Add a phone number (must be verified)

### Step 3: Create Meta App

1. Go to: https://developers.facebook.com/
2. Click **My Apps** → **Create App**
3. Choose **Business** type
4. Add **WhatsApp** product

### Step 4: Get Credentials

1. In your app, go to **WhatsApp** → **Getting Started**
2. Copy:
   - **Phone Number ID**
   - **Temporary Access Token** (for testing)
3. For production, generate a **Permanent Access Token**

### Step 5: Configure in Code

Edit `api/whatsapp_integration.php`:

```php
define('WHATSAPP_SERVICE', 'meta');
define('META_PHONE_NUMBER_ID', 'your_phone_number_id');
define('META_ACCESS_TOKEN', 'your_access_token');
```

### Step 6: Test

1. Use the test function
2. Or send a notification through the admin panel

### Pricing

- **Free tier**: 1,000 conversations/month
- **Paid**: Pay-per-conversation
- Check: https://developers.facebook.com/docs/whatsapp/pricing

---

## Testing Your Setup

### Method 1: Test Function

Create a test file `test_whatsapp.php`:

```php
<?php
require_once 'api/whatsapp_integration.php';

$result = testWhatsAppSending('+256703268522'); // Your test number
print_r($result);
?>
```

### Method 2: Via Admin Panel

1. Log in as admin
2. Go to Notifications page
3. Add a notification
4. Choose to send to all users
5. Check if messages are received

---

## Troubleshooting

### Twilio Issues

**Error: "The number +1234567890 is not a valid WhatsApp number"**
- Solution: Make sure the number is in E.164 format (+country code + number)
- Solution: Verify the number is added to Twilio sandbox

**Error: "Authentication failed"**
- Solution: Check Account SID and Auth Token are correct
- Solution: Make sure credentials are in `whatsapp_integration.php`

### Meta Issues

**Error: "Invalid OAuth access token"**
- Solution: Regenerate access token in Meta App settings
- Solution: Check token hasn't expired

**Error: "Phone number not verified"**
- Solution: Complete phone number verification in Meta Business Manager
- Solution: Wait for verification to complete (can take 24 hours)

### General Issues

**Messages not sending:**
1. Check API credentials are correct
2. Check phone numbers are in correct format (+country code)
3. Check service is enabled in `whatsapp_integration.php`
4. Check server logs for errors
5. Verify API service account has credits/balance

---

## Security Notes

⚠️ **IMPORTANT:**
- **NEVER commit credentials to Git**
- Store credentials in environment variables or secure config
- Use `.gitignore` to exclude `whatsapp_integration.php` if it contains credentials
- Or use a separate config file that's not in version control

**Recommended:**
- Create `api/whatsapp_integration.local.php` (not in Git)
- Load credentials from environment variables
- Use secure credential management

---

## Production Checklist

- [ ] Choose WhatsApp service (Twilio or Meta)
- [ ] Create account and get credentials
- [ ] Configure `whatsapp_integration.php`
- [ ] Test with a real phone number
- [ ] Verify messages are received
- [ ] Set up error logging
- [ ] Monitor usage and costs
- [ ] Set up rate limiting
- [ ] Secure credentials (environment variables)
- [ ] Test automatic notifications (white days, fasting reminders)

---

## Next Steps

After setup:
1. Test sending a notification
2. Verify automatic triggers work (white days, fasting reminders)
3. Monitor costs and usage
4. Set up webhook for delivery receipts (optional)
5. Add message templates (for Meta Business API)

---

## Support

- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Meta WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **Twilio Support**: https://support.twilio.com/
- **Meta Support**: https://developers.facebook.com/support/

