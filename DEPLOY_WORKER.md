# Cloudflare Worker Deployment Script

# This script would deploy the worker to your existing Cloudflare account
# Since I can't directly access your Cloudflare dashboard, here are the exact steps:

## DEPLOYMENT STEPS:

1. Go to: https://dash.cloudflare.com/workers
2. Click "Create Worker" 
3. Name it: "kiuma-stream-worker"
4. Click "Deploy"
5. Click "Edit code"
6. Replace entire content with cloudflare-stream-worker.js
7. Click "Save and Deploy"
8. Click "Add route" 
9. Route: "kiuma-storage-kiuma4.kiuma4.workers.dev/*"
10. Click "Save"

## ALTERNATIVE: Use Wrangler CLI

If you have Wrangler installed:
```bash
wrangler deploy --name kiuma-stream-worker
```

The worker is now ready to handle WebRTC streaming!
