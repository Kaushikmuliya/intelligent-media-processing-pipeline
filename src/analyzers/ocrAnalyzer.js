const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const os = require("os");
const path = require("path");
const fs = require("fs/promises");

/**
 * OCR analysis using Tesseract.js with Sharp preprocessing.
 *
 * Preprocessing steps applied before OCR:
 *   1. Resize  — upscale small images to at least 1000px wide so Tesseract
 *                has enough pixel density to resolve characters. Tesseract
 *                struggles below ~200 DPI equivalent.
 *   2. Greyscale — colour information is irrelevant for text extraction and
 *                  adds noise.
 *   3. Sharpen — mild unsharp mask to crisp up character edges blurred by
 *                compression or camera shake.
 *   4. Normalise — stretches the histogram so the darkest pixel becomes 0
 *                  and the brightest becomes 255, maximising contrast.
 *   5. Threshold — converts to pure black/white. This is the single biggest
 *                  improvement for plate/text OCR: Tesseract is trained on
 *                  binary images and performs significantly better on them
 *                  than on greyscale.
 *
 * Tesseract config:
 *   PSM 6  — "Assume a single uniform block of text." Better than the default
 *             PSM 3 (full-page auto) for structured text like plates or labels.
 *   OEM 1  — LSTM-only engine (most accurate, slower than legacy).
 *
 * Returns:
 *   text          — cleaned extracted text (excess whitespace collapsed)
 *   rawText       — original Tesseract output (trimmed) for debugging
 *   confidence    — document-level mean confidence (0–100)
 *   hasText       — true if any non-whitespace characters were extracted
 *   wordCount     — number of words Tesseract identified
 *   words         — array of { text, confidence } for each recognised word,
 *                   sorted by confidence descending, filtered to conf > 0
 */

const MIN_WIDTH_FOR_OCR = 1000; // pixels — upscale smaller images

const preprocessImage = async (imagePath) => {
  const metadata = await sharp(imagePath).metadata();
  const needsUpscale = (metadata.width ?? 0) < MIN_WIDTH_FOR_OCR;

  let pipeline = sharp(imagePath);

  if (needsUpscale) {
    pipeline = pipeline.resize({ width: MIN_WIDTH_FOR_OCR, withoutEnlargement: false });
  }

  const preprocessed = await pipeline
    .greyscale()
    .sharpen({ sigma: 1.5 })
    .normalise()
    .threshold(128)        // binarise — black text on white background
    .png()                 // lossless format for OCR
    .toBuffer();

  // Write to a temp file — Tesseract.js accepts file paths or buffers,
  // but file paths avoid an extra base64 round-trip in some versions.
  const tempPath = path.join(os.tmpdir(), `ocr_pre_${Date.now()}.png`);
  await fs.writeFile(tempPath, preprocessed);
  return tempPath;
};

const cleanText = (raw) =>
  raw
    .replace(/\r\n/g, "\n")          // normalise line endings
    .replace(/[^\S\n]+/g, " ")       // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")      // collapse excessive blank lines
    .trim();

const analyzeOCR = async (imagePath) => {
  let preprocessedPath = null;

  try {
    preprocessedPath = await preprocessImage(imagePath);

    const result = await Tesseract.recognize(preprocessedPath, "eng", {
      logger: () => {},   // suppress progress logs
      tessedit_pageseg_mode: "6",   // single uniform block of text
      tessedit_ocr_engine_mode: "1", // LSTM only
    });

    const { data } = result;
    const rawText = (data.text ?? "").trim();
    const text = cleanText(rawText);

    // Per-word results — filter out empty words and zero-confidence entries
    const words = (data.words ?? [])
      .filter((w) => w.text.trim().length > 0 && w.confidence > 0)
      .map((w) => ({
        text: w.text.trim(),
        confidence: Number(w.confidence.toFixed(2)),
      }))
      .sort((a, b) => b.confidence - a.confidence);

    const confidence = Number(
      (data.confidence != null ? data.confidence : 0).toFixed(2)
    );

    return {
      text,
      rawText,
      confidence,
      hasText: text.length > 0,
      wordCount: words.length,
      words,
    };
  } finally {
    // Always clean up the preprocessed temp file
    if (preprocessedPath) {
      await fs.unlink(preprocessedPath).catch(() => {});
    }
  }
};

module.exports = analyzeOCR;
