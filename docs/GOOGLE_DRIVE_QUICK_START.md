# Google Drive Setup - Quick Start Guide

This guide will help you set up Google Drive integration for the Library and Media system.

## Current Status Checklist

- [ ] Google Cloud Project created
- [ ] Google Drive API enabled
- [ ] OAuth 2.0 credentials created
- [ ] `credentials.json` downloaded and placed in `media-storage/` folder
- [ ] Composer dependencies installed
- [ ] Application authorized (token.json created)
- [ ] Backend PHP server configured

---

## Step-by-Step Setup

### Step 1: Create Google Cloud Project & Enable API

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project:**
   - Click project dropdown (top left)
   - Click "New Project"
   - Name: `KIUMA Media Storage`
   - Click "Create"
   - Wait for creation, then select the project

3. **Enable Google Drive API:**
   - Go to: **APIs & Services** → **Library**
   - Search: "Google Drive API"
   - Click "Google Drive API"
   - Click **"Enable"**

---

### Step 2: Create OAuth Credentials

1. **Configure OAuth Consent Screen:**
   - Go to: **APIs & Services** → **OAuth consent screen**
   - Choose **"External"** (unless you have Google Workspace)
   - Click "Create"
   - Fill in:
     - **App name**: `KIUMA Media Storage`
     - **User support email**: Your email
     - **Developer contact**: Your email
   - Click "Save and Continue"
   - On **Scopes**: Click "Save and Continue"
   - On **Test users**: Add your email address
   - Click "Save and Continue"
   - Review and go back to dashboard

2. **Create OAuth Client ID:**
   - Go to: **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth client ID"**
   - Application type: **"Desktop app"**
   - Name: `KIUMA Media Storage Client`
   - Click "Create"

3. **Download Credentials:**
   - A popup will show your Client ID and Secret
   - Click **"Download JSON"** button
   - Save the file as `credentials.json`
   - **IMPORTANT:** Move this file to: `media-storage/credentials.json`

---

### Step 3: Install Composer Dependencies

**Option A: If you have Composer installed globally:**

1. Open terminal/command prompt
2. Navigate to `media-storage` folder:
   ```bash
   cd media-storage
   ```
3. Install dependencies:
   ```bash
   composer install
   ```

**Option B: If you DON'T have Composer:**

1. **Download Composer:**
   - Visit: https://getcomposer.org/download/
   - Download `Composer-Setup.exe` for Windows
   - Run the installer
   - It will detect XAMPP's PHP automatically

2. **After installation, run:**
   ```bash
   cd media-storage
   composer install
   ```

**Option C: Manual Installation (if Composer doesn't work):**

1. Download Google API Client manually:
   - Visit: https://github.com/googleapis/google-api-php-client/releases
   - Download latest release ZIP
   - Extract to `media-storage/vendor/google/apiclient/`

---

### Step 4: Authorize Application

1. **Make sure you have:**
   - `credentials.json` in `media-storage/` folder
   - Composer dependencies installed (`vendor/` folder exists)

2. **Run Authorization:**

   **Method 1: Using authorize.php (Web-based - Recommended)**
   
   - Open in browser: `http://localhost/kimu-mob-html/media-storage/authorize.php`
   - You'll be redirected to Google
   - Sign in and authorize
   - You'll be redirected back
   - `token.json` will be created automatically

   **Method 2: Using Command Line**
   
   - Open terminal in `media-storage/` folder
   - Run: `php authorize.php`
   - Copy the URL shown
   - Open in browser and authorize
   - Paste the code back into terminal

3. **Verify:**
   - Check that `token.json` was created in `media-storage/` folder
   - This file contains your access token

---

### Step 5: Test Google Drive Connection

1. **Test Upload (via API):**
   - Try uploading a book or media file through the website
   - Check browser console for errors
   - Check if file appears in your Google Drive

2. **Check Google Drive:**
   - Go to: https://drive.google.com/
   - Look for uploaded files
   - Files should appear in root folder (or specified folder)

---

## Common Issues & Solutions

### Issue 1: "credentials.json not found"

**Solution:**
- Make sure `credentials.json` is in `media-storage/` folder
- Check file path in `api/library_media_config.php`:
  ```php
  define('GOOGLE_CREDENTIALS_PATH', __DIR__ . '/../media-storage/credentials.json');
  ```

### Issue 2: "Composer not found" or "vendor/autoload.php not found"

**Solution:**
- Install Composer (see Step 3 above)
- Run `composer install` in `media-storage/` folder
- Verify `vendor/` folder exists

### Issue 3: "Authorization required" error

**Solution:**
- Run authorization again (Step 4)
- Make sure `token.json` is created
- Check file permissions (should be readable)

### Issue 4: "Access denied" or "Invalid credentials"

**Solution:**
- Re-download `credentials.json` from Google Cloud Console
- Make sure OAuth consent screen is configured
- Add your email as a test user
- Re-run authorization

### Issue 5: Files not uploading to Google Drive

**Solution:**
- Check PHP error logs
- Verify Google Drive API is enabled
- Check that `token.json` exists and is valid
- Try re-authorizing

### Issue 6: "Quota exceeded" error

**Solution:**
- Google Drive has storage limits (15GB free)
- Delete old files from Drive
- Or upgrade Google Drive storage

---

## File Structure After Setup

```
media-storage/
├── credentials.json      ← Download from Google Cloud (REQUIRED)
├── token.json            ← Created after authorization (REQUIRED)
├── vendor/               ← Created by composer install (REQUIRED)
│   └── autoload.php
├── authorize.php
├── config.php
├── composer.json
└── ...
```

---

## Security Notes

⚠️ **IMPORTANT:**
- **NEVER commit `credentials.json` or `token.json` to Git**
- These files are already in `.gitignore`
- Keep them secure and private
- Don't share these files publicly

---

## Testing Checklist

After setup, test:

- [ ] Can access `authorize.php` in browser
- [ ] Authorization completes successfully
- [ ] `token.json` is created
- [ ] Can upload a book file
- [ ] Can upload a media file
- [ ] Files appear in Google Drive
- [ ] Download links work
- [ ] No errors in browser console
- [ ] No errors in PHP logs

---

## Next Steps After Setup

1. ✅ Google Drive configured
2. ⬜ Test book upload
3. ⬜ Test media upload
4. ⬜ Verify downloads work
5. ⬜ Deploy backend to production server

---

## Need Help?

If you encounter issues:
1. Check `media-storage/GOOGLE_DRIVE_SETUP.md` for detailed instructions
2. Check Google Cloud Console for API status
3. Check PHP error logs
4. Verify all files are in correct locations

