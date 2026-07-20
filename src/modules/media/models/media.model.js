const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    processingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    file: {
      originalName: {
        type: String,
        required: true,
      },

      storedName: {
        type: String,
        required: true,
      },

      path: {
        type: String,
        required: true,
      },

      mimeType: {
        type: String,
        required: true,
      },

      size: {
        type: Number,
        required: true,
      },

      hash: {
        type: String,
        default: null,
      },
    },

    analysis: {
      blur: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      brightness: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      ocr: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      plateValidation: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },

    failure: {
      reason: String,
      stack: String,
    },

    timestamps: {
      uploadedAt: {
        type: Date,
        default: Date.now,
      },

      processingStartedAt: Date,

      completedAt: Date,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Media", mediaSchema);