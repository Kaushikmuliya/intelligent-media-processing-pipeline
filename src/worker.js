const { Worker } = require("bullmq");

const redis = require("./config/redis");

const logger = require("./shared/logger/logger");

const worker = new Worker(
  "media-processing",
  async (job) => {
    logger.info(`Processing ${job.data.processingId}`);

    // Temporary delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    logger.info(`Finished ${job.data.processingId}`);
  },
  {
    connection: redis,
  }
);

worker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  logger.error(err.message);
});