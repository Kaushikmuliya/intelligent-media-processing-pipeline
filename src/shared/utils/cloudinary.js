const fs = require("fs");
const fsPromises = require("fs/promises");
const cloudinary = require("../../config/cloudinary");

const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);

    await fsPromises.unlink(filePath);

    return result;
  } catch (error) {
    try {
      if (fs.existsSync(filePath)) {
        await fsPromises.unlink(filePath);
      }
    } catch (_) {}

    throw error;
  }
};

module.exports = {
  uploadImage,
};
