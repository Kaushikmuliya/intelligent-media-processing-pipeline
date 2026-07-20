const analyzeMetadata = require("./metadataAnalyzer");
const analyzeBlur = require("./blurAnalyzer");
const analyzeBrightness = require("./brightnessAnalyzer");
const analyzeOCR = require("./ocrAnalyzer");


const runPipeline = async (imagePath) => {
  const [metadata, blur, brightness, ocr] = await Promise.all([
    analyzeMetadata(imagePath),
    analyzeBlur(imagePath),
    analyzeBrightness(imagePath),
    analyzeOCR(imagePath),
  ]);

  return {
    metadata,
    blur,
    brightness,
    ocr,
  };
};

module.exports = runPipeline;
