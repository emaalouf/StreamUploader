const axios = require('axios');
const FormData = require('form-data');

class CloudflareStreamService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  /**
   * Get a direct upload URL for Cloudflare Stream
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Response with upload URL
   */
  async getUploadUrl(options = {}) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/direct_upload`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          maxDurationSeconds: options.maxDurationSeconds || 3600,
          expiry: options.expiry || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          requireSignedURLs: options.requireSignedURLs || false,
          allowedOrigins: options.allowedOrigins || ['*'],
          thumbnailTimestampPct: options.thumbnailTimestampPct || 0.5,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting upload URL:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload a file directly to Cloudflare Stream
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} fileName - Name of the file
   * @param {String} fileType - MIME type of the file
   * @returns {Promise<Object>} Upload response
   */
  async uploadFile(fileBuffer, fileName, fileType) {
    try {
      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: fileType,
      });

      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          ...form.getHeaders(),
        },
        data: form,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get information about a video
   * @param {String} videoId - ID of the video
   * @returns {Promise<Object>} Video information
   */
  async getVideo(videoId) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/${videoId}`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting video info:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new CloudflareStreamService(); 