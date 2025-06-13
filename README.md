# Cloudflare Stream & R2 Upload API

This API provides endpoints for uploading media files to Cloudflare Stream (images and videos) and Cloudflare R2 (audio files).

## Setup

1. Clone the repository
2. Install dependencies:
```
npm install
```
3. Create a `.env` file in the root directory and add your Cloudflare credentials:
```
# Cloudflare API Credentials
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# R2 Configuration
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=sleepmp3

# Server Configuration
PORT=3000
```
4. Start the server:
```
npm run dev
```

## API Endpoints

### Cloudflare Stream (Images & Videos)

#### Get Direct Upload URL
```
POST /api/stream/get-upload-url
```
This endpoint returns a direct upload URL that can be used to upload a file to Cloudflare Stream.

**Request Body (optional):**
```json
{
  "maxDurationSeconds": 3600,
  "expiry": "2023-12-31T23:59:59Z",
  "requireSignedURLs": false,
  "allowedOrigins": ["*"],
  "thumbnailTimestampPct": 0.5
}
```

#### Upload a File
```
POST /api/stream/upload
```
Directly upload an image or video file to Cloudflare Stream.

**Form Data:**
- `file`: The image or video file to upload (Required)

#### Get Video Information
```
GET /api/stream/:videoId
```
Retrieve information about a specific video.

### Cloudflare R2 (Audio Files)

#### Upload an Audio File
```
POST /api/r2/upload
```
Upload an audio file to the R2 bucket.

**Form Data:**
- `file`: The audio file to upload (Required)

#### Get Presigned URL
```
GET /api/r2/presigned/:fileName
```
Get a presigned URL for an audio file stored in the R2 bucket.

**Query Parameters:**
- `expiresIn`: Expiration time in seconds (Default: 3600)

## Usage Examples

### Upload an Image or Video to Cloudflare Stream

```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);

fetch('/api/stream/upload', {
  method: 'POST',
  body: form,
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Upload an Audio File to R2

```javascript
const form = new FormData();
form.append('file', audioInput.files[0]);

fetch('/api/r2/upload', {
  method: 'POST',
  body: form,
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Limitations

- Image and video files are uploaded to Cloudflare Stream
- Audio files are uploaded to the R2 bucket named "sleepmp3"
- Maximum file sizes:
  - Videos: 500MB
  - Audio: 100MB 