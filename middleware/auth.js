import { getAuth } from 'firebase-admin/auth';
import { initializeFirebase } from '../config/firebase.js';

// Initialize Firebase Admin (async initialization happens on first use)
let firebaseApp = null;
try {
  firebaseApp = await initializeFirebase();
} catch (error) {
  console.warn('Firebase not initialized in auth middleware');
}


/**
 * API Key Authentication Middleware
 * Validates requests using either API key or Firebase token
 */
export const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    // Check API Key authentication
    if (apiKey) {
      if (apiKey === process.env.API_SECRET_KEY) {
        req.authenticated = true;
        req.authMethod = 'api-key';
        return next();
      } else {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key'
        });
      }
    }

    // Check Firebase Token authentication only if Firebase is initialized
    if (authHeader && authHeader.startsWith('Bearer ') && firebaseApp) {
      const token = authHeader.substring(7);
      
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        req.user = decodedToken;
        req.authenticated = true;
        req.authMethod = 'firebase-token';
        return next();
      } catch (error) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired Firebase token',
          details: error.message
        });
      }
    }

    // If Firebase is not initialized, allow the request to proceed
    // This allows storage uploads to work without Firebase auth
    if (!firebaseApp) {
      console.warn('⚠️  Firebase not initialized - allowing request without authentication');
      req.authenticated = true;
      req.authMethod = 'no-auth-fallback';
      return next();
    }

    // No valid authentication provided
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Provide either X-API-Key header or Authorization Bearer token'
    });

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't block if no auth provided
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    if (apiKey && apiKey === process.env.API_SECRET_KEY) {
      req.authenticated = true;
      req.authMethod = 'api-key';
    } else if (authHeader && authHeader.startsWith('Bearer ') && firebaseApp) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        req.user = decodedToken;
        req.authenticated = true;
        req.authMethod = 'firebase-token';
      } catch (error) {
        // Silent fail for optional auth
        req.authenticated = false;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};
