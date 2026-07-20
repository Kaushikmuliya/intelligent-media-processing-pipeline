const analyzeMetadata = require("./metadataAnalyzer");
// const analyzeBlur = require("./blurAnalyzer");
// const analyzeBrightness = require("./brightnessAnalyzer");
// const analyzeOCR = require("./ocrAnalyzer");
// const analyzePlate = require("./plateAnalyzer");

const runPipeline = async (imagePath) => {
  const metadata = await analyzeMetadata(imagePath);

  return {
    metadata,
    // blur,
    // brightness,
    // ocr,
    // plateValidation,
  };
};

module.exports = runPipeline;