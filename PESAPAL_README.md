# KIUMA Pesapal Payment System

A production-ready, secure payment integration for KIUMA using Firebase Cloud Functions and Pesapal/DPO Pay (Uganda).

## 🛡️ Security Features

- ✅ **Server-Side Verification**: All payments verified on backend
- ✅ **No Secret Keys in Frontend**: Credentials only in Cloud Functions
- ✅ **Duplicate Prevention**: Prevents replay attacks
- ✅ **Webhook Verification**: Signature verification for webhooks
- ✅ **Authentication Required**: Only authenticated users can pay
- ✅ **HTTPS Only**: All communications encrypted
- ✅ **Audit Trail**: All payments logged to Firestore
- ✅ **Fail-Closed Security**: Denies on any error

## 📁 File Structure

```
├── functions/
│   ├── index.js          # Cloud Functions (payment processing)
│   └── package.json      # Dependencies
├── public/
│   ├── payment.js        # Frontend payment logic
│   └── payment-example.html # Example usage
├── firestore.rules        # Security rules
├── .gitignore            # Prevents secret commits
├── PESAPAL_DEPLOYMENT.md  # Deployment instructions
├── PESAPAL_SECURITY.md    # Security architecture
└── PESAPAL_README.md      # This file
```

## 🚀 Quick Start

### 1. Configure Pesapal Credentials

```bash
firebase functions:config:set pesapal.consumer_key="your_consumer_key"
firebase functions:config:set pesapal.consumer_secret="your_consumer_secret"
firebase functions:config:set pesapal.test_mode="true"
```

### 2. Install Dependencies

```bash
cd functions && npm install
```

### 3. Deploy

```bash
firebase deploy --only functions,firestore:rules
```

### 4. Update Frontend

Include Firebase SDK and payment script in your HTML (see `payment-example.html`)

## 💳 Usage

### Basic Payment

```javascript
const paymentData = {
    amount: 10000,           // Amount in UGX
    description: 'Subscription Payment',
    email: 'user@example.com',
    phone: '+256700000000',  // Optional
    currency: 'UGX'
};

try {
    const result = await processPayment(paymentData);
    // User will be redirected to Pesapal checkout
    // After payment, handle callback
} catch (error) {
    console.error('Payment failed:', error.message);
}
```

### Handle Pesapal Callback

```javascript
// After user returns from Pesapal
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('OrderTrackingId')) {
    const result = await handlePesapalCallback({
        OrderTrackingId: urlParams.get('OrderTrackingId'),
        OrderMerchantReference: urlParams.get('OrderMerchantReference')
    });
    console.log('Payment verified:', result);
}
```

### Get Payment History

```javascript
try {
    const payments = await getUserPaymentHistory(50);
    console.log('Payment history:', payments);
} catch (error) {
    console.error('Error:', error.message);
}
```

## 🔒 Security Rules

### Frontend Rules
1. **Never** decide payment success on frontend
2. **Always** wait for backend verification
3. **Only** use backend functions
4. **Never** store or log secret keys

### Backend Rules
1. **Always** verify with Pesapal API
2. **Always** validate amount, currency, status
3. **Always** check for duplicates
4. **Never** trust frontend data alone

## 📊 Payment Flow

```
1. User initiates payment
   ↓
2. Frontend calls backend initializePayment
   ↓
3. Backend validates and creates Pesapal order
   ↓
4. Backend returns checkout URL
   ↓
5. User redirected to Pesapal
   ↓
6. User completes payment on Pesapal
   ↓
7. Pesapal redirects back with order tracking ID
   ↓
8. Frontend calls backend verifyPayment
   ↓
9. Backend verifies with Pesapal API
   ↓
10. Backend validates payment data
    ↓
11. Backend saves to Firestore
    ↓
12. Backend returns success
    ↓
13. Frontend shows success message
```

## 🧪 Testing

### Test Mode

1. Set `pesapal.test_mode="true"` in Firebase config
2. Use Pesapal sandbox credentials
3. Test with small amounts
4. Verify in Pesapal dashboard

### Production

1. Set `pesapal.test_mode="false"`
2. Use Pesapal live credentials
3. Test with small real payment first
4. Monitor logs and Firestore

## 📝 Environment Variables

Required Firebase Functions config:
- `pesapal.consumer_key` - Pesapal consumer key
- `pesapal.consumer_secret` - Pesapal consumer secret
- `pesapal.test_mode` - "true" for testing, "false" for production
- `pesapal.webhook_secret` - Webhook verification secret (optional but recommended)
- `app.base_url` - Base URL for callbacks (optional)

## 🔍 Monitoring

### View Logs

```bash
firebase functions:log
firebase functions:log --only verifyPayment
```

### Check Firestore

1. Firebase Console → Firestore
2. View `payments` collection
3. Verify transactions

## 🐛 Troubleshooting

### Payment Not Verifying

1. Check Cloud Functions logs
2. Verify Pesapal credentials are set
3. Check transaction status in Pesapal dashboard
4. Verify amount matches exactly

### Webhook Not Working

1. Check webhook URL in Pesapal dashboard
2. Verify webhook secret is set
3. Check Cloud Functions logs
4. Test webhook manually

## 📚 Documentation

- **PESAPAL_DEPLOYMENT.md** - Complete deployment guide
- **PESAPAL_SECURITY.md** - Security architecture details
- **payment-example.html** - Frontend integration example

## ⚠️ Important Notes

1. **Never commit secrets** - Use `.gitignore`
2. **Always test in test mode first**
3. **Monitor logs regularly**
4. **Keep dependencies updated**
5. **Review security rules periodically**
6. **Backend verification is mandatory**
7. **Frontend never decides success**

## 🆘 Support

For issues:
1. Check logs: `firebase functions:log`
2. Review Pesapal dashboard
3. Check Firestore security rules
4. Verify Firebase configuration

## 📄 License

This payment system is part of the KIUMA project.

---

**Built with security as the top priority. Backend-first architecture ensures payment integrity.**

