const analyzeMetadata = require("./metadataAnalyzer");
const analyzeBlur = require("./blurAnalyzer");
const analyzeBrightness = require("./brightnessAnalyzer");

const runPipeline = async (imagePath) => {
  const [metadata, blur, brightness] = await Promise.all([
    analyzeMetadata(imagePath),
    analyzeBlur(imagePath),
    analyzeBrightness(imagePath),
  ]);

  return {
    metadata,
    blur,
    brightness,
  };
};

module.exports = runPipeline;