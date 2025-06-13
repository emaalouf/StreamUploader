/**
 * API key authentication middleware
 * Checks for a valid API key in the header
 */
const apiKeyAuth = (req, res, next) => {
  // Get API key from header
  const apiKey = req.headers['x-api-key'];
  
  // Check if API key is present
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }
  
  // Check if API key is valid
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  // API key is valid, continue
  next();
};

// Skip auth for internal routes (like the web interface)
const skipAuth = (req, res, next) => {
  // Add x-api-key header with API key from .env
  req.headers['x-api-key'] = process.env.API_KEY;
  next();
};

module.exports = {
  apiKeyAuth,
  skipAuth
}; 