# KIUMA Database Setup Guide for XAMPP

This guide will help you set up all the database tables for the KIUMA system in XAMPP.

## Quick Setup

### Option 1: Using phpMyAdmin (Recommended)

1. **Open phpMyAdmin:**
   - Start XAMPP
   - Open your browser and go to: `http://localhost/phpmyadmin`

2. **Import the SQL file:**
   - Click on "Import" tab at the top
   - Click "Choose File" button
   - Select `database/kiuma_complete_schema.sql`
   - Click "Go" button
   - Wait for the import to complete

3. **Verify:**
   - You should see a database named `kiuma_main`
   - It should contain 11 tables:
     - users
     - library_books
     - media_files
     - notifications
     - prayer_times
     - recruits
     - events
     - activities
     - questions
     - payments
     - admin_logs

### Option 2: Using MySQL Command Line

1. **Open Command Prompt/Terminal:**
   - Navigate to your project directory

2. **Run the SQL file:**
   ```bash
   mysql -u root -p < database/kiuma_complete_schema.sql
   ```
   - Enter your MySQL root password when prompted
   - (If no password, use: `mysql -u root < database/kiuma_complete_schema.sql`)

3. **Verify:**
   ```bash
   mysql -u root -p
   ```
   Then in MySQL:
   ```sql
   USE kiuma_main;
   SHOW TABLES;
   ```

## Database Tables Overview

### 1. **users**
   - Stores user accounts (registration, login)
   - Fields: email, password, firstName, lastName, whatsapp, gender

### 2. **library_books**
   - Stores book information for the library
   - Fields: title, author, isbn, category, Google Drive file info

### 3. **media_files**
   - Stores media files (videos, audio, images)
   - Fields: file_name, file_type, Google Drive file info

### 4. **notifications**
   - Stores system notifications
   - Fields: title, message, type, sent status

### 5. **prayer_times**
   - Stores prayer times (can be updated by admin)
   - Fields: prayer_name, adhan_time, iqaama_time, date

### 6. **recruits**
   - Stores recruitment form submissions
   - Fields: fullname, email, phone, role, status

### 7. **events**
   - Stores events information
   - Fields: title, description, event_date, location

### 8. **activities**
   - Stores activities information
   - Fields: title, description, category, image_url

### 9. **questions**
   - Stores user questions
   - Fields: question, answer, status

### 10. **payments**
   - Tracks payments/donations
   - Fields: amount, payment_method, status, transaction_id

### 11. **admin_logs**
   - Tracks admin actions for security
   - Fields: admin_user, action, details, ip_address

## Configuration

After creating the database, update your configuration files:

### For Library/Media System:
Edit `api/library_media_config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // XAMPP default is empty
define('DB_NAME', 'kiuma_main');
```

### For Recruitment System:
Edit `config/database.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');  // XAMPP default is empty
define('DB_NAME', 'kiuma_main');  // Or use 'kiuma_recruitment' if separate
```

## Testing the Database

1. **Test connection:**
   - Open `test_db.php` in your browser
   - Should show "Database connection successful"

2. **Check tables:**
   - In phpMyAdmin, select `kiuma_main` database
   - Click "Structure" tab
   - You should see all 11 tables listed

## Default Data

The schema includes default prayer times for today. You can:
- Update them via the admin panel
- Or manually edit in phpMyAdmin

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"
- Check your MySQL password in XAMPP
- Update the password in configuration files

### Error: "Table already exists"
- The tables are already created
- You can either:
  - Drop the database and recreate: `DROP DATABASE kiuma_main;`
  - Or use `CREATE TABLE IF NOT EXISTS` (already in the SQL file)

### Error: "Unknown database"
- Make sure you ran the SQL file completely
- Check that `kiuma_main` database exists in phpMyAdmin

## Next Steps

1. ✅ Database created
2. ⬜ Update configuration files with database credentials
3. ⬜ Test database connection
4. ⬜ Start using the system!

## Support

If you encounter issues:
1. Check XAMPP MySQL is running (green in XAMPP Control Panel)
2. Verify database name matches in config files
3. Check MySQL error logs in XAMPP

