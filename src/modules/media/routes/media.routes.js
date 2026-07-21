const express = require("express");

const upload = require("../../../shared/middleware/upload");
const mediaController = require("../controllers/media.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Image upload and processing APIs
 */

/**
 * @swagger
 * /api/v1/media/upload:
 *   post:
 *     summary: Upload an image for asynchronous processing
 *     tags: [Media]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       202:
 *         description: Image uploaded successfully and queued for processing.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Image uploaded successfully.
 *               processingId: 686f95dcd4ef2d....
 *       400:
 *         description: Invalid request.
 *       500:
 *         description: Internal server error.
 */
router.post("/upload", upload.single("image"), mediaController.uploadMedia);

/**
 * @swagger
 * /api/v1/media/{processingId}:
 *   get:
 *     summary: Get processing status and analysis result
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: processingId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Processing ID
 *     responses:
 *       200:
 *         description: Processing status retrieved successfully.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 processingId: 686f95dcd4ef2d....
 *                 status: completed
 *                 metadata:
 *                   width: 720
 *                   height: 1280
 *                   format: jpeg
 *                 blur:
 *                   score: 9.04
 *                   isBlurry: true
 *                 brightness:
 *                   average: 117.89
 *                   quality: good
 *                 ocr:
 *                   text: Sample OCR text
 *                   confidence: 28
 *                 plateValidation:
 *                   detectedPlate: null
 *                   isValid: false
 *       404:
 *         description: Processing record not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:processingId", mediaController.getProcessingResult);

module.exports = router;
