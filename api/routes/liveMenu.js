/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const liveMenuController = require("../controllers/liveMenuController.js");

// Get or create user's single live menu
router.get("/user-livemenu", liveMenuController.getUserLiveMenu);

// Update user's live menu
router.put("/user-livemenu", liveMenuController.updateUserLiveMenu);

// Upload a live menu page image
router.post("/upload-livemenu-image", liveMenuController.uploadLiveMenuImage);

// Upload a live menu template JSON
router.post("/upload-livemenu-template", liveMenuController.uploadLiveMenuTemplate);

module.exports = router;
