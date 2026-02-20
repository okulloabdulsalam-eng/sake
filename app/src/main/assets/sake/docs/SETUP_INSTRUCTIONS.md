# KIUMA Recruitment Backend Setup Instructions

This guide will help you set up the PHP/MySQL backend for the KIUMA recruitment form.

## Prerequisites

- PHP 7.4 or higher
- MySQL/MariaDB database
- Web server (Apache/Nginx) with PHP support
- Twilio account (for WhatsApp notifications)
- Email service (SMTP or server mail function)

---

## Step 1: Database Setup

### 1.1 Create Database

```sql
CREATE DATABASE IF NOT EXISTS kiuma_recruitment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kiuma_recruitment;
```

### 1.2 Create Table

Run the SQL script from `database/schema.sql`:

```bash
mysql -u root -p kiuma_recruitment < database/schema.sql
```

Or import via phpMyAdmin:
1. Login to phpMyAdmin
2. Select `kiuma_recruitment` database
3. Click "Import" tab
4. Choose `database/schema.sql` file
5. Click "Go"

---

## Step 2: Configure Database Connection

Edit `config/database.php` and update these values:

```php
define('DB_HOST', 'localhost');        // Your MySQL host
define('DB_USER', 'your_username');    // Your MySQL username
define('DB_PASS', 'your_password');    // Your MySQL password
define('DB_NAME', 'kiuma_recruitment'); // Database name
```

---

## Step 3: Configure Email Notifications

### Option A: Using PHP mail() Function (Simplest)

Edit `config/database.php`:

```php
define('EMAIL_TO', 'aworshibah2006@gmail.com');
define('EMAIL_FROM', 'noreply@yourdomain.com'); // Use your domain email
```

**Note:** The `mail()` function may not work on all hosting providers. For better reliability, use SMTP (Option B).

### Option B: Using SMTP (Recommended - Gmail Example)

1. **Install PHPMailer** (if not already installed):

```bash
composer require phpmailer/phpmailer
```

Or download manually from: https://github.com/PHPMailer/PHPMailer

2. **Enable Gmail App Password**:
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Configure in `config/database.php`**:

```php
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'your-email@gmail.com');
define('SMTP_PASSWORD', 'your-16-character-app-password');
define('SMTP_ENCRYPTION', 'tls');
```

**For Other Email Providers:**

| Provider | SMTP Host | Port | Encryption |
|----------|-----------|------|------------|
| Gmail | smtp.gmail.com | 587 | tls |
| Outlook | smtp-mail.outlook.com | 587 | tls |
| Yahoo | smtp.mail.yahoo.com | 587 | tls |
| Custom | smtp.yourdomain.com | 587/465 | tls/ssl |

---

## Step 4: Configure WhatsApp Notifications (Twilio)

### 4.1 Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. Verify your phone number
4. Navigate to Console Dashboard

### 4.2 Get Twilio Credentials

1. In Twilio Console, find:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)

2. Note these values securely.

### 4.3 Set Up WhatsApp Sandbox

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox:
   - Send the provided code to the Twilio WhatsApp number
   - Your phone number will be added to the sandbox

3. Copy the **WhatsApp From** number (format: `whatsapp:+14155238886`)

### 4.4 Configure in `config/database.php`

```php
define('WHATSAPP_TO', '+256703268522'); // Your WhatsApp number with country code
define('WHATSAPP_FROM', 'whatsapp:+14155238886'); // Your Twilio WhatsApp number
define('TWILIO_ACCOUNT_SID', 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'); // Your Account SID
define('TWILIO_AUTH_TOKEN', 'your_auth_token_here'); // Your Auth Token
```

### 4.5 Production WhatsApp Setup (Optional)

To send WhatsApp messages without the sandbox:

1. Request production access from Twilio
2. Get a WhatsApp Business API approved number
3. Update `WHATSAPP_FROM` with your approved number

**Alternative: Using Meta Cloud API**

If you prefer Meta (Facebook) Cloud API instead of Twilio, you'll need to:

1. Create a Meta Developer account
2. Set up a WhatsApp Business Account
3. Get API credentials
4. Modify `sendWhatsAppNotification()` function in `api/submit_recruit.php` to use Meta API

---

## Step 5: File Permissions

Ensure proper file permissions:

```bash
chmod 644 config/database.php
chmod 755 api/
chmod 644 api/submit_recruit.php
```

**Important:** The `config/database.php` file contains sensitive information. Ensure it's:
- Not accessible via web browser (use `.htaccess` if needed)
- Not committed to public repositories

---

## Step 6: Test the Setup

### 6.1 Test Database Connection

Create a test file `test_db.php`:

```php
<?php
require_once 'config/database.php';
$pdo = getDBConnection();
echo "Database connection successful!";
?>
```

Access via browser: `http://yourdomain.com/test_db.php`

### 6.2 Test Form Submission

1. Open `api/join_us_form.php` in your browser
2. Fill out the form
3. Submit and check:
   - Database for new record
   - Email inbox for notification
   - WhatsApp for message

---

## Step 7: Security Considerations

### 7.1 Protect Configuration File

Create `.htaccess` in `config/` directory:

```apache
Order Deny,Allow
Deny from all
```

### 7.2 Input Sanitization

The code already uses:
- PDO prepared statements (SQL injection protection)
- Email validation
- Input trimming

### 7.3 Rate Limiting (Recommended)

Add rate limiting to prevent spam. Example using session:

```php
session_start();
if (isset($_SESSION['last_submit']) && (time() - $_SESSION['last_submit']) < 60) {
    die(json_encode(['success' => false, 'message' => 'Please wait before submitting again.']));
}
$_SESSION['last_submit'] = time();
```

---

## Troubleshooting

### Email Not Sending

1. **Check PHP mail() function:**
   ```php
   <?php
   if (mail('test@example.com', 'Test', 'Test message')) {
       echo "Mail function works";
   } else {
       echo "Mail function failed";
   }
   ?>
   ```

2. **Check server logs:**
   - PHP error log
   - Mail server log

3. **Try SMTP instead of mail()** (more reliable)

### WhatsApp Not Sending

1. **Verify Twilio credentials are correct**
2. **Check if phone number is in sandbox** (for testing)
3. **Check Twilio Console logs** for error messages
4. **Verify phone number format:** Include country code (e.g., +256 for Uganda)

### Database Connection Issues

1. **Check credentials in `config/database.php`**
2. **Verify MySQL service is running**
3. **Check user permissions:**
   ```sql
   GRANT ALL PRIVILEGES ON kiuma_recruitment.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

---

## File Structure

```
project/
├── api/
│   ├── submit_recruit.php    # Main submission handler
│   └── join_us_form.php      # HTML form
├── config/
│   └── database.php          # Configuration file
├── database/
│   └── schema.sql            # Database schema
└── SETUP_INSTRUCTIONS.md     # This file
```

---

## Support

For issues or questions:
- Check PHP error logs
- Check MySQL error logs
- Review Twilio Console logs
- Verify all configuration values

---

## Production Deployment Checklist

- [ ] Database created and table structure imported
- [ ] Database credentials configured
- [ ] Email SMTP configured and tested
- [ ] WhatsApp Twilio credentials configured
- [ ] File permissions set correctly
- [ ] `.htaccess` protection for config directory
- [ ] Error logging enabled
- [ ] Rate limiting implemented
- [ ] HTTPS enabled (for secure data transmission)
- [ ] Backups configured for database

