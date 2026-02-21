# KIUMA Pesapal Payment Server - Railway Deployment

Express.js server for Pesapal payment processing. Deploy this to Railway instead of Firebase Functions.

## 🚀 Quick Deploy to Railway

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub (free)
3. Create a new project

### Step 2: Deploy from GitHub

1. **Push this code to GitHub:**
   ```bash
   git add railway-server/
   git commit -m "Add Railway server for Pesapal"
   git push
   ```

2. **In Railway:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `railway-server` folder as root directory

### Step 3: Set Environment Variables

In Railway dashboard → Variables, add:

```
PESAPAL_ENABLED=true
PESAPAL_CONSUMER_KEY=your_consumer_key
PESAPAL_CONSUMER_SECRET=your_consumer_secret
PESAPAL_TEST_MODE=true
APP_BASE_URL=https://your-domain.com
```

### Step 4: Get Your Railway URL

Railway will give you a URL like: `https://your-app.railway.app`

Update your frontend to use this URL instead of Firebase Functions.

## 📝 API Endpoints

- `POST /api/initialize-payment` - Initialize payment
- `POST /api/verify-payment` - Verify payment
- `POST /api/pesapal-webhook` - Webhook handler
- `GET /api/health` - Health check

## 🔧 Local Development

```bash
cd railway-server
npm install
npm start
```

Server runs on http://localhost:3000

## 📚 See RAILWAY_DEPLOYMENT_GUIDE.md for complete instructions

