# Architecture Diagrams

Visual representation of the unified backend architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Flutter Application                          │
│  ┌────────────┬─────────────┬──────────────┬────────────────────┐  │
│  │   Auth     │   Storage   │  Video Call  │    Features        │  │
│  │ (Firebase) │ (Supabase)  │   (Agora)    │ (Jobs, AI, Chat)   │  │
│  └─────┬──────┴──────┬──────┴──────┬───────┴──────┬─────────────┘  │
└────────┼─────────────┼─────────────┼──────────────┼─────────────────┘
         │             │             │              │
         │    Single API Endpoint (HTTPS)          │
         │             │             │              │
         └─────────────┴─────────────┴──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  Unified Backend API       │
         │  (Render.com / Node.js)    │
         │                            │
         │  🔒 Security Layer         │
         │  ├─ Helmet.js             │
         │  ├─ CORS                  │
         │  ├─ Rate Limiting         │
         │  └─ Authentication        │
         └────────────┬───────────────┘
                      │
         ┌────────────┴────────────────┐
         │    Service Orchestration    │
         │  ┌──────────────────────┐  │
         │  │  Route Handlers      │  │
         │  ├─ Auth    ├─ Storage  │  │
         │  ├─ Agora   ├─ Jobs     │  │
         │  ├─ AI      └─ Firestore│  │
         │  └──────────────────────┘  │
         └─┬──────┬──────┬──────┬──┬──┘
           │      │      │      │  │
    ┌──────▼──┐ ┌▼────┐ │  ┌───▼──▼───┐
    │Firebase │ │Supa-│ │  │ External │
    │         │ │base │ │  │ Services │
    │┌────────┴─┴─────┴─┴──┴─────────┐│
    ││  Auth   Storage  Token Servers││
    ││ Firestore        Agora  Job AI││
    │└────────────────────────────────┘│
    └───────────────────────────────────┘
```

## Request Flow

### Example: Upload Profile Picture

```
┌──────────────┐
│ Flutter App  │
│ User Profile │
└──────┬───────┘
       │ 1. Select image
       ▼
┌──────────────────┐
│ File Upload      │
│ multipart/form   │
└──────┬───────────┘
       │ 2. POST /api/storage/upload
       │    Authorization: Bearer <token>
       │
       ▼
┌─────────────────────────────────────┐
│   Unified Backend API (Port 3000)   │
│  ┌───────────────────────────────┐  │
│  │ 1. CORS Check               ✓│  │
│  │ 2. Rate Limit Check         ✓│  │
│  │ 3. Auth Middleware          ✓│  │
│  │    - Verify Firebase Token    │  │
│  │ 4. Route Handler              │  │
│  │    - Multer file processing   │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │ 3. Upload to Supabase
               ▼
┌────────────────────────────────┐
│  Supabase Storage             │
│  Bucket: profile-images       │
│  ┌─────────────────────────┐  │
│  │ File saved              │  │
│  │ Public URL generated    │  │
│  └─────────────────────────┘  │
└──────────────┬─────────────────┘
               │ 4. Return URL
               ▼
┌─────────────────────────────────┐
│   Unified Backend API           │
│  ┌───────────────────────────┐  │
│  │ Response:                 │  │
│  │ {                         │  │
│  │   "success": true,        │  │
│  │   "url": "https://..."    │  │
│  │ }                         │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │ 5. JSON response
               ▼
┌──────────────────┐
│ Flutter App      │
│ Update UI        │
│ Display new photo│
└──────────────────┘
```

## Security Layers

```
Internet
   │
   ▼
┌─────────────────────────────────┐
│ Layer 1: Network                │
│ - HTTPS/TLS Encryption          │
│ - Render.com SSL                │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Layer 2: CORS                   │
│ - Origin Validation             │
│ - Method Restrictions           │
│ - Credential Handling           │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Layer 3: Helmet.js              │
│ - XSS Protection               │
│ - Content Security Policy       │
│ - HSTS Headers                  │
│ - Frame Guard                   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Layer 4: Rate Limiting          │
│ - IP-based throttling           │
│ - 100 requests / 15 min         │
│ - Configurable limits           │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Layer 5: Authentication         │
│ ┌─────────────┐ ┌─────────────┐│
│ │ API Key     │ │Firebase Auth││
│ │ X-API-Key   │ │Bearer Token ││
│ └─────────────┘ └─────────────┘│
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Layer 6: Input Validation       │
│ - Body size limits (50MB)       │
│ - Content-type validation       │
│ - Parameter sanitization        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Application Logic               │
│ - Route handlers               │
│ - Business logic               │
└─────────────────────────────────┘
```

## Data Flow: Video Call Setup

```
User A                      Unified Backend              Agora Token Server
  │                               │                              │
  │ 1. Start call                 │                              │
  │ channelName="room123"         │                              │
  │ uid=12345                     │                              │
  ├──────────────────────────────►│                              │
  │ GET /api/agora/rtc-token      │                              │
  │ Authorization: Bearer token   │                              │
  │                               │                              │
  │                               │ 2. Verify Firebase Token    │
  │                               ├─ ✓ Token valid              │
  │                               │                              │
  │                               │ 3. Request token            │
  │                               ├─────────────────────────────►│
  │                               │ channelName, uid, role       │
  │                               │                              │
  │                               │ 4. Generate RTC token        │
  │                               │◄─────────────────────────────┤
  │                               │ return token                 │
  │                               │                              │
  │ 5. Return token to app        │                              │
  │◄──────────────────────────────┤                              │
  │ { "token": "006abcd..." }     │                              │
  │                               │                              │
  │ 6. Join Agora channel         │                              │
  │ with token                    │                              │
  ├───────────────────────────────┼──────────────────────────────►
  │                               │                     Agora RTC
  │                               │                              │
