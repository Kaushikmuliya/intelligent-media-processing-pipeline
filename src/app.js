const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorHandler = require("./shared/errors/errorHandler");

const mediaRoutes = require("./modules/media/routes/media.routes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const path = require("path");

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
  }),
);

app.use("/api/v1/media", mediaRoutes);

// Serve demo UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});
app.use("/demo", express.static(path.join(__dirname, "../demo")));

app.use(errorHandler);

module.exports = app;