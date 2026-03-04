# XAMPP Setup Guide - Accessing Your Project

## Problem: 404 Error on localhost/test_db.php

This happens because your project is not in XAMPP's `htdocs` directory.

## Solution Options

### Option 1: Copy Project to htdocs (Easiest)

1. **Find your XAMPP htdocs folder:**
   - Usually: `C:\xampp\htdocs\`
   - Or check XAMPP Control Panel → Config → Apache → httpd.conf → DocumentRoot

2. **Copy your project:**
   - Copy entire `kimu-mob-html` folder to `C:\xampp\htdocs\`
   - Result: `C:\xampp\htdocs\kimu-mob-html\`

3. **Access your files:**
   - `http://localhost/kimu-mob-html/test_db.php`
   - `http://localhost/kimu-mob-html/index.html`
   - `http://localhost/kimu-mob-html/api/...`

### Option 2: Create Virtual Host (Recommended for Development)

1. **Edit Apache httpd-vhosts.conf:**
   - Open: `C:\xampp\apache\conf\extra\httpd-vhosts.conf`
   - Add at the end:
   ```apache
   <VirtualHost *:80>
       DocumentRoot "E:/ALL WEBSITES/kimu-mob-html"
       ServerName kiuma.local
       <Directory "E:/ALL WEBSITES/kimu-mob-html">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

2. **Edit Windows hosts file:**
   - Open: `C:\Windows\System32\drivers\etc\hosts` (as Administrator)
   - Add line:
   ```
   127.0.0.1    kiuma.local
   ```

3. **Restart Apache in XAMPP**

4. **Access your files:**
   - `http://kiuma.local/test_db.php`
   - `http://kiuma.local/index.html`

### Option 3: Use Symbolic Link (Advanced)

1. **Open Command Prompt as Administrator:**
   ```cmd
   mklink /D "C:\xampp\htdocs\kimu-mob-html" "E:\ALL WEBSITES\kimu-mob-html"
   ```

2. **Access:**
   - `http://localhost/kimu-mob-html/test_db.php`

## Quick Test

After setting up, test the database connection:

1. **Start XAMPP:**
   - Open XAMPP Control Panel
   - Start Apache
   - Start MySQL

2. **Access test file:**
   - Option 1: `http://localhost/kimu-mob-html/test_db.php`
   - Option 2: `http://kiuma.local/test_db.php` (if using virtual host)

3. **Expected result:**
   - ✓ Database connection successful!
   - List of all tables in `kiuma_main`
   - Table structures and record counts

## Troubleshooting

### Still getting 404?
- Check Apache is running (green in XAMPP Control Panel)
- Verify file path is correct
- Check Apache error logs: `C:\xampp\apache\logs\error.log`

### Database connection error?
- Check MySQL is running (green in XAMPP Control Panel)
- Verify database `kiuma_main` exists in phpMyAdmin
- Check `config/database.php` has correct credentials

### Permission denied?
- Make sure Apache has read permissions to your project folder
- Check Windows folder permissions

## Recommended Setup

For development, I recommend **Option 2 (Virtual Host)** because:
- ✅ Keeps your project in its current location
- ✅ Clean URLs (`kiuma.local` instead of `localhost/kimu-mob-html`)
- ✅ No need to copy files
- ✅ Better for version control

