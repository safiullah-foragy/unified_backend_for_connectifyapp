import express from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const AGORA_TOKEN_SERVER = process.env.AGORA_TOKEN_SERVER_URL || 'https://render-agora-token-server-app.onrender.com';

/**
 * @route   GET /api/agora/rtc-token
 * @desc    Get RTC token for video/audio calls
 * @access  Protected
 */
router.get('/rtc-token', asyncHandler(async (req, res) => {
  const { channelName, uid, role = 'publisher', expiry = 3600 } = req.query;

  if (!channelName || !uid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'channelName and uid are required'
    });
  }

  try {
    // Try multiple endpoints for compatibility
    let response;
    let token;

    // Method 1: /rtc endpoint
    try {
      const rtcUrl = `${AGORA_TOKEN_SERVER}/rtc/${channelName}/${role}/uid/${uid}?expiry=${expiry}`;
      response = await axios.get(rtcUrl, { timeout: 10000 });
      token = response.data.rtcToken || response.data.token;
    } catch (err) {
      // Method 2: /all endpoint with channelName
      try {
        const allUrl = `${AGORA_TOKEN_SERVER}/all?channelName=${channelName}&uid=${uid}&role=${role}&expiry=${expiry}`;
        response = await axios.get(allUrl, { timeout: 10000 });
        token = response.data.rtcToken || response.data.token;
      } catch (err2) {
        // Method 3: POST to /all
        const postUrl = `${AGORA_TOKEN_SERVER}/all`;
        response = await axios.post(postUrl, {
          channelName,
          uid: parseInt(uid),
          role,
          expiry: parseInt(expiry)
        }, { timeout: 10000 });
        token = response.data.rtcToken || response.data.token;
      }
    }

    if (!token) {
      throw new Error('Token not found in response');
    }

    res.json({
      success: true,
      token,
      channelName,
      uid,
      expiry
    });

  } catch (error) {
    console.error('Agora token error:', error.message);
    res.status(500).json({
      error: 'Token Generation Failed',
      message: 'Failed to generate Agora RTC token',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   GET /api/agora/rtm-token
 * @desc    Get RTM token for real-time messaging
 * @access  Protected
 */
router.get('/rtm-token', asyncHandler(async (req, res) => {
  const { uid, expiry = 3600 } = req.query;

  if (!uid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'uid is required'
    });
  }

  try {
    const rtmUrl = `${AGORA_TOKEN_SERVER}/rtm/${uid}?expiry=${expiry}`;
    const response = await axios.get(rtmUrl, { timeout: 10000 });
    
    const token = response.data.rtmToken || response.data.token;
    
    if (!token) {
      throw new Error('RTM token not found in response');
    }

    res.json({
      success: true,
      token,
      uid,
      expiry
    });

  } catch (error) {
    console.error('Agora RTM token error:', error.message);
    res.status(500).json({
      error: 'Token Generation Failed',
      message: 'Failed to generate Agora RTM token',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   POST /api/agora/token
 * @desc    Get token with POST method (alternative endpoint)
 * @access  Protected
 */
router.post('/token', asyncHandler(async (req, res) => {
  const { channelName, uid, role = 'publisher', expiry = 3600, tokenType = 'rtc' } = req.body;

  if (!uid) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'uid is required'
    });
  }

  if (tokenType === 'rtc' && !channelName) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'channelName is required for RTC tokens'
    });
  }

  try {
    const postUrl = `${AGORA_TOKEN_SERVER}/all`;
    const response = await axios.post(postUrl, {
      channelName,
      uid: parseInt(uid),
      role,
      expiry: parseInt(expiry)
    }, { timeout: 10000 });

    const token = response.data.rtcToken || response.data.rtmToken || response.data.token;
    
    if (!token) {
      throw new Error('Token not found in response');
    }

    res.json({
      success: true,
      token,
      tokenType,
      ...(channelName && { channelName }),
      uid,
      expiry
    });

  } catch (error) {
    console.error('Agora token error:', error.message);
    res.status(500).json({
      error: 'Token Generation Failed',
      message: 'Failed to generate Agora token',
      details: error.response?.data || error.message
    });
  }
}));

export default router;
