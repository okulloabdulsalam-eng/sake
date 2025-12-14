# Pesapal Payment System - Status: LOCKED

## 🔒 Current Status

The Pesapal payment system is **LOCKED (DISABLED)** but **NOT REMOVED**.

- ✅ Code remains in place
- ✅ All functions preserved
- ✅ Can be re-enabled easily
- ❌ Currently disabled and will return errors if called

---

## Why It's Locked

The system is locked to:
- Keep the codebase clean
- Prevent accidental usage
- Allow easy re-enablement when needed
- Maintain existing payment systems (pay.html) without interference

---

## How to Re-Enable Pesapal System

### Step 1: Enable the Feature Flag

```bash
# Enable Pesapal payment system
firebase functions:secrets:set PESAPAL_ENABLED
# When prompted, enter: true
```

### Step 2: Set Required Credentials

```bash
# Set Pesapal credentials
firebase functions:secrets:set PESAPAL_CONSUMER_KEY
firebase functions:secrets:set PESAPAL_CONSUMER_SECRET
firebase functions:secrets:set PESAPAL_TEST_MODE

# Grant access
firebase functions:secrets:access PESAPAL_ENABLED PESAPAL_CONSUMER_KEY PESAPAL_CONSUMER_SECRET PESAPAL_TEST_MODE
```

### Step 3: Deploy

```bash
firebase deploy --only functions
```

---

## How to Keep It Locked

The system is locked by default. To ensure it stays locked:

```bash
# Explicitly disable (if needed)
firebase functions:secrets:set PESAPAL_ENABLED
# When prompted, enter: false
```

Or simply don't set `PESAPAL_ENABLED` (defaults to 'false').

---

## What Happens When Locked

### Backend Functions:
- `initializePayment` - Returns error: "Pesapal payment system is currently disabled"
- `verifyPayment` - Returns error: "Pesapal payment system is currently disabled"
- `pesapalWebhook` - Returns 503: "Service unavailable"
- `getUserPayments` - Still works (reads from Firestore, not Pesapal-specific)

### Frontend:
- `processPayment()` - Will fail with error from backend
- `initializePayment()` - Will fail with error from backend
- All other functions remain available

---

## Existing Payment Systems

The following payment systems continue to work normally:

### ✅ Active Payment System (pay.html):
- Semester/Monthly Subscriptions
- Zakat payments
- Charity donations
- General donations
- Kisilaahe subscriptions
- WhatsApp integration with Amir Finance

**Status:** ✅ Fully functional and unaffected by Pesapal lock

---

## File Locations

### Pesapal System (Locked):
- `functions/index.js` - Backend functions (locked with feature flag)
- `public/payment.js` - Frontend integration (will error if called)
- `public/payment-example.html` - Example page (will error if used)

### Active Payment System:
- `pay.html` - Main payment page (fully functional)
- All subscription and donation flows work normally

---

## Security Note

Even when locked:
- ✅ All security measures remain in place
- ✅ No secrets are exposed
- ✅ Code is preserved for future use
- ✅ Can be safely re-enabled when needed

---

## Quick Reference

**Lock Status:** 🔒 LOCKED (default)  
**Re-enable:** Set `PESAPAL_ENABLED="true"`  
**Keep Locked:** Leave `PESAPAL_ENABLED` unset or set to `"false"`  
**Existing Payments:** ✅ Continue working normally

