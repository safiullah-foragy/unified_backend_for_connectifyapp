import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check for the API and all sub-services
 * @access  Public
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  };

  // Check external services
  const services = [
    {
      name: 'Job API',
      url: process.env.JOB_API_URL + '/api/jobs?limit=1',
      timeout: 5000
    },
    {
      name: 'AI Reader API',
      url: process.env.AI_READER_API_URL + '/health',
      timeout: 5000
    },
    {
      name: 'Agora Token Server',
      url: process.env.AGORA_TOKEN_SERVER_URL + '/ping',
      timeout: 5000
    }
  ];

  // Check each service in parallel
  const checks = services.map(async (service) => {
    try {
      const start = Date.now();
      await axios.get(service.url, { timeout: service.timeout });
      const responseTime = Date.now() - start;
      
      return {
        name: service.name,
        status: 'up',
        responseTime: `${responseTime}ms`
      };
    } catch (error) {
      return {
        name: service.name,
        status: 'down',
        error: error.message
      };
    }
  });

  const results = await Promise.all(checks);
  
  results.forEach(result => {
    health.services[result.name] = {
      status: result.status,
      ...(result.responseTime && { responseTime: result.responseTime }),
      ...(result.error && { error: result.error })
    };
  });

  // Check if any service is down
  const anyDown = results.some(r => r.status === 'down');
  if (anyDown) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * @route   GET /api/health/ping
 * @desc    Simple ping endpoint
 * @access  Public
 */
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;
