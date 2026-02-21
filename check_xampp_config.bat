@echo off
echo Checking XAMPP Configuration...
echo.
echo Your project is at: E:\ALL WEBSITES\xaa\htdocs\kimu-mob-html
echo.

echo Checking if XAMPP httpd.conf exists...
if exist "C:\xampp\apache\conf\httpd.conf" (
    echo Found httpd.conf
    echo.
    echo Checking DocumentRoot...
    findstr /i "DocumentRoot" "C:\xampp\apache\conf\httpd.conf"
    echo.
    echo If DocumentRoot shows "E:/ALL WEBSITES" or similar, 
    echo your XAMPP is already configured for this location!
    echo.
) else (
    echo XAMPP not found at C:\xampp
    echo Please check your XAMPP installation path.
)

echo.
echo ========================================
echo Quick Access Options:
echo ========================================
echo.
echo Option 1: If XAMPP DocumentRoot is already set to your location:
echo    Access: http://localhost/test_notifications_db.php
echo.
echo Option 2: If you need to set up virtual host:
echo    See VHOST_SETUP.md for instructions
echo.
echo Option 3: Quick test - copy to standard htdocs:
echo    Copy to: C:\xampp\htdocs\kimu-mob-html
echo    Access: http://localhost/kimu-mob-html/test_notifications_db.php
echo.
pause

