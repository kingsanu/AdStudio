/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const videoProcessingController = require("../controllers/videoProcessingController.js");
const videoshowController = require("../controllers/videoshowController.js");
const alternativeVideoController = require("../controllers/alternativeVideoController.js");
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

// Route to create a slideshow using Videoshow (Recommended - More robust)
router.post(
  "/video-processing/create-videoshow-slideshow",
  upload.any(),
  videoshowController.createSlideshowVideo
);

// Route to create a slideshow using Alternative FFmpeg (Direct control)
router.post(
  "/video-processing/create-alternative-slideshow",
  upload.any(),
  alternativeVideoController.createSlideshowVideo
);

module.exports = router;
