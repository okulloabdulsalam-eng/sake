# Quick Start: Run Notification Database Tests

## 🚀 Fastest Solution (5 minutes)

### Step 1: Start XAMPP Services

1. Open **XAMPP Control Panel**
   - Press `Win + R`
   - Type: `C:\xampp\xampp-control.exe`
   - Press Enter

2. Click **"Start"** for:
   - ✅ **Apache** (must be green/Running)
   - ✅ **MySQL** (must be green/Running)

### Step 2: Check if Apache is Working

Open browser and go to:
```
http://localhost/
```
If you see XAMPP dashboard → ✅ Apache is running!
If connection refused → Apache not started yet, wait a moment and refresh

### Step 3: Access Test File

Since your project is at: `E:\ALL WEBSITES\xaa\htdocs\kimu-mob-html`

You have 2 options:

#### Option A: Create Virtual Host (Best for development)
1. Edit `C:\xampp\apache\conf\extra\httpd-vhosts.conf`
2. Add this at the end:
```apache
<VirtualHost *:80>
    DocumentRoot "E:/ALL WEBSITES/xaa/htdocs/kimu-mob-html"
    ServerName kiuma.test
    <Directory "E:/ALL WEBSITES/xaa/htdocs/kimu-mob-html">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

3. Edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator)
   - Add line: `127.0.0.1    kiuma.test`

4. Restart Apache in XAMPP Control Panel

5. Access: `http://kiuma.test/test_notifications_db.php`

#### Option B: Copy to htdocs (Easiest)
1. Copy your project folder to: `C:\xampp\htdocs\kimu-mob-html`
2. Access: `http://localhost/kimu-mob-html/test_notifications_db.php`

### Step 4: Run the Test

Once Apache is running, open:
```
http://localhost/kimu-mob-html/test_notifications_db.php
```
OR (if using virtual host):
```
http://kiuma.test/test_notifications_db.php
```

## ⚠️ Still Getting Connection Refused?

### Check 1: Is Apache Running?
- XAMPP Control Panel → Apache should show "Running" (green)
- If red → Click "Start" and wait

### Check 2: Port Conflict?
- If Apache won't start, port 80 might be in use
- Close Skype
- Stop IIS: Open PowerShell as Admin → `net stop w3svc`
- Try starting Apache again

### Check 3: Test Basic PHP
Create `test.php` in your project:
```php
<?php echo "Working!"; ?>
```
Access: `http://localhost/kimu-mob-html/test.php`
Should show "Working!" if PHP is working

## ✅ Success Indicators

When everything works, you should see:
- ✅ Database connection successful
- ✅ Table structure displayed
- ✅ Test notifications created
- ✅ All tests passing (green checkmarks)

## 📝 Next Steps After Test

Once tests pass:
1. Review test results
2. Clean up test notifications (instructions shown in test output)
3. Delete test files for security: `test_notifications_db.php`, `test_notifications_cli.php`

---

**Need more help?** See `TROUBLESHOOT_TEST.md` for detailed troubleshooting.

