/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const videoProcessingController = require("../controllers/videoProcessingController.js");
const multer = require("multer");

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "temp/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Route to create a slideshow video from images (FFmpeg-based)
router.post(
  "/video-processing/create-slideshow-video",
  upload.any(), // Accept any field names for images
  videoProcessingController.createSlideshow
);

// Route to create a slideshow using Remotion (React-based solution)
router.post(
  "/video-processing/create-remotion-slideshow",
  upload.any(),
  videoProcessingController.createRemotionSlideshow
);

module.exports = router;
