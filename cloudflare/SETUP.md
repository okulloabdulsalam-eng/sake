# KIUMA Cloudflare R2 Multi-Account Storage Setup

KIUMA uses **8 Cloudflare R2 workers** for storage (main + 7 optional):

| Worker | Purpose | Max Storage |
|--------|---------|-------------|
| kiuma-storage-kiuma4 | Main storage (app default) | 10 GB |
| kiuma-video1 | Video storage (account 1) | 10 GB |
| kiuma-video2 | Video storage (account 2) | 10 GB |
| kiuma-video3 | Video storage (account 3) | 10 GB |
| kiuma-video4 | Video storage (account 4) | 10 GB |
| kiuma-video5 | Video storage (account 5) | 10 GB |
| kiuma-audio  | Audio storage | 10 GB |
| kiuma-library | Books/PDFs storage | 10 GB |

**Total: 70 GB free storage** across 7 Cloudflare free-tier accounts.

## Free Tier Limits (per account)
- **10 GB** storage, **10 million** reads/month, **No egress fees**

## Setup Per Account

### 1. Create a Cloudflare account
Go to https://dash.cloudflare.com/sign-up (free, no credit card).

### 2. Create an R2 bucket
- Dashboard > **R2 Object Storage** > **Create bucket**
- Name it to match wrangler.toml (e.g. `kiuma-video1`, `kiuma-audio`)

### 3. Deploy the worker
```bash
npm install -g wrangler
wrangler login
cd cloudflare/video1   # or video2, audio, library, etc.
npx wrangler deploy
npx wrangler secret put ADMIN_TOKEN
```

### 4. Note the worker URL
After deploy: `https://kiuma-video1.your-subdomain.workers.dev`

### 5. Repeat for all 7 accounts

## Deploy All at Once (same account)
```powershell
cd cloudflare
.\deploy-all.ps1
```

## Configure in KIUMA Admin
1. Admin panel > **Settings** tab
2. Enter each Video, Audio, and Library worker URL + admin token
3. Click **Save All R2 Settings**
4. Click **Check All Storage** to verify

## Auto-Rotation
Videos auto-rotate: if Video 1 is full (10 GB), uploads go to Video 2, then 3, etc.

## API Endpoints (per worker)
- `GET /health` — Health check
- `GET /storage` — Usage stats (bytes, GB, %, file count)
- `GET /list?prefix=media/video/` — List files
- `GET /file/{key}` — Download/stream (supports Range for seeking)
- `PUT /upload` — Upload (requires X-Admin-Token, X-File-Name)
- `DELETE /file/{key}` — Delete (requires X-Admin-Token)

## Alternative: Deploy via Dashboard
1. **Workers & Pages** > **Create Worker** > name it (e.g. `kiuma-video1`)
2. Paste `worker.js` contents > **Deploy**
3. **Settings > Variables** > add `ADMIN_TOKEN` (encrypt it)
4. **Settings > Bindings** > add R2: `BUCKET` = your bucket name
5. Re-deploy
