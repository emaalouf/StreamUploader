require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const streamRoutes = require('./routes/stream');
const r2Routes = require('./routes/r2');

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

// Routes
app.use('/api/stream', streamRoutes);
app.use('/api/r2', r2Routes);

// Home route
app.get('/api', (req, res) => {
  res.json({
    message: 'Cloudflare Stream and R2 Upload API',
    endpoints: {
      stream: '/api/stream/upload',
      r2: '/api/r2/upload'
    }
  });
});

// Root route serves the HTML interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the upload interface at http://localhost:${PORT}`);
}); 