User B                                                           │
  │ 7. Get token (same flow)      │                              │
  ├──────────────────────────────►│                              │
  │◄──────────────────────────────┤                              │
  │                               │                              │
  │ 8. Join same channel          │                              │
  ├───────────────────────────────┼──────────────────────────────►
  │                               │                              │
  │◄──────────────────────────────┼──────────────────────────────►│
      Video/Audio Stream                                     Agora RTC
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                  safiullah-foragy/flutter_app           │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  unified_backend/                              │    │
│  │  ├─ server.js                                  │    │
│  │  ├─ package.json                               │    │
│  │  ├─ routes/                                    │    │
│  │  ├─ config/                                    │    │
│  │  └─ middleware/                                │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ git push
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Render.com Dashboard                     │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Web Service: unified-backend-api                   │ │
│  │                                                     │ │
│  │ Build:                                             │ │
│  │   Command: npm install                             │ │
│  │   Root: unified_backend/                           │ │
│  │                                                     │ │
│  │ Start:                                             │ │
│  │   Command: npm start                               │ │
│  │   Port: 3000                                       │ │
│  │                                                     │ │
│  │ Environment Variables:                             │ │
│  │   ✓ API_SECRET_KEY                                │ │
│  │   ✓ FIREBASE_*                                    │ │
│  │   ✓ SUPABASE_*                                    │ │
│  │   ✓ AGORA_*                                       │ │
│  │   ✓ OPENAI_API_KEY                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  Health Check: /api/health                               │
│  Auto Deploy: ✓ Enabled                                  │
│  SSL: ✓ Automatic                                        │
└───────────────────────┬───────────────────────────────────┘
                        │
                        │ HTTPS
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│         Live API Endpoint                                 │
│    https://unified-backend-api.onrender.com              │
│                                                           │
│    Available Routes:                                      │
│    ├─ /api/health                                        │
│    ├─ /api/auth                                          │
│    ├─ /api/agora                                         │
│    ├─ /api/storage                                       │
│    ├─ /api/jobs                                          │
│    ├─ /api/ai                                            │
│    └─ /api/firestore                                     │
└──────────────────────┬────────────────────────────────────┘
                       │
                       │ API Calls
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                Flutter Application                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Web: myapp-6cbbf.web.app                          │ │
│  │ Mobile: Android/iOS Apps                          │ │
│  │                                                     │ │
│  │ Configuration:                                     │ │
│  │ baseUrl = "https://unified-backend-api            │ │
│  │            .onrender.com"                          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Monitoring & Logging

```
┌─────────────────────────────────────────────────────────┐
│                  Unified Backend API                     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Request Pipeline                      │  │
│  │                                                  │  │
│  │  Incoming Request                               │  │
│  │        │                                        │  │
│  │        ├──► Morgan Logger                       │  │
│  │        │     ├─ Log request method, path       │  │
│  │        │     ├─ Log status code                │  │
│  │        │     └─ Log response time              │  │
│  │        │                                        │  │
│  │        ├──► Security Middleware                │  │
│  │        │     ├─ Helmet                         │  │
│  │        │     ├─ CORS                           │  │
│  │        │     └─ Rate Limiter                   │  │
│  │        │                                        │  │
│  │        ├──► Authentication                     │  │
│  │        │     └─ Verify credentials            │  │
│  │        │                                        │  │
│  │        ├──► Route Handler                      │  │
│  │        │     └─ Business logic                 │  │
│  │        │                                        │  │
│  │        └──► Error Handler                      │  │
│  │              └─ Log errors                     │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                         │                               │
│                         ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Console Logs                        │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ 2026-01-24 10:30:15                       │ │  │
│  │  │ GET /api/health 200 45ms                  │ │  │
│  │  │ POST /api/storage/upload 200 234ms        │ │  │
│  │  │ GET /api/agora/rtc-token 200 123ms        │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│            Render.com Dashboard Logs                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Real-time log streaming                           │ │
│  │ Searchable log history                            │ │
│  │ Error alerts                                      │ │
│  │ Performance metrics                               │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Service Health Monitoring

```
┌────────────────────────────────────────────────────────┐
│          GET /api/health Endpoint                       │
│                                                         │
│  Checks all connected services:                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Job API                                          │ │
│  │ URL: https://bd-job-api.onrender.com            │ │
│  │ Status: ● UP      Response Time: 120ms          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ AI Reader API                                    │ │
│  │ URL: https://image-video-audio-pdf...           │ │
│  │ Status: ● UP      Response Time: 250ms          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Agora Token Server                               │ │
│  │ URL: https://render-agora-token-server...       │ │
│  │ Status: ● UP      Response Time: 80ms           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  Overall Status: HEALTHY ✓                             │
│  Uptime: 3600s                                          │
│  Timestamp: 2026-01-24T10:30:00Z                       │
└────────────────────────────────────────────────────────┘
```

---

## Legend

```
Symbols Used:
├─► Flow direction
│   Vertical connection
▼   Step progression
✓   Successful check
●   Active status
┌─┐ Box/Container
```

---

**These diagrams illustrate the complete architecture of your unified backend system.** 🚀
