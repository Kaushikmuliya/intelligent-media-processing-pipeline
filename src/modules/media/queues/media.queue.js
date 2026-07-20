const { Queue } = require("bullmq");

const redis = require("../../../config/redis");

const mediaQueue = new Queue("media-processing", {
  connection: redis,
});

module.exports = mediaQueue;