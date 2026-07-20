const express = require("express");

const upload = require("../../../shared/middleware/upload");
const mediaController = require("../controllers/media.controller");

const router = express.Router();

router.post("/upload", upload.single("image"), mediaController.uploadMedia);

router.get("/:processingId", mediaController.getProcessingStatus);

module.exports = router;