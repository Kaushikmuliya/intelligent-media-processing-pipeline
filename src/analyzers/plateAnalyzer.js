const analyzePlate = async (ocrText) => {
  const cleanedText = ocrText
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();

  // Valid Indian state / UT registration prefixes
  const plateRegex =
    /(AP|AR|AS|BR|CG|CH|DD|DL|DN|GA|GJ|HP|HR|JH|JK|KA|KL|LA|LD|MH|ML|MN|MP|MZ|NL|OD|PB|PY|RJ|SK|TN|TR|TS|UK|UP|WB)[0-9]{1,2}[A-Z]{1,3}[0-9]{4}/;

  const match = cleanedText.match(plateRegex);

  return {
    detectedPlate: match ? match[0] : null,
    isValid: !!match,
  };
};

module.exports = analyzePlate;