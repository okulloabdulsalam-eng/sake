# Real-time fundraising total – setup

The balance on **Live total** / **Fundraising** is already working (KV + worker deployed). Remaining optional step:

## Pesapal IPN (so real payments update the total)

When a payment completes, Pesapal must call your worker. You can do either:

### Option A – Register via your worker (recommended)

1. Ensure these secrets are set in the worker:
   - `PESAPAL_CONSUMER_KEY`
   - `PESAPAL_CONSUMER_SECRET`
2. In a browser, open:
   ```
   https://kiuma-pesapal.kiuma4.workers.dev/api/register-ipn
   ```
3. The response will include a `notification_id`. Add it as a secret:
   ```bash
   npx wrangler secret put PESAPAL_NOTIFICATION_ID
   ```
   (paste the notification_id when prompted.)
4. Redeploy if needed: `npx wrangler deploy`

### Option B – Set IPN in Pesapal dashboard

In your Pesapal merchant dashboard, set the IPN / callback URL to:

**`https://kiuma-pesapal.kiuma4.workers.dev/api/ipn`**

Save. After that, completed payments will trigger the webhook and the total will update.

---

## Quick check

- **Total API:** https://kiuma-pesapal.kiuma4.workers.dev/api/fundraising-total  
  (should return `total`, `currency`, `recentTransactions`.)
- **Fundraising page** in the app polls this every 15 seconds.
