# Deployment Guide - Library & Media System

## Problem: GitHub Pages Doesn't Support PHP

GitHub Pages only serves static files (HTML, CSS, JavaScript). It **cannot execute PHP files**. This means your API endpoints won't work on GitHub Pages.

## Solution: Separate Backend Hosting

You need to host your PHP backend on a separate server that supports PHP. Here are your options:

---

## Option 1: Free PHP Hosting Services (Recommended for Testing)

### 1. **000webhost** (Free)
- URL: https://www.000webhost.com/
- Free tier includes PHP and MySQL
- Steps:
  1. Sign up for free account
  2. Create a new website
  3. Upload your `api/` folder contents via FTP or File Manager
  4. Upload `media-storage/` folder
  5. Set up MySQL database via cPanel
  6. Update `api/library_media_config.php` with database credentials
  7. Update `api-config.js` with your 000webhost URL

### 2. **InfinityFree** (Free)
- URL: https://www.infinityfree.net/
- Free PHP hosting with MySQL
- Similar setup process

### 3. **Freehostia** (Free)
- URL: https://www.freehostia.com/
- Free PHP hosting

---

## Option 2: Backend-as-a-Service (BaaS)

### 1. **Railway** (Free tier available)
- URL: https://railway.app/
- Supports PHP via Docker
- Good for production

### 2. **Render** (Free tier available)
- URL: https://render.com/
- Supports PHP applications
- Easy deployment

### 3. **Heroku** (Paid, but has free tier)
- URL: https://www.heroku.com/
- Supports PHP via buildpacks

---

## Option 3: VPS/Cloud Hosting (For Production)

### 1. **DigitalOcean**
- $5/month droplet
- Full control, install PHP/MySQL yourself

### 2. **AWS EC2**
- Pay-as-you-go
- Full control

### 3. **Vultr**
- Similar to DigitalOcean
- Competitive pricing

---

## Setup Instructions

### Step 1: Deploy PHP Backend

1. **Choose a hosting service** from the options above

2. **Upload files:**
   - Upload entire `api/` folder
   - Upload `media-storage/` folder (for Google Drive credentials)
   - Upload `database/library_media_schema.sql` (for database setup)

3. **Set up database:**
   - Create MySQL database via hosting control panel
   - Import `database/library_media_schema.sql`
   - Note your database credentials

4. **Configure backend:**
   - Edit `api/library_media_config.php`:
     ```php
     define('DB_HOST', 'your-host');
     define('DB_USER', 'your-username');
     define('DB_PASS', 'your-password');
     define('DB_NAME', 'your-database');
     ```
   - Place `credentials.json` in `media-storage/` folder
   - Run `composer install` in `media-storage/` directory (if hosting supports Composer)

5. **Test backend:**
   - Visit: `https://your-backend-domain.com/api/get_books.php`
   - Should return JSON: `{"success":true,"books":[]}`

### Step 2: Configure Frontend

1. **Update `api-config.js`:**
   ```javascript
   const API_BASE_URL = 'https://your-backend-domain.com/api';
   ```

2. **Commit and push to GitHub:**
   ```bash
   git add api-config.js
   git commit -m "Configure API base URL"
   git push
   ```

### Step 3: Enable CORS (If needed)

If your backend is on a different domain, make sure CORS headers are set. The PHP files already include:
```php
header('Access-Control-Allow-Origin: *');
```

If you need to restrict to your GitHub Pages domain:
```php
header('Access-Control-Allow-Origin: https://okulloabdulsalam-eng.github.io');
```

---

## Quick Test Setup (Local Development)

If you want to test locally before deploying:

1. **Install XAMPP** (if not already installed)

2. **Copy files:**
   - Copy `api/` folder to `C:\xampp\htdocs\api\`
   - Copy `media-storage/` to `C:\xampp\htdocs\media-storage\`

3. **Set up database:**
   - Open phpMyAdmin: http://localhost/phpmyadmin
   - Import `database/library_media_schema.sql`

4. **Configure:**
   - Update `api/library_media_config.php` with XAMPP defaults
   - Update `api-config.js`:
     ```javascript
     const API_BASE_URL = 'http://localhost/api';
     ```

5. **Test:**
   - Open your site: `http://localhost/kimu-mob-html/`
   - API should work at: `http://localhost/api/get_books.php`

---

## Troubleshooting

### Error: "Unexpected token '<'"
- **Cause:** PHP file returning HTML instead of JSON
- **Solution:** Make sure PHP is enabled on your hosting, and the file path is correct

### Error: "405 Method Not Allowed"
- **Cause:** Server doesn't allow POST requests
- **Solution:** Check server configuration, ensure `.htaccess` allows POST

### Error: "CORS policy"
- **Cause:** Backend not allowing requests from GitHub Pages domain
- **Solution:** Update CORS headers in PHP files

### Error: "Database connection failed"
- **Cause:** Wrong database credentials
- **Solution:** Double-check `api/library_media_config.php` settings

---

## Recommended Setup for Production

1. **Frontend:** GitHub Pages (free, fast CDN)
2. **Backend:** Railway or Render (free tier, easy deployment)
3. **Database:** MySQL on backend server (or separate database service)
4. **Storage:** Google Drive (already configured)

This gives you:
- ✅ Free hosting for frontend
- ✅ Free/cheap backend hosting
- ✅ Scalable architecture
- ✅ Separation of concerns

---

## Security Notes

1. **Never commit sensitive files:**
   - `credentials.json`
   - `token.json`
   - `config.php` (use `config.example.php` instead)

2. **Use environment variables** for production:
   - Store API keys in environment variables
   - Don't hardcode credentials

3. **Restrict CORS** in production:
   - Only allow your GitHub Pages domain
   - Don't use `Access-Control-Allow-Origin: *` in production

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check backend server logs
3. Test API endpoints directly in browser
4. Verify database connection
5. Verify Google Drive credentials

