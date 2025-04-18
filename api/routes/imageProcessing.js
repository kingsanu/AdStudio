const express = require("express");
const router = express.Router();
const imageProcessingController = require("../controllers/imageProcessingController.js");

// Route to remove background from an image
router.post("/remove-background", imageProcessingController.removeBackground);

module.exports = router;
