@echo off
echo ========================================
echo XAMPP Virtual Host Setup for KIUMA
echo ========================================
echo.
echo This script will help you set up a virtual host
echo so you can access: http://kiuma.test/test_notifications_db.php
echo.
echo IMPORTANT: Run this as Administrator!
echo.
pause

echo.
echo Step 1: Adding entry to hosts file...
echo You may need to run this manually as Administrator:
echo.
echo 1. Open Notepad as Administrator
echo 2. Open file: C:\Windows\System32\drivers\etc\hosts
echo 3. Add this line at the end:
echo    127.0.0.1    kiuma.test
echo 4. Save the file
echo.
pause

echo.
echo Step 2: Adding virtual host to Apache...
echo You need to manually edit:
echo C:\xampp\apache\conf\extra\httpd-vhosts.conf
echo.
echo Add this at the end of the file:
echo.
echo ^<VirtualHost *:80^>
echo     DocumentRoot "E:/ALL WEBSITES/xaa/htdocs/kimu-mob-html"
echo     ServerName kiuma.test
echo     ^<Directory "E:/ALL WEBSITES/xaa/htdocs/kimu-mob-html"^>
echo         Options Indexes FollowSymLinks
echo         AllowOverride All
echo         Require all granted
echo     ^</Directory^>
echo ^</VirtualHost^>
echo.
pause

echo.
echo Step 3: Enable virtual hosts in httpd.conf
echo Open: C:\xampp\apache\conf\httpd.conf
echo Find this line (usually around line 480):
echo    #Include conf/extra/httpd-vhosts.conf
echo.
echo Remove the # to uncomment it:
echo    Include conf/extra/httpd-vhosts.conf
echo.
pause

echo.
echo ========================================
echo Setup Instructions Complete!
echo ========================================
echo.
echo After completing the steps above:
echo 1. Restart Apache in XAMPP Control Panel
echo 2. Access: http://kiuma.test/test_notifications_db.php
echo.
pause

