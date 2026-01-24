# 🚀 Unified Backend API Gateway

A secure, unified API gateway that consolidates all backend services for the Flutter Social Media App into a single, cohesive API endpoint. This backend integrates Firebase, Supabase, Agora, Job API, and AI services with robust security, rate limiting, and error handling.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Security](#security)
- [Contributing](#contributing)

## ✨ Features

### Core Capabilities
- **Unified API Gateway**: Single endpoint for all backend services
- **Multi-Service Integration**: 
  - Firebase (Authentication, Firestore)
  - Supabase (Media Storage)
  - Agora (Video/Audio Tokens)
  - Job API (Job Listings)
  - AI Reader API (Content Analysis)
  
### Security Features
- **Helmet.js**: Security headers and XSS protection
- **CORS Configuration**: Configurable origin whitelisting
- **Rate Limiting**: Prevent API abuse (configurable)
- **Dual Authentication**: API Key + Firebase Token support
- **JWT Validation**: Secure Firebase token verification

### Production Ready
- **Error Handling**: Comprehensive error middleware
- **Logging**: Morgan HTTP request logging
- **Compression**: Response compression for bandwidth optimization
- **Health Checks**: Monitor all external services
- **Graceful Shutdown**: Clean process termination

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter App (Client)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Unified Backend API Gateway                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Security Layer (Helmet, CORS, Rate Limit, Auth)      │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌───────────┬──────────┬───┴───┬─────────┬──────────────┐ │
│  │           │          │       │         │              │ │
│  ▼           ▼          ▼       ▼         ▼              ▼ │
│ Auth    Firestore   Storage  Agora     Jobs          AI   │
└──┼──────────┼──────────┼───────┼─────────┼──────────────┼──┘
   │          │          │       │         │              │
   ▼          ▼          ▼       ▼         ▼              ▼
┌─────┐  ┌─────────┐  ┌────────┐  ┌─────┐  ┌────────┐  ┌───────┐
│Firebase│ │Firestore│ │Supabase│ │Agora│ │ Job API│ │AI API │
│  Auth  │ │   DB    │ │Storage │ │Token│ │(Render)│ │(Render)│
└─────┘  └─────────┘  └────────┘  └─────┘  └────────┘  └───────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Admin SDK
- Supabase account
- Agora account
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository:**
```bash
cd flutter_app/unified_backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables))

4. **Add Firebase Service Account:**
   - Download your Firebase service account JSON from [Firebase Console](https://console.firebase.google.com/)
   - Save as `firebase-service-account.json` in the root directory
   - OR configure via environment variables

5. **Start the server:**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Health Check
```http
GET /api/health
```
Returns health status of API and all sub-services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T10:30:00Z",
  "uptime": 3600,
  "services": {
    "Job API": { "status": "up", "responseTime": "120ms" },
    "AI Reader API": { "status": "up", "responseTime": "250ms" },
    "Agora Token Server": { "status": "up", "responseTime": "80ms" }
  }
}
```

### Authentication

#### Verify Firebase Token
```http
POST /api/auth/verify
Content-Type: application/json

{
  "token": "firebase-id-token"
}
```

#### Get User Info
```http
POST /api/auth/user
Content-Type: application/json

{
  "token": "firebase-id-token"
}
```

### Agora (Video/Audio Tokens)

#### Get RTC Token
```http
GET /api/agora/rtc-token?channelName=room123&uid=12345&role=publisher&expiry=3600
Authorization: Bearer <firebase-token>
# OR
X-API-Key: <your-api-key>
```

**Response:**
```json
{
  "success": true,
  "token": "agora-rtc-token-here",
  "channelName": "room123",
  "uid": "12345",
  "expiry": 3600
}
```

#### Get RTM Token
```http
GET /api/agora/rtm-token?uid=12345&expiry=3600
Authorization: Bearer <firebase-token>
```

### Storage (Supabase)

#### Upload File
```http
POST /api/storage/upload
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

file: <binary-file>
bucket: profile-images
folder: avatars
fileName: user123.jpg
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "success": true,
    "path": "avatars/user123.jpg",
    "url": "https://supabase-url/storage/v1/object/public/profile-images/avatars/user123.jpg"
  }
}
```

#### Upload Multiple Files
```http
POST /api/storage/upload-multiple
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

files: <binary-files>
bucket: profile-images
folder: posts
```

#### Delete File
```http
DELETE /api/storage/delete
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "bucket": "profile-images",
  "path": "avatars/user123.jpg"
}
```

#### Get Public URL
```http
GET /api/storage/url?bucket=profile-images&path=avatars/user123.jpg
Authorization: Bearer <firebase-token>
```

#### List Files
```http
GET /api/storage/list?bucket=profile-images&folder=avatars&limit=50&offset=0
Authorization: Bearer <firebase-token>
```

### Jobs

#### Get All Jobs
```http
GET /api/jobs?limit=100&offset=0&search=developer&category=IT
Authorization: Bearer <firebase-token>
```

**Response:**
```json
{
  "success": true,
  "jobs": [...],
  "count": 100
}
```

#### Get Job by ID
```http
GET /api/jobs/:id
Authorization: Bearer <firebase-token>
```

#### Search Jobs
```http
GET /api/jobs/search?q=python developer&location=remote
Authorization: Bearer <firebase-token>
```

### AI Content Analysis

#### Extract & Analyze (File)
```http
POST /api/ai/extract
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

file: <pdf/image/video/audio/document>
```

**Response:**
```json
{
  "success": true,
  "extractedText": "...",
  "aiExplanation": "...",
  "summary": "...",
  "keyPoints": [...]
}
```

#### Extract & Analyze (URL)
```http
POST /api/ai/analyze-url
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "url": "https://example.com/document.pdf"
}
```

#### Chat with AI
```http
POST /api/ai/chat
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "message": "What is this document about?",
  "context": "Previously extracted content..."
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI's answer here..."
}
```

### Firestore Operations

#### Add Document
```http
POST /api/firestore/collection/:collection
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

#### Get Document
```http
GET /api/firestore/collection/:collection/:id
Authorization: Bearer <firebase-token>
```

#### Update Document
```http
PUT /api/firestore/collection/:collection/:id
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "field1": "updated-value"
}
```

#### Delete Document
```http
DELETE /api/firestore/collection/:collection/:id
Authorization: Bearer <firebase-token>
```

#### Query Collection
```http
GET /api/firestore/collection/:collection?limit=100&orderBy=createdAt&orderDirection=desc&where=status:==:active
Authorization: Bearer <firebase-token>
```

#### Batch Operations
```http
POST /api/firestore/batch
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "operations": [
    {
      "type": "set",
      "collection": "users",
      "id": "user123",
      "data": { "name": "John" }
    },
    {
      "type": "update",
      "collection": "posts",
      "id": "post456",
      "data": { "views": 100 }
    },
    {
      "type": "delete",
      "collection": "temp",
      "id": "temp789"
    }
  ]
}
```

## 🔐 Authentication

The API supports **two authentication methods**:

### 1. Firebase ID Token (Recommended)
```http
Authorization: Bearer <firebase-id-token>
```

Used for user-specific operations. Token is obtained from Firebase Auth in your Flutter app.

### 2. API Key
```http
X-API-Key: <your-api-secret-key>
```

Used for server-to-server communication or trusted applications.

### Public Endpoints (No Auth Required)
- `GET /api/health`
- `GET /api/health/ping`
- `POST /api/auth/verify`
- `POST /api/auth/user`

## 🌐 Deployment

### Deploy to Render.com

1. **Create a new Web Service** on [Render.com](https://render.com)

2. **Connect your GitHub repository**

3. **Configure Build Settings:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. **Add Environment Variables** (see [Environment Variables](#environment-variables))

5. **Deploy!**

### Deploy to Other Platforms

#### Heroku
```bash
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
# Add other environment variables
```

#### Railway
```bash
railway init
railway up
# Configure environment variables in Railway dashboard
```

#### Docker
```bash
docker build -t unified-backend .
docker run -p 3000:3000 --env-file .env unified-backend
```

## 🔧 Environment Variables

### Required Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security
API_SECRET_KEY=your-secure-random-key-here
JWT_SECRET=your-jwt-secret-here

# Firebase (Required for Auth & Firestore)
FIREBASE_PROJECT_ID=myapp-6cbbf
FIREBASE_CLIENT_EMAIL=your-service-account@myapp-6cbbf.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase (Required for Storage)
SUPABASE_URL=https://nqydqpllowakssgfpevt.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Agora (Required for Video/Audio)
AGORA_APP_ID=df35eac788e3437ca9eb8158b6754818
AGORA_APP_CERTIFICATE=your-agora-certificate
AGORA_TOKEN_SERVER_URL=https://render-agora-token-server-app.onrender.com

# External Services
JOB_API_URL=https://bd-job-api.onrender.com
AI_READER_API_URL=https://image-video-audio-pdf-docs-reader-api-1.onrender.com
OPENAI_API_KEY=sk-your-openai-key

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS (Optional)
ALLOWED_ORIGINS=https://myapp-6cbbf.web.app,https://safiullah-foragy.github.io,http://localhost:*
```

