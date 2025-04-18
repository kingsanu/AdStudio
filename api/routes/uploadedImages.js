const express = require("express");
const router = express.Router();
const uploadedImageController = require("../controllers/uploadedImageController.js");

// Route to upload an image and save metadata
router.post("/upload-image", uploadedImageController.uploadImage);

// Route to get user's uploaded images
router.get("/user-images", uploadedImageController.getUserImages);

// Route to delete an image
router.delete("/images/:id", uploadedImageController.deleteImage);

module.exports = router;
