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

  async getProcessingResult(req, res, next) {
    try {
      const { processingId } = req.params;

      const media = await mediaService.getProcessingStatus(processingId);

      return res.status(200).json({
        success: true,
        data: {
          processingId: media.processingId,
          status: media.status,
          analysis: media.analysis,
          failure: media.failure,
          timestamps: media.timestamps,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MediaController();
