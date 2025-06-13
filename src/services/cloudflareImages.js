const axios = require('axios');
require('dotenv').config();

// Cloudflare Images API credentials
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_IMAGES_API_TOKEN = process.env.CF_IMAGES_API_TOKEN;

// Base URL for Cloudflare Images API
const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;

/**
 * List all images
 * @param {Object} options - Options for listing images
 * @returns {Promise<Object>} - The API response
 */
async function listImages(options = {}) {
  try {
    const params = {
      page: options.page || 1,
      per_page: options.limit || 25
    };

    const response = await axios.get(`${baseUrl}`, {
      params,
      headers: {
        Authorization: `Bearer ${CF_IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      result: response.data,
    };
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}

/**
 * Get direct upload URL for Cloudflare Images
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - The API response with upload URL
 */
async function getDirectUploadUrl(options = {}) {
  try {
    const response = await axios.post(
      `${baseUrl}/direct_upload`,
      {
        metadata: options.metadata || {},
        requireSignedURLs: options.requireSignedURLs || false,
      },
      {
        headers: {
          Authorization: `Bearer ${CF_IMAGES_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      result: response.data.result,
    };
  } catch (error) {
    console.error('Error getting direct upload URL:', error);
    throw error;
  }
}

/**
 * Upload image directly to Cloudflare Images
 * @param {Buffer} buffer - The file buffer
 * @param {String} filename - The original filename
 * @param {String} mimeType - The file's MIME type
 * @returns {Promise<Object>} - The API response
 */
async function uploadImage(buffer, filename, mimeType) {
  try {
    // First get a direct upload URL
    const uploadUrlResponse = await getDirectUploadUrl();
    const { uploadURL, id } = uploadUrlResponse.result;
    
    // Use the upload URL to upload the image
    const formData = new FormData();
    
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename);

    const uploadResponse = await axios.post(uploadURL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      result: uploadResponse.data.result,
      id: id,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Get image details
 * @param {String} imageId - The image ID
 * @returns {Promise<Object>} - The API response
 */
async function getImage(imageId) {
  try {
    const response = await axios.get(`${baseUrl}/${imageId}`, {
      headers: {
        Authorization: `Bearer ${CF_IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      result: response.data.result,
    };
  } catch (error) {
    console.error('Error getting image details:', error);
    throw error;
  }
}

/**
 * Delete an image
 * @param {String} imageId - The image ID to delete
 * @returns {Promise<Object>} - The API response
 */
async function deleteImage(imageId) {
  try {
    const response = await axios.delete(`${baseUrl}/${imageId}`, {
      headers: {
        Authorization: `Bearer ${CF_IMAGES_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      result: response.data.result,
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

module.exports = {
  listImages,
  getDirectUploadUrl,
  uploadImage,
  getImage,
  deleteImage,
}; 