const analyzePlate = async (ocrText) => {
  const cleanedText = ocrText.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  const plateRegex = /[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}/;

  const match = cleanedText.match(plateRegex);

  return {
    detectedPlate: match ? match[0] : null,
    isValid: Boolean(match),
  };
};

module.exports = analyzePlate;
