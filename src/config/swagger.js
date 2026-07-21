const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Intelligent Media Processing Pipeline API",
      version: "1.0.0",
      description:
        "REST API documentation for the Intelligent Media Processing Pipeline.",
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development",
      },
      {
        url: "https://intelligent-media-processing-api.onrender.com",
        description: "Production",
      },
    ],
    tags: [
      {
        name: "Media",
        description: "Media upload and processing endpoints",
      },
      {
        name: "Health",
        description: "Application health check",
      },
    ],
  },

  apis: ["./src/**/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