### How to Get Credentials

#### Firebase Private Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Copy the entire JSON content
5. Use `private_key` field for `FIREBASE_PRIVATE_KEY`
6. Use `client_email` for `FIREBASE_CLIENT_EMAIL`

#### Supabase Keys
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Project Settings → API
3. Copy `URL` and `anon public` key
4. For service role key: Settings → API → `service_role` key (Secret)

#### Agora Certificate
1. Go to [Agora Console](https://console.agora.io/)
2. Project Management → Your Project
3. Copy App ID and enable App Certificate
4. Copy the certificate

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy the key (starts with `sk-`)

## 🔒 Security

### Implemented Security Measures

1. **Helmet.js**: Protects against common web vulnerabilities
   - XSS protection
   - Content Security Policy
   - HSTS (HTTP Strict Transport Security)
   - Frame guard

2. **CORS**: Configurable origin whitelisting
   - Supports wildcards for localhost development
   - Production origins must be explicitly listed

3. **Rate Limiting**: Prevents API abuse
   - Default: 100 requests per 15 minutes per IP
   - Configurable per environment

4. **Authentication**: Dual-layer security
   - Firebase ID token validation
   - API key authentication
   - Per-route authentication middleware

5. **Input Validation**: 
   - Request body size limits (50MB)
   - File upload size limits
   - Content-type validation

6. **Error Handling**:
   - No sensitive information in error responses (production)
   - Detailed logging for debugging (development)

### Best Practices

✅ **DO:**
- Use HTTPS in production
- Rotate API keys regularly
- Keep Firebase private key secure
- Use environment variables for all secrets
- Enable Firebase App Check for mobile apps
- Monitor API usage and rate limits
- Keep dependencies updated

❌ **DON'T:**
- Commit `.env` file to version control
- Share API keys publicly
- Use the same API key for development and production
- Expose Firebase private key in client-side code

## 📊 Monitoring & Logging

### Health Checks
Monitor service health at `/api/health`:
```bash
curl https://your-api.onrender.com/api/health
```

### Logs
The server uses Morgan for HTTP request logging:
- **Development**: Detailed colored logs
- **Production**: Combined format for log aggregation

### Error Tracking
Integrate with services like:
- Sentry
- LogRocket
- Datadog
- New Relic

Add to `server.js`:
```javascript
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

## 🧪 Testing

### Manual Testing with cURL

**Health Check:**
```bash
curl https://your-api.onrender.com/api/health
```

**Get RTC Token:**
```bash
curl -X GET "https://your-api.onrender.com/api/agora/rtc-token?channelName=test&uid=123" \
  -H "X-API-Key: your-api-key"
```

**Upload File:**
```bash
curl -X POST "https://your-api.onrender.com/api/storage/upload" \
  -H "X-API-Key: your-api-key" \
  -F "file=@/path/to/image.jpg" \
  -F "bucket=profile-images" \
  -F "folder=test"
```

### Testing with Postman
Import the Postman collection (create one with examples above) for easier testing.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Safiullah Foragy**
- GitHub: [@safiullah-foragy](https://github.com/safiullah-foragy)

## 🆘 Support

For issues and questions:
1. Check the [GitHub Issues](https://github.com/safiullah-foragy/flutter_app/issues)
2. Create a new issue with detailed description
3. Include error logs and environment details

## 🗺️ Roadmap

- [ ] Add WebSocket support for real-time features
- [ ] Implement caching layer (Redis)
- [ ] Add GraphQL endpoint
- [ ] Add automated tests (Jest, Supertest)
- [ ] Add API documentation with Swagger/OpenAPI
- [ ] Add metrics and analytics
- [ ] Add support for more storage providers
- [ ] Implement request/response logging to database

---

**Made with ❤️ for the Flutter Social Media App**
