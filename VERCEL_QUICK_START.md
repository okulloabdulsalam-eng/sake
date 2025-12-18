# ✅ Vercel Deployment - Quick Start (EASIEST!)

## 🎯 Perfect Solution: "Just Upload Website and Done"

**Yes!** You can use Pesapal with just uploading your website to Vercel. No backend server needed!

---

## 🚀 3 Simple Steps

### Step 1: Deploy to Vercel (2 minutes)

1. **Go to https://vercel.com**
2. **Sign up** (free, use GitHub)
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Vercel auto-deploys!**

**Done!** Vercel gives you: `https://your-app.vercel.app`

### Step 2: Set Environment Variables (1 minute)

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-app.vercel.app
```

**Get credentials:** Pesapal dashboard → Settings → API Credentials

### Step 3: Update Vercel URL (30 seconds)

1. **Open `pay.html`**
2. **Find:** `window.VERCEL_API_URL = 'https://your-app.vercel.app';`
3. **Replace with your actual Vercel URL**

---

## ✅ That's It!

Your Pesapal payment system is now working - **just upload to Vercel and done!**

---

## 💰 Vercel Free Tier

- ✅ **Completely free**
- ✅ **No credit card** needed
- ✅ **Unlimited deployments**
- ✅ **Perfect for small apps**

---

## 📁 What I Created

- ✅ `api/pesapal.js` - Serverless function (Vercel auto-detects this)
- ✅ `public/payment-vercel.js` - Frontend integration
- ✅ Updated `pay.html` - Uses Vercel by default
- ✅ `VERCEL_DEPLOYMENT_SIMPLE.md` - Detailed guide
- ✅ `VERCEL_QUICK_START.md` - This quick guide

---

## 🎯 Why This is Perfect

- ✅ **No backend server** - Just one serverless function
- ✅ **Free** - Vercel free tier
- ✅ **Easy** - Deploy from GitHub, auto-detects
- ✅ **Secure** - Secrets in environment variables
- ✅ **Works like "just upload website"** - Exactly what you wanted!

---

## 🧪 Test After Deployment

1. **Visit:** `https://your-app.vercel.app/api/pesapal`
   - Should return error (needs POST), but confirms function is deployed

2. **Test payment** in your app

---

## 📚 More Info

- **`VERCEL_DEPLOYMENT_SIMPLE.md`** - Complete detailed guide
- **`PESAPAL_FRONTEND_ONLY.md`** - Explains why backend is needed (but Vercel solves it!)

---

**This is the easiest solution - just deploy to Vercel and you're done! 🚀**

