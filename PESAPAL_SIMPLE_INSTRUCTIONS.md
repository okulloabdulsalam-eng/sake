# Pesapal Setup - Simple Instructions

## ✅ What I've Done For You

I've automatically created all the necessary files:
- ✅ Updated `functions/index.js` to support both config and environment variables
- ✅ Added `dotenv` package to `functions/package.json`
- ✅ Created `functions/.env.example` file
- ✅ Created `functions/.env` file (template)
- ✅ Updated code to automatically load environment variables

---

## 🎯 What YOU Need To Do (3 Simple Steps)

### Step 1: Fill in Your Pesapal Credentials

Open the file: `functions/.env`

Replace these values with your actual Pesapal credentials:

```env
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_actual_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_actual_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-actual-domain.com
```

**Where to get credentials:**
- Log into your Pesapal dashboard
- Go to Settings → API Credentials
- Copy your Consumer Key and Consumer Secret

---

### Step 2: Install Dependencies

Open PowerShell in your project folder and run:

```bash
cd functions
npm install
```

This will install the `dotenv` package needed to load your `.env` file.

---

### Step 3: Deploy Functions

```bash
cd ..
firebase deploy --only functions
```

---

## ✅ That's It!

After these 3 steps, your Pesapal payment system will be ready to use!

---

## 🧪 Test It

1. Go to your app's `pay.html` page
2. Select a payment type and amount
3. Choose "Pesapal" as payment method
4. Click "Pay with Pesapal"
5. Complete payment on Pesapal checkout

---

## 🆘 If Something Goes Wrong

### Error: "Pesapal credentials not configured"

**Solution:** Make sure you filled in the `.env` file correctly:
- No quotes around values
- No spaces around `=` sign
- Values are on the same line as the variable name

### Error: "dotenv not found"

**Solution:** Run `npm install` in the `functions` folder:
```bash
cd functions
npm install
```

### Payment not working

**Solution:** 
1. Check Firebase Functions logs: `firebase functions:log`
2. Verify your credentials in Pesapal dashboard
3. Make sure `PESAPAL_TEST_MODE=true` for testing

---

## 📝 File Locations

- **Your credentials file:** `functions/.env` (edit this!)
- **Example file:** `functions/.env.example` (don't edit, just reference)
- **Main code:** `functions/index.js` (already set up, don't edit)

---

## 🎉 You're Almost Done!

Just fill in your credentials in `functions/.env` and deploy. That's it!

