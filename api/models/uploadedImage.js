const { Schema, default: mongoose } = require("mongoose");

const uploadedImageSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UploadedImage = mongoose.model("UploadedImage", uploadedImageSchema);

module.exports = UploadedImage;
