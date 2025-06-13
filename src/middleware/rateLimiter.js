const rateLimit = require('express-rate-limit');

/**
 * Rate limiter middleware to prevent abuse
 * Limits the number of requests a client can make in a given time window
 */
const createRateLimiter = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // Default: 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Default: 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil(res.getHeaders()['retry-after'] || 60)
      });
    },
    // Skip rate limit for API endpoints with valid API key
    skip: (req) => {
      const apiKey = req.headers['x-api-key'];
      return apiKey === process.env.API_KEY && process.env.NODE_ENV === 'development';
    },
    keyGenerator: (req) => {
      // Use API key if available, otherwise use IP
      return req.headers['x-api-key'] || req.ip;
    }
  });
};

// Create different rate limiters for different routes
const createEndpointRateLimiter = (options = {}) => {
  const baseConfig = createRateLimiter();
  return rateLimit({
    ...baseConfig,
    ...options,
    max: options.max || baseConfig.max,
    windowMs: options.windowMs || baseConfig.windowMs
  });
};

// Standard rate limiter for all API routes
const apiLimiter = createRateLimiter();

// Stricter rate limiter for upload endpoints
const uploadLimiter = createEndpointRateLimiter({
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) / 2 || 50, // Half the standard limit
  message: 'Too many upload requests, please try again later'
});

module.exports = {
  apiLimiter,
  uploadLimiter
}; 