const { nanoid } = require("nanoid");

const mediaRepository = require("../repositories/media.repository");
const { MEDIA_STATUS } = require("../../../shared/constants/status");

const mediaQueue = require("../queues/media.queue");

class MediaService {
  async uploadMedia(file) {
    const processingId = `media_${nanoid(10)}`;

    const mediaData = {
      processingId,

      status: MEDIA_STATUS.PENDING,

      file: {
        originalName: file.originalname,
        storedName: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
        hash: null,
      },

      analysis: {
        blur: null,
        brightness: null,
        ocr: null,
        plateValidation: null,
        metadata: null,
      },
    };

    const media = await mediaRepository.create(mediaData);

    await mediaQueue.add("process-image", {
      processingId: media.processingId,
    });

    return {
      processingId: media.processingId,
      status: media.status,
    };
  }
}

module.exports = new MediaService();
