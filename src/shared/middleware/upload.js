const multer = require("multer");
const path = require("path");
const { randomUUID } = require("crypto");
const fs = require("fs");
const AppError = require("../errors/AppError");

const uploadPath = path.join(__dirname, "../../storage/uploads");

// Create the uploads directory if it doesn't exist
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  cb(new AppError("Only image files are allowed", 400), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

module.exports = upload;
