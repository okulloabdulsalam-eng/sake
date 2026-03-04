# GitHub Storage Setup Guide

This guide explains how to set up GitHub as a storage backend for KIUMA media and library files.

## Overview

GitHub storage allows you to:
- Store media files (videos, audio, images) in a GitHub repository
- Store library books (PDFs, documents) in a GitHub repository
- Access files directly via GitHub's raw content URLs
- Manage uploads through the admin panel

## Setup Steps

### 1. Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `kiuma-storage`)
3. Make it **public** for direct file access (or private with token authentication)
4. Initialize with a README

### 2. Generate a Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens/new)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "KIUMA Storage")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy and save the token** - you won't see it again!

### 3. Configure in Admin Panel

1. Open the KIUMA admin panel: `/admin.html`
2. Login with the admin password (default: `kiuma2025`)
3. Go to the **Settings** tab
4. Fill in the GitHub configuration:
   - **GitHub Username/Organization**: Your GitHub username
   - **Repository Name**: The repository you created (e.g., `kiuma-storage`)
   - **Branch**: `main` (or your default branch)
   - **Personal Access Token**: The token you generated
5. Click **Save Settings**
6. Click **Test Connection** to verify

### 4. File Structure

The system will automatically organize files in your repository:

```
kiuma-storage/
├── media/
│   ├── video/
│   │   └── 1234567890_abc_video.mp4
│   ├── audio/
│   │   └── 1234567890_def_audio.mp3
│   └── image/
│       └── 1234567890_ghi_photo.jpg
└── library/
    ├── islamic/
    │   └── 1234567890_jkl_book.pdf
    ├── educational/
    └── quran/
```

## Admin Panel Features

### Media Management
- Upload videos, audio files, and images
- View all uploaded media
- Delete media files
- Filter by type (video/audio/image)

### Library Management
- Upload books (PDF, DOCX, EPUB, TXT)
- Add metadata (title, author, category, description)
- View all uploaded books
- Delete books
- Filter by category

### Settings
- Configure GitHub storage credentials
- Test connection
- Change admin password

### Notifications
- Send notifications to all registered users

## File Size Limits

GitHub has file size limits:
- Individual files: **100MB** (hard limit)
- Recommended: Keep files under **50MB** for best performance
- For larger files, consider using GitHub LFS or an alternative storage

## Security Notes

1. **Never expose your token in client-side code** - The token is stored in localStorage and only used from the browser
2. **Use a dedicated repository** - Don't use your main code repository for storage
3. **Consider repository visibility**:
   - **Public**: Files accessible without authentication
   - **Private**: Requires token for access (recommended for sensitive content)

## Troubleshooting

### "Connection failed" error
- Verify your username and repository name
- Check that the token has `repo` scope
- Ensure the repository exists

### "File upload failed" error
- Check file size (must be under 100MB)
- Verify the token hasn't expired
- Check GitHub API rate limits

### Files not appearing
- Wait a few seconds for GitHub to process
- Refresh the page
- Check the repository directly on GitHub

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/get_media.php` | GET | Get all media files |
| `/api/upload_media.php` | POST | Upload media metadata |
| `/api/delete_media.php` | POST | Delete media file |
| `/api/get_books.php` | GET | Get all books |
| `/api/upload_book.php` | POST | Upload book metadata |
| `/api/delete_book.php` | POST | Delete book |

## Admin Password

Default admin password: `kiuma2025`

To change the password, update the `ADMIN_PASSWORD` constant in:
- `api/library_media_config.php`

---

For additional help, contact the development team.
