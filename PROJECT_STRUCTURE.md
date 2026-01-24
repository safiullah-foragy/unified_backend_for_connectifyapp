# Unified Backend API - Project Structure

Complete folder structure and file descriptions.

```
unified_backend/
├── 📄 package.json              # Node.js dependencies and scripts
├── 📄 .env.example              # Environment variables template
├── 📄 .gitignore                # Git ignore rules
├── 📄 README.md                 # Complete API documentation
├── 📄 DEPLOYMENT.md             # Render.com deployment guide
├── 📄 API_EXAMPLES.md           # Flutter integration examples
├── 📄 Procfile                  # Render.com/Heroku deployment config
├── 📄 setup.sh                  # Unix setup script
├── 📄 setup.bat                 # Windows setup script
│
├── 📄 server.js                 # Main Express server
│
├── 📁 config/                   # Configuration files
│   ├── 📄 firebase.js           # Firebase Admin SDK initialization
│   ├── 📄 supabase.js           # Supabase client configuration
│   └── 📄 INSTALL_SUPABASE.md   # Supabase installation note
│
├── 📁 middleware/               # Express middleware
│   ├── 📄 auth.js               # Authentication middleware (API key + Firebase)
│   └── 📄 errorHandler.js       # Global error handling
│
└── 📁 routes/                   # API route handlers
    ├── 📄 health.js             # Health check endpoints
    ├── 📄 auth.js               # Firebase authentication routes
    ├── 📄 agora.js              # Agora token generation
    ├── 📄 storage.js            # Supabase storage operations
    ├── 📄 jobs.js               # Job API proxy
    ├── 📄 ai.js                 # AI content analysis proxy
    └── 📄 firestore.js          # Firestore CRUD operations
```

## File Descriptions

### Root Files

#### package.json
- Dependencies: Express, Firebase Admin, Supabase, Axios, etc.
- Scripts: `start` (production), `dev` (development with nodemon)
- Engines: Node.js 18+

#### server.js
- Main application entry point
- Configures middleware (CORS, Helmet, Rate Limiting)
- Mounts all route handlers
- Global error handling
- Server startup and graceful shutdown

#### .env.example
- Template for environment variables
- Contains all required and optional configuration
- Safe to commit to version control

#### .gitignore
- Excludes sensitive files (.env, service account JSON)
- Excludes node_modules and logs
- Excludes IDE-specific files

### Configuration (`config/`)

#### firebase.js
- Initializes Firebase Admin SDK
- Supports service account file OR environment variables
- Exports Firebase Auth, Firestore, and Storage instances
- Singleton pattern for single initialization

#### supabase.js
- Creates Supabase clients (anon + service role)
- Utility functions: `uploadToSupabase`, `deleteFromSupabase`, `getPublicUrl`
- Handles public and admin operations

### Middleware (`middleware/`)

#### auth.js
- Dual authentication: API key OR Firebase token
- `apiKeyAuth`: Required authentication
- `optionalAuth`: Optional authentication for public endpoints
- Validates and decodes Firebase ID tokens

#### errorHandler.js
- Catches all errors in route handlers
- Formats error responses consistently
- Handles specific error types (Validation, Unauthorized, etc.)
- Includes stack traces in development mode only

### Routes (`routes/`)

#### health.js
- `GET /api/health`: Full health check with external services
- `GET /api/health/ping`: Simple ping endpoint
- Returns status of Job API, AI API, Agora Token Server

#### auth.js
- `POST /api/auth/verify`: Verify Firebase ID token
- `POST /api/auth/user`: Get user information
- `POST /api/auth/custom-token`: Create custom token (admin only)

#### agora.js
- `GET /api/agora/rtc-token`: Get RTC token for video/audio
- `GET /api/agora/rtm-token`: Get RTM token for messaging
- `POST /api/agora/token`: Alternative POST endpoint
- Proxies to Agora token server with multiple fallback methods

#### storage.js
- `POST /api/storage/upload`: Upload single file to Supabase
- `POST /api/storage/upload-multiple`: Upload multiple files
- `DELETE /api/storage/delete`: Delete file from Supabase
- `GET /api/storage/url`: Get public URL for file
- `GET /api/storage/list`: List files in bucket/folder
- Uses multer for file upload handling

#### jobs.js
- `GET /api/jobs`: Get all jobs (with pagination, search, category)
- `GET /api/jobs/:id`: Get job by ID
- `GET /api/jobs/search`: Search jobs
- `GET /api/jobs/categories`: Get job categories
- Proxies to external Job API with error handling for cold starts

#### ai.js
- `POST /api/ai/extract`: Extract and analyze content from file or URL
- `POST /api/ai/chat`: Chat with AI about content
- `POST /api/ai/analyze-url`: Analyze URL content
- `GET /api/ai/health`: Check AI API status
- Proxies to external AI Reader API
- Handles large file uploads (50MB limit)

