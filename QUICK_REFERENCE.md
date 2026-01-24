# 🚀 Quick Reference Card - Unified Backend API

## 📍 Location
```
d:\flutter_app\unified_backend\
```

## ⚡ Quick Commands

### Setup
```bash
cd unified_backend
npm install
cp .env.example .env
# Edit .env with credentials
```

### Development
```bash
npm run dev              # Start with auto-reload
curl http://localhost:3000/api/health
```

### Production
```bash
npm start                # Start production server
```

### Generate Secure Keys
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🔑 Essential Environment Variables

```env
API_SECRET_KEY=<generate>
FIREBASE_PRIVATE_KEY=<from-firebase-console>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
AGORA_APP_CERTIFICATE=<from-agora-console>
OPENAI_API_KEY=sk-<your-key>
```

## 🌐 API Endpoints Cheat Sheet

### Health & Auth
```bash
GET  /api/health                      # Check service health
POST /api/auth/verify                 # Verify Firebase token
```

### Agora (Video/Audio)
```bash
GET  /api/agora/rtc-token?channelName=room&uid=123
GET  /api/agora/rtm-token?uid=123
```

### Storage (Supabase)
```bash
POST   /api/storage/upload            # Upload file
DELETE /api/storage/delete            # Delete file
GET    /api/storage/list?bucket=...   # List files
```

### Jobs
```bash
GET /api/jobs?limit=100               # Get jobs
GET /api/jobs/search?q=developer      # Search jobs
```

### AI
```bash
POST /api/ai/extract                  # Analyze file
POST /api/ai/chat                     # Chat with AI
```

### Firestore
```bash
POST   /api/firestore/collection/users        # Add document
GET    /api/firestore/collection/users/:id    # Get document
PUT    /api/firestore/collection/users/:id    # Update document
DELETE /api/firestore/collection/users/:id    # Delete document
```

## 🔐 Authentication

### Firebase Token (Recommended)
```bash
curl -H "Authorization: Bearer <firebase-token>" \
     http://localhost:3000/api/jobs
```

### API Key
```bash
curl -H "X-API-Key: <your-api-key>" \
     http://localhost:3000/api/jobs
```

## 📱 Flutter Integration

```dart
class UnifiedAPIConfig {
  static const String baseUrl = 'http://localhost:3000';
  // Production: 'https://your-app.onrender.com'
  
  static Future<Map<String, String>> get authHeaders async {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    };
  }
}

// Usage
final response = await http.get(
  Uri.parse('${UnifiedAPIConfig.baseUrl}/api/jobs'),
  headers: await UnifiedAPIConfig.authHeaders,
);
```

## 🚀 Deploy to Render.com

1. **Push to GitHub:**
```bash
git add unified_backend/
git commit -m "Add unified backend"
git push
```

2. **Create Render Service:**
   - dashboard.render.com → New Web Service
   - Root Directory: `unified_backend`
   - Build: `npm install`
   - Start: `npm start`

3. **Add Environment Variables**
   - Copy from `.env`
   - Add to Render dashboard

4. **Deploy!**
   - Auto-deploys on git push
   - URL: `https://your-app.onrender.com`

## 📚 Documentation

| File | Description |
|------|-------------|
| `README.md` | Complete API documentation |
| `DEPLOYMENT.md` | Render.com deployment guide |
| `API_EXAMPLES.md` | Flutter integration examples |
| `PROJECT_STRUCTURE.md` | Architecture details |
| `ARCHITECTURE_DIAGRAMS.md` | Visual diagrams |
| `SETUP_COMPLETE.md` | Setup instructions |
| `IMPLEMENTATION_SUMMARY.md` | Full implementation details |

## 🛡️ Security Features

✅ Helmet.js (XSS, CSP, HSTS)
✅ CORS (configurable origins)
✅ Rate Limiting (100/15min)
✅ Authentication (API key + Firebase)
✅ Input Validation (50MB limit)
✅ Error Sanitization

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/api/health

# Returns:
{
  "status": "healthy",
  "services": {
    "Job API": {"status": "up"},
    "AI API": {"status": "up"},
    "Agora": {"status": "up"}
  }
}
```

### Logs
- Development: Colored detailed logs
- Production: Combined format

## 🆘 Troubleshooting

### Server Won't Start
```bash
# Check Node.js version
node -v  # Should be 18+

# Check environment variables
cat .env

# Check port availability
netstat -an | findstr "3000"
```

### Authentication Fails
```bash
# Verify Firebase token
curl -X POST http://localhost:3000/api/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"token":"your-token"}'
```

### External Services Down
```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Services may be sleeping (free tier)
# Wait 30 seconds and retry
```

## 💰 Pricing (Render.com)

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 750 hrs/mo, sleeps after 15min |
| Starter | $7/mo | Always-on, 100 GB bandwidth |
| Pro | $25/mo | Auto-scale, 500 GB bandwidth |

## ✅ Pre-Deployment Checklist

- [ ] `.env` configured with all credentials
- [ ] Firebase private key added
- [ ] Supabase service role key added
- [ ] Agora certificate configured
- [ ] OpenAI API key added
- [ ] Tested locally at http://localhost:3000
- [ ] Health check passes
- [ ] Git repository updated
- [ ] Render service configured
- [ ] Environment variables set on Render
- [ ] Production URL updated in Flutter app

## 🎯 Quick Test

```bash
# 1. Start server
cd unified_backend
npm run dev

# 2. Test health
curl http://localhost:3000/api/health

# 3. Test with API key
curl -H "X-API-Key: your-key" \
     http://localhost:3000/api/jobs?limit=5

# 4. Check logs
# Should see: GET /api/health 200
```

## 📞 Support

- 📖 **Docs:** Check README.md first
- 🐛 **Issues:** GitHub Issues
- 💬 **Community:** Render Community Forum
- 📧 **Email:** Your support email

## 🎉 Success!

Your unified backend is complete and ready to deploy!

**Next Steps:**
1. ✅ Setup complete
2. ⏭️ Test locally
3. ⏭️ Deploy to Render
4. ⏭️ Update Flutter app

---

**Keep this card handy for quick reference!** 📌

**Made with ❤️ for Flutter Social Media App**
