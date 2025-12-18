# ✅ Pesapal with Vercel - EASIEST Solution!

## 🎉 Perfect for You: "Just Upload Website and Done"

This is the **easiest solution** - deploy to Vercel (free) and you're done!

---

## 🚀 3 Simple Steps

### Step 1: Push to GitHub (if not already)

```bash
git add .
git commit -m "Add Pesapal integration"
git push
```

### Step 2: Deploy to Vercel (2 minutes)

1. **Go to https://vercel.com**
2. **Sign up** (free, use GitHub)
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Vercel auto-detects and deploys!**

**That's it!** Vercel gives you a URL like `https://your-app.vercel.app`

### Step 3: Set Environment Variables (1 minute)

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-app.vercel.app
```

**Get credentials:** Pesapal dashboard → Settings → API Credentials

---

## ✅ Update Frontend (30 seconds)

1. **Open `pay.html`**
2. **Find:** `window.RAILWAY_API_URL = 'https://your-app.railway.app';`
3. **Replace with:** `window.VERCEL_API_URL = 'https://your-app.vercel.app';`
4. **Change script from:**
   ```html
   <script src="public/payment-railway.js"></script>
   ```
   **To:**
   ```html
   <script src="public/payment-vercel.js"></script>
   ```

---

## 🎉 That's It!

Your Pesapal payment system is now working - **just upload to Vercel and done!**

---

## 💰 Vercel Free Tier

- ✅ **Completely free**
- ✅ **No credit card** needed
- ✅ **Unlimited deployments**
- ✅ **Perfect for small apps**

---

## 🧪 Test

1. Visit: `https://your-app.vercel.app/api/pesapal`
   - Should return error (needs POST), but confirms function is deployed

2. Test payment in your app

---

## 📁 Files Created

- ✅ `api/pesapal.js` - Serverless function (Vercel auto-detects this)
- ✅ `public/payment-vercel.js` - Frontend integration
- ✅ `VERCEL_DEPLOYMENT_SIMPLE.md` - This guide

---

## 🎯 Why This is Perfect

- ✅ **No backend server** - Just serverless function
- ✅ **Free** - Vercel free tier
- ✅ **Easy** - Deploy from GitHub, auto-detects
- ✅ **Secure** - Secrets in environment variables
- ✅ **Works like "just upload website"** - That's exactly what it is!

---

**This is the easiest solution - just deploy to Vercel and you're done! 🚀**

