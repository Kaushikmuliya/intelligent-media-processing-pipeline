const analyzeMetadata = require("./metadataAnalyzer");
const analyzeBlur = require("./blurAnalyzer");

const runPipeline = async (imagePath) => {
  const [metadata, blur] = await Promise.all([
    analyzeMetadata(imagePath),
    analyzeBlur(imagePath),
  ]);

  return {
    metadata,
    blur,
  };
};

module.exports = runPipeline;
