const { Worker } = require("bullmq");

const connectDatabase = require("./config/database");
const redis = require("./config/redis");
const logger = require("./shared/logger/logger");

const runPipeline = require("./analyzers/pipeline");

const mediaRepository = require("./modules/media/repositories/media.repository");
const { MEDIA_STATUS } = require("./shared/constants/status");

const startWorker = async () => {
  await connectDatabase();

  const worker = new Worker(
    "media-processing",
    async (job) => {
      const { processingId } = job.data;

      logger.info(`Processing ${processingId}`);

      const media = await mediaRepository.findByProcessingId(processingId);

      if (!media) {
        throw new Error("Media not found");
      }

      const analysis = await runPipeline(media.file.path);

      await mediaRepository.updateByProcessingId(processingId, {
        status: MEDIA_STATUS.COMPLETED,
        analysis,
      });

      logger.info(`Finished ${processingId}`);
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
};

startWorker().catch((error) => {
  logger.error(error.message);
  process.exit(1);
});