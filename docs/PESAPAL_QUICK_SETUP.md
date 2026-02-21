# Pesapal Quick Setup - Simple Steps

## ✅ Issue Fixed: .env.example File

The `.env.example` file is now created. Here's what to do:

---

## 🚀 Quick Setup (Choose One Method)

### Method 1: Use functions.config() (Easiest - Works Now)

**You already did this!** Just deploy:

```bash
cd ..
firebase deploy --only functions
```

**That's it!** Your config is set and ready to use.

---

### Method 2: Use .env File (Future-Proof)

**Step 1: Create .env file**

In PowerShell, run:
```powershell
cd functions
New-Item -Path .env -ItemType File
```

Or manually create a file named `.env` in the `functions` folder.

**Step 2: Add your credentials to .env file**

Open `functions/.env` and add:
```env
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-domain.com
```

**Step 3: Install dotenv**
```bash
cd functions
npm install dotenv
```

**Step 4: Deploy**
```bash
cd ..
firebase deploy --only functions
```

---

## 🎯 Recommended: Use Method 1 (Config)

Since you already set the config values, just deploy:

```bash
firebase deploy --only functions
```

The code will automatically use your config values. No need for .env file unless you want to migrate later.

---

## ✅ What You Already Have

You've already set:
- ✅ `pesapal.enabled="true"`
- ✅ (You can set the other values with `firebase functions:config:set`)

Just deploy and you're done!

---

## 📝 Complete Config Setup (If Needed)

If you haven't set all values yet:

```bash
firebase functions:config:set pesapal.enabled="true"
firebase functions:config:set pesapal.consumer_key="your_key"
firebase functions:config:set pesapal.consumer_secret="your_secret"
firebase functions:config:set pesapal.test_mode="true"
firebase functions:config:set app.base_url="https://your-domain.com"
firebase deploy --only functions
```

---

## 🎉 You're Ready!

Just deploy and test your payment system!

