import express from 'express';
import { getFirebaseAuth } from '../config/firebase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * @route   POST /api/auth/verify
 * @desc    Verify Firebase ID token
 * @access  Public
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Token is required'
    });
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    
    res.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    });
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      details: error.message
    });
  }
}));

/**
 * @route   POST /api/auth/user
 * @desc    Get user information
 * @access  Public (requires token in body)
 */
router.post('/user', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Token is required'
    });
  }

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(token);
    const user = await getFirebaseAuth().getUser(decodedToken.uid);
    
    res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        }
      }
    });
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to fetch user information',
      details: error.message
    });
  }
}));

/**
 * @route   POST /api/auth/custom-token
 * @desc    Create custom token for a user (admin only)
 * @access  Protected (requires API key)
 */
router.post('/custom-token', asyncHandler(async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'User ID is required'
    });
  }

  try {
    const customToken = await getFirebaseAuth().createCustomToken(uid);
    
    res.json({
      success: true,
      customToken
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create custom token',
      details: error.message
    });
  }
}));

export default router;
