# Render.com Deployment Guide

Complete guide to deploy the Unified Backend API on Render.com.

## Prerequisites

- GitHub account with your code pushed
- Render.com account (free tier works)
- All required credentials (Firebase, Supabase, Agora, OpenAI)

## Step 1: Prepare Your Repository

1. **Commit all changes to GitHub:**
```bash
cd unified_backend
git add .
git commit -m "Add unified backend API"
git push origin main
```

2. **Ensure `.gitignore` excludes sensitive files:**
```
.env
firebase-service-account.json
node_modules/
```

## Step 2: Create Web Service on Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**
   - Authorize Render to access your GitHub
   - Select your repository: `flutter_app`

4. **Configure the service:**

### Basic Settings
- **Name:** `unified-backend-api` (or your preferred name)
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)
- **Root Directory:** `unified_backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Instance Type
- **Free** (for testing) or **Starter** (for production)
- Free tier sleeps after 15 minutes of inactivity

## Step 3: Configure Environment Variables

In Render dashboard, go to **Environment** tab and add these variables:

### Server Configuration
```
PORT = 3000
NODE_ENV = production
```

### Security
```
API_SECRET_KEY = <generate-a-secure-random-key>
JWT_SECRET = <generate-another-secure-key>
```

**Generate secure keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Firebase Configuration

Option A: Using Environment Variables (Recommended for Render)
```
FIREBASE_PROJECT_ID = myapp-6cbbf
FIREBASE_CLIENT_EMAIL = <your-service-account-email>
FIREBASE_PRIVATE_KEY = <your-private-key-with-\n>
```

**⚠️ Important:** For `FIREBASE_PRIVATE_KEY`, copy the ENTIRE private key from your Firebase service account JSON file including:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----
```

Make sure to keep the `\n` characters in the key. In Render, paste it as a single line with `\n` preserved.

### Supabase Configuration
```
SUPABASE_URL = https://nqydqpllowakssgfpevt.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = <your-service-role-key>
```

**Get Supabase Keys:**
1. Supabase Dashboard → Project Settings → API
2. Copy URL and anon (public) key
3. Copy service_role key (keep this secret!)

### Agora Configuration
```
AGORA_APP_ID = df35eac788e3437ca9eb8158b6754818
AGORA_APP_CERTIFICATE = <your-app-certificate>
AGORA_TOKEN_SERVER_URL = https://render-agora-token-server-app.onrender.com
```

**Get Agora Certificate:**
1. [Agora Console](https://console.agora.io/)
2. Project Management → Your Project
3. Enable Primary Certificate
4. Copy the certificate string

### External Services
```
JOB_API_URL = https://bd-job-api.onrender.com
AI_READER_API_URL = https://image-video-audio-pdf-docs-reader-api-1.onrender.com
OPENAI_API_KEY = sk-<your-openai-key>
```

### Optional: Rate Limiting & CORS
```
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
ALLOWED_ORIGINS = https://myapp-6cbbf.web.app,https://safiullah-foragy.github.io,http://localhost:*
```

## Step 4: Deploy

1. **Click "Create Web Service"**

2. **Wait for deployment** (usually 2-5 minutes)
   - You'll see build logs in real-time
   - Check for any errors

3. **Check deployment status:**
   - Look for "Live" green indicator
   - Note your service URL: `https://unified-backend-api.onrender.com`

## Step 5: Test Your API

### Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T...",
  "uptime": 123,
  "services": {
    "Job API": { "status": "up" },
    "AI Reader API": { "status": "up" },
    "Agora Token Server": { "status": "up" }
  }
}
```

### Test Authentication
```bash
curl -X POST https://your-app-name.onrender.com/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your-firebase-token"}'
```

### Test with API Key
```bash
curl https://your-app-name.onrender.com/api/agora/rtc-token?channelName=test&uid=123 \
  -H "X-API-Key: your-api-secret-key"
```

## Step 6: Update Flutter App

Update your Flutter app to use the new unified backend:

```dart
class UnifiedAPIConfig {
  static const String baseUrl = 'https://your-app-name.onrender.com';
  static const String apiKey = 'your-api-secret-key';
  
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };
  
  static Map<String, String> authHeaders(String firebaseToken) => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $firebaseToken',
  };
}

