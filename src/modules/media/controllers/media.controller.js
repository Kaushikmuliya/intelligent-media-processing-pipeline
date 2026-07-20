const mediaService = require("../services/media.service");

class MediaController {
  async uploadMedia(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

      const result = await mediaService.uploadMedia(req.file);

      return res.status(202).json({
        success: true,
        message: "Image uploaded successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
