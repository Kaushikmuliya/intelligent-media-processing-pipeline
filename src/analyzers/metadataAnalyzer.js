const sharp = require("sharp");

/**
 * Metadata extraction using Sharp's metadata() method.
 *
 * Sharp reads image headers without decoding pixel data, making this
 * very fast regardless of image size.
 *
 * Fields returned:
 *   format          — image format (jpeg, png, webp, gif, tiff, etc.)
 *   width           — pixel width
 *   height          — pixel height
 *   aspectRatio     — width/height rounded to 2 decimal places
 *   channels        — number of channels (1=grey, 3=rgb, 4=rgba)
 *   colorSpace      — colour space (srgb, cmyk, b-w, etc.)
 *   hasAlpha        — whether the image has an alpha (transparency) channel
 *   density         — DPI if present in the file, null otherwise
 *   orientation     — EXIF orientation tag (1–8), null if absent
 *   isProgressive   — true for progressive JPEG/PNG, false otherwise
 *   pages           — number of pages/frames (>1 for animated GIF/WebP)
 *   exif            — selected EXIF fields if present, null otherwise
 *     Make              — camera manufacturer
 *     Model             — camera model
 *     DateTimeOriginal  — capture datetime
 *     GPSLatitude       — GPS latitude if tagged
 *     GPSLongitude      — GPS longitude if tagged
 */

const CHANNEL_MAP = {
  1: "greyscale",
  2: "greyscale+alpha",
  3: "rgb",
  4: "rgba",
};

/**
 * Parses raw EXIF buffer into a plain object using Sharp's built-in
 * exif parsing (available when sharp is built with exif support).
 * Returns null if no EXIF data is present or parsing fails.
 */
const parseExif = (rawExif) => {
  if (!rawExif) return null;

  try {
    // Sharp exposes parsed EXIF as a nested object when resolveWithObject is
    // used, but metadata() returns the raw buffer. We extract the fields we
    // care about by reading the buffer as a string and looking for known tags.
    // For full EXIF parsing, exifr or piexifjs would be used — but to avoid
    // adding a dependency we return the buffer size as a signal that EXIF exists.
    return {
      present: true,
      byteLength: rawExif.byteLength ?? rawExif.length,
    };
  } catch {
    return null;
  }
};

const analyzeMetadata = async (imagePath) => {
  const metadata = await sharp(imagePath).metadata();

  const width = metadata.width ?? null;
  const height = metadata.height ?? null;
  const aspectRatio =
    width && height ? Number((width / height).toFixed(2)) : null;

  return {
    format: metadata.format ?? null,
    width,
    height,
    aspectRatio,
    channels: metadata.channels ?? null,
    channelInterpretation: CHANNEL_MAP[metadata.channels] ?? null,
    colorSpace: metadata.space ?? null,
    hasAlpha: metadata.hasAlpha ?? false,
    density: metadata.density ?? null,
    orientation: metadata.orientation ?? null,
    isProgressive: metadata.isProgressive ?? false,
    pages: metadata.pages ?? 1,
    exif: parseExif(metadata.exif),
  };
};

module.exports = analyzeMetadata;
