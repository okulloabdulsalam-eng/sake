# Notification Database Testing Guide

This guide explains how to test the notification database functionality.

## 📋 Available Test Files

### 1. `test_notifications_db.php` - Browser-based Test (Recommended)
Comprehensive HTML-based test with visual results, perfect for XAMPP setup.

**How to run:**
1. Make sure XAMPP Apache and MySQL are running
2. Open your browser
3. Navigate to: `http://localhost/kimu-mob-html/test_notifications_db.php`
4. View the test results in the browser

**Features:**
- ✅ Visual test results with color coding
- ✅ Detailed table displays of database records
- ✅ Statistics and summaries
- ✅ Easy to understand pass/fail indicators
- ✅ Shows SQL queries and responses

### 2. `test_notifications_cli.php` - Command Line Test
Simpler CLI version for quick testing via terminal.

**How to run:**
1. Open terminal/command prompt
2. Navigate to project directory
3. Run: `php test_notifications_cli.php`
   - Or if PHP is in XAMPP: `C:\xampp\php\php.exe test_notifications_cli.php`
4. View results in terminal

**Note:** Can also be run via browser at: `http://localhost/kimu-mob-html/test_notifications_cli.php`

## 🧪 What Gets Tested

Both test files verify:

1. **Database Connection**
   - Verifies connection to `kiuma_main` database
   - Checks database configuration

2. **Table Structure**
   - Verifies `notifications` table exists
   - Checks all required columns are present
   - Validates column types and constraints

3. **CREATE Operations (INSERT)**
   - Creates test notifications
   - Tests all notification types (info, reminder, announcement)
   - Verifies data is saved correctly

4. **READ Operations (SELECT)**
   - Retrieves all notifications
   - Tests filtering by type
   - Verifies data integrity

5. **UPDATE Operations**
   - Updates notification read status
   - Updates sent status flags
   - Verifies updates are saved

6. **Sorting Logic**
   - Tests unread-first sorting
   - Tests date-based sorting (newest first)
   - Verifies combined sorting works correctly

7. **Data Validation**
   - Tests ENUM constraints
   - Tests required fields
   - Tests invalid data rejection

8. **Statistics**
   - Counts total notifications
   - Counts unread/read notifications
   - Groups by type

9. **API Simulation**
   - Simulates `get_notifications.php` endpoint
   - Verifies response format
   - Tests query structure

## 📊 Expected Results

### Successful Test Output Should Show:

✅ All tests passed (100% success rate)
- Database connection successful
- Table structure correct
- CRUD operations working
- Sorting logic correct
- Statistics accurate

### If Tests Fail:

❌ Check the following:

1. **Database Connection Failed**
   - Verify XAMPP MySQL is running
   - Check `config/database.php` or `api/library_media_config.php`
   - Verify database `kiuma_main` exists
   - Import schema if needed: `database/kiuma_complete_schema.sql`

2. **Table Not Found**
   - Import database schema
   - Run: `database/kiuma_complete_schema.sql` in phpMyAdmin

3. **Permission Errors**
   - Check MySQL user permissions
   - Verify XAMPP MySQL has proper access

## 🔧 Database Schema Required

The notifications table should have this structure:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'reminder', 'announcement', 'white_days', 'fasting') DEFAULT 'info',
    target_audience ENUM('all', 'male', 'female', 'specific') DEFAULT 'all',
    sent_to_whatsapp BOOLEAN DEFAULT FALSE,
    sent_to_email BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_date TIMESTAMP NULL DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    INDEX idx_type (type),
    INDEX idx_created_date (created_date),
    INDEX idx_sent_date (sent_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🧹 Cleanup

Test files automatically create test notifications. To remove them:

**Option 1: Automatic Cleanup (CLI version)**
- The CLI version automatically removes test data after testing

**Option 2: Manual Cleanup (Browser version)**
- The browser version shows test notification IDs
- Manually delete via phpMyAdmin or run:
  ```sql
  DELETE FROM notifications WHERE title LIKE 'Test%';
  ```

## 📝 Notes

- Test files are safe to run multiple times
- They create test data but won't delete existing real notifications
- Delete test files after testing for security
- Tests verify database functionality only (not WhatsApp/Email sending)

## 🔗 Related Files

- `api/get_notifications.php` - API endpoint for retrieving notifications
- `api/save_notification.php` - API endpoint for saving notifications
- `api/send_notifications_to_all.php` - API endpoint for bulk sending
- `database/kiuma_complete_schema.sql` - Complete database schema

## ✅ Success Checklist

After running tests, verify:
- [ ] All tests show ✅ (green/passed)
- [ ] Database connection successful
- [ ] Table structure correct
- [ ] Can create notifications
- [ ] Can retrieve notifications
- [ ] Can update notifications
- [ ] Sorting works correctly
- [ ] Statistics accurate
- [ ] No errors in test output

## 🚀 Next Steps

Once database tests pass:
1. Test API endpoints via browser console or Postman
2. Test notification sending via `notifications.html` page
3. Test WhatsApp integration (requires Twilio setup)
4. Test email integration (if configured)

---

**Need Help?**
- Check `TEST_NOTIFICATIONS.md` for notification system testing
- Check `test_db.php` for general database connection testing
- Review error messages for specific issues

