const analyzeMetadata = require("./metadataAnalyzer");
const analyzeBlur = require("./blurAnalyzer");
const analyzeBrightness = require("./brightnessAnalyzer");
const analyzeOCR = require("./ocrAnalyzer");
const analyzePlate = require("./plateAnalyzer");

const runPipeline = async (imagePath) => {
  const [metadata, blur, brightness, ocr] = await Promise.all([
    analyzeMetadata(imagePath),
    analyzeBlur(imagePath),
    analyzeBrightness(imagePath),
    analyzeOCR(imagePath),
  ]);

  const plateValidation = await analyzePlate(ocr.text);

  return {
    metadata,
    blur,
    brightness,
    ocr,
    plateValidation,
  };
};

module.exports = runPipeline;
