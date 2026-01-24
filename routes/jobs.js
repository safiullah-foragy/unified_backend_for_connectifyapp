import express from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const JOB_API_URL = process.env.JOB_API_URL || 'https://bd-job-api.onrender.com';

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs (proxied from job API)
 * @access  Protected
 */
router.get('/', asyncHandler(async (req, res) => {
  const { limit = 100, offset = 0, search, category } = req.query;

  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(offset && { offset: offset.toString() }),
      ...(search && { search }),
      ...(category && { category })
    });

    const response = await axios.get(`${JOB_API_URL}/api/jobs?${params}`, {
      timeout: 15000 // 15 seconds timeout for cold starts
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Job API is starting up (free tier). Please retry in 30 seconds.',
        retryAfter: 30
      });
    }

    console.error('Job API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Job API Error',
      message: 'Failed to fetch jobs from external API',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID
 * @access  Protected
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${JOB_API_URL}/api/jobs/${id}`, {
      timeout: 15000
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('Job API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Job API Error',
      message: 'Failed to fetch job details',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   GET /api/jobs/search
 * @desc    Search jobs
 * @access  Protected
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { q, category, location, type } = req.query;

  if (!q) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Search query (q) is required'
    });
  }

  try {
    const params = new URLSearchParams({
      search: q,
      ...(category && { category }),
      ...(location && { location }),
      ...(type && { type })
    });

    const response = await axios.get(`${JOB_API_URL}/api/jobs?${params}`, {
      timeout: 15000
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('Job search error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Search Failed',
      message: 'Failed to search jobs',
      details: error.response?.data || error.message
    });
  }
}));

/**
 * @route   GET /api/jobs/categories
 * @desc    Get job categories
 * @access  Protected
 */
router.get('/categories', asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(`${JOB_API_URL}/api/categories`, {
      timeout: 15000
    });

    res.json({
      success: true,
      ...response.data
    });

  } catch (error) {
    console.error('Categories API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'API Error',
      message: 'Failed to fetch job categories',
      details: error.response?.data || error.message
    });
  }
}));

export default router;
