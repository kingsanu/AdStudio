/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const path = require("path");
const router = express.Router();
const mediaController = require("../controllers/mediaController");

// Route to serve generated media files (videos/images)
router.get("/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "..", "temp", "output", filename);
  
  console.log("Serving media file:", filePath);
  
  // Set appropriate headers based on file extension
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mp4') {
    res.setHeader('Content-Type', 'video/mp4');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving media file:", err);
      res.status(404).json({ error: "Media file not found" });
    }
  });
});

// Route to get backgrounds
router.get("/backgrounds", mediaController.getBackgrounds);

// Route to get illustrations
router.get("/illustrations", mediaController.getIllustrations);

// Route to get icons
router.get("/icons", mediaController.getIcons);

// Route to get 3D images
router.get("/3dimages", mediaController.getThreeDImages);

module.exports = router;
