# Railway Deployment Guide - Pesapal Payment Server

## 🎯 Complete Step-by-Step Guide

This guide will help you deploy the Pesapal payment server to Railway (free tier available, no Blaze plan needed!).

---

## ✅ What You Get

- ✅ Free tier on Railway (no credit card required for basic usage)
- ✅ Express.js server for Pesapal payments
- ✅ Same functionality as Firebase Functions
- ✅ No Blaze plan upgrade needed
- ✅ Easy deployment from GitHub

---

## 🚀 Step 1: Prepare Your Code

### Option A: If you have GitHub repo

1. **Push the railway-server folder to GitHub:**
   ```bash
   git add railway-server/
   git commit -m "Add Railway server for Pesapal payments"
   git push
   ```

### Option B: If you don't have GitHub repo

1. **Create a GitHub account** (if you don't have one)
2. **Create a new repository** on GitHub
3. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

---

## 🚀 Step 2: Deploy to Railway

### 2.1 Create Railway Account

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign up with **GitHub** (easiest way)
4. Authorize Railway to access your GitHub

### 2.2 Deploy Your Project

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will detect Node.js automatically
5. **Important:** Set root directory to `railway-server`:
   - Click on your service
   - Go to **Settings** → **Root Directory**
   - Enter: `railway-server`
   - Click **Save**

### 2.3 Set Environment Variables

1. In Railway dashboard, click on your service
2. Go to **Variables** tab
3. Add these variables:

```
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_actual_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_actual_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-website-domain.com
```

**Where to get credentials:**
- Log into Pesapal dashboard
- Go to Settings → API Credentials
- Copy Consumer Key and Consumer Secret

### 2.4 Get Your Railway URL

1. Railway will automatically deploy your server
2. Go to **Settings** → **Networking**
3. Click **"Generate Domain"** (or use the default)
4. Copy your Railway URL (e.g., `https://your-app.railway.app`)

---

## 🔧 Step 3: Update Frontend

Update your frontend to use Railway instead of Firebase Functions.

### Update `public/payment.js`

Find this line:
```javascript
const functions = getFunctions();
const initializePaymentFunction = functions.httpsCallable('initializePayment');
```

Replace with:
```javascript
const RAILWAY_API_URL = 'https://your-app.railway.app'; // Your Railway URL

async function initializePayment(paymentData) {
  // ... validation code ...
  
  const response = await fetch(`${RAILWAY_API_URL}/api/initialize-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: parseFloat(paymentData.amount),
      currency: paymentData.currency || 'UGX',
      description: paymentData.description,
      email: paymentData.email,
      phone: paymentData.phone || '',
      first_name: paymentData.first_name || '',
      last_name: paymentData.last_name || '',
      callback_url: paymentData.callback_url || `${window.location.origin}/payment/callback.html`,
      cancel_url: paymentData.cancel_url || `${window.location.origin}/payment/cancel.html`
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    return {
      success: true,
      reference: result.reference,
      checkout_url: result.checkout_url,
      order_tracking_id: result.order_tracking_id
    };
  } else {
    throw new Error(result.message || 'Failed to initialize payment');
  }
}
```

---

## 🧪 Step 4: Test

1. **Test health endpoint:**
   - Visit: `https://your-app.railway.app/api/health`
   - Should return: `{"success":true,"message":"KIUMA Pesapal Payment Server is running"}`

2. **Test payment:**
   - Go to your app's payment page
   - Select Pesapal payment method
   - Complete a test payment

---

## 💰 Railway Pricing

### Free Tier:
- ✅ $5 free credit per month
- ✅ 500 hours of usage
- ✅ Perfect for small apps
- ✅ No credit card required for basic usage

### Paid (if you exceed free tier):
- $0.000463 per GB-hour
- Very affordable for small apps
- You'll likely stay in free tier

---

## 🔒 Security

- ✅ Environment variables stored securely in Railway
- ✅ HTTPS automatically enabled
- ✅ No secrets in code
- ✅ Same security as Firebase Functions

---

## 📊 Monitoring

### View Logs:
1. Go to Railway dashboard
2. Click on your service
3. Go to **Deployments** tab
4. Click on latest deployment
5. View **Logs**

### Health Check:
Visit: `https://your-app.railway.app/api/health`

---

## 🔄 Updating Your Server

1. **Make changes to code**
2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Update payment server"
   git push
   ```
3. **Railway automatically redeploys** (takes 1-2 minutes)

---

## 🐛 Troubleshooting

### Server not starting

**Check logs in Railway dashboard:**
- Go to Deployments → Latest → Logs
- Look for error messages

### "Pesapal credentials not configured"

**Solution:** Make sure environment variables are set in Railway:
- Go to Variables tab
- Verify all variables are set correctly
- Redeploy if needed

### Payment not working

**Solution:**
1. Check Railway logs for errors
2. Verify Railway URL is correct in frontend
3. Test health endpoint first
4. Check Pesapal dashboard for transaction status

---

## ✅ Checklist

- [ ] Railway account created
- [ ] Code pushed to GitHub
- [ ] Railway project created
- [ ] Root directory set to `railway-server`
- [ ] Environment variables set
- [ ] Railway URL obtained
- [ ] Frontend updated with Railway URL
- [ ] Health endpoint tested
- [ ] Test payment completed

---

## 🎉 You're Done!

Your Pesapal payment server is now running on Railway - no Blaze plan needed!

**Next Steps:**
1. Test a payment
2. Monitor logs
3. Set up webhook in Pesapal dashboard (optional)

---

## 📚 Files Created

- ✅ `railway-server/index.js` - Express server
- ✅ `railway-server/package.json` - Dependencies
- ✅ `railway-server/.env.example` - Environment variables template
- ✅ `railway-server/README.md` - Quick reference
- ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - This file

---

**Your Pesapal payment system is ready to deploy on Railway! 🚀**

