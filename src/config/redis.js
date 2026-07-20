const IORedis = require("ioredis");

const env = require("./env");
const logger = require("../shared/logger/logger");

const redis = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,

  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (error) => {
  logger.error(error.message);
});

module.exports = redis;
