const mongoose = require("mongoose");

const env = require("./env");
const logger = require("../shared/logger/logger");

const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);

    logger.info("MongoDB connected");
  } catch (error) {
    logger.error(error.message);

    process.exit(1);
  }
};

module.exports = connectDatabase;
