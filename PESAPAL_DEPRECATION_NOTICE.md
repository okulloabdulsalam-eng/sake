# Pesapal Setup - Deprecation Notice & Solutions

## ⚠️ Important: functions.config() is Deprecated

You received this warning:
```
! DEPRECATION NOTICE: Action required before March 2026
The functions.config() API and the Cloud Runtime Config service are deprecated.
```

**What this means:**
- `functions.config()` will **stop working in March 2026**
- You need to migrate to a different method before then
- Your current setup will continue working until March 2026

---

## ✅ Good News: Your Setup Still Works!

The config you just set will work perfectly until March 2026. You have time to migrate.

---

## 🚀 Three Options to Handle This

### Option 1: Continue Using Config (Until March 2026) ⏰

**Pros:**
- ✅ Works right now
- ✅ No code changes needed
- ✅ Simple setup

**Cons:**
- ❌ Will stop working in March 2026
- ❌ Need to migrate later

**What to do:**
- Continue using `firebase functions:config:set` commands
- Plan to migrate before March 2026
- Everything works until then!

---

### Option 2: Use Environment Variables (Recommended) ⭐

**Pros:**
- ✅ Works on all Firebase plans (including Spark/free)
- ✅ Future-proof (won't be deprecated)
- ✅ More secure
- ✅ Works now and forever

**Cons:**
- ⚠️ Requires small code change (already done!)

**What to do:**

1. **Install dotenv:**
```bash
cd functions
npm install dotenv
```

2. **Create `.env` file:**
```bash
cd functions
copy .env.example .env
```

3. **Edit `.env` file:**
```env
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-domain.com
```

4. **Deploy:**
```bash
cd ..
firebase deploy --only functions
```

**The code already supports this!** It will automatically use environment variables if available, or fall back to config.

See `PESAPAL_SETUP_ENV_VARIABLES.md` for detailed instructions.

---

### Option 3: Upgrade to Blaze & Use Secrets (Best Security) 🔒

**Pros:**
- ✅ Most secure option
- ✅ Official Firebase recommendation
- ✅ Future-proof

**Cons:**
- ❌ Requires Blaze plan (pay-as-you-go)
- ❌ Costs money (but very minimal for small apps)

**What to do:**
1. Upgrade to Blaze plan
2. Use `firebase functions:secrets:set` commands
3. Code already supports this (just needs to be enabled)

---

## 📋 Recommended Path Forward

### For Now (Immediate):
✅ **Continue using `functions.config()`** - it works until March 2026

### Before March 2026:
⭐ **Migrate to environment variables** - works on Spark plan, future-proof

### Optional (If you want best security):
🔒 **Upgrade to Blaze and use secrets** - most secure option

---

## 🔄 Migration Guide

### From Config to Environment Variables:

1. **Export your current config:**
```bash
firebase functions:config:get > config-backup.json
```

2. **Create `.env` file:**
```bash
cd functions
copy .env.example .env
```

3. **Copy values from config to .env:**
```env
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_key_from_config
PESAPAL_CONSUMER_SECRET=your_secret_from_config
PESAPAL_TEST_MODE=true
APP_BASE_URL=your_url_from_config
```

4. **Install dotenv:**
```bash
npm install dotenv
```

5. **Deploy:**
```bash
cd ..
firebase deploy --only functions
```

6. **Test:** Make a test payment to verify it works

7. **Remove config (optional):**
```bash
firebase functions:config:unset pesapal
firebase functions:config:unset app
```

---

## ⏰ Timeline

| Date | Status | Action Required |
|------|--------|----------------|
| **Now** | ✅ Config works | None - continue using |
| **Before March 2026** | ⚠️ Plan migration | Migrate to env vars or secrets |
| **March 2026** | ❌ Config stops working | Must have migrated |

---

## 🎯 My Recommendation

1. **Right now:** Keep using `functions.config()` - it works!
2. **Before March 2026:** Migrate to environment variables (Option 2)
3. **Why:** Environment variables work on Spark plan, are future-proof, and more secure

---

## 📚 Documentation

- **PESAPAL_SETUP_ENV_VARIABLES.md** - Complete guide for environment variables
- **PESAPAL_SETUP_SPARK_PLAN.md** - Guide for using config (current method)
- **PESAPAL_SETUP_COMPLETE_GUIDE.md** - Guide for Blaze plan with secrets

---

## ✅ Quick Decision Guide

**Q: Do I need to do anything right now?**
A: No! Your current setup works until March 2026.

**Q: What should I do before March 2026?**
A: Migrate to environment variables (Option 2) - see guide above.

**Q: Can I keep using config?**
A: Yes, until March 2026. Then you must migrate.

**Q: Which option is best?**
A: Environment variables (Option 2) - works on Spark plan, future-proof.

---

**Bottom line: Your setup works! You have until March 2026 to migrate. No rush! ✅**

