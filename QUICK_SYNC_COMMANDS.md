# ⚡ Quick Sync Commands

## 🎯 Copy-Paste Commands for Syncing Changes

---

## 📋 Standard Workflow (All Methods)

```bash
# 1. Make your changes to files locally

# 2. Stage all changes
git add .

# 3. Commit with message
git commit -m "Describe your changes here"

# 4. Push to GitHub
git push
```

---

## 🔥 Firebase Hosting (Manual Deploy)

```bash
# After pushing to GitHub:
firebase deploy --only hosting
```

**Full workflow:**
```bash
git add .
git commit -m "Update payment page"
git push
firebase deploy --only hosting
```

---

## ⚡ Vercel (Auto-Deploy)

```bash
# Just push to GitHub - Vercel auto-deploys!
git add .
git commit -m "Update payment page"
git push
# ✨ Vercel automatically deploys in 1-2 minutes!
```

**No manual deploy needed!**

---

## 🚂 Railway (Auto-Deploy)

```bash
# Just push to GitHub - Railway auto-deploys!
git add .
git commit -m "Update payment page"
git push
# ✨ Railway automatically deploys in 1-2 minutes!
```

**No manual deploy needed!**

---

## 🔍 Check Deployment Status

### Firebase:
```bash
firebase hosting:channel:list
```

### Vercel:
- Visit: https://vercel.com/dashboard
- Check "Deployments" tab

### Railway:
- Visit: https://railway.app/dashboard
- Check "Deployments" tab

---

## 🧪 Test Before Deploying

```bash
# Test locally first:
# Open index.html in browser
# Or use local server:
python -m http.server 8000
# Then visit: http://localhost:8000
```

---

## 📱 For Mobile App Integration

If your app uses WebView pointing to your website:

1. **Make changes locally**
2. **Push to GitHub**
3. **Deploy** (Firebase) or **auto-deploys** (Vercel/Railway)
4. **Changes appear in app automatically** (no app update needed!)

---

## ✅ Quick Checklist

- [ ] Made changes locally
- [ ] Tested locally
- [ ] Committed changes (`git commit`)
- [ ] Pushed to GitHub (`git push`)
- [ ] Deployed (Firebase) or auto-deployed (Vercel/Railway)
- [ ] Verified changes on live site

---

**That's it! Your changes are synced! 🚀**

