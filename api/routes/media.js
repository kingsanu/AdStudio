/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const mediaController = require("../controllers/mediaController");

// Route to get backgrounds
router.get("/backgrounds", mediaController.getBackgrounds);

// Route to get illustrations
router.get("/illustrations", mediaController.getIllustrations);

// Route to get icons
router.get("/icons", mediaController.getIcons);

// Route to get 3D images
router.get("/3dimages", mediaController.getThreeDImages);

module.exports = router;
