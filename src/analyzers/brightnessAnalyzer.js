const sharp = require("sharp");

/**
 * Brightness analysis using Sharp's native stats() method.
 *
 * Sharp computes channel statistics (mean, std dev, min, max) in native C++,
 * which is far faster than iterating over a raw pixel buffer in JS.
 *
 * For a greyscale image, stats() returns a single channel whose mean is the
 * perceptually-weighted luminance (ITU-R BT.709: 0.2126R + 0.7152G + 0.0722B).
 * This is more accurate than a simple RGB average because the human eye is
 * most sensitive to green and least sensitive to blue.
 *
 * Standard deviation is included alongside the mean — a low mean could be a
 * genuinely dark image or a high-contrast image with large dark regions. Std dev
 * helps distinguish the two cases.
 *
 * Thresholds (0–255 scale):
 *   mean < 50              → too_dark
 *   mean > 210             → too_bright
 *   50 ≤ mean ≤ 210        → good
 */

const analyzeBrightness = async (imagePath) => {
  const stats = await sharp(imagePath)
    .greyscale()
    .stats();

  // stats().channels[0] is the single greyscale channel
  const { mean, stdev } = stats.channels[0];

  const average = Number(mean.toFixed(2));
  const stdDev = Number(stdev.toFixed(2));

  let quality;

  if (average < 50) {
    quality = "too_dark";
  } else if (average > 210) {
    quality = "too_bright";
  } else {
    quality = "good";
  }

  return {
    average,
    stdDev,
    quality,
  };
};

module.exports = analyzeBrightness;
