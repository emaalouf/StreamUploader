const axios = require('axios');
const FormData = require('form-data');

class CloudflareImagesService {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`;
    this.deliveryUrl = 'https://imagedelivery.net/_JDMrXYUU5KuF_v5TckJoQ';
  }

  /**
   * List all images
   * @param {Object} options - Options for listing images
   * @returns {Promise<Object>} - The API response
   */
  async listImages(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        per_page: options.limit || 25
      };

      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}`,
        params,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        result: response.data,
      };
    } catch (error) {
      console.error('Error listing images:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get direct upload URL for Cloudflare Images
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - The API response with upload URL
   */
  async getDirectUploadUrl(options = {}) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}/direct_upload`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          metadata: options.metadata || {},
          requireSignedURLs: options.requireSignedURLs || false,
        },
      });

      // Add delivery URL to the response
      const result = response.data.result;
      result.deliveryUrl = `${this.deliveryUrl}/${result.id}`;

      return {
        success: true,
        result: result,
      };
    } catch (error) {
      console.error('Error getting direct upload URL:', error.response?.data || error.message);
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
  async uploadImage(buffer, filename, mimeType) {
    try {
      // First get a direct upload URL
      const uploadUrlResponse = await this.getDirectUploadUrl();
      const { uploadURL, id } = uploadUrlResponse.result;
      
      // Use the upload URL to upload the image
      const form = new FormData();
      form.append('file', buffer, {
        filename: filename,
        contentType: mimeType,
      });

      const uploadResponse = await axios({
        method: 'POST',
        url: uploadURL,
        headers: {
          ...form.getHeaders(),
        },
        data: form,
      });

      // Add the delivery URL to the response
      const result = uploadResponse.data.result || {};
      result.id = id;
      result.deliveryUrl = `${this.deliveryUrl}/${id}`;

      return {
        success: true,
        result: result,
      };
    } catch (error) {
      console.error('Error uploading image:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get image details
   * @param {String} imageId - The image ID
   * @returns {Promise<Object>} - The API response
   */
  async getImage(imageId) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.baseUrl}/${imageId}`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Add delivery URL to the response
      const result = response.data.result;
      result.deliveryUrl = `${this.deliveryUrl}/${imageId}`;

      return {
        success: true,
        result: result,
      };
    } catch (error) {
      console.error('Error getting image details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete an image
   * @param {String} imageId - The image ID to delete
   * @returns {Promise<Object>} - The API response
   */
  async deleteImage(imageId) {
    try {
      const response = await axios({
        method: 'DELETE',
        url: `${this.baseUrl}/${imageId}`,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        result: response.data.result,
      };
    } catch (error) {
      console.error('Error deleting image:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new CloudflareImagesService(); 