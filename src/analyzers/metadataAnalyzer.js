const sharp = require("sharp");

const analyzeMetadata = async (imagePath) => {
  const metadata = await sharp(imagePath).metadata();

  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    density: metadata.density,
    hasAlpha: metadata.hasAlpha,
    colorSpace: metadata.space,
    orientation: metadata.orientation ?? null,
  };
};

module.exports = analyzeMetadata;