# KIUMA Pesapal Payment System - Deployment Guide

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project created
3. Pesapal/DPO Pay account with API credentials
4. Node.js 18+ installed

## Step 1: Initialize Firebase Project

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init functions
firebase init firestore
firebase init hosting
```

## Step 2: Configure Pesapal Credentials

**CRITICAL: Never commit secrets to git!**

```bash
# Set Pesapal consumer key
firebase functions:config:set pesapal.consumer_key="your_consumer_key"

# Set Pesapal consumer secret
firebase functions:config:set pesapal.consumer_secret="your_consumer_secret"

# Set test mode (true for testing, false for production)
firebase functions:config:set pesapal.test_mode="true"

# Set webhook secret (for webhook signature verification)
firebase functions:config:set pesapal.webhook_secret="your_webhook_secret"

# Set base URL (optional - defaults to production)
firebase functions:config:set app.base_url="https://your-domain.com"

# Verify configuration
firebase functions:config:get
```

## Step 3: Install Dependencies

```bash
cd functions
npm install
cd ..
```

## Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

## Step 5: Deploy Cloud Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:initializePayment
firebase deploy --only functions:verifyPayment
firebase deploy --only functions:pesapalWebhook
firebase deploy --only functions:getUserPayments
```

## Step 6: Configure Pesapal Webhook

1. Go to Pesapal Dashboard → Settings → Webhooks
2. Add webhook URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/pesapalWebhook`
3. Select events: Payment completed, Payment failed
4. Copy the webhook secret and set it in Firebase config (Step 2)

## Step 7: Update Frontend Configuration

1. Ensure Firebase SDK is loaded in your HTML:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.x.x/firebase-functions.js"></script>

<!-- Payment script -->
<script src="payment.js"></script>
```

2. Initialize Firebase in your HTML:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    // ... other config
};

firebase.initializeApp(firebaseConfig);
```

## Step 8: Deploy Frontend

```bash
firebase deploy --only hosting
```

## Step 9: Test Payment Flow

1. **Test with Pesapal Sandbox:**
   - Use test credentials in sandbox mode
   - Test with small amounts
   - Verify payment appears in Pesapal dashboard
   - Verify payment verified in Cloud Functions logs
   - Verify payment saved to Firestore

2. **Verify Security:**
   - Payment appears in Pesapal dashboard
   - Payment verified in Cloud Functions logs
   - Payment saved to Firestore
   - Frontend shows success only after backend verification

## Security Checklist

- [ ] Pesapal credentials configured in Firebase (not in code)
- [ ] Webhook secret configured
- [ ] Firestore rules deployed
- [ ] No secrets in git repository
- [ ] HTTPS enabled (Firebase Hosting default)
- [ ] Cloud Functions require authentication
- [ ] Payment verification happens server-side only
- [ ] Test mode disabled for production

## Monitoring

### View Function Logs

```bash
firebase functions:log
```

### View Specific Function Logs

```bash
firebase functions:log --only initializePayment
firebase functions:log --only verifyPayment
firebase functions:log --only pesapalWebhook
```

### Monitor Firestore

1. Go to Firebase Console → Firestore
2. Check `payments` collection
3. Verify transactions are being saved

## Troubleshooting

### Error: "Pesapal credentials not configured"
- Run: `firebase functions:config:set pesapal.consumer_key="YOUR_KEY"`
- Run: `firebase functions:config:set pesapal.consumer_secret="YOUR_SECRET"`

### Error: "User must be authenticated"
- Ensure user is logged in before calling payment functions
- Check Firebase Auth is initialized

### Error: "Payment validation failed"
- Check amount matches exactly
- Verify currency is UGX
- Check payment status is "completed" or "success"

### Webhook not receiving events
- Verify webhook URL is correct
- Check Pesapal dashboard for webhook delivery status
- Check Cloud Functions logs for errors
- Verify webhook secret is set correctly

## Production Checklist

Before going live:

1. [ ] Switch to Pesapal LIVE credentials
2. [ ] Set `pesapal.test_mode="false"`
3. [ ] Update webhook URL to production
4. [ ] Test with real payment (small amount)
5. [ ] Monitor logs for 24 hours
6. [ ] Set up alerts for failed payments
7. [ ] Review Firestore security rules
8. [ ] Enable Cloud Functions monitoring
9. [ ] Set up backup for Firestore
10. [ ] Document support procedures

## API Endpoints

### initializePayment
- **Type:** Callable Function
- **Auth:** Required
- **Purpose:** Create Pesapal payment order
- **Returns:** Checkout URL

### verifyPayment
- **Type:** Callable Function
- **Auth:** Required
- **Purpose:** Verify payment with Pesapal API
- **Returns:** Verification result

### pesapalWebhook
- **Type:** HTTP Function
- **Auth:** None (uses signature verification)
- **Purpose:** Receive webhook notifications
- **Returns:** 200 OK

### getUserPayments
- **Type:** Callable Function
- **Auth:** Required
- **Purpose:** Get user payment history
- **Returns:** Payment list

