const express = require('express');
const multer = require('multer');
const path = require('path');
const r2Service = require('../services/r2Service');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow only audio files
    const mimeType = file.mimetype;
    if (mimeType.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for audio files
  },
});

// List all objects in R2 bucket
router.get('/', async (req, res) => {
  try {
    // Get listing parameters from query string
    const options = {
      prefix: req.query.prefix || '',
      delimiter: req.query.delimiter || '/',
      maxKeys: req.query.maxKeys || 1000,
      startAfter: req.query.startAfter,
    };
    
    const response = await r2Service.listObjects(options);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.response?.data || {},
    });
  }
});

// Upload audio file to R2 bucket
router.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { buffer, originalname, mimetype } = req.file;
    
    // Generate a unique filename to prevent overwrites
    const fileExtension = path.extname(originalname);
    const fileName = `${path.basename(originalname, fileExtension)}-${Date.now()}${fileExtension}`;
    
    // Upload the file to R2 bucket
    const response = await r2Service.uploadFile(buffer, fileName, mimetype);
    
    // Generate a presigned URL for immediate access
    const presignedUrl = r2Service.getPresignedUrl(fileName);
    
    res.json({
      success: true,
      message: 'Audio file uploaded successfully',
      fileName: fileName,
      url: presignedUrl,
      etag: response.etag,
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

// Get presigned URL
router.get('/presigned/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn) : 3600;
    
    const presignedUrl = r2Service.getPresignedUrl(fileName, expiresIn);
    
    res.json({
      success: true,
      fileName,
      url: presignedUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get object information
router.get('/info/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const info = await r2Service.getObjectInfo(fileName);
    
    if (!info.success) {
      return res.status(404).json(info);
    }
    
    res.json(info);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete object from R2 bucket
router.delete('/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const result = await r2Service.deleteObject(fileName);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router; 