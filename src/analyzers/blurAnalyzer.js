const sharp = require("sharp");

/**
 * Blur detection using Laplacian variance.
 *
 * The Laplacian is a second-order derivative operator that responds strongly
 * to edges and fine detail. Sharp images have high variance in their Laplacian
 * response; blurry images suppress high frequencies and produce low variance.
 *
 * We approximate the Laplacian via a 3x3 discrete kernel applied manually:
 *
 *   [ 0  1  0 ]
 *   [ 1 -4  1 ]
 *   [ 0  1  0 ]
 *
 * Variance of the resulting values is the blur score.
 * Threshold of 100 is calibrated for typical photographs at web resolutions.
 */

const LAPLACIAN_THRESHOLD = 100;

const analyzeBlur = async (imagePath) => {
  const { data, info } = await sharp(imagePath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const laplacianValues = [];

  // Apply Laplacian kernel — skip the 1-pixel border to avoid out-of-bounds
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const laplacian =
        -4 * data[idx] +
        data[idx - 1] +        // left
        data[idx + 1] +        // right
        data[idx - width] +    // above
        data[idx + width];     // below

      laplacianValues.push(laplacian);
    }
  }

  // Compute variance of the Laplacian values
  const n = laplacianValues.length;
  const mean = laplacianValues.reduce((sum, v) => sum + v, 0) / n;
  const variance =
    laplacianValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;

  const score = Number(variance.toFixed(2));

  return {
    score,
    isBlurry: score < LAPLACIAN_THRESHOLD,
  };
};

module.exports = analyzeBlur;
