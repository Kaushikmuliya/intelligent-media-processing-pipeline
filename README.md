# Intelligent Media Processing Pipeline

An asynchronous, cloud-native image analysis system. It accepts image uploads via a REST API, queues them for background processing, runs five analysis modules in parallel, and exposes results through a structured API — all backed by MongoDB, Redis, and Cloudinary.

---

## Live Links

- **Demo:** https://intelligent-media-processing-api.onrender.com/
- **API Documentation:** https://intelligent-media-processing-api.onrender.com/api-docs/

- **Test Result of 3 Sample Images:**
https://drive.google.com/file/d/1jC5_XbX3dePiPSdIvuPcoXOa2sTVY9gN/view?usp=drivesdk

## Table of Contents

- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Processing Flow](#processing-flow)
- [Analysis Modules](#analysis-modules)
- [Tech Stack](#tech-stack)
- [API Reference](#api-reference)
- [Data Model](#data-model)
- [Running Locally](#running-locally)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Demo UI](#demo-ui)
- [AI Usage Disclosure](#ai-usage-disclosure)
- [Trade-offs and Design Decisions](#trade-offs-and-design-decisions)
- [Future Improvements](#future-improvements)

---

## Architecture

```
Client
   │
   ▼
Express API
   │
POST /api/v1/media/upload
   │
   ├── Multer (temporary upload)
   │
   ├── Upload to Cloudinary
   │
   ├── Save MongoDB document
   │      status = pending
   │
   └── Enqueue BullMQ Job
              │
              ▼
      BullMQ Queue (Redis)
              │
              ▼
         Worker Process
              │
              ├── Fetch MongoDB record
              ├── Download image from Cloudinary
              ├── Save to OS temp directory
              ├── Promise.all()
              │     ├── Metadata
              │     ├── Blur
              │     ├── Brightness
              │     └── OCR
              ├── Plate Validation
              ├── Update MongoDB
              └── Delete temp file

Client
   │
GET /api/v1/media/:processingId
   │
   ▼
Status + Analysis Results
```

The API process and the Worker process are **intentionally separated**. The API never blocks on image analysis — it returns a `processingId` immediately (HTTP 202) and the worker handles the heavy lifting independently.

---

## Directory Structure

```
intelligent-media-processing-pipeline/
├── demo/
│   └── app.js                  # Frontend JS for the demo UI (served as static)
├── src/
│   ├── analyzers/
│   │   ├── blurAnalyzer.js
│   │   ├── brightnessAnalyzer.js
│   │   ├── metadataAnalyzer.js
│   │   ├── ocrAnalyzer.js
│   │   ├── pipeline.js         # Orchestrates all analyzers
│   │   └── plateAnalyzer.js
│   ├── config/
│   │   ├── cloudinary.js
│   │   ├── database.js
│   │   ├── env.js              # Centralised env var access
│   │   ├── redis.js
│   │   └── swagger.js
│   ├── modules/
│   │   └── media/
│   │       ├── controllers/
│   │       │   └── media.controller.js
│   │       ├── models/
│   │       │   └── media.model.js
│   │       ├── queues/
│   │       │   └── media.queue.js
│   │       ├── repositories/
│   │       │   └── media.repository.js
│   │       ├── routes/
│   │       │   └── media.routes.js
│   │       └── services/
│   │           └── media.service.js
│   ├── shared/
│   │   ├── constants/
│   │   │   └── status.js       # MEDIA_STATUS enum
│   │   ├── errors/
│   │   │   ├── AppError.js
│   │   │   └── errorHandler.js
│   │   ├── logger/
│   │   │   └── logger.js       # Winston logger
│   │   └── middleware/
│   │       └── upload.js       # Multer configuration
│   ├── storage/
│   │   └── uploads/            # Temporary upload directory (git-ignored)
│   ├── app.js                  # Express app setup
│   ├── server.js               # API process entry point
│   └── worker.js               # BullMQ worker entry point
├── index.html                  # Demo UI entry point (served at /)
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Processing Flow

1. Client uploads an image via `POST /api/v1/media/upload`
2. Multer saves the file temporarily to `src/storage/uploads/`
3. The file is uploaded to Cloudinary; the local temp file is deleted
4. A MongoDB document is created with `status: pending`
5. A BullMQ job (`process-image`) is pushed onto the `media-processing` Redis queue
6. The API responds with `processingId` and `status: pending` (HTTP 202)
7. The worker picks up the job:
   - Sets `status: processing` and records `processingStartedAt`
   - Downloads the image from Cloudinary to the OS temp directory
   - Runs `metadata`, `blur`, `brightness`, and `OCR` analyzers concurrently via `Promise.all`
   - Runs `plateValidation` on the OCR text output
   - Saves all results to MongoDB, sets `status: completed`
   - Deletes the temp file
8. On any error, `status: failed` is saved with `failure.reason` and `failure.stack`
9. Client polls `GET /api/v1/media/:processingId` until `completed` or `failed`

### Queue Strategy

BullMQ over Redis was chosen because:

- It provides durable job persistence (jobs survive worker restarts)
- Built-in retry logic, job state tracking, and concurrency control
- Simple Node.js integration with no additional broker infrastructure
- Redis Cloud is free-tier available for development and staging

Jobs carry only `{ processingId }` — the worker re-fetches the full record from MongoDB. This keeps the queue payload minimal and avoids stale data issues.

---

## Analysis Modules

All five modules run on the image downloaded by the worker to the OS temp directory. Four run concurrently; plate validation runs after OCR since it depends on the extracted text.

### 1. Metadata Extraction (`metadataAnalyzer.js`)

Uses **Sharp** to read image headers without decoding pixel data.

Returns: `format`, `width`, `height`, `channels`, `density`, `hasAlpha`, `colorSpace`, `orientation`

### 2. Blur Detection (`blurAnalyzer.js`)

Converts the image to greyscale, reads raw pixel values, and computes the mean absolute difference between adjacent pixels. This is a lightweight proxy for Laplacian variance — high pixel-to-pixel variation indicates sharpness; low variation indicates blur.

- Score < 20 → `isBlurry: true`
- Score ≥ 20 → `isBlurry: false`

Returns: `{ score, isBlurry }`

### 3. Brightness Analysis (`brightnessAnalyzer.js`)

Converts the image to greyscale and computes the mean pixel value across all pixels (0–255 scale).

- < 70 → `too_dark`
- 70–200 → `good`
- > 200 → `too_bright`

Returns: `{ average, quality }`

### 4. OCR Extraction (`ocrAnalyzer.js`)

Uses **Tesseract.js** with the English language model to extract all visible text from the image. Progress logging is suppressed to keep worker output clean.

Returns: `{ text, confidence }`

### 5. Indian Vehicle Plate Validation (`plateAnalyzer.js`)

Strips all non-alphanumeric characters from the OCR text, then applies a regex matching the standard Indian registration number format:

```
<STATE_CODE><1-2 digits><1-3 letters><4 digits>
```

Example valid plates: `MH12AB1234`, `KA19MC0001`, `DL01AA9999`

All 36 Indian state/UT codes are included in the regex.

Returns: `{ detectedPlate, isValid }`

---

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Runtime          | Node.js (CommonJS)                           |
| Web framework    | Express 5                                    |
| Database         | MongoDB Atlas + Mongoose                     |
| Queue            | BullMQ                                       |
| Queue broker     | Redis (ioredis)                              |
| Image processing | Sharp                                        |
| OCR              | Tesseract.js                                 |
| Cloud storage    | Cloudinary                                   |
| Logging          | Winston (console + file)                     |
| HTTP security    | Helmet, CORS, Compression                    |
| Upload handling  | Multer (disk storage)                        |
| ID generation    | nanoid                                       |
| API docs         | Swagger (swagger-jsdoc + swagger-ui-express) |
| Dev tooling      | nodemon, eslint, prettier                    |

---

## API Reference

### Upload Image

```
POST /api/v1/media/upload
Content-Type: multipart/form-data
Field: image (file, required, image/* only, max 10 MB)
```

**Response — HTTP 202**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "processingId": "media_aB3dEfGhIj",
    "status": "pending"
  }
}
```

**Error — HTTP 400 (no file)**

```json
{
  "success": false,
  "message": "No image file uploaded"
}
```

---

### Get Processing Status and Results

```
GET /api/v1/media/:processingId
```

**Response — HTTP 200 (completed)**

```json
{
  "success": true,
  "data": {
    "processingId": "media_aB3dEfGhIj",
    "status": "completed",
    "analysis": {
      "metadata": {
        "format": "jpeg",
        "width": 720,
        "height": 1280,
        "channels": 3,
        "density": 72,
        "hasAlpha": false,
        "colorSpace": "srgb",
        "orientation": null
      },
      "blur": {
        "score": 9.04,
        "isBlurry": true
      },
      "brightness": {
        "average": 117.89,
        "quality": "good"
      },
      "ocr": {
        "text": "MH12AB1234",
        "confidence": 87.5
      },
      "plateValidation": {
        "detectedPlate": "MH12AB1234",
        "isValid": true
      }
    },
    "failure": null,
    "timestamps": {
      "uploadedAt": "2025-01-01T10:00:00.000Z",
      "processingStartedAt": "2025-01-01T10:00:01.200Z",
      "completedAt": "2025-01-01T10:00:07.400Z"
    }
  }
}
```

**Response — HTTP 200 (failed)**

```json
{
  "success": true,
  "data": {
    "processingId": "media_aB3dEfGhIj",
    "status": "failed",
    "analysis": null,
    "failure": {
      "reason": "connect ECONNREFUSED",
      "stack": "..."
    },
    "timestamps": { "..." : "..." }
  }
}
```

**Error — HTTP 404**

```json
{
  "success": false,
  "message": "Media not found"
}
```

---

### Health Check

```
GET /health
```

```json
{ "success": true, "message": "Server is healthy" }
```

---

### API Docs (Swagger UI)

```
GET /api-docs
```

---

## Data Model

MongoDB collection: `media`

```
{
  processingId:  String (unique)        — nanoid-generated, e.g. "media_aB3dEfGhIj"
  status:        "pending" | "processing" | "completed" | "failed"

  file: {
    originalName:         String
    cloudinaryPublicId:   String
    url:                  String        — Cloudinary secure URL
    mimeType:             String
    size:                 Number        — bytes
    hash:                 String|null   — reserved for duplicate detection
  }

  analysis: {
    blur:             Mixed|null
    brightness:       Mixed|null
    ocr:              Mixed|null
    plateValidation:  Mixed|null
    metadata:         Mixed|null
  }

  failure: {
    reason:  String
    stack:   String
  }

  timestamps: {
    uploadedAt:           Date
    processingStartedAt:  Date|null
    completedAt:          Date|null
  }
}
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- MongoDB Atlas connection string (or local MongoDB)
- Redis instance (local, Redis Cloud, or Upstash)
- Cloudinary account (free tier works)

### Steps

```bash
# 1. Clone
git clone <repository-url>
cd intelligent-media-processing-pipeline

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in MONGODB_URI, REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD,
# CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# 4. Start the API server (port 5000)
npm run dev

# 5. Start the worker (separate terminal)
npm run worker
```

Both processes must be running simultaneously. The API enqueues jobs; the worker consumes them.

### Available Scripts

| Command | Description |
| -------------- | -------------------------------------------- |
| `npm run dev` | Start the API server with hot-reload (nodemon) |
| `npm run worker` | Start the BullMQ worker process |
| `npm start` | Start the API server (production, no reload) |
| `npm run lint` | Run ESLint across the codebase |

### Seed Scripts

No seed scripts are included. The system is data-driven by uploads — submit an image via `POST /api/v1/media/upload` or use the demo UI at `/` to populate data.

### Test Scripts

No automated test suite is included yet. Testing the pipeline manually:

1. Upload an image via the demo UI or with curl:
   ```bash
   curl -X POST http://localhost:5000/api/v1/media/upload \
     -F "image=@/path/to/image.jpg"
   ```
2. Copy the returned `processingId` and poll for results:
   ```bash
   curl http://localhost:5000/api/v1/media/<processingId>
   ```
3. Check the health endpoint: `curl http://localhost:5000/health`

Adding a proper test suite (Jest + Supertest for API routes, unit tests per analyzer) is listed under Future Improvements.

---

## Docker

A `Dockerfile` and `docker-compose.yml` are included. The compose file defines four services:

| Service         | Description                                      |
| --------------- | ------------------------------------------------ |
| `media-service` | Express API server (port 5000)                   |
| `media-worker`  | BullMQ worker process                            |
| `mongo`         | MongoDB 7 with a persistent named volume         |
| `redis`         | Redis 7 Alpine with a persistent named volume    |

```bash
docker compose up --build
```

Both `media-service` and `media-worker` depend on `mongo` and `redis`, so all four services start in the correct order. The uploads directory is mounted as a volume on both app containers so temporary files are shared.

> For production deployments using managed services (MongoDB Atlas, Redis Cloud), remove the `mongo` and `redis` services from the compose file and point the env vars at your hosted instances instead.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=5000

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/media-processing

REDIS_HOST=<redis-host>
REDIS_PORT=6379
REDIS_USERNAME=<redis-username>
REDIS_PASSWORD=<redis-password>

CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

NODE_ENV=development
```

---

## Demo UI

A lightweight browser-based demo is available at:

**Live Demo:** 
https://intelligent-media-processing-api.onrender.com/

The demo communicates directly with the deployed backend API and allows users to:

- Upload an image
- Track processing status
- View metadata extraction
- View blur analysis
- View brightness analysis
- View OCR results
- View Indian vehicle plate validation

## AI Usage Disclosure

AI tools were used throughout this project. Here is an honest account of where and how:

### Where AI helped

- **Scaffolding boilerplate** — Initial Express app structure, Mongoose schema, BullMQ worker setup, and Multer middleware configuration were drafted with AI assistance and then reviewed and adjusted.
- **Analyzer logic** — The blur detection algorithm (mean absolute pixel difference as a Laplacian proxy), brightness thresholding, and plate regex were suggested by AI. All were validated against sample images and edge cases before use.
- **Demo UI** — The full HTML/CSS/JS demo frontend was generated with AI and then debugged manually (see below).
- **Swagger annotations** — JSDoc comment formatting for swagger-jsdoc was accelerated with AI help.

### Where AI output was wrong or needed correction

- **Frontend CSP bug** — AI initially placed the `<script>` block inline in `index.html`. Helmet's default CSP (`script-src 'self'`) blocks inline scripts, so the entire UI was silently broken. This was diagnosed by inspecting response headers, and fixed by extracting the script to an external `demo/app.js` file.
- **Click-event bubbling** — The file `<input>` was originally placed inside the dropzone `<div>`. Clicking the dropzone triggered `fileInput.click()`, which caused a bubbling loop that browsers block as a security measure. This was caught by testing the UI manually and fixed by moving the input outside the dropzone.
- **API response envelope** — AI-generated frontend code read `data.processingId` directly but the actual API wraps it as `data.data.processingId`. Similarly, analysis results are nested under `data.analysis`, not at the top level of `data`. Both were caught by reading the controller source and corrected.
- **Wrong API path** — Initial frontend used `/api/media/upload` instead of the versioned `/api/v1/media/upload`. Fixed by cross-referencing the route file.

### How AI output was validated

- All analyzer logic was tested against real images before considering it correct.
- API endpoints were tested with curl and the demo UI.
- Response shapes were verified by reading controller source, not trusting AI's assumption.
- Headers and CSP were verified by fetching the served page with Node.js `http` and inspecting the headers directly.

---

## Trade-offs and Design Decisions

### Intentional simplifications

- **No authentication** — The API is open. A production system would add JWT or API key auth at the route level.
- **OCR on full image** — Tesseract runs on the entire image rather than a pre-cropped plate region. A dedicated ANPR step (e.g., object detection to locate the plate first) would significantly improve plate extraction accuracy, but adds substantial complexity.
- **Blur heuristic is approximate** — Mean absolute pixel difference is a fast approximation of sharpness. True Laplacian variance on a full greyscale image would be more accurate but requires additional computation. The current approach is fast and good enough for flagging obviously blurry images.
- **No retry configuration** — BullMQ supports automatic job retries with backoff. This is not configured; failed jobs stay in the `failed` state. A production setup would add `attempts: 3` and exponential backoff.
- **No duplicate detection** — The `file.hash` field is reserved in the schema for MD5/SHA-based duplicate detection but is not populated. This is the most obvious missing analysis module.
- **Single worker instance** — The worker runs as a single process. BullMQ supports horizontal scaling by running multiple worker processes pointing at the same queue, which would be the first scaling step.

### Scalability concerns

- The API and worker are separate processes, so they can be scaled and deployed independently (e.g., API on Render, worker on Railway).
- Cloudinary is the storage bottleneck at high upload volume — images could alternatively be stored in S3 with presigned URLs to offload bandwidth.
- MongoDB Atlas free tier has connection limits; a connection pooling proxy (e.g., PgBouncer equivalent for Mongo) would be needed at scale.
- Tesseract.js is slow (2–5 seconds per image). At high throughput, multiple worker processes or a dedicated OCR microservice would be needed.

### Failure handling

- Worker errors are caught, logged with full stack traces via Winston, and persisted to MongoDB with `status: failed` and `failure.reason`.
- The temp file is always cleaned up in a `finally` block, even on failure.
- Redis connection errors are logged but do not crash the process.
- Cloudinary upload errors clean up the local temp file before re-throwing.

---

## Future Improvements

- **Plate region detection before OCR** — Use an object detection model to crop the plate region, then run Tesseract on the crop for much higher accuracy
- **Duplicate image detection** — Hash-based (MD5/perceptual hash) deduplication using the reserved `file.hash` field
- **Screenshot / photo-of-photo detection** — Heuristics based on screen aspect ratios, UI element patterns, or frequency domain analysis
- **EXIF data extraction** — GPS coordinates, camera model, capture time for tamper detection
- **Retry configuration** — BullMQ `attempts` + exponential backoff for transient failures
- **Rate limiting** — Per-IP upload throttling via `express-rate-limit`
- **Automated tests** — Unit tests for each analyzer module; integration tests for the upload → poll flow
- **Observability** — Structured log correlation by `processingId` across API and worker; metrics export to Datadog or similar
- **Batch upload** — Accept multiple images in a single request and return an array of `processingId`s

---

## Author

**Kaushik**  
Computer Science Engineering Student
