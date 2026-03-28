# KIUMA Quran proxy (Quran.Foundation API)

Proxies Content API v4 with OAuth2 `client_credentials` so the web app can load word-by-word data without exposing secrets.

## Setup

1. Request API access at [Quran Foundation](https://api-docs.quran.com/request-access) and obtain `client_id` + `client_secret`.

2. Create a Worker project (e.g. name `kiuma-quran`) and bind optional KV `QURAN_KV` for token caching.

3. Set secrets:

```bash
cd cloudflare/quran-proxy
wrangler secret put QF_CLIENT_ID
wrangler secret put QF_CLIENT_SECRET
```

4. Deploy:

```bash
wrangler deploy
```

5. Point `QURAN_PROXY` in `js/quran-reader-main.js` to your worker URL (default: `https://kiuma-quran.kiuma4.workers.dev`).

If credentials are missing, the worker returns `503` and the reader falls back to alquran.cloud (no word-by-word).
