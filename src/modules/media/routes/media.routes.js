const express = require("express");

const upload = require("../../../shared/middleware/upload");
const mediaController = require("../controllers/media.controller");

const router = express.Router();

router.post("/upload", upload.single("image"), mediaController.uploadMedia);

module.exports = router;
