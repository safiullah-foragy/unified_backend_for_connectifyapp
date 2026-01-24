import express from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const AI_API_URL = process.env.AI_READER_API_URL || 'https://image-video-audio-pdf-docs-reader-api-1.onrender.com';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * @route   POST /api/ai/extract
 * @desc    Extract and analyze content from file or URL
 * @access  Protected
 */
router.post('/extract', upload.single('file'), asyncHandler(async (req, res) => {
  try {
    const formData = new FormData();

    // Handle file upload
    if (req.file) {
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });
    }

    // Handle URL
    if (req.body.url) {
      formData.append('url', req.body.url);
    }

    if (!req.file && !req.body.url) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Either file or url is required'
      });
    }

    const response = await axios.post(`${AI_API_URL}/api/extract`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 120000, // 2 minutes for AI processing
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI API is starting up or processing took too long. Please retry.',
        retryAfter: 30
      });
    }

    console.error('AI API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'AI API Error',
      message: 'Failed to process content with AI',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI about analyzed content
 * @access  Protected
 */
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'message is required'
    });
  }

  try {
    const response = await axios.post(`${AI_API_URL}/api/chat`, {
      message,
      context
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 1 minute for chat
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('AI Chat error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Chat Failed',
      message: 'Failed to get AI response',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   POST /api/ai/analyze-url
 * @desc    Analyze content from URL
 * @access  Protected
 */
router.post('/analyze-url', asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'url is required'
    });
  }

  try {
    const formData = new FormData();
    formData.append('url', url);

    const response = await axios.post(`${AI_API_URL}/api/extract`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 120000 // 2 minutes
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('AI URL analysis error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Analysis Failed',
      message: 'Failed to analyze URL content',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   GET /api/ai/health
 * @desc    Check AI API health
 * @access  Protected
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${AI_API_URL}/health`, {
      timeout: 10000
    });

    res.json({
      success: true,
      status: 'healthy',
      ...response.data
    });

  } catch (error) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'AI API is not responding',
      details: error.message
    });
  }
}));

export default router;
