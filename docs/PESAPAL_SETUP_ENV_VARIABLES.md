# Pesapal Setup - Using Environment Variables (Recommended)

## ✅ Best Solution: Environment Variables

Since `functions.config()` is deprecated (will stop working in March 2026), we recommend using **environment variables**. This works on **all Firebase plans** including Spark (free tier).

---

## 🚀 Quick Setup with Environment Variables

### Option 1: Using .env File (Easiest)

1. **Create `.env` file in `functions/` directory:**

```bash
cd functions
copy .env.example .env
```

2. **Edit `.env` file and add your credentials:**

```env
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_consumer_key_here
PESAPAL_CONSUMER_SECRET=your_consumer_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-domain.com
```

3. **Install dotenv package:**

```bash
cd functions
npm install dotenv
```

4. **Update `functions/index.js` to load .env file:**

Add this at the very top of `functions/index.js` (before any other code):

```javascript
// Load environment variables from .env file
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
```

5. **Deploy functions:**

```bash
cd ..
firebase deploy --only functions
```

---

### Option 2: Using Firebase Functions Config (Current Method)

**Works until March 2026**, then you'll need to migrate.

```bash
firebase functions:config:set pesapal.enabled="true"
firebase functions:config:set pesapal.consumer_key="your_key"
firebase functions:config:set pesapal.consumer_secret="your_secret"
firebase functions:config:set pesapal.test_mode="true"
firebase deploy --only functions
```

---

### Option 3: Using Firebase Console (For Production)

1. Go to Firebase Console → Functions → Configuration
2. Add environment variables there
3. Redeploy functions

---

## 📋 Complete Setup Example (.env Method)

### Step 1: Create .env File

```bash
cd functions
copy .env.example .env
```

### Step 2: Edit .env File

Open `functions/.env` and add:

```env
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=qkio1BGGYGlh48Yv7h7XG1G5gYgLU8ev
PESAPAL_CONSUMER_SECRET=your_actual_secret_here
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-domain.com
```

### Step 3: Install dotenv

```bash
npm install dotenv
```

### Step 4: Update index.js

Add this at the top of `functions/index.js`:

```javascript
// Load environment variables
require('dotenv').config();
```

### Step 5: Deploy

```bash
cd ..
firebase deploy --only functions
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Use `.env` file for local development
- Add `.env` to `.gitignore` (never commit secrets)
- Use Firebase Console environment variables for production
- Rotate credentials regularly

### ❌ DON'T:
- Commit `.env` file to git
- Hardcode credentials in code
- Share credentials in chat/email
- Use production credentials in test mode

---

## 📝 .gitignore

Make sure `functions/.env` is in your `.gitignore`:

```gitignore
# Environment variables
functions/.env
functions/.env.local
functions/.env.*.local
```

---

## 🔄 Migration from functions.config()

If you're currently using `functions.config()`, you can migrate:

1. **Export current config:**

```bash
firebase functions:config:export
```

2. **Create .env file from exported values**

3. **Update code to use environment variables**

4. **Deploy**

---

## ⚠️ Deprecation Timeline

- **Now - March 2026**: `functions.config()` still works
- **March 2026**: `functions.config()` will stop working
- **Recommendation**: Migrate to environment variables now

---

## 🎯 Which Method Should I Use?

| Method | Plan | Security | Ease | Future-Proof |
|--------|------|----------|------|--------------|
| **Environment Variables (.env)** | All plans | Good | Easy | ✅ Yes |
| **functions.config()** | Spark+ | Good | Easy | ❌ No (deprecated) |
| **Secrets (params)** | Blaze only | Best | Medium | ✅ Yes |

**Recommendation**: Use **environment variables** (.env file) - works on all plans and is future-proof!

---

## ✅ Checklist

- [ ] `.env` file created in `functions/` directory
- [ ] Credentials added to `.env` file
- [ ] `dotenv` package installed
- [ ] `index.js` updated to load `.env`
- [ ] `.env` added to `.gitignore`
- [ ] Functions deployed
- [ ] Test payment completed

---

## 🆘 Troubleshooting

### Environment variables not loading

**Solution:** Make sure:
1. `.env` file is in `functions/` directory
2. `dotenv` package is installed
3. `require('dotenv').config()` is at the top of `index.js`

### Still getting "credentials not configured"

**Solution:** Check:
1. Variable names match exactly (case-sensitive)
2. No quotes around values in `.env` file
3. No spaces around `=` sign
4. Functions redeployed after changes

---

**Environment variables are the recommended approach - works on all plans and future-proof! ✅**

