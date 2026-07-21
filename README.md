# Intelligent Media Processing Pipeline

An asynchronous, cloud-native media processing system that analyzes uploaded images using background workers. The application extracts image metadata, detects blur, evaluates brightness, performs OCR, validates Indian vehicle registration numbers, and stores results for retrieval through a REST API.

---

## Features

- Upload images via REST API
- Asynchronous processing using BullMQ and Redis
- Cloud-based image storage with Cloudinary
- Background processing using dedicated worker service
- Image metadata extraction
- Blur detection using Laplacian variance
- Brightness analysis
- OCR using Tesseract.js
- Indian vehicle registration number validation
- Processing status tracking
- Analysis result retrieval
- Production-ready deployment architecture

---

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose

### Queue & Background Processing

- BullMQ
- Redis Cloud
- Railway (Worker Deployment)

### Image Processing

- Sharp
- Tesseract.js

### Cloud Storage

- Cloudinary

### Deployment

- Render (API)
- Railway (Worker)
- MongoDB Atlas
- Redis Cloud
- Cloudinary

---

# Project Architecture

```text
                Client
                   │
                   ▼
           Express REST API
             (Render)
                   │
          Upload Image
                   │
                   ▼
             Cloudinary
                   │
     Store URL in MongoDB
                   │
          Create BullMQ Job
                   │
              Redis Cloud
                   │
                   ▼
        Background Worker
            (Railway)
                   │
        Download Image
                   │
      ┌────────────┴────────────┐
      │                         │
 Metadata                 Blur Detection
      │                         │
 Brightness               OCR Extraction
      │                         │
 Plate Validation              │
      └────────────┬────────────┘
                   │
                   ▼
             MongoDB Atlas
                   │
                   ▼
          Analysis Retrieval API
```

---

# Folder Structure

```text
src/
├── config/
├── modules/
│   ├── media/
│   ├── queue/
│   └── processing/
├── shared/
│   ├── services/
│   ├── utils/
│   └── middleware/
├── worker.js
└── app.js
```

---

# Image Processing Pipeline

1. User uploads an image.
2. Image is uploaded to Cloudinary.
3. Image information is stored in MongoDB.
4. Processing job is added to BullMQ.
5. Worker downloads the image from Cloudinary.
6. Worker performs:
   - Metadata Extraction
   - Blur Detection
   - Brightness Analysis
   - OCR
   - Vehicle Registration Validation
7. Results are stored in MongoDB.
8. Client retrieves processing status and analysis results.

---

# API Endpoints

## Upload Image

```
POST /api/media/upload
```

Uploads an image and creates a processing job.

---

## Get Processing Status

```
GET /api/media/status/:processingId
```

Returns:

- Pending
- Processing
- Completed
- Failed

---

## Get Analysis Result

```
GET /api/media/result/:processingId
```

Returns:

- Metadata
- Blur Analysis
- Brightness Analysis
- OCR Output
- Plate Validation

---

# Analysis Modules

## Metadata Extraction

Extracts:

- Width
- Height
- Format
- Color Space
- Channels
- Density

---

## Blur Detection

Uses the Laplacian Variance method.

Returns:

- Blur Score
- Blur Classification

---

## Brightness Analysis

Calculates average image brightness.

Returns:

- Brightness Score
- Quality Classification

---

## OCR

Uses Tesseract.js to extract text from uploaded images.

---

## Vehicle Registration Validation

Validates extracted text against the Indian vehicle registration number format using regular expressions.

Example:

```
MH12AB1234
KA19MC0001
DL01AA9999
```

---

# Environment Variables

```env
PORT=

MONGO_URL=
DB_NAME=

REDIS_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

JWT_SECRET=
```

---

# Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Configure environment variables

```
.env
```

Start the API

```bash
npm run dev
```

Start the worker

```bash
npm run worker
```

---

# Deployment

## Backend

- Render

## Worker

- Railway

## Database

- MongoDB Atlas

## Queue

- Redis Cloud

## Storage

- Cloudinary

---

# Sample Analysis Response

```json
{
  "metadata": {
    "format": "jpeg",
    "width": 720,
    "height": 1280
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
    "confidence": 28
  },
  "plateValidation": {
    "detectedPlate": null,
    "isValid": false
  }
}
```

---

# Known Limitations

- OCR is performed on the complete image rather than a cropped number plate region.
- Images containing dense text may reduce vehicle registration detection accuracy.
- The project focuses on scalable media processing rather than Automatic Number Plate Recognition (ANPR).

---

# Future Improvements

- Number plate detection before OCR
- Face detection module
- Object detection
- Image classification
- EXIF GPS extraction
- Duplicate image detection
- AI-powered image captioning
- Batch image processing
- Web dashboard
- Authentication and user management

---

# Author

**Kaushik Muliya**

Computer Science Engineering Student

---

# License

This project is licensed under the MIT License.
