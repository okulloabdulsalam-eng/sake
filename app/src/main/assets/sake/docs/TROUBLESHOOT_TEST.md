# Troubleshooting: Test Notifications Database Connection Error

## Error: "ERR_CONNECTION_REFUSED" or "localhost refused to connect"

This means Apache (web server) is not running in XAMPP.

## ✅ Quick Fix Steps

### Step 1: Start XAMPP Services

1. **Open XAMPP Control Panel**
   - Press `Win + R`
   - Type: `C:\xampp\xampp-control.exe` (or search "XAMPP" in Start Menu)
   - Press Enter

2. **Start Apache**
   - Click the **"Start"** button next to Apache
   - Wait until it shows "Running" (green indicator)
   - If Apache fails to start, check for port conflicts (see below)

3. **Start MySQL**
   - Click the **"Start"** button next to MySQL
   - Wait until it shows "Running" (green indicator)
   - MySQL is needed for database tests

### Step 2: Verify Services Are Running

- ✅ Apache should show "Running" in green
- ✅ MySQL should show "Running" in green
- ⚠️ Red means the service is stopped
- ⚠️ Yellow/Orange means starting but not ready yet

### Step 3: Test the URL

Open your browser and try:
```
http://localhost/kimu-mob-html/test_notifications_db.php
```

**Important:** Make sure to include:
- `http://` at the beginning
- `/kimu-mob-html/` in the path (matching your folder name in htdocs)
- The full filename: `test_notifications_db.php`

## 🔍 Alternative URLs to Try

If the above doesn't work, try these variations:

1. **With http://**
   ```
   http://localhost/kimu-mob-html/test_notifications_db.php
   ```

2. **If folder is named differently**
   ```
   http://localhost/test_notifications_db.php
   ```
   (Only works if the file is directly in htdocs)

3. **Using 127.0.0.1 instead of localhost**
   ```
   http://127.0.0.1/kimu-mob-html/test_notifications_db.php
   ```

4. **Check if Apache is responding at all**
   ```
   http://localhost/
   ```
   Should show XAMPP dashboard or directory listing

## ⚠️ Common Issues and Solutions

### Issue 1: Apache Won't Start

**Error:** "Port 80 already in use" or Apache stops immediately

**Solutions:**
- **Option A:** Stop other web servers
  - Close Skype (often uses port 80)
  - Stop IIS if running: `net stop w3svc` (run as Administrator)
  - Stop other Apache/Nginx instances

- **Option B:** Change Apache port
  1. Open XAMPP Control Panel
  2. Click "Config" next to Apache
  3. Select "httpd.conf"
  4. Find `Listen 80` and change to `Listen 8080`
  5. Save and restart Apache
  6. Access via: `http://localhost:8080/kimu-mob-html/test_notifications_db.php`

### Issue 2: MySQL Won't Start

**Error:** Port 3306 already in use

**Solutions:**
- Stop other MySQL instances
- Or change MySQL port in XAMPP Control Panel > MySQL > Config > my.ini
- Change `port=3306` to `port=3307` (or another available port)

### Issue 3: File Not Found (404 Error)

**Error:** "404 Not Found" instead of connection refused

**Solutions:**
- Verify file exists at: `C:\xampp\htdocs\kimu-mob-html\test_notifications_db.php`
- Check folder name matches URL: `http://localhost/[FOLDER_NAME]/test_notifications_db.php`
- Try accessing parent directory: `http://localhost/kimu-mob-html/` (should show file list)

### Issue 4: PHP Errors Instead of Test Results

**Error:** Shows PHP errors or blank page

**Solutions:**
- Check PHP is enabled in Apache
- Check `error_log` in XAMPP Control Panel > Apache > Logs
- Verify database connection in `api/library_media_config.php`
- Check database `kiuma_main` exists in phpMyAdmin

## 🧪 Verify Setup

### Test 1: Check Apache is Running
```
http://localhost/
```
Should show XAMPP dashboard or directory listing.

### Test 2: Check PHP is Working
Create a test file `phpinfo.php` in your project folder:
```php
<?php phpinfo(); ?>
```
Access: `http://localhost/kimu-mob-html/phpinfo.php`
Should show PHP configuration page.

### Test 3: Check Database Connection
Access: `http://localhost/kimu-mob-html/test_db.php`
Should show database connection status.

### Test 4: Check File Exists
Try accessing any HTML file:
```
http://localhost/kimu-mob-html/index.html
```
Should load the page.

## 📋 Checklist

Before running the notification database test, verify:

- [ ] XAMPP Control Panel is open
- [ ] Apache status shows "Running" (green)
- [ ] MySQL status shows "Running" (green)
- [ ] Can access `http://localhost/` (XAMPP dashboard)
- [ ] File exists: `C:\xampp\htdocs\kimu-mob-html\test_notifications_db.php`
- [ ] Database `kiuma_main` exists (check phpMyAdmin)
- [ ] Using correct URL: `http://localhost/kimu-mob-html/test_notifications_db.php`

## 🔧 Manual Test (If Browser Fails)

If browser access doesn't work, you can test via command line:

1. Open Command Prompt
2. Navigate to project folder:
   ```
   cd C:\xampp\htdocs\kimu-mob-html
   ```
3. Run PHP directly (if PHP is in PATH):
   ```
   C:\xampp\php\php.exe test_notifications_cli.php
   ```

## 📞 Still Having Issues?

1. **Check XAMPP Logs:**
   - XAMPP Control Panel > Apache > Logs > Error log
   - XAMPP Control Panel > MySQL > Logs

2. **Verify XAMPP Installation:**
   - Ensure XAMPP is properly installed
   - Try reinstalling XAMPP if issues persist

3. **Check Windows Firewall:**
   - May need to allow Apache through firewall
   - Windows Defender may block localhost connections

4. **Test with Simple PHP File:**
   Create `test.php`:
   ```php
   <?php
   echo "PHP is working!";
   ?>
   ```
   Access: `http://localhost/kimu-mob-html/test.php`
   Should show "PHP is working!"

---

**Once Apache is running and you can access the test file, the notification database tests should work!**

