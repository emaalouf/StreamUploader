const axios = require('axios');
const crypto = require('crypto');

class R2Service {
  constructor() {
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'sleepmp3';
    this.region = 'auto';
    this.endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    
    // Debug logging
    console.log('R2Service initialized with:');
    console.log('Endpoint:', this.endpoint);
    console.log('Bucket:', this.bucketName);
    console.log('Account ID present:', !!process.env.CLOUDFLARE_ACCOUNT_ID);
    console.log('Access Key ID present:', !!this.accessKeyId);
    console.log('Secret Access Key present:', !!this.secretAccessKey);
    
    // Check if credentials are missing
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !this.accessKeyId || !this.secretAccessKey) {
      console.error('⚠️ WARNING: Missing R2 credentials! Check your .env file.');
    }
  }

  /**
   * Generate AWS Signature V4 for R2 requests
   * @param {String} method - HTTP method
   * @param {String} path - Request path
   * @param {Object} headers - Request headers
   * @param {String} body - Request body
   * @param {Object} queryParams - Query parameters
   * @returns {Object} Headers with signature
   */
  generateSignatureHeaders(method, path, headers = {}, body = '', queryParams = {}) {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = timestamp.slice(0, 8);
    
    // Ensure content-type is set for proper signing
    const headersToSign = {
      ...headers,
      'content-type': headers['content-type'] || 'application/octet-stream',
    };

    // Convert all header keys to lowercase for signing
    const normalizedHeaders = {};
    Object.keys(headersToSign).forEach(key => {
      normalizedHeaders[key.toLowerCase()] = headersToSign[key];
    });

    const signedHeaders = Object.keys(normalizedHeaders)
      .map(h => h.toLowerCase())
      .sort()
      .join(';');

    // Create canonical query string
    const canonicalQueryString = Object.keys(queryParams)
      .sort()
      .map(key => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`;
      })
      .join('&');

    // Create canonical headers string
    const canonicalHeaders = Object.keys(normalizedHeaders)
      .sort()
      .map(key => `${key}:${normalizedHeaders[key].trim()}\n`)
      .join('');

    const payloadHash = typeof body === 'string' 
      ? crypto.createHash('sha256').update(body || '').digest('hex') 
      : body || crypto.createHash('sha256').update('').digest('hex');

    const canonicalRequest = [
      method,
      path,
      canonicalQueryString,
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');

    const scope = `${date}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      timestamp,
      scope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const key1 = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(date).digest();
    const key2 = crypto.createHmac('sha256', key1).update(this.region).digest();
    const key3 = crypto.createHmac('sha256', key2).update('s3').digest();
    const key4 = crypto.createHmac('sha256', key3).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', key4).update(stringToSign).digest('hex');

    console.log('Canonical Request (first 300 chars):', canonicalRequest.substring(0, 300));
    console.log('String to Sign (first 300 chars):', stringToSign.substring(0, 300));

    return {
      ...headers,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${scope},SignedHeaders=${signedHeaders},Signature=${signature}`,
      'x-amz-date': timestamp,
      'x-amz-content-sha256': payloadHash,
    };
  }

  /**
   * Upload file to R2 bucket
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} fileName - File name
   * @param {String} contentType - MIME type
   * @returns {Promise<Object>} Upload response
   */
  async uploadFile(fileBuffer, fileName, contentType) {
    const path = `/${this.bucketName}/${fileName}`;
    const headers = {
      'Host': new URL(this.endpoint).host,
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'x-amz-content-sha256': crypto.createHash('sha256').update(fileBuffer).digest('hex'),
    };

    const signedHeaders = this.generateSignatureHeaders('PUT', path, headers, fileBuffer);

    try {
      const response = await axios({
        method: 'PUT',
        url: `${this.endpoint}${path}`,
        headers: signedHeaders,
        data: fileBuffer,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return {
        success: true,
        fileName,
        url: `${this.endpoint}${path}`,
        etag: response.headers.etag,
      };
    } catch (error) {
      console.error('Error uploading to R2:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for R2 object
   * @param {String} fileName - Name of the file in the bucket
   * @param {Number} expiresIn - Expiration time in seconds (default 3600 = 1 hour)
   * @returns {String} Presigned URL
   */
  getPresignedUrl(fileName, expiresIn = 3600) {
    const timestamp = Math.floor(Date.now() / 1000);
    const expiry = timestamp + expiresIn;
    
    const path = `/${this.bucketName}/${fileName}`;
    const headers = {
      'Host': new URL(this.endpoint).host,
      'X-Amz-Expires': expiresIn.toString(),
    };

    const signedHeaders = this.generateSignatureHeaders('GET', path, headers, '', {});
    
    const params = new URLSearchParams({
      'X-Amz-Expires': expiresIn.toString(),
      'X-Amz-Date': signedHeaders['x-amz-date'],
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': signedHeaders.Authorization.split('Credential=')[1].split(',')[0],
      'X-Amz-SignedHeaders': signedHeaders.Authorization.split('SignedHeaders=')[1].split(',')[0],
      'X-Amz-Signature': signedHeaders.Authorization.split('Signature=')[1],
    });

    return `${this.endpoint}${path}?${params.toString()}`;
  }

  /**
   * List objects in the R2 bucket
   * @param {Object} options - Listing options
   * @returns {Promise<Object>} List of objects
   */
  async listObjects(options = {}) {
    try {
      const queryParams = {};
      
      if (options.prefix) queryParams.prefix = options.prefix;
      if (options.delimiter) queryParams.delimiter = options.delimiter;
      if (options.maxKeys) queryParams['max-keys'] = options.maxKeys;
      if (options.startAfter) queryParams['start-after'] = options.startAfter;

      const queryString = new URLSearchParams(queryParams).toString();
      const path = `/${this.bucketName}`;
      const url = `${this.endpoint}${path}?${queryString}`;
      
      // Debug logging
      console.log('Listing objects with:');
      console.log('URL:', url);
      console.log('Query params:', queryParams);
      
      const headers = {
        'Host': new URL(this.endpoint).host,
        'x-amz-content-sha256': crypto.createHash('sha256').update('').digest('hex'),
      };
      
      // Debug headers
      console.log('Headers before signing:', headers);

      const signedHeaders = this.generateSignatureHeaders('GET', path, headers, '', queryParams);
      
      console.log('Signed headers (partial):', {
        'Host': signedHeaders.Host,
        'Authorization': signedHeaders.Authorization ? signedHeaders.Authorization.substring(0, 100) + '...' : null,
        'x-amz-date': signedHeaders['x-amz-date']
      });

      const response = await axios({
        method: 'GET',
        url,
        headers: signedHeaders,
      });

      return {
        success: true,
        objects: response.data?.Contents || [],
        prefixes: response.data?.CommonPrefixes || [],
      };
    } catch (error) {
      console.error('Error listing R2 objects:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  }

  /**
   * Get object information (head)
   * @param {String} fileName - Object key/name
   * @returns {Promise<Object>} Object information
   */
  async getObjectInfo(fileName) {
    try {
      const path = `/${this.bucketName}/${fileName}`;
      
      const headers = {
        'Host': new URL(this.endpoint).host,
        'x-amz-content-sha256': crypto.createHash('sha256').update('').digest('hex'),
      };

      const signedHeaders = this.generateSignatureHeaders('HEAD', path, headers, '', {});

      const response = await axios({
        method: 'HEAD',
        url: `${this.endpoint}${path}`,
        headers: signedHeaders,
      });

      return {
        success: true,
        fileName,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        etag: response.headers.etag,
        lastModified: response.headers['last-modified'],
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: false,
          message: 'Object not found',
          fileName,
        };
      }
      console.error('Error getting R2 object info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete an object from the R2 bucket
   * @param {String} fileName - Object key/name
   * @returns {Promise<Object>} Deletion response
   */
  async deleteObject(fileName) {
    try {
      const path = `/${this.bucketName}/${fileName}`;
      
      const headers = {
        'Host': new URL(this.endpoint).host,
        'x-amz-content-sha256': crypto.createHash('sha256').update('').digest('hex'),
      };

      const signedHeaders = this.generateSignatureHeaders('DELETE', path, headers, '', {});

      await axios({
        method: 'DELETE',
        url: `${this.endpoint}${path}`,
        headers: signedHeaders,
      });

      return {
        success: true,
        message: 'Object deleted successfully',
        fileName,
      };
    } catch (error) {
      console.error('Error deleting R2 object:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new R2Service(); 