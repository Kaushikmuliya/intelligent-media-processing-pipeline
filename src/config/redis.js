const IORedis = require("ioredis");

const env = require("./env");
const logger = require("../shared/logger/logger");

const redis = new IORedis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (error) => {
  logger.error(error.message);
});

module.exports = redis;