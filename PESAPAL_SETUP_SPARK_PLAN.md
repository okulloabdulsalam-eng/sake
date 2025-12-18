# Pesapal Setup Guide - Spark Plan (No Blaze Upgrade Required)

## ✅ Solution: Using Firebase Functions Config

Since your project is on the **Spark plan** (free tier), we've modified the code to use `functions.config()` instead of secrets. This works on the Spark plan without requiring an upgrade to Blaze.

---

## 🚀 Quick Setup (Spark Plan)

### Step 1: Enable Pesapal System

```bash
firebase functions:config:set pesapal.enabled="true"
```

### Step 2: Set Your Pesapal Credentials

```bash
# Set Consumer Key
firebase functions:config:set pesapal.consumer_key="your_consumer_key_here"

# Set Consumer Secret
firebase functions:config:set pesapal.consumer_secret="your_consumer_secret_here"

# Set Test Mode (true for testing, false for production)
firebase functions:config:set pesapal.test_mode="true"
```

### Step 3: Set Optional Configuration

```bash
# Set Webhook Secret (optional but recommended)
firebase functions:config:set pesapal.webhook_secret="your_webhook_secret"

# Set Notification ID (optional)
firebase functions:config:set pesapal.notification_id="your_notification_id"

# Set Base URL (your website URL)
firebase functions:config:set app.base_url="https://your-domain.com"
```

### Step 4: Verify Configuration

```bash
# View all config values (values are shown, be careful!)
firebase functions:config:get
```

### Step 5: Deploy Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## 📋 Complete Example

```bash
# 1. Enable Pesapal
firebase functions:config:set pesapal.enabled="true"

# 2. Set credentials (replace with your actual values)
firebase functions:config:set pesapal.consumer_key="qkio1BGGYGlh48Yv7h7XG1G5gYgLU8ev"
firebase functions:config:set pesapal.consumer_secret="your_secret_here"
firebase functions:config:set pesapal.test_mode="true"

# 3. Set base URL (replace with your actual domain)
firebase functions:config:set app.base_url="https://your-domain.com"

# 4. Deploy
firebase deploy --only functions
```

---

## 🔍 Verify Your Setup

After deploying, check the logs:

```bash
firebase functions:log
```

Test a payment in your app and check if it works.

---

## ⚠️ Important Notes

### Security Considerations

1. **Config Values Are Visible**: Unlike secrets, config values can be viewed with `firebase functions:config:get`
2. **Don't Commit Config**: Never commit your `.runtimeconfig.json` file to git
3. **Use Test Mode First**: Always test with `pesapal.test_mode="true"` first

### Spark Plan Limitations

- ✅ Functions config works on Spark plan
- ✅ No upgrade to Blaze required
- ⚠️ Config values are less secure than secrets (but still better than hardcoding)
- ⚠️ For production, consider upgrading to Blaze for better security

---

## 🔄 Updating Configuration

To update a config value:

```bash
# Update consumer key
firebase functions:config:set pesapal.consumer_key="new_key_here"

# Redeploy functions to use new config
firebase deploy --only functions
```

---

## 🐛 Troubleshooting

### Error: "Pesapal credentials not configured"

**Solution:** Make sure you've set the config values:
```bash
firebase functions:config:set pesapal.consumer_key="your_key"
firebase functions:config:set pesapal.consumer_secret="your_secret"
firebase deploy --only functions
```

### Error: "Pesapal payment system is currently disabled"

**Solution:** Enable it:
```bash
firebase functions:config:set pesapal.enabled="true"
firebase deploy --only functions
```

### Config Not Working After Deploy

**Solution:** Make sure you redeploy after setting config:
```bash
firebase deploy --only functions
```

---

## 📚 Comparison: Config vs Secrets

| Feature | Config (Spark Plan) | Secrets (Blaze Plan) |
|---------|-------------------|---------------------|
| Plan Required | Spark (Free) | Blaze (Pay-as-you-go) |
| Security | Good | Better (encrypted) |
| Visibility | Can view values | Cannot view values |
| Setup | `functions:config:set` | `functions:secrets:set` |
| Cost | Free | Pay per use |

---

## ✅ Checklist

- [ ] Pesapal enabled: `pesapal.enabled="true"`
- [ ] Consumer key set: `pesapal.consumer_key`
- [ ] Consumer secret set: `pesapal.consumer_secret`
- [ ] Test mode set: `pesapal.test_mode="true"` (or "false" for production)
- [ ] Base URL set: `app.base_url`
- [ ] Functions deployed: `firebase deploy --only functions`
- [ ] Test payment completed successfully

---

## 🎉 You're Ready!

Your Pesapal payment system is now configured and ready to use on the Spark plan!

**Next Steps:**
1. Test a payment in your app
2. Check Firebase Functions logs
3. Verify payment in Pesapal dashboard
4. When ready for production, set `pesapal.test_mode="false"`

---

## 💡 Future Upgrade to Blaze

If you want better security later, you can:
1. Upgrade to Blaze plan
2. Migrate from config to secrets
3. Use `defineString()` with secrets (more secure)

But for now, the config method works perfectly fine on Spark plan! ✅

