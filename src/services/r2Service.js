const axios = require('axios');
const crypto = require('crypto');

class R2Service {
  constructor() {
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'sleepmp3';
    this.region = 'auto';
    this.endpoint = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }

  /**
   * Generate AWS Signature V4 for R2 requests
   * @param {String} method - HTTP method
   * @param {String} path - Request path
   * @param {Object} headers - Request headers
   * @param {String} body - Request body
   * @returns {Object} Headers with signature
   */
  generateSignatureHeaders(method, path, headers = {}, body = '') {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = timestamp.slice(0, 8);

    const signedHeaders = Object.keys(headers)
      .map(h => h.toLowerCase())
      .sort()
      .join(';');

    const canonicalRequest = [
      method,
      path,
      '', // Query string
      ...Object.keys(headers)
        .sort()
        .map(h => `${h.toLowerCase()}:${headers[h]}\n`),
      '',
      signedHeaders,
      typeof body === 'string' ? crypto.createHash('sha256').update(body).digest('hex') : body,
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

    return {
      ...headers,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${scope},SignedHeaders=${signedHeaders},Signature=${signature}`,
      'x-amz-date': timestamp,
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

    const signedHeaders = this.generateSignatureHeaders('GET', path, headers, '');
    
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
}

module.exports = new R2Service(); 