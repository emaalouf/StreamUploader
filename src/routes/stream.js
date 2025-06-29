const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudflareStream = require('../services/cloudflareStream');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow only images and videos
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
});

// List all videos
router.get('/', async (req, res) => {
  try {
    // Get pagination parameters from query string
    const options = {
      limit: req.query.limit || 25,
      asc: req.query.asc,
      status: req.query.status,
      before: req.query.before,
      after: req.query.after
    };
    
    const response = await cloudflareStream.listVideos(options);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Get direct upload URL
router.post('/get-upload-url', uploadLimiter, async (req, res) => {
  try {
    const response = await cloudflareStream.getUploadUrl(req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Direct upload to Cloudflare Stream
router.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    
    // Upload the file to Cloudflare Stream
    const response = await cloudflareStream.uploadFile(buffer, originalname, mimetype);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      result: response.result,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Get video information
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const response = await cloudflareStream.getVideo(videoId);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Delete a video
router.delete('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const response = await cloudflareStream.deleteVideo(videoId);
    res.json({
      success: true,
      message: 'Video deleted successfully',
      result: response.result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

module.exports = router; 