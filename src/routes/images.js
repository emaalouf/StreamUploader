const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudflareImages = require('../services/cloudflareImages');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow only images
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for images
  },
});

// List all images
router.get('/', async (req, res) => {
  try {
    // Get pagination parameters from query string
    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 25,
    };
    
    const response = await cloudflareImages.listImages(options);
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
    const response = await cloudflareImages.getDirectUploadUrl(req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Direct upload to Cloudflare Images
router.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    
    // Upload the file to Cloudflare Images
    const response = await cloudflareImages.uploadImage(buffer, originalname, mimetype);
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
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

// Get image information
router.get('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const response = await cloudflareImages.getImage(imageId);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Delete an image
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const response = await cloudflareImages.deleteImage(imageId);
    res.json({
      success: true,
      message: 'Image deleted successfully',
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