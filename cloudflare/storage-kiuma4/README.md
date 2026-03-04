# kiuma-storage-kiuma4

Main R2 storage worker used by the app by default.

- **Deploy:** `npx wrangler deploy` (from this folder)
- **URL after deploy:** `https://kiuma-storage-kiuma4.<your-subdomain>.workers.dev`
- **App default:** Media and Library use this URL when subdomain is `kiuma4`:  
  `https://kiuma-storage-kiuma4.kiuma4.workers.dev`  
  (or set to your actual URL in the app config if different)

**Before first deploy:**
1. Create an R2 bucket named `kiuma-files` in the Cloudflare dashboard.
2. After deploy: `npx wrangler secret put ADMIN_TOKEN`
