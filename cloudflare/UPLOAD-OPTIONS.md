# Large video upload options

## Option 1 — Disable Cloudflare proxy (quick fix)

In **Cloudflare Dashboard → DNS** for your worker domain (e.g. `kiuma-storage.xxx.workers.dev` or your custom domain):

- Turn **orange cloud** → **grey cloud** (DNS only).

This removes the ~100 MB request body cap. You lose some CDN/proxy protection.

---

## Option 2 — Direct R2 upload (presigned URLs)

The app can upload **directly to R2** (bypassing the Worker for the file body). No 100 MB limit. Used automatically for files under 100 MB when configured.

**Setup:**

1. **Create R2 API token**  
   Cloudflare Dashboard → **R2** → **Manage R2 API Tokens** → Create API token (Object Read & Write). Note **Access Key ID** and **Secret Access Key**.

2. **Worker config**  
   In this folder:
   - Add to `wrangler.toml` under `[vars]`:
     - `R2_ACCOUNT_ID` = your Cloudflare account ID (from dashboard URL or Overview).
     - `R2_BUCKET_NAME` = `kiuma-files` (or your bucket name).
   - Set secrets:
     - `npx wrangler secret put R2_ACCESS_KEY_ID`
     - `npx wrangler secret put R2_SECRET_ACCESS_KEY`

3. **Deploy**  
   `npm install` then `npx wrangler deploy`.

4. **R2 CORS** (for browser uploads)  
   In Dashboard → R2 → your bucket → **Settings** → **CORS policy**, add a rule that allows your app origin, `PUT`, and needed headers.

If presigned is not configured (501), the app falls back to chunked upload.

---

## Option 3 — Chunked upload (default)

Files **≥ 5 MB** are sent in **5 MB chunks** via the Worker. Each request is under the proxy limit. No extra setup. Progress and retries are handled in the admin UI.
