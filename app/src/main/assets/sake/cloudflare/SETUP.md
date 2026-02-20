# Cloudflare R2 Storage Setup for KIUMA

## Free Tier Limits
- **10 GB** storage
- **10 million** read requests/month
- **1 million** write requests/month
- **No egress fees** (unlike AWS S3)

## Step 1: Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up with email (free, no credit card needed for R2)

## Step 2: Create R2 Bucket
1. In Cloudflare dashboard, click **R2 Object Storage** in the left sidebar
2. Click **Create bucket**
3. Name it: `kiuma-files`
4. Choose location: **Automatic** (or pick closest to Uganda)
5. Click **Create bucket**

## Step 3: Deploy the Worker
You need Node.js installed. Then:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
npx wrangler login

# Navigate to the cloudflare folder
cd cloudflare

# Set your admin upload token (choose a strong password)
npx wrangler secret put ADMIN_TOKEN
# When prompted, type your chosen password (e.g. "kiuma-admin-2026-secret")

# Deploy the worker
npx wrangler deploy
```

After deploying, you'll get a URL like:
`https://kiuma-storage.<your-account>.workers.dev`

## Step 4: Update the App
1. Open `admin.html` in the KIUMA app
2. Go to **Settings** tab
3. In the **Cloudflare R2 Settings** section:
   - Enter your Worker URL (e.g. `https://kiuma-storage.your-account.workers.dev`)
   - Enter the Admin Token you set in Step 3
4. Click **Save R2 Settings**

That's it! Media and library uploads will now go to Cloudflare R2, and files will open directly inside the app.

## File Structure in R2
```
kiuma-files/
├── media/
│   ├── video/
│   ├── audio/
│   └── image/
└── library/
    ├── islamic/
    ├── educational/
    ├── quran/
    └── other/
```

## Testing
- Upload a file via the admin panel
- Open media.html or library.html
- Files should load and open inline (video plays, audio plays, images show, PDFs open)

## Alternative: Deploy via Cloudflare Dashboard
If you don't have Node.js:
1. Go to **Workers & Pages** in Cloudflare dashboard
2. Click **Create Worker**
3. Name it `kiuma-storage`
4. Paste the contents of `worker.js` into the editor
5. Click **Deploy**
6. Go to the Worker's **Settings > Variables**
7. Add a variable: `ADMIN_TOKEN` = your chosen password (click Encrypt)
8. Go to **Settings > Bindings**
9. Add R2 bucket binding: Variable name = `BUCKET`, R2 bucket = `kiuma-files`
10. Re-deploy the Worker
