const { Worker } = require("bullmq");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

const connectDatabase = require("./config/database");
const redis = require("./config/redis");
const logger = require("./shared/logger/logger");

const runPipeline = require("./analyzers/pipeline");

const mediaRepository = require("./modules/media/repositories/media.repository");
const { MEDIA_STATUS } = require("./shared/constants/status");

const downloadImage = async (url, processingId) => {
  const extension = path.extname(new URL(url).pathname) || ".jpg";
  const tempPath = path.join(os.tmpdir(), `${processingId}${extension}`);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const writer = fs.createWriteStream(tempPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(tempPath));
    writer.on("error", reject);
  });
};

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

      let tempFile = null;

      try {
        await mediaRepository.updateByProcessingId(processingId, {
          status: MEDIA_STATUS.PROCESSING,
          "timestamps.processingStartedAt": new Date(),
        });

        tempFile = await downloadImage(media.file.url, processingId);

        const analysis = await runPipeline(tempFile);

        await mediaRepository.updateByProcessingId(processingId, {
          status: MEDIA_STATUS.COMPLETED,
          analysis,
          "timestamps.completedAt": new Date(),
        });

        logger.info(`Finished ${processingId}`);
      } catch (error) {
        await mediaRepository.updateByProcessingId(processingId, {
          status: MEDIA_STATUS.FAILED,
          failure: {
            reason: error.message,
            stack: error.stack,
          },
          "timestamps.completedAt": new Date(),
        });

        throw error;
      } finally {
        if (tempFile && fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    },
    {
      connection: redis,
    },
  );

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id ?? "unknown"} failed: ${err.message}`);
  });
};

startWorker().catch((error) => {
  logger.error(error.message);
  process.exit(1);
});
