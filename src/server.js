const app = require("./app");

const env = require("./config/env");
const logger = require("./shared/logger/logger");

const connectDatabase = require("./config/database");

(async () => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
})();
