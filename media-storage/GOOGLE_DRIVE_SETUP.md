# Google Drive API Setup Instructions

This guide will help you set up Google Drive API for the media storage system.

## Prerequisites

- Google Account
- PHP 7.4 or higher
- Composer (for installing Google API Client)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `KIUMA Media Storage` (or any name you prefer)
5. Click **"Create"**
6. Wait for the project to be created and select it

---

## Step 2: Enable Google Drive API

1. In your Google Cloud project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on **"Google Drive API"**
4. Click **"Enable"**
5. Wait for the API to be enabled

---

## Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - Choose **"External"** (unless you have a Google Workspace account)
   - Click **"Create"**
   - Fill in:
     - **App name**: KIUMA Media Storage
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click **"Save and Continue"**
   - On **Scopes** page, click **"Save and Continue"**
   - On **Test users** page, add your email, then click **"Save and Continue"**
   - Review and click **"Back to Dashboard"**

4. Back at Credentials page, click **"Create Credentials"** → **"OAuth client ID"**
5. Select **"Desktop app"** as application type
6. Enter name: `KIUMA Media Storage Client`
7. Click **"Create"**
8. A popup will appear with your credentials
9. Click **"Download JSON"** button
10. Save the downloaded file as `credentials.json`
11. Move `credentials.json` to the `media-storage/` directory

---

## Step 4: Install Google API Client Library

1. Open terminal/command prompt in the `media-storage/` directory
2. Run:
   ```bash
   composer require google/apiclient
   ```
   
   If you don't have Composer installed:
   - Download from: https://getcomposer.org/download/
   - Or use: `php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"`
   - Then: `php composer-setup.php`
   - Then: `php composer.phar require google/apiclient`

---

## Step 5: Authorize Application (First Time)

1. Make sure `credentials.json` is in the `media-storage/` directory
2. Create a file `authorize.php` (temporary file for authorization):

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';

$client = new Google_Client();
$client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
$client->addScope(Google_Service_Drive::DRIVE_FILE);
$client->setAccessType('offline');
$client->setPrompt('select_account consent');

$authUrl = $client->createAuthUrl();
printf("Open the following link in your browser:\n%s\n", $authUrl);
print 'Enter verification code: ';
$authCode = trim(fgets(STDIN));

$accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
$client->setAccessToken($accessToken);

// Save token for future use
$tokenPath = __DIR__ . '/token.json';
if (!file_exists(dirname($tokenPath))) {
    mkdir(dirname($tokenPath), 0700, true);
}
file_put_contents($tokenPath, json_encode($client->getAccessToken()));

echo "Authorization successful! Token saved to token.json\n";
?>
```

3. Run: `php authorize.php`
4. Copy the URL that appears and open it in your browser
5. Sign in with your Google account
6. Click **"Allow"** to grant permissions
7. Copy the authorization code from the browser
8. Paste it back into the terminal
9. You should see "Authorization successful!"
10. Delete `authorize.php` after authorization

**Alternative (Web-based authorization):**

Create `authorize.php` with this content:

```php
<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';

$client = new Google_Client();
$client->setAuthConfig(GOOGLE_CREDENTIALS_PATH);
$client->addScope(Google_Service_Drive::DRIVE_FILE);
$client->setAccessType('offline');
$client->setPrompt('select_account consent');
$client->setRedirectUri('http://localhost/media-storage/authorize.php');

if (isset($_GET['code'])) {
    $accessToken = $client->fetchAccessTokenWithAuthCode($_GET['code']);
    $client->setAccessToken($accessToken);
    
    $tokenPath = __DIR__ . '/token.json';
    if (!file_exists(dirname($tokenPath))) {
        mkdir(dirname($tokenPath), 0700, true);
    }
    file_put_contents($tokenPath, json_encode($client->getAccessToken()));
    
    echo "<h2>Authorization Successful!</h2>";
    echo "<p>Token saved. You can now use the upload system.</p>";
    echo "<a href='index.html'>Go to Upload Page</a>";
} else {
    $authUrl = $client->createAuthUrl();
    header('Location: ' . $authUrl);
    exit;
}
?>
```

Then:
1. Update OAuth client redirect URI in Google Cloud Console:
   - Go to **Credentials** → Click on your OAuth client
   - Add **Authorized redirect URIs**: `http://localhost/media-storage/authorize.php`
   - Click **Save**
2. Visit: `http://localhost/media-storage/authorize.php` in your browser
3. Authorize and token will be saved automatically

---

## Step 6: Configure Database

1. Create the database:
   ```sql
   CREATE DATABASE kiuma_media_storage;
   ```

2. Import the schema:
   ```bash
   mysql -u root -p kiuma_media_storage < database/media_storage_schema.sql
   ```

   Or via phpMyAdmin:
   - Select `kiuma_media_storage` database
   - Go to **Import** tab
   - Choose `database/media_storage_schema.sql`
   - Click **Go**

3. Update `config.php` with your database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'kiuma_media_storage');
   ```

---

## Step 7: Configure File Permissions

```bash
chmod 644 config.php
chmod 644 credentials.json
chmod 600 token.json  # More secure for token file
```

---

## Step 8: Test the System

1. Open `index.html` in your browser
2. Upload a test file
3. Check `dashboard.php` to see if the file appears
4. Try downloading the file
5. Try deleting the file

---

## Optional: Store Files in Specific Google Drive Folder

1. Open Google Drive in your browser
2. Create a folder (e.g., "KIUMA Media Storage")
3. Open the folder
4. Copy the folder ID from the URL:
   - URL format: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
5. Update `config.php`:
   ```php
   define('GOOGLE_DRIVE_FOLDER_ID', 'YOUR_FOLDER_ID_HERE');
   ```

---

## Troubleshooting

### "Authorization required" error
- Run the authorization process again (Step 5)
- Make sure `token.json` exists and is readable

### "Invalid credentials" error
- Verify `credentials.json` is in the correct location
- Check that the file path in `config.php` is correct
- Re-download credentials if needed

### "Access denied" error
- Make sure Google Drive API is enabled
- Check that OAuth consent screen is configured
- Verify you're using the correct Google account

### Files not uploading
- Check PHP `upload_max_filesize` and `post_max_size` in `php.ini`
- Verify database connection
- Check error logs

### Token expires
- The system should auto-refresh tokens
- If issues persist, re-run authorization

---

## Security Notes

1. **Never commit credentials.json or token.json to Git**
   - Add to `.gitignore`:
     ```
     credentials.json
     token.json
     config.php
     ```

2. **Protect config.php**
   - Use `.htaccess` to block direct access:
     ```apache
     <Files "config.php">
         Order Deny,Allow
         Deny from all
     </Files>
     ```

3. **Use strong admin password**
   - Change `ADMIN_PASSWORD` in `config.php`

4. **Limit file uploads**
   - Adjust `MAX_FILE_SIZE` in `config.php`
   - Configure PHP upload limits

---

## File Structure

```
media-storage/
├── index.html          # Upload form
├── upload.php          # Upload handler
├── dashboard.php       # Admin dashboard
├── delete.php          # Delete handler
├── config.php          # Configuration
├── credentials.json    # Google OAuth credentials (not in repo)
├── token.json          # Access token (not in repo)
├── vendor/             # Composer dependencies
└── GOOGLE_DRIVE_SETUP.md  # This file
```

---

## Support

For issues:
- Check Google Cloud Console logs
- Check PHP error logs
- Verify all configuration values
- Ensure all dependencies are installed