#### firestore.js
- `POST /api/firestore/collection/:collection`: Add document
- `GET /api/firestore/collection/:collection/:id`: Get document
- `PUT /api/firestore/collection/:collection/:id`: Update document
- `DELETE /api/firestore/collection/:collection/:id`: Delete document
- `GET /api/firestore/collection/:collection`: Query collection
- `POST /api/firestore/batch`: Batch operations
- Direct Firestore operations via Firebase Admin SDK

## API Endpoint Structure

```
/api
├── /health
│   ├── GET /          # Full health check
│   └── GET /ping      # Simple ping
│
├── /auth
│   ├── POST /verify          # Verify token
│   ├── POST /user            # Get user info
│   └── POST /custom-token    # Create custom token
│
├── /agora
│   ├── GET  /rtc-token       # Get RTC token
│   ├── GET  /rtm-token       # Get RTM token
│   └── POST /token           # Alternative endpoint
│
├── /storage
│   ├── POST   /upload           # Upload file
│   ├── POST   /upload-multiple  # Upload multiple files
│   ├── DELETE /delete           # Delete file
│   ├── GET    /url              # Get public URL
│   └── GET    /list             # List files
│
├── /jobs
│   ├── GET /              # Get all jobs
│   ├── GET /:id           # Get job by ID
│   ├── GET /search        # Search jobs
│   └── GET /categories    # Get categories
│
├── /ai
│   ├── POST /extract        # Extract & analyze
│   ├── POST /chat           # Chat with AI
│   ├── POST /analyze-url    # Analyze URL
│   └── GET  /health         # AI API health
│
└── /firestore
    ├── POST   /collection/:collection           # Add document
    ├── GET    /collection/:collection/:id       # Get document
    ├── PUT    /collection/:collection/:id       # Update document
    ├── DELETE /collection/:collection/:id       # Delete document
    ├── GET    /collection/:collection           # Query collection
    └── POST   /batch                            # Batch operations
```

## Security Layers

```
Client Request
     │
     ├─► CORS Check (allowed origins)
     │
     ├─► Helmet (security headers)
     │
     ├─► Rate Limiting (100 req/15min)
     │
     ├─► Body Parser (50MB limit)
     │
     ├─► Authentication (API key OR Firebase token)
     │
     ├─► Route Handler
     │
     └─► Error Handler (sanitized errors)
```

## Data Flow

### Example: Upload File

```
Flutter App
    │
    ├─► POST /api/storage/upload (with Firebase token)
    │
    ├─► Auth Middleware (verify token)
    │
    ├─► Route Handler (storage.js)
    │
    ├─► Supabase Client
    │
    ├─► Supabase Storage Bucket
    │
    └─► Return public URL to Flutter
```

### Example: Get Agora Token

```
Flutter App
    │
    ├─► GET /api/agora/rtc-token (with channelName, uid)
    │
    ├─► Auth Middleware
    │
    ├─► Route Handler (agora.js)
    │
    ├─► External Agora Token Server
    │
    └─► Return RTC token to Flutter
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Security**: Helmet, CORS, Rate Limiting
- **Authentication**: Firebase Admin SDK
- **Storage**: Supabase
- **Database**: Firebase Firestore
- **Video/Audio**: Agora (token generation)
- **AI**: OpenAI (via external API)
- **File Upload**: Multer
- **HTTP Client**: Axios
- **Logging**: Morgan
- **Environment**: dotenv

## Deployment Targets

✅ **Render.com** (Primary, recommended)
✅ **Heroku**
✅ **Railway**
✅ **Vercel** (serverless functions)
✅ **AWS Lambda** (with adaptation)
✅ **Google Cloud Run**
✅ **Docker** (any container platform)

## Monitoring & Maintenance

### Health Checks
- Automatic health check endpoint
- Monitors all external services
- Used by Render for uptime monitoring

### Logging
- Development: Detailed colored logs
- Production: Combined format for aggregation
- HTTP requests logged via Morgan

### Error Tracking
- Centralized error handler
- Sanitized error messages in production
- Stack traces in development only

### Performance
- Response compression enabled
- Rate limiting to prevent abuse
- Efficient proxying with axios

## Development Workflow

1. **Local Development**
   ```bash
   npm run dev  # Starts with nodemon (auto-reload)
   ```

2. **Testing**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Production Build**
   ```bash
   npm start  # Starts production server
   ```

4. **Deployment**
   ```bash
   git push origin main  # Auto-deploys on Render
   ```

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `API_SECRET_KEY` | Yes | API key for authentication |
| `JWT_SECRET` | Yes | JWT signing secret |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes* | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes* | Firebase private key |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `AGORA_APP_ID` | Yes | Agora app ID |
| `AGORA_APP_CERTIFICATE` | Yes | Agora app certificate |
| `AGORA_TOKEN_SERVER_URL` | Yes | Agora token server URL |
| `JOB_API_URL` | Yes | Job API URL |
| `AI_READER_API_URL` | Yes | AI Reader API URL |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |
| `ALLOWED_ORIGINS` | No | CORS allowed origins |

\* Can use service account JSON file instead

---

**This structure provides a secure, scalable, and maintainable backend for your Flutter Social Media App.** 🚀
