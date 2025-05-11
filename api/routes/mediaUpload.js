const express = require("express");
const router = express.Router();
const mediaUploadController = require("../controllers/mediaUploadController");

// Route to upload an image
router.post("/images", mediaUploadController.uploadImage);

// Route to upload a background
router.post("/backgrounds", mediaUploadController.uploadBackground);

// Route to upload an illustration
router.post("/illustrations", mediaUploadController.uploadIllustration);

// Route to upload an icon
router.post("/icons", mediaUploadController.uploadIcon);

// Route to upload a 3D image
router.post("/3dimages", mediaUploadController.uploadThreeDImage);

module.exports = router;
