const sharp = require("sharp");

const analyzeBlur = async (imagePath) => {
  const { data, info } = await sharp(imagePath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let differenceSum = 0;

  for (let i = 1; i < data.length; i++) {
    differenceSum += Math.abs(data[i] - data[i - 1]);
  }

  const score = Number((differenceSum / data.length).toFixed(2));

  return {
    score,
    isBlurry: score < 20,
  };
};

module.exports = analyzeBlur;