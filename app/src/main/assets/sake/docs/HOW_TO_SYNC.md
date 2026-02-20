# How to Sync Databases (SQLite → MySQL)

## Quick Guide

### Step-by-Step Instructions:

1. **Open the Sync Page**
   - Navigate to: `http://localhost/kimu-mob-html/sync_databases.php`
   - (Or your virtual host URL if configured)

2. **Review the Preview**
   - The page shows a preview of all users that will be synced
   - Check the table showing:
     - User ID
     - Name
     - Email
     - WhatsApp number
     - Status (whether they already exist in MySQL)

3. **Read the Important Notes**
   - Users with existing emails will be skipped (to avoid duplicates)
   - Passwords will NOT be copied (for security)
   - WhatsApp numbers WILL be copied if available

4. **Click "Start Sync"**
   - Click the red "🔄 Start Sync" button
   - Wait for the sync to complete (usually takes 1-2 seconds)

5. **Review Results**
   - See how many users were synced
   - See how many were skipped/updated
   - Check for any errors
   - View detailed results table

## What Happens During Sync?

1. **For New Users:**
   - User data is copied to MySQL database
   - Email, name, WhatsApp, gender are copied
   - Password is NOT copied (security)
   - New MySQL user ID is assigned

2. **For Existing Users (same email):**
   - User is updated with missing data
   - WhatsApp number is added if missing
   - Name and other fields are updated if missing
   - No duplicate is created

## After Syncing

Once sync is complete:

1. **Users are now in MySQL database**
   - They can receive notifications
   - They appear in notification user lists
   - They're available for WhatsApp/Email sending

2. **Test Notifications**
   - Go to: `http://localhost/kimu-mob-html/test_send_whatsapp_notifications.php`
   - Users with WhatsApp numbers can now receive messages

3. **Verify Users**
   - Check: `http://localhost/kimu-mob-html/check_users_direct.php`
   - Should now show users in MySQL database

## Important Notes

- **One-Way Sync:** This syncs SQLite → MySQL (one direction)
- **Safe to Run Multiple Times:** Won't create duplicates
- **Passwords:** Users will need to reset passwords or re-register in MySQL system
- **WhatsApp Numbers:** Will be copied if available in SQLite database

## Troubleshooting

### No Users to Sync?
- Make sure users exist in SQLite database
- Check: `http://localhost/kimu-mob-html/view_all_sqlite_users.php`

### Sync Errors?
- Check MySQL database connection
- Verify `kiuma_main` database exists
- Check user table structure matches

### Users Not Appearing in MySQL?
- Check sync results page for errors
- Verify MySQL database: `http://localhost/kimu-mob-html/check_users_direct.php`
- Check if email already existed (would be skipped)

## Quick Access Links

- **Sync Page:** `sync_databases.php`
- **View SQLite Users:** `view_all_sqlite_users.php`
- **Check MySQL Users:** `check_users_direct.php`
- **Check User Details:** `check_user_details.php`
- **Test Notifications:** `test_send_whatsapp_notifications.php`

