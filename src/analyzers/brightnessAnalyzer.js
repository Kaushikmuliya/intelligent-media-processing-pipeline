const sharp = require("sharp");

const analyzeBrightness = async (imagePath) => {
  const { data } = await sharp(imagePath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const totalBrightness = data.reduce((sum, pixel) => sum + pixel, 0);

  const average = Number((totalBrightness / data.length).toFixed(2));

  let quality = "good";

  if (average < 70) {
    quality = "too_dark";
  } else if (average > 200) {
    quality = "too_bright";
  }

  return {
    average,
    quality,
  };
};

module.exports = analyzeBrightness;