// Example usage:
final response = await http.get(
  Uri.parse('${UnifiedAPIConfig.baseUrl}/api/agora/rtc-token?channelName=room123&uid=12345'),
  headers: UnifiedAPIConfig.authHeaders(userToken),
);
```

## Troubleshooting

### Build Fails

**Issue:** `Module not found` error
```
Solution: Check package.json has all dependencies listed
```

**Issue:** `Cannot find module` error
```
Solution: Ensure all imports use .js extension (ES modules)
import x from './file.js'  // ✓ Correct
import x from './file'      // ✗ Wrong
```

### Service Crashes on Start

**Check logs in Render dashboard:**

**Issue:** Firebase initialization error
```
Solution: Verify FIREBASE_PRIVATE_KEY is properly formatted with \n characters
```

**Issue:** Port binding error
```
Solution: Ensure PORT environment variable is set to 3000
```

### API Returns 401 Unauthorized

**Issue:** Invalid API key
```
Solution: Verify API_SECRET_KEY matches in both Render and your Flutter app
```

**Issue:** Firebase token verification fails
```
Solution: Ensure Firebase project ID matches and token is valid
```

### Slow Response Times

**Issue:** Free tier service sleeping
```
Solution: 
- Upgrade to paid tier ($7/month for always-on)
- Or implement keep-alive ping from client
```

**Issue:** External services sleeping (Job API, AI API)
```
Solution: These services may take 30-60 seconds to wake up on first request
```

## Performance Optimization

### 1. Enable HTTP/2
Render automatically enables HTTP/2 for better performance.

### 2. Add Health Check Ping
In Render dashboard:
- Settings → Health Check Path: `/api/health/ping`
- This keeps your service awake

### 3. Use CDN for Static Assets
If serving any static files, use Render's CDN or external CDN.

### 4. Implement Caching
Add Redis for caching frequently requested data:
```bash
# In Render dashboard, create Redis instance
# Add REDIS_URL to environment variables
```

## Monitoring & Logs

### View Logs
1. Render Dashboard → Your Service → Logs
2. Real-time log streaming
3. Filter by log level

### Set Up Alerts
1. Render Dashboard → Your Service → Settings
2. Configure notification emails
3. Set up Slack/Discord webhooks

### Monitor Performance
1. Check Metrics tab in Render dashboard
2. CPU, Memory, Request count
3. Response times

## Scaling

### Horizontal Scaling
Render supports auto-scaling on paid tiers:
1. Settings → Instance Count
2. Set min/max instances
3. Auto-scale based on CPU/Memory

### Database Connection Pooling
For high traffic, implement connection pooling:
```javascript
// In firebase.js
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});
```

## Security Checklist

- [x] All secrets in environment variables (not in code)
- [x] `.gitignore` includes `.env` and sensitive files
- [x] CORS configured with specific origins
- [x] Rate limiting enabled
- [x] Helmet.js security headers enabled
- [x] HTTPS enforced (automatic on Render)
- [x] API keys rotated regularly
- [x] Firebase private key secured

## Cost Estimate

### Free Tier
- ✅ 750 hours/month
- ✅ Automatic deploys
- ⚠️ Service sleeps after 15 min inactivity
- ⚠️ Limited to 100 GB bandwidth/month

### Starter Tier ($7/month)
- ✅ Always-on service
- ✅ Automatic SSL
- ✅ Custom domains
- ✅ 100 GB bandwidth, then $0.10/GB

### Pro Tier ($25/month)
- ✅ Everything in Starter
- ✅ Auto-scaling
- ✅ Priority support
- ✅ 500 GB bandwidth included

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Test all endpoints
3. ✅ Update Flutter app with new API URL
4. ✅ Monitor logs and performance
5. ⭐ Consider upgrading to paid tier for production
6. 🔄 Set up CI/CD for automatic deployments
7. 📊 Implement logging and monitoring

## Support

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **GitHub Issues:** https://github.com/safiullah-foragy/flutter_app/issues

---

**Deployment complete! 🚀 Your unified backend is now live!**
