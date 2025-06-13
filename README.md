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

# API Security
API_KEY=your_secret_api_key_here
RATE_LIMIT_WINDOW_MS=15000
RATE_LIMIT_MAX_REQUESTS=100

# Server Configuration
PORT=3000
```
4. Generate a secure API key:
```
node src/scripts/generateKey.js --update-env
```
5. Start the server:
```
npm run dev
```

## Authentication

All API endpoints require API key authentication. Include your API key in the `x-api-key` header with each request:

```
x-api-key: your_api_key_here
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Default: 100 requests per 15-minute window
- Upload endpoints: 50 requests per 15-minute window

Rate limit information is returned in the headers:
- `X-RateLimit-Limit`: Maximum number of requests allowed in the window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time (in seconds) when the rate limit window resets

## API Endpoints

### Cloudflare Stream (Images & Videos)

#### List All Videos
```
GET /api/stream
```
List all videos uploaded to Cloudflare Stream.

**Headers:**
- `x-api-key`: Your API key (Required)

**Query Parameters:**
- `limit`: Maximum number of videos to return (Default: 25)
- `asc`: Sort by creation time in ascending order if true
- `status`: Filter by video status
- `before`: Return videos created before this ID
- `after`: Return videos created after this ID

#### Get Direct Upload URL
```
POST /api/stream/get-upload-url
```
This endpoint returns a direct upload URL that can be used to upload a file to Cloudflare Stream.

**Headers:**
- `x-api-key`: Your API key (Required)

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

**Headers:**
- `x-api-key`: Your API key (Required)

**Form Data:**
- `file`: The image or video file to upload (Required)

#### Get Video Information
```
GET /api/stream/:videoId
```
Retrieve information about a specific video.

**Headers:**
- `x-api-key`: Your API key (Required)

**URL Parameters:**
- `videoId`: ID of the video to retrieve

#### Delete a Video
```
DELETE /api/stream/:videoId
```
Delete a video from Cloudflare Stream.

**Headers:**
- `x-api-key`: Your API key (Required)

**URL Parameters:**
- `videoId`: ID of the video to delete

### Cloudflare R2 (Audio Files)

#### List All Objects
```
GET /api/r2
```
List objects stored in the R2 bucket.

**Headers:**
- `x-api-key`: Your API key (Required)

**Query Parameters:**
- `prefix`: Filter objects by prefix/folder
- `delimiter`: Character used to group keys (Default: "/")
- `maxKeys`: Maximum number of keys to return (Default: 1000)
- `startAfter`: Return keys after this key

#### Upload an Audio File
```
POST /api/r2/upload
```
Upload an audio file to the R2 bucket.

**Headers:**
- `x-api-key`: Your API key (Required)

**Form Data:**
- `file`: The audio file to upload (Required)

#### Get Presigned URL
```
GET /api/r2/presigned/:fileName
```
Get a presigned URL for an audio file stored in the R2 bucket.

**Headers:**
- `x-api-key`: Your API key (Required)

**URL Parameters:**
- `fileName`: Name of the file

**Query Parameters:**
- `expiresIn`: Expiration time in seconds (Default: 3600)

#### Get Object Information
```
GET /api/r2/info/:fileName
```
Get metadata about an object stored in the R2 bucket.

**Headers:**
- `x-api-key`: Your API key (Required)

**URL Parameters:**
- `fileName`: Name of the file

#### Delete an Object
```
DELETE /api/r2/:fileName
```
Delete an object from the R2 bucket.

**Headers:**
- `x-api-key`: Your API key (Required)

**URL Parameters:**
- `fileName`: Name of the file to delete

## Usage Examples

### List All Videos in Cloudflare Stream

```javascript
fetch('/api/stream', {
  method: 'GET',
  headers: {
    'x-api-key': 'your_api_key_here'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Delete a Video

```javascript
fetch('/api/stream/video_id_here', {
  method: 'DELETE',
  headers: {
    'x-api-key': 'your_api_key_here'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### List All Audio Files in R2

```javascript
fetch('/api/r2', {
  method: 'GET',
  headers: {
    'x-api-key': 'your_api_key_here'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Delete an Audio File from R2

```javascript
fetch('/api/r2/filename.mp3', {
  method: 'DELETE',
  headers: {
    'x-api-key': 'your_api_key_here'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Upload an Image or Video to Cloudflare Stream

```javascript
const form = new FormData();
form.append('file', fileInput.files[0]);

fetch('/api/stream/upload', {
  method: 'POST',
  headers: {
    'x-api-key': 'your_api_key_here'
  },
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
  headers: {
    'x-api-key': 'your_api_key_here'
  },
  body: form,
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## Web Interface

The API includes a web interface for testing uploads, available at the root URL. The interface allows you to:
- Enter your API key
- Upload files to Cloudflare Stream and R2
- View responses and rate limit information

## Limitations

- Image and video files are uploaded to Cloudflare Stream
- Audio files are uploaded to the R2 bucket named "sleepmp3"
- Maximum file sizes:
  - Videos: 500MB
  - Audio: 100MB
- Rate limits apply to all endpoints 