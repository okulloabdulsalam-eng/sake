# Complete Pesapal Payment System Setup Guide

## 🎯 Overview

This guide will help you enable and configure the Pesapal payment system for KIUMA. The system is fully implemented but currently locked. Follow these steps to make it functional.

---

## 📋 Prerequisites

1. **Pesapal Account**
   - Sign up at https://www.pesapal.com
   - Get your Consumer Key and Consumer Secret from the dashboard
   - For testing, use sandbox credentials

2. **Firebase Project**
   - Firebase CLI installed: `npm install -g firebase-tools`
   - Logged in: `firebase login`
   - Project initialized: `firebase use <your-project-id>`

3. **Node.js 18+**
   - Required for Firebase Functions

---

## 🚀 Step-by-Step Setup

### Step 1: Enable Pesapal System

```bash
# Enable the Pesapal payment system
firebase functions:secrets:set PESAPAL_ENABLED
# When prompted, enter: true
```

### Step 2: Set Pesapal Credentials

```bash
# Set Consumer Key (will prompt for value)
firebase functions:secrets:set PESAPAL_CONSUMER_KEY
# Paste your Pesapal Consumer Key when prompted

# Set Consumer Secret (will prompt for value)
firebase functions:secrets:set PESAPAL_CONSUMER_SECRET
# Paste your Pesapal Consumer Secret when prompted

# Set Test Mode (true for testing, false for production)
firebase functions:secrets:set PESAPAL_TEST_MODE
# Enter: true (for testing) or false (for production)
```

### Step 3: Set Optional Configuration

```bash
# Set Webhook Secret (for webhook verification - optional but recommended)
firebase functions:secrets:set PESAPAL_WEBHOOK_SECRET
# Enter your webhook secret from Pesapal dashboard

# Set Notification ID (from Pesapal dashboard - optional)
firebase functions:secrets:set PESAPAL_NOTIFICATION_ID
# Enter your notification ID

# Set Base URL (your website URL - optional)
firebase functions:secrets:set APP_BASE_URL
# Enter: https://your-domain.com
```

### Step 4: Grant Functions Access to Secrets

```bash
# Grant access to all required secrets
firebase functions:secrets:access PESAPAL_ENABLED PESAPAL_CONSUMER_KEY PESAPAL_CONSUMER_SECRET PESAPAL_TEST_MODE

# Grant access to optional secrets (if you set them)
firebase functions:secrets:access PESAPAL_WEBHOOK_SECRET PESAPAL_NOTIFICATION_ID APP_BASE_URL
```

### Step 5: Install Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 6: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:initializePayment,functions:verifyPayment,functions:pesapalWebhook
```

### Step 7: Configure Pesapal Webhook (Optional but Recommended)

1. Go to Pesapal Dashboard → Settings → Webhooks
2. Add webhook URL: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/pesapalWebhook`
   - Replace `YOUR_REGION` with your Firebase region (e.g., `us-central1`)
   - Replace `YOUR_PROJECT` with your Firebase project ID
3. Select events: Payment completed, Payment failed
4. Copy the webhook secret and set it in Step 3

---

## ✅ Verification

### Check Function Logs

```bash
# View all function logs
firebase functions:log

# View specific function logs
firebase functions:log --only initializePayment
```

### Test Payment Flow

1. Go to `pay.html` in your app
2. Select a payment type and amount
3. Choose "Pesapal" as payment method
4. Click "Pay with Pesapal"
5. Complete payment on Pesapal checkout
6. Verify payment appears in Firebase Console → Firestore → `payments` collection

---

## 🔧 Integration in pay.html

The Pesapal integration has been added to `pay.html`. Users can now:

1. Select payment type (Subscription, Zakat, Charity, etc.)
2. Choose "Pesapal" as payment method
3. Click "Pay with Pesapal" button
4. Complete payment on Pesapal checkout page
5. Return to app and see payment confirmation

---

## 📱 Payment Callback Pages

Two callback pages have been created:

1. **`payment/callback.html`** - Handles successful payments
2. **`payment/cancel.html`** - Handles cancelled payments

These pages automatically verify payments and show appropriate messages.

---

## 🧪 Testing

### Test Mode

1. Set `PESAPAL_TEST_MODE="true"` in Step 2
2. Use Pesapal sandbox credentials
3. Test with small amounts
4. Verify in Pesapal sandbox dashboard

### Production

1. Set `PESAPAL_TEST_MODE="false"`
2. Use Pesapal live credentials
3. Test with small real payment first
4. Monitor logs and Firestore

---

## 🐛 Troubleshooting

### Error: "Pesapal payment system is currently disabled"

**Solution:** Make sure you've set `PESAPAL_ENABLED="true"` in Step 1

### Error: "Pesapal credentials not configured"

**Solution:** 
1. Verify secrets are set: `firebase functions:secrets:list`
2. Verify access is granted: `firebase functions:secrets:access`
3. Redeploy functions: `firebase deploy --only functions`

### Error: "User must be authenticated"

**Solution:** User must be logged in before making payments. Ensure Firebase Auth is initialized.

### Payment Not Verifying

**Solution:**
1. Check Cloud Functions logs
2. Verify Pesapal credentials are correct
3. Check transaction status in Pesapal dashboard
4. Verify amount matches exactly

---

## 📊 Monitoring

### View Payment History

Payments are stored in Firestore:
- Collection: `payments`
- Fields: `userId`, `reference`, `amount`, `currency`, `status`, `verified`, etc.

### View Function Logs

```bash
firebase functions:log --only verifyPayment
```

---

## 🔐 Security Checklist

- [ ] Pesapal credentials configured as secrets (not in code)
- [ ] Webhook secret configured (if using webhooks)
- [ ] Firestore rules deployed
- [ ] No secrets in git repository
- [ ] HTTPS enabled (Firebase Hosting default)
- [ ] Cloud Functions require authentication
- [ ] Payment verification happens server-side only
- [ ] Test mode disabled for production

---

## 📚 Additional Resources

- **PESAPAL_README.md** - Detailed system documentation
- **PESAPAL_DEPLOYMENT.md** - Deployment guide
- **PESAPAL_SECURITY.md** - Security architecture
- **SET_PESAPAL_KEYS_V2.md** - Key configuration details

---

## 🆘 Support

If you encounter issues:

1. Check logs: `firebase functions:log`
2. Review Pesapal dashboard for transaction status
3. Check Firestore security rules
4. Verify Firebase configuration
5. Review error messages in browser console

---

**Your Pesapal payment system is now ready to use! 🎉**

