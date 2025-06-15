/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require("express");
const router = express.Router();
const whatsappSettingsController = require("../controllers/whatsappSettingsController");

// Get WhatsApp settings for a user
router.get(
  "/whatsapp-settings/:userId",
  whatsappSettingsController.getWhatsAppSettings
);

// Create or update WhatsApp settings
router.post(
  "/whatsapp-settings",
  whatsappSettingsController.saveWhatsAppSettings
);

// Delete WhatsApp settings
router.delete(
  "/whatsapp-settings/:userId",
  whatsappSettingsController.deleteWhatsAppSettings
);

// Start WhatsApp session
router.get("/whatsapp-start/:userId", whatsappSettingsController.startSession);

// Start WhatsApp session with custom session ID
router.post(
  "/whatsapp-start-custom/:userId",
  whatsappSettingsController.startSessionWithCustomId
);

// Check WhatsApp connection status
router.get(
  "/whatsapp-status/:userId",
  whatsappSettingsController.checkConnectionStatus
);

// Restart WhatsApp session
router.get(
  "/whatsapp-restart/:userId",
  whatsappSettingsController.restartSession
);

// Terminate WhatsApp session
router.get(
  "/whatsapp-terminate/:userId",
  whatsappSettingsController.terminateSession
);

// Get WhatsApp QR code data
router.get(
  "/whatsapp-qr-data/:sessionId",
  whatsappSettingsController.getQRData
);

// Get WhatsApp QR code
router.get("/whatsapp-qr/:username", whatsappSettingsController.getQRCode);

module.exports = router;
