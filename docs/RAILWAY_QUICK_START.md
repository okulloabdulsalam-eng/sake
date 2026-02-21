# Railway Quick Start - 3 Simple Steps

## ✅ What I've Created For You

- ✅ `railway-server/index.js` - Express server (ready to deploy)
- ✅ `railway-server/package.json` - Dependencies
- ✅ `public/payment-railway.js` - Frontend integration for Railway
- ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Complete guide

---

## 🎯 YOUR TURN: 3 Simple Steps

### Step 1: Deploy to Railway (5 minutes)

1. **Go to https://railway.app**
2. **Sign up with GitHub** (free)
3. **Click "New Project"** → **"Deploy from GitHub repo"**
4. **Select your repository**
5. **Set root directory to:** `railway-server`
6. **Railway will auto-deploy!**

---

### Step 2: Set Environment Variables (2 minutes)

In Railway dashboard → Variables, add:

```
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-domain.com
```

**Get credentials from:** Pesapal dashboard → Settings → API Credentials

---

### Step 3: Update Frontend (1 minute)

1. **Get your Railway URL** (Railway dashboard → Settings → Networking)
2. **Open `pay.html`**
3. **Find this line:**
   ```html
   <script src="public/payment.js"></script>
   ```
4. **Replace with:**
   ```html
   <script>
     // Set your Railway URL
     window.RAILWAY_API_URL = 'https://your-app.railway.app';
   </script>
   <script src="public/payment-railway.js"></script>
   ```
5. **Replace `your-app.railway.app` with your actual Railway URL**

---

## ✅ That's It!

Your Pesapal payment system is now running on Railway - **no Blaze plan needed!**

---

## 🧪 Test It

1. Visit: `https://your-app.railway.app/api/health`
   - Should show: `{"success":true,"message":"KIUMA Pesapal Payment Server is running"}`

2. Go to your payment page
3. Select Pesapal payment
4. Complete test payment

---

## 📁 Files You Need

- **`railway-server/`** - Backend server (deploy this to Railway)
- **`public/payment-railway.js`** - Frontend integration (use this instead of payment.js)
- **`RAILWAY_DEPLOYMENT_GUIDE.md`** - Detailed instructions

---

## 🆘 Need Help?

See `RAILWAY_DEPLOYMENT_GUIDE.md` for complete step-by-step instructions.

---

**Railway is free for small apps - perfect solution! 🚀**

