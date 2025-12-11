# Virtual Host Setup for XAMPP

Since your project is at `E:\ALL WEBSITES\xaa\htdocs\kimu-mob-html`, set up a virtual host so you can access it easily.

## 📋 Setup Steps

### Step 1: Edit Windows Hosts File

1. **Open Notepad as Administrator:**
   - Press `Win + X`
   - Select "Windows Terminal (Admin)" or "Command Prompt (Admin)"
   - Type: `notepad C:\Windows\System32\drivers\etc\hosts`
   - Press Enter
   - Click "Yes" if prompted for permission

2. **Add this line at the end of the file:**
   ```
   127.0.0.1    kiuma.test
   ```

3. **Save the file** (Ctrl+S)
   - If it says "Access Denied", make sure Notepad was opened as Administrator

### Step 2: Edit Apache Virtual Hosts Configuration

1. **Open the virtual hosts file:**
   - Navigate to: `C:\xampp\apache\conf\extra\httpd-vhosts.conf`
   - Open with Notepad or any text editor

2. **Add this at the END of the file:**
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

3. **Save the file**

### Step 3: Enable Virtual Hosts in Apache

1. **Open Apache main config file:**
   - Navigate to: `C:\xampp\apache\conf\httpd.conf`
   - Open with Notepad

2. **Find this line** (usually around line 480):
   ```apache
   #Include conf/extra/httpd-vhosts.conf
   ```

3. **Remove the `#` to uncomment it:**
   ```apache
   Include conf/extra/httpd-vhosts.conf
   ```

4. **Save the file**

### Step 4: Restart Apache

1. Open **XAMPP Control Panel**
2. Click **"Stop"** next to Apache
3. Wait a moment
4. Click **"Start"** next to Apache
5. Wait until it shows **"Running"** (green)

### Step 5: Test!

Open your browser and go to:
```
http://kiuma.test/test_notifications_db.php
```

You should now see the notification database test page!

## 🔧 Alternative: Quick Test Without Virtual Host

If you don't want to set up a virtual host right now, you can:

1. **Copy your project to htdocs:**
   - Copy folder to: `C:\xampp\htdocs\kimu-mob-html`
   - Access: `http://localhost/kimu-mob-html/test_notifications_db.php`

2. **Or check if XAMPP is configured differently:**
   - Some XAMPP installations use a custom document root
   - Check XAMPP Control Panel → Apache → Config → httpd.conf
   - Look for `DocumentRoot` - it might already point to your location

## ✅ Verification Checklist

After setup:
- [ ] Apache is running (green in XAMPP)
- [ ] MySQL is running (green in XAMPP)
- [ ] Can access `http://localhost/` (XAMPP dashboard)
- [ ] Can access `http://kiuma.test/` (your project)
- [ ] Can access `http://kiuma.test/test_notifications_db.php` (test file)

## 🐛 Troubleshooting

### Issue: "This site can't be reached" for kiuma.test

**Solution:**
- Check hosts file was saved correctly
- Try: `http://127.0.0.1/test_notifications_db.php` (using IP instead of domain)
- Restart browser after editing hosts file
- Flush DNS: Open Command Prompt as Admin → `ipconfig /flushdns`

### Issue: Apache won't start after editing httpd-vhosts.conf

**Solution:**
- Check for syntax errors in the VirtualHost block
- Make sure paths use forward slashes `/` not backslashes `\`
- Check Apache error log: `C:\xampp\apache\logs\error.log`

### Issue: "403 Forbidden" error

**Solution:**
- Check the `<Directory>` block has `Require all granted`
- Verify the path in DocumentRoot is correct
- Check Windows folder permissions

---

**Once virtual host is set up, you can access all your files via:**
- `http://kiuma.test/` - Project root
- `http://kiuma.test/test_notifications_db.php` - Test file
- `http://kiuma.test/index.html` - Home page
- etc.

