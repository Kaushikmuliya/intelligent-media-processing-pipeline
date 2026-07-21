const Tesseract = require("tesseract.js");

const analyzeOCR = async (imagePath) => {
  const {
    data: { text, confidence },
  } = await Tesseract.recognize(imagePath, "eng", {
    logger: () => {}, // Suppress Tesseract progress logs
  });

  return {
    text: text.trim(),
    confidence: Number((confidence || 0).toFixed(2)),
  };
};

module.exports = analyzeOCR;
