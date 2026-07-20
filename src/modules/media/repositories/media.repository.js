const Media = require("../models/media.model");

class MediaRepository {
  async create(mediaData) {
    return await Media.create(mediaData);
  }

  async findByProcessingId(processingId) {
    return await Media.findOne({ processingId });
  }

  async updateByProcessingId(processingId, updateData) {
    return await Media.findOneAndUpdate({ processingId }, updateData, {
      new: true,
      runValidators: true,
    });
  }
}

module.exports = new MediaRepository();
