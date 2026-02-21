# KIUMA Recruitment Backend

PHP/MySQL backend system for handling recruitment form submissions with email and WhatsApp notifications.

## Quick Start

1. **Set up database:**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

2. **Configure settings:**
   Edit `config/database.php` with your database credentials, email, and WhatsApp settings.

3. **Test connection:**
   Access `test_db.php` in your browser to verify database connection.

4. **Use the form:**
   Open `api/join_us_form.php` to access the recruitment form.

## Features

- ✅ MySQL database storage
- ✅ Email notifications
- ✅ WhatsApp notifications via Twilio
- ✅ Form validation
- ✅ Security (SQL injection protection)
- ✅ Error handling

## Documentation

See `SETUP_INSTRUCTIONS.md` for detailed setup and configuration instructions.

## Files

- `api/submit_recruit.php` - Main submission handler
- `api/join_us_form.php` - HTML form
- `config/database.php` - Configuration
- `database/schema.sql` - Database schema
- `test_db.php` - Connection test script

## Support

For setup help, refer to `SETUP_INSTRUCTIONS.md`.

