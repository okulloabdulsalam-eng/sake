# Pesapal Frontend-Only Integration (Simple but Less Secure)

## ⚠️ Important Security Warning

**Short answer:** You CAN do Pesapal without a backend, but it's **NOT RECOMMENDED** for security reasons.

**Why backend is needed:**
- Consumer Secret must be kept secret (cannot be in frontend code)
- Payment verification must happen server-side
- Frontend code can be manipulated by attackers

**However:** There IS a way to do it with minimal backend using **free serverless functions**.

---

## 🎯 Best Solution: Use Free Serverless Function

Instead of full backend, use a **free serverless function** that's super easy to deploy:

### Option 1: Vercel Serverless Functions (FREE, Easiest)

**Pros:**
- ✅ Completely free
- ✅ No credit card needed
- ✅ Deploy in 2 minutes
- ✅ Works with static sites

**How it works:**
1. Create one serverless function file
2. Deploy to Vercel (free)
3. Your website calls the function
4. Done!

---

## 🚀 Quick Setup: Vercel Serverless Function

### Step 1: Create Function File

Create `api/pesapal.js` in your project:

```javascript
// api/pesapal.js - Vercel Serverless Function
const axios = require('axios');
const crypto = require('crypto');

const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3';
const PESAPAL_SANDBOX_URL = 'https://cybqa.pesapal.com/pesapalv3';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, amount, currency, description, email, callback_url, cancel_url } = req.body;

  // Get credentials from environment variables (set in Vercel dashboard)
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const testMode = process.env.PESAPAL_TEST_MODE === 'true';
  const baseUrl = testMode ? PESAPAL_SANDBOX_URL : PESAPAL_BASE_URL;

  if (!consumerKey || !consumerSecret) {
    return res.status(500).json({ error: 'Pesapal credentials not configured' });
  }

  try {
    if (action === 'initialize') {
      // Get OAuth token
      const tokenResponse = await axios.post(
        `${baseUrl}/api/Auth/RequestToken`,
        { consumer_key: consumerKey, consumer_secret: consumerSecret },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const token = tokenResponse.data.token;
      const reference = `KIUMA-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // Create order
      const orderResponse = await axios.post(
        `${baseUrl}/api/Transactions/SubmitOrderRequest`,
        {
          id: reference,
          currency: currency || 'UGX',
          amount: parseFloat(amount),
          description: description,
          callback_url: callback_url,
          cancellation_url: cancel_url,
          billing_address: {
            email_address: email,
            phone_number: '',
            country_code: 'UG',
            first_name: '',
            last_name: ''
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.json({
        success: true,
        reference: reference,
        checkout_url: orderResponse.data.redirect_url,
        order_tracking_id: orderResponse.data.order_tracking_id
      });
    }

    if (action === 'verify') {
      const { order_tracking_id } = req.body;
      
      // Get token
      const tokenResponse = await axios.post(
        `${baseUrl}/api/Auth/RequestToken`,
        { consumer_key: consumerKey, consumer_secret: consumerSecret },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const token = tokenResponse.data.token;

      // Verify payment
      const verifyResponse = await axios.get(
        `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      const status = verifyResponse.data.payment_status_description || verifyResponse.data.status || '';
      
      return res.json({
        success: status.toLowerCase() === 'completed' || status.toLowerCase() === 'success',
        status: status,
        data: verifyResponse.data
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Pesapal error:', error);
    return res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
}
```

### Step 2: Deploy to Vercel (FREE)

1. **Go to https://vercel.com**
2. **Sign up** (free, use GitHub)
3. **Import your repository**
4. **Vercel auto-detects** and deploys
5. **Set environment variables** in Vercel dashboard:
   - `PESAPAL_CONSUMER_KEY`
   - `PESAPAL_CONSUMER_SECRET`
   - `PESAPAL_TEST_MODE=true`

### Step 3: Update Frontend

Update `pay.html` to call Vercel function:

```javascript
// Replace Railway/Firebase code with:
const VERCEL_API_URL = 'https://your-app.vercel.app'; // Your Vercel URL

async function initializePayment(paymentData) {
  const response = await fetch(`${VERCEL_API_URL}/api/pesapal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'initialize',
      amount: paymentData.amount,
      currency: paymentData.currency || 'UGX',
      description: paymentData.description,
      email: paymentData.email,
      callback_url: paymentData.callback_url,
      cancel_url: paymentData.cancel_url
    })
  });
  
  const result = await response.json();
  if (result.success) {
    window.location.href = result.checkout_url;
  } else {
    throw new Error(result.error);
  }
}
```

---

## ✅ That's It!

**Benefits:**
- ✅ **Completely free** (Vercel free tier)
- ✅ **No credit card** needed
- ✅ **Deploy in 2 minutes**
- ✅ **Works with static sites**
- ✅ **Secure** (secrets in environment variables)

---

## 📝 Alternative: Netlify Functions (Also FREE)

Same approach, but use Netlify instead of Vercel:
- Go to https://netlify.com
- Deploy your site
- Create `netlify/functions/pesapal.js`
- Set environment variables
- Done!

---

## ⚠️ Why Not Pure Frontend-Only?

**You CANNOT do it 100% frontend-only because:**
1. Consumer Secret must be secret (if in frontend, anyone can see it)
2. OAuth token requires secret
3. Payment verification requires secret
4. Security risk if secret is exposed

**But with Vercel/Netlify:**
- ✅ Secrets stay secure (environment variables)
- ✅ Free tier available
- ✅ Super easy to deploy
- ✅ Works like "just upload website"

---

## 🎯 My Recommendation

**Use Vercel Serverless Functions:**
- ✅ Free
- ✅ Easy (2 minutes to set up)
- ✅ Secure
- ✅ Works with your static site
- ✅ No backend server needed

---

**I can create the Vercel function file for you if you want! Just say "create Vercel function" and I'll do it! 🚀**

