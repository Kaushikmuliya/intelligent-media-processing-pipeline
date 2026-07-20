const Tesseract = require("tesseract.js");

const analyzeOCR = async (imagePath) => {
  const {
    data: { text, confidence },
  } = await Tesseract.recognize(imagePath, "eng");

  return {
    text: text.trim(),
    confidence: Number(confidence.toFixed(2)),
  };
};

module.exports = analyzeOCR;
