require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// Import routes
const streamRoutes = require('./routes/stream');
const r2Routes = require('./routes/r2');
const imagesRoutes = require('./routes/images');

// Import middlewares
const { apiKeyAuth, skipAuth } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Set up storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes with API key authentication
app.use('/api/stream', apiKeyAuth, streamRoutes);
app.use('/api/r2', apiKeyAuth, r2Routes);
app.use('/api/images', apiKeyAuth, imagesRoutes);

// API documentation route - no authentication required
app.get('/api', (req, res) => {
  res.json({
    message: 'Cloudflare Stream, Images, and R2 Upload API',
    endpoints: {
      stream: '/api/stream/upload',
      r2: '/api/r2/upload',
      images: '/api/images/upload'
    },
    authentication: {
      required: true,
      header: 'x-api-key'
    }
  });
});

// Root route serves the HTML interface and automatically adds API key for demo purposes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the upload interface at http://localhost:${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api`);
  
  if (!process.env.API_KEY) {
    console.warn('\n⚠️  WARNING: API_KEY is not set in .env file');
    console.warn('To generate a secure API key, run: node src/scripts/generateKey.js --update-env\n');
  }
}); 