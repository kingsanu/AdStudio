/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const kioskController = require("../controllers/kioskController.js");

// Get or create user's single kiosk
router.get("/user-kiosk", kioskController.getUserKiosk);

// Update user's kiosk
router.put("/user-kiosk", kioskController.updateUserKiosk);

// Create a new kiosk
router.post("/kiosks", kioskController.createKiosk);

// Get all kiosks with filtering and pagination
router.get("/kiosks", kioskController.getAllKiosks);

// Get a specific kiosk by ID
router.get("/kiosks/:id", kioskController.getKioskById);

// Delete a kiosk
router.delete("/kiosks/:id", kioskController.deleteKiosk);

// Upload a kiosk page image
router.post("/upload-kiosk-image", kioskController.uploadKioskImage);

// Upload a kiosk template JSON
router.post("/upload-kiosk-template", kioskController.uploadKioskTemplate);

module.exports = router;
