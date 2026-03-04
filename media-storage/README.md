# KIUMA Media Storage System

A complete media storage system that uploads files to Google Drive and manages them through a web interface.

## Features

- ✅ Upload videos, audio files, and documents
- ✅ Automatic storage to Google Drive
- ✅ Direct download links generation
- ✅ Admin dashboard for file management
- ✅ Secure file deletion (from Drive and database)
- ✅ File type validation
- ✅ File size limits
- ✅ Clean, modern UI

## Quick Start

1. **Install Dependencies**
   ```bash
   composer install
   ```

2. **Setup Database**
   - Create database: `kiuma_media_storage`
   - Import schema: `database/media_storage_schema.sql`

3. **Configure Google Drive API**
   - Follow instructions in `GOOGLE_DRIVE_SETUP.md`
   - Download `credentials.json` and place in this directory
   - Run authorization: Visit `authorize.php` in browser

4. **Configure Application**
   - Copy `config.example.php` to `config.php`
   - Update database credentials
   - Set admin password

5. **Start Using**
   - Upload files: `index.html`
   - View dashboard: `dashboard.php`

## File Structure

```
media-storage/
├── index.html              # Upload form
├── upload.php              # Upload handler
├── dashboard.php           # Admin dashboard
├── delete.php              # Delete handler
├── authorize.php           # Google Drive authorization
├── config.php              # Configuration (create from config.example.php)
├── config.example.php      # Configuration template
├── credentials.json        # Google OAuth credentials (download from Google Cloud)
├── token.json              # Access token (generated after authorization)
├── composer.json           # PHP dependencies
├── vendor/                 # Composer packages
├── GOOGLE_DRIVE_SETUP.md   # Detailed setup instructions
└── README.md               # This file
```

## Requirements

- PHP 7.4+
- MySQL 5.7+
- Composer
- Google Cloud Account
- Google Drive API enabled

## Security Notes

- Never commit `credentials.json`, `token.json`, or `config.php` to Git
- Change default admin password
- Use HTTPS in production
- Restrict file upload sizes
- Regularly review uploaded files

## Support

For detailed setup instructions, see `GOOGLE_DRIVE_SETUP.md`

