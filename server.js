import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import agoraRoutes from './routes/agora.js';
import storageRoutes from './routes/storage.js';
import jobRoutes from './routes/jobs.js';
import aiRoutes from './routes/ai.js';
import firestoreRoutes from './routes/firestore.js';
import healthRoutes from './routes/health.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { apiKeyAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Security Middleware
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed patterns
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// ============================================
// Rate Limiting
// ============================================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// Body Parsing & Compression
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// Routes
// ============================================

// Health check (no auth required)
app.use('/api/health', healthRoutes);

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (require API key or Firebase token)
app.use('/api/agora', apiKeyAuth, agoraRoutes);
app.use('/api/storage', apiKeyAuth, storageRoutes);
app.use('/api/jobs', apiKeyAuth, jobRoutes);
app.use('/api/ai', apiKeyAuth, aiRoutes);
app.use('/api/firestore', apiKeyAuth, firestoreRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Unified Backend API Gateway',
    version: '1.0.0',
    description: 'Unified API for Flutter Social Media App',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      agora: '/api/agora',
      storage: '/api/storage',
      jobs: '/api/jobs',
      ai: '/api/ai',
      firestore: '/api/firestore'
    },
    documentation: 'See README.md for API documentation'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/agora',
      '/api/storage',
      '/api/jobs',
      '/api/ai',
      '/api/firestore'
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Unified Backend API Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet + CORS enabled`);
  console.log(`⚡ Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
